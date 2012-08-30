
DQX.ChannelPlot = {};






/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
// DQX.ChannelPlot.Plotter Class: implements a channel view
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

//This list maintains a global list of all channelplots, used by some functions (although a jQuery proxy closure might avoid this)
DQX.ChannelPlot._list = [];

//Returns a channelplot by its center canvas id, or return null if not found
DQX.ChannelPlot.get = function(iCanvasCenterID) {
    for (var i in DQX.ChannelPlot._list)
        if (DQX.ChannelPlot._list[i].CanvasBaseID + "Center" == iCanvasCenterID)
            return DQX.ChannelPlot._list[i];
    return null;
}

DQX.ChannelPlot._handleCanvasMouseDown = function(ev) {
    var theplot = DQX.ChannelPlot.get(ev.target.id);
    theplot._mousedown = true;
    theplot._onMouseDown(ev);
    ev.returnValue = false;
    return false;
}

DQX.ChannelPlot._handleDocMouseUp = function(ev) {
    for (var i in DQX.ChannelPlot._list)
        if (DQX.ChannelPlot._list[i]._mousedown) {
            DQX.ChannelPlot._list[i]._onMouseUp(ev);
            DQX.ChannelPlot._list[i]._mousedown = false;
        }
    }

DQX.ChannelPlot._lastMouseHover = null;

function _handleChannelPlotDocMouseMove(ev) {
    //first try and see if this is a mousedown event for a plot
    for (i in DQX.ChannelPlot._list)
        if (DQX.ChannelPlot._list[i]._mousedown) {
            DQX.ChannelPlot._list[i]._onMouseMove(ev);
            return;
        }
    //if not, handle as a mouse hover event
    var theplot = DQX.ChannelPlot.get(ev.target.id);
    if (theplot != null) {
        theplot._onMouseHover(ev);
        DQX.ChannelPlot._lastMouseHover = theplot;
        }
    else {
        if (DQX.ChannelPlot._lastMouseHover != null)
            DQX.ChannelPlot._lastMouseHover.onLeaveMouse(ev);
        DQX.ChannelPlot._lastMouseHover = null;
    }
}



