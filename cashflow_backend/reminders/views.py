# reminders/views.py
from rest_framework import viewsets, permissions
from .models import RecurringTransactionReminder
from .serializers import RecurringTransactionReminderSerializer

class RecurringTransactionReminderViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for recurring transaction reminders"""
    serializer_class = RecurringTransactionReminderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only return reminders for the current user's transactions
        return RecurringTransactionReminder.objects.filter(
            transaction__user=self.request.user,
            transaction__category__type='expense'  # Only expense transactions
        ).select_related('transaction')