from django.test import SimpleTestCase
from datetime import date, timedelta
from reminders.serializers import RecurringTransactionReminderSerializer

class RecurringTransactionReminderSerializerTests(SimpleTestCase):
    def test_fields_read_only(self):
        serializer = RecurringTransactionReminderSerializer()
        self.assertTrue(serializer.fields['transaction'].read_only)
        self.assertTrue(serializer.fields['days_remaining'].read_only)

    def test_get_days_remaining_none(self):
        # Stub out days_remaining method
        dummy = type('D', (), {'days_remaining': lambda self: None})()
        serializer = RecurringTransactionReminderSerializer()
        self.assertIsNone(serializer.get_days_remaining(dummy))

    def test_get_days_remaining_value(self):
        # Stub out days_remaining method with a fixed value
        delta_days = 5
        dummy = type('D', (), {'days_remaining': lambda self: delta_days})()
        serializer = RecurringTransactionReminderSerializer()
        self.assertEqual(serializer.get_days_remaining(dummy), delta_days)
