from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # adding universale permission for GET, HEAD and OPTIONS requests
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only allowed for owner of object
        return obj.owner == request.user
