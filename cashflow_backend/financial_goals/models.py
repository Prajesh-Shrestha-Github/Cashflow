from django.db import models
from django.utils import timezone
from accounts.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal

class FinancialGoal(models.Model):
    GOAL_STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]
    
    GOAL_TYPE_CHOICES = [
        ('savings', 'Savings'),
        ('debt_reduction', 'Debt Reduction'),
        ('investment', 'Investment'),
        ('expense_reduction', 'Expense Reduction'),
        ('income_increase', 'Income Increase'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='financial_goals')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    goal_type = models.CharField(max_length=20, choices=GOAL_TYPE_CHOICES)
    target_amount = models.DecimalField(
        max_digits=14, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal("0.01"))]
    )
    current_amount = models.DecimalField(
        max_digits=14, 
        decimal_places=2, 
        default=Decimal("0.00")
    )
    start_date = models.DateField(default=timezone.localdate)
    target_date = models.DateField()
    status = models.CharField(max_length=20, choices=GOAL_STATUS_CHOICES, default='in_progress')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def completion_percentage(self):
        if self.target_amount == 0:
            return 0
        # Both operands are Decimals to avoid type errors
        return min(100, round((self.current_amount / self.target_amount) * Decimal('100'), 2))
    
    @property
    def days_remaining(self):
        if self.status == 'completed':
            return 0
        today = timezone.now().date()
        if today > self.target_date:
            return 0
        return (self.target_date - today).days
    
    def update_progress(self):
        # Import Transaction here to avoid circular imports
        from transactions.models import Transaction
        
        if self.goal_type in ['savings', 'investment', 'income_increase']:
            transactions = Transaction.objects.filter(
                user=self.user,
                financial_goal=self,
                category__type='income'
            )
            result = transactions.aggregate(models.Sum('amount'))['amount__sum']
            self.current_amount = Decimal(result) if result is not None else Decimal("0.00")
        else:
            transactions = Transaction.objects.filter(
                user=self.user,
                financial_goal=self,
                category__type='expense'
            )
            result = transactions.aggregate(models.Sum('amount'))['amount__sum']
            self.current_amount = Decimal(result) if result is not None else Decimal("0.00")
            
        if self.goal_type in ['savings', 'investment', 'income_increase']:
            if self.current_amount >= self.target_amount:
                self.status = 'completed'
        else:
            # Custom logic for expense reduction or debt reduction can be added here
            pass
            
        self.save()
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"


class FinancialHealth(models.Model):
    HEALTH_STATUS_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
        ('critical', 'Critical'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='financial_health')
    month = models.DateField()  # Store first day of the month
    total_income = models.DecimalField(
        max_digits=14, 
        decimal_places=2, 
        default=Decimal("0.00")
    )
    total_expenses = models.DecimalField(
        max_digits=14, 
        decimal_places=2, 
        default=Decimal("0.00")
    )
    savings_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal("0.00")
    )  # percentage
    income_expense_ratio = models.DecimalField(
        max_digits=8, 
        decimal_places=4, 
        default=Decimal("0.00")
    )
    health_status = models.CharField(max_length=20, choices=HEALTH_STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'month')
    
    def calculate_health_status(self):
        if self.income_expense_ratio >= Decimal("2.0"):
            return 'excellent'
        elif self.income_expense_ratio >= Decimal("1.5"):
            return 'good'
        elif self.income_expense_ratio >= Decimal("1.0"):
            return 'fair'
        elif self.income_expense_ratio >= Decimal("0.8"):
            return 'poor'
        else:
            return 'critical'
    
    def save(self, *args, **kwargs):
        if self.total_expenses > 0:
            self.income_expense_ratio = self.total_income / self.total_expenses
        else:
            self.income_expense_ratio = self.total_income if self.total_income > 0 else Decimal("0.00")
        
        if self.total_income > 0:
            self.savings_rate = max(Decimal("0.00"), (self.total_income - self.total_expenses) / self.total_income * Decimal("100"))
        
        self.health_status = self.calculate_health_status()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.username} - {self.month.strftime('%B %Y')}"
