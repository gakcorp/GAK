    'use strict';
    
function initialize_map() {
    
var rosreestr_show=1;
var oporaclick_enabled=0;
var show_pillar=1;
function RosreestrControl(controlDiv,map) {
        var controlUI=document.createElement('div');
        controlUI.style.width='80px';
        controlUI.style.backgroundColor = '#fff';
        controlUI.style.border = '2px solid #fff';
        controlUI.style.borderRadius = '3px';
        controlUI.style.boxShadow = '0 2px 4px rgba(0,0,0,.3)';
        controlUI.style.cursor = 'pointer';
        controlUI.style.marginBottom = '5px';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'Click to recenter the map';
        controlDiv.appendChild(controlUI);
        var controlText = document.createElement('div');
        controlText.style.color = 'rgb(25,25,25)';
        controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
        controlText.style.fontSize = '12px';
        controlText.style.lineHeight = '28px';
        controlText.style.paddingLeft = '3px';
        controlText.style.paddingRight = '3px';
        controlText.innerHTML = 'Rosreestr';
        controlUI.appendChild(controlText);
        controlUI.addEventListener('click', function() {
            if (rosreestr_show==1) {
                //map.overlayMapTypes(null);
                //map.overlayMapTypes.setAt("1",RosreestrMapType);
                rosreestr_show=0;
                //map.mapTypes.set('Rosreestr',RosreestrMapType);
                //map.setMapTypeId(google.maps.MapTypeId.HYBRID);
                //map.setMapTypeId('Rosreestr');
                map.overlayMapTypes.push(RosreestrMapType);
            }
            else{
                map.overlayMapTypes.clear();
                //map.setMapTypeId(google.maps.MapTypeId.HYBRID);
                rosreestr_show=1;
            }
        });
    };

function OporaClickControl(controlDiv,map) {
        var controlUI=document.createElement('div');
        controlUI.style.width='80px';
        if (oporaclick_enabled==0) {
                controlUI.style.backgroundColor = '#f00';    
        }
        if (oporaclick_enabled==1) {
                controlUI.style.backgroundColor = '#0f0';    
        }
        controlUI.style.border = '2px solid #fff';
        controlUI.style.borderRadius = '3px';
        controlUI.style.boxShadow = '0 2px 4px rgba(0,0,0,.3)';
        controlUI.style.cursor = 'pointer';
        controlUI.style.marginBottom = '5px';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'OporaClick';
        controlDiv.appendChild(controlUI);
        var controlText = document.createElement('div');
        controlText.style.color = 'rgb(25,25,25)';
        controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
        controlText.style.fontSize = '12px';
        controlText.style.lineHeight = '28px';
        controlText.style.paddingLeft = '3px';
        controlText.style.paddingRight = '3px';
        controlText.innerHTML = 'Click';
        controlUI.appendChild(controlText);
        controlUI.addEventListener('click', function() {
            if (oporaclick_enabled==1) {
                oporaclick_enabled=0;
                controlUI.style.backgroundColor='#f00';
            }
            else{
                oporaclick_enabled=1;
                controlUI.style.backgroundColor='#0f0';
            }
        });
    };

function set_show_pillar(map) {
        for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(map);
        }
}
function MarkerShowControl(controlDiv,map) {
        var controlUI=document.createElement('div');
        controlUI.style.width='80px';
        if (show_pillar==0) {
                controlUI.style.backgroundColor = '#f00';    
        }
        if (show_pillar==1) {
                controlUI.style.backgroundColor = '#0f0';    
        }
        controlUI.style.border = '2px solid #fff';
        controlUI.style.borderRadius = '3px';
        controlUI.style.boxShadow = '0 2px 4px rgba(0,0,0,.3)';
        controlUI.style.cursor = 'pointer';
        controlUI.style.marginBottom = '5px';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'Show Pillar';
        controlDiv.appendChild(controlUI);
        var controlText = document.createElement('div');
        controlText.style.color = 'rgb(25,25,25)';
        controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
        controlText.style.fontSize = '12px';
        controlText.style.lineHeight = '28px';
        controlText.style.paddingLeft = '3px';
        controlText.style.paddingRight = '3px';
        controlText.innerHTML = 'Pillars';
        controlUI.appendChild(controlText);
        controlUI.addEventListener('click', function() {
            if (show_pillar==1) {
                show_pillar=0;
                controlUI.style.backgroundColor='#f00';
                set_show_pillar(null);
            }
            else{
                show_pillar=1;
                controlUI.style.backgroundColor='#0f0';
                set_show_pillar(map);
            }
        });
    };
    
    var new_id=0;
    var new_latitude=0;
    var new_longitude=0;
    var startpillar=[];
    var pillar1=[];
    var pillar2=[];
    
    var RosreestrMapType=new google.maps.ImageMapType({
        getTileUrl: function(coord,zoom){
            var s=Math.pow(2,zoom);
            var twidth=256;
            var theight=256;
            var gBl = map.getProjection().fromPointToLatLng(
                new google.maps.Point(coord.x * twidth / s, (coord.y + 1) * theight / s)); // bottom left / SW
            var gTr = map.getProjection().fromPointToLatLng(
                new google.maps.Point((coord.x + 1) * twidth / s, coord.y * theight / s)); // top right / NE
            // Bounding box coords for tile in WMS pre-1.3 format (x,y)
            var bbox = gBl.lng() + "," + gBl.lat() + "," + gTr.lng() + "," + gTr.lat();
            var bbox = "{xmin:"+gBl.lng() + ",ymin:" + gBl.lat() + ",xmax:" + gTr.lng() + ",ymax:" + gTr.lat()+",spatialReference:{wkid:4326}}";
            var url= "http://maps.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export?";
            url = url+"dpi=96";
            url=url+"&transparent=true";
            url=url+"&format=png32";
            //url=url+"&bboxSR=102100";
            url=url+"&bboxSR=4326";
            //url=url+"&imageSR=102100";
            url=url+"&imageSR=102100";
            url=url+"&size=256,256";
            url=url+"&f=image";
            url=url+"&bbox="+bbox;
            //console.debug(bbox);
            return url;
        },
        tileSize: new google.maps.Size(256,256),
        isPng: true,
        alt: "Rosreestr Layer",
        name: "Rosreestr",
        maxZoom:19,
        opacity: 1
    });
    //http://maps.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export?dpi=96&transparent=true&format=png32&bboxSR=102100&imageSR=102100&size=256%2C256&f=image&bbox=
    // ResultURL:=GetURLBase+RoundEx(GetLMetr,10)+','+RoundEx(GetBMetr,10)+','+RoundEx(GetRMetr,10)+','+RoundEx(GetTMetr,10);
    

    function send_new_coord_post(){
        var datap='id='+new_id+'&nltd='+new_latitude+'&nlng='+new_longitude;
        $.get("/sp/?"+datap);
    }

    // MAP CONFIG AND LOADING
    var center_loc = new google.maps.LatLng(odoo_pillar_data.latitude,odoo_pillar_data.longitude);
    var map = new google.maps.Map(document.getElementById('odoo-google-map'), {
        zoom: 13,
        center: center_loc,
        //mapTypeId: google.maps.MapTypeId.HYBRID,
        mapTypeControlOptions:{
            mapTypeIds: [google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.ROADMAP],
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
        }
    });
    //map.mapTypes.set('Rosreestr',RosreestrMapType);
    //map.setMapTypeId(google.maps.MapTypeId.HYBRID);
    //map.setMapTypeId('Rosreestr');
    //map.overlayMapTypes.push(RosreestrMapType);
    map.setMapTypeId(google.maps.MapTypeId.HYBRID);
    var RosreestrControlDiv=document.createElement('div');
    var rosreestrControl= new RosreestrControl(RosreestrControlDiv,map);
    RosreestrControlDiv.index=1;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(RosreestrControlDiv);
    
    var OporaClickDiv=document.createElement('div');
    var oporaClickControl=new OporaClickControl(OporaClickDiv,map);
    OporaClickDiv.index=1;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(OporaClickDiv);
    
    var MarkerShowDiv=document.createElement('div');
    var markerShowControl=new MarkerShowControl(MarkerShowDiv,map);
    MarkerShowDiv.index=1;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(MarkerShowDiv);
    
    // INFO BUBBLES
    var infoWindow = new google.maps.InfoWindow();
    var TapinfoWindow = new google.maps.InfoWindow()
    
    var pillar_image = new google.maps.MarkerImage('/uis_ag_google_maps/static/src/img/pillar10.png', new google.maps.Size(10, 10));
    var pillar_image_1=new google.maps.MarkerImage('/uis_ag_google_maps/static/src/img/pi1_10.png', new google.maps.Size(10, 10));
    var markers = [];
    var bounds=new google.maps.LatLngBounds();
    var taps=[];
    

    google.maps.event.addListener(map, 'click', function(event) {
        infoWindow.close();
        TapinfoWindow.close();
        if (oporaclick_enabled==1) {
                var clat=event.latLng.lat();
                var clng=event.latLng.lng();
                console.log('lat=', clat);
                console.log('lng=',clng);
                console.log('Start pillar:', startpillar.id);
                console.log('APL_ID:',startpillar.apl_id);
                console.log('TAP_ID:', startpillar.tap_id);
                var datap='num='+(startpillar.num_by_vl+1)+'&ltd='+clat+'&lng='+clng+'&pr='+startpillar.id+'&apl='+startpillar.apl_id+'&tap='+startpillar.tap_id;
                $.get("/create_pillar/?"+datap);
        }
    });
