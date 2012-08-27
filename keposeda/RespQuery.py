import B64
import DQXDbTools



def ReturnQuery(meta,returndata):

    myposfield=DQXDbTools.ToSafeIdentifier(returndata['posfield'])
    mytablename=DQXDbTools.ToSafeIdentifier(returndata['tbname'])
    encodedquery=returndata['qry']
    myorderfield=DQXDbTools.ToSafeIdentifier(returndata['order'])

    mycolumns=DQXDbTools.ParseColumnEncoding(returndata['collist'])#!!!todo: verify that these column names are actual table columns

    db = DQXDbTools.OpenDatabase(meta)
    cur = db.cursor()

    whc=DQXDbTools.WhereClause()
    whc.ParameterPlaceHolder='%s'#NOTE!: MySQL PyODDBC seems to require this nonstardard coding
    whc.Decode(encodedquery)
    whc.CreateSelectStatement()

    sqlquery="SELECT {posfield}, {columnames} FROM {tablename}".format(
        posfield=myposfield,
        columnames=','.join([DQXDbTools.ToSafeIdentifier(x['Name']) for x in mycolumns]),
        tablename=mytablename
    )

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
