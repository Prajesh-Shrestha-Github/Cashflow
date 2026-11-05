from django.urls import path

from .views import RecapView, SaveWhatIfGoalsView, ScoreView, WhatIfView

urlpatterns = [
    path('', ScoreView.as_view(), name='money-score'),
    path('what-if/', WhatIfView.as_view(), name='money-score-what-if'),
    path('what-if/goals/', SaveWhatIfGoalsView.as_view(), name='money-score-what-if-goals'),
    path('recap/', RecapView.as_view(), name='money-score-recap'),
]
