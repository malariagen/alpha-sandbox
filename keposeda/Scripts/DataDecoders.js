
/////////////////////////////////////////////////////////////////////////////////////////
//Basic base64 encoding/decoding
/////////////////////////////////////////////////////////////////////////////////////////

function B64() {
    this.encodestr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";
    this.invencode = [];
    for (var i = 0; i < 255; i++) this.invencode.push(0);
    for (var i = 0; i < this.encodestr.length; i++)
        this.invencode[this.encodestr[i].charCodeAt(0)] = i;

    //Converts a 64bit ancoded integer to an integer
    this.B642Int = function (st) {
        rs = 0;
        for (var i = 0; i < st.length; i++)
            rs = (rs << 6) + this.invencode[st.charCodeAt(i)]
        return rs;
    }

    //Converts a set of 64bit encoded integers to float array, applying a linear mapping using slope and offset
    this.ArrayB642Float = function (st, bytecount, slope, offset) {
        var vals = [];
        var cnt = st.length / bytecount;
        var ps = 0;
        for (var i = 0; i < cnt; i++) {
            if (st[ps] == '~') {//coding for absent value
                vals.push(null);
                ps += bytecount;
            }
            else {
                var rs = 0;
                for (var j = 0; j < bytecount; j++) {
                    rs = (rs << 6) + this.invencode[st.charCodeAt(ps)];
                    ps++;
                }
                vals.push(rs * slope + offset);
            }
        }
        return vals;
    }

}

/////////////////////////////////////////////////////////////////////////////////////////
//Decoder for different formats of value lists as provided by the server
/////////////////////////////////////////////////////////////////////////////////////////

function ValueListDecoder() {
    this.b64codec = new B64();
    this.Decode = function (data) {

        if (data['Encoding'] == 'IntegerDiffB64') {
            var vals = [];
            var offset = data['Offset'];
            var datastrlist = data['Data'].split(',');
            for (var i = 0; i < datastrlist.length; i++) {
                offset += this.b64codec.B642Int(datastrlist[i]);
                vals.push(offset);
            }
            return vals;
        }

        if (data['Encoding'] == 'IntegerB64') {
            var vals = [];
            var datastrlist = data['Data'].split(',');
            for (var i = 0; i < datastrlist.length; i++)
                vals.push(this.b64codec.B642Int(datastrlist[i]));
            return vals;
        }

        if (data['Encoding'] == 'FloatAsIntB64') {
            var offset = data['Offset'];
            var slope = data['Slope'];
            var bytecount = data['ByteCount'];
            var datastr = data['Data'];
            var vals = this.b64codec.ArrayB642Float(datastr, bytecount, slope, offset);
            return vals;
        }
        if (data['Encoding'] == 'Integer') {
            var vals = [];
            var datastrlist = data['Data'].split(',');
            for (var i = 0; i < datastrlist.length; i++) {
                vals.push(parseInt(datastrlist[i]));
            }
            return vals;
        }
        if (data['Encoding'] == 'String') {
            var vals = data['Data'].split('~');
            return vals;
        }
        throw "Unknown value list encoding: " + data['Encoding'];
    }
}
