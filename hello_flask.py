# This is an example web application written in Python using the Flask
# micro-framework. For more information about Flask see http://flask.pocoo.org/

import os
from flask import Flask, make_response


app = Flask(__name__)

@app.route("/<name>")
def index(name):
    content = "Hello %s from Flask!" % name
    response = make_response(content)
    response.mimetype = "text/plain"
    return response


# N.B., assume we're running via WSGI
# provide WSGI application
application = app
