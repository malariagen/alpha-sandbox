
////////////////////////////////////////////////////////////////////////////////////////////////////
//   SNP plot callback functions
////////////////////////////////////////////////////////////////////////////////////////////////////

//This creates html content with full information about a single snp
function CallBackPointInfoFetched_Snp(data) {
    DQX.stopProcessing();
    var snpid = data['snpid'];
    var content = "";
    var url = "http://www.ncbi.nlm.nih.gov/snp/?term=" + snpid + "&SITE=NcbiHome&submit=Go";
    content += '<a href="' + url + '" target="_blank">DbSNP link</a><p>'

    content += myChromoPlot.createLinkToRegion(data['chrom'], data['pos'], 0, "Show in plot") + "<p/>";

    content += DQX.HtmlWriteKeyValuePair("Chromosome", data['chrom']) + "<br/>";
    content += DQX.HtmlWriteKeyValuePair("Position", data['pos']) + "<br/>";
    content += DQX.HtmlWriteKeyValuePair("Anc. allele", data['ancallele']) + "<br/>";
    content += DQX.HtmlWriteKeyValuePair("Allele 1", data['allele1']) + "<br/>";
    content += DQX.HtmlWriteKeyValuePair("Allele 2", data['allele2']) + "<br/>";

    var freq = {};
    var ihs = {};
    var xpehh = {};
    for (popnr in popnamelist) {
        popname = popnamelist[popnr];
        freq[popname] = data["Freq_" + popname];
        ihs[popname] = data["IHS_" + popname];
        xpehh[popname] = data["XPEHH_" + popname];
    }
    content += "<br/><b>Frequencies</b><br/>"
    content += DQX.CreateKeyValueTable(freq);
    content += "<br/><b>IHS</b><br/>"
    content += DQX.CreateKeyValueTable(ihs);
    content += "<br/><b>XP-EHH</b><br/>"
    content += DQX.CreateKeyValueTable(xpehh);

    DQX.CreateFloatBox('SNP ' + snpid, content);
}


//This function is hooked to the Snp channel, and responds to a point click event
function PointClickEvent_Snp(eventinfo) {
    var snpid = eventinfo.DataFetcher.getColumnPoint(eventinfo.DownloadIndex, "snpid");
    DQX.setProcessing("Downloading...");
    eventinfo.DataFetcher.fetchFullRecordInfo(
        DQX.SQL.WhereClause.CompareFixed('snpid', '=', snpid),
        CallBackPointInfoFetched_Snp, DQX.createFailFunction("Failed to download data")
        );
}


//This function is hooked to the Snp channel, and responds to a tooltip request
function GenerateToolTipInfo_Snp(thefetcher, index, compid) {
    lines = [{ Text: "SNP " + thefetcher.getColumnPoint(index, "snpid"), Color: "black"}];
    for (var compidx in thefetcher.myColumns)
        if (compidx != "snpid")
            if (thefetcher.myColumns[compidx].isActive()) {
                vl = thefetcher.getColumnPoint(index, compidx);
                var linetext = compidx + "=" + ((vl!=null)?(vl.toFixed(2)):('absent'));
                var linecolor = "rgb(100,100,100)";
                if (compidx == compid) linecolor = "rgb(192,0,0)";
                lines.push({ Text: linetext, Color: linecolor });
            }
    return lines;
}






////////////////////////////////////////////////////////////////////////////////////////////////////
//   Window plot callback functions
////////////////////////////////////////////////////////////////////////////////////////////////////


//This creates html content with full information about a single window
function CallBackPointInfoFetched_Win(data) {
    DQX.stopProcessing();
    var wincenter = parseInt(data['pos']);
    var winsize = parseInt(data['winsize']);
    var content = "";
    var ihs = {};
    var xpehh = {};
    for (popnr in popnamelist) {
        popname = popnamelist[popnr];
        ihs['R('+popname+')'] = (100.0 * data["WIHS_" + popname]).toFixed(2) + "%";
        xpehh['R(' + popname+')'] = (100.0 * data["WXPEHH_" + popname]).toFixed(2) + "%";
    }
    content += myChromoPlot.createLinkToRegion(data['chrom'], wincenter, winsize, "Show in plot") + "<br/>";
    content += "<br/><b>IHS</b><br/>"
    content += DQX.CreateKeyValueTable(ihs);
    content += "<br/><b>XP-EHH</b><br/>"
    content += DQX.CreateKeyValueTable(xpehh);
    DQX.CreateFloatBox(
        'Window<br/>Chr' + data['chrom'] + ":" + (((wincenter - winsize / 2)) / 1.0e6).toFixed(3) + "-" + (((wincenter + winsize / 2)) / 1.0e6).toFixed(3) + "MB",
        content);

}


