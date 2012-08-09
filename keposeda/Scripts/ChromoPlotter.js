

//!!!TODO: this shouldn't be hard-wired, but fetched from the server!!!!
chromsizes = [250, 245, 205, 195, 185, 175, 165, 150, 145, 140, 140, 135, 120, 110, 105, 95, 85, 80, 70, 70, 50, 50];



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
    GetChannelPlot(CanvasBaseID + "Center").ShowRegion(chromnr, pos, size);
    return false;
}

function ChromoPlotter(imyID, iServerUrl, iChromoNrField) {
    var that = new ChannelPlotter(imyID);
    that.ServerUrl = iServerUrl;
    that.ChromoNrField = iChromoNrField;

    //######## Functions ############

    //Call this function to switch to another chromosome
    that.SetChromosome = function (newchromonr, updatepicker, redraw) {
        if (newchromonr != this.CurrentChromoNr)
            this.ClearData();
        this.FullRangeMax = chromsizes[newchromonr - 1] * 1.0E6; //!!!TODO: make this a generic server-driven action
        this.CurrentChromoNr = newchromonr;

        if (updatepicker)
            that.GetElement("ChromoPicker").val(newchromonr);

        //Defines the restricting query for all channels
        var chromoquery = new DQXWhereClause_CompareFixed(that.ChromoNrField, '=', that.CurrentChromoNr);
        for (var fetchnr in this.myDataFetchers)
            this.myDataFetchers[fetchnr].UserQuery = chromoquery;

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
        this.myHScroller.RangeMax = chromsizes[newnr - 1]; //idem
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
    that.CreateLinkToRegion = function(chromnr, pos, size, title) {
        return '<a href="javascript:void(0)" onclick=GlobalChromPlotterShowRegion("' + this.CanvasBaseID + '",' + chromnr + "," + pos + "," + size + ')>' + title + '</a>';
    }

    //internal: request gene list was succesful
    that._AjaxResponse_FindGene = function (resp) {
        var keylist = DQXParseResponse(resp); //unpack the response
        if ("Error" in keylist) {
            $("#Cnv1GeneHits").html("Failed to fetch data");
            return;
        }
        var vallistdecoder = new ValueListDecoder;
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
        $("#Cnv1GeneHits").html(rs);
    }

    //internal: request gene list has failed
    that._AjaxFailure_FindGene = function(resp) {
        $("#Cnv1GeneHits").html("Failed to fetch data");
    }

    //Internal: reacts on a change in the find gene edit box
    that._OnChangeFindGene = function() {
        var pattern = this.GetElement("FindGene").val();
        if (pattern.length == 0) {
            this.GetElement("GeneHits").html("");
        }
        else {
            var myurl = that.ServerUrl+"?datatype=findgene" + "&pattern=" + pattern;
            this.GetElement("GeneHits").html("Fetching data...");
            $.ajax({
                url: myurl,
                context: this,
                success: this._AjaxResponse_FindGene,
                error: this._AjaxFailure_FindGene
            });
        }
    }



    //######## Initialisation code ############

    that.myHScroller = new DQXHScrollBar(imyID + "HScroller"); //todo: change this into an extension on the common id
    that.CurrentChromoNr = 1;//we start with chromosome 1

    //Create the annotation channel and the scale channel
    that.annotationchannel = new ChannelPlotChannelAnnotation(that);
    that.AddDataFetcher(that.annotationchannel.theannotfetcher);
    that.AddChannel(new ChannelPlotChannelScale(that));
    that.AddChannel(that.annotationchannel);

    that.PairWithHScroller(that.myHScroller);

    //Initialises some event handlers
    that.GetElement("ChromoPicker").change($.proxy(that._OnChangeChromosome, that));
    that.GetElement("FindGene").keyup($.proxy(that._OnChangeFindGene, that));
    that.GetElement("FindGene").bind('paste', function () { setTimeout($.proxy(that._OnChangeFindGene, that), 50) } );


    return that;
}