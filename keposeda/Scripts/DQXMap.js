﻿

DQX.SVG = {};

DQX.SVG.PieChart = function () {
    var that = {};
    that.myCallbackObject = null;
    that.myParts = [];

    that.addPart = function (ifrac, icolor, iid) {
        that.myParts.push({ frac: ifrac, color: icolor, id: iid });
    }

    that.render = function (x0, y0, rd) {

        var sum = 0;
        for (var i = 0; i < this.myParts.length; i++) sum += this.myParts[i].frac;
        if (sum <= 0) return;
        var sumpart = 0;
        var data = '<g>';

        for (var i = 0; i < this.myParts.length; i++) {
            var sumpart2 = sumpart + this.myParts[i].frac;
            data += this._renderPie(x0, y0,
                sumpart / sum * 2 * Math.PI,
                sumpart2 / sum * 2 * Math.PI, rd - 1,
                this.myParts[i].color, i);
            sumpart = sumpart2;
        }
        data += '</g>';
        return data;
    }

    that._renderPie = function (x0, y0, ang1, ang2, rd, color, id) {
        var rs = '<path class="piepart" d="';
        var stx0 = x0.toFixed(1);
        var sty0 = y0.toFixed(1);
        var strd = rd.toFixed(1);
        var stpx1 = (x0 + rd * Math.cos(ang1)).toFixed(1);
        var stpy1 = (y0 + rd * Math.sin(ang1)).toFixed(1);
        var stpx2 = (x0 + rd * Math.cos(ang2)).toFixed(1);
        var stpy2 = (y0 + rd * Math.sin(ang2)).toFixed(1);
        var lenflag = ((ang2 - ang1) > Math.PI) ? 1 : 0;
        rs += 'M' + stx0 + ',' + sty0 + ' ';
        rs += 'L' + stpx1 + ',' + stpy1 + ' ';
        rs += 'A' + strd + ',' + strd + ' 0 ' + lenflag + ',1 ' + stpx2 + ',' + stpy2 + ' ';
        rs += 'Z" style="fill:' + color.toString() + '; "';

        if (this.myCallbackObject)
            rs += 'onclick="{fn}"'.DQXformat({ fn: DQX.ObjectMapper.CreateCallBackFunctionString(this.myCallbackObject, 'pieClick', id) });

        rs += '/>';
        return rs;
    }


    return that;
}



//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

DQX.GMaps = {}




//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

DQX.GMaps.Coord = function (longit, lattit) {
    var that = {};
    that.longit = longit;
    that.lattit = lattit;

    that.toGoogleLatLng = function () {
        return new google.maps.LatLng(this.lattit,this.longit);
    }

    return that;
}


//////////////////////////////////////////////////////////////////////////////////////////
// Class displaying a set of points
//////////////////////////////////////////////////////////////////////////////////////////

DQX.GMaps.PointSet = function (imapobject, iminzoomlevel, bitmapfile) {
    var that = {};

    that.myMapObject = imapobject;
    that.minZoomlevel = iminzoomlevel;
    that.myMapObject._addOverlay(that);
    that.myPointSet = [];

    that.image = new google.maps.MarkerImage(bitmapfile, null, null, new google.maps.Point(10, 10));
    that.visibleUser = true;
    that.visibleZoomlevel = imapobject.myMap.zoom >= iminzoomlevel;
    that._currentVisible = true;

    that.clearPoints = function () {
        for (var pointnr = 0; pointnr < this.myPointSet.length; pointnr++)
            this.myPointSet[pointnr].marker.setMap(null);
        this.myPointSet = [];
    }

    that._handleOnPointClicked = function (pointnr) {
        alert('clicked point ' + pointnr);
    }

    that._updateVisible = function () {
        var newstatus = (this.visibleUser) && (this.myMapObject.myMap.zoom >= this.minZoomlevel);
        if (newstatus != this._currentVisible) {
            this._currentVisible = newstatus;
            for (var pointnr = 0; pointnr < this.myPointSet.length; pointnr++) {
                if (!newstatus)
                    this.myPointSet[pointnr].marker.setMap(null);
                else
                    this.myPointSet[pointnr].marker.setMap(this.myMapObject.myMap);
            }
        }
    }

    that.setPoints = function (ipointset) {
        this.clearPoints();
        this.myPointSet = ipointset;
        for (var i = 0; i < ipointset.length; i++) {
            var obj = this;
            (function (iarg) {//closure because we need persistent counter
                var pointnr = iarg;
                obj.myPointSet[pointnr].marker = new google.maps.Marker({
                    position: new google.maps.LatLng(ipointset[pointnr].lattit, ipointset[pointnr].longit),
                    icon: obj.image,
                    map: obj.myMapObject.myMap
                });
                google.maps.event.addListener(obj.myPointSet[pointnr].marker, 'click',
                function () { obj._handleOnPointClicked(pointnr); }
                );
            })(i);
        }
        this._updateVisible();
    }


    that.setVisible = function (status) {
        this.visibleUser = status;
        this._updateVisible();
    }


    that.onZoomLevelChanged = function () {
        this._updateVisible();
    }

    return that;
}



