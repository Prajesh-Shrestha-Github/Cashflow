import logging
import os
import requests
from dotenv import load_dotenv
from django.conf import settings
from django.db.models import Sum
from transactions.models import Transaction, Category
from financial_goals_and_health.models import FinancialGoal, FinancialHealth
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from .models import DailyRequestCounter

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Free models rotate on OpenRouter, so we keep a fallback chain instead of one hard-coded id.
# Override with OPENROUTER_MODELS (comma-separated) in .env. Verified available on 2026-11-04.
#  1. gemma-4-31b-it   : stable instruction-tuned chat model, strong multilingual (incl. Nepali), no long "thinking"
#  2. nemotron-3-ultra : largest free model, used if Gemma is rate-limited or gone
#  3. gemma-4-26b-a4b  : smaller Gemma
#  4. openrouter/free  : last resort. Picks a random free model, so answers are less repeatable.
DEFAULT_MODELS = [
    "google/gemma-4-31b-it:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "google/gemma-4-26b-a4b-it:free",
    "openrouter/free",
]


class AIServiceError(Exception):
    """The AI provider could not produce an answer. `user_message` is safe to show to users."""

    def __init__(self, user_message, status_code=503):
        super().__init__(user_message)
        self.user_message = user_message
        self.status_code = status_code


def get_models():
    configured = os.getenv("OPENROUTER_MODELS", "")
    models = [m.strip() for m in configured.split(",") if m.strip()]
    return models or DEFAULT_MODELS


def get_api_key():
    """Read the key at call time (not import time) so adding it to .env does not need a restart."""
    key = (os.getenv("ROUTER_API_KEY") or "").strip()
    if not key:
        load_dotenv(override=True)
        key = (os.getenv("ROUTER_API_KEY") or "").strip()
    return key


class AIRecommendationService:
    def _headers(self, key):
        return {
            "Authorization": f"Bearer {key}",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Cashflow App (Development)",
            "Content-Type": "application/json",
        }

    def _chat(self, messages):
        """Try each model in turn. Returns (text, model_id). Raises AIServiceError."""
        key = get_api_key()
        if not key:
            raise AIServiceError("The AI assistant is not configured yet (missing ROUTER_API_KEY).")

        reloaded = False
        for model in get_models():
            try:
                response = requests.post(
                    OPENROUTER_URL,
                    headers=self._headers(key),
                    json={"model": model, "messages": messages, "temperature": 0.3, "max_tokens": 700},
                    timeout=45,
                )
            except requests.RequestException as exc:
                logger.warning("OpenRouter request failed for %s: %s", model, exc)
                continue

            if response.status_code == 200:
                try:
                    text = response.json()["choices"][0]["message"]["content"]
                except (KeyError, IndexError, TypeError, ValueError):
                    logger.warning("Unexpected response shape from %s", model)
                    continue
                if text and text.strip():
                    logger.info("AI answered with model=%s date=%s", model, timezone.now().date())
                    return text.strip(), model
                logger.warning("Empty answer from %s", model)
                continue

            if response.status_code == 401 and not reloaded:
                # The key may have just been changed in .env: reload once and retry this model.
                reloaded = True
                load_dotenv(override=True)
                new_key = get_api_key()
                if new_key and new_key != key:
                    key = new_key
                    response = requests.post(
                        OPENROUTER_URL, headers=self._headers(key),
                        json={"model": model, "messages": messages, "temperature": 0.3, "max_tokens": 700},
                        timeout=45,
                    )
                    if response.status_code == 200:
                        try:
                            text = response.json()["choices"][0]["message"]["content"]
                            if text and text.strip():
                                return text.strip(), model
                        except (KeyError, IndexError, TypeError, ValueError):
                            pass

            if response.status_code in (401, 403):
                raise AIServiceError("OpenRouter rejected the API key. Check ROUTER_API_KEY in the backend .env file.")
            if response.status_code == 402:
                raise AIServiceError("The OpenRouter account has no credits for this model.")
            # 404 (model removed), 429 (rate limit), 5xx, 400: try the next model
            logger.warning("OpenRouter %s for %s: %s", response.status_code, model, response.text[:200])

        raise AIServiceError("The AI service is busy or unavailable right now. Please try again in a few minutes.")

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

            text, model = self._chat([
                {"role": "system", "content": system_message},
                {"role": "user", "content": query},
            ])

            # Count the request only after a real answer
            self.increment_request_counter(user)
            return text

        except AIServiceError:
            raise
        except Exception:
            logger.exception("Error generating recommendation")
            raise AIServiceError("Something went wrong while generating your recommendation. Please try again later.")

    def test_api_connection(self):
        """Test the API connection to OpenRouter. Returns (ok, message)."""
        try:
            _, model = self._chat([
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say hello!"},
            ])
            return True, f"API connection successful (model: {model})"
        except AIServiceError as exc:
            return False, exc.user_message
