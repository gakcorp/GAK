function photolib(apl_ids,map) {
    this.map=map;
    this.apl_ids=apl_ids;
    this.photo_count='n/a';
    this.photo_count_hash='n/a';
    this.photo_data=[];
    this.photo_data_hash='';
    this.photos=[];
    this.markers=[];
    
    this.get_path_camera_icon=function(dig){
        var pci={
            path:'M20 48 L20 64 L44 64 L44 48 L36 48 L64 0 L0 0 L28 48 Z',
            fillColor:'white',
            fillOpacity:0.5,
            scale:0.7,
            strokeColor:'black',
            strokeWeight:1,
            anchor: new google.maps.Point(32,64),
            rotation: dig
        }
        return pci;
    }
    //Define functions
    
    this.hide_photo_preview=function(){
        
        $("#photo_preview_frame").addClass("novis");
    }
    this.show_photo_preview=function(id){
        this.hide_photo_full();
        cur_photo=this.photos[id];
        ppf=document.getElementById("photo_preview_frame");
        ppf.innerHTML='<center><img src="'+cur_photo.url_image+'" width="100%"/></center>'
        $("#photo_preview_frame").removeClass("novis");

    }
    this.hide_photo_full=function(){
        console.debug('Start hide photo full');
        $("#photo_full_frame").addClass("novis");
    }
    
    this.show_photo_full=function(id){
        cur_photo=this.photos[id];
        phf=document.getElementById("photo_full_frame");
        phf.innerHTML='<center><img src="'+cur_photo.url_image+'" class="zoom" data-magnify-src="'+cur_photo.url_image+'" width="100%" onclick="sitephotolib.hide_photo_full();"/></center>'
        $("#photo_full_frame").removeClass("novis");
        $('.zoom').magnify();
        that=this;
        $('.magnify-lens').click(function(){
            console.debug('Clic');
            that.hide_photo_full();
        });
        /*var phle=document.getElementById("photo_full_frame");
        phle.innerHTML='<div><right><a href="#" id="frame_close_but"><span class="glyphicon glyphicon-remove-circle" width="20"></span></a><right></div>'
        cur_photo=this.photos[id];
        phle.innerHTML=phle.innerHTML+
            '<center><img src="'+cur_photo.url_image+'" width="95%"/></center>';
        $("#photo_full_frame").addClass("visible");
        $("#photo_full_frame").removeClass("hidden");*/
    }
    
    this.show_marker=function(id){
        this.markers[id].setVisible(true);
        this.map.panTo(this.markers[id].position);
        
    }
    this.hide_marker=function(id){
        this.markers[id].setVisible(false);
    }
    this.set_photo_markers=function(){
        for (var i=0;i<this.photo_data.count; i++) {
            cur_photo=this.photo_data.photos[i];
            if (cur_photo.lat && cur_photo.long) {
            var location = new google.maps.LatLng(cur_photo.lat,cur_photo.long);
            }
            
            this.markers[cur_photo.id]= new google.maps.Marker({
                map: this.map,
                draggable: true,
                position: location,
                visible:false,
                icon:this.get_path_camera_icon(cur_photo.rotation)
                });
            this.photos[cur_photo.id]=cur_photo;
            //var imagecur=pillar_image;
            
        }
    }
    this.show_pillar_badge=function(cf){
        var str='';
        for (var j=0;j<cur_photo.pillar_data.count;j++){
            str=str+'<span class="badge">'+cf.pillar_data.pillars[j].num_by_vl+'</span>';
            }
        return str;
    }
    this.set_photo_tumb=function(){
        var phle=document.getElementById("photo_list");
        phle.innerHTML="<b>Images</b>"
        console.debug(this.photo_data);
        for (var i = 0; i < this.photo_data.count; i++) {
            cur_photo=this.photo_data.photos[i];
            phle.innerHTML=phle.innerHTML+
            '<div id="dit_'+cur_photo.id+'" class="div_img_thumb" '+
            'onmouseover="sitephotolib.show_marker('+cur_photo.id+')" '+
            'onmouseout="sitephotolib.hide_marker('+cur_photo.id+')" '+
            'ondblclick="sitephotolib.show_photo_full('+cur_photo.id+')" '+
            'onmousedown="sitephotolib.show_photo_preview('+cur_photo.id+')" '+
            'onmouseup="sitephotolib.hide_photo_preview()"> '+
            '<div><img src="'+cur_photo.thumbnail+'" class="img_photo_thumb"></div>'+
            this.show_pillar_badge(cur_photo)+
            '</div>';
            }
        }
    
    this.get_photo_count=function(){
        var data={};
        data['apl_ids']=this.apl_ids
        xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/photo/count',true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response)
            var pcd=JSON.parse(res.result.count_data);
            that.photo_count=pcd.count;
            document.getElementById('photo_count_badge').innerHTML=that.photo_count;  
            };
    }
    this.get_photo_data=function(){
        var data={};
        data['apl_ids']=this.apl_ids
        xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/photo/data',true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response)
            var pcd=JSON.parse(res.result.photo_data);
            that.photo_data=pcd;
            that.set_photo_markers();
            that.set_photo_tumb();
            };
    }
    this.get_photo_count_hash=function(){
        var data={};
        data['apl_ids']=this.apl_ids;
        xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/photo/photo_count_hash',true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response)
            var pcd=JSON.parse(res.result.res);
            if (pcd.photo_count_hash != that.photo_count_hash) {
                console.debug(pcd.photo_count_hash+'!='+that.photo_count_hash)
                that.photo_count_hash=pcd.photo_count_hash;
                that.get_photo_count();
                that.get_photo_data();
            }
            
            };
    }
    
    this.refresher=function(){
        console.debug('Photo refresher')
        var r1=this.get_photo_count_hash();
        var r2=this.get_photo_count();
        return 1;
    }
};


var sitephotolib=new photolib(apl_ids,map);
//var photo_ref=new sitephotolib.refresher();
function photo_ref() {
    sitephotolib.get_photo_count_hash();
    sitephotolib.get_photo_count();
};
photo_ref();
ref_functions.push(photo_ref);

