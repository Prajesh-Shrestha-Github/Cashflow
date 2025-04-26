# transactions/management/commands/update_recurring_transactions.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from transactions.models import Transaction
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Update next due dates for recurring transactions that have passed'
    
    def handle(self, *args, **options):
        today = timezone.now().date()
        
        # Get all recurring transactions with a next_due_date in the past
        due_transactions = Transaction.objects.filter(
            is_recurring=True,
            next_due_date__lt=today
        )
        
        updated_count = 0
        
        for transaction in due_transactions:
            # Keep track of original due date for logging
            original_date = transaction.next_due_date
            
            # Update the next due date based on frequency
            transaction.update_next_due_date()
            
            # Log the update
            logger.info(
                f"Updated recurring transaction {transaction.id}: "
                f"{transaction.description} from {original_date} to {transaction.next_due_date}"
            )
            
            updated_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} recurring transactions')
        )
