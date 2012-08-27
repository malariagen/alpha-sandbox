
DQX.ChannelPlot = {};






/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
// DQX.ChannelPlot.Plotter Class: implements a channel view
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

//This list maintains a global list of all channelplots, used by some functions (although a jQuery proxy closure might avoid this)
DQX.ChannelPlot._list = [];

//Returns a channelplot by its center canvas id, or return null if not found
DQX.ChannelPlot.Get = function(iCanvasCenterID) {
    for (var i in DQX.ChannelPlot._list)
        if (DQX.ChannelPlot._list[i].CanvasBaseID + "Center" == iCanvasCenterID)
            return DQX.ChannelPlot._list[i];
    return null;
}

DQX.ChannelPlot._handleCanvasMouseDown = function(ev) {
    var theplot = DQX.ChannelPlot.Get(ev.target.id);
    theplot._mousedown = true;
    theplot.OnMouseDown(ev);
    ev.returnValue = false;
    return false;
}

DQX.ChannelPlot._handleDocMouseUp = function(ev) {
    for (var i in DQX.ChannelPlot._list)
        if (DQX.ChannelPlot._list[i]._mousedown) {
            DQX.ChannelPlot._list[i].OnMouseUp(ev);
            DQX.ChannelPlot._list[i]._mousedown = false;
        }
    }

DQX.ChannelPlot._lastMouseHover = null;

function HandleChannelPlotDocMouseMove(ev) {
    //first try and see if this is a mousedown event for a plot
    for (i in DQX.ChannelPlot._list)
        if (DQX.ChannelPlot._list[i]._mousedown) {
            DQX.ChannelPlot._list[i].OnMouseMove(ev);
            return;
        }
    //if not, handle as a mouse hover event
    var theplot = DQX.ChannelPlot.Get(ev.target.id);
    if (theplot != null) {
        theplot.OnMouseHover(ev);
        DQX.ChannelPlot._lastMouseHover = theplot;
        }
    else {
        if (DQX.ChannelPlot._lastMouseHover != null)
            DQX.ChannelPlot._lastMouseHover.OnLeaveMouse(ev);
        DQX.ChannelPlot._lastMouseHover = null;
    }
}



