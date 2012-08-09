
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// ChannelPlotChannelAnnotation: derives from ChannelPlotChannel, and plots genome annotation
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function ChannelPlotChannelAnnotation(imyPlot) {
    var that = new ChannelPlotChannel(imyPlot);
    that.FixedSizeY = 120;
    that.theannotfetcher = new AnnotDataFetcher(imyPlot.ServerUrl);
    that.Title = "Annotation";
    this.ClickInfo = [];

    that.Draw = function (DrawInfo) {
        this.DrawTitle(DrawInfo);
        if (DrawInfo.ZoomFactX < 1 / 16000.0) {
            this.DrawMessage(DrawInfo, "Zoom in to see annotation");
            return;
        }
        var ps = -4500;
        ranseed = 0;
        DrawInfo.CenterContext.strokeStyle = "black";
        var slotcount = 10;
        slotmaxpos = [];
        for (i = 0; i < 3; i++) slotmaxpos[i] = -100;

        var imin = Math.round((-400 + DrawInfo.OffsetX) / DrawInfo.ZoomFactX);
        var imax = Math.round((DrawInfo.SizeX + 10 + DrawInfo.OffsetX) / DrawInfo.ZoomFactX);

        if (!this.theannotfetcher.IsDataReady(imin, imax)) {
            DrawInfo.CenterContext.fillStyle = "rgb(255,0,0)";
            DrawInfo.CenterContext.font = '25px sans-serif';
            DrawInfo.CenterContext.textBaseline = 'bottom';
            DrawInfo.CenterContext.textAlign = 'center';
            DrawInfo.CenterContext.fillText("Fetching data...", DrawInfo.SizeX / 2, 30);
        }

        var annot = this.theannotfetcher.GetData(imin, imax);

        this.ClickInfo = [];
        for (i = 0; i < annot.Start.length; i++) {
            var label = annot.Name[i];
            ps = annot.Start[i];
            var len = annot.Stop[i] - annot.Start[i];
            var psx1 = ps * DrawInfo.ZoomFactX - DrawInfo.OffsetX;
            var psx2 = (ps + len) * DrawInfo.ZoomFactX - DrawInfo.OffsetX;

            DrawInfo.CenterContext.fillStyle = "black";
            DrawInfo.CenterContext.font = '10px sans-serif';
            DrawInfo.CenterContext.textBaseline = 'bottom';
            DrawInfo.CenterContext.textAlign = 'left';

            var abbrevlabel = label;

            for (slotnr = 0; (slotnr < slotcount) && (slotmaxpos[slotnr] > psx1); slotnr++);
            if (slotnr < slotcount) {
                var labellen = DrawInfo.CenterContext.measureText(label).width;
                var clickpt = new Object();
                clickpt.X0 = Math.round(psx1 + 2);
                clickpt.Y0 = Math.round(3 + 10 * slotnr);
                clickpt.Y1 = clickpt.Y0 + 10;
                clickpt.Name = label;
                clickpt.ID = annot.ID[i];
                clickpt.StartPs = annot.Start[i];
                clickpt.Len = len;

                DrawInfo.CenterContext.fillStyle = "rgb(100,200,100)";
                DrawInfo.CenterContext.beginPath();
                DrawInfo.CenterContext.rect(Math.round(psx1) + 0.5, Math.round(DrawInfo.PosY - clickpt.Y0 - 10) + 0.5, Math.round(psx2 - psx1), 8);
                DrawInfo.CenterContext.fillStyle = "rgb(100,200,100)";
                DrawInfo.CenterContext.fill();
                DrawInfo.CenterContext.stroke();

                DrawInfo.CenterContext.fillStyle = "black";
                DrawInfo.CenterContext.fillText(abbrevlabel, Math.round(psx2+2) + 0.5, DrawInfo.PosY - clickpt.Y0 + 0.5);
                slotmaxpos[slotnr] = psx2 + labellen + 6;

                clickpt.XCent = Math.round((psx1+psx2)/2);
                clickpt.X1 = psx2 + labellen;

                this.ClickInfo.push(clickpt);
            }
            if (slotnr == slotcount) {
                DrawInfo.CenterContext.fillStyle = "rgb(255,200,100)";
                DrawInfo.CenterContext.fillRect(Math.round(psx1 + 2) + 0.5, Math.round(DrawInfo.PosY - 17 - 10 * slotnr + 5) + 0.5, 20, 1.5);
            }

            ps += len;
        }
    }

    that.GetClickInfoAtPoint = function (xp, yp) {
        for (clicknr in this.ClickInfo) {
            var clickpt = this.ClickInfo[clicknr];
            if ((xp >= clickpt.X0) && (xp <= clickpt.X1) && (yp >= clickpt.Y0) && (yp <= clickpt.Y1) )
                return clickpt;
        }
        return null;
    }


    //returns the tooptip at a specific point in screen coordinates (null if none)
    that.GetToolTipInfo = function (xp, yp) {
        var clickpt = this.GetClickInfoAtPoint(xp, yp);
        var thetip = null;
        if (clickpt != null) {
            thetip = new Object;
            thetip.xp = clickpt.XCent;
            thetip.yp = clickpt.Y1 - 10;
            thetip.lines = [{ Text: clickpt.Name, Color: "black"}]
/*            thetip.lines.push({ Text: "ID: " + clickpt.ID, Color: "rgb(128,128,128)" });
            thetip.lines.push({ Text: "Position: " + clickpt.StartPs, Color: "rgb(128,128,128)" });
            thetip.lines.push({ Text: "Length: " + clickpt.Len, Color: "rgb(128,128,128)" });*/
        }
        return thetip;
    }

    that._CallBackPointInfoFetched_Annot = function (data) {
        DQXStopProcessing();
        var content = "";
        var url = "http://130.91.8.212/cgi-bin/hgGene?hgg_gene=" + data.geneid;
        content += '<a href="' + url + '" target="_blank">Gene link</a><p>'
        content+=DQXCreateKeyValueTable(data);
        DQXCreateFloatBox("Gene " + data.name, content);
    }

    that.OnClick = function (xp, yp) {
        var clickpt = this.GetClickInfoAtPoint(xp, yp);
        if (clickpt != null) {
            DQXSetProcessing("Downloading...");
            this.theannotfetcher.FetchFullAnnotInfo(clickpt.ID,
                $.proxy(this._CallBackPointInfoFetched_Annot,this),
                DQXCreateFailFunction("Failed to download data")
                );
        }
    }



    return that;
}
