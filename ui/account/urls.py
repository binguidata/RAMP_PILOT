from django.urls import path
from account import views


# create your urls here.
urlpatterns = [
    path('register', views.user_register, name='register'),
    path('hello', views.auth_hello),
    path('account/profile', views.fetch_profile),
    path('account/modify', views.modify_profile),
    path('token', views.MyTokenObtainPairView.as_view(), name='token_pair'),
    path('token/refresh', views.MyTokenObtainPairView.as_view(), name='token_refresh'),
    path('forget_password', views.forget_password, name='forget_password'),
    path('view_customers', views.view_all_customers),
    path('view_drivers', views.view_all_drivers),
    path('view_managers', views.view_all_managers),
    path('modify_driver_role', views.modify_driver_role),
]
