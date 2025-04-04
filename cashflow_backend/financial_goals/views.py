# financial_goals/views.py
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.utils import timezone
import datetime
from dateutil.relativedelta import relativedelta

from .models import FinancialGoal, FinancialHealth
from .serializers import FinancialGoalSerializer, FinancialHealthSerializer
from transactions.models import Transaction

class FinancialGoalViewSet(viewsets.ModelViewSet):
    serializer_class = FinancialGoalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'goal_type']
    ordering_fields = ['created_at', 'target_date', 'current_amount', 'target_amount']
    
    def get_queryset(self):
        return FinancialGoal.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Return transactions linked to this goal"""
        goal = self.get_object()
        transactions = Transaction.objects.filter(financial_goal=goal)
        from transactions.serializers import TransactionSerializer
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def update_progress(self, request, pk=None):
        """Manually update the goal progress based on transactions"""
        goal = self.get_object()
        goal.update_progress()
        serializer = self.get_serializer(goal)
        return Response(serializer.data)

class FinancialHealthViewSet(viewsets.ModelViewSet):
    serializer_class = FinancialHealthSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return FinancialHealth.objects.filter(user=self.request.user).order_by('-month')
    
    def create(self, request, *args, **kwargs):
        # Calculate financial health based on transaction data
        return self.update_financial_health(request)
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        return self.update_financial_health(request)
    
    def update_financial_health(self, request):
        # Get month parameter from request or use current month
        month_str = request.data.get('month')
        if month_str:
            try:
                month_date = datetime.datetime.strptime(month_str, '%Y-%m-%d').date()
                month_start = datetime.date(month_date.year, month_date.month, 1)
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, 
                               status=status.HTTP_400_BAD_REQUEST)
        else:
            today = timezone.now().date()
            month_start = datetime.date(today.year, today.month, 1)
        
        # Get next month's first day for date range
        next_month = month_start + relativedelta(months=1)
        
        # Calculate income and expenses from transactions
        income = Transaction.objects.filter(
            user=request.user,
            category__type='income',
            date__gte=month_start,
            date__lt=next_month
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        expenses = Transaction.objects.filter(
            user=request.user,
            category__type='expense',
            date__gte=month_start,
            date__lt=next_month
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Get or create financial health record for this month
        health, created = FinancialHealth.objects.get_or_create(
            user=request.user,
            month=month_start,
            defaults={
                'total_income': income,
                'total_expenses': expenses
            }
        )
        
        if not created:
            health.total_income = income
            health.total_expenses = expenses
            health.save()
        
        serializer = self.get_serializer(health)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        today = timezone.now().date()
        month_start = datetime.date(today.year, today.month, 1)
        
        health, _ = FinancialHealth.objects.get_or_create(
            user=request.user,
            month=month_start
        )
        
        # Trigger an automatic calculation
        self.update_financial_health(request)
        
        # Get the updated record
        health.refresh_from_db()
        serializer = self.get_serializer(health)
        return Response(serializer.data)