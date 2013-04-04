from django.http import HttpResponse
from django.shortcuts import render


def index(request):
    return render(request, 'index.html')


def client(request):
    return render(request, 'client.html')


def theory(request):
    return render(request, 'theory.html')


def getting_started(request):
    return render(request, 'getting_started.html')


def about(request):
    return render(request, 'about.html')