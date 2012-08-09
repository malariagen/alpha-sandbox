import MySQLdb
import simplejson
import B64
import DQXDbTools


def OpenDatabase(meta):
    return MySQLdb.connect(host=meta['DBSRV'], user=meta['DBUSER'], passwd=meta['DBPASS'], db='test')


#parse column encoding information
def ParseColumnEncoding(columnstr):
    mycolumns=[]
    for colstr in columnstr.split('~'):
        mycolumns.append( { 'Encoding':colstr[0:2], 'Name':colstr[2:] } )
    return mycolumns

#Find hits for gene patterns (or similar searches)
def ReturnFindGene(meta,returndata):
    mypattern=returndata['pattern']

    db = OpenDatabase(meta)
    cur = db.cursor()

    #remove the scary stuff
    mypattern=mypattern.replace("'","")
    mypattern=mypattern.replace('"',"")
    mypattern=mypattern.replace(';',"")
    mypattern=mypattern.replace(' ',"")

    names=[]
    chroms=[]
    starts=[]
    ends=[]

    #Detect to see if the pattern is actually a chromosome position
    if (":" in mypattern) and (len(mypattern)>4) and (mypattern[0:3]=="chr"):
        chromostr,posstr=mypattern.split(':')
        chromostr=chromostr[3:]
        if (len(chromostr)>0) and (chromostr.isdigit()) and (posstr.isdigit()):#TODO: make the whole system work with X,Y chromosomes
            chromonr=int(chromostr)
            pos=int(posstr)
            names.append(mypattern)
            chroms.append(chromonr)
            starts.append(pos)
            ends.append(pos)

    else:

        maxcount=6#the maximum number of hits we are going to report
        foundmap={}

        #Note: we can do this 2 times, first with pattern in start position, and second with pattern in any position if the first did not fill up the max match count
        for trynr in range(0,2):
            statement='SELECT name, chrom, MIN(startcds), MAX(endcds) FROM annot WHERE (name LIKE "{0}%") GROUP BY name LIMIT {1}'.format(mypattern,maxcount)
            if trynr==1:
                statement='SELECT name,chrom, MIN(startcds) ,MAX(endcds) FROM annot WHERE (name LIKE "%{0}%") GROUP BY name  LIMIT {1}'.format(mypattern,maxcount)
            cur.execute(statement)
            for row in cur.fetchall() :
                if (len(names)<maxcount):
                    chromnrstr=row[1][3:]
                    if (len(chromnrstr)>0) and (chromnrstr.isdigit()):#TODO: make the whole system work with X,Y chromosomes (use nr <-> name mapping?)
                        name=row[0]
                        if name not in foundmap:
                            names.append(name)
                            chroms.append(int(chromnrstr))
                            starts.append(row[2])
                            ends.append(row[3])
                            foundmap[name]=1
            if len(names)>=maxcount:
                trynr=99

        #TODO: this is still somehow keposeda-specific code, since it contains a hard-wired reference to another table
        #Replace this with something more generic!
        if len(names)==0:
            statement='SELECT snpid,chrom,pos FROM snps WHERE (snpid LIKE "{0}%") LIMIT {1}'.format(mypattern,maxcount)
            cur.execute(statement)
            for row in cur.fetchall() :
                if (len(names)<maxcount):
                    chromnrstr=row[1]
                    names.append(row[0])
                    chroms.append(int(chromnrstr))
                    pos=row[2]
                    starts.append(pos)
                    ends.append(pos)

    valcoder=B64.ValueListCoder()
    returndata['Hits']=valcoder.EncodeStrings(names)
    returndata['Chroms']=valcoder.EncodeIntegers(chroms)
    returndata['Starts']=valcoder.EncodeIntegers(starts)
    returndata['Ends']=valcoder.EncodeIntegers(ends)

    #TODO: pass 'hasmore' flag if list is limited, and make client interpret this

    return returndata

