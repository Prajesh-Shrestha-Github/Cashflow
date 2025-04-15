from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from .models import Transaction, Category
from .serializers import TransactionSerializer, CategorySerializer, CSVUploadSerializer
from financial_goals_and_health.models import FinancialGoal
from .utils import process_csv_file

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for listing categories"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Filter by type if requested
        category_type = self.request.query_params.get('type')
        queryset = Category.objects.all()
        
        if category_type:
            queryset = queryset.filter(type=category_type)
        
        return queryset

class TransactionViewSet(viewsets.ModelViewSet):
    """API endpoint for managing transactions"""
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'category__name']
    ordering_fields = ['date', 'amount', 'category__name']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Transaction.objects.filter(user=user).order_by('-date')
        
        start_date = self.request.query_params.get('startDate')
        end_date = self.request.query_params.get('endDate')
        category = self.request.query_params.get('category')
        trans_type = self.request.query_params.get('type')
        search = self.request.query_params.get('search')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        if category:
            queryset = queryset.filter(category=category)
        if trans_type:
            queryset = queryset.filter(category__type=trans_type)
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) | Q(category__name__icontains=search)
            )
        
        return queryset
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        return context
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_csv(self, request):
        """Import transactions from CSV file"""
        serializer = CSVUploadSerializer(data=request.data)
        
        if serializer.is_valid():
            csv_file = serializer.validated_data['file']
            
            # Check file extension
            if not csv_file.name.endswith('.csv'):
                return Response(
                    {'error': 'File must be a CSV'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Process CSV file
            result = process_csv_file(csv_file, request.user)
            
            return Response({
                'message': f"Successfully imported {result['imported_count']} transactions",
                'errors': result['errors'] if result['errors'] else None
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get transaction summary for the current user"""
        user = request.user
        transactions = Transaction.objects.filter(user=user)
        
        # Calculate income and expense totals
        income_transactions = transactions.filter(category__type='income')
        expense_transactions = transactions.filter(category__type='expense')
        
        total_income = sum(t.amount for t in income_transactions)
        total_expenses = sum(t.amount for t in expense_transactions)
        balance = total_income - total_expenses
        
        return Response({
            'total_income': total_income,
            'total_expenses': total_expenses,
            'balance': balance
        })
    
    @action(detail=False, methods=['get'])
    def available_goals(self, request):
        """Return a list of goals that can be linked to transactions"""
        goals = FinancialGoal.objects.filter(
            user=request.user, 
            status='in_progress'
        )
        
        # Format goals for dropdown
        goal_options = [
            {
                'id': goal.id,
                'title': goal.title,
                'type': goal.goal_type,
                'compatible_category_type': 'income' if goal.goal_type in ['savings', 'investment', 'income_increase'] else 'expense'
            }
            for goal in goals
        ]
        
        return Response(goal_options)
