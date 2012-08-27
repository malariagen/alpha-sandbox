
import RespFindGene
import RespAnnot
import RespFullAnnotInfo
import RespQuery
import RespPagedQuery
import RespRecordInfo



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
