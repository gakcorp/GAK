    __onpmout=onPillarMouseOut;
    onPillarMouseOut=function(){
        code=__onpmout.toString();
        code=code.substring(code.indexOf("{")+1,code.length-1);
        eval(code);
        el=document.getElementById("a_pill_badge_"+marker.id);
        //console.debug(el);
        if (el !== null){
            document.getElementById("right_bar").scrollTop=el.offsetTop-10;
            $(".a_pbc_"+marker.id).removeClass('b_marked');
        }
    }
    __onpmover=onPillarMouseOver;
    onPillarMouseOver=function(){
        code=__onpmover.toString();
        code=code.substring(code.indexOf("{")+1,code.length-1);
        //console.debug(code);
        eval(code);
        //console.debug(marker);
        el=document.getElementById("a_pill_badge_"+marker.id);
        //console.debug(el);
        if (el !== null){
            document.getElementById("right_bar").scrollTop=el.offsetTop-10;
            $(".a_pbc_"+marker.id).addClass('b_marked');
        }
        
        //return __onpmout(marker);
    };
    
function photolib(apl_ids,sitemaplib) {
    this.map=sitemaplib.map;
    this.sitemaplib=sitemaplib;
    this.apl_ids=apl_ids;
    this.photo_count='n/a';
    this.photo_count_hash='n/a';
    this.photo_data=[];
    this.photo_data_hash='';
    this.photos=[];
    this.markers=[];
    this.points=[];
    this.filter=[];
    this.settings=[];
    phlib=this;

    //onPillarMouseOver=new function(){
    //    onpmo();
    //    console.debug('modified onPillarMouseOver');
    //};
    
    this.get_path_camera_icon=function(dig){
        var z1=13;
        var z2=19;
        var x1=0.05;
        var x2=0.5;
        var z=this.map.getZoom();
        var scalez=(z*(x2-x1)-z1*x2+x1*z2)/(z2-z1);
        //console.debug(scalez);
        var pci={
            path:sitemaplib.settings.global_var['photo_icon_path'],
            fillColor:'white',
            fillOpacity:0.5,
            scale:scalez,
            strokeColor:'red',
            strokeWeight:1,
            //anchor: new google.maps.Point(32,64),
            anchor:new google.maps.Point(50,50),
            rotation: dig
        };
        return pci;
    };
    this.get_point_icon=function(dig){
        var z1=12;
        var z2=19;
        var x1=0.2;
        var x2=1;
        var z=this.map.getZoom();
        var scalez=(z*(x2-x1)-z1*x2+x1*z2)/(z2-z1);
        //console.debug(scalez);
        var pci={
            path:sitemaplib.settings.global_var['photo_point_icon'],
            strokeColor:'red',
            scale:scalez,
            strokeWeight:2,
            anchor:new google.maps.Point(0,0),
            rotation:dig
            };
        return pci;
    };
    //Define functions
    var scrollToPhoto=function(ph_id){
         el=document.getElementById("dit_"+ph_id);
        //console.debug(el);
        if (el !== null){
            document.getElementById("right_bar").scrollTop=el.offsetTop;
        }
    }
    var onPointClick = function(e){
		var point=this;
        //console.debug(point);
        scrollToPhoto(point.id);
	
	};
    var onPointDblClick=function(e){
        phlib.show_photo_full(this.id);
    }
    this.show_hide_photo_points=function(){
        this.settings.show_photo_points=!(this.settings.show_photo_points);
        this.show_photo_points(this.settings.show_photo_points);
        
    };
    this.show_photo_points=function(vis){
        console.debug('start show photo points with value'+vis);
        this.points.forEach(function(item){
            item.setVisible(vis);
            item.setIcon(phlib.get_point_icon(0));
			});
    };
    this.hide_photo_preview=function(){
        
        $("#photo_preview_frame").addClass("novis");
    }
    this.show_photo_preview=function(id){
        this.hide_photo_full();
        cur_photo=this.photos[id];
        ppf=document.getElementById("photo_preview_frame");
        ppf.innerHTML='<center><img src="'+cur_photo.url_image+'_800" width="100%"/></center>'
        $("#photo_preview_frame").removeClass("novis");

    }
    this.hide_photo_full=function(){
        console.debug('Start hide photo full');
        $("#photo_full_frame").addClass("novis");
    }
    
    this.show_photo_full=function(id){
        cur_photo=this.photos[id];
        phf=document.getElementById("photo_full_frame");
        phf.innerHTML='<center><img src="'+cur_photo.url_image+'_800" class="zoom" data-magnify-src="'+cur_photo.url_image+'" width="100%" onclick="sitephotolib.hide_photo_full();"/></center>';
        $("#photo_full_frame").removeClass("novis");
        //$('.zoom').magnify();
        that=this;
        $('.magnify-lens').click(function(){
            console.debug('Click');
            that.hide_photo_full();
        });
        var cls_btn_div=document.createElement('div');
        cls_btn_div.innerHTML='<span class="glyphicon glyphicon-remove-circle" aria-hidden="true"></span>';
        cls_btn_div.id="close_full_view";
        cls_btn_div.className="cls_cls_btn cls_btn";
        phf.appendChild(cls_btn_div);
        $("#close_full_view").click(function(){
            console.debug('close photo full view');
            that.hide_photo_full();
        });
		
		if (cur_photo.next_id>0){
			var cls_next_btn_div=document.createElement('div')
			cls_next_btn_div.innerHTML='<span class="glyphicon glyphicon-circle-arrow-right" aria-hidden="true"></span>';
			cls_next_btn_div.id="next_photo";
			cls_next_btn_div.setAttribute("phid",cur_photo.id);
			cls_next_btn_div.className="cls_cls_next_btn cls_btn";
			phf.appendChild(cls_next_btn_div);
			$("#next_photo").click(function(){
				scrollToPhoto(that.photos[this.getAttribute("phid")].next_id);
				that.show_photo_full(that.photos[this.getAttribute("phid")].next_id);
			});	
		}
		
		if (cur_photo.prev_id>0){
			var cls_prev_btn_div=document.createElement('div')
			cls_prev_btn_div.innerHTML='<span class="glyphicon glyphicon-circle-arrow-left" aria-hidden="true"></span>';
			cls_prev_btn_div.id="prev_photo";
			cls_prev_btn_div.setAttribute("phid",cur_photo.id);
			cls_prev_btn_div.className="cls_cls_prev_btn cls_btn";
			phf.appendChild(cls_prev_btn_div);
			$("#prev_photo").click(function(){
				scrollToPhoto(that.photos[this.getAttribute("phid")].prev_id);
				that.show_photo_full(that.photos[this.getAttribute("phid")].prev_id);
			});	
		}
		
		var cls_zoom_btn_div=document.createElement('div');
		cls_zoom_btn_div.innerHTML='<span class="glyphicon glyphicon-zoom-in" aria-hidden="true"></span>';
		cls_zoom_btn_div.id="zoom_photo";
		cls_zoom_btn_div.setAttribute("phid",cur_photo.id);
		cls_zoom_btn_div.className="cls_cls_zoom_btn cls_btn";
		phf.appendChild(cls_zoom_btn_div);
		$("#zoom_photo").click(function(){
			$('.zoom').magnify();
		});
		
		var cls_deff_btn_div=document.createElement('div');
		cls_deff_btn_div.innerHTML='<span class="glyphicon glyphicon-warning-sign" aria-hidden="true"></span>';
		cls_deff_btn_div.id="deff_photo";
		cls_deff_btn_div.setAttribute("phid",cur_photo.id);
		cls_deff_btn_div.className="cls_cls_deff_btn cls_btn";
		phf.appendChild(cls_deff_btn_div);
		$("#deff_photo").click(function(){
			window.alert('Для заведения дефекта вомпользуйтесь карточкой ВЛ. Заведение дефектов с картографии будет доступно с версии АктивГИС 9.0.8');
		});
		/*glyphicon glyphicon-zoom-in*/
		/*glyphicon glyphicon-warning-sign*/
        /*
             background: blue;
    width: 30px;
    height: 30px;
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1000;
         */
        /*var phle=document.getElementById("photo_full_frame");
        phle.innerHTML='<div><right><a href="#" id="frame_close_but"><span class="glyphicon glyphicon-remove-circle" width="20"></span></a><right></div>'
        cur_photo=this.photos[id];
        phle.innerHTML=phle.innerHTML+
            '<center><img src="'+cur_photo.url_image+'" width="95%"/></center>';
        $("#photo_full_frame").addClass("visible");
        $("#photo_full_frame").removeClass("hidden");*/
    };
    
    this.show_marker=function(id){
        this.markers[id].setVisible(true);
        this.markers[id].setIcon(this.get_path_camera_icon(this.markers[id].rotation));
        this.map.panTo(this.markers[id].position);
        for (var i=0;i<this.photos[id].pillar_data.count;i++){
            this.sitemaplib.mark_pillar(this.photos[id].pillar_data.pillars[i].id,true);
        }
        
        
    };
    
    this.hide_marker=function(id){
        this.markers[id].setVisible(false);
        for (var i=0;i<this.photos[id].pillar_data.count;i++){
            this.sitemaplib.mark_pillar(this.photos[id].pillar_data.pillars[i].id,false);
        }
    };
    
    this.set_photo_markers=function(){
        var prev_id=0;
		for (var i=0;i<this.photo_data.count; i++) {
            cur_photo=this.photo_data.photos[i];
            if (cur_photo.lat && cur_photo.long) {
                var location = new google.maps.LatLng(cur_photo.lat,cur_photo.long);
            }
            
            this.markers[cur_photo.id]= new google.maps.Marker({
                map: this.map,
                rotation:cur_photo.rotation,
                draggable: false,
                position: location,
                visible:false,
                icon:this.get_path_camera_icon(cur_photo.rotation)
                });
            this.points[cur_photo.id]=new google.maps.Marker({
                id:cur_photo.id,
                map:this.map,
                rotation:0,
                draggable:false,
                position: location,
                visible: false,
                icon: this.get_point_icon(0)
                });
            this.photos[cur_photo.id]=cur_photo;
			this.photos[cur_photo.id].prev_id=prev_id;
			if (prev_id>0){
				this.photos[prev_id].next_id=cur_photo.id;
			}
			prev_id=cur_photo.id;
            google.maps.event.addListener(this.points[cur_photo.id], 'click', onPointClick);
            google.maps.event.addListener(this.points[cur_photo.id], 'dblclick', onPointDblClick);
        }
    }
    this.show_pillar_badge=function(cf){
        var str='';
        for (var j=0;j<cur_photo.pillar_data.count;j++){
            str=str+'<span class="badge a_pbc_'+cf.pillar_data.pillars[j].id+'" id="a_pill_badge_'+cf.pillar_data.pillars[j].id+'">'+cf.pillar_data.pillars[j].num_by_vl+'</span>';
            };
        return str;
    }
    this.set_photo_tumb=function(){
        var phle=document.getElementById("photo_list");
        phle.innerHTML="<b>Images</b>"
        //console.debug(this.photo_data);
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
                //console.debug(pcd.photo_count_hash+'!='+that.photo_count_hash)
                that.photo_count_hash=pcd.photo_count_hash;
                that.get_photo_count();
                that.get_photo_data();
            }
            
            };
    }
    this.init_buttons=function(){
        $("#photo_button").click(function(){
            phlib.show_hide_photo_points();
        });
    };
    this.init=function(){
        this.init_buttons();
        this.settings.show_photo_points=false;
    };
    
    this.refresher=function(){
        console.debug('Photo refresher')
        var r1=this.get_photo_count_hash();
        var r2=this.get_photo_count();
        return 1;
    }
};


var sitephotolib=new photolib(apl_ids,sitemapslib);
sitephotolib.init();
//var photo_ref=new sitephotolib.refresher();
function photo_ref() {
    sitephotolib.get_photo_count_hash();
    sitephotolib.get_photo_count();
};
photo_ref();
ref_functions.push(photo_ref);

