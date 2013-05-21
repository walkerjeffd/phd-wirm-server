from wirm.models import Project, Parameter, Comment
from rest_framework import serializers
from django.contrib.auth.models import User


class UserSimpleSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'url', 'username')


class UserDetailSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'url', 'username', 'projects', 'comments')


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'url', 'username')


class CommentSerializer(serializers.HyperlinkedModelSerializer):
    owner = UserSimpleSerializer(read_only=True)

    class Meta:
        model = Comment
        read_only_fields = ('project',)
        fields = ('id', 'url', 'project', 'owner', 'created', 'comment')


class ParameterSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Parameter
        fields = ('id', 'url', 'key', 'title', 'units', 'description',
                  'value', 'min', 'max', 'step')


class ProjectSerializer(serializers.HyperlinkedModelSerializer):
    owner = UserSimpleSerializer(read_only=True)

    class Meta:
        model = Project
        read_only_fields = ('comments',)
        fields = ('id', 'url', 'title', 'location', 'description',
                  'created', 'updated', 'owner', 'parameter_values', 'comments')


# class ProjectDetailSerializer(serializers.HyperlinkedModelSerializer):
#     class Meta:
#         model = Project
#         read_only_fields = ('created', 'updated', 'owner', 'comments')
#         fields = ('id', 'url', 'title', 'location', 'description',
#                   'created', 'updated', 'owner', 'parameter_values', 'comments')