//This function is hooked to the Win channel, and responds to a point click event
function PointClickEvent_Win(eventinfo) {
    var pos = eventinfo.DataFetcher.getPosition(eventinfo.DownloadIndex);
    var qry = DQX.SQL.WhereClause.Compound("AND");
    qry.addComponent(DQX.SQL.WhereClause.CompareFixed('chrom', '=', myChromoPlot.currentChromoNr));
    qry.addComponent(DQX.SQL.WhereClause.CompareFixed('pos', '=', pos));
    DQX.setProcessing("Downloading...");
    eventinfo.DataFetcher.fetchFullRecordInfo(qry, CallBackPointInfoFetched_Win, DQX.createFailFunction("Failed to download data"));
}


function toPercentageString(vl) {
    if (vl == null) return "absent";
    return (100 * vl).toFixed(1) + "% ";
}

//This function is hooked to the Window channel, and responds to a tooltip request
function GenerateToolTipInfo_Window(thefetcher, index, compid) {
    var center = thefetcher.getPosition(index);
    var size = thefetcher.getColumnPoint(index, "winsize");
    lines = [{ Text: "Window " + ((center - size / 2) / 1.0e6).toFixed(3) + " - " + ((center + size / 2) / 1.0e6).toFixed(3) + "MB",
        Color: "black"
    }];
    for (var compidx in thefetcher.myColumns)
        if (compidx != "winsize")
            if (thefetcher.myColumns[compidx].isActive()) {
                vl = thefetcher.getColumnPoint(index, compidx);
                var linetext = 'R('+compidx + ")=" + toPercentageString(vl);
                var linecolor = "rgb(100,100,100)";
                if (compidx == compid) linecolor = "rgb(192,0,0)";
                lines.push({ Text: linetext, Color: linecolor });
            }
    return lines;
}





/////////////////////////////////////////////////////////////////////////////////////////////////
// Some callback functions that react on the custom controls
// that allow the user to chose what populations are displayed
/////////////////////////////////////////////////////////////////////////////////////////////////

//Callback function triggered when the user changed what statistic is  to be plotted
function OnChangeStat() {
    var stat = $("#stat").val();
    var showihs = ((stat == "IHS") || (stat == "BOTH"));
    var showxpehh = ((stat == "XPEHH") || (stat == "BOTH"));
    for (popnr in popnamelist) {
        var id = popnamelist[popnr];
        var checkid = "pop_" + popnamelist[popnr];
        var chk = $('#' + checkid).attr('checked');
        WinChannel.modifyComponentActiveStatus("WIHS_" + id, chk && showihs, false);
        SnpChannel.modifyComponentActiveStatus("IHS_" + id, chk && showihs, false);
        WinChannel.modifyComponentActiveStatus("WXPEHH_" + id, chk && showxpehh, false);
        SnpChannel.modifyComponentActiveStatus("XPEHH_" + id, chk && showxpehh, false);
    }
    myChromoPlot.draw();
}

//Callback function triggered when the user changed the plot activity status of a single population
function OnPopClick(event) {
    var stat = $("#stat").val();
    var checkid = event.target.id;
    var id = checkid.split("pop_")[1];
    var chk = $('#' + checkid).attr('checked');
    if ((stat == "IHS") || (stat == "BOTH")) {
        WinChannel.modifyComponentActiveStatus("WIHS_" + id, chk, false);
        SnpChannel.modifyComponentActiveStatus("IHS_" + id, chk, false);
    }
    if ((stat == "XPEHH") || (stat == "BOTH")) {
        WinChannel.modifyComponentActiveStatus("WXPEHH_" + id, chk, false);
        SnpChannel.modifyComponentActiveStatus("XPEHH_" + id, chk, false);
    }
    myChromoPlot.draw();
}

