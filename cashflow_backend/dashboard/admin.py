# dashboard/admin.py

from django.contrib import admin
from .models import DashboardStat

@admin.register(DashboardStat)
class DashboardStatAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_income', 'total_expense', 'balance', 'active_goals', 'last_updated')
    search_fields = ('user__username',)