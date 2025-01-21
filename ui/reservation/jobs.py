import datetime
import random
import requests
import logging
import pandas as pd
from django.db.models import Q, Max
from django.conf import settings
from django.utils import timezone
from django_apscheduler import util

from shuttle.models import ShuttleLocation
from reservation.models import Transaction, ShuttleReservation, Shuttle
from reservation.simfunctions import rider, shuttle, G, G1, runSimulation

logger = logging.getLogger(__name__)
FROZEN_MINUTES_BEFORE_PICKUP = 30


def calculate_seconds(row):
    return (row.hour * 60 + row.minute) * 60 + row.second


@util.close_old_connections
def update_shuttle_assignment():
    start_time = timezone.localtime() + timezone.timedelta(
        minutes=FROZEN_MINUTES_BEFORE_PICKUP
    )
    end_time = timezone.localtime().replace(
        hour=0, minute=0, second=0, microsecond=0
    ) + timezone.timedelta(days=1)

    frozen_transactions = Transaction.objects.filter(
        pickupDateTime__lte=start_time,
        isAlighted=0,
        isCanceled=0,
        isBoarded=0,
        isMissed=0,
    ).filter(
        Q(shuttleAllocation__shuttle__allocated=0)
        | Q(shuttleAllocation__shuttle__inservice=1)
    )

    logger.info(
        "Fallback to random assignment for riders: "
        f"{[r.id for r in frozen_transactions]}"
    )
    for r in frozen_transactions:
        avail_shuttles = Shuttle.objects.filter(
            serviceArea=r.serviceArea,
            inservice=False,
            allocated=True,
        )
        if not avail_shuttles.exists():
            logger.error(f"No available shuttle for rider {r.id}")
            continue
        r.shuttleAllocation.shuttle = random.choice(list(avail_shuttles))
        r.shuttleAllocation.save()
        logger.info(
            f"Randomly assigned shuttle "
            f"{r.shuttleAllocation.shuttle.shuttle_id_virtual} to"
            f"rider {r.id} as a fallback"
        )

    logger.info(
        "Update shuttle assignments for transactions "
        f"from {start_time} to {end_time}"
    )
    obj = Transaction.objects.filter(
        pickupDateTime__gt=start_time,
        pickupDateTime__lt=end_time,
        isAlighted=0,
        isCanceled=0,
        isBoarded=0,
        isMissed=0,
    )
    last_shuttle_update_time = Shuttle.objects.aggregate(
        Max("last_modified")
    ).get("last_modified__max")
    if (
        last_shuttle_update_time is None
        or not obj.filter(
            shuttleAllocation__lastSimUpdate__lt=last_shuttle_update_time
        ).exists()
    ):
        obj = obj.filter(
            Q(shuttleAllocation__lastSimUpdate__isnull=1)
            | Q(shuttleAllocation__shuttle__allocated=0)
            | Q(shuttleAllocation__shuttle__inservice=1)
        )
    obj = obj.values()

    if len(obj) == 0:
        logger.info("No riders to be simulated")
        return
    shuttle_obj = Shuttle.objects.filter(allocated=1).values(
        "shuttle_id_virtual", "capacity", "depot_id", "starttime", "endtime"
    )
    logger.info(f"Assigning {len(shuttle_obj)} shuttles to {len(obj)} riders")
    logger.info(f"Riders: {[r['id'] for r in obj]}")
    logger.info(f"Shuttles: {[s['shuttle_id_virtual'] for s in shuttle_obj]}")

    # Generate dataframe from database
    df = pd.DataFrame(list(obj))[
        [
            "id",
            "pickupDateTime",
            "pickupLatitude",
            "pickupLongitude",
            "dropoffLatitude",
            "dropoffLongitude",
            "pickupPOI",
            "dropoffPOI",
        ]
    ]
    df.rename(
        columns={
            "id": "ride_id",
            "pickupPOI": "origin_poi",
            "dropoffPOI": "destination_poi",
            "pickupLatitude": "USE_orig_lat",
            "pickupLongitude": "USE_orig_long",
            "dropoffLatitude": "USE_dest_lat",
            "dropoffLongitude": "USE_dest_long",
            "pickupDateTime": "origin_timestamp",
        },
        inplace=True,
    )

    # Change database timezone from utc to local
    df["origin_timestamp"] = df["origin_timestamp"].dt.tz_convert(
        settings.TIME_ZONE
    )

    # Convert time to second to fit input
    df["orig_sec"] = df["origin_timestamp"].dt.time
    df["orig_sec"] = df["orig_sec"].apply(lambda row: calculate_seconds(row))

    riderList = []
    for i in range(len(df["ride_id"])):
        riderList.append(
            rider(
                i,
                df["ride_id"][i],
                df["origin_poi"][i],
                df["destination_poi"][i],
                df["orig_sec"][i],
                True,
                True,
            )
        )
    shuttles = [
        shuttle(
            shuttleID=shuttle1["shuttle_id_virtual"],
            shuttleCapacity=shuttle1["capacity"],
            startLocation=shuttle1["depot_id"],
            startTime=int(shuttle1["starttime"] * 3600),
            endTime=int(shuttle1["endtime"] * 3600),
            G=G,
        )
        for shuttle1 in shuttle_obj
    ]
    if len(shuttles) == 0:
        logger.error("No available shuttles")
        return

    (
        results,
        rejectedResults,
        servedResults,
        occupancies,
        travDists,
        travDistsTrip,
        travDistTime,
    ) = runSimulation(riderList, shuttles, G, G1, 3, 1, 1)

    for index, line in servedResults.iterrows():
        try:
            Transaction.objects.filter(id=line["riderID"]).update(
                waitSimTime=line["waitTime"],
                pickup_Sim=line["pickup_Sim"],
                dropoff_Sim=line["dropoff_Sim"],
            )
            ShuttleReservation.objects.filter(
                transaction_id=line["riderID"]
            ).update(
                shuttle=Shuttle.objects.get(
                    shuttle_id_virtual=line["shuttleID"]
                ),
                lastSimUpdate=timezone.now(),
            )
            logger.info(
                f"Assigned rider {line['riderID']} to "
                f"shuttle {line['shuttleID']}"
            )
        except Exception as e:
            logger.error(
                "Failed to update shuttle assignment "
                f"for transaction {line['riderID']} "
                f"(exception: {e})"
            )


