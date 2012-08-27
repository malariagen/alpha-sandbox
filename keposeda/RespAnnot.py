import B64
import DQXDbTools

#Return annotation information for a chromosome region
def ReturnAnnot(meta,returndata):

    db = DQXDbTools.OpenDatabase(meta)
    cur = db.cursor()

    #todo: !!! warning: this assumes that chromosomes are encoded as 'chrX' in the table. we need to change this
    statement='SELECT MIN({startfield}) AS STRTF, MAX({stopfield}), {namefield}, {idfield} FROM {tablename} WHERE ({chromnrfield}="chr{chromnr}") and ({stopfield}>={start}) and ({startfield}<={stop}) GROUP BY {namefield} ORDER BY STRTF'.format(
            tablename=DQXDbTools.ToSafeIdentifier(returndata['table']),
            chromnrfield=DQXDbTools.ToSafeIdentifier(returndata['chromnrfield']),
            startfield=DQXDbTools.ToSafeIdentifier(returndata['startfield']),
            stopfield=DQXDbTools.ToSafeIdentifier(returndata['stopfield']),
            namefield=DQXDbTools.ToSafeIdentifier(returndata['namefield']),
            idfield=DQXDbTools.ToSafeIdentifier(returndata['idfield']),
            chromnr=str(int(returndata['chrom'])),
            start=str(int(returndata['start'])),
            stop=str(int(returndata['stop']))
       )

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
