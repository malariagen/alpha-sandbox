
//             [------------------------- GAMBIA -----------------------------]                 [---------- Ghana -------------]           [-----]              [-------]
popnamelist = ['Mandinka', 'Wolof', 'Jola', 'Fula', 'Akan', 'Northerner', 'YRI', 'Malawi'];
abbrpopnamelist = ['Mand.', 'Wolof', 'Jola', 'Fula', 'Akan', 'North.', 'YRI', 'Malawi'];
popcollist = ["rgb(0,0,170)", "rgb(0,120,100)", "rgb(0,100,255)", "rgb(120,0,120)", "rgb(0,150,0)", "rgb(120,120,0)", "rgb(100,100,100)", "rgb(170,0,0)"];
popcollist2 = ["rgb(130,130,230)", "rgb(120,160,120)", "rgb(100,140,255)", "rgb(160,120,160)", "rgb(100,200,100)", "rgb(160,160,100)", "rgb(150,150,150)", "rgb(230,130,130)"];







function isCanvasSupported() {
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
}



$(function () {


    if (!isCanvasSupported()) {
        var msg="This browser does not support HTML 5. In order to be able to run this web application, you need a more recent browser.";
        msg += "For example, you can download and install <a href='https://www.google.com/intl/en/chrome/browser/'>Chrome</a> or <a href='http://www.mozilla.org/en-US/firefox/new/'>FireFox</a>.";
        $(document.body).html(msg);
        return;
    }

    //Global initialisation of utilities
    DQX.Init();

    theserverurl = "/sandbox/keposeda/app";

    InitKeposedaPlot();

    InitKeposedaTable();
});

