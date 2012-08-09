
////////////////////////////////////////////////////////////////////////////////////////////////////
//   SNP plot callback functions
////////////////////////////////////////////////////////////////////////////////////////////////////

//This creates html content with full information about a single snp
function CallBackPointInfoFetched_Snp(data) {
    DQXStopProcessing();
    var snpid = data['snpid'];
    var content = "";
    var url = "http://www.ncbi.nlm.nih.gov/snp/?term=" + snpid + "&SITE=NcbiHome&submit=Go";
    content += '<a href="' + url + '" target="_blank">DbSNP link</a><p>'

    content += myChromoPlot.CreateLinkToRegion(data['chrom'], data['pos'], 0, "Show in plot") + "<p/>";

    content += DQXHtmlWriteKeyValuePair("Chromosome", data['chrom']) + "<br>";
    content += DQXHtmlWriteKeyValuePair("Position", data['pos']) + "<br>";
    content += DQXHtmlWriteKeyValuePair("Anc. allele", data['ancallele']) + "<br>";
    content += DQXHtmlWriteKeyValuePair("Allele 1", data['allele1']) + "<br>";
    content += DQXHtmlWriteKeyValuePair("Allele 2", data['allele2']) + "<br>";

    var freq = new Object;
    var ihs = new Object;
    var xpehh = new Object;
    for (popnr in popnamelist) {
        popname = popnamelist[popnr];
        freq[popname] = data["Freq_" + popname];
        ihs[popname] = data["IHS_" + popname];
        xpehh[popname] = data["XPEHH_" + popname];
    }
    content += "<br/><b>Frequencies</b><br/>"
    content += DQXCreateKeyValueTable(freq);
    content += "<br/><b>IHS</b><br/>"
    content += DQXCreateKeyValueTable(ihs);
    content += "<br/><b>XP-EHH</b><br/>"
    content += DQXCreateKeyValueTable(xpehh);

    DQXCreateFloatBox('SNP ' + snpid, content);
}


//This function is hooked to the Snp channel, and responds to a point click event
function PointClickEvent_Snp(eventinfo) {
    var snpid = eventinfo.DataFetcher.GetColumnPoint(eventinfo.DownloadIndex, "snpid");
    DQXSetProcessing("Downloading...");
    eventinfo.DataFetcher.FetchFullRecordInfo(
        new DQXWhereClause_CompareFixed('snpid', '=', snpid),
        CallBackPointInfoFetched_Snp,DQXCreateFailFunction("Failed to download data")
        );
}