function pillar_window_info(div,pillar) {
        div.innerHTML='ID:'+pillar.id+'<br><b>Pillar name: '+pillar.name +'</b><br>'+
              //'Num by APL:'+pillar.num_by_vl+'<br>'+
              'APL:'+pillar.apl+'<br>'+
              'Latitude:'+pillar.latitude+'; Longitude:'+pillar.longitude+'<br>'+
              'Elevation:'+pillar.elevation+'<br>'+
              //'APL_ID:'+pillar.apl_id+'<br>'+
              //'TAP_ID:'+pillar.tap_id+'<br>'+
              '<canvas id="chart_pillar_'+pillar.id+'" width="300" height="5"></canvas>';
              
    //code
}
    // Display the bubble once clicked
    var onMarkerClick = function() {
        var marker = this;
        var pillar = marker.pillar;
        pillar2=pillar1;
        pillar1=pillar;
        startpillar=pillar;
        //infoWindow.setContent(
        //      '<div class="marker">'+
        //      'ID:'+pillar.id+'<br><b>Pillar name: '+pillar.name +'</b><br>'+
        //      'Num by APL:'+pillar.num_by_vl+'<br>'+
        //      'APL:'+pillar.apl+'<br>'+
        //      'Latitude:'+pillar.latitude+'; Longitude:'+pillar.longitude+'<br>'+
        //      'Elevation:'+pillar.elevation+'<br>'+
        //      'APL_ID:'+pillar.apl_id+'<br>'+
        //      'TAP_ID:'+pillar.tap_id+'<br>'+
        //      '</div>'
        //      );
        //infoWindow.open(map, marker);
        var p1wd=document.getElementById("w_pillar_1");
        pillar_window_info(p1wd,pillar1);
        
        var p2wd=document.getElementById("w_pillar_2");
        pillar_window_info(p2wd,pillar2);
        
        var pwd=document.getElementById("g_b2_pillar");
        pwd.innerHTML='<canvas id="chart_pillar" width="400" height="180"></canvas>';
        
        var elevator=new google.maps.ElevationService;

        var p1= new google.maps.LatLng(pillar1.latitude,pillar1.longitude);
        var p2= new google.maps.LatLng(pillar2.latitude,pillar2.longitude);
        //var path=[{'lat':pillar1.latitude,'lng':pillar1.longitude},
        //          {'lat':pillar2.latitude,'lng':pillar2.longitude}];
        var path=[p1,p2];
        var datael=elevator.getElevationAlongPath({
                'path':path,
                'samples':50
        },graph_b2_pillar);
        function graph_b2_pillar(elevations,status) {
                var labels=[];
                var edata=[];
                for (var i = 0; i < elevations.length; i++) {
                        //console.debug(elevations[i].elevation);
                        labels.push(i);
                        edata.push(elevations[i].elevation);
                };    
         
                var data = {
                        labels: labels,
                        datasets: [{
                                label: "Elevation",
                                fillColor: "rgba(100,100,100,0.5)",
                                strokeColor: "rgba(0,0,0,1)",
                                pointColor: "rgba(220,220,220,1)",
                                pointStrokeColor: "#fff",
                                pointHighlightFill: "#fff",
                                pointHighlightStroke: "rgba(220,220,220,1)",
                                data: edata
                        }]
                };
                var options={
                        bezierCurve: true,
                        pointDot:false,
                        pointHitDetectionRadius : 1,
                        scaleShowVerticalLines: false,
                        datasetStrokeWidth : 1,
                }       
                Chart.defaults.global.scaleFontSize=8;
                Chart.defaults.global.scaleBeginAtZero=false;
                var ctx = document.getElementById("chart_pillar").getContext("2d");
                var chart_b2_pillar = new Chart(ctx).Line(data, options);
                }
        
    };
    
    var onMarkerDragend = function(){
        var marker =this;
        var pillar=marker.pillar;
        var point= marker.getPosition();
        new_id=pillar.id;
        new_latitude=point.lat();
        new_longitude=point.lng();
        console.debug('Modified id: '+new_id+' New_latitude:'+new_latitude+' New longitude:' +new_longitude);
        send_new_coord_post();
        
    };
    
    var set_marker = function(pillar) {

        if (pillar.latitude && pillar.longitude) {
            var location = new google.maps.LatLng(pillar.latitude,pillar.longitude);
            var imagecur=pillar_image;
            if (pillar.prev_id>0) {
                imagecur=pillar_image_1
            }
            var marker = new google.maps.Marker({
                pillar: pillar,
                map: map,
                draggable: true,
                icon: imagecur,
                position: location
                });
                bounds.extend(location);
                google.maps.event.addListener(marker, 'click', onMarkerClick);
                google.maps.event.addListener(marker, 'dragend', onMarkerDragend);
                markers.push(marker);
                //lines.push(location);
                } else {
                    console.debug('Null LatLng: ' + status);
                }
        }
     // Create the markers and cluster them on the map
    if (odoo_pillar_data){ /* odoo_partner_data special variable should have been defined in google_map.xml */
        for (var i = 0; i < odoo_pillar_data.counter; i++) {
            set_marker(odoo_pillar_data.pillars[i]);
            //set_line(odoo_pillar_data.pillars[i]);
        }
        //var markerCluster = new MarkerClusterer(map, markers);
    }
    
    var onTapClick = function(event) {
        var line = this;
        var ctap=line.tap;
        var div_tap_info = document.getElementById("apl_info");
        div_tap_info.innerHTML='<b>Tap name: '+ctap.name +'</b><br>'+
              //'Num by APL:'+pillar.num_by_vl+'<br>'+
              'APL:'+ctap.apl+'<br>'+
              //'Latitude:'+pillar.latitude+'; Longitude:'+pillar.longitude+'<br>'+
              //'Elevation:'+pillar.elevation+'<br>'+
              'APL_ID:'+ctap.apl_id+'<br>'+
              //'TAP_ID:'+pillar.tap_id+'<br>'+
              '<canvas id="Chart_APL" width="400" height="200"></canvas>';
              
        /*TapinfoWindow.setContent(
        //      '<div class="marker">'+
        //      '<b>Tap name: '+ctap.name +'</b><br>'+
        //      //'Num by APL:'+pillar.num_by_vl+'<br>'+
        //      'APL:'+ctap.apl+'<br>'+
             //'Latitude:'+pillar.latitude+'; Longitude:'+pillar.longitude+'<br>'+
              //'Elevation:'+pillar.elevation+'<br>'+
              'APL_ID:'+ctap.apl_id+'<br>'+
              //'TAP_ID:'+pillar.tap_id+'<br>'+
              '<canvas id="myChart" width="500" height="300"></canvas>'+
              '</div>'
              );
        var LatLng=event.latLng;
        //Do graph
        TapinfoWindow.setPosition(LatLng);
        TapinfoWindow.open(map);
        console.debug(ctap.elevation);*/
        var tc=ctap.elevation.counter;
        var labels=[];
        var data=[];
        for (var i=0;i<tc;i++){
                labels.push(ctap.elevation.values[tc-i-1].x);
                data.push(ctap.elevation.values[tc-i-1].elevation);
        }
 
        var data = {
                labels: labels,
                datasets: [{
                        label: "Elevation",
                        fillColor: "rgba(100,100,100,0.5)",
                        strokeColor: "rgba(0,0,0,1)",
                        pointColor: "rgba(220,220,220,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(220,220,220,1)",
                        data: data
                }]
        };
        /*{
            label: "My Second dataset",
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: [28, 48, 40, 19, 86, 27, 90]
        }
        ]
        };*/
        var options={
                bezierCurve: true,
                pointDot:false,
                pointHitDetectionRadius : 1,
                scaleShowVerticalLines: false,
                datasetStrokeWidth : 1,
        }
        Chart.defaults.global.scaleFontSize=8;
        Chart.defaults.global.scaleBeginAtZero=true;
        var ctx = document.getElementById("Chart_APL").getContext("2d");
        var TapChart = new Chart(ctx).Line(data, options);
        
        
    };
    var set_tap=function(tap){
        console.debug('TAP ID'+tap.id);
        var line=[];
        for (var i=0;i<tap.line.counter;i++){
                var location = new google.maps.LatLng(tap.line.coord[i].ltd,tap.line.coord[i].lng);
                line.push(location)
        }
        var ntap=new google.maps.Polyline({
                tap:tap,
                path:line,
                geodesic:true,
                map:map,
                strokeColor: '#00AAFF',
                strokeOpacity:0.9,
                strokeWeight:2
        });
        google.maps.event.addListener(ntap, 'click', onTapClick);
        taps.push(ntap);
    };
    
    if (lines_data) {
        for (var i=0;i<lines_data.counter;i++){
                set_tap(lines_data.taps[i]);
        }
    }
    map.fitBounds(bounds);
    /*var pl=new google.maps.Polyline({
        path:lines,
        geodesic:true,
        map: map,
        strokeColor: '#00AAFF',
        strokeOpacity:0.5,
        strokeWeight:2
    })*/
    
    
};

// Initialize map once the DOM has been loaded
google.maps.event.addDomListener(window, 'load', initialize_map);