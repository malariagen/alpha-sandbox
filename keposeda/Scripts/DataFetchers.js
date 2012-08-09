

//////////////////////////////////////////////////////////////////////////////////////
// A set of component classes that can be used to build an sql single table where clause
// and encode it to an url-friendly string
//////////////////////////////////////////////////////////////////////////////////////

//Encapsulates the comparison of a field to a fixed value
function DQXWhereClause_CompareFixed(icolname,icomptype,ivalue) {
    if (['=', '<', '>', '<=', '>=', '!=', 'LIKE'].indexOf(icomptype) < 0)
        throw "Invalid comparison where clause statement: " + icompoundtype;
    this.IsCompound = false;
    this.ColName = icolname;
    this.Tpe = icomptype;
    this.CompValue = ivalue
}

//Encapsulates a compound statement
function DQXWhereClause_Compound(icompoundtype, components) {
    if (['AND', 'OR'].indexOf(icompoundtype)<0)
        throw "Invalid compound where clause statement: " + icompoundtype;
    this.IsCompound = true;
    this.Tpe = icompoundtype;
    this.Components = components;
    if (this.Components==null) this.Components=[];
    this.AddComponent=function(icomp) {
        this.Components.push(icomp);
    }
}

//Encapsulates an AND statement
function DQXWhereClause_AND(components) {
    return new DQXWhereClause_Compound("AND", components);
}

//Encapsulates an OR statement
function DQXWhereClause_OR(components) {
    return new DQXWhereClause_Compound("OR", components);
}


//Encapsulates the absence of a where clause
function DQXWhereClause_Trivial() {
    this.Tpe = "";
}

//Encodes a whereclause object to an url-friendly string
function DQXEncodeWhereClause(whc) {
    var jsonstring = JSON.stringify(whc);
    var st = Base64.encode(jsonstring);
    st = st.replace("+", "-");
    st = st.replace("/", "_");
    return st;
}


//////////////////////////////////////////////////////////////////////////////////////
// Encapsulates a sql sort statement
//////////////////////////////////////////////////////////////////////////////////////

function DQXTableSort(icollist) {
    this.ColumnList = icollist;

    this.toString = function () {
        var rs = "";
        for (var i in this.ColumnList) {
            if (i > 0) rs += "~";
            rs += this.ColumnList[i];
        }
        return rs;
    }
}

//////////////////////////////////////////////////////////////////////////////////////
//  Class CurveDataColumn
//////////////////////////////////////////////////////////////////////////////////////

function CurveDataColumn(iEncoding, iColor) {

    this.EncodingList = {
        "String":  "ST",    //returns string data
        "Float2":  "F2",    //returns floats in 2 base64 bytes
        "Float3": "F3",     //returns floats in 3 base64 bytes
        "Int": "IN",        //returns exact integers
        "IntB64": "IB",     //returns exact integers
        "IntDiff": "ID"     //returns exact integers as differences with previous values
    }

    if (!(iEncoding in this.EncodingList))
        throw "Invalid column encoding " + iEncoding;
    this.EncodingID = this.EncodingList[iEncoding];

    this.ActiveCount = 0;
    this.Values = []; //holds the currently downloaded values of this column

    //PlotHints contain some information on how to draw a column
    this.PlotHints = new Object;
    this.PlotHints.DrawLines = false;
    this.PlotHints.Color = iColor; //holds the color used to draw this column


    this.ClearData = function () {
        this.Values = [];
    }

    this.IsActive = function () {
        return this.ActiveCount > 0;
    }

    //Call this function to let plots connect the dots with lines, if separated up to a given distance
    this.MakeDrawLines = function (maxdist) {
        this.PlotHints.DrawLines = true;
        this.PlotHints.MaxLineDist = maxdist;
    }
}


//////////////////////////////////////////////////////////////////////////////////////
//  Class CurveDataFetcher
//////////////////////////////////////////////////////////////////////////////////////