//Callback function triggered when the user pressed the "show all populations" button
function OnAllPops() {
    var stat = $("#stat").val();
    var showihs = ((stat == "IHS") || (stat == "BOTH"));
    var showxpehh = ((stat == "XPEHH") || (stat == "BOTH"));
    for (popnr in popnamelist) {
        var id = popnamelist[popnr];
        var checkid = "pop_" + popnamelist[popnr];
        $('#' + checkid).attr('checked', true);
        WinChannel.modifyComponentActiveStatus("WIHS_" + id, showihs, false);
        SnpChannel.modifyComponentActiveStatus("IHS_" + id, showihs, false);
        WinChannel.modifyComponentActiveStatus("WXPEHH_" + id, showxpehh, false);
        SnpChannel.modifyComponentActiveStatus("XPEHH_" + id, showxpehh, false);
    }
    myChromoPlot.draw();
}

//Callback function triggered when the user pressed the "hide all populations" button
function OnNoPops() {
    for (popnr in popnamelist) {
        var id = popnamelist[popnr];
        var checkid = "pop_" + popnamelist[popnr];
        $('#' + checkid).attr('checked', false);
        WinChannel.modifyComponentActiveStatus("WIHS_" + id, false);
        SnpChannel.modifyComponentActiveStatus("IHS_" + id, false);
        WinChannel.modifyComponentActiveStatus("WXPEHH_" + id, false);
        SnpChannel.modifyComponentActiveStatus("XPEHH_" + id, false);
    }
    myChromoPlot.draw();
}


//This function builds some custom controls that manage what channels are displayed
function BuildChannelDisplayControls() {
    var rs = "&nbsp;";
    for (popnr in popnamelist) {
        var checkid = "pop_" + popnamelist[popnr];
        rs += '<input type="checkbox" id="' + checkid + '" name="' + checkid + '" value="' + checkid + '"/>';
        rs += '<span style="background:' + popcollist[popnr] + ';">&nbsp;&nbsp;&nbsp;</span>&nbsp;';
        rs += popnamelist[popnr];
        rs += "&nbsp;&nbsp;";
        $("#ChromoViewHeaderExtra").html(rs);
    }
    for (popnr in popnamelist) {
        var checkid = "pop_" + popnamelist[popnr];
        $("#" + checkid).click(OnPopClick);
    }
}


//Converts a p value to a more plot-friendly log value
function PVal2Log(p) {
    return Math.min(5, -Math.log(p + 1.0e-9) / Math.log(10));
}



/////////////////////////////////////////////////////////////////////////////////////////////////
// MAIN INITIALISATION FUNCTION
/////////////////////////////////////////////////////////////////////////////////////////////////


