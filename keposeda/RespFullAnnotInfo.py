import DQXDbTools


def ReturnFullAnnotInfo(meta,returndata):

    db = DQXDbTools.OpenDatabase(meta)
    cur = db.cursor()

    sqlquery="SELECT * FROM {tablename} WHERE {idfield}='{id}'".format(
        tablename=DQXDbTools.ToSafeIdentifier(returndata['table']),
        idfield=DQXDbTools.ToSafeIdentifier(returndata['idfield']),
        id=DQXDbTools.ToSafeIdentifier(returndata['id'])
    )

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
