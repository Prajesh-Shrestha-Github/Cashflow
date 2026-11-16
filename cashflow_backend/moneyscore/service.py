"""Reads a user's data and builds the Money Score over a rolling 30-day window.
Spec: cashflow-product/docs/specs/money-score.md

Everything is filtered by `user`: a user can only ever see their own numbers (MS-09).
"""
from dataclasses import replace
from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction as db_transaction
from django.utils import timezone

from financial_goals_and_health.models import FinancialGoal
from transactions.models import Transaction

from .calculations import PeriodFacts, compute
from .streaks import LOOKBACK_WEEKS, compute_streak

NEEDS = {"rent", "utilities", "food", "transport"}  # everything else (or no category) counts as wants
WINDOW_DAYS = 30
WEEK_BUCKETS = 4
RECENT_WINDOWS_FOR_NEEDS = 3
HISTORY_POINTS = 6
HISTORY_STEP_DAYS = 7
PAYDAY_DAYS = 3                       # income dated as_of-2 .. as_of
PAYDAY_MIN_SHARE = Decimal('0.30')    # of the window's income
PAYDAY_SAVE_PERCENT = 20
CENT = Decimal('0.01')


def _today():
    return timezone.localdate()


def window_for(as_of):
    """The 30 days ending on as_of, inclusive."""
    return as_of - timedelta(days=WINDOW_DAYS - 1), as_of


def _totals(user, start, end):
    income = needs = wants = Decimal(0)
    dates = []
    for t in Transaction.objects.filter(user=user, date__gte=start, date__lte=end).select_related("category"):
        dates.append(t.date)
        category = t.category
        if category and category.type == "income":
            income += t.amount
        elif category and category.name.lower() in NEEDS:
            needs += t.amount
        else:
            wants += t.amount
    return income, needs, wants, dates


def _emergency_fund(user):
    goals = FinancialGoal.objects.filter(user=user, goal_type="savings", title__icontains="emergency").exclude(status="abandoned")
    return sum((g.current_amount for g in goals), Decimal(0))


def _facts(user, as_of, emergency_fund):
    start, end = window_for(as_of)
    income, needs, wants, dates = _totals(user, start, end)

    # mean needs over the last three 30-day windows that have needs spending (the first one is the current window)
    recent = [needs] + [_totals(user, *window_for(as_of - timedelta(days=WINDOW_DAYS * i)))[1]
                        for i in range(1, RECENT_WINDOWS_FOR_NEEDS)]
    with_needs = [n for n in recent if n > 0]
    avg_needs = sum(with_needs, Decimal(0)) / len(with_needs) if with_needs else Decimal(0)

    # four 7-day buckets counted back from as_of
    logged = sum(
        1 for i in range(WEEK_BUCKETS)
        if any(as_of - timedelta(days=7 * i + 6) <= d <= as_of - timedelta(days=7 * i) for d in dates)
    )
    return PeriodFacts(income=income, needs=needs, wants=wants, emergency_fund=emergency_fund, avg_needs=avg_needs,
                       weeks_logged=logged, weeks_elapsed=WEEK_BUCKETS, transactions=len(dates))


def build_score(user, as_of=None):
    as_of = as_of or _today()
    fund = _emergency_fund(user)
    facts = _facts(user, as_of, fund)
    result = compute(facts)

    history = []
    for back in range(HISTORY_POINTS - 1, -1, -1):
        day = as_of - timedelta(days=HISTORY_STEP_DAYS * back)
        score = result["score"] if back == 0 else compute(_facts(user, day, fund))["score"]  # approximate: today's fund (MS-08)
        history.append({"as_of": day.isoformat(), "score": score})

    start, end = window_for(as_of)
    return {
        "streak": streak_for(user, as_of),
        "payday_nudge": payday_nudge(user, as_of, facts.income),
        "as_of": as_of.isoformat(),
        "window": {"start": start.isoformat(), "end": end.isoformat()},
        **result,
        "levers": {"income": facts.income, "wants": facts.wants, "emergency_fund": facts.emergency_fund,
                   "avg_needs": facts.avg_needs, "weeks_logged": facts.weeks_logged},
        "history": history,
    }


