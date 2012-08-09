


///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Class ChannelPlotChannelYValsComp: implements a single component for ChannelPlotChannelYVals
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//NOTE: a channel is identified by a CurveDataFetcher, and a column id in this fetcher
function ChannelPlotChannelYValsComp(imyDataFetcher, iYID) {
    this.myfetcher = imyDataFetcher; //CurveDataFetcher used
    this.YID = iYID; // column id
    this.Active = false;

    //return the color used to draw this channel
    this.GetColor = function () {
        return this.myfetcher.Columns[this.YID].PlotHints.Color;
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Class ChannelPlotChannelYVals: derives from ChannelPlotChannel, and plots Y values
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function ChannelPlotChannelYVals(imyPlot) {
    var that = new ChannelPlotChannel(imyPlot);
    that.YMinVal = 0.0;
    that.YMaxVal = 1.0;
    that.Components = new Object; //maps components ids to ChannelPlotChannelYValsComp objects
    that.MinDrawZoomFactX = 0; //if the zoom factor drops below this point, the channel isn't drawn anymore
    that.AllowToolTipsInCurrentView=true;

    that.Draw = function (DrawInfo) {
        var rangemin = this.YMinVal;
        var rangemax = this.YMaxVal;
        this.LastDrawInfo = DrawInfo;

        //Draw the left panel
        this.DrawVertScale(DrawInfo, rangemin, rangemax);
        this.DrawTitle(DrawInfo);

        var hasdata = false;
        for (var compid in this.Components)
            if (this.Components[compid].Active)
                hasdata = true;

        if (DrawInfo.ZoomFactX < this.MinDrawZoomFactX) {
            if (!hasdata)
                this.DrawMessage(DrawInfo, "");
            else
                this.DrawMessage(DrawInfo, "Zoom in to see " + this.Title);
            return;
        }
        if (!hasdata) return;


        DrawInfo.CenterContext.strokeStyle = "black";
        this.PosMin = Math.round((-50 + DrawInfo.OffsetX) / DrawInfo.ZoomFactX);
        this.PosMax = Math.round((DrawInfo.SizeX + 50 + DrawInfo.OffsetX) / DrawInfo.ZoomFactX);

        var alldataready = true;
        var fetcherror = false;
        for (var compid in this.Components) {
            if (this.Components[compid].Active) {
                if (!this.Components[compid].myfetcher.IsDataReady(this.PosMin, this.PosMax))
                    alldataready = false;
                if (this.Components[compid].myfetcher.FetchFailed)
                    fetcherror = true;
            }
        }
        if (!alldataready) {
            DrawInfo.CenterContext.fillStyle = "rgb(0,192,0)";
            DrawInfo.CenterContext.font = '25px sans-serif';
            DrawInfo.CenterContext.textBaseline = 'bottom';
            DrawInfo.CenterContext.textAlign = 'center';
            DrawInfo.CenterContext.fillText("Fetching data...", DrawInfo.SizeX / 2, DrawInfo.PosY - DrawInfo.SizeY + 30);
        }
        if (fetcherror) {
            DrawInfo.CenterContext.fillStyle = "rgb(255,0,0)";
            DrawInfo.CenterContext.font = '25px sans-serif';
            DrawInfo.CenterContext.textBaseline = 'bottom';
            DrawInfo.CenterContext.textAlign = 'center';
            DrawInfo.CenterContext.fillText("Fetch failed!", DrawInfo.SizeX / 2, DrawInfo.PosY - DrawInfo.SizeY + 60);
        }
        var NrPointsDrawn = 0;
        for (var compid in this.Components) {
            var comp = this.Components[compid];
            if (comp.Active) {
                var points = comp.myfetcher.GetColumnPoints(this.PosMin, this.PosMax, comp.YID);
                var xvals = points.XVals;
                var yvals = points.YVals;
                var psz = 3;
                if (xvals.length > 10000) psz = 2;
                NrPointsDrawn += xvals.length;
                var plothints = comp.myfetcher.GetColumnPlotHints(comp.YID);
                var HasYFunction = "YFunction" in comp;

                if (plothints.DrawLines) {//draw connecting lines
                    DrawInfo.CenterContext.strokeStyle = comp.myfetcher.GetColumnColor(comp.YID);
                    DrawInfo.CenterContext.globalAlpha = 0.4;
                    DrawInfo.CenterContext.beginPath();
                    var thefirst = true;
                    var maxlinedist = comp.myfetcher.GetColumnPlotHints(comp.YID).MaxLineDist;
                    for (i = 0; i < xvals.length; i++) {
                        if (yvals[i] != null) {
                            var x = xvals[i];
                            var y = yvals[i];
                            if (HasYFunction)
                                y = comp.YFunction(y);
                            var psx = x * DrawInfo.ZoomFactX - DrawInfo.OffsetX;
                            psy = DrawInfo.PosY - DrawInfo.SizeY * 0.1 - (y - rangemin) / (rangemax - rangemin) * DrawInfo.SizeY * 0.8;
                            if ((!thefirst) && (x - xlast > maxlinedist))
                                thefirst = true;
                            if (thefirst) DrawInfo.CenterContext.moveTo(psx, psy);
                            else DrawInfo.CenterContext.lineTo(psx, psy);
                            thefirst = false;
                            var xlast = x;
                        }
                    }
                    DrawInfo.CenterContext.stroke();
                    DrawInfo.CenterContext.globalAlpha = 1.0;
                }

                if (true) {//Draw points
                    DrawInfo.CenterContext.fillStyle = comp.myfetcher.GetColumnColor(comp.YID);
                    for (i = 0; i < xvals.length; i++) {
                        if (yvals[i] != null) {
                            var x = xvals[i];
                            var y = yvals[i];
                            if (HasYFunction)
                                y = comp.YFunction(y);
                            var psx = x * DrawInfo.ZoomFactX - DrawInfo.OffsetX;
                            var psy = DrawInfo.PosY - DrawInfo.SizeY * 0.1 - (y - rangemin) / (rangemax - rangemin) * DrawInfo.SizeY * 0.8;
                            if ((!DrawInfo.MarkPresent) || (x < DrawInfo.MarkPos1) || (x > DrawInfo.MarkPos2))
                                DrawInfo.CenterContext.fillRect(Math.round(psx) - 1, Math.round(psy) - 1, psz, psz);
                            else
                                DrawInfo.CenterContext.fillarc(Math.round(psx), Math.round(psy), 3, 0, Math.PI * 2, true);
                        }
                    }
                }

            }
        }
        this.AllowToolTipsInCurrentView = NrPointsDrawn < 5000;
    }

    //returns information about the point closest to a screen position, or null if nothing is sufficiently close
    that.GetPointAtScreenPos = function (xp, yp) {
        if (!("LastDrawInfo" in this))
            return null;
        if (this.LastDrawInfo.ZoomFactX < this.MinDrawZoomFactX)
            return null;
        var rangemin = this.YMinVal;
        var rangemax = this.YMaxVal;

        var mindst = 12;
        var theresponse = null;
        for (var compid in this.Components) {
            var comp = this.Components[compid];
            if (comp.Active) {
                var HasYFunction = "YFunction" in comp;
                var points = comp.myfetcher.GetColumnPoints(this.PosMin, this.PosMax, comp.YID);
                var xvals = points.XVals;
                var yvals = points.YVals;
                for (i = 0; i < xvals.length; i++) {
                    if (yvals[i] != null) {
                        var x = xvals[i];
                        var y = yvals[i];
                        if (HasYFunction)
                            y = comp.YFunction(y);
                        var psx = Math.round(x * this.LastDrawInfo.ZoomFactX - this.LastDrawInfo.OffsetX);
                        var psy = Math.round(/*this.LastDrawInfo.PosY -*/this.LastDrawInfo.SizeY * 0.1 + (y - rangemin) / (rangemax - rangemin) * this.LastDrawInfo.SizeY * 0.8);
                        var dst = Math.abs(psx - xp) + Math.abs(psy - yp);
                        if (dst < mindst) {
                            mindst = dst;
                            theresponse = new Object;
                            theresponse.DataFetcher = comp.myfetcher;
                            theresponse.DownloadIndex = points.StartIndex + i;
                            theresponse.CompID = comp.YID;
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
    that.GetToolTipInfo = function (xp, yp) {
        if (!("GenerateToolTipInfo" in this))
            return null;
        if (!this.AllowToolTipsInCurrentView)
            return null;
        var pointinfo = this.GetPointAtScreenPos(xp, yp);
        var thetip = null;
        if (pointinfo != null) {
            var thetip = new Object;
            thetip.xp = pointinfo.PosX;
            thetip.yp = pointinfo.PosY;
            thetip.lines = this.GenerateToolTipInfo(pointinfo.DataFetcher, pointinfo.DownloadIndex, pointinfo.CompID); //todo: use same object as in OnClick
        }
        return thetip;
    }

    that.OnClick = function (xp, yp) {
        var pointinfo = this.GetPointAtScreenPos(xp, yp);
        if (pointinfo != null) {
            if ("OnPointClickEvent" in this)
                this.OnPointClickEvent(pointinfo);
        }
    }



    //add a new component to the plot
    that.AddComponent = function (icomp) {
        this.Components[icomp.YID] = icomp;
        return icomp;
    }

    //response function that handles a click on a component visibility checkbox
    that.OnCompClick = function (event) {
        var checkid = event.target.id;
        var id = checkid.split("CompCheck_")[1];
        var chk = $('#' + checkid).attr('checked');
        this.ModifyComponentActiveStatus(id, chk);
    }

    //internal
    that.ModifyComponentActiveStatus = function (cmpid, newstatus) {
        if (this.Components[cmpid].Active == newstatus) return;
        this.Components[cmpid].Active = newstatus;
        if (newstatus)
            this.Components[cmpid].myfetcher.ColumnActivate(cmpid);
        else
            this.Components[cmpid].myfetcher.ColumnDesActivate(cmpid);
        this.myPlot.Draw();
    }


    //A convenience function:
    //This function automatically generates the html elements inside a div that allow the user to control the visibility of the components
    that.CreateActiveComponentsController = function (divid, colcount) {
        var compkeys = []
        for (var compkey in this.Components)
            compkeys.push(compkey);
        rs = "<table>";
        for (var rownr = 0; rownr < compkeys.length / colcount; rownr++) {
            rs += "<tr>";
            for (var colnr = 0; colnr < colcount; colnr++) {
                rs += "<td>";
                var compnr = rownr * colcount + colnr;
                if (compnr < compkeys.length) {
                    var yid = compkeys[compnr];
                    var comp = this.Components[yid];
                    var checkid = "CompCheck_" + yid;
                    //                    rs += "<div>";
                    rs += '<input type="checkbox" id="' + checkid + '" name="' + checkid + '" value="' + checkid + '"/>';
                    rs += '<span style="background:' + comp.GetColor() + ';">&nbsp;&nbsp;&nbsp;</span>&nbsp;';
                    rs += yid;
                    //                    rs += "</div>";
                }
                rs += "</td>";
            }
            rs += "</tr>";
        }
        rs += "</table>";

        $("#" + divid).html(rs);

        for (var compkey in this.Components) {
            var yid = this.Components[compkey].YID;
            var checkid = "CompCheck_" + yid;
            $("#" + checkid).click($.proxy(that.OnCompClick, that));
        }

    }


    return that;
}
