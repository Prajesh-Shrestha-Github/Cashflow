"""Every transaction lands in a workspace, whichever door it came through. Plan: docs/PLAN.md."""
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction as db_transaction
from django.test import TestCase

from accounts.models import User
from transactions.models import Transaction
from transactions.utils import process_csv_file
from workspaces.models import Workspace, personal_workspace


class WorkspaceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("ws_user", password="x")

    def test_a_saved_transaction_lands_in_the_owners_personal_workspace(self):
        first = Transaction.objects.create(user=self.user, amount=100)
        second = Transaction.objects.create(user=self.user, amount=200)
        self.assertEqual(first.workspace, second.workspace)
        self.assertEqual((first.workspace.owner, first.workspace.kind), (self.user, "personal"))
        self.assertEqual(Workspace.objects.count(), 1)

    def test_a_user_cannot_have_two_personal_workspaces(self):
        personal_workspace(self.user)
        with self.assertRaises(IntegrityError), db_transaction.atomic():
            Workspace.objects.create(owner=self.user, name="Another", kind="personal")
        Workspace.objects.create(owner=self.user, name="Shop", kind="business")      # a business one is fine

    def test_the_csv_upload_sets_the_workspace_too(self):
        upload = SimpleUploadedFile("t.csv", b"date,description,amount,category\n2026-11-03,Rent,-40000,Housing\n")
        result = process_csv_file(upload, self.user)
        self.assertEqual((result["imported_count"], result["errors"]), (1, []))
        self.assertEqual(Transaction.objects.get().workspace, personal_workspace(self.user))
