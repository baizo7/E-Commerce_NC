"""
URL configuration for marketplace_core project.
Provides both /api/v1/ (v1.1 specification) and /api/ prefixes.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
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
    path('', include('apps.shopping_assistant.urls')),
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

# Media handling fallback when not using AWS S3 (serves media in both dev and production)
if not getattr(settings, 'USE_S3', False):
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
