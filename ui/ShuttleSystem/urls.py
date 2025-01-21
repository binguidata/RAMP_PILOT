from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('account.urls')),
    path('api/', include('payment.urls')),
    path('api/', include('reservation.urls')),
    path('api/', include('shuttle.urls')),
    path('api/', include('bus.urls')),
    path('api/', include('dialin.urls')),
    path('api/', include('feedback.urls')),
    *static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
]

if settings.DEBUG:
    urlpatterns.append(path("__debug__/", include("debug_toolbar.urls")))
