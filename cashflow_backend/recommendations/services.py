import os
import requests
from dotenv import load_dotenv
from django.conf import settings
from django.db.models import Sum
from transactions.models import Transaction, Category
from financial_goals.models import FinancialGoal, FinancialHealth
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from .models import DailyRequestCounter

# Load API key from environment variables
load_dotenv()
ROUTER_API_KEY = os.getenv("ROUTER_API_KEY")

if ROUTER_API_KEY is None:
    raise ValueError("ROUTER_API_KEY not found. Please check your .env file.")

class AIRecommendationService:
    def __init__(self):
        self.api_key = ROUTER_API_KEY
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Cashflow App (Development)",
            "Content-Type": "application/json"
        }

    def check_rate_limit(self, user):
        """
        Check if user has exceeded their daily limit of 3 requests
        Returns (bool, int): (has_remaining_requests, requests_remaining)
        """
        today = timezone.now().date()
        
        # Get or create the counter for today
        counter, created = DailyRequestCounter.objects.get_or_create(
            user=user,
            date=today,
            defaults={'count': 0}
        )
        
        # Check if user has reached their limit
        if counter.count >= 3:
            return False, 0
        
        # Return True with remaining requests
        return True, 3 - counter.count
    
    def increment_request_counter(self, user):
        """Increment the user's request counter for today"""
        today = timezone.now().date()
        
        with transaction.atomic():
            counter, created = DailyRequestCounter.objects.get_or_create(
                user=user,
                date=today,
                defaults={'count': 1}
            )
            
            if not created:
                counter.count += 1
                counter.save()
                
        return counter.count

    def get_user_financial_summary(self, user):
        """Get comprehensive financial summary for the user to provide context to the AI"""

        # Start with full queryset, apply filters and order, then slice
        base_transactions = Transaction.objects.filter(user=user).order_by('-date')
        recent_transactions = base_transactions[:20]

        # Preload categories to avoid hitting DB multiple times
        income_categories = list(Category.objects.filter(type='income'))
        expense_categories = list(Category.objects.filter(type='expense'))

        # Filter BEFORE slicing
        income_transactions = base_transactions.filter(category__in=income_categories)[:20]
        expense_transactions = base_transactions.filter(category__in=expense_categories)[:20]
        uncategorized_transactions = base_transactions.filter(category__isnull=True)[:20]

        total_income = sum(t.amount for t in income_transactions)
        total_expenses = sum(abs(t.amount) for t in expense_transactions)

        # Add uncategorized income/expenses
        for t in uncategorized_transactions:
            if t.amount > 0:
                total_income += t.amount
            else:
                total_expenses += abs(t.amount)

        # Top spending categories
        categories = {}
        for t in expense_transactions:
            name = t.category.name if t.category else 'Uncategorized'
            categories[name] = categories.get(name, 0) + abs(t.amount)

        uncategorized_expenses = sum(abs(t.amount) for t in uncategorized_transactions if t.amount < 0)
        if uncategorized_expenses > 0:
            categories['Uncategorized'] = categories.get('Uncategorized', 0) + uncategorized_expenses

        top_spending = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]

        # Financial goals
        goals = FinancialGoal.objects.filter(user=user, status='in_progress').order_by('target_date')[:3]
        user_goals = []
        for goal in goals:
            user_goals.append({
                "title": goal.title,
                "goal_type": goal.goal_type,
                "current_amount": float(goal.current_amount),
                "target_amount": float(goal.target_amount),
                "target_date": goal.target_date,
                "days_remaining": goal.days_remaining,
                "progress_percentage": float(goal.completion_percentage)
            })

        # Recurring transactions
        recurring_expenses = base_transactions.filter(is_recurring=True, amount__lt=0).order_by('amount')[:5]
        recurring = []
        for expense in recurring_expenses:
            recurring.append({
                "description": expense.description,
                "amount": abs(float(expense.amount)),
                "category": expense.category.name if expense.category else "Uncategorized"
            })

        # Financial health
        try:
            financial_health = FinancialHealth.objects.filter(user=user).order_by('-month')[0]
            health_info = {
                "health_status": financial_health.health_status,
                "savings_rate": float(financial_health.savings_rate),
                "income_expense_ratio": float(financial_health.income_expense_ratio)
            }
        except (IndexError, FinancialHealth.DoesNotExist):
            health_info = None

        return {
            "income": float(total_income),
            "expenses": float(total_expenses),
            "balance": float(total_income - total_expenses),
            "top_spending": [(cat, float(amt)) for cat, amt in top_spending],
            "financial_goals": user_goals,
            "recurring_expenses": recurring,
            "financial_health": health_info
        }

    def generate_recommendation(self, user, query, sarcasm_level=0):
        """Generate financial recommendation with optional sarcasm"""
        # Check if user has remaining requests for today
        has_requests, remaining = self.check_rate_limit(user)
        if not has_requests:
            return "You've reached your daily limit of 3 AI recommendations. Please try again tomorrow!"
            
        try:
            financial_summary = self.get_user_financial_summary(user)

            goals_section = ""
            if financial_summary['financial_goals']:
                goals_section = "Financial Goals:\n"
                for goal in financial_summary['financial_goals']:
                    goals_section += (
                        f"- {goal['title']} ({goal['goal_type']}): "
                        f"${goal['current_amount']:.2f} / ${goal['target_amount']:.2f} "
                        f"({goal['progress_percentage']:.1f}% complete, {goal['days_remaining']} days remaining)\n"
                    )

            recurring_section = ""
            if financial_summary['recurring_expenses']:
                recurring_section = "Recurring Expenses:\n"
                for expense in financial_summary['recurring_expenses']:
                    recurring_section += f"- {expense['description']} (${expense['amount']:.2f} - {expense['category']})\n"

            health_section = ""
            if financial_summary['financial_health']:
                health = financial_summary['financial_health']
                health_section = f"""Financial Health Status: {health['health_status'].title()}
                - Savings Rate: {health['savings_rate']:.2f}%
                - Income-to-Expense Ratio: {health['income_expense_ratio']:.2f}
                """

            system_message = f"""You are a financial advisor AI for the Cashflow app. 
            Provide helpful financial advice based on the user's financial data.
            
            User's Financial Summary:
            - Monthly Income: ${financial_summary['income']:.2f}
            - Monthly Expenses: ${financial_summary['expenses']:.2f}
            - Current Balance: ${financial_summary['balance']:.2f}
            - Top spending categories: {', '.join([f'{cat}: ${amt:.2f}' for cat, amt in financial_summary['top_spending']])}
            
            {health_section}
            {goals_section}
            {recurring_section}
            
            Sarcasm Level: {sarcasm_level}/5
            
            If sarcasm level is 0, be completely professional and helpful.
            If sarcasm level is 1-2, add mild humor and slight sarcasm.
            If sarcasm level is 3-4, be moderately sarcastic while still providing useful advice.
            If sarcasm level is 5, be very sarcastic but ensure advice is still useful.
            
            Always provide actionable financial advice based on their data and query.
            When appropriate, refer to their financial goals and suggest ways to meet them.
            If they have high spending in certain categories, suggest ways to reduce expenses.
            If their financial health status is available, mention it and provide relevant advice.
            Keep responses concise (max 250 words).
            """

            response = requests.post(
                self.base_url,
                headers=self.headers,
                json={
                    "model": "deepseek/deepseek-chat-v3-0324:free",
                    "messages": [
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": query}
                    ]
                }
            )

            if response.status_code != 200:
                print(f"API Error: {response.status_code} - {response.text}")
                return "Sorry, I couldn't generate a recommendation. Please try again."

            # Increment the counter since we got a successful response
            self.increment_request_counter(user)
            
            response_data = response.json()
            return response_data["choices"][0]["message"]["content"]

        except Exception as e:
            print(f"Error generating recommendation: {e}")
            return "Sorry, an error occurred while generating your recommendation. Please try again later."

    def test_api_connection(self):
        """Test the API connection to OpenRouter"""
        try:
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json={
                    "model": "deepseek/deepseek-chat-v3-0324:free",
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant."},
                        {"role": "user", "content": "Say hello!"}
                    ]
                }
            )

            if response.status_code == 200:
                return True, "API connection successful!"
            else:
                return False, f"API Error: {response.status_code} - {response.text}"

        except Exception as e:
            return False, f"Connection error: {str(e)}"