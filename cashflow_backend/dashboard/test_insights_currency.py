"""Dashboard insight sentences speak NPR with lakh grouping, never "$" (the rest of the dashboard already does)."""
from decimal import Decimal as D

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from transactions.models import Category, Transaction


class InsightCurrencyTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("insight_user", password="x")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        rent = Category.objects.get_or_create(name="Rent", type="expense")[0]
        Transaction.objects.create(user=self.user, date=timezone.localdate(), amount=D("123456.50"), category=rent)

    def descriptions(self):
        r = self.client.get("/api/dashboard/?period=month")
        self.assertEqual(r.status_code, 200)
        return [i["description"] for i in r.json()["insights"]]

    def test_the_top_category_sentence_uses_npr_with_lakh_grouping(self):
        self.assertTrue(any("Rent at NPR 1,23,456.50" in d for d in self.descriptions()), self.descriptions())

    def test_the_busiest_day_sentence_uses_npr(self):
        self.assertTrue(any("averaging NPR 1,23,456.50" in d for d in self.descriptions()), self.descriptions())

    def test_no_insight_mentions_dollars(self):
        self.assertFalse(any("$" in d for d in self.descriptions()))
