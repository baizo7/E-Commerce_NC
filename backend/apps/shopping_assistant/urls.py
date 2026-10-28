from django.urls import path
from apps.shopping_assistant.views import (
    ChatEndpointView,
    ChatHistoryView,
    AssistantDiscountsView,
    AssistantPriceHistoryView,
    AssistantTopRatedView,
    AssistantRecommendView
)

urlpatterns = [
    path('assistant/chat/', ChatEndpointView.as_view(), name='assistant_chat'),
    path('assistant/chat/history/', ChatHistoryView.as_view(), name='assistant_chat_history'),
    path('assistant/discounts/', AssistantDiscountsView.as_view(), name='assistant_discounts'),
    path('assistant/price-history/', AssistantPriceHistoryView.as_view(), name='assistant_price_history'),
    path('assistant/top-rated/', AssistantTopRatedView.as_view(), name='assistant_top_rated'),
    path('assistant/recommend/', AssistantRecommendView.as_view(), name='assistant_recommend'),
]
