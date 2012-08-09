

ranseed = 0;
function random() {
    ranseed = (ranseed * 9301 + 49297) % 233280;
    return ranseed / (233280.0);
}


function DQXParseResponse(resp) {
    lst = JSON.parse(resp);
    return lst;
}


DQXCurrentProcessingID = null;
function DQXSetProcessing(msg) {
    DQXCurrentProcessingID=DQXCreateFloatBox(msg, "");
}

function DQXStopProcessing() {
    if (DQXCurrentProcessingID!=null)
        $("#" + DQXCurrentProcessingID).remove();
    DQXCurrentProcessingID = null;
}


function DQXCreateFailFunction(msg) {
    return function () { alert(msg); };
}

//------------------------------------------------


//Use this to get screen mouse positions at any moment
var DQXMousePosX = 0;
var DQXMousePosY = 0;



function DQXGeneral() {

    this.MouseEventReceiverList = [];

    this.Init = function () {
        $(document).mouseup(DQXHandleMouseUp);
        $(document).mousemove(DQXHandleMouseMove);
        $(document).mousemove(function (e) {
            DQXMousePosX = e.pageX; DQXMousePosY = e.pageY;
        });
    }

    this.AddMouseEventReceiver = function (obj) {
        this.MouseEventReceiverList.push(obj);
    }

}

DQX = new DQXGeneral();



function DQXHandleMouseUp(ev) {
    for (var i in DQX.MouseEventReceiverList) {
        if (DQX.MouseEventReceiverList[i]._mousedown) {
            DQX.MouseEventReceiverList[i].OnMouseUp(ev);
            DQX.MouseEventReceiverList[i]._mousedown = false;
        }
    }
}

function DQXHandleMouseMove(ev) {
    for (var i in DQX.MouseEventReceiverList) {
        if (DQX.MouseEventReceiverList[i]._mousedown) {
            DQX.MouseEventReceiverList[i].OnMouseMove(ev);
            return;
        }
    }
}



//////////////////////////////////////////////////////////////////////////////////
// This provides a base class for classes that encapsulate a canvas element
// It provides some basic functionality
//////////////////////////////////////////////////////////////////////////////////

function DQXCanvasElement() {

    this.RegisterHandlers = function (el) {
        DQX.AddMouseEventReceiver(this);
        $(el).mousedown($.proxy(this._OnMouseDown, this));
    }

    this._OnMouseDown = function (ev) {
        this._mousedown = true;
        this.OnMouseDown(ev);
        ev.returnValue = false;
        return false;

    }

    this.GetEventPosX = function (ev) {
        return ev.pageX - $(this.CanvasCenterElement).offset().left; //!!!todo: modify this so that 'CanvasCenterElement' does not appear!
    }

    this.GetEventPosY = function (ev) {
        return ev.pageY - $(this.CanvasCenterElement).offset().top; //!!!todo: modify this so that 'CanvasCenterElement' does not appear!
    }
}



//////////////////////////////////////////////////////////////////////////////////




// Produces a minor/major scale tick set that matches the desired minor jump distance as close as possible
function GetScaleJump(DesiredJump1) {
    var JumpPrototypes = [{ Jump1: 1, JumpReduc: 5 }, { Jump1: 2, JumpReduc: 5 }, { Jump1: 5, JumpReduc: 4}];
    var mindist = 1.0e99;
    var bestjump;
    for (JumpPrototypeNr in JumpPrototypes) {
        q = Math.floor(Math.log(DesiredJump1 / JumpPrototypes[JumpPrototypeNr].Jump1) / Math.log(10));
        var TryJump1A = Math.pow(10, q) * JumpPrototypes[JumpPrototypeNr].Jump1;
        var TryJump1B = Math.pow(10, q + 1) * JumpPrototypes[JumpPrototypeNr].Jump1;
        if (Math.abs(TryJump1A - DesiredJump1) < mindist) {
            mindist = Math.abs(TryJump1A - DesiredJump1);
            bestjump = { Jump1: TryJump1A, JumpReduc: JumpPrototypes[JumpPrototypeNr].JumpReduc };
        }
        if (Math.abs(TryJump1B - DesiredJump1) < mindist) {
            mindist = Math.abs(TryJump1B - DesiredJump1);
            bestjump = { Jump1: TryJump1B, JumpReduc: JumpPrototypes[JumpPrototypeNr].JumpReduc };
        }
    }
    return bestjump;
}


