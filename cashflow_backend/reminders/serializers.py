# reminders/serializers.py
from rest_framework import serializers
from .models import RecurringTransactionReminder
from transactions.serializers import TransactionSerializer

class RecurringTransactionReminderSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer(read_only=True)
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = RecurringTransactionReminder
        fields = ['id', 'transaction', 'last_reminded_at', 'days_remaining']
    
    def get_days_remaining(self, obj):
        return obj.days_remaining()