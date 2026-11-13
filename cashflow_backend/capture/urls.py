from django.urls import path

from .views import IngestView, TokenView

urlpatterns = [
    path('ingest/', IngestView.as_view(), name='capture-ingest'),
    path('token/', TokenView.as_view(), name='capture-token'),
]
