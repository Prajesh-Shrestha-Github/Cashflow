"""Whose money, and which pot of it. Plan: docs/PLAN.md ("Workspaces from day one")."""
from django.db import models
from django.db.models import Q

from accounts.models import User


class Workspace(models.Model):
    """One set of books: a person's own money, or a business they run."""
    KIND_CHOICES = [
        ('personal', 'Personal'),
        ('business', 'Business'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workspaces')
    name = models.CharField(max_length=100)
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default='personal')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['owner'], condition=Q(kind='personal'), name='one_personal_workspace_per_user'),
        ]

    def __str__(self):
        return f"{self.owner.username} - {self.name}"


class Account(models.Model):
    """A bank account, wallet or cash pot inside a workspace."""
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    identifier = models.CharField(max_length=20, blank=True, default='')   # the digits the bank shows, e.g. "1769"
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['workspace', 'identifier'], condition=~Q(identifier=''),
                                    name='one_account_per_identifier'),
        ]

    def __str__(self):
        return self.name


def personal_workspace(user):
    return Workspace.objects.get_or_create(owner=user, kind='personal', defaults={'name': 'Personal'})[0]
