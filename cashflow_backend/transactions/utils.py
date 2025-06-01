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
    decoded_file = csv_file.read().decode('utf-8')
    io_string = io.StringIO(decoded_file)
    
    # Validate CSV structure first
    try:
        reader = csv.DictReader(io_string)
        
        # Check if the CSV has the required headers
        required_headers = ['date', 'amount']
        headers = reader.fieldnames
        
        if not headers:
            return {
                'imported_count': 0,
                'errors': ["CSV file appears to be empty or has no headers."]
            }
        
        # Check for missing required headers
        missing_headers = [header for header in required_headers if header not in headers]
        if missing_headers:
            return {
                'imported_count': 0,
                'errors': [f"Missing required columns: {', '.join(missing_headers)}. Your CSV must have at least 'date' and 'amount' columns."]
            }
        
        # Reset the file pointer to the beginning
        io_string.seek(0)
        reader = csv.DictReader(io_string)
    except Exception as e:
        return {
            'imported_count': 0,
            'errors': [f"CSV parsing error: {str(e)}. Please check your CSV format."]
        }
    
    transactions = []
    errors = []
    
    # Check if there's at least one row of data
    has_data = False
    
    for row_num, row in enumerate(reader, start=1):
        has_data = True
        try:
            # Extract data from row
            date_str = row.get('date', '')
            description = row.get('description', '')
            amount_str = row.get('amount', '0')
            category_name = row.get('category_name', row.get('category', 'Uncategorized'))
            is_recurring_str = row.get('is_recurring', '').lower()
            
            # Validate required fields
            if not date_str.strip():
                errors.append(f"Row {row_num}: Missing date value")
                continue
                
            if not amount_str.strip():
                errors.append(f"Row {row_num}: Missing amount value")
                continue
            
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
                    raise ValueError(f"Date format not recognized: '{date_str}'. Please use YYYY-MM-DD format.")
            
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
                
                # Keep the original amount value (positive for income, negative for expense)
                # but store the absolute value in the database
                original_amount = amount
                if amount < 0:
                    amount = abs(amount)
                
            except (ValueError, InvalidOperation) as e:
                errors.append(f"Row {row_num}: Invalid amount format '{amount_str}' - {str(e)}")
                continue
            
            # Get or create category with the correct transaction type
            try:
                category = get_or_create_category(category_name, transaction_type)
            except Exception as e:
                errors.append(f"Row {row_num}: Invalid category '{category_name}' - {str(e)}")
                continue
            
            # Parse is_recurring flag
            is_recurring = is_recurring_str in ('true', 'yes', '1', 't', 'y')
            
            # Create transaction
            transaction = Transaction(
                user=user,
                date=date_obj,
                amount=amount,
                category=category,
                description=description,
                is_recurring=is_recurring
            )
            
            transactions.append(transaction)
            
        except Exception as e:
            errors.append(f"Row {row_num}: Unexpected error - {str(e)}")
    
    if not has_data:
        errors.append("CSV file contains headers but no data rows.")
    
    # Bulk create transactions
    if transactions:
        try:
            Transaction.objects.bulk_create(transactions)
        except Exception as e:
            errors.append(f"Database error while saving transactions: {str(e)}")
            return {
                'imported_count': 0,
                'errors': errors
            }
    
    return {
        'imported_count': len(transactions),
        'errors': errors
    }