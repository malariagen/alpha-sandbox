﻿
//The one any only namespace global root object
DQX = {};

DQX.timeoutRetry = 10000;
DQX.timeoutAjax = 15000;

//A namespace for drawing helper utilities
DQX.DrawUtil = {};

//A formatter extension for strings
//usage: "Hello {name}".DQXformat({ name: 'World' })
String.prototype.DQXformat = function (args) {
    var newStr = this;
    for (var key in args) {
        newStr = newStr.replace('{' + key + '}', args[key]);
    }
    return newStr;
}


//A helper function that can be called to throw an error if an object does not have a specific member
DQX.assertPresence = function (obj, memb) {
    if (!(memb in obj))
        throw "Expected member '" + memb + "'";
}


DQX.ranseed = 0;

//A random number generator that can be initiated with a predefined seed
DQX.random = function() {
    DQX.ranseed = (DQX.ranseed * 9301 + 49297) % 233280;
    return DQX.ranseed / (233280.0);
}


DQX.parseResponse = function(resp) {
    lst = JSON.parse(resp);
    return lst;
}


DQX._currentProcessingID = null;

//Draws a message on the screen indicating that some processing is being done
DQX.setProcessing = function(msg) {
    DQX._currentProcessingID=DQX.CreateFloatBox(msg, "");
}

//Removes the processing message
DQX.stopProcessing = function () {
    if (DQX._currentProcessingID!=null)
        $("#" + DQX._currentProcessingID).remove();
    DQX._currentProcessingID = null;
}

//Creates a function that reports a failire
DQX.createFailFunction = function(msg) {
    return function () { alert(msg); };
}

