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
    path('api/order/<int:z_number>/', views.order, name='order'),

]
