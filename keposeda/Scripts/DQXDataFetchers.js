

DQX.DataFetcher = {}

//////////////////////////////////////////////////////////////////////////////////////
//  Class DQX.DataFetcher.CurveColumn
//////////////////////////////////////////////////////////////////////////////////////

DQX.DataFetcher.CurveColumn = function (iEncoding, iColor) {
    var that = {};
    that.EncodingList = {
        "String": "ST",    //returns string data
        "Float2": "F2",    //returns floats in 2 base64 bytes
        "Float3": "F3",     //returns floats in 3 base64 bytes
        "Int": "IN",        //returns exact integers
        "IntB64": "IB",     //returns exact integers
        "IntDiff": "ID"     //returns exact integers as differences with previous values
    }

    if (!(iEncoding in that.EncodingList))
        throw "Invalid column encoding " + iEncoding;
    that.EncodingID = that.EncodingList[iEncoding];

    that.ActiveCount = 0;
    that.Values = []; //holds the currently downloaded values of this column

    //PlotHints contain some information on how to draw a column
    that.PlotHints = {};
    that.PlotHints.DrawLines = false;
    that.PlotHints.Color = iColor; //holds the color used to draw this column


    that.ClearData = function () {
        this.Values = [];
    }

    that.IsActive = function () {
        return this.ActiveCount > 0;
    }

    //Call this function to let plots connect the dots with lines, if separated up to a given distance
    that.MakeDrawLines = function (maxdist) {
        this.PlotHints.DrawLines = true;
        this.PlotHints.MaxLineDist = maxdist;
    }

    return that;
}


//////////////////////////////////////////////////////////////////////////////////////
//  Class DQX.DataFetcher.Curve
//////////////////////////////////////////////////////////////////////////////////////