//A class that encapsulates the creation of an url with query strings
DQX.Url = function (iname) {
    var that = {};
    that.name = iname;
    that.queryitems = []

    //add a query item to the url
    that.addUrlQueryItem = function (iname, icontent) {
        this.queryitems.push({ name: iname, content: icontent });
    }

    that.toString = function () {
        var rs = this.name;
        if (this.queryitems.length > 0) {
            rs += "?";
            for (var itemnr in this.queryitems) {
                if (itemnr > 0) rs += "&";
                rs += this.queryitems[itemnr].name + "=" + this.queryitems[itemnr].content;
            }
        }
        return rs;
    }

    return that;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////
// An RGB Color helper class
//////////////////////////////////////////////////////////////////////////////////////////////////////

DQX.Color = function (r, g, b, a) {
    var that = {};
    that.r = (typeof r == 'undefined') ? 0 : r;
    that.g = (typeof g == 'undefined') ? 0 : g;
    that.b = (typeof b == 'undefined') ? 0 : b;
    that.a = (typeof a == 'undefined') ? 1 : a;
    that.f = 1.0;

    that.getR = function () { return this.r / this.f; }
    that.getG = function () { return this.g / this.f; }
    that.getB = function () { return this.b / this.f; }
    that.getA = function () { return this.a / this.f; }

    that.toString = function () {
        if (this.a > 0.999)
            return 'rgb(' + Math.round(this.getR() * 255) + ',' + Math.round(this.getG() * 255) + ',' + Math.round(this.getB() * 255) + ')';
        else
            return 'rgb(' + this.getR().toFixed(3) + ',' + this.getG().toFixed(3) + ',' + this.getB().toFixed(3) + ',' + this.getA().toFixed(3) + ')';
    }

    //Returns a darkened version of the color, amount between 0 and 1
    that.darken = function (amount) {
        var fc = 1.0 - amount;
        return DQX.Color(fc * this.r, fc * this.g, fc * this.b, this.a);
    }

    //Returns a lightened version of the color, amount between 0 and 1
    that.lighten = function (amount) {
        var fc = amount;
        return DQX.Color((1-fc) * this.r + fc, (1-fc) * this.g + fc, (1-fc) * this.b + fc, this.a);
    }

    return that;
}

//converts a html color string to a DQX.Color
DQX.parseColorString = function (colorstring, faildefault) {
    var parts = colorstring.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if ((parts) && (parts.length >= 2) && (parts[1].length > 0) && (parts[2].length > 0) && (parts[3].length > 0))
        return DQX.Color(parseFloat(parts[1]) / 255.0, parseFloat(parts[2]) / 255.0, parseFloat(parts[3]) / 255.0);
    if (typeof faildefault != 'undefined')
        return faildefault;
}



//////////////////////////////////////////////////////////////////////////////////////////////////////
// Some helper functions that assist in finding back an object instance using a unique ID
//////////////////////////////////////////////////////////////////////////////////////////////////////

DQX.ObjectMapper = {}
DQX.ObjectMapper.Objects = [];
DQX.ObjectMapper._idx = 0;
DQX.ObjectMapper.Add = function (obj) {
    DQX.ObjectMapper.Objects[DQX.ObjectMapper._idx] = obj;
    obj._MapIdx = DQX.ObjectMapper._idx;
    DQX.ObjectMapper._idx++;
}
DQX.ObjectMapper.get = function (idx) {
    return DQX.ObjectMapper.Objects[idx];
}

//Use this function to generate a html-compatible function call string that calls a function in an object instance
DQX.ObjectMapper.CreateCallBackFunctionString = function (obj, functionname, arg) {
    if (!('_MapIdx' in obj))
        throw "Object was not added to DQX.ObjectMapper";
    var rs = "DQX.ObjectMapper.get(" + obj._MapIdx + ")." + functionname + "(" + arg.toString() + ")";
    return rs;
}



//------------------------------------------------


//Use this to get screen mouse positions at any moment
DQX.mousePosX = 0;
DQX.mousePosY = 0;

DQX._mouseEventReceiverList = [];


/////////////////////////////////////////////////////////////////////////////////////
// The global DQX startup function
/////////////////////////////////////////////////////////////////////////////////////

DQX.Init = function () {

    $.ajaxSetup({
        timeout:DQX.timeoutAjax
    });

    $(document).mouseup(DQX._handleMouseUp);
    $(document).mousemove(DQX._handleMouseMove);
    $(document).mousemove(function (e) {
        DQX.mousePosX = e.pageX; DQX.mousePosY = e.pageY;
    });

    $(document).keydown(DQX._handleKeyDown);
}

//Show a help box corresponding to a help id item in the DOM
DQX.showHelp = function (id) {
    if ($('#' + id).length == 0) throw "Broken help link " + id;
    var helpcontent = $('#' + id).html();
    DQX.CreateFloatBox("Help", helpcontent, "Help");
}



/////////////////////////////////////////////////////////////////////////////////////
//This function should be called *after* the creation of all initial dynamic html
/////////////////////////////////////////////////////////////////////////////////////

DQX.initPostCreate = function () {

    // Initialise functionality for tabbed environments
    $('.DQXTabSet').each(function (idx, tabset) {

        $(tabset).find('.DQXTabContent').css('display', 'none');

        var activeid = 'C' + $(tabset).find('.DQXTabActive').attr('id');
        $(tabset).find('#' + activeid).css('display', 'inherit');

        $(tabset).find('.DQXTab').click(function () {
            $(tabset).find('.DQXTab').removeClass('DQXTabActive');
            $(tabset).find('.DQXTab').addClass('DQXTabInactive');
            $(this).addClass("DQXTabActive");
            $(this).removeClass("DQXTabInactive");

            $(tabset).find('.DQXTabContent').css('display', 'none');
            var content_show = 'C' + $(this).attr("id");
            $(tabset).find("#" + content_show).css('display', 'inherit');

        });

    });


    // Initialise functionality for help buttons
    $('.DQXInfoButton').each(function (idx, tabset) {
        var id = $(this).html();
        $(this).html('<img src="Bitmaps/info.png" alt="info"/>');
        $(this).click(function () { DQX.showHelp(id); return false;  });
    });

    // Fill in the include sections
    $('.DQXInclude').each(function (idx, tabset) {
        var id = $(this).html();
        if ($('#' + id).length == 0) throw "Broken include link " + id;
        $(this).html($('#' + id).html());
    });

}

DQX._keyReceivers = {};

DQX._handleKeyDown = function (ev) {
    for (var id in DQX._keyReceivers)
        if (DQX._keyReceivers[id])
            if (DQX._keyReceivers[id](ev)) {
                return false;
            }
}

DQX.setKeyDownReceiver = function (elemID, fn) {
    var theElem = elemID;
    $('#' + elemID).mouseover(function (ev) {
        DQX._registerKeyReceiver(theElem, fn); 
    });
    $('#' + elemID).mouseout(function (ev) {
        DQX._unregisterKeyReceiver(theElem);
    });
}

DQX._registerKeyReceiver = function(theElem, fn) {
    DQX._keyReceivers[theElem] = fn;
}

DQX._unregisterKeyReceiver = function (theElem) {
    delete DQX._keyReceivers[theElem];
} 



DQX.addMouseEventReceiver = function (obj) {
   this._mouseEventReceiverList.push(obj);
}




DQX._handleMouseUp = function(ev) {
    for (var i in DQX._mouseEventReceiverList) {
        if (DQX._mouseEventReceiverList[i]._mousedown) {
            DQX._mouseEventReceiverList[i]._onMouseUp(ev);
            DQX._mouseEventReceiverList[i]._mousedown = false;
        }
    }
}


DQX._findMouseEventReceiver = function(iCanvasID) {
    for (var i in DQX._mouseEventReceiverList)
        if (DQX._mouseEventReceiverList[i].myCanvasID == iCanvasID)
            return DQX._mouseEventReceiverList[i];
    return null;
}


DQX._lastMouseHoverTarget = null;


DQX._handleMouseMove = function(ev) {
    //first try and see if this is a mousedown event
    for (var i in DQX._mouseEventReceiverList) {
        if (DQX._mouseEventReceiverList[i]._mousedown) {
            DQX._mouseEventReceiverList[i]._onMouseMove(ev);
            return;
        }
    }
    //if not, handle as a mouse hover event
    var thetarget = DQX._findMouseEventReceiver(ev.target.id);
    if (thetarget != null) {
        thetarget._onMouseHover(ev);
        DQX._lastMouseHoverTarget = thetarget;
    }
    else {
        if (DQX._lastMouseHoverTarget != null)
            DQX._lastMouseHoverTarget.onLeaveMouse(ev);
        DQX._lastMouseHoverTarget = null;
    }
}



//////////////////////////////////////////////////////////////////////////////////
// This provides a base class for classes that encapsulate a canvas element
// It provides some basic functionality
//////////////////////////////////////////////////////////////////////////////////

DQX.myCanvasElement = function (iCanvasID) {
    var that = {};
    that.myCanvasID = iCanvasID;
    that.myCanvasElement = $("#" + iCanvasID + "")[0];

    //Call this function to register the required handlers for this element
    that.registerHandlers = function (el) {
        DQX.addMouseEventReceiver(this);
        $(el).mousedown($.proxy(this._handleOnMouseDown, this));
    }

    that._handleOnMouseDown = function (ev) {
        this._mousedown = true;
        this._onMouseDown(ev);
        ev.returnValue = false;
        return false;

    }

    //From an event with position information, returns the X position relative to the canvas
    that.getEventPosX = function (ev) {
        return ev.pageX - $(this.myCanvasElement).offset().left;
    }

    //From an event with position information, returns the Y position relative to the canvas
    that.getEventPosY = function (ev) {
        return ev.pageY - $(this.myCanvasElement).offset().top;
    }

    that._onMouseHover = function (ev) { } //you can override this
    that.onLeaveMouse = function (ev) { } //you can override this
    that._onMouseDown = function (ev) { } //Called when the mouse is pressed down (you can override this)
    that._onMouseUp = function (ev) { } //Called when the mouse is released (you can override this)
    that._onMouseMove = function (ev) { } //Called when the mouse is moved *while pressed down* (you can override this)

    return that;
}



//////////////////////////////////////////////////////////////////////////////////




// Produces a minor/major scale tick set that matches the desired minor jump distance as close as possible
DQX.DrawUtil.getScaleJump = function(DesiredJump1) {
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

//Draws a tooltip in a canvas drawing context
DQX.DrawUtil.DrawChannelToolTip = function(context, _toolTipInfo) {
    var xp = _toolTipInfo.xp + 0.5;
    var yp = _toolTipInfo.yp + 1 + 0.5;

    //Determine x size
    context.font = 'bold 12px sans-serif';
    context.textBaseline = 'top';
    context.textAlign = 'left';
    var xlen = 10;
    for (var linenr in _toolTipInfo.lines)
        xlen = Math.max(xlen, context.measureText(_toolTipInfo.lines[linenr].Text).width);
    xlen += 2;
    var ylen = _toolTipInfo.lines.length * 16 + 6;

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



    for (var linenr in _toolTipInfo.lines) {
        var line = _toolTipInfo.lines[linenr];
        context.fillStyle = line.Color;
        context.fillText(line.Text, xp - 3, yp + dff + 3 + linenr * 16);
    }
    context.globalAlpha = 1.0;
}



////////////////////////////////////////////////////////////////////////////////////
// Some html write helper utilities
////////////////////////////////////////////////////////////////////////////////////


DQX.CreateKeyValueTable = function(data) {
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


DQX.HtmlWriteKeyValuePair = function(KeyName, Content) {
    return "<b>" + KeyName + "</b>= " + Content;
}


////////////////////////////////////////////////////////////////////////////////////
// Some stuff that allows one to create a draggable floating box
////////////////////////////////////////////////////////////////////////////////////


DQX.CloseFloatBox = function(index) {
    $("#" + index).remove();
}

DQX._tabIndex = 0;


DQX.CreateFloatBox = function (iTitle, iBody, iClassExtension) {

    if (typeof iClassExtension == 'undefined') iClassExtension = '';

    if ($('#DQXFloatBoxHolder').length == 0)
        throw "Document should have a div DQXFloatBoxHolder";

    //we create the float box close to the current cursor
    var posx = DQX.mousePosX + 10;
    var posy = DQX.mousePosY + 10;

    posx = Math.min(posx, $(window).width()-400);
    posy = Math.min(posy, $(window).height() - 100);


    DQX._tabIndex++;
    var ID = "DQXFlt" + DQX._tabIndex;
    var thebox = DQX.DocEl.Div({ id: ID });
    thebox.setCssClass("DQXFloatBox" + (iClassExtension.length > 0 ? (" DQXFloatBox" + iClassExtension) : ""));
    thebox.addStyle("position", "absolute");
    thebox.addStyle("left", posx + 'px');
    thebox.addStyle("top", posy + 'px');

    var theheader = DQX.DocEl.Div({ id: ID + 'Handler', parent: thebox });
    theheader.setCssClass("DQXFloatBoxHeader" + (iClassExtension.length > 0 ? (" DQXFloatBoxHeader" + iClassExtension) : ""));
    theheader.addElem(iTitle);

    var thebody = DQX.DocEl.Div({ parent: thebox });
    thebody.setCssClass("DQXFloatBoxContent" + (iClassExtension.length > 0 ? (" DQXFloatBoxContent" + iClassExtension) : ""));
    thebody.addElem(iBody);

    var thecloser = DQX.DocEl.JavaScriptBitmaplink("Bitmaps/close.png", "Close", "DQX.CloseFloatBox('" + ID + "')");
    thebox.addElem(thecloser);
    thecloser.addStyle('position', 'absolute');
    thecloser.addStyle('left', '-10px');
    thecloser.addStyle('top', '-10px');


    //    content += '<a href="#" style="font-size:11pt" onclick=DQX.CloseFloatBox("' + ID + '")>[X]</a> '
    /*    content += '<div class="content">';
    content += Body;
    content += "</div>";
    content += "</div>";*/
    var content = thebox.toString();
    $('#DQXFloatBoxHolder').append(content);
    MakeDrag(ID);
    return ID;
}



