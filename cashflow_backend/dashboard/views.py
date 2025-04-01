# dashboard/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import DashboardStat
from .serializers import DashboardStatSerializer
import random
from django.db.models import Q

class DashboardView(APIView):
    def get(self, request):
        """
        Get dashboard stats for the current user.
        For now, just return dummy data or create if not exists.
        """
        # Find or create dashboard stats
        stats, created = DashboardStat.objects.get_or_create(
            user=request.user,
            defaults={
                'total_income': random.randint(5000, 10000),
                'total_expense': random.randint(2000, 4000),
                'active_goals': random.randint(1, 5)
            }
        )
        
        # If created for the first time, calculate balance
        if created:
            stats.balance = stats.total_income - stats.total_expense
            stats.save()
        
        serializer = DashboardStatSerializer(stats)
        
        # Add some dummy chart data
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        income_data = [random.randint(1000, 2000) for _ in range(6)]
        expense_data = [random.randint(500, 1500) for _ in range(6)]
        
        response_data = {
            'stats': serializer.data,
            'charts': {
                'monthly_overview': {
                    'labels': months,
                    'income': income_data,
                    'expense': expense_data
                },
                'categories': {
                    'labels': ['Food', 'Transport', 'Entertainment', 'Utilities', 'Rent'],
                    'data': [random.randint(50, 500) for _ in range(5)]
                }
            },
            'recent_transactions': [
                {
                    'id': i,
                    'amount': random.randint(10, 1000),
                    'type': random.choice(['income', 'expense']),
                    'category': random.choice(['Food', 'Transport', 'Salary', 'Entertainment']),
                    'date': f"2025-03-{random.randint(1, 30)}"
                } for i in range(1, 6)
            ]
        }
        
        return Response(response_data, status=status.HTTP_200_OK)

class AdminDashboardView(APIView):
    def get(self, request):
        """
        Admin dashboard with overall platform statistics
        """
        if not request.user.is_admin and not request.user.is_staff:
            return Response({'error': 'You do not have permission to access the admin dashboard'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Dummy admin stats
        user_count = random.randint(50, 200)
        transaction_count = user_count * random.randint(10, 50)
        total_platform_balance = random.randint(50000, 200000)
        
        response_data = {
            'user_stats': {
                'total_users': user_count,
                'active_users': int(user_count * 0.8),
                'new_users_this_month': int(user_count * 0.1)
            },
            'transaction_stats': {
                'total_transactions': transaction_count,
                'total_platform_balance': total_platform_balance,
                'average_transaction': round(total_platform_balance / transaction_count, 2)
            },
            'charts': {
                'user_growth': {
                    'labels': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    'data': [random.randint(10, 30) for _ in range(6)]
                },
                'transaction_volume': {
                    'labels': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    'data': [random.randint(500, 2000) for _ in range(6)]
                }
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)