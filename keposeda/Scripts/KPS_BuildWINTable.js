﻿

// Handler function for hyperlink clicking in the table with the simple window query table
function OnTableClick_WinSimple(rownr) {
    $('#browser').trigger('click');
    var datafetcher = elemTableWindowSimple.myTable.myDataFetcher;
    var idx = datafetcher.FindIndexByXVal(rownr);
    var thechrom = datafetcher.GetColumnPoint(idx, "chrom");
    var thepos = datafetcher.GetColumnPoint(idx, "pos");
    var thesize = datafetcher.GetColumnPoint(idx, "winsize");
    myChromoPlot.ShowRegion(thechrom, thepos, thesize);
}

// Handler function for hyperlink clicking in the table with the advanced window query table
function OnTableClick_WinAdvanced(rownr) {
    $('#browser').trigger('click');
    var datafetcher = elemTableWindowAdvanced.myTable.myDataFetcher;
    var idx = datafetcher.FindIndexByXVal(rownr);
    var thechrom = datafetcher.GetColumnPoint(idx, "chrom");
    var thepos = datafetcher.GetColumnPoint(idx, "pos");
    var thesize = datafetcher.GetColumnPoint(idx, "winsize");
    myChromoPlot.ShowRegion(thechrom, thepos, thesize);
}


//Handler function for updating the query results of the simple window query table
function UpdateQueryWinsSimple() {
    var querystat = $("#QueryStat").val();
    var queryfield = "IHSTop1";
    if (querystat == "XPEHH") queryfield = "XPEHHTop1";
    var value = $("#QueryVal").val();
    if (value == "") value = "0";
    var thequery = DQX.SQL.WhereClause.AND();
    thequery.AddComponent(DQX.SQL.WhereClause.CompareFixed(queryfield, ">=", parseInt(value)));
    for (popnr in popnamelist)
        if ($('#QueryPop' + popnamelist[popnr]).attr('checked'))
            thequery.AddComponent(DQX.SQL.WhereClause.CompareFixed("W" + querystat + "_" + popnamelist[popnr], "<=", 0.01));
    elemTableWindowSimple.myTable.setQuery(thequery);
    elemTableWindowSimple.myTable.ReLoad();
}

//Handler function that invalidates the simple window query results whenever a query parameter was changed
function InvalidateQueryWindowSimple() {
    elemTableWindowSimple.myTable.invalidate();
}

//Build the simple window query table
function Build_SimpleQueryWins() {
    var rs = "Including: ";
    for (popnr in popnamelist) {
        rs += '<input type="checkbox" id="QueryPop' + popnamelist[popnr] + '" onchange="InvalidateQueryWindowSimple()"/>' + popnamelist[popnr] + "&nbsp;&nbsp;";
    }
    $('#QueryPopChecks').html(rs);
}



//Handler function for updating the query results of the advanced window query table
function UpdateQueryWinsAdvanced() {
    var thequery = elemBuilderWindowAdvanced.myBuilder.GetQuery();
    elemTableWindowAdvanced.myTable.setQuery(thequery);
    elemTableWindowAdvanced.myTable.ReLoad();
}

//Build the advanced window query builder
function Build_AdvancedQueryWins() {

    var elem_builder = DQX.Gui.QueryBuilder('IDQueryWindowsAdvanced', {});
    elemBuilderWindowAdvanced = elem_builder

    var chromlist = [];
    for (var i = 1; i <= 22; i++)
        chromlist.push({ id: i, name: "Chromosome " + i });

    elem_builder.myBuilder.AddColumn(DQX.SQL.TableColInfo("chrom", "Chromosome", "MultiChoiceInt", chromlist));
    elem_builder.myBuilder.AddColumn(DQX.SQL.TableColInfo("pos", "Position", "Integer"));
    elem_builder.myBuilder.AddColumn(DQX.SQL.TableColInfo("winsize", "Window size", "Integer"));
    elem_builder.myBuilder.AddColumn(DQX.SQL.TableColInfo("overlapgenes", "Overlapping genes", "String"));

    elem_builder.myBuilder.AddColumn(DQX.SQL.TableColInfo("IHSTop1", "IHS top 1%", "Float"));
    for (i in popnamelist) {
        var ID = "WIHS_" + popnamelist[i];
        var colname = "R(iHS) " + popnamelist[i];
        elem_builder.myBuilder.AddColumn(DQX.SQL.TableColInfo(ID, colname, "Float"));
    }

    elem_builder.myBuilder.AddColumn(DQX.SQL.TableColInfo("XPEHHTop1", "XPEHH top 1%", "Float"));
    for (i in popnamelist) {
        var ID = "WXPEHH_" + popnamelist[i];
        var colname = "R(XPEHH) " + popnamelist[i];
        elem_builder.myBuilder.AddColumn(DQX.SQL.TableColInfo(ID, colname, "Float"));
    }

    elem_builder.myBuilder._createNewStatement(elem_builder.myBuilder.root);
    elem_builder.myBuilder.Render();
}




