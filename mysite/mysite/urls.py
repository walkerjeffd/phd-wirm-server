from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('mysite.views',
    url(r'^$', 'index'),
    url(r'^client/', 'client'),
    url(r'^theory/', 'theory'),
    # url(r'^background/', 'background'),
    url(r'^tutorial/', 'tutorial'),
    url(r'^about/', 'about'),
    url(r'^api/', include('wirm.urls')),
    url(r'^accounts/', include('registration.backends.default.urls')),
    url(r'^admin/', include(admin.site.urls)),
)