//This function is hooked to the Snp channel, and responds to a tooltip request
function GenerateToolTipInfo_Snp(thefetcher, index, compid) {
    lines = [{ Text: "SNP " + thefetcher.GetColumnPoint(index, "snpid"), Color: "black"}];
    for (var compidx in thefetcher.Columns)
        if (compidx != "snpid")
            if (thefetcher.Columns[compidx].IsActive()) {
                vl = thefetcher.GetColumnPoint(index, compidx);
                var linetext = compidx + "=" + (Math.round(100 * vl) / 100.0).toString();
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
    DQXStopProcessing();
    var wincenter = parseInt(data['pos']);
    var winsize = parseInt(data['winsize']);
    var content = "";
    var ihs = new Object;
    var xpehh = new Object;
    for (popnr in popnamelist) {
        popname = popnamelist[popnr];
        ihs[popname] = (100.0 * data["WIHS_" + popname]).toFixed(2) + "%";
        xpehh[popname] = (100.0 * data["WXPEHH_" + popname]).toFixed(2) + "%";
    }
    content += myChromoPlot.CreateLinkToRegion(data['chrom'], wincenter, winsize, "Show in plot") + "<br/>";
    content += "<br/><b>IHS</b><br/>"
    content += DQXCreateKeyValueTable(ihs);
    content += "<br/><b>XP-EHH</b><br/>"
    content += DQXCreateKeyValueTable(xpehh);
    DQXCreateFloatBox(
        'Window<br>Chr' + data['chrom'] + ":" + (((wincenter - winsize / 2)) / 1.0e6).toFixed(3) + "-" + (((wincenter + winsize / 2)) / 1.0e6).toFixed(3) + "MB",
        content,
        300,300);

}


//This function is hooked to the Win channel, and responds to a point click event
function PointClickEvent_Win(eventinfo) {
    var pos = eventinfo.DataFetcher.GetPosition(eventinfo.DownloadIndex);
    var qry = new DQXWhereClause_Compound("AND");
    qry.AddComponent(new DQXWhereClause_CompareFixed('chrom', '=', myChromoPlot.CurrentChromoNr));
    qry.AddComponent(new DQXWhereClause_CompareFixed('pos', '=', pos));
    DQXSetProcessing("Downloading...");
    eventinfo.DataFetcher.FetchFullRecordInfo(qry, CallBackPointInfoFetched_Win, DQXCreateFailFunction("Failed to download data"));
}


//This function is hooked to the Window channel, and responds to a tooltip request
function GenerateToolTipInfo_Window(thefetcher, index, compid) {
    var center = thefetcher.GetPosition(index);
    var size = thefetcher.GetColumnPoint(index, "winsize");
    lines = [{ Text: "Window " + ((center - size / 2) / 1.0e6).toFixed(3) + " - " + ((center + size / 2) / 1.0e6).toFixed(3) + "MB",
        Color: "black"
    }];
    for (var compidx in thefetcher.Columns)
        if (compidx != "winstop")
            if (thefetcher.Columns[compidx].IsActive()) {
                vl = thefetcher.GetColumnPoint(index, compidx);
                var linetext = compidx + "=" + (100 * vl).toFixed(1) + "% "
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
        WinChannel.ModifyComponentActiveStatus("WIHS_" + id, chk && showihs);
        SnpChannel.ModifyComponentActiveStatus("IHS_" + id, chk && showihs);
        WinChannel.ModifyComponentActiveStatus("WXPEHH_" + id, chk && showxpehh);
        SnpChannel.ModifyComponentActiveStatus("XPEHH_" + id, chk && showxpehh);
    }
}

//Callback function triggered when the user changed the plot activity status of a single population
function OnPopClick(event) {
    var stat = $("#stat").val();
    var checkid = event.target.id;
    var id = checkid.split("pop_")[1];
    var chk = $('#' + checkid).attr('checked');
    if ((stat == "IHS") || (stat == "BOTH")) {
        WinChannel.ModifyComponentActiveStatus("WIHS_" + id, chk);
        SnpChannel.ModifyComponentActiveStatus("IHS_" + id, chk);
    }
    if ((stat == "XPEHH") || (stat == "BOTH")) {
        WinChannel.ModifyComponentActiveStatus("WXPEHH_" + id, chk);
        SnpChannel.ModifyComponentActiveStatus("XPEHH_" + id, chk);
    }
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
        WinChannel.ModifyComponentActiveStatus("WIHS_" + id, showihs);
        SnpChannel.ModifyComponentActiveStatus("IHS_" + id, showihs);
        WinChannel.ModifyComponentActiveStatus("WXPEHH_" + id, showxpehh);
        SnpChannel.ModifyComponentActiveStatus("XPEHH_" + id, showxpehh);
    }
}

//Callback function triggered when the user pressed the "hide all populations" button
function OnNoPops() {
    for (popnr in popnamelist) {
        var id = popnamelist[popnr];
        var checkid = "pop_" + popnamelist[popnr];
        $('#' + checkid).attr('checked', false);
        WinChannel.ModifyComponentActiveStatus("WIHS_" + id, false);
        SnpChannel.ModifyComponentActiveStatus("IHS_" + id, false);
        WinChannel.ModifyComponentActiveStatus("WXPEHH_" + id, false);
        SnpChannel.ModifyComponentActiveStatus("XPEHH_" + id, false);
    }
}


