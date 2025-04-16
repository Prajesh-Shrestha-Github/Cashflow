# transactions/models.py
from django.db import models
from django.utils import timezone
from accounts.models import User
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from dateutil.relativedelta import relativedelta
from django.core.mail import send_mail
from django.conf import settings

class Category(models.Model):
    """Model for transaction categories"""
    TYPE_CHOICES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name_plural = "Categories"
    
    def __str__(self):
        return f"{self.name} ({self.type})"

class Transaction(models.Model):

    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]

    """Model for financial transactions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    date = models.DateField(default=timezone.now)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='transactions')
    description = models.TextField(blank=True, null=True)
    is_recurring = models.BooleanField(default=False)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, null=True, blank=True)
    next_due_date = models.DateField(null=True, blank=True)
    send_email_reminder = models.BooleanField(default=False)
    # Add this new field to link transactions to financial goals
    financial_goal = models.ForeignKey('financial_goals_and_health.FinancialGoal', on_delete=models.SET_NULL, 
                                      null=True, blank=True, related_name='transactions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.amount} - {self.date}"
    
    def save(self, *args, **kwargs):
        # If this is a recurring transaction and it's an expense
        if self.is_recurring and self.category and self.category.type == 'expense':
            # If next_due_date is not set, initialize it to the transaction date
            if not self.next_due_date:
                self.next_due_date = self.date
        
        super().save(*args, **kwargs)
    
    def update_next_due_date(self):
        """Update the next due date based on frequency"""
        if not self.is_recurring or not self.frequency:
            return
            
        if self.frequency == 'daily':
            self.next_due_date = self.next_due_date + relativedelta(days=1)
        elif self.frequency == 'weekly':
            self.next_due_date = self.next_due_date + relativedelta(weeks=1)
        elif self.frequency == 'monthly':
            self.next_due_date = self.next_due_date + relativedelta(months=1)
        elif self.frequency == 'yearly':
            self.next_due_date = self.next_due_date + relativedelta(years=1)
        
        self.save()
# Add signals to update goal progress when transactions are modified
@receiver(post_save, sender=Transaction)
def update_goal_progress(sender, instance, **kwargs):
    if instance.financial_goal:
        instance.financial_goal.update_progress()

@receiver(post_delete, sender=Transaction)
def update_goal_progress_on_delete(sender, instance, **kwargs):
    if instance.financial_goal:
        instance.financial_goal.update_progress()