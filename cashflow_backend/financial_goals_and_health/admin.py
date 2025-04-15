# financial_goals_and_health/admin.py
from django.contrib import admin
from .models import FinancialGoal, FinancialHealth

@admin.register(FinancialGoal)
class FinancialGoalAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'goal_type', 'target_amount', 'current_amount', 'status', 'target_date')
    list_filter = ('status', 'goal_type')
    search_fields = ('title', 'description', 'user__username')

@admin.register(FinancialHealth)
class FinancialHealthAdmin(admin.ModelAdmin):
    list_display = ('user', 'month', 'total_income', 'total_expenses', 'income_expense_ratio', 'health_status')
    list_filter = ('health_status',)
    search_fields = ('user__username',)