"""The dashboard's main balance: what you have (all income minus all spending until today), how it moved over the
last 30 days, and a 30-day trend. Decimal only, money as strings (ADR-0003). Only the user's own data."""
from datetime import timedelta
from decimal import Decimal

from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from transactions.models import Transaction

WINDOW_DAYS = 30
ZERO = Decimal(0)


def _today():
    return timezone.localdate()


def _money(value):
    return format(value.quantize(Decimal("0.01")), "f")


def _signed(transaction):
    """Income adds, everything else (including no category) subtracts."""
    return transaction.amount if transaction.category and transaction.category.type == "income" else -transaction.amount


def build_balance(user, today=None):
    today = today or _today()
    start = today - timedelta(days=WINDOW_DAYS - 1)

    # everything before the window, in one query: income - (total - income)
    before = Transaction.objects.filter(user=user, date__lt=start).aggregate(
        total=Sum("amount"), income=Sum("amount", filter=Q(category__type="income")))
    income_before, total_before = before["income"] or ZERO, before["total"] or ZERO
    baseline = income_before - (total_before - income_before)

    income = spent = ZERO
    per_day = {}
    for t in Transaction.objects.filter(user=user, date__gte=start, date__lte=today).select_related("category"):
        delta = _signed(t)
        per_day[t.date] = per_day.get(t.date, ZERO) + delta
        if delta >= 0 and t.category and t.category.type == "income":
            income += t.amount
        else:
            spent += t.amount

    running, trend = baseline, []
    for i in range(WINDOW_DAYS):
        day = start + timedelta(days=i)
        running += per_day.get(day, ZERO)
        trend.append({"date": day.isoformat(), "balance": running})

    net = income - spent
    return {
        "has_data": Transaction.objects.filter(user=user).exists(),
        "balance": running,
        "last_30_days": {"start": start.isoformat(), "end": today.isoformat(), "income": income, "spent": spent, "net": net},
        "change_30d": net,
        "direction": "up" if net > 0 else "down" if net < 0 else "flat",
        "trend": trend,
    }


class BalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = build_balance(request.user)
        last = data["last_30_days"]
        return Response({
            "has_data": data["has_data"],
            "balance": _money(data["balance"]),
            "last_30_days": {**last, "income": _money(last["income"]), "spent": _money(last["spent"]), "net": _money(last["net"])},
            "change_30d": _money(data["change_30d"]),
            "direction": data["direction"],
            "trend": [{"date": p["date"], "balance": _money(p["balance"])} for p in data["trend"]],
        })
