from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from . import service
from .parser import MAX_TEXT


class IngestThrottle(UserRateThrottle):
    rate = "120/hour"


class IngestView(APIView):
    """Raw text in, transaction out. The capture token works here and nowhere else."""
    authentication_classes = (TokenAuthentication, JWTAuthentication)
    throttle_classes = (IngestThrottle,)

    def post(self, request):
        text = request.data.get("text")
        if not isinstance(text, str) or not text.strip() or len(text) > MAX_TEXT:
            return Response({"error": f"Send the message as 'text' (up to {MAX_TEXT} characters)."},
                            status=status.HTTP_400_BAD_REQUEST)
        state, saved = service.ingest(request.user, text)
        if saved is None:
            return Response({"status": state})
        return Response({"status": state, "transaction": {
            "id": saved.id, "date": saved.date.isoformat(), "amount": f"{saved.amount:.2f}",
            "direction": "in" if saved.category.type == "income" else "out", "description": saved.description,
        }}, status=status.HTTP_201_CREATED)


class TokenView(APIView):
    """The signed-in user's capture token. Login (JWT) only: the token cannot fetch or revoke itself."""

    def post(self, request):
        token, _ = Token.objects.get_or_create(user=request.user)
        return Response({"token": token.key})

    def delete(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
