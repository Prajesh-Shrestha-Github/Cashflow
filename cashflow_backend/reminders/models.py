# reminders/models.py
from django.db import models
from django.utils import timezone
from accounts.models import User
from transactions.models import Transaction
from django.core.mail import send_mail  # Add this import
from django.conf import settings

class RecurringTransactionReminder(models.Model):
    """Model for reminders of recurring transactions"""
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='reminder')
    last_reminded_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Reminder for {self.transaction}"
    
    def days_remaining(self):
        """Calculate days remaining until next due date"""
        if not self.transaction.next_due_date:
            return None
        
        today = timezone.now().date()
        delta = self.transaction.next_due_date - today
        return delta.days
    
    def send_reminder_email(self):
        """Send reminder email to user"""
        if not self.transaction.send_email_reminder or not self.transaction.next_due_date:
            return False
        
        user = self.transaction.user
        days = self.days_remaining()
        
        # Only send reminders for upcoming transactions (0-3 days), not past due ones
        if days is not None and 0 <= days <= 3:
            subject = f"Reminder: Upcoming expense - {self.transaction.description}"
            message = f"""
            Hello {user.username},
            
            This is a reminder that you have an upcoming recurring expense:
            
            Description: {self.transaction.description}
            Amount: ${self.transaction.amount}
            Due date: {self.transaction.next_due_date}
            {"Due today!" if days == 0 else f"Days remaining: {days}"}
            
            Thanks for using Cashflow!
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            
            self.last_reminded_at = timezone.now()
            self.save()
            return True
        
        return False