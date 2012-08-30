
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// ChannelPlotChannel Class: implements a single channel in a DQX.ChannelPlot.Plotter (pure virtual base class)
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

DQX.ChannelPlot.Channel = function (imyPlot) {
    var that = {}
    that.myPlot = imyPlot;
    that.fixedSizeY = -1; //negative value= flexible

    //Draws a vertical scale in the left panel of the channel
    that.drawVertScale = function (drawInfo, minvl, maxvl) {
        var jumps = DQX.DrawUtil.getScaleJump((maxvl - minvl) / 15);

        drawInfo.leftContext.fillStyle = "black";
        drawInfo.leftContext.font = '10px sans-serif';
        drawInfo.leftContext.textBaseline = 'bottom';
        drawInfo.leftContext.textAlign = 'right';

        drawInfo.leftContext.strokeStyle = "black";
        drawInfo.centerContext.strokeStyle = "black";
        drawInfo.leftContext.globalAlpha = 0.6;
        drawInfo.centerContext.globalAlpha = 0.2;
        for (j = Math.ceil(minvl / jumps.Jump1); j <= Math.floor(maxvl / jumps.Jump1); j++) {
            vl = j * jumps.Jump1;
            yp = Math.round(drawInfo.PosY - drawInfo.sizeY * 0.1 - (vl - minvl) / (maxvl - minvl) * drawInfo.sizeY * 0.8) - 0.5;
            if (j % jumps.JumpReduc == 0) {
                drawInfo.leftContext.beginPath();
                drawInfo.leftContext.moveTo(drawInfo.LeftSizeX - 8, yp);
                drawInfo.leftContext.lineTo(drawInfo.LeftSizeX, yp);
                drawInfo.leftContext.stroke();
                drawInfo.leftContext.fillText(vl, drawInfo.LeftSizeX - 12, yp + 5);
                drawInfo.centerContext.beginPath();
                drawInfo.centerContext.moveTo(0, yp);
                drawInfo.centerContext.lineTo(drawInfo.sizeX, yp);
                drawInfo.centerContext.stroke();
            }
            else {
                drawInfo.leftContext.beginPath();
                drawInfo.leftContext.moveTo(drawInfo.LeftSizeX - 4, yp);
                drawInfo.leftContext.lineTo(drawInfo.LeftSizeX, yp);
                drawInfo.leftContext.stroke();
            }
        }
        drawInfo.leftContext.globalAlpha = 1;
        drawInfo.centerContext.globalAlpha = 1;

    }


    //Draws a message in the center panel of the channel
    that.drawMessage = function (drawInfo, txt) {
        drawInfo.centerContext.fillStyle = "black";
        drawInfo.centerContext.globalAlpha = 0.2;
        drawInfo.centerContext.fillRect(0, drawInfo.PosY - drawInfo.sizeY, drawInfo.sizeX, drawInfo.sizeY);
        drawInfo.centerContext.globalAlpha = 1.0;

        drawInfo.leftContext.fillStyle = "black";
        drawInfo.leftContext.globalAlpha = 0.2;
        drawInfo.leftContext.fillRect(0, drawInfo.PosY - drawInfo.sizeY, drawInfo.LeftSizeX, drawInfo.sizeY);
        drawInfo.leftContext.globalAlpha = 1.0;

        drawInfo.centerContext.fillStyle = "black";
        drawInfo.centerContext.font = '25px sans-serif';
        drawInfo.centerContext.textBaseline = 'bottom';
        drawInfo.centerContext.textAlign = 'center';
        drawInfo.centerContext.globalAlpha = 0.6;
        drawInfo.centerContext.fillText(txt, drawInfo.sizeX / 2, drawInfo.PosY - drawInfo.sizeY / 2 + 12);
        drawInfo.centerContext.globalAlpha = 1.0;
    }

    //Draws a title in the left panel of the channel
    that.drawTitle = function (drawInfo) {
        drawInfo.leftContext.save();
        drawInfo.leftContext.translate(0, drawInfo.PosY - drawInfo.sizeY / 2);
        drawInfo.leftContext.rotate(-Math.PI / 2);
        drawInfo.leftContext.textBaseline = 'top';
        drawInfo.leftContext.textAlign = "center";
        drawInfo.leftContext.font = '14px sans-serif';
        drawInfo.leftContext.fillStyle = "black";
        if ("myTitle" in this)
            drawInfo.leftContext.fillText(this.myTitle, 0, 5);
        if ("SubTitle" in this) {
            drawInfo.leftContext.font = '12px sans-serif';
            drawInfo.leftContext.fillStyle = "rgb(100,100,100)";
            drawInfo.leftContext.fillText(this.SubTitle, 0, 25);
        }
        drawInfo.leftContext.restore();
    }

    //Get tooltip info at a specific point in screen coordinates in the channel
    //Default behaviour: return null. This function can be overriden by a specific implementation of a channel
    //Note that the return object will be digested by the function DrawChannelToolTip
    that.getToolTipInfo = function (xp, yp) {
        return null;
    }

    //Handle a click event inside a channel
    //Default behaviour: do nothing. This function can be overriden by a specific implementation of a channel
    that.onClick = function (xp, yp) {
    }

    return that;
}
