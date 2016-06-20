$.getScript("../uis_ag_google_maps/static/src/js/uis_maps_pillars.js",function(){
    console.debug('./uis_maps_pillars.js loaded but not necessarily executed.');
});

function mapslib(apl_ids, div_id) {
    this.center_loc='';
    this.first_load=true;
    this.apl_ids=apl_ids;
    this.pillar_data=[];
    this.apl_data=[];
    this.lines_data=[];
    this.trans_data=[];
    this.layers=[];
    this.markers=[];
    this.lines=[];
    this.markers.pillars=[];
    this.showpillar=false;
    this.showpillarzoom=14;
	this.editable_pillar=true;
    this.bounds=new google.maps.LatLngBounds();
    this.center_loc = new google.maps.LatLng(56,56);
    this.map=new google.maps.Map(document.getElementById(div_id), {
        zoom: 13,
        center: this.center_loc,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        mapTypeControlOptions:{
            mapTypeIds: [google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.ROADMAP],
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
        }
       });
	thatlib=this;
    //Devine events
	var onPillarDragend = function(){
        if (thatlib.editable_pillar){
            var marker =this;
			var point= marker.getPosition();
			id=marker.id;
			new_latitude=point.lat();
			new_longitude=point.lng();
			//console.debug('Modified id: '+id+' New_latitude:'+new_latitude+' New longitude:' +new_longitude);
			var data={};
			data.pillar_id=id;
			data.new_latitude=new_latitude;
			data.new_longitude=new_longitude;
			xhr=new XMLHttpRequest();
			xhr.open('POST','/apiv1/pillar/newcoorddrop',true);
			xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
			xhr.send(JSON.stringify(data));
            xhr.onload=function(){
                thatlib.get_apl_lines_data();    
            };
            
		}
        
    };
    var onPillarMouseOver = function(){
        var marker=this;
        console.debug('OnMouseOver Pillar'+marker.id);
        var code_str='';
        code_str='Pillar ID : '+marker.id+'</br>';
        code_str=code_str+'APL : '+marker.apl+'</br>';
        code_str=code_str+'Num by VL : '+marker.num_by_vl+'</br>';
        code_str=code_str+'Full name : '+marker.name+'</br>';
        code_str=code_str+'Type : '+marker.type_id+'</br>';
        code_str=code_str+'Elevation : '+marker.elevation+'</br>';
        code_str=code_str+'Rotation : '+marker.rotation+'</br>';
        open_def=Math.round(Math.random()*100);
        closed_def=Math.round(Math.random()*100);
        total_def=open_def+closed_def;
        code_str=code_str+'1 year Defects (open/closed/total): '+open_def+'/'+closed_def+'/'+total_def+'</br>';
        code_str=code_str+'<canvas id="pillar_stat_'+marker.id+'" width="50" height="50"></canvas>';
        thatlib.show_info_bar(code_str);
        
        var data = {
            datasets: [{
                data: [open_def,closed_def,total_def],
                backgroundColor: ["#FF0000","#00FF00","#0000FF"],
                label: '1Y Deffects' 
            }],
            labels: ['open','closed','total']
            };
        var ctx = $("#pillar_stat_"+marker.id);
        var myDoughnutChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options:{},
            animation:{
                animateScale:true
            }
        });
        
        /*position: location,
                visible:true,
                elevation:cur_pillar.elevation,
                name:cur_pillar.name,
                prev_id:cur_pillar.prev_id,
				apl:cur_pillar.apl,
				apl_id:cur_pillar.apl_id,
				num_by_vl:cur_pillar.num_by_vl,
				tap_id:cur_pillar.tap_id,
                type_id:cur_pillar.type_id,
                rotation:cur_pillar.rotation,
                state:cur_pillar.state,*/
    };
    //Define info functions
    this.show_info_bar=function(code){
        $("#left_info_bar").html(code);
    }
    //Define functions
    this.set_map_center=function(slat,slong){
        this.center_loc=new google.maps.LatLng(slat,slong);
        this.map.panTo(this.center_loc);
    };
    
    this.set_bounds=function(){
        console.debug(this.pillar_data.minlat,this.pillar_data.minlong);
        var location = new google.maps.LatLng(this.pillar_data.minlat,this.pillar_data.minlong);
        this.bounds.extend(location);
        location=new google.maps.LatLng(this.pillar_data.maxlat,this.pillar_data.maxlong);
        this.bounds.extend(location);
    };
    
    this.mark_pillar=function(pid, mark){
        cm=this.markers.pillars[pid];
        this.markers.pillars[pid].setIcon(this.get_pillar_icon(cm.type_id,cm.rotation,cm.state,mark));
    };
    
    this.get_pillar_icon=function(type,rotation,state,selectable){
        var color='blue';
        switch (state){
            case 'DRAFT':
                color='grey';
                break;
            case 'EXPLOITATION':
                color='black';
                break;
            case 'DEFECT':
                color='yellow';
                break;
            case 'MAINTENANCE':
                color='blue';
                break;
            case 'REPAIRS':
                color='red';
                break;
        }
        var fillOpacity=0;
        if (selectable){
            fillOpacity=1;
        }
        var pci={
            path:google.maps.SymbolPath.CIRCLE,
            fillColor:'red',
            fillOpacity:fillOpacity,
            scale:4,
            strokeColor:color,
            strokeWeight:3,
            anchor: new google.maps.Point(0,0),
            rotation: rotation
        };
        return pci;
    };
    
    this.set_show_pillar=function(vis) {
        for (var i = 0; i < thatlib.pillar_data.counter; i++) {
                if (typeof thatlib.markers.pillars[thatlib.pillar_data.pillars[i].id] != "undefined") {
                    thatlib.markers.pillars[thatlib.pillar_data.pillars[i].id].setVisible(vis);
    
                }
        }
    };
    
    //SET markers and lines functions
    this.set_lines=function(){
        for (var i=0;i<this.lines_data.counter;i++){
            line=this.lines_data.lines[i];
            if (typeof this.lines[i] != "undefined"){
                this.lines[i].setMap(null);
                }
            this.lines[i]=new google.maps.Polyline({
                path: [
                    new google.maps.LatLng(line.lat1, line.long1), 
                    new google.maps.LatLng(line.lat2, line.long2)
                ],
                strokeColor: "#0000FF",
                strokeOpacity: 1.0,
                strokeWeight: 2,
                map: this.map
                });
            }
         $("#apl_count_badge").html(this.apl_data.counter);
    };
    
    this.set_pillar_markers=function(){
        for (var i=0;i<this.pillar_data.counter; i++) {
            cur_pillar=this.pillar_data.pillars[i];
            var location={};
            if (cur_pillar.latitude && cur_pillar.longitude) {
                location = new google.maps.LatLng(cur_pillar.latitude,cur_pillar.longitude);
                }
            
            if (typeof this.markers.pillars[cur_pillar.id] != "undefined") {
				cur_marker=this.markers.pillars[cur_pillar.id];
				if (cur_marker.position != location) {
					this.markers.pillars[cur_pillar.id].setPosition(location);
				}
				if (cur_marker.elevation != cur_pillar.elevation) {
					this.markers.pillars[cur_pillar.id].elevation=cur_pillar.elevation;
				}
			}
			else{
				this.markers.pillars[cur_pillar.id]= new google.maps.Marker({
                id:cur_pillar.id,
				map: this.map,
                draggable: true,
                position: location,
                visible:true,
                elevation:cur_pillar.elevation,
                name:cur_pillar.name,
                prev_id:cur_pillar.prev_id,
				apl:cur_pillar.apl,
				apl_id:cur_pillar.apl_id,
				num_by_vl:cur_pillar.num_by_vl,
				tap_id:cur_pillar.tap_id,
                type_id:cur_pillar.type_id,
                rotation:cur_pillar.rotation,
                state:cur_pillar.state,
                icon:this.get_pillar_icon(cur_pillar.type_id,cur_pillar.rotation,cur_pillar.state, false)
                });
				google.maps.event.addListener(this.markers.pillars[cur_pillar.id], 'dragend', onPillarDragend);
                google.maps.event.addListener(this.markers.pillars[cur_pillar.id], 'mouseover', onPillarMouseOver);
			}
            
			this.markers.pillars[cur_pillar.id].setPosition(location);
            //var imagecur=pillar_image;
            
        }
        $("#pillar_count_badge").html(this.pillar_data.counter);
    };
    //Get data functions
    this.get_apl_lines_data=function(){
        var data={};
        data.apl_ids=this.apl_ids;
        xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/apl/data', true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response);
            var ad=JSON.parse(res.result.apl_data);
            var ld=JSON.parse(res.result.lines_data);
            that.apl_data=ad;
            that.lines_data=ld;
            that.set_pillar_markers();
            that.set_lines();

            };
    };
    
    this.get_pillar_data=function(){
        var data={};
        data.apl_ids=this.apl_ids;
        xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/pillar/data',true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response);
            var pd=JSON.parse(res.result.pillar_data);
            that.pillar_data=pd;
            that.set_pillar_markers();
            if (that.first_load===true) {
                that.set_map_center(that.pillar_data.latitude,that.pillar_data.longitude);
                that.set_bounds();
				that.first_load=false;
                that.map.fitBounds(that.bounds);
			}
            //that.set_bounds();
            //that.set_photo_tumb();
            };
    };
    
    this.init=function(){
        this.get_pillar_data();
        this.get_apl_lines_data();
        //console.debug(this.pillar_data);
        this.init_rosreestr_map();
        that=this;
        google.maps.event.addListener(thatlib.map, 'zoom_changed', function() {
            var zoom = thatlib.map.getZoom();
            if (zoom <= that.showpillarzoom) {
               that.set_show_pillar(false);
            } else {
               that.set_show_pillar(true);
            }
        });
        //this.set_map_center(this.pillar_data.latitude,this.pillar_data.longitude);
        //this.map.fitBounds(this.bounds);
    };
    
    this.toggle_layer=function(layer_name){
        if (this.layers[layer_name].vis===0) {
            res=1;
        }
        if (this.layers[layer_name].vis===1) {
            res=0;
        }
        this.layers[layer_name].vis=res;
        this.vis_layer(layer_name);
    };
    
    this.vis_layer=function(layer_name){
        if (this.layers[layer_name].vis===1) {
            this.map.overlayMapTypes.push(this.layers[layer_name].ImageMap);
        }
        if (this.layers[layer_name].vis===0) {
            this.map.overlayMapTypes.clear();
        }
    };
    
    this.init_rosreestr_map=function(){
        this.layers.rosreestr=[];
        this.layers.rosreestr.vis=0;
        this.layers.rosreestr.type='ImageMapType';
        this.layers.rosreestr.name='Rosreestr';
        that=this;
        this.layers.rosreestr.ImageMap=new google.maps.ImageMapType({
        getTileUrl: function(coord,zoom){
            var s=Math.pow(2,zoom);
            var twidth=256;
            var theight=256;
            var gBl = that.map.getProjection().fromPointToLatLng(
                new google.maps.Point(coord.x * twidth / s, (coord.y + 1) * theight / s)); // bottom left / SW
            var gTr = that.map.getProjection().fromPointToLatLng(
                new google.maps.Point((coord.x + 1) * twidth / s, coord.y * theight / s)); // top right / NE
            // Bounding box coords for tile in WMS pre-1.3 format (x,y)
            //var bbox = gBl.lng() + "," + gBl.lat() + "," + gTr.lng() + "," + gTr.lat();
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
        this.vis_layer('rosreestr');
    };
    
    
}

var sitemapslib=new mapslib(apl_ids,'site-map');
sitemapslib.init();
//var photo_ref=new sitephotolib.refresher();
function map_ref() {
    sitemapslib.get_pillar_data();
    sitemapslib.get_apl_lines_data();
    }

map_ref();
ref_functions.push(map_ref);