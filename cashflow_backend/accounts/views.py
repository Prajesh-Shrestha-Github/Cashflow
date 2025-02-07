# accounts/views.py
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.authtoken.models import Token  # optional: token-based auth
from rest_framework.permissions import AllowAny

from .serializers import UserRegistrationSerializer, UserLoginSerializer

# Option 1: Using Django REST Framework’s built-in Token Authentication.
# Make sure to install and add 'rest_framework.authtoken' to your INSTALLED_APPS if you go this route.
# pip install djangorestframework-authtoken
# Then run: python manage.py migrate authtoken

class RegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Optionally, create a token if you are using token authentication.
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "user": serializer.data,
            "token": token.key
        }, status=status.HTTP_201_CREATED)

class LoginView(views.APIView):
    permission_classes = [AllowAny]
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "username": user.username,
            }, status=status.HTTP_200_OK)
        return Response({"error": "Invalid Credentials"}, status=status.HTTP_400_BAD_REQUEST)
