# This is an example web application written in Python using the Flask
# micro-framework. For more information about Flask see http://flask.pocoo.org/

from flask import Flask, make_response


app = Flask(__name__)

@app.route("/<name>")
def index(name):
    content = "Hello %s from Flask!" % name
    response = make_response(content)
    response.mimetype = "text/plain"
    return response


# N.B., assume we're running via WSGI

# change working directory so relative paths (and template lookup) work again
import os
os.chdir(os.path.dirname(__file__))

# provide WSGI application
application = app