def what_if(user, deltas, as_of=None):
    """WI-01..WI-05: the same engine on adjusted facts. Nothing is saved."""
    as_of = as_of or _today()
    facts = _facts(user, as_of, _emergency_fund(user))
    current = compute(facts)

    effective = {
        "wants_delta": max(deltas.get("wants_delta", Decimal(0)), -facts.wants),   # cannot spend less than you spend
        "income_delta": max(deltas.get("income_delta", Decimal(0)), Decimal(0)),
        "emergency_delta": max(deltas.get("emergency_delta", Decimal(0)), Decimal(0)),
        "check_in_every_week": bool(deltas.get("check_in_every_week", False)),
    }
    if current["status"] != "ok":
        return {"status": current["status"], "as_of": as_of.isoformat(), "current": current, "scenario": None, "effective": effective}

    scenario = compute(replace(
        facts,
        income=facts.income + effective["income_delta"],
        wants=facts.wants + effective["wants_delta"],
        emergency_fund=facts.emergency_fund + effective["emergency_delta"],
        weeks_logged=facts.weeks_elapsed if effective["check_in_every_week"] else facts.weeks_logged,
    ))
    return {"status": "ok", "as_of": as_of.isoformat(), "current": current, "scenario": scenario, "effective": effective}


# ---------------------------------------------------------------- streaks (ST) and payday nudge (PD)

def _monday(day):
    return day - timedelta(days=day.weekday())


