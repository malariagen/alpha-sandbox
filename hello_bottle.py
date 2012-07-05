# This is an example web application written in Python using the Bottle 
# micro-framework. For more information about Bottle see http://bottlepy.org/

import bottle
from bottle import Bottle, response


app = Bottle()

@app.route('/<name>')
def index(name):
    response.content_type = 'text/plain'
    return 'Hello %s from Bottle!' % name


# N.B., assume we're running via WSGI

# change working directory so relative paths (and template lookup) work again
import os
os.chdir(os.path.dirname(__file__))

# provide WSGI application
application = app
