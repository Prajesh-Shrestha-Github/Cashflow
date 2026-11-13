"""Turn captured text into a transaction, once. Plan: docs/PLAN.md ("One capture pipeline")."""
from django.db import transaction as db_transaction

from accounts.models import User
from statements.service import _category, _today
from transactions.models import Transaction

from .parser import parse_sms


def ingest(user, text):
    """-> ("created", Transaction) | ("duplicate", None) | ("ignored", None). Ignored text is not stored."""
    sms = parse_sms(text, today=_today())
    if sms is None:
        return "ignored", None
    with db_transaction.atomic():
        User.objects.select_for_update().get(pk=user.pk)        # the Shortcut can fire twice for one message
        # shortcut: matches only earlier captures, so the same payment in an imported statement is counted twice;
        # fix when Transaction gains a reference field (plan phase 1, workspaces and accounts).
        if Transaction.objects.filter(user=user, date=sms.date, amount=sms.amount, description=sms.description).exists():
            return "duplicate", None
        return "created", Transaction.objects.create(
            user=user, date=sms.date, amount=sms.amount, description=sms.description,
            category=_category(None, sms.direction, {}),
        )