DQX.DataFetcher.Curve = function (iserverurl, itablename, ipositionfield) {
    if (!(this instanceof arguments.callee)) throw "Should be called as constructor!";

    this.serverurl = iserverurl; //The server url to contact for this
    this.tablename = itablename; //The name of the table to fetch from

    this.PositionField = ipositionfield; //The field that contains the position information (use 'LIMIT' for data fetchers that are based on record numbers)
    this.SortReverse = false;
    this.UseLimit = (ipositionfield == 'LIMIT'); //if true, position information are record numbers rather than positions in a columnn (used for paged table fetching)

    this._UserQuery = null; //an optional restricting query, defined as a DQXWhereClause style object

    //The currently fetched range of data
    this.CurrentRangeMin = 1000.0;
    this.CurrentRangeMax = -1000.0;

    this.PointsX = []; //X positions of all the currently downloaded points
    this.Columns = {}; //maps column IDs to DQX.DataFetcher.CurveColumn objects
    this.TotalRecordCount = -1;

    this.IsFetching = false; //If true, an ajax request was sent out and wasn't finished yet
    this.FetchFailed = false; //True if an error occurred while fetching the data

    //Removes all downloaded data, forcing a reload
    this.ClearData = function () {
        this.CurrentRangeMin = 1000.0;
        this.CurrentRangeMax = -1000.0;
        this.PointsX = [];
        for (var cid in this.Columns)
            this.Columns[cid].ClearData();
        this.TotalRecordCount = -1;
        this.IsFetching = false;
    }

    //defines a custom query to apply on the data records
    this.SetUserQuery = function (iquery) {
        this._UserQuery = iquery;
        this.ClearData();
    }


    //adds a column to be fetched, providing a column id and a color
    this.ColumnAdd = function (cid, encoding, colr) {
        this.Columns[cid] = DQX.DataFetcher.CurveColumn(encoding, colr);
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
        if (!this.IsFetching) return;
        this.FetchFailed = false;
        this.IsFetching = false;
        var keylist = DQX.ParseResponse(resp); //unpack the response

        if ("Error" in keylist) {
            this.FetchFailed = true;
            setTimeout($.proxy(this.Container.NotifyDataReady, this.Container), DQX.timeoutRetry);
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
        var b64codec = DQX.B64();
        var vallistdecoder = DQX.ValueListDecoder();
        if (keylist["DataType"] == "Points") {
            this.PointsX = vallistdecoder.Decode(keylist['XValues']);
            for (var cid in this.Columns)
                if (this.Columns[cid].IsActive()) {
                    this.Columns[cid].Values = vallistdecoder.Decode(keylist[cid]);
                }
            //txt = "Fetched points: " + this.PointsX.length + " (" + resp.length / 1000.0 + "Kb, " + Math.round(resp.length / this.PointsX.length * 100) / 100 + "bytes/point)";
            //$("#click2").text(txt);
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
        setTimeout($.proxy(this.Container.NotifyDataReady, this.Container), DQX.timeoutRetry);
    }

    this._createActiveColumnListString = function () {
        var collist = "";
        for (var cid in this.Columns)
            if (this.Columns[cid].IsActive()) {
                if (collist.length > 0) collist += "~";
                collist += this.Columns[cid].EncodingID;
                collist += cid;
            }
        return collist;
    }

    this.isValid = function () {
        if (this._UserQuery == null) return true;
        return !this._UserQuery.isNone;
    }

    //internal: initiates the ajax data fetching call
    this.FetchRange = function (rangemin, rangemax, needtotalrecordcount) {

        if ((this._UserQuery) && (this._UserQuery.isNone)) {//Query indicates that we should fetch nothing!
            this.FetchFailed = false;
            this.IsFetching = false;
            range = rangemax - rangemin;
            rangemin -= 1.5 * range;
            rangemax += 1.5 * range;
            this.CurrentRangeMin = rangemin;
            this.CurrentRangeMax = rangemax;
            this.PointsX = [];
            for (var cid in this.Columns)
                this.Columns[cid].Values = [];
            this.TotalRecordCount = 0;
            setTimeout($.proxy(this.Container.NotifyDataReady, this.Container), DQX.timeoutRetry);
            return;
        }

        if (!this.IsFetching) {
            var collist = this._createActiveColumnListString();
            //create some buffer around the requested range. This reduces the number of requests and gives the user a smoother experience when scrolling or zooming out
            range = rangemax - rangemin;
            rangemin -= 1.5 * range;
            rangemax += 1.5 * range;

            var qry = DQX.SQL.WhereClause.Trivial();
            if (!this.UseLimit) {
                //prepare where clause
                qry = DQX.SQL.WhereClause.AND();
                qry.AddComponent(DQX.SQL.WhereClause.CompareFixed(this.PositionField, '>=', rangemin));
                qry.AddComponent(DQX.SQL.WhereClause.CompareFixed(this.PositionField, '<=', rangemax));
                if (this._UserQuery != null) qry.AddComponent(this._UserQuery);
            }
            else {
                if (this._UserQuery != null) qry = this._UserQuery;
            }

            var qrytype = "qry";
            if (this.UseLimit) qrytype = "pageqry"

            //prepare the url
            var myurl = DQX.Url(this.serverurl);
            myurl.AddQuery("datatype", qrytype);
            myurl.AddQuery("qry", DQX.SQL.WhereClause.Encode(qry));
            myurl.AddQuery("tbname", this.tablename);
            myurl.AddQuery("collist", collist);
            myurl.AddQuery("posfield", this.PositionField);
            myurl.AddQuery("order", this.PositionField);
            myurl.AddQuery("start", rangemin); //not used by server: only used for reflecting info to this client response code
            myurl.AddQuery("stop", rangemax); //idem
            myurl.AddQuery("sortreverse", this.SortReverse ? 1 : 0);
            myurl.AddQuery("needtotalcount", ((this.TotalRecordCount < 0) && (needtotalrecordcount)) ? 1 : 0);


            if (this.UseLimit)
                myurl.AddQuery("limit", rangemin + "~" + rangemax);

            if (collist.length > 0) {//launch the ajax request
                this.IsFetching = true;
                var thethis = this;
                $.ajax({
                    url: myurl.toString(),
                    success: function (resp) { thethis.AjaxResponse_FetchRange(resp) },
                    error: function (resp) { thethis.AjaxFailure_FetchRange(resp) }
                });
            }
            else {
                //todo: somehow update without the need for fetching?
            }
        }
    }


    this.CreateDownloadUrl = function () {
        //prepare the url
        var collist = this._createActiveColumnListString();
        var thequery = DQX.SQL.WhereClause.Trivial();
        if (this._UserQuery != null)
            thequery = this._UserQuery;
        var myurl = DQX.Url(this.serverurl);
        myurl.AddQuery("datatype", "downloadtable");
        myurl.AddQuery("qry", DQX.SQL.WhereClause.Encode(thequery));
        myurl.AddQuery("tbname", this.tablename);
        myurl.AddQuery("collist", collist);
        myurl.AddQuery("posfield", this.PositionField);
        myurl.AddQuery("order", this.PositionField);
        myurl.AddQuery("sortreverse", this.SortReverse ? 1 : 0);
        return myurl.toString();
    }

    //Call this to determine if all data in a specific range is ready, and start fetching extra data if necessary
    this.IsDataReady = function (rangemin, rangemax, needtotalrecordcount) {
        if ((rangemin >= this.CurrentRangeMin) && (rangemax <= this.CurrentRangeMax)) {
            var buffer = (rangemax - rangemin) / 2;
            if ((rangemin - buffer < this.CurrentRangeMin) || (rangemax + buffer > this.CurrentRangeMax)) {
                this.FetchRange(rangemin, rangemax, needtotalrecordcount);
            }
            return true;
        }
        else {
            this.FetchRange(rangemin, rangemax, needtotalrecordcount);
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
        var thedata = {};
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
        var myurl = DQX.Url(this.serverurl);
        myurl.AddQuery("datatype", 'recordinfo');
        myurl.AddQuery("qry", DQX.SQL.WhereClause.Encode(whereclause));
        myurl.AddQuery("tbname", this.tablename); //tablename to fetch from
        var AjaxResponse_FetchPoint = function (resp) {
            CallbackFunction(DQX.ParseResponse(resp).Data);
        }
        $.ajax({
            url: myurl.toString(),
            success: AjaxResponse_FetchPoint,
            error: FailFunction
        });
    }

}



//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

DQX.DataFetcher.Annot = function (iconfig) {
    if (!(this instanceof arguments.callee)) throw "Should be called as constructor!";

    this.config = iconfig;


    DQX.AssertPresence(this.config, 'serverurl');
    DQX.AssertPresence(this.config, 'chromnrfield');
    DQX.AssertPresence(this.config, 'annottablename');
    DQX.AssertPresence(this.config, 'annotstartfield');
    DQX.AssertPresence(this.config, 'annotstopfield');
    DQX.AssertPresence(this.config, 'annotnamefield');
    DQX.AssertPresence(this.config, 'annotidfield');


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
        var vallistdecoder = DQX.ValueListDecoder();
        var keylist = DQX.ParseResponse(resp);
        if ("Error" in keylist) {
            this.FetchFailed = true;
            setTimeout($.proxy(this.Container.NotifyDataReady, this.Container), DQX.timeoutRetry);
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
        setTimeout($.proxy(this.Container.NotifyDataReady, this.Container), DQX.timeoutRetry);
    }

    this.FetchRange = function (rangemin, rangemax) {
        if (!this.IsFetching) {
            range = rangemax - rangemin;
            rangemin -= range;
            rangemax += range;
            var myurl = DQX.Url(this.config.serverurl);
            myurl.AddQuery('datatype', 'annot');
            myurl.AddQuery('chrom', this.ChromoNr);
            myurl.AddQuery('start', rangemin);
            myurl.AddQuery('stop', rangemax);
            myurl.AddQuery('table', this.config.annottablename);
            myurl.AddQuery('chromnrfield', this.config.chromnrfield);
            myurl.AddQuery('startfield', this.config.annotstartfield);
            myurl.AddQuery('stopfield', this.config.annotstopfield);
            myurl.AddQuery('namefield', this.config.annotnamefield);
            myurl.AddQuery('idfield', this.config.annotidfield);
            this.IsFetching = true;
            var thethis = this;
            $.ajax({
                url: myurl.toString(),
                dataType: 'TEXT',
                type: 'get',
                success: function (resp) { thethis.AjaxResponse(resp); },
                error: function (resp) { thethis.AjaxFailure(resp); }
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
        var thedata = {};
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

        var myurl = DQX.Url(this.config.serverurl);
        myurl.AddQuery('datatype', 'fullannotinfo');
        myurl.AddQuery('table', this.config.annottablename);
        myurl.AddQuery('idfield', this.config.annotidfield);
        myurl.AddQuery('id', id);
        var AjaxResponse_FetchPoint = function (resp) {
            //todo: error handling
            CallbackFunction(DQX.ParseResponse(resp).Data);
        }
        $.ajax({
            url: myurl.toString(),
            success: AjaxResponse_FetchPoint,
            error: FailFunction
        });
    }

}






