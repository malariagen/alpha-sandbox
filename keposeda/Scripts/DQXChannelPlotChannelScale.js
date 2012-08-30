///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// ChannelPlotChannelScale: derives from ChannelPlotChannel, and plots a horizontal scale
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

DQX.ChannelPlot.ChannelScale = function(imyPlot) {
    var that = DQX.ChannelPlot.Channel(imyPlot);
    that.fixedSizeY = 25;

    that.draw = function (drawInfo) {
        //center background
        var backgrad = drawInfo.centerContext.createLinearGradient(0, drawInfo.PosY - drawInfo.sizeY, 0, drawInfo.PosY);
        backgrad.addColorStop(0, "rgb(180,180,180)");
        backgrad.addColorStop(1, "rgb(120,120,120)");
        drawInfo.centerContext.fillStyle = backgrad;
        drawInfo.centerContext.fillRect(0, drawInfo.PosY - drawInfo.sizeY, drawInfo.sizeX, drawInfo.PosY);
        //left background
        backgrad = drawInfo.leftContext.createLinearGradient(0, drawInfo.PosY - drawInfo.sizeY, 0, drawInfo.PosY);
        backgrad.addColorStop(0, "rgb(150,150,150)");
        backgrad.addColorStop(1, "rgb(100,100,100)");
        drawInfo.leftContext.fillStyle = backgrad;
        drawInfo.leftContext.fillRect(0, drawInfo.PosY - drawInfo.sizeY, drawInfo.LeftSizeX, drawInfo.PosY);

        drawInfo.centerContext.fillStyle = "black";
        drawInfo.centerContext.font = '10px sans-serif';
        drawInfo.centerContext.textBaseline = 'bottom';
        drawInfo.centerContext.textAlign = 'center';

        var i1 = Math.round(((-50 + drawInfo.offsetX) / drawInfo.zoomFactX) / drawInfo.HorAxisScaleJumps.Jump1);
        if (i1 < 0) i1 = 0;
        var i2 = Math.round(((drawInfo.sizeX + 50 + drawInfo.offsetX) / drawInfo.zoomFactX) / drawInfo.HorAxisScaleJumps.Jump1);

        for (i = i1; i <= i2; i++) {
            drawInfo.centerContext.beginPath();
            var value = i * drawInfo.HorAxisScaleJumps.Jump1;
            var psx = Math.round((value) * drawInfo.zoomFactX - drawInfo.offsetX) + 0.5;
            if ((psx >= -50) && (psx <= drawInfo.sizeX + 50)) {
                drawInfo.centerContext.moveTo(psx, drawInfo.PosY - drawInfo.sizeY);
                drawInfo.centerContext.lineTo(psx, drawInfo.PosY - drawInfo.sizeY / 2);
                drawInfo.centerContext.strokeStyle = "gray";
                if (i % drawInfo.HorAxisScaleJumps.JumpReduc == 0) {
                    drawInfo.centerContext.strokeStyle = "black";
                    drawInfo.centerContext.fillText(value / 1.0e6, psx, drawInfo.PosY - 2);
                }
                drawInfo.centerContext.stroke();
            }
        }
    }
    return that;
}
