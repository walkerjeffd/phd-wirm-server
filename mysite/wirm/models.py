from django.db import models
from jsonfield import JSONField


class Parameter(models.Model):
    PARAMETER_GROUP_CHOICES = (
        ('basic', 'Basic'),
        ('advanced', 'Advanced'),
    )
    key = models.CharField(blank=False, max_length=10)
    title = models.CharField(blank=False, max_length=50)
    units = models.CharField(max_length=20)
    value = models.FloatField()
    min = models.FloatField(default=0.0)
    max = models.FloatField()
    group = models.CharField(choices=PARAMETER_GROUP_CHOICES, default='basic', max_length=20)

    def __unicode__(self):
        return '%s (%s)' % (self.title, self.units)


class Project(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    title = models.CharField(default="New Project", blank=False, max_length=100)
    location = models.CharField(default="", blank=True, max_length=100)
    description = models.TextField()
    owner = models.ForeignKey('auth.User', related_name='projects')
    parameter_values = JSONField()

    def __unicode__(self):
        return self.title


class Comment(models.Model):
    project = models.ForeignKey('Project', related_name='comments')
    owner = models.ForeignKey('auth.User', related_name='comments')
    created = models.DateTimeField(auto_now_add=True, default=None)
    comment = models.TextField(max_length=500)

    def __unicode__(self):
        return "%s: %s..." % (self.owner.username, self.comment[:50])
