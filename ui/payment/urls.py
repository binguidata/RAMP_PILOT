from django.urls import path
from payment import views


# create your urls here.
urlpatterns = [
    path('payment/redeem', views.redeem_coupon),
    path('payment/generate_coupon', views.generate_coupon),
    path('payment/paypal_amount_update', views.paypal_amount_update, name='paypal_amount_update'),
    path('payment/customers/', views.get_customers, name='get_customers'),
    path('payment/allocate_coupon', views.allocate_coupon, name='generate_coupon'),
]
