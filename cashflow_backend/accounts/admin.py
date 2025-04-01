# accounts/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Session

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_admin', 'is_staff', 'status')
    list_filter = ('is_admin', 'is_staff', 'status')
    fieldsets = UserAdmin.fieldsets + (
        ('Profile Info', {'fields': ('profile_picture', 'status')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Profile Info', {'fields': ('profile_picture', 'status')}),
    )

admin.site.register(User, CustomUserAdmin)

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'expiry_date', 'ip_address', 'created_at')
    list_filter = ('created_at', 'expiry_date')
    search_fields = ('user__username', 'ip_address')