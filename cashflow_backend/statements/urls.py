from django.urls import path

from .views import ImportView, PreviewView

urlpatterns = [
    path('preview/', PreviewView.as_view(), name='statement-preview'),
    path('import/', ImportView.as_view(), name='statement-import'),
]
