from django.urls import path
from . import views


app_name = 'crm'


urlpatterns = [
    path('', views.login, name='login'),
    path('customer/', views.customer, name='customer'),
    path('service/', views.service, name='service'),
    path('customermanager/', views.customer_manager, name='customermanager'),
    path('servicemanager/', views.service_manager, name='servicemanager'),
    path('logout/', views.logout, name='logout'),
    path('api/announcements/', views.announcements, name='announcements'),

]
