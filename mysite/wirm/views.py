from wirm.models import Project, Parameter
from wirm import serializers
from wirm.permissions import IsOwnerOrReadOnly
from rest_framework import generics
from rest_framework import permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from django.contrib.auth.models import User


@api_view(('GET',))
def api_root(request, format=None):
    return Response({
        'users': reverse('user-list', request=request, format=format),
        'parameters': reverse('parameters-list', request=request, format=format),
        'projects': reverse('projects-list', request=request, format=format)
    })


class ParameterList(generics.ListAPIView):
    """
    List all parameters.
    """
    model = Parameter
    serializer_class = serializers.ParameterSerializer


class ParameterDetail(generics.RetrieveAPIView):
    """
    Retrieve single parameter.
    """
    model = Parameter
    serializer_class = serializers.ParameterSerializer


class ProjectList(generics.ListCreateAPIView):
    """
    Lists all projects or creates new project for current authenticated user.
    """
    model = Project
    serializer_class = serializers.ProjectSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        user = self.request.user
        if (user.is_anonymous()):
            return Project.objects.all()
        return Project.objects.filter(owner=user)

    def pre_save(self, obj):
        obj.owner = self.request.user


class ProjectDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or destroy a project.
    """
    model = Project
    serializer_class = serializers.ProjectDetailSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,
                          IsOwnerOrReadOnly)

    def pre_save(self, obj):
        obj.owner = self.request.user


class UserList(generics.ListAPIView):
    """
    List all users.
    """
    model = User
    serializer_class = serializers.UserSerializer


class UserDetail(generics.RetrieveAPIView):
    """
    Retrieve single user.
    """
    model = User
    serializer_class = serializers.UserSerializer
