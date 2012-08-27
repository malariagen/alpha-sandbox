
import RespFindGene
import RespAnnot
import RespFullAnnotInfo
import RespQuery
import RespPagedQuery
import RespRecordInfo

import B64
import DQXDbTools


def ReturnReflect(meta,returndata):
    return returndata


def GetRespList():
    rslst={}
    rslst['reflect']=ReturnReflect
    rslst['annot']=RespAnnot.ReturnAnnot
    rslst['fullannotinfo']=RespFullAnnotInfo.ReturnFullAnnotInfo
    rslst['qry']=RespQuery.ReturnQuery
    rslst['pageqry']=RespPagedQuery.ReturnPagedQuery
    rslst['recordinfo']=RespRecordInfo.ReturnRecordInfo
    rslst['findgene']=RespFindGene.ReturnFindGene
    return rslst


def DownloadTable_Generator(meta,returndata):
    mytablename=returndata['tbname']
    encodedquery=returndata['qry']
    myorderfield=returndata['order']
    sortreverse=int(returndata['sortreverse'])>0

    mycolumns=DQXDbTools.ParseColumnEncoding(returndata['collist'])

    db = DQXDbTools.OpenDatabase(meta)
    cur = db.cursor()

    whc=DQXDbTools.WhereClause()
    whc.ParameterPlaceHolder='%s'#NOTE!: MySQL PyODDBC seems to require this nonstardard coding
    whc.Decode(encodedquery)
    whc.CreateSelectStatement()

    sqlquery="SELECT {0} FROM {1}".format(','.join([x['Name'] for x in mycolumns]), mytablename)
    if len(whc.querystring_params)>0:
        sqlquery+=" WHERE {0}".format(whc.querystring_params)
    sqlquery+=" ORDER BY {0}".format(DQXDbTools.CreateOrderByStatement(myorderfield,sortreverse))

    cur.execute(sqlquery,whc.queryparams)

    yield '\t'.join(str(col[0]) for col in cur.description)+'\n'

    for row in cur.fetchall() :
        line='\t'.join([str(x) for x in row])+'\n'
        yield line
