from django.contrib import admin

from .models import Account, Workspace

admin.site.register(Workspace)
admin.site.register(Account)
