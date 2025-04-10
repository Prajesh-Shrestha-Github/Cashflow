from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import RecommendationSerializer, RecommendationRequestSerializer
from .models import Recommendation
from .services import AIRecommendationService

class RecommendationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = RecommendationRequestSerializer(data=request.data)
        if serializer.is_valid():
            query = serializer.validated_data['query']
            sarcasm_level = serializer.validated_data['sarcasm_level']
            
            service = AIRecommendationService()
            # Check if user has any remaining requests today
            has_requests, remaining = service.check_rate_limit(request.user)
            if not has_requests:
                return Response(
                    {'detail': "You've reached your daily limit of 3 AI recommendations. Please try again tomorrow!"},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            # Generate recommendation
            response_text = service.generate_recommendation(
                user=request.user,
                query=query,
                sarcasm_level=sarcasm_level
            )
            
            # Save recommendation to database
            recommendation = Recommendation.objects.create(
                user=request.user,
                query=query,
                response=response_text,
                sarcasm_level=sarcasm_level
            )
            
            return Response({
                'response': response_text,
                'id': recommendation.id,
                'requests_remaining': remaining - 1
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RecommendationHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        recommendations = Recommendation.objects.filter(user=request.user)
        serializer = RecommendationSerializer(recommendations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
