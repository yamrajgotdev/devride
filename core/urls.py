from django.urls import path, re_path
from . import views, api_views

urlpatterns = [
    path('', views.frontend_index, name='index'),
    
    path('ride/request/', api_views.request_ride_api, name='api_request_ride'),
    path('ride/<int:ride_id>/status/', api_views.get_ride_status_api, name='api_ride_status'),
    path('ride/<int:ride_id>/cancel/', api_views.cancel_ride_api, name='api_cancel_ride'),
    path('ride/<int:ride_id>/accept/', api_views.accept_ride_api, name='api_accept_ride'),
    path('ride/<int:ride_id>/start/', api_views.start_ride_api, name='api_start_ride'),
    path('ride/<int:ride_id>/complete/', api_views.complete_ride_api, name='api_complete_ride'),
    path('ride/<int:ride_id>/feedback/', api_views.submit_feedback_api, name='api_feedback'),
    
    path('rides/available/', api_views.available_rides_api, name='api_available_rides'),
    path('driver/<int:driver_id>/rides/', api_views.driver_rides_api, name='api_driver_rides'),
    path('driver/<int:driver_id>/location/', api_views.driver_update_location_api, name='api_driver_location'),
    path('driver/<int:driver_id>/toggle/', api_views.driver_toggle_status_api, name='api_driver_toggle'),
    
    path('address/autocomplete/', api_views.address_autocomplete_api, name='api_address_autocomplete'),
    path('distance/calculate/', api_views.calculate_distance_api, name='api_calculate_distance'),
    
    path('auth/send-otp/', api_views.send_otp_api, name='api_send_otp'),
    path('auth/verify-otp/', api_views.verify_otp_api, name='api_verify_otp'),
    path('user/profile', api_views.user_profile_api, name='api_user_profile'),
    path('user/rides', api_views.user_rides_api, name='api_user_rides'),
    
    path('driver/register/', api_views.driver_register_api, name='api_driver_register'),
    path('driver/send-otp/', api_views.driver_send_otp_api, name='api_driver_send_otp'),
    
    path('request/', views.request_ride, name='request_ride'),
    path('success/', views.success, name='success'),
    
    path('driver/', views.driver_panel, name='driver_panel'),
    path('driver/login/', views.driver_login, name='driver_login'),
    path('ride/<int:ride_id>/accept/', views.accept_ride, name='accept_ride'),
    path('ride/<int:ride_id>/complete/', views.complete_ride, name='complete_ride'),
    path('ride/<int:ride_id>/cancel/', views.cancel_ride, name='cancel_ride'),
    path('ride/<int:ride_id>/status/', views.get_ride_status, name='ride_status'),
    path('driver/<int:driver_id>/toggle/', views.toggle_driver_status, name='toggle_driver_status'),
]
