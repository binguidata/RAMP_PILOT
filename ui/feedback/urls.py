from django.urls import path
from feedback import views


# create your urls here.
urlpatterns = [
    path('feedback/create/', views.create_feedback),
    path('feedback/view', views.list_feedback),
    path('feedback/view/<int:pk>/', views.get_feedback),
]
