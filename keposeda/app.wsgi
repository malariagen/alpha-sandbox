from wsgiref.simple_server import make_server
from cgi import parse_qs, escape

import sys
import os

#!!! The following is necessary to make sure we can import from files in the local directory !!!
try:
    import responders
except ImportError:
    sys.path.append(os.path.dirname(__file__))
    import responders
    sys.path.remove(os.path.dirname(__file__))

import simplejson




def Environ2RequestQuery(environ):
    d=parse_qs(environ['QUERY_STRING'])
    map={}
    for key in d:
        map[key]=d[key][0]
    return map



def application(environ, start_response):

    meta={}
    meta=environ

    output=""
    try:
        returndata=Environ2RequestQuery(environ)
        mydatatype=returndata['datatype']

        if mydatatype=="downloadtable":
            response_headers = [('Content-type', 'text/plain'),('Content-Disposition','attachment; filename=download.txt')]
            start_response('200 OK', response_headers)
            for item in responders.DownloadTable_Generator(meta,returndata):
                yield item
            return

        resplist=responders.GetRespList()
        if not(mydatatype in resplist):
            raise Exception("Unknown request {0}".format(mydatatype))
        else:
            returndata=resplist[mydatatype](meta,returndata)

    except Exception, err:
        returndata['Error']=str(err)

    output=simplejson.dumps(returndata)
    status = '200 OK'
    response_headers = [('Content-type', 'text/plain'),
                    ('Content-Length', str(len(output)))]
    start_response(status, response_headers)
    yield output