function Build_ChromoView() {

    //Creation of the chromosome plotter
    var config = {
        serverurl: theserverurl,
        //define how to interpret the data tables
        chromnrfield: 'chrom',
        //define source of annotation
        annottablename: 'annot',
        annotstartfield: 'startcds',
        annotstopfield: 'endcds',
        annotnamefield: 'name',
        annotidfield: 'geneid',
        //for alternative 'find feature' search (most likely this will point to SNP id's)
        altpositionfindtablename: 'snps',
        altpositionfindidfield: 'snpid',
        altpositionfindchromnrfield: 'chrom',
        altpositionfindposfield: 'pos'
    }

    elem_chromoplot = DQX.Gui.ChromoPlot('ChromoView', { config: config });
    myChromoPlot = elem_chromoplot.myChromoPlot;

    var chromosizes = [250, 245, 205, 195, 185, 175, 165, 150, 145, 140, 140, 135, 120, 110, 105, 95, 85, 80, 70, 70, 50, 50];
    for (var chromnr = 0; chromnr < chromosizes.length; chromnr++) {
        myChromoPlot.addChromosome("Chromosome " + (chromnr + 1).toString(), chromosizes[chromnr]);
    }

    myChromoPlot.populateChromosomePicker();


    //This function builds some custom controls that manage what channels are displayed
    BuildChannelDisplayControls();

    //----------------------------------------------------------------
    //---------------- INITIALISE SNP DATA ---------------------------
    //----------------------------------------------------------------


    //Create the plot channel for the snp data
    SnpChannel = DQX.ChannelPlot.ChannelYVals(myChromoPlot);
    SnpChannel.myTitle = "SNPs";
    SnpChannel.yMinVal = -4.0;
    SnpChannel.yMaxVal = 4.0;
    SnpChannel.minDrawZoomFactX = 1.0 / 16000; //This Y value will not be displayed if the zoom factor drops below this

    //Create the data fetcher for the snp data
    snpdatafetcher = new DQX.DataFetcher.Curve(theserverurl, "snps", "pos");
    myChromoPlot.addDataFetcher(snpdatafetcher);
    SnpChannel.GenerateToolTipInfo = GenerateToolTipInfo_Snp;
    SnpChannel.onPointClickEvent = PointClickEvent_Snp;

    //Create the columns of the data fetcher
    for (i in popnamelist)
        snpdatafetcher.addFetchColumn("IHS_" + popnamelist[i], "Float2", popcollist[i]);
    for (i in popnamelist)
        snpdatafetcher.addFetchColumn("XPEHH_" + popnamelist[i], "Float2", popcollist2[i]);

    //Create components in the plot channel for the fetcher columns
    for (var yid in snpdatafetcher.myColumns)
        SnpChannel.addComponent(DQX.ChannelPlot.ChannelYValsComp(snpdatafetcher, yid));

    //add snpid column to the datafetcher, needed for the tooltip (but not plotted)
    snpdatafetcher.addFetchColumn("snpid", "String");
    snpdatafetcher.activateFetchColumn("snpid");

    myChromoPlot.addChannel(SnpChannel);



    //----------------------------------------------------------------
    //------------------- INITIALISE WINDOW DATA ---------------------
    //----------------------------------------------------------------

    //Create the plot channel for the window data
    WinChannel = DQX.ChannelPlot.ChannelYVals(myChromoPlot);
    WinChannel.myTitle = "Window significances";
    WinChannel.SubTitle = "-log10(p)";
    WinChannel.yMinVal = 0.0;
    WinChannel.yMaxVal = 5.0;

    //Create the data fetcher for the window data
    windatafetcher = new DQX.DataFetcher.Curve(theserverurl, "windows", "pos");
    myChromoPlot.addDataFetcher(windatafetcher);
    WinChannel.GenerateToolTipInfo = GenerateToolTipInfo_Window;
    WinChannel.onPointClickEvent = PointClickEvent_Win;

    //Create the columns of the data fetcher
    for (i in popnamelist) {
        var colinfo = windatafetcher.addFetchColumn("WIHS_" + popnamelist[i], "Float2", popcollist[i]);
        colinfo.makeDrawLines(300000.0); //This causes the points to be connected with lines
    }
    for (i in popnamelist) {
        var colinfo = windatafetcher.addFetchColumn("WXPEHH_" + popnamelist[i], "Float2", popcollist2[i]);
        colinfo.makeDrawLines(300000.0); //This causes the points to be connected with lines
    }

    //Create components in the plot channel for the fetcher columns
    for (var yid in windatafetcher.myColumns) {
        var comp = WinChannel.addComponent(DQX.ChannelPlot.ChannelYValsComp(windatafetcher, yid));
        comp.YFunction = PVal2Log; //we hook up a function that maps the p values to logs
    }

    //add winstop column to the datafetcher, needed for the tooltip (but not plotted)
    windatafetcher.addFetchColumn("winsize", "IntB64");
    windatafetcher.activateFetchColumn("winsize"); //we need to activate it manually, otherwise it's not fetched automatically

    myChromoPlot.addChannel(WinChannel);

    //----------------------------------------------------------------
    //--------------- FINALISATION -----------------------------------
    //----------------------------------------------------------------

    myChromoPlot.setChromosome(1, false, true);
    OnAllPops(); //This activates the display of all populations
}