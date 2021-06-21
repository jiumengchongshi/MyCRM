from django.urls import path
from . import views


app_name = 'crm'


urlpatterns = [
    path('', views.login, name='login'),
    path('customer/', views.customer, name='customer'),
    path('service/', views.service, name='service'),
    path('customermanager/', views.customer_manager, name='customer_manager'),
    path('servicemanager/', views.service_manager, name='service_manager'),
    path('logout/', views.logout, name='logout'),
    path('api/announcements/', views.announcements, name='api_announcements'),
    path('api/handover/', views.handover, name='api_handover'),
    path('api/orders/', views.Orders.as_view(), name='api_orders'),
    path('api/orders/<int:z_number>/', views.Orders.as_view(), name='api_order'),
    path('api/comments/', views.comments, name='api_comments'),
    path('api/users/', views.Users.as_view(), name='api_users'),
    path('api/users/<str:role>/', views.Users.as_view(), name='api_usersByRole'),
    path('api/paused_districts/', views.PausedDistricts.as_view(), name='api_paused_districts'),
    path('api/shops/', views.Shops.as_view(), name='api_shops'),
    path('api/groups/', views.group, name='api_group'),

]
