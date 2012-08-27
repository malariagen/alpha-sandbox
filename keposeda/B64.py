class B64:
    def __init__(self):
        self.encodestr="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-"
        #establish the inversion table:
        self.invencode=[]
        for i in range(0,255): self.invencode.append(0)
        for i in range(len(self.encodestr)):
            self.invencode[ord(self.encodestr[i])]=i

    def Int2B64(self, val, maxcnt=-1):
        if val==None:
            return '###'
        rs=''
        cnt=0
        while (val>0) or (cnt==0) or ((maxcnt>0) and (cnt<maxcnt)):
            rs=self.encodestr[val & 63]+rs
            val=val >> 6
            cnt+=1
        return rs

    def B642Int(self, st):
        rs=0
        for ch in st:
            rs=rs*64+self.invencode[ord(ch)]
        return rs



class ValueListCoder:
    def __init__(self):
        self.b64codec=B64()

    def EncodeStrings(selfself, vals):
        result={}
        result['Encoding']="String"
        result['Data']=','.join(vals)
        return result

    def EncodeIntegers(self, vals):
        result={}
        result['Encoding']="Integer"
        result['Data']=','.join([str(x) for x in vals])
        return result

    def EncodeIntegersByDifferenceB64(self, vals):
        result={}
        MinValX=0
        if vals:
            MinValX=min(vals)
        result['Encoding']="IntegerDiffB64"
        result['Offset']=MinValX
        diffpointsx=[]
        prevxval=MinValX
        for xval in vals:
            if xval<prevxval:
                raise Exception("EncodeIntegersByDifferenceB64: list should be increasing in size")
            diffpointsx.append(int(round(xval-prevxval)))
            prevxval=xval
        result['Data']=','.join([self.b64codec.Int2B64(x) for x in diffpointsx])
        return result

    def EncodeIntegersB64(self, vals):
        result={}
        result['Encoding']="IntegerB64"
        result['Data']=','.join([self.b64codec.Int2B64(x) for x in vals])
        return result


    def EncodeFloatsByIntB64(self, vals, bytecount):
        result={}
        result['Encoding']="FloatAsIntB64"
        MinVal=0
        MaxVal=1
        nonemptyvals=[x for x in vals if x is not None]
        if (nonemptyvals):
            MinVal=min(nonemptyvals)
            MaxVal=max(nonemptyvals)
            if MaxVal==MinVal: MaxVal=MinVal+1

        CompressedRange=int(64**bytecount-10)
        Offset=MinVal
        Slope=(MaxVal-MinVal)/CompressedRange
        result['Offset']=Offset
        result['Slope']=Slope
        result['ByteCount']=bytecount
#        result['Data']=''.join([self.b64codec.Int2B64(int((vl-Offset)/Slope),bytecount) for vl in vals])
        absentcode='~' * bytecount#this string is used to encode an absent value
        result['Data']=''.join(
            [vl is None and (absentcode) or (self.b64codec.Int2B64(int((vl-Offset)/Slope),bytecount)) for vl in vals]
        )
        return result

    def EncodeStrings(self, vals):
        result={}
        result['Encoding']="String"
        result['Data']='~'.join(vals)
        return result

    def EncodeByMethod(self, vals, methodid):
        if methodid=='ST':
            return self.EncodeStrings(vals)
        if methodid=='IN':
            return self.EncodeIntegers(vals)
        if methodid=='IB':
            return self.EncodeIntegersB64(vals)
        if methodid=='ID':
            return self.EncodeIntegersByDifferenceB64(vals)
        if methodid=='F2':
            return self.EncodeFloatsByIntB64(vals,2)
        if methodid=='F3':
            return self.EncodeFloatsByIntB64(vals,3)
        raise Exception('Invalid column encoding identifier {0}'.format(methodid))
