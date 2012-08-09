
//             [------------------------- GAMBIA -----------------------------]                 [---------- Ghana -------------]           [-----]              [-------]
popnamelist = ['Mandinka', 'Wolof', 'Jola', 'Fula', 'Akan', 'Northerner', 'YRI', 'Malawi'];
popcollist = ["rgb(0,0,170)", "rgb(0,120,100)", "rgb(0,100,255)", "rgb(120,0,120)", "rgb(0,150,0)", "rgb(120,120,0)", "rgb(100,100,100)", "rgb(170,0,0)"];


function PVal2Text(x) {
    if (x == null)
        return "-";
    else
        return (100.0 * x).toFixed(2);
}

function PVal2Color(p) {
    if (p == null)
        return "white";
    else {
        var vl = -Math.log(p) / Math.log(10);
        vl = Math.min(1, vl / 4);
        var r = 255*(1-0.3*vl*vl*vl*vl);
        var g = 255*(1-vl*vl);
        var b = 255 * (1 - vl);
        return "rgb("+parseInt(r)+","+parseInt(g)+","+parseInt(b)+")";
    }
}


function OnUpdateQuery() {
    var value = $("#QueryVal").val();
    windatafetcher.UserQuery = new DQXWhereClause_Compound("AND", [
        new DQXWhereClause_CompareFixed("WIHS_Fula", "<", parseFloat(value)/100.0),
        new DQXWhereClause_CompareFixed("WIHS_Jola", "<", parseFloat(value)/100.0)
        ]);
    mytable.ReLoad();
}

function OnWinClick(rownr) {
    alert("Yep: "+rownr);
}


$(function () {

    //Global initialisation of utilities
    DQX.Init();

    var theserverurl = "http://localhost:8000/app01";

    windatafetcher = new CurveDataFetcher(theserverurl, "windows", "LIMIT");
    windatafetcher.PositionField = "chrom~pos";


    mytable = new DQXQueryTable("Table", windatafetcher);

    mytable.AddSortOption("Position", new DQXTableSort(['chrom', 'pos']));

    //Create the columns of the data fetcher

    var colinfo = windatafetcher.ColumnAdd("chrom", "IntB64", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("Chrom.", "chrom"));

    var colinfo = windatafetcher.ColumnAdd("pos", "IntB64", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("Position", "pos"));
    comp.MakeHyperlink(OnWinClick);

    var colinfo = windatafetcher.ColumnAdd("winsize", "IntB64", "rgb(0,0,0)");
    var comp = mytable.AddColumn(new DQXQueryTableColumn("Window size", "winsize"));

    for (i in popnamelist) {
        var ID = "WIHS_" + popnamelist[i];
        var colname = "iHS " + popnamelist[i];
        var colinfo = windatafetcher.ColumnAdd(ID, "Float3", popcollist[i]);
        var comp = mytable.AddColumn(new DQXQueryTableColumn(colname, ID));
        //comp.Collapsed = true;
        comp.CellToText = PVal2Text;
        comp.CellToColor = PVal2Color;

        mytable.AddSortOption(colname, new DQXTableSort([ID]));

    }

    for (i in popnamelist) {
        var ID = "WXPEHH_" + popnamelist[i];
        var colname = "XPEHH " + popnamelist[i];
        var colinfo = windatafetcher.ColumnAdd(ID, "Float3", popcollist[i]);
        var comp = mytable.AddColumn(new DQXQueryTableColumn(colname, ID));
        //comp.Collapsed = true;
        comp.CellToText = PVal2Text;
        comp.CellToColor = PVal2Color;

        mytable.AddSortOption(colname, new DQXTableSort([ID]));
    }

    /*    for (i in popnamelist) {
    var colinfo = windatafetcher.ColumnAdd("WXPEHH_" + popnamelist[i], "Float3", popcollist[i]);
    }*/





    mytable.Render();

});
