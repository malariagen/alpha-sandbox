
//This function is used to convert p values to text in a table column
function PVal2Text(x) {
    if (x == null)
        return "-";
    else
        return (100.0 * x).toFixed(2);
}

//This function is used to convert p values to color in a table IHS column
function PVal2ColorIHS(p) {
    if (p == null)
        return "white";
    else {
        var vl = -Math.log(p) / Math.log(10);
        vl = Math.min(1, vl / 4);
        var r = 255 * (1 - 0.3 * vl * vl * vl * vl);
        var g = 255 * (1 - vl * vl);
        var b = 255 * (1 - vl);
        return "rgb(" + parseInt(r) + "," + parseInt(g) + "," + parseInt(b) + ")";
    }
}

//This function is used to convert p values to color in a table XPEHH column
function PVal2ColorXPEHH(p) {
    if (p == null)
        return "white";
    else {
        var vl = -Math.log(p) / Math.log(10);
        vl = Math.min(1, vl / 4);
        var r = 255 * (1 - 0.3 * vl * vl * vl * vl);
        var g = 255 * (1 - vl * vl);
        var b = 255 * (1 - 0.5 * vl);
        return "rgb(" + parseInt(r) + "," + parseInt(g) + "," + parseInt(b) + ")";
    }
}

//This function is called to update the query result after a change in parameters
function OnUpdateQuery() {
    var querystat = $("#QueryStat").val();
    var queryfield = "IHSTop1";
    if (querystat == "XPEHH") queryfield = "XPEHHTop1";
    var value = $("#QueryVal").val();
    if (value == "") value = "0";
    tbwindatafetcher.UserQuery = new DQXWhereClause_AND();
    tbwindatafetcher.UserQuery.AddComponent(new DQXWhereClause_CompareFixed(queryfield, ">=", parseInt(value)));
    for (popnr in popnamelist)
        if ($('#QueryPop' + popnamelist[popnr]).attr('checked'))
            tbwindatafetcher.UserQuery.AddComponent(new DQXWhereClause_CompareFixed("W"+querystat+"_"+popnamelist[popnr], "<=", 0.01));
    mytable.ReLoad();
}

//This function is used as a callback when the user clicks the hyperlink in row in a table
function OnTableWinClick(rownr) {
    var idx = tbwindatafetcher.FindIndexByXVal(rownr);
    var thechrom = tbwindatafetcher.GetColumnPoint(idx, "chrom");
    var thepos = tbwindatafetcher.GetColumnPoint(idx, "pos");
    var thesize = tbwindatafetcher.GetColumnPoint(idx, "winsize");
    myChromoPlot.ShowRegion(thechrom, thepos, thesize);
}


//Create the query checkboxes for each population
function CreatePopQueries() {
    var rs="Including: ";
    for (popnr in popnamelist) {
        rs += '<input type="checkbox" id="QueryPop' + popnamelist[popnr] + '" onchange="OnUpdateQuery()"/> ' + popnamelist[popnr] + "&nbsp;&nbsp;&nbsp;&nbsp;";
    }
    $('#QueryPopChecks').html(rs);
}


/////////////////////////////////////////////////////////////////////////////////////////////////
// MAIN INITIALISATION FUNCTION
/////////////////////////////////////////////////////////////////////////////////////////////////

function InitKeposedaTable() {

    tbwindatafetcher = new CurveDataFetcher(theserverurl, "windows", "LIMIT");
    tbwindatafetcher.PositionField = "chrom~pos";

    mytable = new DQXQueryTable("Table", tbwindatafetcher);

    mytable.AddSortOption("Position", new DQXTableSort(['chrom', 'pos']));

    CreatePopQueries();


    //Create the columns of the data fetcher

    var colinfo = tbwindatafetcher.ColumnAdd("chrom", "IntB64", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("Chr.", "chrom", 0));

    var colinfo = tbwindatafetcher.ColumnAdd("pos", "IntB64", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("Position", "pos", 0));
    comp.MakeHyperlink(OnTableWinClick);

    var colinfo = tbwindatafetcher.ColumnAdd("winsize", "IntB64", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("Window size", "winsize", 0));

    var colinfo = tbwindatafetcher.ColumnAdd("overlapgenes", "String", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("Overlapping genes", "overlapgenes", 0));

    var colinfo = tbwindatafetcher.ColumnAdd("IHSTop1", "IntB64", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("IHS top&nbsp;1%", "IHSTop1", 1));
    mytable.AddSortOption("IHS top 1% populations", new DQXTableSort(["IHSTop1"]));

    for (i in popnamelist) {
        var ID = "WIHS_" + popnamelist[i];
        var colname = "iHS " + abbrpopnamelist[i];
        var colinfo = tbwindatafetcher.ColumnAdd(ID, "Float3", popcollist[i]);
        var comp = mytable.AddColumn(new DQXQueryTableColumn(colname, ID, 1));
        comp.CellToText = PVal2Text;
        comp.CellToColor = PVal2ColorIHS;
        mytable.AddSortOption(colname, new DQXTableSort([ID]));
    }

    var colinfo = tbwindatafetcher.ColumnAdd("XPEHHTop1", "IntB64", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("XPEHH top&nbsp;1%", "XPEHHTop1", 1));
    mytable.AddSortOption("XPEHH top 1% populations", new DQXTableSort(["XPEHHTop1"]));

    for (i in popnamelist) {
        var ID = "WXPEHH_" + popnamelist[i];
        var colname = "XPEHH " + abbrpopnamelist[i];
        var colinfo = tbwindatafetcher.ColumnAdd(ID, "Float3", popcollist[i]);
        var comp = mytable.AddColumn(new DQXQueryTableColumn(colname, ID, 1));
        comp.CellToText = PVal2Text;
        comp.CellToColor = PVal2ColorXPEHH;
        mytable.AddSortOption(colname, new DQXTableSort([ID]));
    }

    mytable.Render();
}