//Build the window table (used for both simple and advanced!)
function Build_TableWins(baseid) {

    //Build the datafetcher
    var tbwindatafetcher = new DQX.DataFetcher.Curve(theserverurl, "windows", "LIMIT");
    tbwindatafetcher.PositionField = "chrom~pos";

    tbwindatafetcher.ColumnAdd("chrom", "IntB64", "rgb(0,0,0)");
    tbwindatafetcher.ColumnAdd("pos", "IntB64", "rgb(0,0,0)");
    tbwindatafetcher.ColumnAdd("winsize", "IntB64", "rgb(0,0,0)");
    tbwindatafetcher.ColumnAdd("overlapgenes", "String", "rgb(0,0,0)");
    tbwindatafetcher.ColumnAdd("IHSTop1", "IntB64", "rgb(0,0,0)");
    for (i in popnamelist)
        tbwindatafetcher.ColumnAdd("WIHS_" + popnamelist[i], "Float3", popcollist[i]);
    tbwindatafetcher.ColumnAdd("XPEHHTop1", "IntB64", "rgb(0,0,0)");
    for (i in popnamelist)
        tbwindatafetcher.ColumnAdd("WXPEHH_" + popnamelist[i], "Float3", popcollist[i]);

    var elem_table = DQX.Gui.QueryTable(baseid, tbwindatafetcher, { leftfraction: 30 });
    var mytable = elem_table.myTable;

    mytable.AddSortOption("Position", DQX.SQL.TableSort(['chrom', 'pos']));


    //Create the columns of the table
    var comp = mytable.AddColumn(DQX.QueryTable.Column("Chr.", "chrom", 0));
    comp.CellToColor = returnLightGray;

    var comp = mytable.AddColumn(DQX.QueryTable.Column("Position", "pos", 0));
    comp.CellToColor = returnLightGray;

    var comp = mytable.AddColumn(DQX.QueryTable.Column("Window<br/>size", "winsize", 0));
    comp.CellToColor = returnLightGray;

    var comp = mytable.AddColumn(DQX.QueryTable.Column("Overlapping&nbsp;genes", "overlapgenes", 0));
    comp.CellToColor = returnLightGray;

    var comp = mytable.AddColumn(DQX.QueryTable.Column("IHS<br/>top&nbsp;1%", "IHSTop1", 1));
    mytable.AddSortOption("IHS top 1% populations", DQX.SQL.TableSort(["IHSTop1"]));

    for (i in popnamelist) {
        var ID = "WIHS_" + popnamelist[i];
        var colname = "R(iHS)<br/>" + abbrpopnamelist[i];
        var comp = mytable.AddColumn(DQX.QueryTable.Column(colname, ID, 1));
        comp.CellToText = PVal2Text;
        comp.CellToColor = PVal2ColorIHS;
        mytable.AddSortOption(colname, DQX.SQL.TableSort([ID]));
    }

    var comp = mytable.AddColumn(DQX.QueryTable.Column("XPEHH<br/>top&nbsp;1%", "XPEHHTop1", 1));
    mytable.AddSortOption("XPEHH top 1% populations", DQX.SQL.TableSort(["XPEHHTop1"]));

    for (i in popnamelist) {
        var ID = "WXPEHH_" + popnamelist[i];
        var colname = "R(XPEHH)<br/>" + abbrpopnamelist[i];
        var comp = mytable.AddColumn(DQX.QueryTable.Column(colname, ID, 1));
        comp.CellToText = PVal2Text;
        comp.CellToColor = PVal2ColorXPEHH;
        mytable.AddSortOption(colname, DQX.SQL.TableSort([ID]));
    }

    return elem_table;
}
