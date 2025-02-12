# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    SECURITY_QUESTIONS = [
        ("pet", "What is the name of your first pet?"),
        ("city", "In what city were you born?"),
        ("school", "What is the name of your first school?"),
    ]
    
    security_question = models.CharField(max_length=50, choices=SECURITY_QUESTIONS)
    security_answer = models.CharField(max_length=255)

    def check_security_answer(self, answer):
        """
        Check the provided answer against the stored security answer.
        This simple implementation does a case-insensitive comparison.
        """
        return self.security_answer.strip().lower() == answer.strip().lower()
