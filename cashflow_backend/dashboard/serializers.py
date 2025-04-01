# dashboard/serializers.py

from rest_framework import serializers
from .models import DashboardStat

class DashboardStatSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = DashboardStat
        fields = ('id', 'username', 'total_income', 'total_expense', 'balance', 'active_goals', 'last_updated')
        read_only_fields = ('id', 'username', 'last_updated')