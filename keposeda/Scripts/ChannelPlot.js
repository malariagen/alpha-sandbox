






/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
// ChannelPlotter Class: implements a channel view
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

//This list maintains a global list of all channelplots, used by some functions (although a jQuery proxy closure might avoid this)
var DQXChannelPlotList = [];

//Returns a channelplot by its center canvas id, or return null if not found
function GetChannelPlot(iCanvasCenterID) {
    for (var i in DQXChannelPlotList)
        if (DQXChannelPlotList[i].CanvasBaseID + "Center" == iCanvasCenterID)
            return DQXChannelPlotList[i];
    return null;
}

function HandleChannelPlotCanvasMouseDown(ev) {
    var theplot = GetChannelPlot(ev.target.id);
    theplot._mousedown = true;
    theplot.OnMouseDown(ev);
    ev.returnValue = false;
    return false;
}

function HandleChannelPlotDocMouseUp(ev) {
    for (var i in DQXChannelPlotList)
        if (DQXChannelPlotList[i]._mousedown) {
            DQXChannelPlotList[i].OnMouseUp(ev);
            DQXChannelPlotList[i]._mousedown = false;
        }
    }

    LastMouseHoverChannelPlot = null;

function HandleChannelPlotDocMouseMove(ev) {
    //first try and see if this is a mousedown event for a plot
    for (i in DQXChannelPlotList)
        if (DQXChannelPlotList[i]._mousedown) {
            DQXChannelPlotList[i].OnMouseMove(ev);
            return;
        }
    //if not, handle as a mouse hover event
    var theplot = GetChannelPlot(ev.target.id);
    if (theplot != null) {
        theplot.OnMouseHover(ev);
        LastMouseHoverChannelPlot = theplot;
        }
    else {
        if (LastMouseHoverChannelPlot != null)
            LastMouseHoverChannelPlot.OnLeaveMouse(ev);
        LastMouseHoverChannelPlot = null;
    }
}



function ChannelPlotter(iCanvasBaseID) {

    //add myself to the global list
    DQXChannelPlotList.push(this);

    //get the canvas element info
    this.CanvasBaseID = iCanvasBaseID;
    this.CanvasCenterElement = $("#" + iCanvasBaseID + "Center")[0];
    this.SizeX = this.CanvasCenterElement.width;
    this.SizeY = this.CanvasCenterElement.height;

    this.FullRangeMin = -0.25E6; //start point of the full x range
    this.FullRangeMax = 250.0E6; //end point of the full x range

    this.CanvasLeftElement = $("#" + iCanvasBaseID + "Left")[0];
    this.LeftSizeX = this.CanvasLeftElement.width;

    //some internal stuff
    this.OffsetX = 0
    this.BaseZoomFactX = 1.0 / 50000.0;
    this.MaxZoomFactX = 1.0 / 30.0;
    this.ZoomFactX = this.BaseZoomFactX;
    this._mousedown = false;
    this.dragstartoffset = 0;
    this.dragstartx = 0;
    this.myHScroller = null;

    this.mousemarking = false;
    this.markpresent = false;

    //Maintains a list of all ChannelPlotChannel-derived objects that define the different channels in this plot
    this.myChannels = [];

    //Maintains a list of all CurveDataFetcher objects used to create this plot
    this.myDataFetchers = [];


    //register event handlers
    $(this.CanvasCenterElement).mousedown(HandleChannelPlotCanvasMouseDown);
    $(document).mouseup(HandleChannelPlotDocMouseUp);
    $(document).mousemove(HandleChannelPlotDocMouseMove);
    //$(this.CanvasCenterElement).bind('DOMMouseScroll mousewheel', HandleChannelPlotCanvasMouseWheel);
    $(this.CanvasCenterElement).bind('DOMMouseScroll mousewheel', $.proxy(this.OnMouseWheel, this));
}


ChannelPlotter.prototype.GetElement = function (extension) {
    var id = "#" + this.CanvasBaseID + extension;
    var rs = $(id);
    if (rs.length == 0)
        throw "Missing plotter element " + id;
    return rs;
}


//Add a new CurveDataFetcher object to the plot
ChannelPlotter.prototype.AddDataFetcher = function (idatafetcher) {
    this.myDataFetchers.push(idatafetcher);
    idatafetcher.Container = this;

}

//Add a new ChannelPlotChannel-derived object to the plot
ChannelPlotter.prototype.AddChannel = function (ichannel) {
    this.myChannels.push(ichannel);
}

//Internal: this function is called by e.g. CurveDataFetcher class to notify that new data is ready and the plot should be redrawn
ChannelPlotter.prototype.NotifyDataReady = function () {
    this.Draw();
}

