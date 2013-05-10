from wirm.models import Project, Parameter, Comment
from rest_framework import serializers
from django.contrib.auth.models import User


class UserDetailSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'url', 'username', 'projects', 'comments')


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'url', 'username')


class CommentSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Comment
        read_only_fields = ('id', 'project', 'owner', 'created')
        fields = ('id', 'url', 'project', 'owner', 'created', 'comment')


class ParameterSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Parameter
        fields = ('id', 'url', 'key', 'title', 'units', 'description',
                  'value', 'min', 'max', 'step')


class ProjectSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Project
        read_only_fields = ('created', 'updated', 'owner', 'comments')
        fields = ('id', 'url', 'title', 'location', 'description',
                  'created', 'updated', 'owner', 'parameter_values', 'comments')


class ProjectDetailSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Project
        read_only_fields = ('created', 'updated', 'owner', 'comments')
        fields = ('id', 'url', 'title', 'location', 'description',
                  'created', 'updated', 'owner', 'parameter_values', 'comments')