@util.close_old_connections
def update_shuttle_eta():
    today = datetime.date.today()
    now = datetime.datetime.now()
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    fifteen_minutes_ago = now - datetime.timedelta(
        minutes=15
    )  # time to setup 15 minutes
    logger.debug(f"Current time is {now}, and in UTC is {now_utc}")
    logger.debug(f"Fifteen minutes ago is {fifteen_minutes_ago}")
    obj = (
        Transaction.objects.filter(
            pickupDateTime__year=today.year,
            pickupDateTime__month=today.month,
            pickupDateTime__day=today.day,
            pickupDateTime__hour__gte=fifteen_minutes_ago.hour,
            pickupDateTime__minute__gte=fifteen_minutes_ago.minute,
        )
        .filter(isAlighted=0, isCanceled=0, isBoarded=0, isMissed=0)
        .values()
    )
    if len(obj) == 0:
        logger.info("No valid reservation")
        return

    timeleft = 14
    if timeleft < 15:
        shuttle_latest_loc = ShuttleLocation.objects.last()
        # Generate dataframe from database
        df = pd.DataFrame(list(obj))[
            [
                "id",
                "pickupDateTime",
                "pickupLatitude",
                "pickupLongitude",
                "dropoffLatitude",
                "dropoffLongitude",
                "pickupPOI",
                "dropoffPOI",
            ]
        ]
        df.rename(
            columns={
                "id": "ride_id",
                "pickupPOI": "origin_poi",
                "dropoffPOI": "destination_poi",
                "pickupLatitude": "USE_orig_lat",
                "pickupLongitude": "USE_orig_long",
                "dropoffLatitude": "USE_dest_lat",
                "dropoffLongitude": "USE_dest_long",
                "pickupDateTime": "origin_timestamp",
            },
            inplace=True,
        )

        # Change database timezone from utc to local
        df["origin_timestamp"] = df["origin_timestamp"].dt.tz_convert(
            settings.TIME_ZONE
        )

        # Convert time to second to fit input
        df["orig_sec"] = df["origin_timestamp"].dt.time
        df["orig_sec"] = df["orig_sec"].apply(
            lambda row: calculate_seconds(row)
        )

        riderList = []
        for i in range(len(df["ride_id"])):
            riderList.append(
                rider(
                    i,
                    df["ride_id"][i],
                    df["origin_poi"][i],
                    df["destination_poi"][i],
                    df["orig_sec"][i],
                    True,
                    True,
                )
            )

        shuttle_obj = Shuttle.objects.filter(allocated=1).values(
            "shuttle_id_virtual",
            "capacity",
            "depot_id",
            "starttime",
            "endtime",
        )
        shuttles = [
            shuttle(
                shuttleID=shuttle1["shuttle_id_virtual"],
                shuttleCapacity=shuttle1["capacity"],
                startLocation=shuttle1["depot_id"],
                startTime=int(shuttle1["starttime"] * 3600),
                endTime=int(shuttle1["endtime"] * 3600),
                G=G,
            )
            for shuttle1 in shuttle_obj
        ]
        if len(shuttles) == 0:
            logger.error("No available shuttles")
            return

        (
            results,
            rejectedResults,
            servedResults,
            occupancies,
            travDists,
            travDistsTrip,
            travDistTime,
        ) = runSimulation(riderList, shuttles, G, G1, 3, 1, 1)

        timeleft = 16
        if len(servedResults) != 0:
            firstStop = df[df["ride_id"] == servedResults.iloc[0]["riderID"]]
            shuttleCoordinates = (
                f"{shuttle_latest_loc.latitude},{shuttle_latest_loc.longitude}"
            )
            destinationCoordinates = (
                f"{float(firstStop['USE_dest_lat'].iloc[0])},"
                f"{float(firstStop['USE_dest_long'].iloc[0])}"
            )
            startpickup_Sim = servedResults.at[0, "pickup_Sim"]
            logger.debug(f"Start pickup sim is {startpickup_Sim}")
            logger.debug(f"The today returens is {today}")
            current_time = timezone.now()

            # Calculate the starting time of the day (midnight)
            start_of_day = current_time.replace(
                hour=0, minute=0, second=0, microsecond=0
            )

            # Calculate the time difference in seconds
            time_difference_seconds = (
                current_time - start_of_day
            ).total_seconds()

            logger.debug(f"The first stop obj is {servedResults.iloc[0]}")
            logger.debug(
                f"Time difference in milliseconds: {time_difference_seconds}, "
                f"time for pickup sim is {startpickup_Sim}"
            )
            difffromTodayandSim = startpickup_Sim - time_difference_seconds
            startobjtime = 0
            if len(obj) != 0:
                for i in obj:
                    if i["id"] == servedResults.iloc[0]["riderID"]:
                        startobjtime = i["pickupDateTime"].time()
                        total_seconds = (
                            (startobjtime.hour * 3600)
                            + (startobjtime.minute * 60)
                            + startobjtime.second
                        )
                        logger.debug(
                            f"The start obj pickup time is {total_seconds}"
                        )
            difffromTodayandpickT = total_seconds - time_difference_seconds
            logger.debug(f"Diff form now to sim is {difffromTodayandSim}")
            logger.debug(
                f"Diff form now to pickup time is {difffromTodayandpickT}"
            )
            fmts = 15 * 60
            if (-fmts < difffromTodayandSim < fmts) or (
                -fmts < difffromTodayandpickT < fmts
            ):
                logger.info("Querying Google API for ETA...")
                base_url = (
                    "https://maps.googleapis.com/maps/api/distancematrix/json"
                )
                params = {
                    "origins": shuttleCoordinates,
                    "destinations": destinationCoordinates,
                    "mode": "driving",
                    "key": settings.GOOGLE_API_KEY,
                }
                response = requests.get(base_url, params=params)
                data = response.json()
                logger.info("Querying Google API for ETA...done")
                if data["status"] == "OK":
                    logger.info("Saving new ETA to database...")
                    duration_in_seconds = data["rows"][0]["elements"][0][
                        "duration"
                    ]["value"]
                    etas = {
                        line["riderID"]: (
                            duration_in_seconds
                            + line["pickup_Sim"]
                            - startpickup_Sim
                        )
                        for _, line in servedResults.iterrows()
                    }
                    transactions = Transaction.objects.in_bulk(
                        etas.keys(), field_name="id"
                    )
                    if len(etas) != len(transactions):
                        logger.warning(
                            "Inconsistent transactions between"
                            " simulation and database"
                        )
                    for key, val in transactions.items():
                        try:
                            val.etaTime = int(etas[key])
                        except Exception as e:
                            logger.error(
                                f"Failed to get ETA for transaction {key} "
                                f"(exception: {e})"
                            )
                    Transaction.objects.bulk_update(
                        transactions.values(), fields=["estimatedArrivalTime"]
                    )
                    logger.info("Saving new ETA to database...done")
                else:
                    logger.error("Unable to get ETA")
                    return None