//Use this function to resize the plot to new dimensions
ChannelPlotter.prototype.Resize = function (newsizex, newsizey) {
    this.SizeX = newsizex;
    this.SizeY = newsizey;
    this.CanvasCenterElement.width = newsizex;
    this.CanvasCenterElement.height = newsizey;
    this.CanvasLeftElement.height = newsizey;
    this.Draw();
}

//Invalidate all the data downloaded by the plot, forcing a reload upon the next drawing
ChannelPlotter.prototype.ClearData = function () {
    for (var i = 0; i < this.myDataFetchers.length; i++)
        this.myDataFetchers[i].ClearData();
}

//Returns the position X coordinate of an event, relative to the center canvas element
ChannelPlotter.prototype.GetEventPosX = function (ev) {
    return ev.pageX - $(this.CanvasCenterElement).offset().left;
}

//Returns the position Y coordinate of an event, relative to the center canvas element
ChannelPlotter.prototype.GetEventPosY = function (ev) {
    return ev.pageY - $(this.CanvasCenterElement).offset().top;
}

ChannelPlotter.prototype.PosXCanvas2Screen = function (px) {
    return px + $(this.CanvasCenterElement).offset().left;
}

ChannelPlotter.prototype.PosYCanvas2Screen = function (py) {
    return py + $(this.CanvasCenterElement).offset().top;
}


////////////////////// Main drawing function ////////////////////////////////////

/*
X position conversion:
X_screen = X_logical * DrawInfo.ZoomFactX - DrawInfo.OffsetX
*/

ChannelPlotter.prototype.Draw = function () {
    var centercontext = this.CanvasCenterElement.getContext("2d");
    var leftcontext = this.CanvasLeftElement.getContext("2d");

    var sepsize = 2; //separator size between each channel

    //first, calculate the accumulated size of all the fixed channels
    var totalfixedsize = sepsize;
    var flexchannelcount = 0;
    for (channelnr in this.myChannels) {
        if (this.myChannels[channelnr].FixedSizeY > 0)
            totalfixedsize += this.myChannels[channelnr].FixedSizeY;
        else
            flexchannelcount++;
        totalfixedsize += sepsize;
    }

    var ypos = this.SizeY;
    var ysize;
    var drawinfo = new Object;
    drawinfo.CenterContext = centercontext;
    drawinfo.OffsetX = this.OffsetX;
    drawinfo.ZoomFactX = this.ZoomFactX;
    drawinfo.SizeX = this.SizeX;
    drawinfo.LeftContext = leftcontext;
    drawinfo.LeftSizeX = this.LeftSizeX;
    drawinfo.HorAxisScaleJumps = GetScaleJump(20 / drawinfo.ZoomFactX);
    drawinfo.MarkPresent = this.markpresent;
    drawinfo.MarkPos1 = Math.min(this.MarkPos1, this.MarkPos2);
    drawinfo.MarkPos2 = Math.max(this.MarkPos1, this.MarkPos2);
    drawinfo.Plotter = this;

    for (var channelnr in this.myChannels) {

        //draw separator
        ypos -= sepsize;
        centercontext.fillStyle = "rgb(128,128,128)";
        centercontext.fillRect(0, ypos, this.SizeX, sepsize);
        leftcontext.fillStyle = "rgb(128,128,128)";
        leftcontext.fillRect(0, ypos, this.LeftSizeX, sepsize);

        //draw background
        ysize = this.myChannels[channelnr].FixedSizeY;
        if (ysize < 0)
            ysize = Math.round((this.SizeY - totalfixedsize) / flexchannelcount);
        //center
        var backgrad = centercontext.createLinearGradient(0, ypos - ysize, 0, ypos);
        backgrad.addColorStop(0, "rgb(255,255,255)");
        backgrad.addColorStop(1, "rgb(210,210,210)");
        centercontext.fillStyle = backgrad;
        centercontext.fillRect(0, ypos - ysize, this.SizeX, ysize);
        //left
        backgrad = centercontext.createLinearGradient(0, ypos - ysize, 0, ypos);
        backgrad.addColorStop(0, "rgb(230,230,230)");
        backgrad.addColorStop(1, "rgb(180,180,180)");
        leftcontext.fillStyle = backgrad;
        leftcontext.fillRect(0, ypos - ysize, this.LeftSizeX, ysize);

        this.myChannels[channelnr].PosY = ypos;
        this.myChannels[channelnr].SizeY = ysize;
        drawinfo.PosY = ypos;
        drawinfo.SizeY = ysize;

        //scale
        drawinfo.CenterContext.strokeStyle = "black";
        var i1 = Math.round(((-50 + drawinfo.OffsetX) / drawinfo.ZoomFactX) / drawinfo.HorAxisScaleJumps.Jump1);
        if (i1 < 0) i1 = 0;
        var i2 = Math.round(((drawinfo.SizeX + 50 + drawinfo.OffsetX) / drawinfo.ZoomFactX) / drawinfo.HorAxisScaleJumps.Jump1);
        for (i = i1; i <= i2; i++) {
            var value = i * drawinfo.HorAxisScaleJumps.Jump1;
            var psx = Math.round((value) * drawinfo.ZoomFactX - drawinfo.OffsetX) + 0.5;
            if ((psx >= -50) && (psx <= drawinfo.SizeX + 50)) {
                drawinfo.CenterContext.globalAlpha = 0.075;
                if (i % drawinfo.HorAxisScaleJumps.JumpReduc == 0)
                    drawinfo.CenterContext.globalAlpha = 0.2;
                drawinfo.CenterContext.beginPath();
                drawinfo.CenterContext.moveTo(psx, drawinfo.PosY - drawinfo.SizeY);
                drawinfo.CenterContext.lineTo(psx, drawinfo.PosY);
                drawinfo.CenterContext.stroke();
            }
        }
        drawinfo.CenterContext.globalAlpha = 1;

        this.myChannels[channelnr].Draw(drawinfo);

        ypos -= ysize;
    }
    centercontext.fillStyle = "rgb(128,128,128)";
    centercontext.fillRect(0, 0, this.SizeX, ypos);
    leftcontext.fillStyle = "rgb(128,128,128)";
    leftcontext.fillRect(0, 0, this.LeftSizeX, ypos);

    if (this.MarkPresent) {
        var psx1 = Math.round((this.MarkPos1) * drawinfo.ZoomFactX - drawinfo.OffsetX)-1;
        var psx2 = Math.round((this.MarkPos2) * drawinfo.ZoomFactX - drawinfo.OffsetX)+1;
        centercontext.globalAlpha = 0.15;
        centercontext.fillStyle = "rgb(255,0,0)";
        centercontext.fillRect(psx1, 0, psx2 - psx1, this.SizeY);
        centercontext.globalAlpha = 1;
    }

    if (this.ToolTipInfo != null) {
        DrawChannelToolTip(centercontext,this.ToolTipInfo);
    }
}

