# dashboard/models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class DashboardStat(models.Model):
    """Simple model for dashboard statistics"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    total_income = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_expense = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    active_goals = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Dashboard Stats"