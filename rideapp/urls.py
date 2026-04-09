from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from core import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    re_path(r'^assets/(?P<path>.*)$', views.serve_static_assets, name='serve_assets'),
    re_path(r'^(?P<filename>[^/]+\.[^/]+)$', views.serve_dist_file, name='serve_dist_file'),
    re_path(r'^(?:.*)/?$', views.frontend_index, name='frontend_index'),
]