@util.close_old_connections
def cleanup_transactions():
    """Cleanup transactions. Currently this job does:

    - Mark all unfinished transactions with pickup late earlier than the
      previous 20:00 as missed.
    - *Remove* all reservations for missed transactions.

    """
    now = timezone.now()
    threshold = now.replace(hour=20, minute=0, second=0, microsecond=0)
    if threshold > now:
        threshold -= datetime.timedelta(days=1)
    logger.info(f"Cleaning transactions with pickup time before {threshold}")
    transactions = Transaction.objects.filter(
        pickupDateTime__lte=threshold,
        isAlighted=0,
        isCanceled=0,
        isMissed=0,
        isBoarded=0,
    )
    num = transactions.update(isMissed=True)
    logger.info(f"Marked {num} outdated transactions as missed")
    reservations = ShuttleReservation.objects.filter(transaction__isMissed=1)
    num, _ = reservations.delete()
    logger.info(f"Removed {num} missed shuttle reservations")


@util.close_old_connections
def deallocate_shuttles():
    """Deallocate all shuttles.

    This is meant to be used for inactivate all shuttles after normal
    operation, in case that a driver forgets to logout.

    """
    logger.info("Deallocating all active shuttles")
    num = Shuttle.objects.filter(allocated=True).update(allocated=False)
    logger.info(f"Deallocated {num} shuttles")