//////////////////////////////////////////////////////////////////////////////////////////
// Class displaying a set of points as a heatmap
//////////////////////////////////////////////////////////////////////////////////////////

DQX.GMaps.PointSetHeatmap = function (imapobject, igradient) {
    var that = {};

    that.myMapObject = imapobject;
    that.myPointSet = [];
    that._myHeatMap = null;
    that.myGradient = igradient;

    that.clearPoints = function () {
        if (that._myHeatMap != null)
            that._myHeatMap.setMap(null);
        that._myHeatMap = null;
    }

    that.setPoints = function (ipointset) {
        this.clearPoints();

        var heatmapData = [];
        for (var pointnr = 0; pointnr < ipointset.length; pointnr++)
            heatmapData.push({
                location: new google.maps.LatLng(ipointset[pointnr].lattit, ipointset[pointnr].longit),
                weight: 1
            });
        that._myHeatMap = new google.maps.visualization.HeatmapLayer({
            data: heatmapData,
            dissipating: false,
            radius: 3.5,
            opacity: 0.4,
            maxIntensity:5,
            gradient: this.myGradient
        });
        that._myHeatMap.setMap(this.myMapObject.myMap);
    }

    return that;
}



//////////////////////////////////////////////////////////////////////////////////////////
// Base class for a Google Maps overlay
//////////////////////////////////////////////////////////////////////////////////////////

DQX.GMaps.Overlay = {};

DQX.GMaps.Overlay._Base = function (imapobject, iid) {
    var that = new google.maps.OverlayView();
    that.myMapObject = imapobject;
    that.myID = iid;
    imapobject._addOverlay(that);
    that.setMap(that.myMapObject.myMap);

    //if dist is defined, it converts a distance in km to pixels (approx.)
    that.convCoordToPixels = function (coord, dist) {
        var overlayProjection = this.getProjection();
        var pt = overlayProjection.fromLatLngToDivPixel(coord.toGoogleLatLng());
        if (typeof dist != 'undefined') {
            var coord2 = DQX.GMaps.Coord(coord.longit, coord.lattit - +(dist / 40000.0 * 360));
            var pt2 = overlayProjection.fromLatLngToDivPixel(coord2.toGoogleLatLng());
            pt.dist = Math.abs(pt.y - pt2.y);
        }
        return pt;
    }

    that.remove = function () {
        this.setMap(null);
    }



    that.onAdd = function () {
        this.myDiv = document.createElement('div');
        this.myDiv.style.position = 'absolute';
//        this.myDiv.style.backgroundColor = 'rgba(255,0,0,0.25)';
        var panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(this.myDiv);

        google.maps.event.addDomListener(this.myDiv, 'mouseover', function () { $(this).css('cursor', 'pointer'); });
    }

    that.draw = function () {
        var bb = this.render();
        this.myDiv.style.left = bb.x0 + 'px';
        this.myDiv.style.top = bb.y0 + 'px';
        this.myDiv.style.width = (bb.x1 - bb.x0 + 1) + 'px';
        this.myDiv.style.height = (bb.y1 - bb.y0) + 'px';
    }

    that.onRemove = function () {
        this.myDiv.parentNode.removeChild(this.myDiv);
        this.myDiv = null;
    }

    return that;
}


//////////////////////////////////////////////////////////////////////////////////////////
// Class for a pie chart Google Maps overlay
//////////////////////////////////////////////////////////////////////////////////////////
//icentercoord of type DQX.GMaps.Coord
//iradius in km
//ichart of type DQX.SVG.PieChart

DQX.GMaps.Overlay.PieChart = function (imapobject, iid, icentercoord, iradius, ichart) {
    var that = DQX.GMaps.Overlay._Base(imapobject, iid);
    that.myID = iid;
    that.myCenterCoord = icentercoord;
    that.myRadius = iradius;
    that.myChart = ichart;
    that.myChart.myCallbackObject = that;
    DQX.ObjectMapper.Add(that);

    that.render = function () {
        var ps = this.convCoordToPixels(this.myCenterCoord, this.myRadius);
        var bb = {};
        bb.x0 = ps.x - ps.dist;
        bb.y0 = ps.y - ps.dist;
        bb.x1 = ps.x + ps.dist;
        bb.y1 = ps.y + ps.dist;
        var data = "<svg width={w} height={h}>".DQXformat({ w: 2 * ps.dist, h: 2 * ps.dist });
        data += this.myChart.render(ps.dist, ps.dist, ps.dist);
        data += "</svg>";
        this.myDiv.innerHTML = data;
        return bb;
    }

    that.pieClick = function (pienr) {
        alert('clicked ' + that.myID+ ' '+pienr);
    }

    return that;
}