def streak_for(user, as_of):
    """ST-01..ST-04: ISO weeks (Mon-Sun, local date) with at least one transaction, as 'weeks ago'."""
    this_monday = _monday(as_of)
    dates = (Transaction.objects.filter(user=user, date__gte=this_monday - timedelta(weeks=LOOKBACK_WEEKS), date__lte=as_of)
             .values_list("date", flat=True).distinct())
    return compute_streak({(this_monday - _monday(d)).days // 7 for d in dates})


def payday_nudge(user, as_of, window_income):
    """PD-01/PD-02: a big income entry in the last 3 days -> 'pay yourself first' (20%)."""
    if window_income <= 0:
        return None
    recent = (Transaction.objects
              .filter(user=user, category__type="income", date__gte=as_of - timedelta(days=PAYDAY_DAYS - 1), date__lte=as_of)
              .order_by("-date", "-amount", "-id"))
    for t in recent:
        if t.amount >= window_income * PAYDAY_MIN_SHARE:
            return {"transaction_id": t.id, "date": t.date.isoformat(), "income_amount": t.amount,
                    "percent": PAYDAY_SAVE_PERCENT,
                    "suggested_amount": (t.amount * PAYDAY_SAVE_PERCENT / 100).quantize(CENT, ROUND_HALF_UP)}
    return None


# ---------------------------------------------------------------- weekly recap (RC)

def recap(user, as_of=None):
    as_of = as_of or _today()
    this_start, last_start, last_end = as_of - timedelta(days=6), as_of - timedelta(days=13), as_of - timedelta(days=7)
    rows = list(Transaction.objects.filter(user=user, date__gte=last_start, date__lte=as_of).select_related("category"))
    if not rows:
        return {"status": "no_data", "as_of": as_of.isoformat(), "highlights": []}

    spent = last_spent = income = Decimal(0)
    entries = 0
    by_category, biggest = {}, None
    for t in rows:
        this_week = t.date >= this_start
        entries += this_week
        if t.category and t.category.type == "income":
            income += t.amount if this_week else 0
        elif this_week:
            spent += t.amount
            name = t.category.name if t.category else "Uncategorised"
            by_category[name] = by_category.get(name, Decimal(0)) + t.amount
            if biggest is None or t.amount > biggest["amount"]:
                biggest = {"category": name, "amount": t.amount, "description": t.description}
        else:
            last_spent += t.amount

    fund = _emergency_fund(user)
    now_score = compute(_facts(user, as_of, fund))["score"]
    ago_score = compute(_facts(user, as_of - timedelta(days=7), fund))["score"]
    change = None if now_score is None or ago_score is None else now_score - ago_score
    streak = streak_for(user, as_of)

    highlights = []
    if change:  # RC-03 order: score change, spending vs last week, then streak or a gentle nudge
        highlights.append({"type": "score_up" if change > 0 else "score_down", "points": abs(change)})
    if entries and last_spent > 0 and spent != last_spent:
        highlights.append({"type": "spent_less" if spent < last_spent else "spent_more", "amount": abs(last_spent - spent)})
    if streak["weeks"] >= 2:
        highlights.append({"type": "streak", "weeks": streak["weeks"]})
    elif entries == 0:
        highlights.append({"type": "no_entries"})

    top = max(by_category.items(), key=lambda kv: kv[1]) if by_category else None
    return {"status": "ok", "as_of": as_of.isoformat(), "spent": spent, "spent_last_week": last_spent, "income": income,
            "entries": entries, "top_category": {"name": top[0], "amount": top[1]} if top else None,
            "biggest_expense": biggest, "score_now": now_score, "score_week_ago": ago_score, "score_change": change,
            "streak": streak, "highlights": highlights[:3]}


# ---------------------------------------------------------------- save a what-if as goals (SG)

def indian_grouping(amount):
    """5000 -> '5,000'; 100000 -> '1,00,000'; 33333.33 -> '33,333.33' (lakh grouping, as written in Nepal)."""
    q = amount.quantize(CENT, ROUND_HALF_UP)
    whole, frac = divmod(int(q * 100), 100)
    digits = str(whole)
    if len(digits) > 3:
        head, tail = digits[:-3], digits[-3:]
        head = ",".join([head[max(i - 2, 0):i] for i in range(len(head), 0, -2)][::-1])
        digits = f"{head},{tail}"
    return digits if frac == 0 else f"{digits}.{frac:02d}"


def save_what_if_as_goals(user, deltas, as_of=None):
    """SG-01..SG-03. Returns (created, existing); both lists of FinancialGoal. Raises ValueError if no money lever."""
    as_of = as_of or _today()
    facts = _facts(user, as_of, _emergency_fund(user))
    cut = -min(deltas.get("wants_delta", Decimal(0)), Decimal(0))
    cut = min(cut, facts.wants)                                    # cannot cut more than is spent
    earn = max(deltas.get("income_delta", Decimal(0)), Decimal(0))
    save = max(deltas.get("emergency_delta", Decimal(0)), Decimal(0))

    wanted = []
    if cut > 0:
        wanted.append(("expense_reduction", f"Spend NPR {indian_grouping(cut)} less on nice-to-haves", cut))
    if earn > 0:
        wanted.append(("income_increase", f"Earn NPR {indian_grouping(earn)} more every 30 days", earn))
    if save > 0:
        wanted.append(("savings", f"Emergency fund: add NPR {indian_grouping(save)}", save))
    if not wanted:
        raise ValueError("Pick at least one money change (spend less, earn more, or add to your emergency fund).")

    created, existing = [], []
    with db_transaction.atomic():
        for goal_type, title, amount in wanted:
            same = FinancialGoal.objects.filter(user=user, goal_type=goal_type, title=title, status="in_progress",
                                                target_date__gte=as_of).first()
            if same:
                existing.append(same)
            else:
                created.append(FinancialGoal.objects.create(
                    user=user, title=title, goal_type=goal_type, target_amount=amount.quantize(CENT, ROUND_HALF_UP),
                    start_date=as_of, target_date=as_of + timedelta(days=WINDOW_DAYS)))
    return created, existing
