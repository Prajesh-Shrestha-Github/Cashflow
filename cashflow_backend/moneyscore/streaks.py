"""Forgiving check-in streaks (ST-01..ST-04). Pure function, no database.

Weeks are 'weeks ago': 0 is the current week, which is still in progress, so an empty week 0 is never a miss.
A missed completed week is forgiven (a "freeze"); a second miss within 3 weeks of the previous one ends the run.
"""
LOOKBACK_WEEKS = 52
FORGIVE_WINDOW = 3  # a miss at most this many weeks after the previous miss ends the run


def compute_streak(active_weeks_ago):
    this_week_done = 0 in active_weeks_ago
    weeks = 1 if this_week_done else 0
    freeze_used = False
    last_miss = None
    pending_miss = False  # a forgiven miss only counts as a freeze once an active week lies beyond it

    for week in range(1, LOOKBACK_WEEKS + 1):
        if week in active_weeks_ago:
            weeks += 1
            if pending_miss:
                freeze_used = True
                pending_miss = False
        else:
            if last_miss is not None and week - last_miss <= FORGIVE_WINDOW:
                break
            last_miss = week
            pending_miss = True

    return {"weeks": weeks, "freeze_used": freeze_used, "this_week_done": this_week_done}
