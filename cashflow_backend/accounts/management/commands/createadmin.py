from django.core.management.base import BaseCommand
from accounts.models import User

class Command(BaseCommand):
    help = 'Create an admin user'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Admin username', required=True)
        parser.add_argument('--password', type=str, help='Admin password', required=True)

    def handle(self, *args, **kwargs):
        username = kwargs['username']
        password = kwargs['password']

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f"User '{username}' already exists."))
        else:
            admin_user = User.objects.create_superuser(username=username, password=password)
            admin_user.is_admin = True
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"Admin user '{username}' created successfully."))
