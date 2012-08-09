from django.http import HttpResponse
import simplejson
import responders


#NOTE: on development server, call with
#http://localhost:8000/app01?chrom=1&start=0&stop=3000000


#Pack result data into a http response
def CreateHttpResponse(data):
    returnstr = simplejson.dumps(data)
    return HttpResponse(returnstr)

#Convert an url into a map of query items
def GetRequestQuery(request):
    map={}
    for key in request.REQUEST:
        map[key]=request.REQUEST[key]
    return map




def index(request):

    returndata=GetRequestQuery(request)
    mydatatype=returndata['datatype']

    try:
        resplist=responders.GetRespList()
        if not(mydatatype in resplist):
            raise Exception("Unknown request {0}".format(mydatatype))
        else:
            return CreateHttpResponse(resplist[mydatatype](returndata))
    except Exception, err:
        print("**************** EXCEPTION RAISED: "+str(err))#TODO: do some nice logging here...
        returndata['Error']=str(err)
        return CreateHttpResponse(returndata)