function DrawChannelToolTip(context, ToolTipInfo) {
    var xp = ToolTipInfo.xp + 0.5;
    var yp = ToolTipInfo.yp + 1 + 0.5;

    //Determine x size
    context.font = 'bold 12px sans-serif';
    context.textBaseline = 'top';
    context.textAlign = 'left';
    var xlen = 10;
    for (var linenr in ToolTipInfo.lines)
        xlen = Math.max(xlen, context.measureText(ToolTipInfo.lines[linenr].Text).width);
    xlen += 2;
    var ylen = ToolTipInfo.lines.length * 16 + 6;

    var dff = 20;
    context.globalAlpha = 1;
    var backgrad = context.createLinearGradient(0, yp, 0, yp + ylen + dff);
    backgrad.addColorStop(0, "rgb(255,255,160)");
    backgrad.addColorStop(1, "rgb(255,190,80)");

    context.fillStyle = backgrad;

    context.strokeStyle = "rgb(0,0,0)";
    
    context.beginPath();
    context.moveTo(xp, yp);
    context.lineTo(xp + dff / 2, yp + dff);
    context.lineTo(xp + xlen, yp + dff);
    context.lineTo(xp + xlen, yp + dff + ylen);
    context.lineTo(xp - dff / 2, yp + dff + ylen);
    context.lineTo(xp - dff / 2, yp + dff);
    context.closePath();
    context.shadowColor = "black";
    context.shadowBlur = 10;
    context.fill();
    context.stroke();
    context.shadowColor = "transparent";



    for (var linenr in ToolTipInfo.lines) {
        var line = ToolTipInfo.lines[linenr];
        context.fillStyle = line.Color;
        context.fillText(line.Text, xp - 3, yp + dff + 3 + linenr * 16);
    }
    context.globalAlpha = 1.0;
}

////////////////////////////////////////////////////////////////////////////////////
// Some html write helper utilities
////////////////////////////////////////////////////////////////////////////////////


function DQXCreateKeyValueTable(data) {
    var resp = "<table>";
    for (key in data) {
        resp += "<tr>";
        resp += "<td>" + key + "</td>";
        resp += "<td>" + data[key] + "</td>";
        resp += "</tr>";
    }
    resp += "</table>"
    return resp;
}


function DQXHtmlWriteKeyValuePair(KeyName, Content) {
    return "<b>" + KeyName + "</b>= " + Content;
}


////////////////////////////////////////////////////////////////////////////////////
// Some stuff that allows one to create a draggable floating box
////////////////////////////////////////////////////////////////////////////////////


function DQXCloseFloatBox(index) {
    $("#" + index).remove();
}

var DQXTabIndex = 0;


function DQXCreateFloatBox(Title, Body) {

    if ($('#DQXFloatBoxHolder').length == 0)
        throw "Document should have a div DQXFloatBoxHolder";

    //we create the float box close to the current cursor
    var posx = DQXMousePosX + 10;
    var posy = DQXMousePosY + 10;


    DQXTabIndex++;
    var ID = "DQXFlt" + DQXTabIndex;
    var content = '<div id="' + ID + '" class="FloatBox" style="position:absolute;left:' + posx + 'px; top:' + posy + 'px;">';
    content += '<h2 id="' + ID + 'Handler" class="handler"> '
    content += '<a href="#" style="font-size:11pt" onclick=DQXCloseFloatBox("' + ID + '")>[X]</a> '
    content += Title;
    content += '</h2>';
    content += '<div class="content">';
    content += Body;
    content += "</div>";
    content += "</div>";
    $('#DQXFloatBoxHolder').append(content);
    MakeDrag(ID);
    return ID;
}
