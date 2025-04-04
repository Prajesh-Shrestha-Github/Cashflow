# financial_goals/serializers.py
from rest_framework import serializers
from .models import FinancialGoal, FinancialHealth

class FinancialGoalSerializer(serializers.ModelSerializer):
    completion_percentage = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    transaction_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FinancialGoal
        fields = [
            'id', 'title', 'description', 'goal_type', 'target_amount', 
            'current_amount', 'start_date', 'target_date', 'status',
            'completion_percentage', 'days_remaining', 'transaction_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['current_amount', 'created_at', 'updated_at']
    
    def get_transaction_count(self, obj):
        return obj.transactions.count()

class FinancialHealthSerializer(serializers.ModelSerializer):
    month_display = serializers.SerializerMethodField()
    
    class Meta:
        model = FinancialHealth
        fields = [
            'id', 'month', 'month_display', 'total_income', 'total_expenses',
            'savings_rate', 'income_expense_ratio', 'health_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['savings_rate', 'income_expense_ratio', 'health_status', 'created_at', 'updated_at']
    
    def get_month_display(self, obj):
        return obj.month.strftime('%B %Y')