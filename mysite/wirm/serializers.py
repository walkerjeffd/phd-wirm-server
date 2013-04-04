from wirm.models import Project, Parameter
from rest_framework import serializers
from django.contrib.auth.models import User


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

    class Meta:
        model = Project
        read_only_fields = ('created', 'updated', 'owner')
        fields = ('id', 'url', 'title', 'location', 'description',
                  'created', 'updated', 'owner', 'parameter_values')


class ProjectDetailSerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.Field()
    # owner = serializers.HyperlinkedIdentityField(source='owner.username',
    #                                              view_name='user-detail',
    #                                              format='html')
    owner = serializers.Field(source='owner.username')

    class Meta:
        model = Project
        fields = ('id', 'url', 'title', 'location', 'description',
                  'created', 'updated', 'owner', 'parameter_values')


class UserSerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.Field()
    projects = serializers.HyperlinkedRelatedField(many=True,
                                                   view_name='project-detail')

    class Meta:
        model = User
        fields = ('id', 'url', 'username', 'projects')
