    'use strict';
    
function initialize_map() {
    
var rosreestr_show=1;
function RosreestrControl(controlDiv,map) {
        var controlUI=document.createElement('div');
        controlUI.style.backgroundColor = '#fff';
        controlUI.style.border = '2px solid #fff';
        controlUI.style.borderRadius = '3px';
        controlUI.style.boxShadow = '0 2px 4px rgba(0,0,0,.3)';
        controlUI.style.cursor = 'pointer';
        controlUI.style.marginBottom = '12px';
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


    var new_id=0;
    var new_latitude=0;
    var new_longitude=0;
    
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
    
    // INFO BUBBLES
    var infoWindow = new google.maps.InfoWindow();
    var pillar_image = new google.maps.MarkerImage('/uis_ag_google_maps/static/src/img/pillar10.png', new google.maps.Size(10, 10));
    var markers = [];
    var bounds=new google.maps.LatLngBounds();
    var lines=[];
    

    google.maps.event.addListener(map, 'click', function() {
        infoWindow.close();
    });

    // Display the bubble once clicked
    var onMarkerClick = function() {
        var marker = this;
        var pillar = marker.pillar;
        infoWindow.setContent(
              '<div class="marker">'+
              'ID:'+pillar.id+'<br><b>Pillar name: '+pillar.name +'</b><br>'+
              'APL:'+pillar.apl+'<br>'+
              'Latitude:'+pillar.latitude+'; Longitude:'+pillar.longitude+'<br>'+
              'Elevation:'+pillar.elevation+'<br>'+
              'APL_ID:'+pillar.apl_id+'<br>'+
              'TAP_ID:'+pillar.tap_id+'<br>'+
              '</div>'
              );
        infoWindow.open(map, marker);
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
            var marker = new google.maps.Marker({
                pillar: pillar,
                map: map,
                draggable: true,
                icon: pillar_image,
                position: location
                });
                bounds.extend(location);
                google.maps.event.addListener(marker, 'click', onMarkerClick);
                google.maps.event.addListener(marker, 'dragend', onMarkerDragend);
                markers.push(marker);
                lines.push(location);
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
    map.fitBounds(bounds);
    var pl=new google.maps.Polyline({
        path:lines,
        geodesic:true,
        map: map,
        strokeColor: '#0000FF',
        strokeOpacity:1,
        strokeWeight:3
    })
    
    
};

// Initialize map once the DOM has been loaded
google.maps.event.addDomListener(window, 'load', initialize_map);