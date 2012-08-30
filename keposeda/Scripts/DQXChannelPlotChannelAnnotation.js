
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// ChannelPlotChannelAnnotation: derives from ChannelPlotChannel, and plots genome annotation
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

DQX.ChannelPlot.ChannelAnnotation = function (imyPlot) {
    var that = DQX.ChannelPlot.Channel(imyPlot);
    that.fixedSizeY = 120;
    that.theannotfetcher = new DQX.DataFetcher.Annot(imyPlot.config);
    that.myTitle = "Annotation";
    this._clickInfo = [];

    that.draw = function (drawInfo) {
        this.drawTitle(drawInfo);
        this._clickInfo = [];
        if (drawInfo.zoomFactX < 1 / 10000.0) {
            this.drawMessage(drawInfo, "Zoom in to see annotation");
            return;
        }
        var ps = -4500;
        ranseed = 0;
        drawInfo.centerContext.strokeStyle = "black";
        var slotcount = 10;
        slotmaxpos = [];
        for (i = 0; i < 3; i++) slotmaxpos[i] = -100;

        var imin = Math.round((-400 + drawInfo.offsetX) / drawInfo.zoomFactX);
        var imax = Math.round((drawInfo.sizeX + 10 + drawInfo.offsetX) / drawInfo.zoomFactX);

        if (!this.theannotfetcher.IsDataReady(imin, imax)) {
            drawInfo.centerContext.fillStyle = "rgb(255,0,0)";
            drawInfo.centerContext.font = '25px sans-serif';
            drawInfo.centerContext.textBaseline = 'bottom';
            drawInfo.centerContext.textAlign = 'center';
            drawInfo.centerContext.fillText("Fetching data...", drawInfo.sizeX / 2, 30);
        }

        var annot = this.theannotfetcher.getData(imin, imax);

        for (i = 0; i < annot.myStartList.length; i++) {
            var label = annot.myNameList[i];
            ps = annot.myStartList[i];
            var len = annot.myStopList[i] - annot.myStartList[i];
            var psx1 = ps * drawInfo.zoomFactX - drawInfo.offsetX;
            var psx2 = (ps + len) * drawInfo.zoomFactX - drawInfo.offsetX;

            drawInfo.centerContext.fillStyle = "black";
            drawInfo.centerContext.font = '10px sans-serif';
            drawInfo.centerContext.textBaseline = 'bottom';
            drawInfo.centerContext.textAlign = 'left';

            var abbrevlabel = label;

            for (slotnr = 0; (slotnr < slotcount) && (slotmaxpos[slotnr] > psx1); slotnr++);
            if (slotnr < slotcount) {
                var labellen = drawInfo.centerContext.measureText(label).width;
                var clickpt = {};
                clickpt.x0 = Math.round(psx1 + 2);
                clickpt.y0 = Math.round(3 + 10 * slotnr);
                clickpt.Y1 = clickpt.y0 + 10;
                clickpt.name = label;
                clickpt.ID = annot.myIDList[i];
                clickpt.StartPs = annot.myStartList[i];
                clickpt.Len = len;

                drawInfo.centerContext.fillStyle = "rgb(100,200,100)";
                drawInfo.centerContext.beginPath();
                drawInfo.centerContext.rect(Math.round(psx1) + 0.5, Math.round(drawInfo.PosY - clickpt.y0 - 10) + 0.5, Math.round(psx2 - psx1), 8);
                drawInfo.centerContext.fillStyle = "rgb(100,200,100)";
                drawInfo.centerContext.fill();
                drawInfo.centerContext.stroke();

                drawInfo.centerContext.fillStyle = "black";
                drawInfo.centerContext.fillText(abbrevlabel, Math.round(psx2 + 2) + 0.5, drawInfo.PosY - clickpt.y0 + 0.5);
                slotmaxpos[slotnr] = psx2 + labellen + 6;

                clickpt.XCent = Math.round((psx1 + psx2) / 2);
                clickpt.X1 = psx2 + labellen;

                this._clickInfo.push(clickpt);
            }
            if (slotnr == slotcount) {
                drawInfo.centerContext.fillStyle = "rgb(255,200,100)";
                drawInfo.centerContext.fillRect(Math.round(psx1 + 2) + 0.5, Math.round(drawInfo.PosY - 17 - 10 * slotnr + 5) + 0.5, 20, 1.5);
            }

            ps += len;
        }
    }

    that.getClickInfoAtPoint = function (xp, yp) {
        for (clicknr in this._clickInfo) {
            var clickpt = this._clickInfo[clicknr];
            if ((xp >= clickpt.x0) && (xp <= clickpt.X1) && (yp >= clickpt.y0) && (yp <= clickpt.Y1))
                return clickpt;
        }
        return null;
    }


    //returns the tooptip at a specific point in screen coordinates (null if none)
    that.getToolTipInfo = function (xp, yp) {
        var clickpt = this.getClickInfoAtPoint(xp, yp);
        var thetip = null;
        if (clickpt != null) {
            thetip = {};
            thetip.xp = clickpt.XCent;
            thetip.yp = clickpt.Y1 - 10;
            thetip.lines = [{ Text: clickpt.name, Color: "black"}];
        }
        return thetip;
    }

    that._callBackPointInfoFetched_Annot = function (data) {
        DQX.stopProcessing();
        var content = "";
        var url = "http://130.91.8.212/cgi-bin/hgGene?hgg_gene=" + data.geneid;
        content += '<a href="' + url + '" target="_blank">Gene link</a><p>'
        content += DQX.CreateKeyValueTable(data);
        DQX.CreateFloatBox("Gene " + data.name, content);
    }

    that.onClick = function (xp, yp) {
        var clickpt = this.getClickInfoAtPoint(xp, yp);
        if (clickpt != null) {
            DQX.setProcessing("Downloading...");
            this.theannotfetcher.fetchFullAnnotInfo(clickpt.ID,
                $.proxy(this._callBackPointInfoFetched_Annot, this),
                DQX.createFailFunction("Failed to download data")
                );
        }
    }



    return that;
}
