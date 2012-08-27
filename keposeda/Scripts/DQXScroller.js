

DQX.HScrollBar = function(iCanvasID) {
    var that = DQX.CanvasElement(iCanvasID)
    that.SizeX = that.CanvasElement.width;
    that.SizeY = that.CanvasElement.height;
    that.RangeMin = 0;//zero fraction translates to this value
    that.RangeMax = 1; //one fraction translates to this value
    that.ScrollPos = 0.0; //scroll position, as fraction
    that.ScrollSize = 0.1; //size, as fraction
    that.MinScrollSize = 0.0005;//this determines the maximum zoom factor for the zoom slider
    that.myConsumer = null;

    that.zoomdragging = false;
    that.scrollerdragging = false;

    that.RegisterHandlers(that.CanvasElement);

    that.SetValue = function (iPos, iSize) {
        this.ScrollPos = iPos;
        this.ScrollSize = iSize;
        this.Draw();
    }

    that.SetRange = function (imin, imax) {
        this.RangeMin = imin;
        this.RangeMax = imax;
        this.Draw();
    }

    that.GetZoomFrac = function () {
        var zoomfrac = (Math.min(this.MinScrollSize / this.ScrollSize) - this.MinScrollSize) / (1 - this.MinScrollSize);
        return Math.log(1 + 100 * zoomfrac) / Math.log(1 + 100);
    }

    that.Resize = function (newsizex) {
        this.SizeX = newsizex;
        $(this.CanvasElement).width(newsizex);
        this.CanvasElement.width = newsizex;
        this.Draw();
    }


    that.DrawTriangle = function(context,psx,dir) {
        var ypc=Math.round(this.SizeY/2);
        var sze=Math.round(this.SizeY/4);
        context.beginPath();
        context.moveTo(psx, ypc-sze);
        context.lineTo(psx+dir*sze, ypc);
        context.lineTo(psx, ypc+sze);
        context.closePath();
        context.fill();
    }

    that.Draw = function () {
        var SepSizeX = 15;

        var centercontext = this.CanvasElement.getContext("2d");

        var backgrad1 = centercontext.createLinearGradient(0, 0, 0, this.SizeY);
        backgrad1.addColorStop(0, "rgb(60,60,60)");
        backgrad1.addColorStop(0.4, "rgb(160,160,160)");
        backgrad1.addColorStop(1, "rgb(20,20,20)");

        var backgrad2 = centercontext.createLinearGradient(0, 0, 0, this.SizeY);
        backgrad2.addColorStop(0, "rgb(20,20,20)");
        backgrad2.addColorStop(0.4, "rgb(130,130,130)");
        backgrad2.addColorStop(1, "rgb(0,0,0)");

        centercontext.fillStyle = backgrad1;
        centercontext.fillRect(0, 0, this.SizeX, this.SizeY);

        this.ScrollAreaStartX = Math.round(this.SizeX * 0.3) + SepSizeX;
        this.ScrollAreaSizeX = this.SizeX - this.ScrollAreaStartX - SepSizeX;
        this.ZoomAreaStartX = SepSizeX;
        this.ZoomAreaSizeX = this.ScrollAreaStartX - this.ZoomAreaStartX - SepSizeX;

        //---------- Draw zoom bar -------------------
        var px1 = this.ZoomAreaStartX;
        var px2 = this.ZoomAreaStartX + Math.round(this.GetZoomFrac() * this.ZoomAreaSizeX);
        px2 = Math.min(px2, this.ZoomAreaStartX + this.ZoomAreaSizeX);
        centercontext.globalAlpha = 0.4;
        var backgrad = centercontext.createLinearGradient(0, 5, 0, this.SizeY - 5);
        backgrad.addColorStop(0, "rgb(0,192,0)");
        backgrad.addColorStop(0.3, "rgb(192,255,128)");
        backgrad.addColorStop(1, "rgb(0,192,0)");
        centercontext.fillStyle = backgrad;
        centercontext.fillRect(px1, 6, px2 - px1, this.SizeY - 12);
        //arrow
        centercontext.fillStyle = "rgb(128,255,128)";
        this.DrawTriangle(centercontext, px2 + 3, 1);
        centercontext.fillStyle = "rgb(40,100,40)";
        this.DrawTriangle(centercontext, px2 - 3, -1);

        //text
        var txt = "Zoom: " + (1.0 / that.ScrollSize).toFixed(that.ScrollSize>0.1?1:0) + "x";
        centercontext.globalAlpha = 0.75;
        centercontext.fillStyle = "rgb(255,255,200)";
        centercontext.font = '13px sans-serif';
        centercontext.textBaseline = 'middle';
        centercontext.shadowColor = "black";
        centercontext.shadowBlur = 3;
        if (px2 + 15 + centercontext.measureText(txt).width < this.ZoomAreaStartX + this.ZoomAreaSizeX) {
            centercontext.textAlign = 'left';
            centercontext.fillText(txt, px2 + 15, this.SizeY / 2);
        }
        else {
            centercontext.textAlign = 'right';
            centercontext.fillText(txt, px2 - 15, this.SizeY / 2);
        }
        centercontext.shadowColor = "transparent";




        //---------- Draw scroll bar -----------------
        var px1 = this.ScrollAreaStartX + Math.round(this.ScrollPos * this.ScrollAreaSizeX);
        var px2 = this.ScrollAreaStartX + Math.round((this.ScrollPos + this.ScrollSize) * this.ScrollAreaSizeX);
        if (px1 < this.ScrollAreaStartX) px1 = this.ScrollAreaStartX;
        if (px2 > this.ScrollAreaStartX + this.ScrollAreaSizeX) px2 = this.ScrollAreaStartX + this.ScrollAreaSizeX;

        //scroll bar position indicators
        centercontext.globalAlpha = 0.7;
        centercontext.fillStyle = "rgb(255,255,200)";
        centercontext.font = '11px sans-serif';
        centercontext.textBaseline = 'top';
        centercontext.textAlign = 'center';
        centercontext.shadowColor = "black";
        centercontext.shadowBlur = 3;
        var scalejumps = DQX.DrawUtil.GetScaleJump(20 / this.SizeX * (this.RangeMax - this.RangeMin));
        var i2 = ((this.RangeMax - this.RangeMin)) / scalejumps.Jump1;
        for (var i = 0; i < i2; i++) {
            var x = i * scalejumps.Jump1;
            var psx = this.ScrollAreaStartX + Math.round((x - this.RangeMin) / (this.RangeMax - this.RangeMin) * this.ScrollAreaSizeX);
            if ((psx > this.ScrollAreaStartX + 10) && (psx < this.ScrollAreaStartX + this.ScrollAreaSizeX - 10)) {
                if (i % scalejumps.JumpReduc == 0) {
                    centercontext.fillText(x, psx, 10);
                }
            }
        }
        centercontext.shadowColor = "transparent";

        //scroll bar bar
        centercontext.globalAlpha = 0.35;
        var backgrad = centercontext.createLinearGradient(px1, 0, px2, 0);
        backgrad.addColorStop(0, "rgb(160,255,160)");
        backgrad.addColorStop(0.25, "rgb(0,192,0)");
        backgrad.addColorStop(0.75, "rgb(0,192,0)");
        backgrad.addColorStop(1, "rgb(160,255,160)");
        centercontext.fillStyle = backgrad;
        centercontext.fillRect(px1, 2, px2 - px1, this.SizeY - 4);
        //scroll bar arrows
        centercontext.fillStyle = "rgb(128,255,128)";
        this.DrawTriangle(centercontext, px2 + 3, 1);
        this.DrawTriangle(centercontext, px1 - 3, -1);



        centercontext.globalAlpha = 1.0;

        //draw separators
        centercontext.fillStyle = backgrad2;
        centercontext.fillRect(0, 0, SepSizeX, this.SizeY);
        centercontext.fillRect(this.ScrollAreaStartX - SepSizeX, 0, SepSizeX, this.SizeY);
        centercontext.fillRect(this.ScrollAreaStartX + this.ScrollAreaSizeX, 0, SepSizeX, this.SizeY);

    }

    that.OnMouseDown = function (ev) {
        var px = this.GetEventPosX(ev);
        this.scrollerdragging = false;
        this.zoomdragging = false;
        if ((px >= this.ScrollAreaStartX) && (px <= this.ScrollAreaStartX + this.ScrollAreaSizeX)) {//in scroller area
            this.scrollerdragging = true;
            var px1 = this.ScrollAreaStartX + Math.round(this.ScrollPos * this.ScrollAreaSizeX);
            this.dragxoffset = px - px1;
        }
        if ((px >= this.ZoomAreaStartX) && (px <= this.ZoomAreaStartX + this.ZoomAreaSizeX)) {//in zoom area
            this.zoomdragging = true;
            this.dragstartx = px;
            this.dragstartzoompos=this.ZoomAreaStartX + Math.round(this.GetZoomFrac() * this.ZoomAreaSizeX);
        }
    }

    that.OnMouseMove = function (ev) {
        var px = this.GetEventPosX(ev);
        if (this.scrollerdragging) {
            var dragx = px - this.dragxoffset;
            this.ScrollPos = ((dragx - this.ScrollAreaStartX) * 1.0 / this.ScrollAreaSizeX);
            if (this.ScrollPos < 0) this.ScrollPos = 0;
            if (this.ScrollPos + this.ScrollSize > 1) this.ScrollPos = 1 - this.ScrollSize;
            this.Draw();
            if ('myConsumer' in this)
                this.myConsumer.ScrollTo(this.ScrollPos);
        }
        if (this.zoomdragging) {
            var newzoompos = px - this.dragstartx + this.dragstartzoompos;
            var newzoomfrac = (newzoompos - this.ZoomAreaStartX) / this.ZoomAreaSizeX;
            newzoomfrac = Math.max(0, newzoomfrac);
            newzoomfrac = Math.min(1, newzoomfrac);
            newzoomfrac = (Math.exp(newzoomfrac * Math.log(1 + 100)) - 1) / 100;
            var newscrollsize = this.MinScrollSize / (newzoomfrac * (1 - this.MinScrollSize) + this.MinScrollSize);
            newscrollsize = Math.min(1, newscrollsize);
            newscrollsize = Math.max(this.MinScrollSize, newscrollsize);
            this.ScrollPos = this.ScrollPos + this.ScrollSize / 2 - newscrollsize / 2;
            this.ScrollSize = newscrollsize;
            if (this.ScrollPos + this.ScrollSize > 1) this.ScrollPos = 1 - this.ScrollSize;
            if (this.ScrollPos < 0) this.ScrollPos = 0;
            this.Draw();
            if ('myConsumer' in this)
                this.myConsumer.ZoomScrollTo(this.ScrollPos, this.ScrollSize);
        }
    }

    that.OnMouseUp = function (ev) {
    }

    that.OnMouseHover = function (ev) {

        var px = this.GetEventPosX(ev);
        var sizemouse = false;
        if ((px >= this.ScrollAreaStartX) && (px <= this.ScrollAreaStartX + this.ScrollAreaSizeX))
            sizemouse = true;
        if ((px >= this.ZoomAreaStartX) && (px <= this.ZoomAreaStartX + this.ZoomAreaSizeX))
            sizemouse=true;

        $('#' + this.CanvasID).css('cursor', sizemouse ? 'w-resize' : 'auto');
    }


    return that;
}


