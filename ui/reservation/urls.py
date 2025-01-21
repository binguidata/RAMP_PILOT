from django.urls import path
from reservation import views


# create your urls here.
urlpatterns = [
    path('reservation/create', views.transaction_create),
    path('reservation/create_multiple', views.multiple_transactions),
    path('reservation/recommend', views.recommend_route),
    path('reservation/view', views.transaction_list),
    path('reservation/viewShuttle', views.transaction_list_shuttle),
    path('reservation/viewAll', views.transaction_list_all),
    path('reservation/viewRecent', views.transaction_list_recent_and_future),
    path('reservation/action', views.transaction_action),
    path('reservation/checkModify', views.check_modify),
    path('reservation/serviceArea', views.check_service_area),
    path('reservation/history_list', views.history_list),
    path('reservation/history_list_create', views.history_list_create),
    path('reservation/history_record', views.get_history_record),
    path('reservation/getShuttleAvailability',views.getShuttleAvailability),
    path('reservation/setShuttleAvailability',views.update_shuttle_allocation),
    path('reservation/getShuttleAll', views.getShuttleAll),
    path('reservation/setShuttlebyId', views.setShuttleById),
    path('reservation/updateShuttle', views.update_shuttle_properties),
    path('reservation/req_calculation',views.req_calculation),
    path('reservation/calculate_cost_dist',views.req_calculation_distance_based_cost),
    path('reservation/getDepoInfo',views.get_depo_info_all),
    path('reservation/set_shuttle/<int:transaction_id>/', views.set_shuttle)
]
