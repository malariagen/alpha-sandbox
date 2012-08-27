
import simplejson
import base64
import MySQLdb


def OpenDatabase(meta):
    return MySQLdb.connect(host=meta['DBSRV'], user=meta['DBUSER'], passwd=meta['DBPASS'], db='test')


def ToSafeIdentifier(st):
    removelist=['"',"'",';','(',')']
    for it in removelist:
        st=st.replace(it,"")
    return st


#parse column encoding information
def ParseColumnEncoding(columnstr):
    mycolumns=[]
    for colstr in columnstr.split('~'):
        mycolumns.append( { 'Encoding':colstr[0:2], 'Name':ToSafeIdentifier(colstr[2:]) } )
    return mycolumns


#A whereclause encapsulates the where statement of a single table sql query
class WhereClause:
    def __init__(self):
        self.query=None#this contains a tree of statements
        self.ParameterPlaceHolder="?"#determines what is the placeholder for a parameter to be put in an sql where clause string

    #Decodes an url compatible encoded query into the statement tree
    def Decode(self, encodedstr):
        encodedstr=encodedstr.replace("-","+")
        encodedstr=encodedstr.replace("_","/")
        decodedstr=base64.b64decode(encodedstr)
        self.query=simplejson.loads(decodedstr)
        pass

    #Creates an SQL where clause string out of the statement tree
    def CreateSelectStatement(self):
        self.querystring=''#will hold the fully filled in standalone where clause string (do not use this if sql injection is an issue!)
        self.querystring_params=''#will hold the parametrised where clause string
        self.queryparams=[]#will hold a list of parameter values
        self._CreateSelectStatementSub(self.query)
        #return(self.querystring)

    def _CreateSelectStatementSub_Compound(self,statm):
        if not(statm['Tpe'] in ['AND', 'OR']):
            raise Exception("Invalid compound statement {0}".format(statm['Tpe']))
        first=True
        for comp in statm['Components']:
            if not first:
                self.querystring+=" "+statm['Tpe']+" "
                self.querystring_params+=" "+statm['Tpe']+" "
            self.querystring+="("
            self.querystring_params+="("
            self._CreateSelectStatementSub(comp)
            self.querystring+=")"
            self.querystring_params+=")"
            first=False

    def _CreateSelectStatementSub_Comparison(self,statm):
        #TODO: check that statm['ColName'] corresponds to a valid column name in the table (to avoid SQL injection)
        if not(statm['Tpe'] in ['=', '<>', '<', '>', '<=', '>=', '!=', 'LIKE', 'CONTAINS', 'NOTCONTAINS', 'STARTSWITH', 'ISPRESENT', 'ISABSENT', '=FIELD', '<>FIELD', '<FIELD', '>FIELD']):
            raise Exception("Invalid comparison statement {0}".format(statm['Tpe']))

        processed=False

        if statm['Tpe']=='ISPRESENT':
            processed=True
            st='{0} IS NOT NULL'.format(statm['ColName'])
            self.querystring+=st
            self.querystring_params+=st

        if statm['Tpe']=='ISABSENT':
            processed=True
            st='{0} IS NULL'.format(statm['ColName'])
            self.querystring+=st
            self.querystring_params+=st

        if statm['Tpe']=='=FIELD':
            processed=True
            st='{0}={1}'.format(ToSafeIdentifier(statm['ColName']),ToSafeIdentifier(statm['ColName2']))
            self.querystring+=st
            self.querystring_params+=st

        if statm['Tpe']=='<>FIELD':
            processed=True
            st='{0}<>{1}'.format(ToSafeIdentifier(statm['ColName']),ToSafeIdentifier(statm['ColName2']))
            self.querystring+=st
            self.querystring_params+=st

        if (statm['Tpe']=='<FIELD') or (statm['Tpe']=='>FIELD'):
            processed=True
            operatorstr=statm['Tpe'].split('FIELD')[0]
            self.querystring+='{0} {4} {1} * {2} + {3}'.format(ToSafeIdentifier(statm['ColName']),ToSafeIdentifier(statm['Factor']),ToSafeIdentifier(statm['ColName2']),ToSafeIdentifier(statm['Offset']),operatorstr)
            self.querystring_params+='{0} {4} {1} * {2} + {3}'.format(ToSafeIdentifier(statm['ColName']),self.ParameterPlaceHolder,ToSafeIdentifier(statm['ColName2']),self.ParameterPlaceHolder,operatorstr)
            self.queryparams.append(ToSafeIdentifier(statm['Factor']))
            self.queryparams.append(ToSafeIdentifier(statm['Offset']))

        if not(processed):
            decoval=statm['CompValue']
            operatorstr=statm['Tpe']
            if operatorstr=='CONTAINS':
                operatorstr='LIKE'
                decoval='%{0}%'.format(decoval)
            if operatorstr=='NOTCONTAINS':
                operatorstr='NOT LIKE'
                decoval='%{0}%'.format(decoval)
            if operatorstr=='STARTSWITH':
                operatorstr='LIKE'
                decoval='{0}%'.format(decoval)
            self.querystring+=ToSafeIdentifier(statm['ColName'])+' '+ToSafeIdentifier(operatorstr)+' '
            self.querystring_params+='{0} {1} {2}'.format(ToSafeIdentifier(statm['ColName']),ToSafeIdentifier(operatorstr),self.ParameterPlaceHolder)
            needquotes= (type(decoval) is not float) and (type(decoval) is not int)
            if needquotes:
                self.querystring+="'"
            self.querystring+=str(decoval)
            if needquotes:
                self.querystring+="'"
            self.queryparams.append(decoval)

    def _CreateSelectStatementSub(self,statm):
        if statm['Tpe']=='':
            return#trivial query
        self.querystring+="("
        self.querystring_params+="("
        if (statm['Tpe']=='AND') or (statm['Tpe']=='OR'):
            self._CreateSelectStatementSub_Compound(statm)
        else:
            self._CreateSelectStatementSub_Comparison(statm)
        self.querystring+=")"
        self.querystring_params+=")"





#unpacks an encoded 'order by' statement into an SQL statement
def CreateOrderByStatement(orderstr,reverse=False):
    dirstr=""
    if reverse: dirstr=" DESC"
    #note the following sql if construct is used to make sure that sorting always puts absent values at the end, which is what we want
    return ', '.join( [ "IF(ISNULL({0}),1,0),{0}{1}".format(field,dirstr) for field in orderstr.split('~') ] )
