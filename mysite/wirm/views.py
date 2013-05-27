from wirm.models import Project, Parameter, Comment
from wirm import serializers
from wirm.permissions import IsOwnerOrReadOnly
from rest_framework import generics
from rest_framework import permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404


@api_view(('GET',))
def api_root(request, format=None):
    return Response({
        'users': reverse('users-list', request=request, format=format),
        'parameters': reverse('parameters-list', request=request, format=format),
        'projects': reverse('projects-list', request=request, format=format),
        'comments': reverse('comments-list', request=request, format=format),
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
    Lists saved projects or create new project for current authenticated user.
    """
    # queryset = Project.objects.all()
    serializer_class = serializers.ProjectSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        user = self.request.user
        if (user.is_anonymous()):
            return []
        return Project.objects.filter(owner=user)

    def pre_save(self, obj):
        obj.owner = self.request.user


class ProjectDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or destroy a project.
    """
    queryset = Project.objects.all()
    serializer_class = serializers.ProjectSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,
                          IsOwnerOrReadOnly)


class UserList(generics.ListAPIView):
    """
    List all users.
    """
    queryset = User.objects.all()
    serializer_class = serializers.UserSerializer


class UserDetail(generics.RetrieveAPIView):
    """
    Retrieve single user.
    """
    queryset = User.objects.all()
    serializer_class = serializers.UserDetailSerializer


class CommentList(generics.ListAPIView):
    """
    List all comments.
    """
    queryset = Comment.objects.all()
    serializer_class = serializers.CommentSerializer
    # permission_classes = (permissions.IsAuthenticatedOrReadOnly,)


class CommentDetail(generics.RetrieveAPIView):
    """
    Retrieve single comment.
    """
    queryset = Comment.objects.all()
    serializer_class = serializers.CommentSerializer
    # permission_classes = (permissions.IsAuthenticatedOrReadOnly,)


class ProjectCommentList(generics.ListCreateAPIView):
    """
    List all comments for a project.
    """
    serializer_class = serializers.CommentSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def pre_save(self, obj):
        project_pk = self.kwargs['project_pk']
        obj.project = Project.objects.get(pk=project_pk)
        obj.owner = self.request.user

    def get_queryset(self):
        """
        This view should return a list of all comments for
        the project pk as determined by the project_pk portion of the URL.
        """
        project_pk = self.kwargs['project_pk']
        project = get_object_or_404(Project, pk=project_pk)
        return Comment.objects.filter(project__pk=project_pk)


class ProjectCommentDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve single comment for a project.
    """
    serializer_class = serializers.CommentSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,
                          IsOwnerOrReadOnly)

    def get_queryset(self):
        """
        This view should return a list of all comments for
        the project pk as determined by the project_pk portion of the URL.
        """
        project_pk = self.kwargs['project_pk']
        project = get_object_or_404(Project, pk=project_pk)
        queryset = project.comments.all()
        return queryset
