import logging
import datetime
from zoneinfo import ZoneInfo
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.executors.pool import ProcessPoolExecutor
from django_apscheduler.jobstores import DjangoJobStore
from django.conf import settings
from django.core.management.base import BaseCommand

from reservation.jobs import (
    update_shuttle_assignment,
    update_shuttle_eta,
    cleanup_transactions,
    deallocate_shuttles,
)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Run APScheduler"

    def handle(self, *_args, **_kwargs):
        logger.info("Preparing a blocking scheduler")
        tz = ZoneInfo(settings.TIME_ZONE)
        scheduler = BlockingScheduler(
            timezone=tz,
            executors={
                "default": ProcessPoolExecutor(
                    max_workers=settings.EXECUTOR_MAX_WORKERS
                )
            },
            jobstores={"default": DjangoJobStore()},
        )

        job = scheduler.add_job(
            update_shuttle_assignment,
            "interval",
            minutes=1,
            next_run_time=datetime.datetime.now(tz),
            id="reservation/update-shuttle-assignment",
            replace_existing=True,
            coalesce=True,
            max_instances=1,
        )
        logger.debug(f"Added job: {job}")

        job = scheduler.add_job(
            update_shuttle_eta,
            "interval",
            minutes=5,
            jitter=30,
            next_run_time=datetime.datetime.now(tz),
            id="reservation/update-shuttle-eta",
            replace_existing=True,
            coalesce=True,
            max_instances=1,
        )
        logger.debug(f"Added job: {job}")

        job = scheduler.add_job(
            cleanup_transactions,
            "cron",
            hour=22,
            minute=0,
            timezone=tz,
            jitter=15 * 60,
            id="reservation/cleanup-transactions",
            replace_existing=True,
            coalesce=True,
            max_instances=1,
        )
        logger.debug(f"Added job: {job}")

        job = scheduler.add_job(
            deallocate_shuttles,
            "cron",
            hour=22,
            minute=0,
            timezone=tz,
            jitter=15 * 60,
            id="reservation/deallocate-shuttles",
            replace_existing=True,
            coalesce=True,
            max_instances=1,
        )
        logger.debug(f"Added job: {job}")

        try:
            logger.info("Running scheduler...")
            scheduler.start()
        except KeyboardInterrupt:
            logger.info("Shutting down scheduler...")
            scheduler.shutdown()
