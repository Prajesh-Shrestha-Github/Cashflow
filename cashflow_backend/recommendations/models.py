from django.db import models
from django.conf import settings

class Recommendation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    query = models.TextField()
    response = models.TextField()
    sarcasm_level = models.IntegerField(default=0)  # 0-5 scale
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Recommendation for {self.user.username} on {self.created_at.strftime('%Y-%m-%d')}"

    class Meta:
        ordering = ['-created_at']