from django.urls import path
from bus import views


urlpatterns = [
    path('bus/createCount', views.onBoard_create),
    path('bus/uploadBusLocation',views.bus_location_create),
    path('bus/getDriverInfo', views.get_driver_info),
    path('bus/generateBusEmergencyMessage', views.generate_bus_emergency_message),
    path('bus/createBus/', views.bus_create),
    path('bus/viewAll/', views.get_all_buses),
    path('bus/view/<int:pk>/', views.get_bus),
    path('bus/<int:pk>/update/', views.update_bus),
    path('bus/<int:pk>/delete/', views.delete_bus),
]
