function mapslib(apl_ids, div_id) {
    this.center_loc='';
    this.apl_ids=apl_ids;
    this.pillar_data=[];
    this.layers=[];
    this.showpillar=false;
    this.ahowpillarzoom=10;
    this.bounds=new google.maps.LatLngBounds();
    var center_loc = [];
    this.map=new google.maps.Map(document.getElementById(div_id), {
        zoom: 13,
        //center: center_loc,
        //mapTypeId: google.maps.MapTypeId.HYBRID,
        mapTypeControlOptions:{
            mapTypeIds: [google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.ROADMAP],
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
        }
       });
    
    //Define functions
    this.set_map_center=function(slat,slong){
        this.center_loc=new google.maps.LatLng(slat,slong)
        this.map.panTo(this.center_loc);
    }
    this.set_bounds=function(){
        console.debug(this.pillar_data.minlat,this.pillar_data.minlong);
        var location = new google.maps.LatLng(this.pillar_data.minlat,this.pillar_data.minlong);
        this.bounds.extend(location);
        location=new google.maps.LatLng(this.pillar_data.maxlat,this.pillar_data.maxlong);
        this.bounds.extend(location);
    }
    this.set_pillar_markers=function(){
        
    }
    this.get_pillar_data=function(){
        var data={};
        data['apl_ids']=this.apl_ids
        xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/pillar/data',true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response)
            var pd=JSON.parse(res.result.pillar_data);
            that.pillar_data=pd;
            that.set_pillar_markers();
            //that.set_bounds();
            //that.set_photo_tumb();
            };
    }
    
    this.init=function(){
        this.get_pillar_data();
        console.debug(this.pillar_data);
        this.init_rosreestr_map();
        //this.set_map_center(this.pillar_data.latitude,this.pillar_data.longitude);
        //this.map.fitBounds(this.bounds);
    }
    this.toggle_layer=function(layer_name){
        if (this.layers[layer_name].vis==0) {
            res=1
        }
        if (this.layers[layer_name].vis==1) {
            res=0
        }
        this.layers[layer_name].vis=res;
        this.vis_layer(layer_name);
    }
    this.vis_layer=function(layer_name){
        if (this.layers[layer_name].vis==1) {
            this.map.overlayMapTypes.push(this.layers[layer_name].ImageMap);
        }
        if (this.layers[layer_name].vis==0) {
            this.map.overlayMapTypes.clear();
        }
    }
    this.init_rosreestr_map=function(){
        this.layers['rosreestr']=[];
        this.layers['rosreestr'].vis=0;
        this.layers['rosreestr'].type='ImageMapType';
        this.layers['rosreestr'].name='Rosreestr';
        that=this;
        this.layers['rosreestr'].ImageMap=new google.maps.ImageMapType({
        getTileUrl: function(coord,zoom){
            var s=Math.pow(2,zoom);
            var twidth=256;
            var theight=256;
            var gBl = that.map.getProjection().fromPointToLatLng(
                new google.maps.Point(coord.x * twidth / s, (coord.y + 1) * theight / s)); // bottom left / SW
            var gTr = that.map.getProjection().fromPointToLatLng(
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
        this.vis_layer('rosreestr');
    }
}

var sitemapslib=new mapslib(apl_ids,'site-map');
sitemapslib.init();
//var photo_ref=new sitephotolib.refresher();
function map_ref() {
    sitemapslib.init();
};
map_ref();
ref_functions.push(map_ref);