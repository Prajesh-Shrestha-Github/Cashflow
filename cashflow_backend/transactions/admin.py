from django.contrib import admin
from .models import Transaction, Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'description')
    list_filter = ('type',)
    search_fields = ('name', 'description')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'amount', 'category', 'is_recurring')
    list_filter = ('date', 'category', 'is_recurring')
    search_fields = ('description', 'user__username')
    date_hierarchy = 'date'