//This function builds some custom controls that manage what channels are displayed
function BuildChannelDisplayControls() {
    var rs = "";
    for (popnr in popnamelist) {
        var checkid = "pop_" + popnamelist[popnr];
        rs += '<input type="checkbox" id="' + checkid + '" name="' + checkid + '" value="' + checkid + '"/>';
        rs += '<span style="background:' + popcollist[popnr] + ';">&nbsp;&nbsp;&nbsp;</span>&nbsp;';
        rs += popnamelist[popnr];
        rs += "&nbsp;&nbsp;&nbsp;&nbsp;";
        $("#Controls").html(rs);
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


function InitKeposedaPlot() {    

    //Creation of the chromosome plotter
    myChromoPlot = new ChromoPlotter("Cnv1", theserverurl, 'chrom');

    //This function builds some custom controls that manage what channels are displayed
    BuildChannelDisplayControls();

    //----------------------------------------------------------------
    //---------------- INITIALISE SNP DATA ---------------------------
    //----------------------------------------------------------------


    //Create the plot channel for the snp data
    SnpChannel = new ChannelPlotChannelYVals(myChromoPlot);
    SnpChannel.Title = "SNPs";
    SnpChannel.YMinVal = -4.0;
    SnpChannel.YMaxVal = 4.0;
    SnpChannel.MinDrawZoomFactX = 1.0 / 16000;//This Y value will not be displayed if the zoom factor drops below this

    //Create the data fetcher for the snp data
    snpdatafetcher = new CurveDataFetcher(theserverurl, "snps", "pos");
    myChromoPlot.AddDataFetcher(snpdatafetcher);
    SnpChannel.GenerateToolTipInfo = GenerateToolTipInfo_Snp;
    SnpChannel.OnPointClickEvent = PointClickEvent_Snp;

    //Create the columns of the data fetcher
    for (i in popnamelist)
        snpdatafetcher.ColumnAdd("IHS_" + popnamelist[i], "Float2", popcollist[i]);
    for (i in popnamelist)
        snpdatafetcher.ColumnAdd("XPEHH_" + popnamelist[i], "Float2", popcollist2[i]);

    //Create components in the plot channel for the fetcher columns
    for (var yid in snpdatafetcher.Columns)
        SnpChannel.AddComponent(new ChannelPlotChannelYValsComp(snpdatafetcher, yid));

    //add snpid column to the datafetcher, needed for the tooltip (but not plotted)
    snpdatafetcher.ColumnAdd("snpid", "String");
    snpdatafetcher.ColumnActivate("snpid");

    myChromoPlot.AddChannel(SnpChannel);



    //----------------------------------------------------------------
    //------------------- INITIALISE WINDOW DATA ---------------------
    //----------------------------------------------------------------

    //Create the plot channel for the window data
    WinChannel = new ChannelPlotChannelYVals(myChromoPlot);
    WinChannel.Title = "Window significances";
    WinChannel.SubTitle = "-log10(p)";
    WinChannel.YMinVal = 0.0;
    WinChannel.YMaxVal = 5.0;

    //Create the data fetcher for the window data
    windatafetcher = new CurveDataFetcher(theserverurl, "windows", "pos");
    myChromoPlot.AddDataFetcher(windatafetcher);
    WinChannel.GenerateToolTipInfo = GenerateToolTipInfo_Window;
    WinChannel.OnPointClickEvent = PointClickEvent_Win;

    //Create the columns of the data fetcher
    for (i in popnamelist) {
        var colinfo = windatafetcher.ColumnAdd("WIHS_" + popnamelist[i], "Float2", popcollist[i]);
        colinfo.MakeDrawLines(300000.0);//This causes the points to be connected with lines
    }
    for (i in popnamelist) {
        var colinfo = windatafetcher.ColumnAdd("WXPEHH_" + popnamelist[i], "Float2", popcollist2[i]);
        colinfo.MakeDrawLines(300000.0); //This causes the points to be connected with lines
    }

    //Create components in the plot channel for the fetcher columns
    for (var yid in windatafetcher.Columns) {
        var comp = WinChannel.AddComponent(new ChannelPlotChannelYValsComp(windatafetcher, yid));
        comp.YFunction = PVal2Log; //we hook up a function that maps the p values to logs
    }

    //add winstop column to the datafetcher, needed for the tooltip (but not plotted)
    windatafetcher.ColumnAdd("winsize", "IntB64");
    windatafetcher.ColumnActivate("winsize");//we need to activate it manually, otherwise it's not fetched automatically

    myChromoPlot.AddChannel(WinChannel);

    //----------------------------------------------------------------
    //--------------- FINALISATION -----------------------------------
    //----------------------------------------------------------------


    myChromoPlot.SetChromosome(1, false, true);

    OnAllPops(); //This activates the display of all populations
}