import csv
import io
from decimal import Decimal, InvalidOperation
from datetime import datetime
from .models import Category, Transaction

def get_or_create_category(name, transaction_type):
    """Get existing category or create a new one based on the transaction type"""
    category, created = Category.objects.get_or_create(
        name=name,
        defaults={'type': transaction_type}
    )
    return category

def process_csv_file(csv_file, user):
    """Process CSV file with financial transactions"""
    
    decoded_file = csv_file.read().decode('utf-8')
    io_string = io.StringIO(decoded_file)
    reader = csv.DictReader(io_string)
    
    transactions = []
    errors = []
    
    # Define column mapping (assuming standard CSV format - adjust based on your needs)
    # Expected format: date, description, amount, category (optional)
    
    for row_num, row in enumerate(reader, start=1):
        try:
            # Extract data from row
            date_str = row.get('date', '')
            description = row.get('description', '')
            amount_str = row.get('amount', '0')
            category_name = row.get('category', 'Uncategorized')
            
            # Format the date
            try:
                # Try different date formats (adjust as needed)
                date_formats = ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']
                date_obj = None
                
                for fmt in date_formats:
                    try:
                        date_obj = datetime.strptime(date_str, fmt).date()
                        break
                    except ValueError:
                        continue
                
                if not date_obj:
                    raise ValueError(f"Date format not recognized: {date_str}")
            
            except ValueError as e:
                errors.append(f"Row {row_num}: {str(e)}")
                continue
            
            # Parse amount
            try:
                # Remove any currency symbols and handle commas
                amount_str = amount_str.replace('$', '').replace(',', '')
                amount = Decimal(amount_str)
                
                # Determine transaction type based on amount
                transaction_type = 'income' if amount >= 0 else 'expense'
                
                # Make amount positive for expense transactions
                if transaction_type == 'expense' and amount < 0:
                    amount = abs(amount)
                
            except (ValueError, InvalidOperation) as e:
                errors.append(f"Row {row_num}: Invalid amount format - {str(e)}")
                continue
            
            # Get or create category
            category = get_or_create_category(category_name, transaction_type)
            
            # Create transaction
            transaction = Transaction(
                user=user,
                date=date_obj,
                amount=amount,
                category=category,
                description=description
            )
            
            transactions.append(transaction)
            
        except Exception as e:
            errors.append(f"Row {row_num}: Unexpected error - {str(e)}")
    
    # Bulk create transactions
    if transactions:
        Transaction.objects.bulk_create(transactions)
    
    return {
        'imported_count': len(transactions),
        'errors': errors
    }