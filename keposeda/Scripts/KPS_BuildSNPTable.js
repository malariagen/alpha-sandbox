﻿

//Handler function for update query button
function UpdateQuerySNPAdvanced() {
    var thequery = elemBuilderSNPAdvanced.myBuilder.getQuery();
    elemTableSNPAdvanced.myTable.setQuery(thequery);
    elemTableSNPAdvanced.myTable.reLoadTable();
}


// Handler function for hyperlink clicking in the table
function OnTableClick_SNPAdvanced(rownr) {
    $('#browser').trigger('click');
    var datafetcher = elemTableSNPAdvanced.myTable.myDataFetcher;
    var idx = datafetcher.findIndexByXVal(rownr);
    var thechrom = datafetcher.getColumnPoint(idx, "chrom");
    var thepos = datafetcher.getColumnPoint(idx, "pos");
    myChromoPlot.showRegion(thechrom, thepos, 500);
}


function Build_AdvancedQuerySNPs() {
    var elem_builder = DQX.Gui.QueryBuilder('IDQuerySNPAdvanced', {});
    elemBuilderSNPAdvanced = elem_builder

    var builder = elem_builder.myBuilder;

    var chromlist = [];
    for (var i = 1; i <= 22; i++)
        chromlist.push({ id: i, name: "Chromosome " + i });

    var baselist = [{ id: 'A', name: 'A' }, { id: 'C', name: 'C' }, { id: 'G', name: 'G' }, { id: 'T', name: 'T' }, { id: '-', name: '-' }, ];

    builder.addTableColumn(DQX.SQL.TableColInfo("chrom", "Chromosome", "MultiChoiceInt", chromlist));
    builder.addTableColumn(DQX.SQL.TableColInfo("pos", "Position", "Integer"));
    builder.addTableColumn(DQX.SQL.TableColInfo("snpid", "Snp", "String"));
    builder.addTableColumn(DQX.SQL.TableColInfo("allele1", "Allele 1", "MultiChoiceInt", baselist));
    builder.addTableColumn(DQX.SQL.TableColInfo("allele2", "Allele 2", "MultiChoiceInt", baselist));
    builder.addTableColumn(DQX.SQL.TableColInfo("ancallele", "Ancestral allele", "MultiChoiceInt", baselist));

    for (i in popnamelist) {
        var ID = "Freq_" + popnamelist[i];
        var colname = "Frequency " + popnamelist[i];
        builder.addTableColumn(DQX.SQL.TableColInfo(ID, colname, "Float"));
    }

    for (i in popnamelist) {
        var ID = "IHS_" + popnamelist[i];
        var colname = "IHS " + popnamelist[i];
        builder.addTableColumn(DQX.SQL.TableColInfo(ID, colname, "Float"));
    }

    for (i in popnamelist) {
        var ID = "XPEHH_" + popnamelist[i];
        var colname = "XPEHH " + popnamelist[i];
        builder.addTableColumn(DQX.SQL.TableColInfo(ID, colname, "Float"));
    }

    builder._createNewStatement(builder.root);
    builder.render();
}


function Build_TableSNPs(baseid) {

    var datafetcher = new DQX.DataFetcher.Curve(theserverurl, "snps", "LIMIT");
    datafetcher.positionField = "chrom~pos";

    var elem_table = DQX.Gui.QueryTable(baseid, datafetcher, { leftfraction: 30 });
    mytable = elem_table.myTable;


    mytable.addSortOption("Position", DQX.SQL.TableSort(['chrom', 'pos']));

    //Create the columns of the data fetcher, and the table columns

    var colinfo = datafetcher.addFetchColumn("chrom", "IntB64", "rgb(0,0,0)");
    var comp = mytable.addTableColumn(DQX.QueryTable.Column("Chr.", "chrom", 0));
    comp.myComment = 'The chromosome';
    comp.CellToColor = returnLightGray;

    var colinfo = datafetcher.addFetchColumn("pos", "IntB64", "rgb(0,0,0)");
    var comp = mytable.addTableColumn(DQX.QueryTable.Column("Position", "pos", 0));
    comp.myComment = 'The position on the chromosome, in base pairs';
    comp.CellToColor = returnLightGray;

    var colinfo = datafetcher.addFetchColumn("snpid", "String", "rgb(0,0,0)");
    var comp = mytable.addTableColumn(DQX.QueryTable.Column("Snp", "snpid", 0));
    comp.myComment = 'The RS identifier of the snp';
    comp.CellToColor = returnLightGray;

    var colinfo = datafetcher.addFetchColumn("allele1", "String", "rgb(0,0,0)");
    var comp = mytable.addTableColumn(DQX.QueryTable.Column("Allele<br/>1", "allele1", 0));
    comp.myComment = 'Allele 1, as defined on the Illumina chip';
    comp.CellToColor = returnLightGray;

    var colinfo = datafetcher.addFetchColumn("allele2", "String", "rgb(0,0,0)");
    var comp = mytable.addTableColumn(DQX.QueryTable.Column("Allele<br/>2", "allele2", 0));
    comp.myComment = 'Allele 2, as defined on the Illumina chip';
    comp.CellToColor = returnLightGray;

    var colinfo = datafetcher.addFetchColumn("ancallele", "String", "rgb(0,0,0)");
    var comp = mytable.addTableColumn(DQX.QueryTable.Column("Anc.<br/>Allele", "ancallele", 0));
    comp.myComment = 'The ancestral allele';
    comp.CellToColor = returnLightGray;

    for (i in popnamelist) {
        var ID = "Freq_" + popnamelist[i];
        var colname = "Freq.<br/>" + abbrpopnamelist[i];
        var colinfo = datafetcher.addFetchColumn(ID, "Float3", popcollist[i]);
        var comp = mytable.addTableColumn(DQX.QueryTable.Column(colname, ID, 1));
        comp.myComment = 'Frequency of occurrence of allele 1 for population {pop}, scaled between 0 and 1'.DQXformat({pop:popnamelist[i]});
        comp.CellToText = Freq2Text;
        comp.CellToColor = Freq2Color;
        mytable.addSortOption(colname, DQX.SQL.TableSort([ID]));
    }

    for (i in popnamelist) {
        var ID = "IHS_" + popnamelist[i];
        var colname = "iHS<br/>" + abbrpopnamelist[i];
        var colinfo = datafetcher.addFetchColumn(ID, "Float3", popcollist[i]);
        var comp = mytable.addTableColumn(DQX.QueryTable.Column(colname, ID, 1));
        comp.myComment = 'The normalised iHS statistic for population {pop}'.DQXformat({ pop: popnamelist[i] });
        comp.CellToText = StatVal2Text;
        comp.CellToColor = StatVal2ColorIHS;
        mytable.addSortOption(colname, DQX.SQL.TableSort([ID]));

    }

    for (i in popnamelist) {
        var ID = "XPEHH_" + popnamelist[i];
        var colname = "XPEHH<br/>" + abbrpopnamelist[i];
        var colinfo = datafetcher.addFetchColumn(ID, "Float3", popcollist[i]);
        var comp = mytable.addTableColumn(DQX.QueryTable.Column(colname, ID, 1));
        comp.myComment = 'The normalised XP-EHH statistic for population {pop}'.DQXformat({ pop: popnamelist[i] });
        comp.CellToText = StatVal2Text;
        comp.CellToColor = StatVal2ColorXPEHH;
        mytable.addSortOption(colname, DQX.SQL.TableSort([ID]));
    }

    //we start by defining a query that returns nothing
    datafetcher.setUserQuery(DQX.SQL.WhereClause.None());
    mytable.render();
    return elem_table;
}
