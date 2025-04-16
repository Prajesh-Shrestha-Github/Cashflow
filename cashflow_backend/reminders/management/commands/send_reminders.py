# reminders/management/commands/send_reminders.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from reminders.models import RecurringTransactionReminder

class Command(BaseCommand):
    help = 'Send reminders for upcoming recurring transactions'
    
    def handle(self, *args, **options):
        reminders = RecurringTransactionReminder.objects.all()
        sent_count = 0
        
        for reminder in reminders:
            if reminder.send_reminder_email():
                sent_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully sent {sent_count} reminders')
        )