//////////////////////////////////////////////////////////////////////////////////////////
// Class Encapsulating Google Maps view with overlays
//////////////////////////////////////////////////////////////////////////////////////////

DQX.GMaps.GMap = function (idivid, istartcoord, istartzoomlevel) {
    var that = {};
    that.myDivID = idivid;

    var mapoptions = {
        zoom: istartzoomlevel,
        center: new google.maps.LatLng(istartcoord.lattit, istartcoord.longit),
        //        mapTypeId: google.maps.MapTypeId.ROADMAP
        mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.TERRAIN, google.maps.MapTypeId.SATELLITE, 'map_style_simple']
        }
    };


    that.myMap = new google.maps.Map(document.getElementById(idivid), mapoptions);
    that._myOverlays = [];

    that._addOverlay = function (obj) {
        that._myOverlays.push(obj);
    }

    that.removeOverlay = function (id) {
        for (var i = 0; i < that._myOverlays.length; i++) {
            if (that._myOverlays[i].myID == id) {
                that._myOverlays[i].remove();
                that._myOverlays.splice(i, 1);
                return;
            }
        }
    }

    that._handleOnZoomChanged = function () {
        for (var i = 0; i < this._myOverlays.length; i++)
            if ("onZoomLevelChanged" in this._myOverlays[i])
                this._myOverlays[i].onZoomLevelChanged();
    }

    google.maps.event.addListener(that.myMap, 'zoom_changed', $.proxy(that._handleOnZoomChanged, that));

    var styles = [
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [
            { lightness: 100 },
            { visibility: "simplified" }
          ]
        },
        {
            featureType: "road",
            elementType: "labels",
            stylers: [
            { visibility: "off" }
          ]
        },
        {
            featureType: 'poi',
            elementType: "all",
            stylers: [
            { visibility: "off" }
          ]
        },
        {
            featureType: 'administrative.country',
            elementType: "all",
            stylers: [
            { gamma: "0.1" }
          ]
        },
      ];

    var styledMap = new google.maps.StyledMapType(styles, { name: "Simple" });

    that.myMap.mapTypes.set('map_style_simple', styledMap);
    that.myMap.setMapTypeId('map_style_simple');




    return that;
}


function try1() {
/*    mymap.removeOverlay('a');

    var chart = DQX.SVG.PieChart();
    chart.addPart(0.6, DQX.Color(1, 0, 0));
    chart.addPart(0.4, DQX.Color(0, 0, 1));
    overlay = DQX.GMaps.Overlay.PieChart(mymap, 'b', DQX.GMaps.Coord(100, 18), 150.0, chart);*/

    markeroverlay.setVisible(false);
}


$(function () {

    var cx = 15;
    var cy = 100;

    mymap = DQX.GMaps.GMap('map_canvas',DQX.GMaps.Coord(100,15),5);

    //Create pie charts
    for (var i = 0; i < 20; i++) {
        var chart = DQX.SVG.PieChart();
        chart.addPart(Math.random(), DQX.Color(0, 0.7, 0));
        chart.addPart(Math.random(), DQX.Color(0, 0, 1));
        var overlay = DQX.GMaps.Overlay.PieChart(
            mymap, 'a' + i,
            DQX.GMaps.Coord(cy - 40 + 80 * Math.random(), cx - 20 + 40 * Math.random()),
            20 + 200 * Math.random(),
            chart);
    }

//    return;//!!!

    //Create points
    var pointset = [];
    for (var i = 0; i < 500; i++) {
        var r1 = 2 * Math.random() - 1;
        var r2 = 2 * Math.random() - 1;
        var x = 20 * (1 - Math.sin(3 * r1 * r1))-10;
        var y = 10 * Math.sin(x) + 40 * r2 * r2 * r2;
        pointset.push({ longit: (cy + y), lattit: (cx + x) });
    }

    markeroverlay = DQX.GMaps.PointSet(mymap, 4, 'Bitmaps/circle_red_small.png');
    markeroverlay.setPoints(pointset);

    heatoverlay = DQX.GMaps.PointSetHeatmap(mymap, ['rgba(255,255,255,0)', 'rgb(255,190,0)', 'rgb(255,0,0)']);
    heatoverlay.setPoints(pointset);



    //Create points
    var pointset = [];
    for (var i = 0; i < 500; i++) {
        var r1 = 2 * Math.random() - 1;
        var r2 = 2 * Math.random() - 1;
        var x = 20 * (r1 * r1 * r1);
        var y = 10 * Math.cos(x) + 10 * r2;
        pointset.push({ longit: (cy + y + 20), lattit: (cx + x - 15) });
    }

    markeroverlay = DQX.GMaps.PointSet(mymap, 4, 'Bitmaps/circle_blue_small.png');
    markeroverlay.setPoints(pointset);

    heatoverlay = DQX.GMaps.PointSetHeatmap(mymap, ['rgba(255,255,255,0)', 'rgb(0,190,255)', 'rgb(0,0,255)']);
    heatoverlay.setPoints(pointset);


})