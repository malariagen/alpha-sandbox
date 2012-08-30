




///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// ChromoPlotter Class: implements a channelplot on a set of chromosomes
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
Required HTML ingredients:
XXXCenter : canvas element
XXXLeft : canvas element
XXXHScroller : canvas element
XXXFindGene : text input control
XXXGeneHits : span
XXXChromoPicker : select control
*/


//Used as a reflection mechanism
function _globalChromPlotterShowRegion(CanvasBaseID, chromnr, pos, size) {
    DQX.ChannelPlot.get(CanvasBaseID + "Center").showRegion(chromnr, pos, size);
    return false;
}

function ChromoPlotter(imyID, iconfig) {

    DQX.assertPresence(iconfig, 'serverurl');
    DQX.assertPresence(iconfig, 'chromnrfield');

    var that = DQX.ChannelPlot.Plotter(imyID);
    that.chromosomes = [];
    that.config = iconfig;
    that.serverUrl = iconfig.serverurl;
    that.chromoNrField = iconfig.chromnrfield;



    //######## Functions ############

    //adds a new chromosome to the viewer
    that.addChromosome = function (iname, isize) {//size in megabases
        this.chromosomes.push( {name: iname, size: isize } );
    }

    //fills in the value in the combo box showing the chromosomes
    that.populateChromosomePicker = function () {
        var rs = '';
        for (var chromnr = 0; chromnr < that.chromosomes.length; chromnr++)
            rs += '<option value="' + (chromnr + 1).toString() + '">' + that.chromosomes[chromnr].name + '</option>';
        that.getElement("ChromoPicker").html(rs);
    }



    //Call this function to switch to another chromosome
    that.setChromosome = function (newchromonr, updatepicker, redraw) {
        if (newchromonr != this.currentChromoNr)
            this.clearData();
        this.fullRangeMax = this.chromosomes[newchromonr - 1].size * 1.0E6;
        this.currentChromoNr = newchromonr;

        if (updatepicker)
            that.getElement("ChromoPicker").val(newchromonr);

        //Defines the restricting query for all channels
        var chromoquery = DQX.SQL.WhereClause.CompareFixed(that.chromoNrField, '=', that.currentChromoNr);
        for (var fetchnr in this.myDataFetchers)
            if ('setUserQuery' in this.myDataFetchers[fetchnr])
                this.myDataFetchers[fetchnr].setUserQuery(chromoquery);

        //set the annotation channel chromosome nr
        this.annotationchannel.theannotfetcher.myChromoNr = that.currentChromoNr;
        if (redraw) {
            this.draw();
            this.myHScroller.draw();
        }
    }

    //internal: called as event handler
    that._onChangeChromosome = function () {
        var newnr = parseInt(that.getElement("ChromoPicker").val());
        myChromoPlot.setChromosome(newnr, false);
        this.clearData();
        this.offsetX = 0;
        this.myHScroller.rangeMax = this.chromosomes[newnr - 1].size;
        this.myHScroller.scrollPos = 0;
        this.myHScroller.draw();
        this.draw();
    }

    //Call this function to show a particular region
    that.showRegion = function (chromnr, pos, size) {
        this.setChromosome(chromnr, true, false);
        if (size < 10) size = 10;
        this.setMark(pos - size / 2, pos + size / 2);
        var winsize = size * 6;
        if (winsize < 60000) winsize = 60000;
        this.setPosition(pos, winsize);
    }

    //This function returns a html snippet with a hyperlink that jumps to a region on the chromosome
    that.createLinkToRegion = function (chromnr, pos, size, title) {
        return DQX.DocEl.JavaScriptlink(title, "_globalChromPlotterShowRegion('" + this.CanvasBaseID + "'," + chromnr + "," + pos + "," + size + ')').toString() + "&nbsp;";
    }

    //internal: request gene list was succesful
    that._ajaxResponse_FindGene = function (resp) {
        var keylist = DQX.parseResponse(resp); //unpack the response
        if ("Error" in keylist) {
            this.getElement("GeneHits").html("Failed to fetch data");
            return;
        }
        var vallistdecoder = DQX.ValueListDecoder();
        var genelist = vallistdecoder.doDecode(keylist['Hits']);
        var chromlist = vallistdecoder.doDecode(keylist['Chroms']);
        var startlist = vallistdecoder.doDecode(keylist['Starts']);
        var endlist = vallistdecoder.doDecode(keylist['Ends']);
        if ((genelist.length > 0) && (genelist[0].length > 0)) {
            var rs = ""
            for (genenr in genelist) {
                var winsize = endlist[genenr] - startlist[genenr];
                //if (winsize < 10000) winsize = 10000;
                rs += this.createLinkToRegion(chromlist[genenr], (startlist[genenr] + endlist[genenr]) / 2, winsize, genelist[genenr]) + " "
            }
            if (genelist.length >= 6)
                rs += " ...";
        }
        else {
            rs = "No hits found";
        }
        this.getElement("GeneHits").html(rs);
    }

    //internal: request gene list has failed
    that._ajaxFailure_FindGene = function(resp) {
        this.getElement("GeneHits").html("Failed to fetch data");
    }

    //Internal: reacts on a change in the find gene edit box
    that._onChangeFindGene = function () {
        var pattern = this.getElement("FindGene").val();
        if (pattern.length == 0) {
            this.getElement("GeneHits").html("");
        }
        else {
            var myurl = DQX.Url(this.serverUrl);
            myurl.addUrlQueryItem('datatype', 'findgene');
            myurl.addUrlQueryItem('pattern', pattern);
            myurl.addUrlQueryItem('table', this.config.annottablename);
            myurl.addUrlQueryItem('chromnrfield', this.config.chromnrfield);
            myurl.addUrlQueryItem('startfield', this.config.annotstartfield);
            myurl.addUrlQueryItem('stopfield', this.config.annotstopfield);
            myurl.addUrlQueryItem('namefield', this.config.annotnamefield);
            if ("altpositionfindtablename" in this.config) {
                myurl.addUrlQueryItem('alttablename', this.config.altpositionfindtablename);
                myurl.addUrlQueryItem('altidfield', this.config.altpositionfindidfield);
                myurl.addUrlQueryItem('altchromnrfield', this.config.altpositionfindchromnrfield);
                myurl.addUrlQueryItem('altposfield', this.config.altpositionfindposfield);
            }
            this.getElement("GeneHits").html("Fetching data...");

            $.ajax({
                url: myurl.toString(),
                success: function (resp) { that._ajaxResponse_FindGene(resp); },
                error: function (resp) { that._ajaxFailure_FindGene(resp); }
            });

        }
    }



    //######## Initialisation code ############

    that.myHScroller = DQX.HScrollBar(imyID + "HScroller");
    that.currentChromoNr = 1;//we start with chromosome 1

    //Create the annotation channel and the scale channel
    that.annotationchannel = DQX.ChannelPlot.ChannelAnnotation(that);
    that.addDataFetcher(that.annotationchannel.theannotfetcher);
    that.addChannel(DQX.ChannelPlot.ChannelScale(that));
    that.addChannel(that.annotationchannel);

    that.pairWithHScroller(that.myHScroller);

    //Initialises some event handlers
    that.getElement("ChromoPicker").change($.proxy(that._onChangeChromosome, that));
    that.getElement("FindGene").keyup($.proxy(that._onChangeFindGene, that));
    that.getElement("FindGene").bind('paste', function () { setTimeout($.proxy(that._onChangeFindGene, that), 50) } );


    return that;
}