import B64
import DQXDbTools


#Find hits for gene patterns (or similar searches)
def ReturnFindGene(meta,returndata):
    db = DQXDbTools.OpenDatabase(meta)
    cur = db.cursor()
    mypattern=DQXDbTools.ToSafeIdentifier(returndata['pattern'])

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

        #Note: we do this 2 times, first with pattern in start position, and second with pattern in any position if the first did not fill up the max match count
        for trynr in range(0,2):
            patternstr="{0}%".format(mypattern)
            if trynr==1:
                patternstr="%{0}%".format(mypattern)
            statement='SELECT {namefield}, {chromnrfield}, MIN({startfield}), MAX({stopfield}) FROM {tablename} WHERE ({namefield} LIKE "{pattern}") GROUP BY {namefield} LIMIT {maxcount}'.format(
                tablename=DQXDbTools.ToSafeIdentifier(returndata['table']),
                chromnrfield=DQXDbTools.ToSafeIdentifier(returndata['chromnrfield']),
                startfield=DQXDbTools.ToSafeIdentifier(returndata['startfield']),
                stopfield=DQXDbTools.ToSafeIdentifier(returndata['stopfield']),
                namefield=DQXDbTools.ToSafeIdentifier(returndata['namefield']),
                pattern=patternstr,
                maxcount=maxcount
            )
            cur.execute(statement)
            for row in cur.fetchall() :
                if len(names)<maxcount:
                    chromnrstr=row[1][3:]#todo: this is depending on the fact that chromosomes are coded as 'chrX'
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

        if (len(names)==0) and ('alttablename' in returndata):
            statement='SELECT {idfield}, {chromnrfield}, {posfield} FROM {tablename} WHERE ({idfield} LIKE "{pattern}%") LIMIT {maxcount}'.format(
                tablename=DQXDbTools.ToSafeIdentifier(returndata['alttablename']),
                idfield=DQXDbTools.ToSafeIdentifier(returndata['altidfield']),
                chromnrfield=DQXDbTools.ToSafeIdentifier(returndata['altchromnrfield']),
                posfield=DQXDbTools.ToSafeIdentifier(returndata['altposfield']),
                pattern=mypattern,
                maxcount=maxcount
            )
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