//Converts canvas screen X coordinate to logical X coordinate
ChannelPlotter.prototype.ScreenPos2XVal = function (ScreenPosX) {
    return (ScreenPosX + this.OffsetX) / this.ZoomFactX;
}

ChannelPlotter.prototype.SetMark = function (pos1, pos2) {
    this.MarkPresent = true;
    this.MarkPos1 = pos1;
    this.MarkPos2 = pos2;
    this.Draw();
}


ChannelPlotter.prototype.UpdateHScroller = function () {
    if (this.myHScroller == null) return;
    var ps1 = (this.ScreenPos2XVal(0) - this.FullRangeMin) / (this.FullRangeMax - this.FullRangeMin);
    var ps2 = (this.ScreenPos2XVal(this.SizeX) - this.FullRangeMin) / (this.FullRangeMax - this.FullRangeMin);
    this.myHScroller.SetRange(this.FullRangeMin/1.0e6,this.FullRangeMax/1.0e6);
    this.myHScroller.SetValue(ps1, ps2 - ps1);
}


ChannelPlotter.prototype.SetPosition = function (centerpos, width) {
    this.ZoomFactX = this.SizeX / width;
    this.OffsetX = (centerpos-0.5*width) * this.ZoomFactX;
    this.Draw();
    this.UpdateHScroller();
}


ChannelPlotter.prototype.PairWithHScroller = function (imyHScroller) {
    this.myHScroller = imyHScroller;
    this.myHScroller.myConsumer = this;
    this.UpdateHScroller();
}

ChannelPlotter.prototype.ScrollTo = function(fraction) {
    var psx=this.FullRangeMin+fraction*(this.FullRangeMax - this.FullRangeMin);
    this.OffsetX = psx * this.ZoomFactX;
    this.Draw();
}

