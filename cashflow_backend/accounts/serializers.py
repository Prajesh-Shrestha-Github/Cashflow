# accounts/serializers.py
from .models import CustomUser
from rest_framework import serializers


class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'security_question', 'security_answer']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user

    
class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

class PasswordResetWithSecuritySerializer(serializers.Serializer):
    username = serializers.CharField()
    security_answer = serializers.CharField(write_only=True, style={'input_type': 'password'})
    new_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        try:
            user = CustomUser.objects.get(username=data['username'])
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User not found.")

        if not user.check_security_answer(data['security_answer']):
            raise serializers.ValidationError("Incorrect security answer.")

        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")

        return data

    def save(self):
        user = CustomUser.objects.get(username=self.validated_data['username'])
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user

