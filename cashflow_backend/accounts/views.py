from django.contrib.auth import authenticate, get_user_model
from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django_rest_passwordreset.models import ResetPasswordToken
from django_rest_passwordreset.signals import reset_password_token_created
from django.core.mail import send_mail
from django.conf import settings
from .models import Session
from .serializers import (
    UserSerializer, 
    RegisterSerializer, 
    LoginSerializer, 
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer
)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(username=username, password=password)
            
            if user:
                refresh = RefreshToken.for_user(user)
                
                # Create or update session
                session = Session.objects.create(
                    user=user,
                    token=str(refresh),
                    expiry_date=timezone.now() + timezone.timedelta(days=1),
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                user_logged_in.send(sender=user.__class__, request=request, user=user)
                
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                })
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class UserDetailsView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({'old_password': ['Wrong password.']}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Update sessions
            Session.objects.filter(user=user).delete()
            
            return Response({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            print("Validated Data:", serializer.validated_data)  # Debugging line
            
            token = serializer.validated_data.get('token')
            new_password = serializer.validated_data.get('password')

            if not new_password:
                return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                reset_token = ResetPasswordToken.objects.get(key=token)
            except ResetPasswordToken.DoesNotExist:
                return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

            user = reset_token.user
            user.set_password(new_password)
            user.save()

            # Delete token after successful reset
            reset_token.delete()

            return Response({'message': 'Password reset successfully.'}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    def post(self, request):
        try:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if 'Bearer' in auth_header:
                token = auth_header.split(' ')[1]
                Session.objects.filter(token__contains=token).delete()
            
            return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    email_plaintext_message = f"""
    Hello,
    
    You have requested to reset your password. Please use the token below to reset your password:
    
    {reset_password_token.key}
    
    This token is valid for 24 hours.
    
    If you did not request this, please ignore this email.
    
    Best regards,
    Cashflow Team
    """
    
    send_mail(
        "Password Reset for Cashflow",
        email_plaintext_message,
        settings.DEFAULT_FROM_EMAIL,
        [reset_password_token.user.email]
    )