def ReturnReflect(meta,returndata):
    return returndata

#Return annotation information for a chromosome region
def ReturnAnnot(meta,returndata):

    ##NOTE: the str(int()) construction is used to avoid SQL injection
    mychrom=str(int(returndata['chrom']))
    mystart=str(int(returndata['start']))
    mystop=str(int(returndata['stop']))

    db = OpenDatabase(meta)
    cur = db.cursor()

    statement='SELECT MIN(startcds) AS STRT, MAX(endcds), name, geneid FROM annot WHERE (chrom="chr{0}") and (endcds>={1}) and (startcds<={2}) GROUP BY name ORDER BY STRT'.format(
        mychrom,mystart,mystop
    )
    #    statement='SELECT startcds, endcds, name FROM annot WHERE (chrom="chr{0}") and (endcds>={1}) and (startcds<={2}) ORDER BY startcds'.format(
    #        mychrom,mystart,mystop
    #    )

    cur.execute(statement)
    starts=[]
    stops=[]
    names=[]
    ids=[]
    for row in cur.fetchall() :
        starts.append(float(row[0]))
        stops.append(float(row[1]))
        names.append(row[2])
        ids.append(row[3])

    returndata['DataType']='Points'
    valcoder=B64.ValueListCoder()
    returndata['Starts']=valcoder.EncodeIntegersByDifferenceB64(starts)
    returndata['Sizes']=valcoder.EncodeIntegers([x[1]-x[0] for x in zip(starts,stops)])
    returndata['Names']=valcoder.EncodeStrings(names)
    returndata['IDs']=valcoder.EncodeStrings(ids)
    return returndata




def ReturnFullAnnotInfo(meta,returndata):
    id=returndata['id']

    db = OpenDatabase(meta)
    cur = db.cursor()

    #!!!todo: make this sql injection safe
    sqlquery="SELECT * FROM annot WHERE geneid='{0}'".format(id)

    cur.execute(sqlquery)
    therow=cur.fetchone()
    if therow is None:
        returndata['Error']='Record not found'
    else:
        data={}
        colnr=0
        for column in cur.description:
            data[column[0]]=str(therow[colnr])
            colnr += 1
        returndata['Data']=data
    return returndata



def ReturnQuery(meta,returndata):
    mytablename=returndata['tbname']
    encodedquery=returndata['qry']
    myorderfield=returndata['order']

    mycolumns=ParseColumnEncoding(returndata['collist'])

    db = OpenDatabase(meta)
    cur = db.cursor()

    whc=DQXDbTools.WhereClause()
    whc.ParameterPlaceHolder='%s'#NOTE!: MySQL PyODDBC seems to require this nonstardard coding
    whc.Decode(encodedquery)
    whc.CreateSelectStatement()

    sqlquery="SELECT pos, {0} FROM {1}".format(','.join([x['Name'] for x in mycolumns]), mytablename)
    if len(whc.querystring_params)>0:
        sqlquery+=" WHERE {0}".format(whc.querystring_params)
    sqlquery+=" ORDER BY {0}".format(myorderfield)

    cur.execute(sqlquery,whc.queryparams)

    returndata['DataType']='Points'
    pointsx=[]
    yvalrange=range(0,len(mycolumns))
    pointsy=[]
    for ynr in yvalrange:
        pointsy.append([])
    for row in cur.fetchall() :
        pointsx.append(float(row[0]))
        for ynr in yvalrange:
            if row[1+ynr]!=None:
                pointsy[ynr].append(row[1+ynr])
            else:
                pointsy[ynr].append(None)

    valcoder=B64.ValueListCoder()
    returndata['XValues']=valcoder.EncodeIntegersByDifferenceB64(pointsx)
    for ynr in yvalrange:
        returndata[mycolumns[ynr]['Name']]=valcoder.EncodeByMethod(pointsy[ynr],mycolumns[ynr]['Encoding'])

    return returndata




