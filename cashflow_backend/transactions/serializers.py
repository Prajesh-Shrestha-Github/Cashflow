from rest_framework import serializers
from .models import Transaction, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'description']

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_type = serializers.CharField(source='category.type', read_only=True)
    
    class Meta:
        model = Transaction
        fields = ['id', 'date', 'amount', 'category', 'category_name', 'category_type', 
                 'description', 'is_recurring', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        user = self.context['request'].user
        transaction = Transaction.objects.create(user=user, **validated_data)
        return transaction

class CSVUploadSerializer(serializers.Serializer):
    file = serializers.FileField()