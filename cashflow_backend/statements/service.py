"""Preview and import a parsed statement. Spec: cashflow-product/docs/specs/statement-import.md (SI-07..SI-14)."""
import re
from collections import Counter
from dataclasses import dataclass

from django.db import transaction as db_transaction
from django.utils import timezone

from accounts.models import User
from transactions.models import Category, Transaction

from .parser import parse_statement

MONEY = "0.01"


def _today():
    return timezone.localdate()          # Nepal's today, not UTC's (bug #5)


def _norm(description):
    return re.sub(r"\s+", " ", (description or "").strip()).lower()


def _key(when, amount, direction, description):
    return (when, amount, direction, _norm(description))


@dataclass
class Plan:
    rows: list          # [(ParsedRow, "new" | "duplicate")] in file order
    errors: list        # [RowError]

    @property
    def new_rows(self):
        return [r for r, status in self.rows if status == "new"]

    @property
    def summary(self):
        return {"new": len(self.new_rows), "duplicates": len(self.rows) - len(self.new_rows), "errors": len(self.errors)}


def _known(user, rows):
    """How many of each (date, amount, direction, description) the user already has, within the file's dates."""
    if not rows:
        return Counter()
    first, last = min(r.date for r in rows), max(r.date for r in rows)
    have = Counter()
    for t in Transaction.objects.filter(user=user, date__range=(first, last), category__isnull=False).select_related("category"):
        direction = "in" if t.category.type == "income" else "out"
        have[_key(t.date, t.amount, direction, t.description)] += 1
    return have


def plan(user, raw):
    """Parse and compare with what the user already has. Counting, not yes/no: SI-08. Raises StatementError."""
    parsed, errors = parse_statement(raw, today=_today())
    have = _known(user, parsed)
    rows = []
    for row in parsed:
        key = _key(row.date, row.amount, row.direction, row.description)
        if have[key] > 0:
            have[key] -= 1
            rows.append((row, "duplicate"))
        else:
            rows.append((row, "new"))
    return Plan(rows, errors)


def _category(name, direction, cache):
    kind = "income" if direction == "in" else "expense"
    name = name or "Uncategorized"
    key = (name.lower(), kind)
    if key not in cache:
        cache[key] = Category.objects.filter(name__iexact=name, type=kind).first() or Category.objects.create(name=name, type=kind)
    return cache[key]


def save(user, raw):
    """SI-12: all new rows or none. Returns the Plan that was applied."""
    with db_transaction.atomic():
        User.objects.select_for_update().get(pk=user.pk)        # two imports at once must not both think a row is new
        applied = plan(user, raw)
        cache = {}
        Transaction.objects.bulk_create([
            Transaction(user=user, date=r.date, amount=r.amount, description=r.description,
                        category=_category(r.category, r.direction, cache))
            for r in applied.new_rows
        ])
    return applied