def ReturnPagedQuery(meta,returndata):
    mytablename=returndata['tbname']
    encodedquery=returndata['qry']
    myorderfield=returndata['order']
    sortreverse=int(returndata['sortreverse'])>0

    mycolumns=ParseColumnEncoding(returndata['collist'])

    db = OpenDatabase(meta)
    cur = db.cursor()

    whc=DQXDbTools.WhereClause()
    whc.ParameterPlaceHolder='%s'#NOTE!: MySQL PyODDBC seems to require this nonstardard coding
    whc.Decode(encodedquery)
    whc.CreateSelectStatement()

    #Determine total number of records
    sqlquery="SELECT COUNT(*) FROM {0}".format(mytablename)
    if len(whc.querystring_params)>0:
        sqlquery+=" WHERE {0}".format(whc.querystring_params)
    cur.execute(sqlquery,whc.queryparams)
    returndata['TotalRecordCount']=cur.fetchone()[0]



    #Fetch the actual data
    strrownr1,strrownr2=returndata['limit'].split('~')
    rownr1=int(strrownr1)
    rownr2=int(strrownr2)
    if rownr1<0: rownr1=0
    if rownr2<=rownr1: rownr2=rownr1+1

    sqlquery="SELECT {0} FROM {1}".format(','.join([x['Name'] for x in mycolumns]), mytablename)
    if len(whc.querystring_params)>0:
        sqlquery+=" WHERE {0}".format(whc.querystring_params)
    sqlquery+=" ORDER BY {0}".format(DQXDbTools.CreateOrderByStatement(myorderfield,sortreverse))
    sqlquery+=" LIMIT {0}, {1}".format(rownr1,rownr2-rownr1+1)

    cur.execute(sqlquery,whc.queryparams)

    returndata['DataType']='Points'
    pointsx=[]
    yvalrange=range(0,len(mycolumns))
    pointsy=[]
    for ynr in yvalrange:
        pointsy.append([])
    rowidx=0
    for row in cur.fetchall() :
        pointsx.append(rownr1+rowidx)
        for ynr in yvalrange:
            if row[ynr]!=None:
                pointsy[ynr].append(row[ynr])
            else:
                pointsy[ynr].append(None)
        rowidx+=1

    valcoder=B64.ValueListCoder()
    returndata['XValues']=valcoder.EncodeIntegersByDifferenceB64(pointsx)
    for ynr in yvalrange:
        returndata[mycolumns[ynr]['Name']]=valcoder.EncodeByMethod(pointsy[ynr],mycolumns[ynr]['Encoding'])

    return returndata




def ReturnRecordInfo(meta,returndata):
    mytablename=returndata['tbname']
    encodedquery=returndata['qry']

    db = OpenDatabase(meta)
    cur = db.cursor()

    whc=DQXDbTools.WhereClause()
    whc.ParameterPlaceHolder='%s'#NOTE!: MySQL PyODDBC seems to require this nonstardard coding
    whc.Decode(encodedquery)
    whc.CreateSelectStatement()

    sqlquery="SELECT * FROM {0} WHERE {1}".format(
        mytablename,
        whc.querystring_params
    )

    cur.execute(sqlquery,whc.queryparams)
    therow=cur.fetchone()
    if therow is None:
        returndata['Error']='Record not found'
    else:
        data={}
        colnr=0
        for column in cur.description:
            data[column[0]]=str(therow[colnr])
            colnr += 1
        returndata['Data']=data

    return returndata



def GetRespList():
    rslst={}
    rslst['reflect']=ReturnReflect
    rslst['annot']=ReturnAnnot
    rslst['fullannotinfo']=ReturnFullAnnotInfo
    rslst['qry']=ReturnQuery
    rslst['pageqry']=ReturnPagedQuery
    rslst['recordinfo']=ReturnRecordInfo
    rslst['findgene']=ReturnFindGene
    return rslst
