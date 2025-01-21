from django.urls import path
from shuttle import views

# create your urls here.
urlpatterns = [
    path('shuttle/uploadShuttleLocation', views.shuttle_location_create),
    path('shuttle/driverlogincreate',views.shuttle_driverlogin_create),
    path('shuttle/view', views.shuttle_location_list),
    path('shuttle/getShuttleRoute', views.shuttle_route_list),
    path('shuttle/getDriverInfo', views.get_driver_info),
    path('shuttle/updateDriverInfo', views.update_driver_info),
    path('shuttle/generateShuttleEmergencyMessage', views.generate_shuttle_emergency_message),
]
