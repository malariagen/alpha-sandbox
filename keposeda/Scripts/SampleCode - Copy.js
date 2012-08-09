

function Report(st) {
    $("#Report").html(st);
}

function OnClickItem(ev) {
    $(ev.currentTarget).css("background-color", "blue");
    var result = "";
    result += "ID=" + $(ev.currentTarget).attr("id");
    result += " X="+ev.clientX.toString();
    result += " Y="+ev.clientY.toString();
    //Report(result);
}

var offset = 0;
var zoomf = 1.0;
var dragstartoffset = 0;
var dragstartx=0;

function DrawCanvas() {
    var SizeX = 800;
    var SizeY = 500;
    var CanvasElement = $("#cnv")[0];
    var context = CanvasElement.getContext("2d");

    var lingrad = context.createLinearGradient(0, 0, 0, SizeY);
    lingrad.addColorStop(0, "rgb(245,250,245)");
    lingrad.addColorStop(1, "rgb(190,190,190)");

    //context.fillStyle = "#FFFFBB";
    context.fillStyle = lingrad;
    context.fillRect(0,0,SizeX,SizeY);

    context.beginPath();
    for (i2 = 0; i2 < SizeX * 2; i2++) {
        var i = i2 / 2;
        var x=(i+offset)/6*zoomf;
        var y=Math.sin(x)+Math.sin(x*x/150);
        var py=300-80*y
        if (i==0)
            context.moveTo(i,py);
        else
            context.lineTo(i,py);
    }
    context.strokeStyle = "blue"
    context.stroke();

    context.beginPath();
    for (i2 = 0; i2 < SizeX * 2; i2++) {
        var i = i2 / 2;
        var x = (i + offset) / 6 * zoomf;
        var y = Math.cos(1.2*x) + Math.sin(10/(1+x*x));
        var py = 300 - 80 * y
        if (i == 0)
            context.moveTo(i, py);
        else
            context.lineTo(i, py);
    }
    context.strokeStyle = "red"
    context.stroke();


//    context.beginPath();
//    context.arc(50, 50, 15, 0, 2 * Math.PI, true);
//    context.fillStyle = "red";
//    context.fill();
}

var dragging = false;

function OnCanvasMouseDown(ev) {
    var CanvasElement = $("#cnv")[0];

    var OffsetX = $(CanvasElement).offset().left;
    var OffsetY = $(CanvasElement).offset().top;
    var PosX = ev.pageX - OffsetX;
    var PosY = ev.pageY - OffsetY;
    var result = "";
    result += " X=" + PosX;
    result += " Y=" + PosY;
    //Report(result);
    dragging = true;
    dragstartoffset=offset;
    dragstartx=PosX;
}


function OnDocMouseMove(ev) {
    if (dragging) {
        var CanvasElement = $("#cnv")[0];
        var OffsetX = $(CanvasElement).offset().left;
        var OffsetY = $(CanvasElement).offset().top;
        var PosX = ev.pageX - OffsetX;
        var PosY = ev.pageY - OffsetY;
        offset = dragstartoffset - (PosX - dragstartx);
        DrawCanvas();
    }
}


function OnDocMouseUp(ev) {
    if (dragging) {
        var CanvasElement = $("#cnv")[0];
        var OffsetX = $(CanvasElement).offset().left;
        var OffsetY = $(CanvasElement).offset().top;
        var PosX = ev.pageX - OffsetX;
        var PosY = ev.pageY - OffsetY;
        var result = "";
        result += " X=" + PosX;
        result += " Y=" + PosY;
        //Report(result);
        dragging = false;
    }
}

function OnCanvasMouseWheel(ev) {

    var CanvasElement = $("#cnv")[0];
    var OffsetX = $(CanvasElement).offset().left;
    var OffsetY = $(CanvasElement).offset().top;
    var PosX = ev.pageX - OffsetX;
    var PosY = ev.pageY - OffsetY;
    //Report(PosX);

    var dff = 1.2;
    var delta = ev.detail < 0 || ev.wheelDelta > 0 ? 1 : -1;
    if (delta < 0) {
        offset = offset / dff - PosX * (dff - 1) /dff;
        zoomf *= dff;
    }
    else {
        offset = offset * dff + PosX * (dff-1);
        zoomf /= dff;
    }
     DrawCanvas();
}



function ChannelPlotter(iCanvasID) {
    this.CanvasID = iCanvasID;
    this.CanvasElement = $("#" + iCanvasID + "")[0];
    this.SizeX = canvas.width;
}


$(function () {


    $("div.item1").css("background-color", "yellow");

    $("div.item").click(OnClickItem);

    $(document).mouseup(OnDocMouseUp);
    $(document).mousemove(OnDocMouseMove);
    $("#cnv").mousedown(OnCanvasMouseDown);


    $("#cnv").bind('DOMMouseScroll mousewheel', OnCanvasMouseWheel); //"mousewheel" ?


    DrawCanvas();
});