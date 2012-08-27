




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
function GlobalChromPlotterShowRegion(CanvasBaseID, chromnr, pos, size) {
    DQX.ChannelPlot.Get(CanvasBaseID + "Center").ShowRegion(chromnr, pos, size);
    return false;
}

function ChromoPlotter(imyID, iconfig) {

    DQX.AssertPresence(iconfig, 'serverurl');
    DQX.AssertPresence(iconfig, 'chromnrfield');

    var that = DQX.ChannelPlot.Plotter(imyID);
    that.chromosomes = [];
    that.config = iconfig;
    that.ServerUrl = iconfig.serverurl;
    that.ChromoNrField = iconfig.chromnrfield;



    //######## Functions ############

    that.AddChromosome = function (iname, isize) {//size in megabases
        this.chromosomes.push( {name: iname, size: isize } );
    }

    that.PopulateChromosomePicker = function () {
        var rs = '';
        for (var chromnr = 0; chromnr < that.chromosomes.length; chromnr++)
            rs += '<option value="' + (chromnr + 1).toString() + '">' + that.chromosomes[chromnr].name + '</option>';
        that.GetElement("ChromoPicker").html(rs);
    }



    //Call this function to switch to another chromosome
    that.SetChromosome = function (newchromonr, updatepicker, redraw) {
        if (newchromonr != this.CurrentChromoNr)
            this.ClearData();
        this.FullRangeMax = this.chromosomes[newchromonr - 1].size * 1.0E6;
        this.CurrentChromoNr = newchromonr;

        if (updatepicker)
            that.GetElement("ChromoPicker").val(newchromonr);

        //Defines the restricting query for all channels
        var chromoquery = DQX.SQL.WhereClause.CompareFixed(that.ChromoNrField, '=', that.CurrentChromoNr);
        for (var fetchnr in this.myDataFetchers)
            if ('SetUserQuery' in this.myDataFetchers[fetchnr])
                this.myDataFetchers[fetchnr].SetUserQuery(chromoquery);

        //set the annotation channel chromosome nr
        this.annotationchannel.theannotfetcher.ChromoNr = that.CurrentChromoNr;
        if (redraw) {
            this.Draw();
            this.myHScroller.Draw();
        }
    }

    //internal: called as event handler
    that._OnChangeChromosome = function () {
        var newnr = parseInt(that.GetElement("ChromoPicker").val());
        myChromoPlot.SetChromosome(newnr, false);
        this.ClearData();
        this.OffsetX = 0;
        this.myHScroller.RangeMax = this.chromosomes[newnr - 1].size;
        this.myHScroller.ScrollPos = 0;
        this.myHScroller.Draw();
        this.Draw();
    }

    //Call this function to show a particular region
    that.ShowRegion = function (chromnr, pos, size) {
        this.SetChromosome(chromnr, true, false);
        if (size < 10) size = 10;
        this.SetMark(pos - size / 2, pos + size / 2);
        var winsize = size * 6;
        if (winsize < 60000) winsize = 60000;
        this.SetPosition(pos, winsize);
    }

    //This function returns a html snippet with a hyperlink that jumps to a region on the chromosome
    that.CreateLinkToRegion = function (chromnr, pos, size, title) {
        return DQX.DocEl.JavaScriptlink(title, "GlobalChromPlotterShowRegion('" + this.CanvasBaseID + "'," + chromnr + "," + pos + "," + size + ')').toString() + "&nbsp;";
    }

    //internal: request gene list was succesful
    that._AjaxResponse_FindGene = function (resp) {
        var keylist = DQX.ParseResponse(resp); //unpack the response
        if ("Error" in keylist) {
            this.GetElement("GeneHits").html("Failed to fetch data");
            return;
        }
        var vallistdecoder = DQX.ValueListDecoder();
        var genelist = vallistdecoder.Decode(keylist['Hits']);
        var chromlist = vallistdecoder.Decode(keylist['Chroms']);
        var startlist = vallistdecoder.Decode(keylist['Starts']);
        var endlist = vallistdecoder.Decode(keylist['Ends']);
        if ((genelist.length > 0) && (genelist[0].length > 0)) {
            var rs = ""
            for (genenr in genelist) {
                var winsize = endlist[genenr] - startlist[genenr];
                //if (winsize < 10000) winsize = 10000;
                rs += this.CreateLinkToRegion(chromlist[genenr], (startlist[genenr] + endlist[genenr]) / 2, winsize, genelist[genenr]) + " "
            }
            if (genelist.length >= 6)
                rs += " ...";
        }
        else {
            rs = "No hits found";
        }
        this.GetElement("GeneHits").html(rs);
    }

    //internal: request gene list has failed
    that._AjaxFailure_FindGene = function(resp) {
        this.GetElement("GeneHits").html("Failed to fetch data");
    }

    //Internal: reacts on a change in the find gene edit box
    that._OnChangeFindGene = function () {
        var pattern = this.GetElement("FindGene").val();
        if (pattern.length == 0) {
            this.GetElement("GeneHits").html("");
        }
        else {
            var myurl = DQX.Url(this.ServerUrl);
            myurl.AddQuery('datatype', 'findgene');
            myurl.AddQuery('pattern', pattern);
            myurl.AddQuery('table', this.config.annottablename);
            myurl.AddQuery('chromnrfield', this.config.chromnrfield);
            myurl.AddQuery('startfield', this.config.annotstartfield);
            myurl.AddQuery('stopfield', this.config.annotstopfield);
            myurl.AddQuery('namefield', this.config.annotnamefield);
            if ("altpositionfindtablename" in this.config) {
                myurl.AddQuery('alttablename', this.config.altpositionfindtablename);
                myurl.AddQuery('altidfield', this.config.altpositionfindidfield);
                myurl.AddQuery('altchromnrfield', this.config.altpositionfindchromnrfield);
                myurl.AddQuery('altposfield', this.config.altpositionfindposfield);
            }
            this.GetElement("GeneHits").html("Fetching data...");

            $.ajax({
                url: myurl,
                success: function (resp) { that._AjaxResponse_FindGene(resp); },
                error: function (resp) { that._AjaxFailure_FindGene(resp); }
            });

        }
    }



    //######## Initialisation code ############

    that.myHScroller = DQX.HScrollBar(imyID + "HScroller");
    that.CurrentChromoNr = 1;//we start with chromosome 1

    //Create the annotation channel and the scale channel
    that.annotationchannel = DQX.ChannelPlot.ChannelAnnotation(that);
    that.AddDataFetcher(that.annotationchannel.theannotfetcher);
    that.AddChannel(DQX.ChannelPlot.ChannelScale(that));
    that.AddChannel(that.annotationchannel);

    that.PairWithHScroller(that.myHScroller);

    //Initialises some event handlers
    that.GetElement("ChromoPicker").change($.proxy(that._OnChangeChromosome, that));
    that.GetElement("FindGene").keyup($.proxy(that._OnChangeFindGene, that));
    that.GetElement("FindGene").bind('paste', function () { setTimeout($.proxy(that._OnChangeFindGene, that), 50) } );


    return that;
}