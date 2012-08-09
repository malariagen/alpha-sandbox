
import simplejson
import base64

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
            self._CreateSelectStatementSub(comp)
            first=False

    def _CreateSelectStatementSub_Comparison(self,statm):
        #TODO: check that statm['ColName'] corresponds to a valid column name in the table (to avoid SQL injection)
        if not(statm['Tpe'] in ['=', '<', '>', '<=', '>=', '!=', 'LIKE']):
            raise Exception("Invalid comparison statement {0}".format(statm['Tpe']))
        self.querystring+=statm['ColName']+statm['Tpe']
        self.querystring_params+='{0}{1}{2}'.format(statm['ColName'],statm['Tpe'],self.ParameterPlaceHolder)
        vl=statm['CompValue']
        needquotes= (type(vl) is not float) and (type(vl) is not int)
        if needquotes:
            self.querystring+="'"
        self.querystring+=str(vl)
        if needquotes:
            self.querystring+="'"
        self.queryparams.append(vl)

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
#todo!!!: make this sql injection safe by (1) removing scary characters from field names and (2) possibly checking that the names correspond to valid table columns
def CreateOrderByStatement(orderstr,reverse=False):
    dirstr=""
    if reverse: dirstr=" DESC"
    #note the following sql if construct is used to make sure that sorting always puts absent values at the end, which is what we want
    return ', '.join( [ "IF(ISNULL({0}),1,0),{0}{1}".format(field,dirstr) for field in orderstr.split('~') ] )
