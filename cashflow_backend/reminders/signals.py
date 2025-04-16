# reminders/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from transactions.models import Transaction
from .models import RecurringTransactionReminder

@receiver(post_save, sender=Transaction)
def create_or_update_reminder(sender, instance, created, **kwargs):
    # Only create reminders for expense transactions that are recurring
    if instance.is_recurring and instance.category and instance.category.type == 'expense':
        # Create or update the reminder
        RecurringTransactionReminder.objects.update_or_create(
            transaction=instance
        )