﻿popnamelist = ['Mandinka', 'Wolof', 'Jola', 'Fula', 'Akan', 'Northerner', 'YRI', 'Malawi'];
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


function isCanvasSupported() {
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
}



$(function () {

    //Global initialisation of utilities
    DQX.Init();

    //theserverurl = "http://localhost:8000/app01";
    theserverurl = "/sandbox/keposeda/app";


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Build the components
    //////////////////////////////////////////////////////////////////////////////////////////////

    if (isCanvasSupported())
        Build_ChromoView();
    else {
        var rs = "<h3>Web browser compatibility problem</h3>";
        rs += '<div class="DQXDarkFrameHighlight">';
        rs += "The chromosome viewer relies on functionality that is not supported by this web browser. In order to be able to use this application, you can download an up-to-date, free web browser such as ";
        rs += "<a href='https://www.google.com/intl/en/chrome/browser/'>Chrome</a> or <a href='http://www.mozilla.org/en-US/firefox/new/'>FireFox</a>";
        rs += '</div>';
        $('#BrowserContainer').html(rs);
    }

    Build_SimpleQueryWins();

    elemTableWindowSimple = Build_TableWins('IDTableWinsSimple');
    elemTableWindowSimple.myTable.findColumn('pos').MakeHyperlink(OnTableClick_WinSimple, "javascript:void(0)");
    //Automatically run the default query at start (as set on the page html controls)
    UpdateQueryWinsSimple();


    Build_AdvancedQueryWins();

    elemTableWindowAdvanced = Build_TableWins('IDTableWinsAdvanced');
    elemTableWindowAdvanced.myTable.findColumn('pos').MakeHyperlink(OnTableClick_WinAdvanced, "javascript:void(0)");
    //we start by defining a query that returns nothing
    elemTableWindowAdvanced.myTable.myDataFetcher.setUserQuery(DQX.SQL.WhereClause.None());
    elemTableWindowAdvanced.myTable.render();
    //make sure that changing the query builder invalidates the table result
    elemBuilderWindowAdvanced.myBuilder.notifyModified = $.proxy(elemTableWindowAdvanced.myTable.invalidate, elemTableWindowAdvanced.myTable);



    Build_AdvancedQuerySNPs();

    elemTableSNPAdvanced = Build_TableSNPs('IDTableSNPAdvanced');
    elemTableSNPAdvanced.myTable.findColumn('pos').MakeHyperlink(OnTableClick_SNPAdvanced, "javascript:void(0)");
    //we start by defining a query that returns nothing
    elemTableSNPAdvanced.myTable.myDataFetcher.setUserQuery(DQX.SQL.WhereClause.None());
    elemTableSNPAdvanced.myTable.render();
    //make sure that changing the query builder invalidates the table result
    elemBuilderSNPAdvanced.myBuilder.notifyModified = $.proxy(elemTableSNPAdvanced.myTable.invalidate, elemTableSNPAdvanced.myTable);

    //Initialisation after creation of the dynamic html
    DQX.initPostCreate();

})