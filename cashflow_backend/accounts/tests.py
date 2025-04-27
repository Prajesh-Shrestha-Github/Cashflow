from django.test import SimpleTestCase, tag
from rest_framework.validators import UniqueValidator
from accounts.serializers import RegisterSerializer, LoginSerializer, ChangePasswordSerializer

# Create your tests here.

# Isolated serializer validation tests with SimpleTestCase (no database)
@tag('isolated')
class RegisterSerializerValidationTest(SimpleTestCase):
    def setUp(self):
        self.data = {
            'username': 'testuser',
            'password': 'password123',
            'password2': 'password456',
            'email': 'test@example.com'
        }

    def _strip_unique(self, serializer):
        for field_name in ('username', 'email'):
            field = serializer.fields.get(field_name)
            if field:
                field.validators = [v for v in field.validators if not isinstance(v, UniqueValidator)]

    def test_password_mismatch(self):
        serializer = RegisterSerializer(data=self.data)
        self._strip_unique(serializer)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_weak_password(self):
        data = self.data.copy()
        data.update({'password': '123', 'password2': '123'})
        serializer = RegisterSerializer(data=data)
        self._strip_unique(serializer)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

@tag('isolated')
class LoginSerializerValidationTest(SimpleTestCase):
    def test_missing_fields(self):
        serializer = LoginSerializer(data={'username': 'testuser'})
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_valid_data(self):
        serializer = LoginSerializer(data={'username': 'testuser', 'password': 'pass'})
        self.assertTrue(serializer.is_valid())

@tag('isolated')
class ChangePasswordSerializerValidationTest(SimpleTestCase):
    def test_new_password_validation(self):
        serializer = ChangePasswordSerializer(data={'old_password': 'old', 'new_password': '123'})
        self.assertFalse(serializer.is_valid())
        self.assertIn('new_password', serializer.errors)
        
        # Test with valid password
        serializer = ChangePasswordSerializer(data={'old_password': 'old', 'new_password': 'ComplexPass123!'})
        self.assertTrue(serializer.is_valid())
