
//             [------------------------- GAMBIA -----------------------------]                 [---------- Ghana -------------]           [-----]              [-------]
popnamelist = ['Mandinka', 'Wolof', 'Jola', 'Fula', 'Akan', 'Northerner', 'YRI', 'Malawi'];
popcollist = ["rgb(0,0,170)", "rgb(0,120,100)", "rgb(0,100,255)", "rgb(120,0,120)", "rgb(0,150,0)", "rgb(120,120,0)", "rgb(100,100,100)", "rgb(170,0,0)"];


function Val2Text(x) {
    if (x == null)
        return "-";
    else
        return x.toFixed(3);
}

function Val2ColorIHS(vl) {
    if (vl == null)
        return "white";
    else {
        var vl = Math.abs(vl);
        vl = Math.min(1, vl / 4);
        var r = 255 * (1 - 0.3 * vl * vl * vl * vl);
        var g = 255 * (1 - vl * vl);
        var b = 255 * (1 - vl);
        return "rgb(" + parseInt(r) + "," + parseInt(g) + "," + parseInt(b) + ")";
    }
}

function Val2ColorXPEHH(vl) {
    if (vl == null)
        return "white";
    else {
        var vl = Math.abs(vl);
        vl = Math.min(1, vl / 4);
        var r = 255 * (1 - 0.3 * vl * vl * vl * vl);
        var g = 255 * (1 - vl * vl);
        var b = 255 * (1 - 0.5*vl);
        return "rgb(" + parseInt(r) + "," + parseInt(g) + "," + parseInt(b) + ")";
    }
}


function Freq2Text(x) {
    if (x == null)
        return "-";
    else
        return (100*x).toFixed(1);
}

function Freq2Color(vl) {
    if (vl == null)
        return "white";
    else {
        var vl = Math.abs(vl);
        vl = Math.min(1, vl);
        var g = 255 * (1 - 0.3 * vl * vl * vl * vl);
        var r = 255 * (1 - vl * vl);
        var b = 255 * (1 - vl);
        return "rgb(" + parseInt(r) + "," + parseInt(g) + "," + parseInt(b) + ")";
    }
}


function OnUpdateQuery() {
    var value = $("#QueryVal").val();
    windatafetcher.UserQuery = new DQXWhereClause_Compound("AND", [
        new DQXWhereClause_CompareFixed("IHS_Fula", ">=", parseFloat(value)),
        new DQXWhereClause_CompareFixed("IHS_Jola", ">=", parseFloat(value))
        ]);
    mytable.ReLoad();
}

function OnWinClick(rownr) {
    alert("Yep: " + rownr);
}



$(function () {

    //Global initialisation of utilities
    DQX.Init();

    var theserverurl = "http://alpha.malariagen.net/sandbox/keposeda/app";

    windatafetcher = new CurveDataFetcher(theserverurl, "snps", "LIMIT");
    windatafetcher.PositionField = "chrom~pos";


    /*    windatafetcher.UserQuery = new DQXWhereClause_Compound("AND", [
    new DQXWhereClause_CompareFixed("IHS_Fula", ">", 2.0),
    new DQXWhereClause_CompareFixed("IHS_Jola", ">", 2.0)
    ]);*/


    mytable = new DQXQueryTable("Table", windatafetcher);
    mytable.myPageSize = 40;

    mytable.AddSortOption("Position", new DQXTableSort(['chrom', 'pos']));

    //Create the columns of the data fetcher

    var colinfo = windatafetcher.ColumnAdd("chrom", "IntB64", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("Chrom.", "chrom",0));

    var colinfo = windatafetcher.ColumnAdd("pos", "IntB64", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("Position", "pos",0));

    var colinfo = windatafetcher.ColumnAdd("snpid", "String", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("Snp", "snpid",0));

    var colinfo = windatafetcher.ColumnAdd("allele1", "String", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("Allele 1", "allele1",0));

    var colinfo = windatafetcher.ColumnAdd("allele2", "String", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("Allele 2", "allele2",0));

    var colinfo = windatafetcher.ColumnAdd("ancallele", "String", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("Anc. Allele", "ancallele",0));

    for (i in popnamelist) {
        var ID = "Freq_" + popnamelist[i];
        var colname = "Frequency " + popnamelist[i];
        var colinfo = windatafetcher.ColumnAdd(ID, "Float3", popcollist[i]);
        var comp = mytable.AddColumn(new DQXQueryTableColumn(colname, ID,1));
        //comp.Collapsed = true;
        comp.CellToText = Freq2Text;
        comp.CellToColor = Freq2Color;

        mytable.AddSortOption(colname, new DQXTableSort([ID]));

    }

    for (i in popnamelist) {
        var ID = "IHS_" + popnamelist[i];
        var colname = "iHS " + popnamelist[i];
        var colinfo = windatafetcher.ColumnAdd(ID, "Float3", popcollist[i]);
        var comp = mytable.AddColumn(new DQXQueryTableColumn(colname, ID,1));
        //comp.Collapsed = true;
        comp.CellToText = Val2Text;
        comp.CellToColor = Val2ColorIHS;

        mytable.AddSortOption(colname, new DQXTableSort([ID]));

    }

    for (i in popnamelist) {
        var ID = "XPEHH_" + popnamelist[i];
        var colname = "XPEHH " + popnamelist[i];
        var colinfo = windatafetcher.ColumnAdd(ID, "Float3", popcollist[i]);
        var comp = mytable.AddColumn(new DQXQueryTableColumn(colname, ID,1));
        //comp.Collapsed = true;
        comp.CellToText = Val2Text;
        comp.CellToColor = Val2ColorXPEHH;

        mytable.AddSortOption(colname, new DQXTableSort([ID]));
    }





    mytable.Render();

});
