Web-Based Interactive River Model
=================================

This repository contains the source code for the server-side application of the Web-based Interactive River Model.

The live version of this site is available here: http://wirm.walkerjeff.com

## Configuration

To configure this repository, you must define a series of settings. There are two settings files:

- `mysite/mysite/settings/local_template.py`: local server
- `mysite/mysite/settings/production_template.py`: production server

Copy and paste these files without the `_template` in the name:

```shell
cp mysite/mysite/settings/local_template.py mysite/mysite/settings/local.py
cp mysite/mysite/settings/production_template.py mysite/mysite/settings/production.py
```

Then set the various database configuration, directories, email authentication, etc. settings.

## Run Locally

To run a local development server simply execute:

```shell
python manage.py runserver
```