DQX.ChannelPlot.Plotter = function (iCanvasBaseID) {
    var that = {};

    //add myself to the global list
    DQX.ChannelPlot._list.push(that);

    //get the canvas element info
    that.CanvasBaseID = iCanvasBaseID;
    that.canvasCenterElement = $("#" + iCanvasBaseID + "Center")[0];
    that.sizeX = that.canvasCenterElement.width;
    that.sizeY = that.canvasCenterElement.height;

    //that.canvasCenterElement.setAttribute('width', that.sizeX);
    //that.canvasCenterElement.setAttribute('height', that.sizeY);



    that.fullRangeMin = -0.25E6; //start point of the full x range
    that.fullRangeMax = 250.0E6; //end point of the full x range

    that.CanvasLeftElement = $("#" + iCanvasBaseID + "Left")[0];
    that.LeftSizeX = $("#" + iCanvasBaseID + "Left").width();
    //that.CanvasLeftElement.setAttribute('width', that.LeftSizeX);
    //that.CanvasLeftElement.setAttribute('height', that.sizeY);

    //some internal stuff
    that.offsetX = 0
    that.BaseZoomFactX = 1.0 / 50000.0;
    that.MaxZoomFactX = 1.0 / 30.0;
    that.zoomFactX = that.BaseZoomFactX;
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

    //returns a htnl element with a specific extension from the set of html elements that make up this plot
    that.getElement = function (extension) {
        var id = "#" + this.CanvasBaseID + extension;
        var rs = $(id);
        if (rs.length == 0)
            throw "Missing plotter element " + id;
        return rs;
    }

    //Add a DQX.DataFetcher.Curve object to the plot
    that.addDataFetcher = function (idatafetcher) {
        this.myDataFetchers.push(idatafetcher);
        idatafetcher.myDataConsumer = this;
    }

    //Add a ChannelPlotChannel-derived object to the plot
    that.addChannel = function (ichannel) {
        this.myChannels.push(ichannel);
    }

    //Internal: this function is called by e.g. DQX.DataFetcher.Curve class to notify that data is ready and the plot should be redrawn
    that.notifyDataReady = function () {
        this.draw();
    }

    //Use this function to resize the plot to other dimensions
    that.resize = function (newsizex, newsizey) {
        //        this.zoomFactX *= (newsizex * 1.0 / this.sizeX);
        this.sizeX = newsizex;
        this.sizeY = newsizey;
        $(this.canvasCenterElement).width(newsizex);
        this.canvasCenterElement.width = newsizex;
        this.canvasCenterElement.height = newsizey;
        this.CanvasLeftElement.height = newsizey;
        this.draw();
    }

    //Invalidate all the data downloaded by the plot, forcing a reload upon the next drawing
    that.clearData = function () {
        for (var i = 0; i < this.myDataFetchers.length; i++)
            this.myDataFetchers[i].clearData();
    }

    //Returns the position X coordinate of an event, relative to the center canvas element
    that.getEventPosX = function (ev) {
        return ev.pageX - $(this.canvasCenterElement).offset().left;
    }

    //Returns the position Y coordinate of an event, relative to the center canvas element
    that.getEventPosY = function (ev) {
        return ev.pageY - $(this.canvasCenterElement).offset().top;
    }

    that.posXCanvas2Screen = function (px) {
        return px + $(this.canvasCenterElement).offset().left;
    }

    that.posYCanvas2Screen = function (py) {
        return py + $(this.canvasCenterElement).offset().top;
    }


    ////////////////////// Main drawing function ////////////////////////////////////
    // X position conversion: X_screen = X_logical * drawInfo.zoomFactX - drawInfo.offsetX

    that.draw = function () {
        var centercontext = this.canvasCenterElement.getContext("2d");
        var leftcontext = this.CanvasLeftElement.getContext("2d");

        var sepsize = 2; //separator size between each channel

        //first, calculate the accumulated size of all the fixed channels
        var totalfixedsize = sepsize;
        var flexchannelcount = 0;
        for (channelnr in this.myChannels) {
            if (this.myChannels[channelnr].fixedSizeY > 0)
                totalfixedsize += this.myChannels[channelnr].fixedSizeY;
            else
                flexchannelcount++;
            totalfixedsize += sepsize;
        }

        var ypos = this.sizeY;
        var ysize;
        var drawinfo = {};
        drawinfo.centerContext = centercontext;
        drawinfo.offsetX = this.offsetX;
        drawinfo.zoomFactX = this.zoomFactX;
        drawinfo.sizeX = this.sizeX;
        drawinfo.leftContext = leftcontext;
        drawinfo.LeftSizeX = this.LeftSizeX;
        drawinfo.HorAxisScaleJumps = DQX.DrawUtil.getScaleJump(20 / drawinfo.zoomFactX);
        drawinfo._markPresent = this.markpresent;
        drawinfo._markPos1 = Math.min(this._markPos1, this._markPos2);
        drawinfo._markPos2 = Math.max(this._markPos1, this._markPos2);
        drawinfo.Plotter = this;

        for (var channelnr in this.myChannels) {

            //draw separator
            ypos -= sepsize;
            centercontext.fillStyle = "rgb(128,128,128)";
            centercontext.fillRect(0, ypos, this.sizeX, sepsize);
            leftcontext.fillStyle = "rgb(128,128,128)";
            leftcontext.fillRect(0, ypos, this.LeftSizeX, sepsize);

            //draw background
            ysize = this.myChannels[channelnr].fixedSizeY;
            if (ysize < 0)
                ysize = Math.round((this.sizeY - totalfixedsize) / flexchannelcount);
            //center
            var backgrad = centercontext.createLinearGradient(0, ypos - ysize, 0, ypos);
            backgrad.addColorStop(0, "rgb(255,255,255)");
            backgrad.addColorStop(1, "rgb(210,210,210)");
            centercontext.fillStyle = backgrad;
            centercontext.fillRect(0, ypos - ysize, this.sizeX, ysize);
            //left
            backgrad = centercontext.createLinearGradient(0, ypos - ysize, 0, ypos);
            backgrad.addColorStop(0, "rgb(230,230,230)");
            backgrad.addColorStop(1, "rgb(180,180,180)");
            leftcontext.fillStyle = backgrad;
            leftcontext.fillRect(0, ypos - ysize, this.LeftSizeX, ysize);

            this.myChannels[channelnr].PosY = ypos;
            this.myChannels[channelnr].sizeY = ysize;
            drawinfo.PosY = ypos;
            drawinfo.sizeY = ysize;

            //scale
            drawinfo.centerContext.strokeStyle = "black";
            var i1 = Math.round(((-50 + drawinfo.offsetX) / drawinfo.zoomFactX) / drawinfo.HorAxisScaleJumps.Jump1);
            if (i1 < 0) i1 = 0;
            var i2 = Math.round(((drawinfo.sizeX + 50 + drawinfo.offsetX) / drawinfo.zoomFactX) / drawinfo.HorAxisScaleJumps.Jump1);
            for (i = i1; i <= i2; i++) {
                var value = i * drawinfo.HorAxisScaleJumps.Jump1;
                var psx = Math.round((value) * drawinfo.zoomFactX - drawinfo.offsetX) + 0.5;
                if ((psx >= -50) && (psx <= drawinfo.sizeX + 50)) {
                    drawinfo.centerContext.globalAlpha = 0.075;
                    if (i % drawinfo.HorAxisScaleJumps.JumpReduc == 0)
                        drawinfo.centerContext.globalAlpha = 0.2;
                    drawinfo.centerContext.beginPath();
                    drawinfo.centerContext.moveTo(psx, drawinfo.PosY - drawinfo.sizeY);
                    drawinfo.centerContext.lineTo(psx, drawinfo.PosY);
                    drawinfo.centerContext.stroke();
                }
            }
            drawinfo.centerContext.globalAlpha = 1;

            this.myChannels[channelnr].draw(drawinfo);

            ypos -= ysize;
        }
        centercontext.fillStyle = "rgb(128,128,128)";
        centercontext.fillRect(0, 0, this.sizeX, ypos);
        leftcontext.fillStyle = "rgb(128,128,128)";
        leftcontext.fillRect(0, 0, this.LeftSizeX, ypos);

        if (this._markPresent) {
            var psx1 = Math.round((this._markPos1) * drawinfo.zoomFactX - drawinfo.offsetX) - 1;
            var psx2 = Math.round((this._markPos2) * drawinfo.zoomFactX - drawinfo.offsetX) + 1;
            centercontext.globalAlpha = 0.15;
            centercontext.fillStyle = "rgb(255,0,0)";
            centercontext.fillRect(psx1, 0, psx2 - psx1, this.sizeY);
            centercontext.globalAlpha = 1;
        }

        if (this._toolTipInfo != null) {
            DQX.DrawUtil.DrawChannelToolTip(centercontext, this._toolTipInfo);
        }
    }


    //Converts canvas screen X coordinate to logical X coordinate
    that.screenPos2XVal = function (ScreenPosX) {
        return (ScreenPosX + this.offsetX) / this.zoomFactX;
    }

    that.setMark = function (pos1, pos2) {
        this._markPresent = true;
        this._markPos1 = pos1;
        this._markPos2 = pos2;
        this.draw();
    }


    that.updateHScroller = function () {
        if (this.myHScroller == null) return;
        var ps1 = (this.screenPos2XVal(0) - this.fullRangeMin) / (this.fullRangeMax - this.fullRangeMin);
        var ps2 = (this.screenPos2XVal(this.sizeX) - this.fullRangeMin) / (this.fullRangeMax - this.fullRangeMin);
        this.myHScroller.setRange(this.fullRangeMin / 1.0e6, this.fullRangeMax / 1.0e6);
        this.myHScroller.setValue(ps1, ps2 - ps1);
    }


    that.setPosition = function (centerpos, width) {
        this.zoomFactX = this.sizeX / width;
        this.offsetX = (centerpos - 0.5 * width) * this.zoomFactX;
        this.draw();
        this.updateHScroller();
    }


    that.pairWithHScroller = function (imyHScroller) {
        this.myHScroller = imyHScroller;
        this.myHScroller.myConsumer = this;
        this.updateHScroller();
    }

    that.scrollTo = function (fraction) {
        var psx = this.fullRangeMin + fraction * (this.fullRangeMax - this.fullRangeMin);
        this.offsetX = psx * this.zoomFactX;
        this.draw();
    }

    that.zoomScrollTo = function (scrollPosFraction, scrollSizeFraction) {

        this.zoomFactX = this.sizeX / ((this.fullRangeMax - this.fullRangeMin) * scrollSizeFraction);
        var psx = this.fullRangeMin + scrollPosFraction * (this.fullRangeMax - this.fullRangeMin);
        this.offsetX = psx * this.zoomFactX;
        this.draw();
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Various handlers
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    that.clipViewRange = function (ev) {
        //var winsize = this.sizeX / this.zoomFactX;
        this.zoomFactX = Math.max(this.zoomFactX, this.sizeX / (this.fullRangeMax - this.fullRangeMin));
        this.offsetX = Math.min(this.fullRangeMax * this.zoomFactX - this.sizeX, this.offsetX);
        this.offsetX = Math.max(this.fullRangeMin * this.zoomFactX, this.offsetX);
    }


    that._onMouseDown = function (ev) {

        this._mousePressX0 = this.getEventPosX(ev);
        this._mousePressY0 = this.getEventPosY(ev);
        this._hasMouseMoved = false;
        this.dragging = false;
        this.mousemarking = false;
        if (!ev.ctrlKey) {
            $(this.canvasCenterElement).css('cursor', 'w-resize');
            this.dragging = true;
            this.dragstartoffset = this.offsetX;
            this.dragstartx = this.getEventPosX(ev);
        }
        else {
            this.mousemarking = true;
            this._markPresent = true;
            this._markPos1 = this.screenPos2XVal(this.getEventPosX(ev));
        }
    }

    that._onMouseUp = function (ev) {

        $(this.canvasCenterElement).css('cursor', 'auto');
        if (!this._hasMouseMoved) {
            var xp = this.getEventPosX(ev);
            var yp = this.getEventPosY(ev);

            for (var channelnr in this.myChannels) {
                if ((yp >= this.myChannels[channelnr].PosY - this.myChannels[channelnr].sizeY) && (yp <= this.myChannels[channelnr].PosY)) {
                    var yp1 = this.myChannels[channelnr].PosY - yp;
                    var newtooltipinfo = this.myChannels[channelnr].onClick(xp, yp1);
                }
            }
        }

    }

    that._onMouseMove = function (ev) {

        var mousePressX1 = this.getEventPosX(ev);
        var mousePressY1 = this.getEventPosY(ev);
        if (Math.abs(mousePressX1 - this._mousePressX0) + Math.abs(mousePressY1 - this._mousePressY0) > 5)
            this._hasMouseMoved = true;

        if (this.dragging) {
            this.offsetX = this.dragstartoffset - (this.getEventPosX(ev) - this.dragstartx);
            this.clipViewRange();
            this.delToolTip();
            this.updateHScroller();
            this.draw();
        }
        if (this.mousemarking) {
            this._markPos2 = this.screenPos2XVal(this.getEventPosX(ev));
            this.delToolTip();
            this.draw();
        }
    }

    that._onMouseHover = function (ev) {
        var xp = this.getEventPosX(ev);
        var yp = this.getEventPosY(ev);

        for (var channelnr in this.myChannels) {
            if ((yp >= this.myChannels[channelnr].PosY - this.myChannels[channelnr].sizeY) && (yp <= this.myChannels[channelnr].PosY)) {
                var yp1 = this.myChannels[channelnr].PosY - yp;
                var newtooltipinfo = this.myChannels[channelnr].getToolTipInfo(xp, yp1);
                if (newtooltipinfo != null)
                    newtooltipinfo.yp = this.myChannels[channelnr].PosY - newtooltipinfo.yp;
                var tooltipchanged = false;
                if ((newtooltipinfo == null) && (this._toolTipInfo != null)) tooltipchanged = true;
                if ((newtooltipinfo != null) && (this._toolTipInfo == null)) tooltipchanged = true;
                if ((newtooltipinfo != null) && (this._toolTipInfo != null))
                    if ((newtooltipinfo.xp != this._toolTipInfo.xp) || (newtooltipinfo.yp != this._toolTipInfo.yp)) tooltipchanged = true;
                this._toolTipInfo = newtooltipinfo;
                if (tooltipchanged)
                    this.draw();
            }
        }
    }

    that.onLeaveMouse = function (ev) {
        if (this._toolTipInfo != null) {
            this.delToolTip();
            this.draw();
        }
    }

    that.delToolTip = function () {
        this._toolTipInfo = null;
    }


    that.OnMouseWheel = function (ev) {
        var PosX = this.getEventPosX(ev);

        var delta = 0;
        if (ev.wheelDelta) { delta = ev.wheelDelta / 120; }
        if (ev.detail) { delta = -ev.detail / 3; }
        var dff = 1.3 * Math.abs(delta); //unit zoom factor

        if (delta < 0) {//zoom out
            this.offsetX = this.offsetX / dff - PosX * (dff - 1) / dff;
            this.zoomFactX /= dff;
        }
        else {//zoom in
            dff = Math.min(dff, this.MaxZoomFactX / this.zoomFactX);
            this.offsetX = this.offsetX * dff + PosX * (dff - 1);
            this.zoomFactX *= dff;
        }
        this.clipViewRange();
        this.delToolTip();
        this.updateHScroller();
        this.draw();
        ev.returnValue = false;
        return false;
    }

    that.onKeyDown = function (ev) {
        if ((ev.keyCode == 37)||(ev.keyCode == 39)) {
            this.offsetX += 80 * ((ev.keyCode == 37)?-1:+1);
            this.clipViewRange();
            this.delToolTip();
            this.updateHScroller();
            this.draw();
            return true;
        }
        return false;
    }


    //register event handlers
    $(that.canvasCenterElement).mousedown(DQX.ChannelPlot._handleCanvasMouseDown);
    $(document).mouseup(DQX.ChannelPlot._handleDocMouseUp);
    $(document).mousemove(_handleChannelPlotDocMouseMove);
    $(that.canvasCenterElement).bind('DOMMouseScroll mousewheel', $.proxy(that.OnMouseWheel, that));

    return that;
}

















