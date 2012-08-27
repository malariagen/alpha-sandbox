

//Handler function for update query button
function UpdateQuerySNPAdvanced() {
    var thequery = elemBuilderSNPAdvanced.myBuilder.GetQuery();
    elemTableSNPAdvanced.myTable.setQuery(thequery);
    elemTableSNPAdvanced.myTable.ReLoad();
}


// Handler function for hyperlink clicking in the table
function OnTableClick_SNPAdvanced(rownr) {
    $('#browser').trigger('click');
    var datafetcher = elemTableSNPAdvanced.myTable.myDataFetcher;
    var idx = datafetcher.FindIndexByXVal(rownr);
    var thechrom = datafetcher.GetColumnPoint(idx, "chrom");
    var thepos = datafetcher.GetColumnPoint(idx, "pos");
    myChromoPlot.ShowRegion(thechrom, thepos, 500);
}


function Build_AdvancedQuerySNPs() {
    var elem_builder = DQX.Gui.QueryBuilder('IDQuerySNPAdvanced', {});
    elemBuilderSNPAdvanced = elem_builder

    var builder = elem_builder.myBuilder;

    var chromlist = [];
    for (var i = 1; i <= 22; i++)
        chromlist.push({ id: i, name: "Chromosome " + i });

    builder.AddColumn(DQX.SQL.TableColInfo("chrom", "Chromosome", "MultiChoiceInt", chromlist));
    builder.AddColumn(DQX.SQL.TableColInfo("pos", "Position", "Integer"));
    builder.AddColumn(DQX.SQL.TableColInfo("snpid", "Snp", "String"));
    builder.AddColumn(DQX.SQL.TableColInfo("allele1", "Allele 1", "String"));
    builder.AddColumn(DQX.SQL.TableColInfo("allele2", "Allele 2", "String"));
    builder.AddColumn(DQX.SQL.TableColInfo("ancallele", "Ancestral allele", "String"));

    for (i in popnamelist) {
        var ID = "Freq_" + popnamelist[i];
        var colname = "Frequency " + popnamelist[i];
        builder.AddColumn(DQX.SQL.TableColInfo(ID, colname, "Float"));
    }

    for (i in popnamelist) {
        var ID = "IHS_" + popnamelist[i];
        var colname = "IHS " + popnamelist[i];
        builder.AddColumn(DQX.SQL.TableColInfo(ID, colname, "Float"));
    }

    for (i in popnamelist) {
        var ID = "XPEHH_" + popnamelist[i];
        var colname = "XPEHH " + popnamelist[i];
        builder.AddColumn(DQX.SQL.TableColInfo(ID, colname, "Float"));
    }

    builder._createNewStatement(builder.root);
    builder.Render();
}


function Build_TableSNPs(baseid) {

    var datafetcher = new DQX.DataFetcher.Curve(theserverurl, "snps", "LIMIT");
    datafetcher.PositionField = "chrom~pos";

    var elem_table = DQX.Gui.QueryTable(baseid, datafetcher, { leftfraction: 30 });
    mytable = elem_table.myTable;


    mytable.AddSortOption("Position", DQX.SQL.TableSort(['chrom', 'pos']));

    //Create the columns of the data fetcher, and the table columns

    var colinfo = datafetcher.ColumnAdd("chrom", "IntB64", "rgb(0,0,0)");
    var comp = mytable.AddColumn(DQX.QueryTable.Column("Chr.", "chrom", 0));
    comp.CellToColor = returnLightGray;

    var colinfo = datafetcher.ColumnAdd("pos", "IntB64", "rgb(0,0,0)");
    var comp = mytable.AddColumn(DQX.QueryTable.Column("Position", "pos", 0));
    comp.CellToColor = returnLightGray;

    var colinfo = datafetcher.ColumnAdd("snpid", "String", "rgb(0,0,0)");
    var comp = mytable.AddColumn(DQX.QueryTable.Column("Snp", "snpid", 0));
    comp.CellToColor = returnLightGray;

    var colinfo = datafetcher.ColumnAdd("allele1", "String", "rgb(0,0,0)");
    var comp = mytable.AddColumn(DQX.QueryTable.Column("Allele 1", "allele1", 0));
    comp.CellToColor = returnLightGray;

    var colinfo = datafetcher.ColumnAdd("allele2", "String", "rgb(0,0,0)");
    var comp = mytable.AddColumn(DQX.QueryTable.Column("Allele 2", "allele2", 0));
    comp.CellToColor = returnLightGray;

    var colinfo = datafetcher.ColumnAdd("ancallele", "String", "rgb(0,0,0)");
    var comp = mytable.AddColumn(DQX.QueryTable.Column("Anc. Allele", "ancallele", 0));
    comp.CellToColor = returnLightGray;

    for (i in popnamelist) {
        var ID = "Freq_" + popnamelist[i];
        var colname = "Frequency " + popnamelist[i];
        var colinfo = datafetcher.ColumnAdd(ID, "Float3", popcollist[i]);
        var comp = mytable.AddColumn(DQX.QueryTable.Column(colname, ID, 1));
        comp.CellToText = Freq2Text;
        comp.CellToColor = Freq2Color;
        mytable.AddSortOption(colname, DQX.SQL.TableSort([ID]));
    }

    for (i in popnamelist) {
        var ID = "IHS_" + popnamelist[i];
        var colname = "iHS " + popnamelist[i];
        var colinfo = datafetcher.ColumnAdd(ID, "Float3", popcollist[i]);
        var comp = mytable.AddColumn(DQX.QueryTable.Column(colname, ID, 1));
        comp.CellToText = StatVal2Text;
        comp.CellToColor = StatVal2ColorIHS;
        mytable.AddSortOption(colname, DQX.SQL.TableSort([ID]));

    }

    for (i in popnamelist) {
        var ID = "XPEHH_" + popnamelist[i];
        var colname = "XPEHH " + popnamelist[i];
        var colinfo = datafetcher.ColumnAdd(ID, "Float3", popcollist[i]);
        var comp = mytable.AddColumn(DQX.QueryTable.Column(colname, ID, 1));
        comp.CellToText = StatVal2Text;
        comp.CellToColor = StatVal2ColorXPEHH;
        mytable.AddSortOption(colname, DQX.SQL.TableSort([ID]));
    }

    //we start by defining a query that returns nothing
    datafetcher.SetUserQuery(DQX.SQL.WhereClause.None());
    mytable.Render();
    return elem_table;
}
