popnamelist = ['Mandinka', 'Wolof', 'Jola', 'Fula', 'Akan', 'Northerner', 'YRI', 'Malawi'];
abbrpopnamelist = ['Mand.', 'Wolof', 'Jola', 'Fula', 'Akan', 'North.', 'YRI', 'Malawi'];
popcollist = ["rgb(0,0,170)", "rgb(0,120,100)", "rgb(0,100,255)", "rgb(120,0,120)", "rgb(0,150,0)", "rgb(120,120,0)", "rgb(100,100,100)", "rgb(170,0,0)"];
popcollist2 = ["rgb(130,130,230)", "rgb(120,160,120)", "rgb(100,140,255)", "rgb(160,120,160)", "rgb(100,200,100)", "rgb(160,160,100)", "rgb(150,150,150)", "rgb(230,130,130)"];


//Returns a light gray, used as column background for the left column block in the query tables
function returnLightGray() {
    return 'rgb(230,230,230)';
}

//Used to convert p values to text in a table column
function PVal2Text(x) {
    if (x == null)
        return "-";
    else
        return (1.0 * x).toFixed(4);
}

//Used to convert p values to color in a table IHS column
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

//Used to convert p values to color in a table XPEHH column
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

//Converts frequency information to text
function Freq2Text(x) {
    if (x == null)
        return "-";
    else
        return (x).toFixed(3);
}

//Comverts frequency information to color encoding
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

//Converts an IHS or XPEHH statistics value to text
function StatVal2Text(x) {
    if (x == null)
        return "-";
    else
        return x.toFixed(3);
}

//Converts an IHS statistics value to a color
function StatVal2ColorIHS(vl) {
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

//Converts an XPEHH statistics value to a color
function StatVal2ColorXPEHH(vl) {
    if (vl == null)
        return "white";
    else {
        var vl = Math.abs(vl);
        vl = Math.min(1, vl / 4);
        var r = 255 * (1 - 0.3 * vl * vl * vl * vl);
        var g = 255 * (1 - vl * vl);
        var b = 255 * (1 - 0.5 * vl);
        return "rgb(" + parseInt(r) + "," + parseInt(g) + "," + parseInt(b) + ")";
    }
}




$(function () {

    //Global initialisation of utilities
    DQX.Init();

    theserverurl = "http://localhost:8000/app01";


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Build the components
    //////////////////////////////////////////////////////////////////////////////////////////////

    Build_ChromoView();


    Build_SimpleQueryWins();
    elemTableWindowSimple = Build_TableWins('IDTableWinsSimple');
    elemTableWindowSimple.myTable.FindColumn('pos').MakeHyperlink(OnTableClick_WinSimple, '#');
    //Automatically run the default query at start (as set on the page html controls)
    UpdateQueryWinsSimple();


    Build_AdvancedQueryWins();
    elemTableWindowAdvanced = Build_TableWins('IDTableWinsAdvanced');
    elemTableWindowAdvanced.myTable.FindColumn('pos').MakeHyperlink(OnTableClick_WinAdvanced, '#');
    //we start by defining a query that returns nothing
    elemTableWindowAdvanced.myTable.myDataFetcher.SetUserQuery(DQX.SQL.WhereClause.None());
    elemTableWindowAdvanced.myTable.Render();
    //make sure that changing the query builder invalidates the table result
    elemBuilderWindowAdvanced.myBuilder.notifyModified = $.proxy(elemTableWindowAdvanced.myTable.invalidate,elemTableWindowAdvanced.myTable);



    Build_AdvancedQuerySNPs();
    elemTableSNPAdvanced = Build_TableSNPs('IDTableSNPAdvanced');
    elemTableSNPAdvanced.myTable.FindColumn('pos').MakeHyperlink(OnTableClick_SNPAdvanced, '#');
    //we start by defining a query that returns nothing
    elemTableSNPAdvanced.myTable.myDataFetcher.SetUserQuery(DQX.SQL.WhereClause.None());
    elemTableSNPAdvanced.myTable.Render();
    //make sure that changing the query builder invalidates the table result
    elemBuilderSNPAdvanced.myBuilder.notifyModified = $.proxy(elemTableSNPAdvanced.myTable.invalidate, elemTableSNPAdvanced.myTable);

    //Initialisation after creation of the dynamic html
    DQX.initPostCreate();

})