


///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Class ChannelPlotChannelYValsComp: implements a single component for ChannelPlotChannelYVals
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//NOTE: a channel is identified by a DQX.DataFetcher.Curve, and a column id in this fetcher
DQX.ChannelPlot.ChannelYValsComp = function (imyDataFetcher, iYID) {
    var that = {};
    that.myfetcher = imyDataFetcher; //DQX.DataFetcher.Curve used
    that.yID = iYID; // column id
    that.isActive = false;

    //return the color used to draw this channel
    that.getColor = function () {
        return this.myfetcher.myColumns[this.yID].myPlotHints.Color;
    }
    return that;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Class ChannelPlotChannelYVals: derives from ChannelPlotChannel, and plots Y values
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

DQX.ChannelPlot.ChannelYVals = function (imyPlot) {
    var that = DQX.ChannelPlot.Channel(imyPlot);
    that.yMinVal = 0.0;
    that.yMaxVal = 1.0;
    that.myComponents = {}; //maps components ids to ChannelPlotChannelYValsComp objects
    that.minDrawZoomFactX = 0; //if the zoom factor drops below this point, the channel isn't drawn anymore
    that.allowToolTipsInCurrentView = true;

    //returns a list of all fetchers that are currently active in this plot (i.e. correspond to active components)
    that.getActiveDataFetchers = function () {
        var lst = [];
        for (var compid in this.myComponents) {
            if (this.myComponents[compid].isActive) {
                var fetcher = this.myComponents[compid].myfetcher;
                var found = false;
                for (var i = 0; i < lst.length; i++)
                    if (fetcher == lst[i])
                        found = true;
                if (!found)
                    lst.push(fetcher);
            }
        }
        return lst;
    }


    that.draw = function (drawInfo) {
        var rangemin = this.yMinVal;
        var rangemax = this.yMaxVal;
        this.lastDrawInfo = drawInfo;

        //draw the left panel
        this.drawVertScale(drawInfo, rangemin, rangemax);
        this.drawTitle(drawInfo);

        var hasdata = false;
        for (var compid in this.myComponents)
            if (this.myComponents[compid].isActive)
                hasdata = true;

        if (drawInfo.zoomFactX < this.minDrawZoomFactX) {
            if (!hasdata)
                this.drawMessage(drawInfo, "");
            else
                this.drawMessage(drawInfo, "Zoom in to see " + this.myTitle);
            return;
        }
        if (!hasdata) return;


        drawInfo.centerContext.strokeStyle = "black";
        this.PosMin = Math.round((-50 + drawInfo.offsetX) / drawInfo.zoomFactX);
        this.PosMax = Math.round((drawInfo.sizeX + 50 + drawInfo.offsetX) / drawInfo.zoomFactX);

        var fetcherlist = this.getActiveDataFetchers();
        var alldataready = true;
        var fetcherror = false;
        for (var fetchnr = 0; fetchnr < fetcherlist.length; fetchnr++) {
            if (!fetcherlist[fetchnr].IsDataReady(this.PosMin, this.PosMax, false))
                alldataready = false;
            if (fetcherlist[fetchnr].hasFetchFailed)
                fetcherror = true;
        }
        if (!alldataready) {
            drawInfo.centerContext.fillStyle = "rgb(0,192,0)";
            drawInfo.centerContext.font = '25px sans-serif';
            drawInfo.centerContext.textBaseline = 'bottom';
            drawInfo.centerContext.textAlign = 'center';
            drawInfo.centerContext.fillText("Fetching data...", drawInfo.sizeX / 2, drawInfo.PosY - drawInfo.sizeY + 30);
        }
        if (fetcherror) {
            drawInfo.centerContext.fillStyle = "rgb(255,0,0)";
            drawInfo.centerContext.font = '25px sans-serif';
            drawInfo.centerContext.textBaseline = 'bottom';
            drawInfo.centerContext.textAlign = 'center';
            drawInfo.centerContext.fillText("Fetch failed!", drawInfo.sizeX / 2, drawInfo.PosY - drawInfo.sizeY + 60);
        }
        var NrPointsDrawn = 0;
        for (var compid in this.myComponents) {
            var comp = this.myComponents[compid];
            if (comp.isActive) {
                var points = comp.myfetcher.getColumnPoints(this.PosMin, this.PosMax, comp.yID);
                var xvals = points.xVals;
                var yvals = points.YVals;
                var psz = 3;
                if (xvals.length > 10000) psz = 2;
                NrPointsDrawn += xvals.length;
                var plothints = comp.myfetcher.getColumnPlotHints(comp.yID);
                var hasYFunction = "YFunction" in comp;

                if (plothints.drawLines) {//draw connecting lines
                    drawInfo.centerContext.strokeStyle = comp.myfetcher.getColumnColor(comp.yID);
                    drawInfo.centerContext.globalAlpha = 0.4;
                    drawInfo.centerContext.beginPath();
                    var thefirst = true;
                    var maxlinedist = comp.myfetcher.getColumnPlotHints(comp.yID).maxLineDist;
                    for (i = 0; i < xvals.length; i++) {
                        if (yvals[i] != null) {
                            var x = xvals[i];
                            var y = yvals[i];
                            if (hasYFunction)
                                y = comp.YFunction(y);
                            var psx = x * drawInfo.zoomFactX - drawInfo.offsetX;
                            psy = drawInfo.PosY - drawInfo.sizeY * 0.1 - (y - rangemin) / (rangemax - rangemin) * drawInfo.sizeY * 0.8;
                            if ((!thefirst) && (x - xlast > maxlinedist))
                                thefirst = true;
                            if (thefirst) drawInfo.centerContext.moveTo(psx, psy);
                            else drawInfo.centerContext.lineTo(psx, psy);
                            thefirst = false;
                            var xlast = x;
                        }
                    }
                    drawInfo.centerContext.stroke();
                    drawInfo.centerContext.globalAlpha = 1.0;
                }

                if (true) {//draw points
                    drawInfo.centerContext.fillStyle = comp.myfetcher.getColumnColor(comp.yID);
                    drawInfo.centerContext.strokeStyle = comp.myfetcher.getColumnColor(comp.yID);
                    drawInfo.centerContext.beginPath();
                    for (i = 0; i < xvals.length; i++) {
                        if (yvals[i] != null) {
                            var x = xvals[i];
                            var y = yvals[i];
                            if (hasYFunction)
                                y = comp.YFunction(y);
                            var psx = Math.round(x * drawInfo.zoomFactX - drawInfo.offsetX);
                            var psy = Math.round(drawInfo.PosY - drawInfo.sizeY * 0.1 - (y - rangemin) / (rangemax - rangemin) * drawInfo.sizeY * 0.8);
                            drawInfo.centerContext.moveTo(psx - 2, psy-0.5);
                            drawInfo.centerContext.lineTo(psx + 1, psy-0.5);
                            drawInfo.centerContext.moveTo(psx-0.5, psy - 2);
                            drawInfo.centerContext.lineTo(psx-0.5, psy + 1);
                        }
                    }
                    drawInfo.centerContext.stroke();
                }

            }
        }
        this.allowToolTipsInCurrentView = NrPointsDrawn < 5000;
    }

    //returns information about the point closest to a screen position, or null if nothing is sufficiently close
    that.getPointAtScreenPos = function (xp, yp) {
        if (!("lastDrawInfo" in this))
            return null;
        if (this.lastDrawInfo.zoomFactX < this.minDrawZoomFactX)
            return null;
        var rangemin = this.yMinVal;
        var rangemax = this.yMaxVal;

        var mindst = 12;
        var theresponse = null;
        for (var compid in this.myComponents) {
            var comp = this.myComponents[compid];
            if (comp.isActive) {
                var hasYFunction = "YFunction" in comp;
                var points = comp.myfetcher.getColumnPoints(this.PosMin, this.PosMax, comp.yID);
                var xvals = points.xVals;
                var yvals = points.YVals;
                for (i = 0; i < xvals.length; i++) {
                    if (yvals[i] != null) {
                        var x = xvals[i];
                        var y = yvals[i];
                        if (hasYFunction)
                            y = comp.YFunction(y);
                        var psx = Math.round(x * this.lastDrawInfo.zoomFactX - this.lastDrawInfo.offsetX);
                        var psy = Math.round(/*this.lastDrawInfo.PosY -*/this.lastDrawInfo.sizeY * 0.1 + (y - rangemin) / (rangemax - rangemin) * this.lastDrawInfo.sizeY * 0.8);
                        var dst = Math.abs(psx - xp) + Math.abs(psy - yp);
                        if (dst < mindst) {
                            mindst = dst;
                            theresponse = {};
                            theresponse.DataFetcher = comp.myfetcher;
                            theresponse.DownloadIndex = points.startIndex + i;
                            theresponse.CompID = comp.yID;
                            theresponse.PosX = psx;
                            theresponse.PosY = psy;
                        }
                    }
                }
            }
        }
        return theresponse;
    }


    //returns the tooptip at a specific point in screen coordinates (null if none)
    that.getToolTipInfo = function (xp, yp) {
        if (!("GenerateToolTipInfo" in this))
            return null;
        if (!this.allowToolTipsInCurrentView)
            return null;
        var pointinfo = this.getPointAtScreenPos(xp, yp);
        var thetip = null;
        if (pointinfo != null) {
            var thetip = {};
            thetip.xp = pointinfo.PosX;
            thetip.yp = pointinfo.PosY;
            thetip.lines = this.GenerateToolTipInfo(pointinfo.DataFetcher, pointinfo.DownloadIndex, pointinfo.CompID); //todo: use same object as in onClick
        }
        return thetip;
    }

    that.onClick = function (xp, yp) {
        var pointinfo = this.getPointAtScreenPos(xp, yp);
        if (pointinfo != null) {
            if ("onPointClickEvent" in this)
                this.onPointClickEvent(pointinfo);
        }
    }



    //add a nw component to the plot
    that.addComponent = function (icomp) {
        this.myComponents[icomp.yID] = icomp;
        return icomp;
    }

    //response function that handles a click on a component visibility checkbox
    that.onCompClick = function (event) {
        var checkid = event.target.id;
        var id = checkid.split("CompCheck_")[1];
        var chk = $('#' + checkid).attr('checked');
        this.modifyComponentActiveStatus(id, chk, true);
    }

    that.modifyComponentActiveStatus = function (cmpid, newstatus, redraw) {
        if (this.myComponents[cmpid].isActive == newstatus) return;
        this.myComponents[cmpid].isActive = newstatus;
        if (newstatus)
            this.myComponents[cmpid].myfetcher.activateFetchColumn(cmpid);
        else
            this.myComponents[cmpid].myfetcher.deactivateFetchColumn(cmpid);
        if (redraw)
            this.myPlot.draw();
    }


    //A convenience function:
    //This function automatically generates the html elements inside a div that allow the user to control the visibility of the components
    that.createActiveComponentsController = function (divid, colcount) {
        var compkeys = []
        for (var compkey in this.myComponents)
            compkeys.push(compkey);
        rs = "<table>";
        for (var rownr = 0; rownr < compkeys.length / colcount; rownr++) {
            rs += "<tr>";
            for (var colnr = 0; colnr < colcount; colnr++) {
                rs += "<td>";
                var compnr = rownr * colcount + colnr;
                if (compnr < compkeys.length) {
                    var yid = compkeys[compnr];
                    var comp = this.myComponents[yid];
                    var checkid = "CompCheck_" + yid;
                    //                    rs += "<div>";
                    rs += '<input type="checkbox" id="' + checkid + '" name="' + checkid + '" value="' + checkid + '"/>';
                    rs += '<span style="background:' + comp.getColor() + ';">&nbsp;&nbsp;&nbsp;</span>&nbsp;';
                    rs += yid;
                    //                    rs += "</div>";
                }
                rs += "</td>";
            }
            rs += "</tr>";
        }
        rs += "</table>";

        $("#" + divid).html(rs);

        for (var compkey in this.myComponents) {
            var yid = this.myComponents[compkey].yID;
            var checkid = "CompCheck_" + yid;
            $("#" + checkid).click($.proxy(that.onCompClick, that));
        }

    }


    return that;
}
