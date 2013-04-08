from wirm.models import Project, Parameter, Comment
from rest_framework import serializers
from django.contrib.auth.models import User


class CommentSerializer(serializers.ModelSerializer):
    id = serializers.Field()
    owner = serializers.Field(source='owner.username')

    class Meta:
        model = Comment
        read_only_fields = ('id', 'project', 'owner', 'created')
        fields = ('id', 'project', 'owner', 'created', 'comment')


class ParameterSerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.Field()

    class Meta:
        model = Parameter
        fields = ('id', 'url', 'key', 'title', 'units', 'description',
                  'value', 'min', 'max', 'step')


class ProjectSerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.Field()
    # owner = serializers.HyperlinkedIdentityField(source='owner.username',
    #                                              view_name='user-detail',
    #                                              format='html')
    owner = serializers.Field(source='owner.username')
    comments = CommentSerializer(many=True)

    class Meta:
        model = Project
        read_only_fields = ('created', 'updated', 'owner')
        fields = ('id', 'url', 'title', 'location', 'description',
                  'created', 'updated', 'owner', 'parameter_values', 'comments')


class ProjectDetailSerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.Field()
    owner = serializers.Field(source='owner.username')
    comments = CommentSerializer(many=True)

    class Meta:
        model = Project
        read_only_fields = ('created', 'updated', 'owner')
        fields = ('id', 'url', 'title', 'location', 'description',
                  'created', 'updated', 'owner', 'parameter_values', 'comments')


class UserSerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.Field()
    projects = serializers.HyperlinkedRelatedField(many=True,
                                                   view_name='project-detail')
    comments = serializers.RelatedField(many=True)

    class Meta:
        model = User
        fields = ('id', 'url', 'username', 'projects', 'comments')
