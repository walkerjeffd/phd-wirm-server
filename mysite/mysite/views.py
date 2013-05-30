from django.http import HttpResponse
from django.shortcuts import render


def index(request):
    return render(request, 'index.html')


def client(request):
    return render(request, 'client.html')


def theory(request):
    return render(request, 'theory.html')


# def background(request):
#     return render(request, 'background.html')


def tutorial(request):
    return render(request, 'tutorial.html')


def about(request):
    return render(request, 'about.html')