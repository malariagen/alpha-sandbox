import bottle
from bottle import get, response


@get('/<name>')
def index(name='World'):
    response.content_type = 'text/plain'
    return 'Hello %s!' % name


if __name__ == "__main__":
    bottle.run(host='localhost', port=8080)
else:
    # assume we're running under Apache via mod_wsgi
    # change working directory so relative paths (and template lookup) work again
    import os
    os.chdir(os.path.dirname(__file__))
    application = bottle.default_app()
