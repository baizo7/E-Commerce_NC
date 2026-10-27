"""
URL configuration for marketplace_core project.
Provides both /api/v1/ (v1.1 specification) and /api/ prefixes.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView
)

api_v1_patterns = [
    path('', include('apps.accounts.urls')),
    path('', include('apps.products.urls')),
    path('', include('apps.orders.urls')),
    path('', include('apps.analytics.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Documentation (Swagger & OpenAPI 3)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Modular App APIs under /api/v1/ (v1.1 standard) and /api/ (backward compatible)
    path('api/v1/', include(api_v1_patterns)),
    path('api/', include(api_v1_patterns)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