DQX.ChannelPlot.Plotter = function (iCanvasBaseID) {
    var that = {};

    //add myself to the global list
    DQX.ChannelPlot._list.push(that);

    //get the canvas element info
    that.CanvasBaseID = iCanvasBaseID;
    that.CanvasCenterElement = $("#" + iCanvasBaseID + "Center")[0];
    that.SizeX = that.CanvasCenterElement.width;
    that.SizeY = that.CanvasCenterElement.height;

    //that.CanvasCenterElement.setAttribute('width', that.SizeX);
    //that.CanvasCenterElement.setAttribute('height', that.SizeY);



    that.FullRangeMin = -0.25E6; //start point of the full x range
    that.FullRangeMax = 250.0E6; //end point of the full x range

    that.CanvasLeftElement = $("#" + iCanvasBaseID + "Left")[0];
    that.LeftSizeX = $("#" + iCanvasBaseID + "Left").width();
    //that.CanvasLeftElement.setAttribute('width', that.LeftSizeX);
    //that.CanvasLeftElement.setAttribute('height', that.SizeY);

    //some internal stuff
    that.OffsetX = 0
    that.BaseZoomFactX = 1.0 / 50000.0;
    that.MaxZoomFactX = 1.0 / 30.0;
    that.ZoomFactX = that.BaseZoomFactX;
    that._mousedown = false;
    that.dragstartoffset = 0;
    that.dragstartx = 0;
    that.myHScroller = null;

    that.mousemarking = false;
    that.markpresent = false;

    //Maintains a list of all ChannelPlotChannel-derived objects that define the different channels in this plot
    that.myChannels = [];

    //Maintains a list of all DQX.DataFetcher.Curve objects used to create this plot
    that.myDataFetchers = [];

    that.GetElement = function (extension) {
        var id = "#" + this.CanvasBaseID + extension;
        var rs = $(id);
        if (rs.length == 0)
            throw "Missing plotter element " + id;
        return rs;
    }

    //Add a DQX.DataFetcher.Curve object to the plot
    that.AddDataFetcher = function (idatafetcher) {
        this.myDataFetchers.push(idatafetcher);
        idatafetcher.Container = this;
    }

    //Add a ChannelPlotChannel-derived object to the plot
    that.AddChannel = function (ichannel) {
        this.myChannels.push(ichannel);
    }

    //Internal: this function is called by e.g. DQX.DataFetcher.Curve class to notify that data is ready and the plot should be redrawn
    that.NotifyDataReady = function () {
        this.Draw();
    }

    //Use this function to resize the plot to other dimensions
    that.Resize = function (newsizex, newsizey) {
//        this.ZoomFactX *= (newsizex * 1.0 / this.SizeX);
        this.SizeX = newsizex;
        this.SizeY = newsizey;
        $(this.CanvasCenterElement).width(newsizex);
        this.CanvasCenterElement.width = newsizex;
        this.CanvasCenterElement.height = newsizey;
        this.CanvasLeftElement.height = newsizey;
        this.Draw();
    }

    //Invalidate all the data downloaded by the plot, forcing a reload upon the next drawing
    that.ClearData = function () {
        for (var i = 0; i < this.myDataFetchers.length; i++)
            this.myDataFetchers[i].ClearData();
    }

    //Returns the position X coordinate of an event, relative to the center canvas element
    that.GetEventPosX = function (ev) {
        return ev.pageX - $(this.CanvasCenterElement).offset().left;
    }

    //Returns the position Y coordinate of an event, relative to the center canvas element
    that.GetEventPosY = function (ev) {
        return ev.pageY - $(this.CanvasCenterElement).offset().top;
    }

    that.PosXCanvas2Screen = function (px) {
        return px + $(this.CanvasCenterElement).offset().left;
    }

    that.PosYCanvas2Screen = function (py) {
        return py + $(this.CanvasCenterElement).offset().top;
    }


    ////////////////////// Main drawing function ////////////////////////////////////
    // X position conversion: X_screen = X_logical * DrawInfo.ZoomFactX - DrawInfo.OffsetX

    that.Draw = function () {
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
        var drawinfo = {};
        drawinfo.CenterContext = centercontext;
        drawinfo.OffsetX = this.OffsetX;
        drawinfo.ZoomFactX = this.ZoomFactX;
        drawinfo.SizeX = this.SizeX;
        drawinfo.LeftContext = leftcontext;
        drawinfo.LeftSizeX = this.LeftSizeX;
        drawinfo.HorAxisScaleJumps = DQX.DrawUtil.GetScaleJump(20 / drawinfo.ZoomFactX);
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
            var psx1 = Math.round((this.MarkPos1) * drawinfo.ZoomFactX - drawinfo.OffsetX) - 1;
            var psx2 = Math.round((this.MarkPos2) * drawinfo.ZoomFactX - drawinfo.OffsetX) + 1;
            centercontext.globalAlpha = 0.15;
            centercontext.fillStyle = "rgb(255,0,0)";
            centercontext.fillRect(psx1, 0, psx2 - psx1, this.SizeY);
            centercontext.globalAlpha = 1;
        }

        if (this.ToolTipInfo != null) {
            DQX.DrawUtil.DrawChannelToolTip(centercontext, this.ToolTipInfo);
        }
    }


    //Converts canvas screen X coordinate to logical X coordinate
    that.ScreenPos2XVal = function (ScreenPosX) {
        return (ScreenPosX + this.OffsetX) / this.ZoomFactX;
    }

    that.SetMark = function (pos1, pos2) {
        this.MarkPresent = true;
        this.MarkPos1 = pos1;
        this.MarkPos2 = pos2;
        this.Draw();
    }


    that.UpdateHScroller = function () {
        if (this.myHScroller == null) return;
        var ps1 = (this.ScreenPos2XVal(0) - this.FullRangeMin) / (this.FullRangeMax - this.FullRangeMin);
        var ps2 = (this.ScreenPos2XVal(this.SizeX) - this.FullRangeMin) / (this.FullRangeMax - this.FullRangeMin);
        this.myHScroller.SetRange(this.FullRangeMin / 1.0e6, this.FullRangeMax / 1.0e6);
        this.myHScroller.SetValue(ps1, ps2 - ps1);
    }


    that.SetPosition = function (centerpos, width) {
        this.ZoomFactX = this.SizeX / width;
        this.OffsetX = (centerpos - 0.5 * width) * this.ZoomFactX;
        this.Draw();
        this.UpdateHScroller();
    }


    that.PairWithHScroller = function (imyHScroller) {
        this.myHScroller = imyHScroller;
        this.myHScroller.myConsumer = this;
        this.UpdateHScroller();
    }

    that.ScrollTo = function (fraction) {
        var psx = this.FullRangeMin + fraction * (this.FullRangeMax - this.FullRangeMin);
        this.OffsetX = psx * this.ZoomFactX;
        this.Draw();
    }

    that.ZoomScrollTo = function (ScrollPosFraction, ScrollSizeFraction) {

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

    that.ClipViewRange = function (ev) {
        //var winsize = this.SizeX / this.ZoomFactX;
        this.ZoomFactX = Math.max(this.ZoomFactX, this.SizeX / (this.FullRangeMax - this.FullRangeMin));
        this.OffsetX = Math.min(this.FullRangeMax * this.ZoomFactX - this.SizeX, this.OffsetX);
        this.OffsetX = Math.max(this.FullRangeMin * this.ZoomFactX, this.OffsetX);
    }


    that.OnMouseDown = function (ev) {

        this.MousePressX0 = this.GetEventPosX(ev);
        this.MousePressY0 = this.GetEventPosY(ev);
        this.HasMouseMoved = false;
        this.dragging = false;
        this.mousemarking = false;
        if (!ev.ctrlKey) {
            $(this.CanvasCenterElement).css('cursor', 'w-resize');
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

    that.OnMouseUp = function (ev) {

        $(this.CanvasCenterElement).css('cursor', 'auto');
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

    that.OnMouseMove = function (ev) {

        var MousePressX1 = this.GetEventPosX(ev);
        var MousePressY1 = this.GetEventPosY(ev);
        if (Math.abs(MousePressX1 - this.MousePressX0) + Math.abs(MousePressY1 - this.MousePressY0) > 5)
            this.HasMouseMoved = true;

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

    that.OnMouseHover = function (ev) {
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

    that.OnLeaveMouse = function (ev) {
        if (this.ToolTipInfo != null) {
            this.DelToolTip();
            this.Draw();
        }
    }

    that.DelToolTip = function () {
        this.ToolTipInfo = null;
    }


    that.OnMouseWheel = function (ev) {
        var PosX = this.GetEventPosX(ev);

        var delta = 0;
        if (ev.wheelDelta) { delta = ev.wheelDelta / 120; }
        if (ev.detail) { delta = -ev.detail / 3; }
        var dff = 1.3 * Math.abs(delta); //unit zoom factor

        if (delta < 0) {//zoom out
            this.OffsetX = this.OffsetX / dff - PosX * (dff - 1) / dff;
            this.ZoomFactX /= dff;
        }
        else {//zoom in
            dff = Math.min(dff, this.MaxZoomFactX / this.ZoomFactX);
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


    //register event handlers
    $(that.CanvasCenterElement).mousedown(DQX.ChannelPlot._handleCanvasMouseDown);
    $(document).mouseup(DQX.ChannelPlot._handleDocMouseUp);
    $(document).mousemove(HandleChannelPlotDocMouseMove);
    $(that.CanvasCenterElement).bind('DOMMouseScroll mousewheel', $.proxy(that.OnMouseWheel, that));

    return that;
}

