function CurveDataFetcher(iserverurl, itablename, ipositionfield) {

    this.serverurl = iserverurl; //The server url to contact for this
    this.tablename = itablename; //The name of the table to fetch from

    this.PositionField = ipositionfield; //The field that contains the position information (use 'LIMIT' for data fetchers that are based on record numbers)
    this.SortReverse = false;
    this.UseLimit = (ipositionfield=='LIMIT');//if true, position information are record numbers rather than positions in a columnn (used for paged table fetching)

    this.UserQuery = null; //an optional restricting query, defined as a DQXWhereClause style object

    //The currently fetched range of data
    this.CurrentRangeMin = 1000.0;
    this.CurrentRangeMax = -1000.0;

    this.PointsX = [];//X positions of all the currently downloaded points
    this.Columns = new Object; //maps column IDs to CurveDataColumn objects

    this.IsFetching = false;//If true, an ajax request was sent out and wasn't finished yet
    this.FetchFailed = false;//True if an error occurred while fetching the data

    //Removes all downloaded data, forcing a reload
    this.ClearData = function () {
        this.CurrentRangeMin = 1000.0;
        this.CurrentRangeMax = -1000.0;
        this.PointsX = [];
        for (var cid in this.Columns)
            this.Columns[cid].ClearData();
    }

    //adds a new column to be fetched, providing a column id and a color
    this.ColumnAdd = function (cid, encoding, colr) {
        this.Columns[cid] = new CurveDataColumn(encoding, colr);
        this.ClearData();
        return this.Columns[cid];
    }

    //removes a column
    this.ColumnDel = function (cid) {
        delete this.Columns[cid];
    }

    //call this function to request the presence of a column
    this.ColumnActivate = function (cid) {
        if (this.Columns[cid].ActiveCount == 0)
            this.ClearData();
        this.Columns[cid].ActiveCount++;
    }

    //call this function to stop requesting the presence of a column
    this.ColumnDesActivate = function (cid) {
        this.Columns[cid].ActiveCount--;
    }

    //internal
    this.AjaxResponse_FetchRange = function (resp) {
        this.FetchFailed = false;
        this.IsFetching = false;
        var keylist = DQXParseResponse(resp); //unpack the response

        if ("Error" in keylist) {
            this.FetchFailed = true;
            setTimeout($.proxy(this.Container.NotifyDataReady, this.Container), 5000);
            return;
        }


        //check that this ajax response contains all required columns (if not, this is likely to be an outdated response)
        for (var cid in this.Columns)
            if (this.Columns[cid].IsActive())
                if (!(cid in keylist)) {
                    this.Container.NotifyDataReady();
                    return; //if not, we should not proceed with parsing it
                }

        //update the currently downloaded range
        this.CurrentRangeMin = parseFloat(keylist["start"]);
        this.CurrentRangeMax = parseFloat(keylist["stop"]);

        if ('TotalRecordCount' in keylist)
            this.TotalRecordCount = keylist['TotalRecordCount'];

        //decode all the downloaded columns
        var b64codec = new B64();
        var vallistdecoder = new ValueListDecoder;
        if (keylist["DataType"] == "Points") {
            this.PointsX = vallistdecoder.Decode(keylist['XValues']);
            for (var cid in this.Columns)
                if (this.Columns[cid].IsActive()) {
                    this.Columns[cid].Values = vallistdecoder.Decode(keylist[cid]);
                }
            txt = "Fetched points: " + this.PointsX.length + " (" + resp.length / 1000.0 + "Kb, " + Math.round(resp.length / this.PointsX.length * 100) / 100 + "bytes/point)";
            $("#click2").text(txt);
        }

        //tell the consumer of this that the data are ready
        this.Container.NotifyDataReady();
    }

    //internal
    this.AjaxFailure_FetchRange = function (resp) {
        this.FetchFailed = true;
        this.IsFetching = false;
        //tell the consumer of this that the data are 'ready'
        //note: this will cause a requery, which is what we want
        //the timout introduces a delay, avoiding that the server is flooded with requeries
        setTimeout($.proxy(this.Container.NotifyDataReady,this.Container), 5000);
    }

    //internal: initiates the ajax data fetching call
    this.FetchRange = function (rangemin, rangemax) {
        if (!this.IsFetching) {
            //create a ~ separated string with column names to fetch (all the active columns)
            collist = "";
            for (var cid in this.Columns)
                if (this.Columns[cid].IsActive()) {
                    if (collist.length > 0) collist += "~";
                    collist += this.Columns[cid].EncodingID;
                    collist += cid;
                }
            //create some buffer around the requested range. This reduces the number of requests and gives the user a smoother experience when scrolling or zooming out
            range = rangemax - rangemin;
            rangemin -= 1.5 * range;
            rangemax += 1.5 * range;

            var qry = new DQXWhereClause_Trivial();
            if (!this.UseLimit) {
                //prepare where clause
                qry = new DQXWhereClause_Compound("AND");
                qry.AddComponent(new DQXWhereClause_CompareFixed(this.PositionField, '>=', rangemin));
                qry.AddComponent(new DQXWhereClause_CompareFixed(this.PositionField, '<=', rangemax));
                if (this.UserQuery != null) qry.AddComponent(this.UserQuery);
            }
            else {
                if (this.UserQuery != null) qry = this.UserQuery;
            }

            var qrytype="qry";
            if (this.UseLimit) qrytype = "pageqry"

            //prepare the url
            var myurl = this.serverurl + "?datatype="+qrytype
                + "&qry=" + DQXEncodeWhereClause(qry)
                + "&tbname=" + this.tablename
                + "&collist=" + collist
                + "&order=" + this.PositionField
                + "&start=" + rangemin//not used by server: only used for reflecting info to this client response code
                + "&stop=" + rangemax//idem
                + "&sortreverse="+(this.SortReverse?1:0)
                ;

            if (this.UseLimit)
                myurl += "&limit="+rangemin+"~"+rangemax;

            if (collist.length > 0) {//launch the ajax request
                this.IsFetching = true;
                $.ajax({
                    url: myurl,
                    context: this,
                    success: this.AjaxResponse_FetchRange,
                    error: this.AjaxFailure_FetchRange
                });
            }
            else {
                //todo: somehow update without the need for fetching?
            }
        }
    }


    //Call this to determine if all data in a specific range is ready, and start fetching new data if necessary
    this.IsDataReady = function (rangemin, rangemax) {
        if ((rangemin >= this.CurrentRangeMin) && (rangemax <= this.CurrentRangeMax)) {
            var buffer = (rangemax - rangemin) / 2;
            if ((rangemin - buffer < this.CurrentRangeMin) || (rangemax + buffer > this.CurrentRangeMax)) {
                this.FetchRange(rangemin, rangemax);
            }
            return true;
        }
        else {
            this.FetchRange(rangemin, rangemax);
            return false;
        }
    }


    this.FindIndexByXVal = function (xval) {
        //todo: optimise this using binary intersection
        if ('PointsX' in this) {
            for (var trypt in this.PointsX)
                if (xval == this.PointsX[trypt])
                    return trypt;
        }
        return -1; //means not found
    }

    //get point data for a specific column in a specific range
    this.GetColumnPoints = function (rangemin, rangemax, cid) {
        var thedata = new Object;
        //todo: optimise both loops using binary intersection
        for (var startpt = 0; (startpt < this.PointsX.length - 1) && (this.PointsX[startpt] < rangemin); startpt++);
        for (var endpt = this.PointsX.length - 1; (endpt > 0) && (this.PointsX[endpt] > rangemax); endpt--);
        if (startpt > 0) startpt--;
        if (endpt < this.PointsX.length - 1) endpt++;
        thedata.StartIndex = startpt; //the start index of the returned set in the current load set
        thedata.XVals = []; //the positions of the points
        for (var i = startpt; i <= endpt; i++) thedata.XVals.push(this.PointsX[i]);
        thedata.YVals = []; //the column values (or 'y' values in most cases)
        var yvalues = this.Columns[cid];
        for (var i = startpt; i <= endpt; i++) thedata.YVals.push(yvalues.Values[i]);
        return thedata;
    }

    //get the position for a specific point in the current load set
    this.GetPosition = function (currentloadindex) {
        if ((currentloadindex < 0) || (currentloadindex >= this.PointsX.length)) return null;
        return this.PointsX[currentloadindex];
    }

    //get the column value for a specific point in the current load set
    this.GetColumnPoint = function (currentloadindex, cid) {
        if ((currentloadindex < 0) || (currentloadindex >= this.PointsX.length)) return null;
        var mycol = this.Columns[cid];
        return mycol.Values[currentloadindex];
    }


    //return the color of a column
    this.GetColumnColor = function (cid) {
        return this.Columns[cid].PlotHints.Color;
    }

    //return the plot hints of a column
    this.GetColumnPlotHints = function (cid) {
        return this.Columns[cid].PlotHints;
    }


    //internal
    this.AjaxFailure_FetchPoint = function (resp) {
        //todo: what to do here?
        this.IsFetching = false;
    }

    //fetches all information about an individual point
    //whereclause: a DQXWhereClause style object
    this.FetchFullRecordInfo = function (whereclause, CallbackFunction, FailFunction) {
        //prepare the url
        var myurl = this.serverurl+"?datatype=recordinfo"
            + "&qry=" + DQXEncodeWhereClause(whereclause)
            + "&tbname=" + this.tablename   //tablename to fetch from
        var AjaxResponse_FetchPoint = function (resp) {
            CallbackFunction(DQXParseResponse(resp).Data);
        }
        $.ajax({
            url: myurl,
            //context: this,
            success: AjaxResponse_FetchPoint,
            error: FailFunction
        });
    }

}



