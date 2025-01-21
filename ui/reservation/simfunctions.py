import pandas as pd
import logging
from reservation.Create_FR_Graph import *
from reservation.Simulation_Environment_Rev9 import *

from . import reservation_config


logger = logging.getLogger(__name__)

busSched = pd.read_csv(reservation_config.bus_sched_path)

G1 = create_FR_graph(busSched)
G = None


def format_int_to_str(num):
    if num < 10:
        return '0'+str(num)
    else:
        return str(num)


def storeSimulationResults(dailyRiders):
    shuttleMatch, pickupTimes, dropoffTimes, riderIDs, uniqueIDs, reqTimes = [], [], [], [], [], []
    orig, dest, mode, FR_dept, FR_arr = [], [], [], [], []
    FR_orig, FR_dest = [], []
    for request in dailyRiders:
        shuttleMatch.append(request.shuttle)
        pickupTimes.append(request.pickupTime)
        dropoffTimes.append(request.dropoffTime)
        riderIDs.append(request.riderID)
        uniqueIDs.append(request.uniqueID)
        reqTimes.append(request.reqTime)
        orig.append(request.orig)
        dest.append(request.dest)
        mode.append(request.mode)
        FR_dept.append(request.FR_deptTime)
        FR_arr.append(request.FR_arrTime)
        FR_orig.append(request.fixedRoute[0])
        FR_dest.append(request.fixedRoute[-1])

    d = {'riderID': riderIDs, 'uniqueID': uniqueIDs, 'mode': mode,
         'origStop': FR_orig, 'FR_dept': FR_dept, 'destStop': FR_dest, 'FR_arr': FR_arr,
         'orig': orig, 'dest': dest, 'reqTime': reqTimes,
         'shuttleID': shuttleMatch, 'pickup_Sim': pickupTimes, 'dropoff_Sim': dropoffTimes}
    df = pd.DataFrame(data=d)
    df.loc[:, 'waitTime'] = df['pickup_Sim'] - df['reqTime']
    df.loc[:, 'driveTime'] = df['dropoff_Sim'] - df['pickup_Sim']
    return df


def getAllCurrentRiders(shuttles):
    for shuttle_ in shuttles:
        if (len(shuttle_.currentRiders) + len(shuttle_.riderQueue)) > 0:
            return True
    return False


def runSimulation(riders, shuttles, G, G1, alpha, beta, ops):
    simulation = Sim(riders, shuttles, G, G1, alpha, beta, ops)
    endtime = max(shuttle.endTime or 0.0 for shuttle in shuttles)

    while (simulation.time <= endtime
           and (len(simulation.remainingRiders) > 0
                or getAllCurrentRiders(simulation.shuttles))):
        simulation.activateVans()
        simulation.deactivateVans()
        simulation.riderAssignment()

        if (simulation.time % 300 == 0):
            simulation.recordOccupancies()

        simulation.getNextTrips()
        simulation.moveShuttles()
        simulation.step()

    dailyRiders, rejectedRiders = simulation.returnRiders()
    occupancies = simulation.returnOccupancies()
    travDists = simulation.returnTravDist()
    travDistsTrip = simulation.returnTravDistTrip()
    travDistTime = simulation.returnTravDistTime()
    storedResults = storeSimulationResults(dailyRiders)
    rejectedResults = storeSimulationResults(rejectedRiders)
    servedResults = storedResults[~storedResults.riderID.isin(rejectedResults.riderID.unique().tolist())]
    servedResults = servedResults.reset_index(drop=True)
    nserved = len(servedResults.riderID.unique())
    nrejected = len(simulation.rejectedRiders)
    try:
        rate = nserved / (nserved + nrejected)
    except ZeroDivisionError:
        rate = 0.0
    logger.info(f"{nserved} riders served, {nrejected} riders not served "
                f"({rate:.1%} served)")
    return storedResults, rejectedResults, servedResults, occupancies, travDists, travDistsTrip, travDistTime
