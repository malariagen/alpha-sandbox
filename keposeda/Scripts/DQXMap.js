

DQXGMAPPieChart.prototype = new google.maps.OverlayView();


function DQXGMAPPieChart(map, center, radius, values) {
    // Now initialize all properties.
    this.myCenter = center;
    this.myMap = map;
    this.myRadius = radius;
    this.myDiv = null;
    this.myValues = values;
    // Explicitly call setMap on this overlay
    this.setMap(map);
}


DQXGMAPPieChart.prototype.createPieString = function (ang1, ang2, rd, col) {
    var rs = '<path d="';

    var px1 = rd + rd * Math.cos(ang1);
    var py1 = rd + rd * Math.sin(ang1);
    var px2 = rd + rd * Math.cos(ang2);
    var py2 = rd + rd * Math.sin(ang2);
    var lenflag = ((ang2 - ang1) > Math.PI) ? 1 : 0;

    rs += 'M' + rd + ',' + rd + ' ';
    rs += 'L' + px1 + ',' + py1 + ' ';
    rs += 'A' + rd + ',' + rd + ' 0 ' + lenflag + ',1 ' + px2 + ',' + py2 + ' ';

    rs += 'Z" style="fill:'+col.toString()+'; fill-opacity: 1; stroke:black; stroke-width: 1"/>';

    return rs;
    //    data += '<path d="M200,200 L377,231 A180,180 0 0,1 138,369 z" style="fill:#00ff00; fill-opacity: 1; stroke:black; stroke-width: 1"/>';
}

DQXGMAPPieChart.prototype.createPieChart = function (values, rd) {
    var data = '';
    var sum = 0;
    for (var i = 0; i < values.length; i++) sum += values[i];

    var colors = [
        DQX.Color(1,0,0),
        DQX.Color(0,1,0),
        DQX.Color(0,0,1),
        DQX.Color(0.7,0.5,0),
        DQX.Color(0,0.5,7),
        DQX.Color(0.7,0,0.7)
    ];

    var sumpart = 0;
    for (var i = 0; i < values.length; i++) {
        var sumpart2 = sumpart + values[i];
        data += this.createPieString(sumpart / sum * 2 * Math.PI, sumpart2 / sum * 2 * Math.PI, rd, colors[i]);
        sumpart = sumpart2;
    }

    return data;
}



DQXGMAPPieChart.prototype.makeImage = function (rd) {
    var data = "<svg width={w} height={h}>".DQXformat({ w: 2 * rd, h: 2 * rd });
    data += this.createPieChart(this.myValues, rd);
    data += "</svg>";
    this.myDiv.innerHTML = data;
}

DQXGMAPPieChart.prototype.onAdd = function () {
    // Note: an overlay's receipt of onAdd() indicates that
    // the map's panes are now available for attaching
    // the overlay to the map via the DOM.
    // Create the DIV and set some basic attributes.
    var div = document.createElement('div');
    //    div.style.backgroundColor = 'rgba(255,0,0,0.25)';
    //    div.style.borderStyle = 'solid';
    //    div.style.borderWidth = '2px';
    div.style.position = 'absolute';
    this.myDiv = div;

    //this.makeImage();

    // We add an overlay to a map via one of the map's panes.
    // We'll add this overlay to the overlayLayer pane.
    var panes = this.getPanes();
    panes.overlayLayer.appendChild(div);
}

DQXGMAPPieChart.prototype.draw = function () {
    // Size and position the overlay.  We need to retrieve the projection from this overlay to do this.
    var overlayProjection = this.getProjection();
    // Convert latlngs to pixels coordinates.
    // We'll use these coordinates to resize the DIV.
    var centerpoint = overlayProjection.fromLatLngToDivPixel(this.myCenter);
    // Resize the image's DIV to fit the indicated dimensions.


    var myright = new google.maps.LatLng(this.myCenter.Xa + this.myRadius, this.myCenter.Ya);
    var rightpoint = overlayProjection.fromLatLngToDivPixel(myright);
    var rd = Math.abs(rightpoint.y-centerpoint.y);

    var div = this.myDiv;
    div.style.left = (centerpoint.x - rd) + 'px';
    div.style.top = (centerpoint.y - rd) + 'px';
    div.style.width = (2 * rd) + 'px';
    div.style.height = div.style.width;

    this.makeImage(rd);

}

DQXGMAPPieChart.prototype.onRemove = function () {
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
}


$(function () {

    //var myLatLng = new google.maps.LatLng(51.75, -1.25);

    var cx = 15;
    var cy = 100;

    var myLatLng = new google.maps.LatLng(cx,cy);

    var mapOptions = {
        zoom: 6,
        center: myLatLng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);



    overlay = new DQXGMAPPieChart(map, new google.maps.LatLng(cx,cy), 1, [3.5, 2, 1]);

    overlay = new DQXGMAPPieChart(map, new google.maps.LatLng(cx+1,cy+2), 0.5, [1, 0.5, 0.3, 1.3]);

    overlay = new DQXGMAPPieChart(map, new google.maps.LatLng(cx-3,cy+4), 1.2, [0.2, 0.3, 0.6, 0.2, 1]);

    overlay = new DQXGMAPPieChart(map, new google.maps.LatLng(cx+4, cy+1), 0.7, [0.5,0.7]);


})