ChannelPlotter.prototype.ZoomScrollTo = function (ScrollPosFraction, ScrollSizeFraction) {

    this.ZoomFactX = this.SizeX / ((this.FullRangeMax - this.FullRangeMin) * ScrollSizeFraction);
    var psx = this.FullRangeMin + ScrollPosFraction * (this.FullRangeMax - this.FullRangeMin);
    this.OffsetX = psx * this.ZoomFactX;
    this.Draw();
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Various handlers
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

ChannelPlotter.prototype.ClipViewRange = function (ev) {
    //var winsize = this.SizeX / this.ZoomFactX;
    this.ZoomFactX = Math.max(this.ZoomFactX, this.SizeX / (this.FullRangeMax - this.FullRangeMin));
    this.OffsetX = Math.min(this.FullRangeMax * this.ZoomFactX - this.SizeX, this.OffsetX);
    this.OffsetX = Math.max(this.FullRangeMin * this.ZoomFactX, this.OffsetX);
}


ChannelPlotter.prototype.OnMouseDown = function (ev) {

    this.MousePressX0 = this.GetEventPosX(ev);
    this.MousePressY0 = this.GetEventPosY(ev);
    this.HasMouseMoved = false;
    this.dragging = false;
    this.mousemarking = false;
    if (!ev.ctrlKey) {
        this.dragging = true;
        this.dragstartoffset = this.OffsetX;
        this.dragstartx = this.GetEventPosX(ev);
    }
    else {
        this.mousemarking = true;
        this.MarkPresent = true;
        this.MarkPos1 = this.ScreenPos2XVal(this.GetEventPosX(ev));
    }
}

ChannelPlotter.prototype.OnMouseUp = function (ev) {

    if (!this.HasMouseMoved) {
        var xp = this.GetEventPosX(ev);
        var yp = this.GetEventPosY(ev);

        for (var channelnr in this.myChannels) {
            if ((yp >= this.myChannels[channelnr].PosY - this.myChannels[channelnr].SizeY) && (yp <= this.myChannels[channelnr].PosY)) {
                var yp1 = this.myChannels[channelnr].PosY - yp;
                var newtooltipinfo = this.myChannels[channelnr].OnClick(xp, yp1);
            }
        }
    }

}

ChannelPlotter.prototype.OnMouseMove = function (ev) {

    var MousePressX1 = this.GetEventPosX(ev);
    var MousePressY1 = this.GetEventPosY(ev);
    if (Math.abs(MousePressX1-this.MousePressX0)+Math.abs(MousePressY1-this.MousePressY0)>5)
        this.HasMouseMoved=true;

    if (this.dragging) {
        this.OffsetX = this.dragstartoffset - (this.GetEventPosX(ev) - this.dragstartx);
        this.ClipViewRange();
        this.DelToolTip();
        this.UpdateHScroller();
        this.Draw();
    }
    if (this.mousemarking) {
        this.MarkPos2 = this.ScreenPos2XVal(this.GetEventPosX(ev));
        this.DelToolTip();
        this.Draw();
    }
}

ChannelPlotter.prototype.OnMouseHover = function (ev) {
    var xp = this.GetEventPosX(ev);
    var yp = this.GetEventPosY(ev);

    for (var channelnr in this.myChannels) {
        if ((yp >= this.myChannels[channelnr].PosY - this.myChannels[channelnr].SizeY) && (yp <= this.myChannels[channelnr].PosY)) {
            var yp1 = this.myChannels[channelnr].PosY - yp;
            var newtooltipinfo = this.myChannels[channelnr].GetToolTipInfo(xp, yp1);
            if (newtooltipinfo != null)
                newtooltipinfo.yp = this.myChannels[channelnr].PosY - newtooltipinfo.yp;
            var tooltipchanged = false;
            if ((newtooltipinfo == null) && (this.ToolTipInfo != null)) tooltipchanged = true;
            if ((newtooltipinfo != null) && (this.ToolTipInfo == null)) tooltipchanged = true;
            if ((newtooltipinfo != null) && (this.ToolTipInfo != null))
                if ((newtooltipinfo.xp != this.ToolTipInfo.xp) || (newtooltipinfo.yp != this.ToolTipInfo.yp)) tooltipchanged = true;
            this.ToolTipInfo = newtooltipinfo;
            if (tooltipchanged)
                this.Draw();
        }
    }
}

ChannelPlotter.prototype.OnLeaveMouse = function (ev) {
    if (this.ToolTipInfo != null) {
        this.DelToolTip();
        this.Draw();
    }
}

ChannelPlotter.prototype.DelToolTip = function () {
    this.ToolTipInfo = null;
}


ChannelPlotter.prototype.OnMouseWheel = function (ev) {
    //!!!TODO: this approach does not seem to work well with mouses with continuous scrolling (e.g. apple mouses) -> rework in a more careful way
    var PosX = this.GetEventPosX(ev);
    var dff = 1.3; //unit zoom factor
    var delta = ev.detail < 0 || ev.wheelDelta > 0 ? 1 : -1;
    if (delta < 0) {//zoom out
        this.OffsetX = this.OffsetX / dff - PosX * (dff - 1) / dff;
        this.ZoomFactX /= dff;
    }
    else {//zoom in
        dff = Math.min(dff, this.MaxZoomFactX/this.ZoomFactX);
        this.OffsetX = this.OffsetX * dff + PosX * (dff - 1);
        this.ZoomFactX *= dff;
    }
    this.ClipViewRange();
    this.DelToolTip();
    this.UpdateHScroller();
    this.Draw();
    ev.returnValue = false;
    return false;
}

