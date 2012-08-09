def application(environ, start_response):
    start_response('200 OK', [('Content-Type', 'text/plain')])
    # expect to find DBSRV, DBUSER, DBPASS (name, user, passwd for sandbox database server)
    for key, value in environ.items():
        yield '%s: %s\n' % (key, value)
