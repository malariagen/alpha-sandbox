
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// ChannelPlotChannel Class: implements a single channel in a DQX.ChannelPlot.Plotter (pure virtual base class)
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

DQX.ChannelPlot.Channel = function (imyPlot) {
    var that = {}
    that.myPlot = imyPlot;
    that.FixedSizeY = -1; //negative value= flexible

    //Draws a vertical scale in the left panel of the channel
    that.DrawVertScale = function (DrawInfo, minvl, maxvl) {
        var jumps = DQX.DrawUtil.GetScaleJump((maxvl - minvl) / 15);

        DrawInfo.LeftContext.fillStyle = "black";
        DrawInfo.LeftContext.font = '10px sans-serif';
        DrawInfo.LeftContext.textBaseline = 'bottom';
        DrawInfo.LeftContext.textAlign = 'right';

        DrawInfo.LeftContext.strokeStyle = "black";
        DrawInfo.CenterContext.strokeStyle = "black";
        DrawInfo.LeftContext.globalAlpha = 0.6;
        DrawInfo.CenterContext.globalAlpha = 0.2;
        for (j = Math.ceil(minvl / jumps.Jump1); j <= Math.floor(maxvl / jumps.Jump1); j++) {
            vl = j * jumps.Jump1;
            yp = Math.round(DrawInfo.PosY - DrawInfo.SizeY * 0.1 - (vl - minvl) / (maxvl - minvl) * DrawInfo.SizeY * 0.8) - 0.5;
            if (j % jumps.JumpReduc == 0) {
                DrawInfo.LeftContext.beginPath();
                DrawInfo.LeftContext.moveTo(DrawInfo.LeftSizeX - 8, yp);
                DrawInfo.LeftContext.lineTo(DrawInfo.LeftSizeX, yp);
                DrawInfo.LeftContext.stroke();
                DrawInfo.LeftContext.fillText(vl, DrawInfo.LeftSizeX - 12, yp + 5);
                DrawInfo.CenterContext.beginPath();
                DrawInfo.CenterContext.moveTo(0, yp);
                DrawInfo.CenterContext.lineTo(DrawInfo.SizeX, yp);
                DrawInfo.CenterContext.stroke();
            }
            else {
                DrawInfo.LeftContext.beginPath();
                DrawInfo.LeftContext.moveTo(DrawInfo.LeftSizeX - 4, yp);
                DrawInfo.LeftContext.lineTo(DrawInfo.LeftSizeX, yp);
                DrawInfo.LeftContext.stroke();
            }
        }
        DrawInfo.LeftContext.globalAlpha = 1;
        DrawInfo.CenterContext.globalAlpha = 1;

    }


    //Draws a message in the center panel of the channel
    that.DrawMessage = function (DrawInfo, txt) {
        DrawInfo.CenterContext.fillStyle = "black";
        DrawInfo.CenterContext.globalAlpha = 0.2;
        DrawInfo.CenterContext.fillRect(0, DrawInfo.PosY - DrawInfo.SizeY, DrawInfo.SizeX, DrawInfo.SizeY);
        DrawInfo.CenterContext.globalAlpha = 1.0;

        DrawInfo.LeftContext.fillStyle = "black";
        DrawInfo.LeftContext.globalAlpha = 0.2;
        DrawInfo.LeftContext.fillRect(0, DrawInfo.PosY - DrawInfo.SizeY, DrawInfo.LeftSizeX, DrawInfo.SizeY);
        DrawInfo.LeftContext.globalAlpha = 1.0;

        DrawInfo.CenterContext.fillStyle = "black";
        DrawInfo.CenterContext.font = '25px sans-serif';
        DrawInfo.CenterContext.textBaseline = 'bottom';
        DrawInfo.CenterContext.textAlign = 'center';
        DrawInfo.CenterContext.globalAlpha = 0.6;
        DrawInfo.CenterContext.fillText(txt, DrawInfo.SizeX / 2, DrawInfo.PosY - DrawInfo.SizeY / 2 + 12);
        DrawInfo.CenterContext.globalAlpha = 1.0;
    }

    //Draws a title in the left panel of the channel
    that.DrawTitle = function (DrawInfo) {
        DrawInfo.LeftContext.save();
        DrawInfo.LeftContext.translate(0, DrawInfo.PosY - DrawInfo.SizeY / 2);
        DrawInfo.LeftContext.rotate(-Math.PI / 2);
        DrawInfo.LeftContext.textBaseline = 'top';
        DrawInfo.LeftContext.textAlign = "center";
        DrawInfo.LeftContext.font = '14px sans-serif';
        DrawInfo.LeftContext.fillStyle = "black";
        if ("Title" in this)
            DrawInfo.LeftContext.fillText(this.Title, 0, 5);
        if ("SubTitle" in this) {
            DrawInfo.LeftContext.font = '12px sans-serif';
            DrawInfo.LeftContext.fillStyle = "rgb(100,100,100)";
            DrawInfo.LeftContext.fillText(this.SubTitle, 0, 25);
        }
        DrawInfo.LeftContext.restore();
    }

    //Get tooltip info at a specific point in screen coordinates in the channel
    //Default behaviour: return null. This function can be overriden by a specific implementation of a channel
    //Note that the return object will be digested by the function DrawChannelToolTip
    that.GetToolTipInfo = function (xp, yp) {
        return null;
    }

    //Handle a click event inside a channel
    //Default behaviour: do nothing. This function can be overriden by a specific implementation of a channel
    that.OnClick = function (xp, yp) {
    }

    return that;
}
