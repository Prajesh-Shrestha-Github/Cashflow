from rest_framework import serializers
from .models import Recommendation

class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = ['id', 'query', 'response', 'sarcasm_level', 'created_at']
        read_only_fields = ['id', 'response', 'created_at']

class RecommendationRequestSerializer(serializers.Serializer):
    query = serializers.CharField(required=True)
    sarcasm_level = serializers.IntegerField(min_value=0, max_value=5, default=0)