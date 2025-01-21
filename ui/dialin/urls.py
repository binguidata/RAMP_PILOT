from django.urls import path
from dialin import views


# create your urls here.
urlpatterns = [
    path('dialin-users/view', views.dialin),
    path('dialin-users/create/', views.dialin),
    path('dialin-users/update/<int:pk>/', views.dialin),
    path('dialin-users/delete/<int:pk>/', views.dialin),
]
