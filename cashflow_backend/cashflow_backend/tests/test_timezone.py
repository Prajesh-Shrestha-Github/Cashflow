"""Bug #5: the app ran on UTC, so in Nepal's evening and night "today" was yesterday.

Nepal is UTC+5:45, so 18:15 UTC is exactly midnight in Kathmandu. Several places also used
`timezone.now().date()`, which is the UTC date EVEN IF TIME_ZONE is changed (now() is always UTC).
Clock is frozen at moments around Nepal midnight.
"""
import pathlib
import re
from datetime import date, datetime, timezone as dt
from unittest.mock import patch

from django.conf import settings
from django.core.management import call_command
from django.test import SimpleTestCase, TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from financial_goals_and_health.models import FinancialGoal
from recommendations.services import AIRecommendationService
from transactions.models import Category, Transaction


def at(y, m, d, hh, mm):
    return datetime(y, m, d, hh, mm, tzinfo=dt.utc)


def frozen(moment):
    return patch("django.utils.timezone.now", return_value=moment)


class NepalTimeTests(SimpleTestCase):
    def test_the_app_runs_on_nepal_time(self):
        self.assertEqual(settings.TIME_ZONE, "Asia/Kathmandu")

    def test_nepal_midnight_is_1815_utc_because_the_offset_is_5_45(self):
        before, after = timezone.localtime(at(2026, 11, 4, 18, 14)), timezone.localtime(at(2026, 11, 4, 18, 15))
        self.assertEqual((before.date(), before.hour, before.minute), (date(2026, 11, 4), 23, 59))
        self.assertEqual((after.date(), after.hour, after.minute), (date(2026, 11, 5), 0, 0))

    def test_localdate_rolls_over_at_nepal_midnight(self):
        with frozen(at(2026, 11, 4, 18, 14)):
            self.assertEqual(timezone.localdate(), date(2026, 11, 4))
        with frozen(at(2026, 11, 4, 18, 15)):
            self.assertEqual(timezone.localdate(), date(2026, 11, 5))

    def test_the_money_score_window_ends_on_the_nepal_date(self):
        from moneyscore import service
        with frozen(at(2026, 11, 4, 20, 30)):      # 02:15 on 5 November in Nepal
            self.assertEqual(service._today(), date(2026, 11, 5))

    def test_no_app_code_uses_now_dot_date_which_is_always_the_utc_date(self):
        root = pathlib.Path(__file__).resolve().parents[2]
        offenders = []
        for path in root.rglob("*.py"):
            parts = path.relative_to(root).parts
            if {"migrations", "tests", ".venv", "venv", "site-packages"} & set(parts) or path.name.startswith("test"):
                continue
            for n, line in enumerate(path.read_text().splitlines(), 1):
                if re.search(r"timezone\.now\(\)\.date\(\)", line):
                    offenders.append(f"{path.relative_to(root)}:{n}")
        self.assertEqual(offenders, [], "use timezone.localdate() instead of timezone.now().date()")


class DatabaseBackedTimeTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("nepal_user", password="x")

    def test_goal_days_remaining_uses_the_nepal_date(self):
        goal = FinancialGoal.objects.create(user=self.user, title="Trip", goal_type="savings", target_amount=1000,
                                            start_date=date(2026, 10, 1), target_date=date(2026, 11, 6))
        with frozen(at(2026, 11, 4, 12, 0)):       # 17:45 on 4 Nov in Nepal
            self.assertEqual(goal.days_remaining, 2)
        with frozen(at(2026, 11, 4, 20, 30)):      # already 5 Nov in Nepal
            self.assertEqual(goal.days_remaining, 1)

    def test_the_daily_ai_request_counter_resets_at_nepal_midnight(self):
        service = AIRecommendationService()
        with frozen(at(2026, 11, 4, 18, 0)):       # 23:45 on 4 Nov in Nepal
            for _ in range(3):
                service.increment_request_counter(self.user)
            self.assertEqual(service.check_rate_limit(self.user), (False, 0))
        with frozen(at(2026, 11, 4, 18, 30)):      # 00:15 on 5 Nov in Nepal: a new day, 3 requests again
            self.assertEqual(service.check_rate_limit(self.user), (True, 3))

    def test_the_dashboard_month_rolls_over_at_nepal_midnight(self):
        salary = Category.objects.get_or_create(name="Salary", type="income")[0]
        Transaction.objects.create(user=self.user, date=date(2026, 12, 1), amount=5000, category=salary)
        client = APIClient()
        client.force_authenticate(self.user)
        with frozen(at(2026, 11, 30, 20, 0)):      # 01:45 on 1 Dec in Nepal: it is December already
            stats = client.get("/api/dashboard/", {"period": "month"}).json()["stats"]
        self.assertEqual(stats["total_income"], 5000)   # in UTC it was still 30 Nov and December was invisible

    def test_recurring_transactions_become_due_on_the_nepal_date(self):
        rent = Category.objects.get_or_create(name="Rent", type="expense")[0]
        tx = Transaction.objects.create(user=self.user, date=date(2026, 10, 4), amount=100, category=rent,
                                        is_recurring=True, frequency="monthly", next_due_date=date(2026, 11, 4))
        with frozen(at(2026, 11, 4, 20, 30)):      # 5 Nov in Nepal: the 4 Nov due date has passed
            call_command("update_recurring_transactions", verbosity=0)
        tx.refresh_from_db()
        self.assertEqual(tx.next_due_date, date(2026, 12, 4))
