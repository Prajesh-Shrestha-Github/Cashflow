# dashboard/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import DashboardStat
from .serializers import DashboardStatSerializer
import random
from django.db.models import Q, Sum, Avg, Count, F
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
import calendar
from django.db.models.functions import ExtractWeekDay, ExtractHour, TruncDay, TruncWeek, TruncMonth

# Import transaction model
from transactions.models import Transaction

class DashboardView(APIView):
    def get(self, request):
        """
        Get dashboard stats for the current user with period filtering.
        Provides comprehensive data for enhanced dashboard visualizations.
        """
        # Get period parameter (default to month)
        period = request.query_params.get('period', 'month')
        
        # Set date ranges based on period
        today = timezone.now().date()
        
        if period == 'week':
            start_date = today - timedelta(days=today.weekday())
            prev_start_date = start_date - timedelta(days=7)
            prev_end_date = start_date - timedelta(days=1)
            date_format = '%a'  # Day of week format
            grouping_func = TruncDay
        elif period == 'year':
            start_date = datetime(today.year, 1, 1).date()
            prev_start_date = datetime(today.year - 1, 1, 1).date()
            prev_end_date = datetime(today.year - 1, 12, 31).date()
            date_format = '%b'  # Month format
            grouping_func = TruncMonth
        else:  # default to month
            start_date = datetime(today.year, today.month, 1).date()
            # Get last day of previous month
            if today.month == 1:
                prev_month = 12
                prev_year = today.year - 1
            else:
                prev_month = today.month - 1
                prev_year = today.year
            prev_start_date = datetime(prev_year, prev_month, 1).date()
            last_day = calendar.monthrange(prev_year, prev_month)[1]
            prev_end_date = datetime(prev_year, prev_month, last_day).date()
            date_format = '%d-%b'  # Day-Month format
            grouping_func = TruncDay
            
        # Find or create dashboard stats
        stats, created = DashboardStat.objects.get_or_create(
            user=request.user,
            defaults={
                'total_income': Decimal('0.00'),
                'total_expense': Decimal('0.00'),
                'active_goals': 0
            }
        )
        
        # Query transactions for the selected period
        current_period_transactions = Transaction.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=today
        ).select_related('category')  # Efficiently load the related category
        
        # Query transactions for the previous period (for comparison)
        prev_period_transactions = Transaction.objects.filter(
            user=request.user,
            date__gte=prev_start_date,
            date__lte=prev_end_date
        ).select_related('category')
        
        # Calculate totals for current period
        income_sum = current_period_transactions.filter(category__type='income').aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')
        expense_sum = current_period_transactions.filter(category__type='expense').aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')
        balance = income_sum - expense_sum
        
        # Calculate totals for previous period
        prev_income_sum = prev_period_transactions.filter(category__type='income').aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')
        prev_expense_sum = prev_period_transactions.filter(category__type='expense').aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')
        
        # Calculate percentage changes
        income_change = 0
        expense_change = 0
        
        if prev_income_sum > 0:
            income_change = round(((income_sum - prev_income_sum) / prev_income_sum) * 100, 1)
        
        if prev_expense_sum > 0:
            expense_change = round(((expense_sum - prev_expense_sum) / prev_expense_sum) * 100, 1)
        
        # Calculate savings rate
        savings_rate = 0
        if income_sum > 0:
            savings_rate = round((balance / income_sum) * 100, 1)
            # Ensure we don't get negative savings rate
            savings_rate = max(0, savings_rate)
        
        # Update the stats object
        stats.total_income = income_sum
        stats.total_expense = expense_sum
        stats.balance = balance
        stats.save()
        
        # Get category breakdown for expenses
        expense_transactions = current_period_transactions.filter(category__type='expense')
        category_data = expense_transactions.values('category__name').annotate(
            amount=Sum('amount')
        ).order_by('-amount')
        
        category_breakdown = [
            {
                'category': item['category__name'],
                'amount': float(item['amount'])
            } for item in category_data
        ]
        
        # Generate trend data (income/expense over time)
        trend_data = []
        
        # Group transactions by date
        income_expenses_by_date = {}
        
        # Process income transactions
        income_by_date = current_period_transactions.filter(
            category__type='income'
        ).annotate(
            date_group=grouping_func('date')
        ).values('date_group').annotate(
            income=Sum('amount')
        ).order_by('date_group')
        
        for item in income_by_date:
            date_str = item['date_group'].strftime(date_format)
            if date_str not in income_expenses_by_date:
                income_expenses_by_date[date_str] = {'income': 0, 'expense': 0}
            income_expenses_by_date[date_str]['income'] = float(item['income'] or 0)
        
        # Process expense transactions
        expense_by_date = current_period_transactions.filter(
            category__type='expense'
        ).annotate(
            date_group=grouping_func('date')
        ).values('date_group').annotate(
            expense=Sum('amount')
        ).order_by('date_group')
        
        for item in expense_by_date:
            date_str = item['date_group'].strftime(date_format)
            if date_str not in income_expenses_by_date:
                income_expenses_by_date[date_str] = {'income': 0, 'expense': 0}
            income_expenses_by_date[date_str]['expense'] = float(item['expense'] or 0)
        
        # Convert to list format for the response
        for date_str, values in income_expenses_by_date.items():
            trend_data.append({
                'date': date_str,
                'income': values['income'],
                'expense': values['expense']
            })
        
        # Fill in missing dates in the range
        if period == 'week':
            expected_days = 7
            all_days = [(start_date + timedelta(days=i)).strftime(date_format) for i in range(expected_days)]
            existing_days = [item['date'] for item in trend_data]
            
            for day in all_days:
                if day not in existing_days:
                    trend_data.append({'date': day, 'income': 0, 'expense': 0})
            
            # Sort by day of week
            day_order = {'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6}
            trend_data.sort(key=lambda x: day_order.get(x['date'], 7))
        
        elif period == 'month':
            # Fill in missing days
            days_in_month = (today - start_date).days + 1
            all_days = [(start_date + timedelta(days=i)).strftime(date_format) for i in range(days_in_month)]
            existing_days = [item['date'] for item in trend_data]
            
            for day in all_days:
                if day not in existing_days:
                    trend_data.append({'date': day, 'income': 0, 'expense': 0})
            
            # Sort by day of month
            try:
                trend_data.sort(key=lambda x: int(x['date'].split('-')[0]) if '-' in x['date'] else 0)
            except (ValueError, IndexError):
                # If sorting fails, just use the original order
                pass
        
        # Generate spending patterns data
        day_patterns = expense_transactions.annotate(
            day_of_week=ExtractWeekDay('date')
        ).values('day_of_week').annotate(
            average_amount=Avg('amount')
        ).order_by('day_of_week')
        
        # Convert day numbers to names
        day_names = {
            1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun'
        }
        
        spending_patterns = []
        for pattern in day_patterns:
            day_name = day_names.get(pattern['day_of_week'], 'Unknown')
            spending_patterns.append({
                'day_of_week': day_name,
                'average_amount': float(pattern['average_amount'] or 0)
            })
        
        # Fill in missing days of the week for the spending patterns
        existing_days = [pattern['day_of_week'] for pattern in spending_patterns]
        for day_num, day_name in day_names.items():
            if day_name not in existing_days:
                spending_patterns.append({
                    'day_of_week': day_name,
                    'average_amount': 0
                })
        
        # Sort by day of week
        spending_patterns.sort(key=lambda x: list(day_names.values()).index(x['day_of_week']) if x['day_of_week'] in day_names.values() else 7)
        
        # Generate insights based on data analysis
        insights = []
        
        # Insight 1: Highest spending category
        if category_breakdown:
            highest_category = category_breakdown[0]
            insights.append({
                'title': f'Top Spending Category: {highest_category["category"]}',
                'description': f'Your highest spending is in {highest_category["category"]} at ${highest_category["amount"]:.2f} this {period}.'
            })
        
        # Insight 2: Day of week spending pattern
        if spending_patterns:
            top_day = max(spending_patterns, key=lambda x: x['average_amount'])
            if top_day['average_amount'] > 0:
                insights.append({
                    'title': f'Spending Peak: {top_day["day_of_week"]}',
                    'description': f'You tend to spend more on {top_day["day_of_week"]}days, averaging ${top_day["average_amount"]:.2f}.'
                })
        
        # Insight 3: Savings rate
        if savings_rate > 0:
            if savings_rate >= 20:
                message = "Excellent savings rate! Keep up the good work."
            elif savings_rate >= 10:
                message = "Good savings rate. Consider setting aside a bit more if possible."
            else:
                message = "Your savings rate is low. Try to reduce expenses or increase income."
            
            insights.append({
                'title': f'Savings Rate: {savings_rate}%',
                'description': message
            })
        
        # Insight 4: Income vs Expense trend
        if income_sum > 0 and expense_sum > 0:
            expense_income_ratio = (expense_sum / income_sum) * 100
            if expense_income_ratio > 90:
                insights.append({
                    'title': 'High Expense Ratio',
                    'description': f'Your expenses are {expense_income_ratio:.1f}% of your income. Try to lower expenses to improve your savings.'
                })
            elif expense_income_ratio < 70:
                insights.append({
                    'title': 'Low Expense Ratio',
                    'description': f'Great job keeping expenses low at {expense_income_ratio:.1f}% of your income.'
                })
        
        # Get recent transactions
        recent_transactions = current_period_transactions.order_by('-date')[:5]
        recent_transactions_data = [
            {
                'id': tx.id,
                'amount': float(tx.amount),
                'type': tx.category.type,
                'category': tx.category.name,
                'date': tx.date.strftime('%Y-%m-%d')
            } for tx in recent_transactions
        ]
        
        # Combine all data
        response_data = {
            'stats': {
                'total_income': float(income_sum),
                'total_expense': float(expense_sum),
                'balance': float(balance),
                'income_change': income_change,
                'expense_change': expense_change,
                'savings_rate': savings_rate
            },
            'category_breakdown': category_breakdown,
            'trends': trend_data,
            'spending_patterns': spending_patterns,
            'insights': insights,
            'recent_transactions': recent_transactions_data
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