"""Streak rule (ST-01..ST-04). Weeks are given as 'weeks ago': 0 = the current (in-progress) week.
Worked examples S1..S9 are from the spec table."""
from django.test import SimpleTestCase

from moneyscore.streaks import compute_streak


def streak(*weeks):
    return compute_streak(set(weeks))


class WorkedExampleTests(SimpleTestCase):
    def check(self, active, weeks, freeze, this_week):
        r = compute_streak(set(active))
        self.assertEqual((r["weeks"], r["freeze_used"], r["this_week_done"]), (weeks, freeze, this_week), f"active={sorted(active)}")

    def test_s1_four_active_weeks_in_a_row(self):
        self.check([0, 1, 2, 3], 4, False, True)

    def test_s2_an_empty_current_week_is_in_progress_not_a_miss(self):
        self.check([1, 2, 3], 3, False, False)

    def test_s3_one_missed_week_is_forgiven_and_uses_a_freeze(self):
        self.check([0, 1, 3, 4], 4, True, True)

    def test_s4_two_misses_in_a_row_end_the_streak(self):
        self.check([0, 1, 4], 2, False, True)

    def test_s5_a_second_miss_within_three_weeks_ends_it_but_the_first_was_forgiven(self):
        self.check([0, 1, 3, 5], 3, True, True)

    def test_s6_a_miss_after_a_long_run_is_forgiven_and_the_run_continues(self):
        self.check([0, 1, 2, 3, 4, 6, 7], 7, True, True)

    def test_s7_misses_four_or_more_weeks_apart_are_each_forgiven(self):
        self.check([0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 13], 12, True, True)

    def test_s8_no_activity_is_zero(self):
        self.check([], 0, False, False)

    def test_s9_only_this_week_is_one(self):
        self.check([0], 1, False, True)


class RuleBoundaryTests(SimpleTestCase):
    def test_st02_a_second_miss_exactly_three_weeks_after_the_first_ends_the_run(self):
        # misses at 2 and 5 (3 apart): the run ends at 5, so week 6 does not count
        self.assertEqual(streak(0, 1, 3, 4, 6, 7)["weeks"], 4)

    def test_st02_a_second_miss_four_weeks_after_the_first_is_forgiven(self):
        # misses at 2 and 6 (4 apart): both forgiven, weeks 7 and 8 count
        self.assertEqual(streak(0, 1, 3, 4, 5, 7, 8)["weeks"], 7)

    def test_st03_a_miss_with_no_activity_before_it_is_not_a_freeze(self):
        self.assertFalse(streak(0, 1, 2)["freeze_used"])

    def test_st03_a_freeze_needs_activity_on_the_far_side_of_the_miss(self):
        self.assertTrue(streak(0, 2)["freeze_used"])
        self.assertFalse(streak(0, 1)["freeze_used"])

    def test_the_streak_never_counts_more_weeks_than_were_active(self):
        for active in ([0, 2, 3, 5, 6], [1, 2, 4, 5], [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 13]):
            with self.subTest(active=active):
                self.assertLessEqual(streak(*active)["weeks"], len(active))

    def test_st04_the_lookback_is_52_weeks(self):
        self.assertEqual(streak(*range(0, 120))["weeks"], 53)     # this week + 52 completed weeks

    def test_activity_older_than_the_lookback_is_ignored(self):
        self.assertEqual(streak(0, 1, 2, 80, 81)["weeks"], 3)
