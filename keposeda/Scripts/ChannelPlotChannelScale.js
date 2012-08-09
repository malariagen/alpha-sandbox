///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// ChannelPlotChannelScale: derives from ChannelPlotChannel, and plots a horizontal scale
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function ChannelPlotChannelScale(imyPlot) {
    var that = new ChannelPlotChannel(imyPlot);
    that.FixedSizeY = 25;

    that.Draw = function (DrawInfo) {
        //center background
        var backgrad = DrawInfo.CenterContext.createLinearGradient(0, DrawInfo.PosY - DrawInfo.SizeY, 0, DrawInfo.PosY);
        backgrad.addColorStop(0, "rgb(180,180,180)");
        backgrad.addColorStop(1, "rgb(120,120,120)");
        DrawInfo.CenterContext.fillStyle = backgrad;
        DrawInfo.CenterContext.fillRect(0, DrawInfo.PosY - DrawInfo.SizeY, DrawInfo.SizeX, DrawInfo.PosY);
        //left background
        backgrad = DrawInfo.LeftContext.createLinearGradient(0, DrawInfo.PosY - DrawInfo.SizeY, 0, DrawInfo.PosY);
        backgrad.addColorStop(0, "rgb(150,150,150)");
        backgrad.addColorStop(1, "rgb(100,100,100)");
        DrawInfo.LeftContext.fillStyle = backgrad;
        DrawInfo.LeftContext.fillRect(0, DrawInfo.PosY - DrawInfo.SizeY, DrawInfo.LeftSizeX, DrawInfo.PosY);

        DrawInfo.CenterContext.fillStyle = "black";
        DrawInfo.CenterContext.font = '10px sans-serif';
        DrawInfo.CenterContext.textBaseline = 'bottom';
        DrawInfo.CenterContext.textAlign = 'center';

        var i1 = Math.round(((-50 + DrawInfo.OffsetX) / DrawInfo.ZoomFactX) / DrawInfo.HorAxisScaleJumps.Jump1);
        if (i1 < 0) i1 = 0;
        var i2 = Math.round(((DrawInfo.SizeX + 50 + DrawInfo.OffsetX) / DrawInfo.ZoomFactX) / DrawInfo.HorAxisScaleJumps.Jump1);

        for (i = i1; i <= i2; i++) {
            DrawInfo.CenterContext.beginPath();
            var value = i * DrawInfo.HorAxisScaleJumps.Jump1;
            var psx = Math.round((value) * DrawInfo.ZoomFactX - DrawInfo.OffsetX) + 0.5;
            if ((psx >= -50) && (psx <= DrawInfo.SizeX + 50)) {
                DrawInfo.CenterContext.moveTo(psx, DrawInfo.PosY - DrawInfo.SizeY);
                DrawInfo.CenterContext.lineTo(psx, DrawInfo.PosY - DrawInfo.SizeY / 2);
                DrawInfo.CenterContext.strokeStyle = "gray";
                if (i % DrawInfo.HorAxisScaleJumps.JumpReduc == 0) {
                    DrawInfo.CenterContext.strokeStyle = "black";
                    DrawInfo.CenterContext.fillText(value / 1.0e6, psx, DrawInfo.PosY - 2);
                }
                DrawInfo.CenterContext.stroke();
            }
        }
    }
    return that;
}
