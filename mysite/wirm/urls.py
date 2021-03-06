from django.conf.urls import patterns, include, url
from rest_framework.urlpatterns import format_suffix_patterns
from wirm import views

urlpatterns = patterns('wirm.views',
    url(r'^$', 'api_root'),
    url(r'^parameters/$', views.ParameterList.as_view(), name='parameters-list'),
    url(r'^parameters/(?P<pk>[0-9]+)$', views.ParameterDetail.as_view(), name='parameter-detail'),
    url(r'^projects/$', views.ProjectList.as_view(), name='projects-list'),
    url(r'^projects/(?P<pk>[0-9]+)$', views.ProjectDetail.as_view(), name='project-detail'),
    url(r'^projects/(?P<project_pk>[0-9]+)/comments/$', views.ProjectCommentList.as_view(), name='project-comment-list'),
    url(r'^projects/(?P<project_pk>[0-9]+)/comments/(?P<pk>[0-9]+)$', views.ProjectCommentDetail.as_view(), name='project-comment-detail'),
    url(r'^users/$', views.UserList.as_view(), name='users-list'),
    url(r'^users/(?P<pk>[0-9]+)$', views.UserDetail.as_view(), name='user-detail'),
    url(r'^comments/$', views.CommentList.as_view(), name='comments-list'),
    url(r'^comments/(?P<pk>[0-9]+)$', views.CommentDetail.as_view(), name='comment-detail'),
)

urlpatterns = format_suffix_patterns(urlpatterns)

urlpatterns += patterns('',
    url(r'^api-auth/', include('rest_framework.urls',
                               namespace='rest_framework')),
)
