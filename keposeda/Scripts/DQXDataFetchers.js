﻿

DQX.DataFetcher = {}

//////////////////////////////////////////////////////////////////////////////////////
//  Class DQX.DataFetcher.CurveColumn
//////////////////////////////////////////////////////////////////////////////////////

DQX.DataFetcher.CurveColumn = function (iEncoding, iColor) {
    var that = {};
    that.myEncodingList = {
        "String": "ST",    //returns string data
        "Float2": "F2",    //returns floats in 2 base64 bytes
        "Float3": "F3",     //returns floats in 3 base64 bytes
        "Int": "IN",        //returns exact integers
        "IntB64": "IB",     //returns exact integers
        "IntDiff": "ID"     //returns exact integers as differences with previous values
    }

    if (!(iEncoding in that.myEncodingList))
        throw "Invalid column encoding " + iEncoding;
    that.myEncodingID = that.myEncodingList[iEncoding];

    that.myActiveCount = 0;
    that.myDownloadValues = []; //holds the currently downloaded values of this column

    //myPlotHints contain some information on how to draw a column !!!todo: this isn't the right place, one day we need to move this!
    that.myPlotHints = {};
    that.myPlotHints.drawLines = false;
    that.myPlotHints.Color = iColor; //holds the color used to draw this column


    that.clearData = function () {
        this.myDownloadValues = [];
    }

    that.isActive = function () {
        return this.myActiveCount > 0;
    }

    //Call this function to let plots connect the dots with lines, if separated up to a given distance
    that.makeDrawLines = function (maxdist) {
        this.myPlotHints.drawLines = true;
        this.myPlotHints.maxLineDist = maxdist;
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

    this.positionField = ipositionfield; //The field that contains the position information (use 'LIMIT' for data fetchers that are based on record numbers)
    this.sortReverse = false;
    this.useLimit = (ipositionfield == 'LIMIT'); //if true, position information are record numbers rather than positions in a columnn (used for paged table fetching)

    this._userQuery = null; //an optional restricting query, defined as a DQXWhereClause style object

    //The currently fetched range of data
    this._currentRangeMin = 1000.0;
    this._currentRangeMax = -1000.0;

    this.myDownloadPointsX = []; //X positions of all the currently downloaded points
    this.myColumns = {}; //maps column IDs to DQX.DataFetcher.CurveColumn objects
    this.totalRecordCount = -1;

    this._isFetching = false; //If true, an ajax request was sent out and wasn't finished yet
    this.hasFetchFailed = false; //True if an error occurred while fetching the data

    //Removes all downloaded data, forcing a reload
    this.clearData = function () {
        this._currentRangeMin = 1000.0;
        this._currentRangeMax = -1000.0;
        this.myDownloadPointsX = [];
        for (var cid in this.myColumns)
            this.myColumns[cid].clearData();
        this.totalRecordCount = -1;
        this._isFetching = false;
    }

    //defines a custom query to apply on the data records
    this.setUserQuery = function (iquery) {
        this._userQuery = iquery;
        this.clearData();
    }


    //adds a column to be fetched, providing a column id and a color
    this.addFetchColumn = function (cid, encoding, colr) {
        this.myColumns[cid] = DQX.DataFetcher.CurveColumn(encoding, colr);
        this.clearData();
        return this.myColumns[cid];
    }

    //removes a column
    this.delFetchColumn = function (cid) {
        delete this.myColumns[cid];
    }

    //call this function to request the presence of a column
    this.activateFetchColumn = function (cid) {
        if (this.myColumns[cid].myActiveCount == 0)
            this.clearData();
        this.myColumns[cid].myActiveCount++;
    }

    //call this function to stop requesting the presence of a column
    this.deactivateFetchColumn = function (cid) {
        this.myColumns[cid].myActiveCount--;
    }

    //internal
    this._ajaxResponse_FetchRange = function (resp) {
        if (!this._isFetching) return;
        this.hasFetchFailed = false;
        this._isFetching = false;
        var keylist = DQX.parseResponse(resp); //unpack the response

        if ("Error" in keylist) {
            this.hasFetchFailed = true;
            setTimeout($.proxy(this.myDataConsumer.notifyDataReady, this.myDataConsumer), DQX.timeoutRetry);
            return;
        }


        //check that this ajax response contains all required columns (if not, this is likely to be an outdated response)
        for (var cid in this.myColumns)
            if (this.myColumns[cid].isActive())
                if (!(cid in keylist)) {
                    this.myDataConsumer.notifyDataReady();
                    return; //if not, we should not proceed with parsing it
                }

        //update the currently downloaded range
        this._currentRangeMin = parseFloat(keylist["start"]);
        this._currentRangeMax = parseFloat(keylist["stop"]);

        if ('TotalRecordCount' in keylist)
            this.totalRecordCount = keylist['TotalRecordCount'];

        //decode all the downloaded columns
        var b64codec = DQX.B64();
        var vallistdecoder = DQX.ValueListDecoder();
        if (keylist["DataType"] == "Points") {
            this.myDownloadPointsX = vallistdecoder.doDecode(keylist['XValues']);
            for (var cid in this.myColumns)
                if (this.myColumns[cid].isActive()) {
                    this.myColumns[cid].myDownloadValues = vallistdecoder.doDecode(keylist[cid]);
                }
            //txt = "Fetched points: " + this.myDownloadPointsX.length + " (" + resp.length / 1000.0 + "Kb, " + Math.round(resp.length / this.myDownloadPointsX.length * 100) / 100 + "bytes/point)";
            //$("#click2").text(txt);
        }

        //tell the consumer of this that the data are ready
        this.myDataConsumer.notifyDataReady();
    }

    //internal
    this._ajaxFailure_FetchRange = function (resp) {
        this.hasFetchFailed = true;
        this._isFetching = false;
        //tell the consumer of this that the data are 'ready'
        //note: this will cause a requery, which is what we want
        //the timout introduces a delay, avoiding that the server is flooded with requeries
        setTimeout($.proxy(this.myDataConsumer.notifyDataReady, this.myDataConsumer), DQX.timeoutRetry);
    }

    this._createActiveColumnListString = function () {
        var collist = "";
        for (var cid in this.myColumns)
            if (this.myColumns[cid].isActive()) {
                if (collist.length > 0) collist += "~";
                collist += this.myColumns[cid].myEncodingID;
                collist += cid;
            }
        return collist;
    }

    this.isValid = function () {
        if (this._userQuery == null) return true;
        return !this._userQuery.isNone;
    }

    //internal: initiates the ajax data fetching call
    this._fetchRange = function (rangemin, rangemax, needtotalrecordcount) {

        if ((this._userQuery) && (this._userQuery.isNone)) {//Query indicates that we should fetch nothing!
            this.hasFetchFailed = false;
            this._isFetching = false;
            range = rangemax - rangemin;
            rangemin -= 1.5 * range;
            rangemax += 1.5 * range;
            this._currentRangeMin = rangemin;
            this._currentRangeMax = rangemax;
            this.myDownloadPointsX = [];
            for (var cid in this.myColumns)
                this.myColumns[cid].myDownloadValues = [];
            this.totalRecordCount = 0;
            setTimeout($.proxy(this.myDataConsumer.notifyDataReady, this.myDataConsumer), DQX.timeoutRetry);
            return;
        }

        if (!this._isFetching) {
            var collist = this._createActiveColumnListString();
            //create some buffer around the requested range. This reduces the number of requests and gives the user a smoother experience when scrolling or zooming out
            range = rangemax - rangemin;
            rangemin -= 1.5 * range;
            rangemax += 1.5 * range;

            var qry = DQX.SQL.WhereClause.Trivial();
            if (!this.useLimit) {
                //prepare where clause
                qry = DQX.SQL.WhereClause.AND();
                qry.addComponent(DQX.SQL.WhereClause.CompareFixed(this.positionField, '>=', rangemin));
                qry.addComponent(DQX.SQL.WhereClause.CompareFixed(this.positionField, '<=', rangemax));
                if (this._userQuery != null) qry.addComponent(this._userQuery);
            }
            else {
                if (this._userQuery != null) qry = this._userQuery;
            }

            var qrytype = "qry";
            if (this.useLimit) qrytype = "pageqry"

            //prepare the url
            var myurl = DQX.Url(this.serverurl);
            myurl.addUrlQueryItem("datatype", qrytype);
            myurl.addUrlQueryItem("qry", DQX.SQL.WhereClause.encode(qry));
            myurl.addUrlQueryItem("tbname", this.tablename);
            myurl.addUrlQueryItem("collist", collist);
            myurl.addUrlQueryItem("posfield", this.positionField);
            myurl.addUrlQueryItem("order", this.positionField);
            myurl.addUrlQueryItem("start", rangemin); //not used by server: only used for reflecting info to this client response code
            myurl.addUrlQueryItem("stop", rangemax); //idem
            myurl.addUrlQueryItem("sortreverse", this.sortReverse ? 1 : 0);
            myurl.addUrlQueryItem("needtotalcount", ((this.totalRecordCount < 0) && (needtotalrecordcount)) ? 1 : 0);


            if (this.useLimit)
                myurl.addUrlQueryItem("limit", rangemin + "~" + rangemax);

            if (collist.length > 0) {//launch the ajax request
                this._isFetching = true;
                var thethis = this;
                $.ajax({
                    url: myurl.toString(),
                    success: function (resp) { thethis._ajaxResponse_FetchRange(resp) },
                    error: function (resp) { thethis._ajaxFailure_FetchRange(resp) }
                });
            }
            else {
                //todo: somehow update without the need for fetching?
            }
        }
    }


    //Returns the url that can be used to download the data set this fetcher is currently serving
    this.createDownloadUrl = function () {
        //prepare the url
        var collist = this._createActiveColumnListString();
        var thequery = DQX.SQL.WhereClause.Trivial();
        if (this._userQuery != null)
            thequery = this._userQuery;
        var myurl = DQX.Url(this.serverurl);
        myurl.addUrlQueryItem("datatype", "downloadtable");
        myurl.addUrlQueryItem("qry", DQX.SQL.WhereClause.encode(thequery));
        myurl.addUrlQueryItem("tbname", this.tablename);
        myurl.addUrlQueryItem("collist", collist);
        myurl.addUrlQueryItem("posfield", this.positionField);
        myurl.addUrlQueryItem("order", this.positionField);
        myurl.addUrlQueryItem("sortreverse", this.sortReverse ? 1 : 0);
        return myurl.toString();
    }

    //Call this to determine if all data in a specific range is ready, and start fetching extra data if necessary
    this.IsDataReady = function (rangemin, rangemax, needtotalrecordcount) {
        if ((rangemin >= this._currentRangeMin) && (rangemax <= this._currentRangeMax)) {
            var buffer = (rangemax - rangemin) / 2;
            if ((rangemin - buffer < this._currentRangeMin) || (rangemax + buffer > this._currentRangeMax)) {
                this._fetchRange(rangemin, rangemax, needtotalrecordcount);
            }
            return true;
        }
        else {
            this._fetchRange(rangemin, rangemax, needtotalrecordcount);
            return false;
        }
    }

    //For a given X value, returns the index in the current download set
    this.findIndexByXVal = function (xval) {
        //todo: optimise this using binary intersection
        if ('myDownloadPointsX' in this) {
            for (var trypt in this.myDownloadPointsX)
                if (xval == this.myDownloadPointsX[trypt])
                    return trypt;
        }
        return -1; //means not found
    }

    //get point data for a specific column in a specific range
    this.getColumnPoints = function (rangemin, rangemax, cid) {
        var thedata = {};
        //todo: optimise both loops using binary intersection
        for (var startpt = 0; (startpt < this.myDownloadPointsX.length - 1) && (this.myDownloadPointsX[startpt] < rangemin); startpt++);
        for (var endpt = this.myDownloadPointsX.length - 1; (endpt > 0) && (this.myDownloadPointsX[endpt] > rangemax); endpt--);
        if (startpt > 0) startpt--;
        if (endpt < this.myDownloadPointsX.length - 1) endpt++;
        thedata.startIndex = startpt; //the start index of the returned set in the current load set
        thedata.xVals = []; //the positions of the points
        for (var i = startpt; i <= endpt; i++) thedata.xVals.push(this.myDownloadPointsX[i]);
        thedata.YVals = []; //the column values (or 'y' values in most cases)
        var yvalues = this.myColumns[cid];
        for (var i = startpt; i <= endpt; i++) thedata.YVals.push(yvalues.myDownloadValues[i]);
        return thedata;
    }

    //get the position for a specific point in the current load set
    this.getPosition = function (currentloadindex) {
        if ((currentloadindex < 0) || (currentloadindex >= this.myDownloadPointsX.length)) return null;
        return this.myDownloadPointsX[currentloadindex];
    }

    //get the column value for a specific point in the current load set
    this.getColumnPoint = function (currentloadindex, cid) {
        if ((currentloadindex < 0) || (currentloadindex >= this.myDownloadPointsX.length)) return null;
        var mycol = this.myColumns[cid];
        return mycol.myDownloadValues[currentloadindex];
    }


    //return the color of a column
    this.getColumnColor = function (cid) {
        return this.myColumns[cid].myPlotHints.Color;
    }

    //return the plot hints of a column
    this.getColumnPlotHints = function (cid) {
        return this.myColumns[cid].myPlotHints;
    }


    //internal
    this._ajaxFailure_FetchPoint = function (resp) {
        //todo: what to do here?
        this._isFetching = false;
    }

    //fetches all information about an individual point
    //whereclause: a DQXWhereClause style object
    this.fetchFullRecordInfo = function (whereclause, theCallbackFunction, theFailFunction) {
        //prepare the url
        var myurl = DQX.Url(this.serverurl);
        myurl.addUrlQueryItem("datatype", 'recordinfo');
        myurl.addUrlQueryItem("qry", DQX.SQL.WhereClause.encode(whereclause));
        myurl.addUrlQueryItem("tbname", this.tablename); //tablename to fetch from
        var _ajaxResponse_FetchPoint = function (resp) {
            theCallbackFunction(DQX.parseResponse(resp).Data);
        }
        $.ajax({
            url: myurl.toString(),
            success: _ajaxResponse_FetchPoint,
            error: theFailFunction
        });
    }

}



//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

DQX.DataFetcher.Annot = function (iconfig) {
    if (!(this instanceof arguments.callee)) throw "Should be called as constructor!";

    this.config = iconfig;


    DQX.assertPresence(this.config, 'serverurl');
    DQX.assertPresence(this.config, 'chromnrfield');
    DQX.assertPresence(this.config, 'annottablename');
    DQX.assertPresence(this.config, 'annotstartfield');
    DQX.assertPresence(this.config, 'annotstopfield');
    DQX.assertPresence(this.config, 'annotnamefield');
    DQX.assertPresence(this.config, 'annotidfield');


    this.myChromoNr = 1;
    this._currentRangeMin = 1000.0;
    this._currentRangeMax = -1000.0;
    this.myStartList = [];
    this.myStopList = [];
    this.myNameList = [];
    this.myIDList = [];
    this._isFetching = false;
    this.hasFetchFailed = false;

    this.clearData = function () {
        this._currentRangeMin = 1000.0;
        this._currentRangeMax = -1000.0;
        this.myStartList = [];
        this.myStopList = [];
        this.myNameList = [];
        this.myIDList = [];
    }

    this.AjaxResponse = function (resp) {
        this.hasFetchFailed = false;
        this._isFetching = false;
        var vallistdecoder = DQX.ValueListDecoder();
        var keylist = DQX.parseResponse(resp);
        if ("Error" in keylist) {
            this.hasFetchFailed = true;
            setTimeout($.proxy(this.myDataConsumer.notifyDataReady, this.myDataConsumer), DQX.timeoutRetry);
            return;
        }
        this._currentRangeMin = parseFloat(keylist["start"]);
        this._currentRangeMax = parseFloat(keylist["stop"]);
        this.myStartList = vallistdecoder.doDecode(keylist['Starts']);
        var sizes = vallistdecoder.doDecode(keylist['Sizes']);
        this.myStopList = [];
        for (var i = 0; i < this.myStartList.length; i++)
            this.myStopList.push(this.myStartList[i] + sizes[i]);
        this.myNameList = vallistdecoder.doDecode(keylist['Names']);
        this.myIDList = vallistdecoder.doDecode(keylist['IDs']);
        this.myDataConsumer.notifyDataReady();
    }

    this._ajaxFailure = function (resp) {
        this.hasFetchFailed = true;
        this._isFetching = false;
        setTimeout($.proxy(this.myDataConsumer.notifyDataReady, this.myDataConsumer), DQX.timeoutRetry);
    }

    this._fetchRange = function (rangemin, rangemax) {
        if (!this._isFetching) {
            range = rangemax - rangemin;
            rangemin -= range;
            rangemax += range;
            var myurl = DQX.Url(this.config.serverurl);
            myurl.addUrlQueryItem('datatype', 'annot');
            myurl.addUrlQueryItem('chrom', this.myChromoNr);
            myurl.addUrlQueryItem('start', rangemin);
            myurl.addUrlQueryItem('stop', rangemax);
            myurl.addUrlQueryItem('table', this.config.annottablename);
            myurl.addUrlQueryItem('chromnrfield', this.config.chromnrfield);
            myurl.addUrlQueryItem('startfield', this.config.annotstartfield);
            myurl.addUrlQueryItem('stopfield', this.config.annotstopfield);
            myurl.addUrlQueryItem('namefield', this.config.annotnamefield);
            myurl.addUrlQueryItem('idfield', this.config.annotidfield);
            this._isFetching = true;
            var thethis = this;
            $.ajax({
                url: myurl.toString(),
                dataType: 'TEXT',
                type: 'get',
                success: function (resp) { thethis.AjaxResponse(resp); },
                error: function (resp) { thethis._ajaxFailure(resp); }
            });
        }
    }


    this.IsDataReady = function (rangemin, rangemax) {
        if ((rangemin >= this._currentRangeMin) && (rangemax <= this._currentRangeMax)) {
            return true;
        }
        else {
            this._fetchRange(rangemin, rangemax);
            return false;
        }
    }


    this.getData = function (rangemin, rangemax) {
        var thedata = {};
        thedata.myStartList = [];
        thedata.myStopList = [];
        thedata.myNameList = [];
        thedata.myIDList = [];
        for (i = 0; i < this.myStartList.length; i++)
            if ((this.myStopList[i] >= rangemin) && (this.myStartList[i] <= rangemax)) {
                thedata.myStartList.push(this.myStartList[i]);
                thedata.myStopList.push(this.myStopList[i]);
                thedata.myNameList.push(this.myNameList[i]);
                thedata.myIDList.push(this.myIDList[i]);
            }
        return thedata;
    }

    //fetches all annotation for a single record
    this.fetchFullAnnotInfo = function (id, theCallbackFunction, theFailFunction) {
        //prepare the url

        var myurl = DQX.Url(this.config.serverurl);
        myurl.addUrlQueryItem('datatype', 'fullannotinfo');
        myurl.addUrlQueryItem('table', this.config.annottablename);
        myurl.addUrlQueryItem('idfield', this.config.annotidfield);
        myurl.addUrlQueryItem('id', id);
        var _ajaxResponse_FetchPoint = function (resp) {
            //todo: error handling
            theCallbackFunction(DQX.parseResponse(resp).Data);
        }
        $.ajax({
            url: myurl.toString(),
            success: _ajaxResponse_FetchPoint,
            error: theFailFunction
        });
    }

}