//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

function AnnotDataFetcher(iserverurl) {

    this.serverurl = iserverurl;
    this.ChromoNr = 1;
    this.CurrentRangeMin = 1000.0;
    this.CurrentRangeMax = -1000.0;
    this.Start = [];
    this.Stop = [];
    this.Name = [];
    this.ID = [];
    this.IsFetching = false;
    this.FetchFailed = false;

    this.ClearData = function () {
        this.CurrentRangeMin = 1000.0;
        this.CurrentRangeMax = -1000.0;
        this.Start = [];
        this.Stop = [];
        this.Name = [];
        this.ID = [];
    }

    this.AjaxResponse = function (resp) {
        this.FetchFailed = false;
        this.IsFetching = false;
        var vallistdecoder = new ValueListDecoder;
        var keylist = DQXParseResponse(resp);
        if ("Error" in keylist) {
            this.FetchFailed = true;
            setTimeout($.proxy(this.Container.NotifyDataReady, this.Container), 5000);
            return;
        }
        this.CurrentRangeMin = parseFloat(keylist["start"]);
        this.CurrentRangeMax = parseFloat(keylist["stop"]);
        this.Start = vallistdecoder.Decode(keylist['Starts']);
        var sizes = vallistdecoder.Decode(keylist['Sizes']);
        this.Stop = [];
        for (var i = 0; i < this.Start.length; i++)
            this.Stop.push(this.Start[i] + sizes[i]);
        this.Name = vallistdecoder.Decode(keylist['Names']);
        this.ID = vallistdecoder.Decode(keylist['IDs']);
        this.Container.NotifyDataReady();
    }

    this.AjaxFailure = function (resp) {
        this.FetchFailed = true;
        this.IsFetching = false;
        setTimeout($.proxy(this.Container.NotifyDataReady, this.Container), 5000);
    }

    this.FetchRange = function (rangemin, rangemax) {
        if (!this.IsFetching) {
            range = rangemax - rangemin;
            rangemin -= range;
            rangemax += range;
            var myurl = this.serverurl+"?datatype=annot&chrom=" + this.ChromoNr + "&start=" + rangemin + "&stop=" + rangemax;
            this.IsFetching = true;
            $.ajax({
                url: myurl,
                dataType: 'TEXT',
                type: 'get',
                context: this,
                success: this.AjaxResponse,
                error: this.AjaxFailure
            });
        }
    }


    this.IsDataReady = function (rangemin, rangemax) {
        if ((rangemin >= this.CurrentRangeMin) && (rangemax <= this.CurrentRangeMax)) {
            return true;
        }
        else {
            this.FetchRange(rangemin, rangemax);
            return false;
        }
    }


    this.GetData = function (rangemin, rangemax) {
        var thedata = new Object;
        thedata.Start = [];
        thedata.Stop = [];
        thedata.Name = [];
        thedata.ID = [];
        for (i = 0; i < this.Start.length; i++)
            if ((this.Stop[i] >= rangemin) && (this.Start[i] <= rangemax)) {
                thedata.Start.push(this.Start[i]);
                thedata.Stop.push(this.Stop[i]);
                thedata.Name.push(this.Name[i]);
                thedata.ID.push(this.ID[i]);
            }
        return thedata;
    }

    //fetches all annotation for a single record
    this.FetchFullAnnotInfo = function (id, CallbackFunction, FailFunction) {
        //prepare the url
        var myurl = this.serverurl + "?datatype=fullannotinfo&id=" + id;
        var AjaxResponse_FetchPoint = function (resp) {
        //todo: error handling
            CallbackFunction(DQXParseResponse(resp).Data);
        }
        $.ajax({
            url: myurl,
            //context: this,
            success: AjaxResponse_FetchPoint,
            error: FailFunction
        });
    }

}






