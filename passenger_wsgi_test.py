import sys, os, django

sys.path.append("/home/walkerjeffd/wirm.walkerjeff.com/mysite/")

os.environ['DJANGO_SETTINGS_MODULE'] = 'mysite.settings.production'

def application(environ, start_response):
    write = start_response('200 OK', [('Content-type', 'text/plain')])
    return ["Hello, world!"]