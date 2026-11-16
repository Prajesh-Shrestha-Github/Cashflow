"""Turn captured text into a transaction, once. Plan: docs/PLAN.md ("One capture pipeline")."""
from django.db import transaction as db_transaction

from accounts.models import User
from statements.service import _category, _today
from transactions.models import Transaction
from workspaces.models import Account, personal_workspace

from .parser import parse_sms


def ingest(user, text):
    """-> ("created", Transaction) | ("duplicate", None) | ("ignored", None). Ignored text is not stored."""
    sms = parse_sms(text, today=_today())
    if sms is None:
        return "ignored", None
    with db_transaction.atomic():
        User.objects.select_for_update().get(pk=user.pk)        # the Shortcut can fire twice for one message
        workspace = personal_workspace(user)
        account, _ = Account.objects.get_or_create(workspace=workspace, identifier=sms.account,
                                                   defaults={"name": f"Account ••{sms.account}"})
        facts = dict(user=user, account=account, date=sms.date, time=sms.time, amount=sms.amount,
                     reference=sms.reference, description=sms.description)
        if Transaction.objects.filter(**facts).exists():
            return "duplicate", None
        return "created", Transaction.objects.create(workspace=workspace, category=_category(None, sms.direction, {}), **facts)
