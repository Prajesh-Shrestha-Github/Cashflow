from rest_framework import serializers
from .models import Transaction, Category
from financial_goals_and_health.models import FinancialGoal

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'description']

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    category_type = serializers.ReadOnlyField(source='category.type')
    goal_title = serializers.ReadOnlyField(source='financial_goal.title', default=None)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'date', 'amount', 'category', 'category_name', 
            'category_type', 'description', 'is_recurring', 
            'financial_goal', 'goal_title', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        # Remove the user from validated_data if it was passed from the view
        user = validated_data.pop('user', self.context['request'].user)
        transaction = Transaction.objects.create(user=user, **validated_data)
        return transaction


    def validate(self, data):
        # If a financial goal is provided, ensure it belongs to the user
        financial_goal = data.get('financial_goal')
        if financial_goal:
            user = self.context['request'].user
            if financial_goal.user != user:
                raise serializers.ValidationError("You can only link transactions to your own goals")
                
            # Validate that the category type matches the financial goal type
            category = data.get('category')
            if category:
                goal_type = financial_goal.goal_type
                if goal_type in ['savings', 'investment', 'income_increase'] and category.type != 'income':
                    raise serializers.ValidationError(
                        f"For goal type '{goal_type}', category type must be 'income'"
                    )
                elif goal_type in ['debt_reduction', 'expense_reduction'] and category.type != 'expense':
                    raise serializers.ValidationError(
                        f"For goal type '{goal_type}', category type must be 'expense'"
                    )
        return data

class CSVUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
