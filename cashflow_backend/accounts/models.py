# accounts/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    """Extended user model with additional profile information"""
    is_admin = models.BooleanField(default=False)
    profile_picture = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, default='active')
    
    def __str__(self):
        return self.username

class Session(models.Model):
    """User session management"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=255)
    expiry_date = models.DateTimeField()
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.user.username} - {self.created_at}"