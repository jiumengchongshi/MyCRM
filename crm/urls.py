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
    path('api/announcements/', views.announcements, name='announcements'),
    path('api/customerorders/', views.customer_orders, name='customer_orders'),

]
