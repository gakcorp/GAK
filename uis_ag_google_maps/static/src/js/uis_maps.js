/*$.getScript("../uis_ag_google_maps/static/src/js/mod/uis_maps_pillar_events.js",function(){
	console.debug('uis_maps_pillar_events loaded');
	});*/
$.getScript("../uis_ag_google_maps/static/src/js/uis_maps_pillars.js",function(){
    //console.debug('./uis_maps_pillars.js loaded but not necessarily executed.');
});
$.getScript("../uis_ag_google_maps/static/src/js/mod/uis_tap_profile.js",function(){
    //console.debug('uis_tap_profile.js is loaded');
    });
$.getScript("../uis_ag_google_maps/static/src/js/infobubble/infobubble.js",function(){});


function mapslib(apl_ids, div_id) {
    this.center_loc='';
	this.map_div_id=div_id;
    this.first_load=true;
    this.apl_ids=apl_ids;
    this.pillar_data=[];
    this.apl_data=[];
	this.apl_list=[];
    this.lines_data=[];
    this.trans_data=[];
    this.layers=[];
    this.markers=[];
    this.lines=[];
    this.apls=[];
    this.markers.pillars=[];
    this.markers.trans=[];
    this.settings=[];
    this.settings.pillar_icon=[];
	this.settings.layers=[];
	this.settings.pillar_type=[];
	this.settings.pillar_cut=[];
	this.settings.apl_list=[];
	this.settings.global=[];
	this.settings.global_var=[];
    this.showpillar=false;
    this.showpillarzoom=14;
    this.showtranszoom=12;
	this.editable_pillar=true;
    this.bounds=new google.maps.LatLngBounds();
    this.center_loc = new google.maps.LatLng(56,56);
    this.hash=[];
    this.hash.apl_data='n/d';
    this.hash.pillar_data='n/d';
    this.hash.trans_data='n/d';
	px1=0;
	px2=0;
	py1=0;
	py2=0;
	px4=0;
	py4=0;
	pk=0;
	pk2=0;
	pb=0;
    thatlib=this;
    this.map=new google.maps.Map(document.getElementById(div_id), {
        zoom: 13,
        maxZoom:20,
        center: this.center_loc,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        mapTypeControlOptions:{
            mapTypeIds: [google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.ROADMAP],
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
        }
       });

    //Devine events
    var onLineMouseOver = function(){
        var line=this;
        var apl_id=line.apl_id;
        var apl_info=thatlib.apls[apl_id];
        thatlib.mark_apl(line.apl_id,true);
        var code_str='';
        code_str='APL ID : '+apl_info.id+'</br>';
        code_str=code_str+'Name : '+apl_info.name+'</br>';
        code_str=code_str+'Feeder : '+apl_info.feeder_num+'</br>';
        code_str=code_str+'Voltage : '+apl_info.voltage+'</br>';
        code_str=code_str+'Line Length : '+Math.round(apl_info.line_len*100)/100+'</br>';
        code_str=code_str+'Pillars count : '+apl_info.pillar_count+'</br>';
        code_str=code_str+'Tap count : '+apl_info.tap_count+'</br>';
        open_def=Math.round(Math.random()*100);
        closed_def=Math.round(Math.random()*100);
        repairs_def=Math.round(Math.random()*closed_def);
        code_str=code_str+'1 year Defects (open/closed/repairs): '+open_def+'/'+closed_def+'/'+repairs_def+'</br>';
        code_str=code_str+'<div id="apl_bar_stat"><canvas id="apl_stat_'+apl_info.id+'" width="200" height="100"></canvas></div>';
        thatlib.show_info_bar(code_str);
        var options={
            legend:{
                display:false
            }
            };
        var data = {
        labels: ["01", "02", "03", "04", "05", "06"],
        datasets: [
            {
                label: "New defects",
                backgroundColor: "rgba(255,0,0,0.5)",
                borderColor: "rgba(255,0,0,1)",
                borderWidth: 1,
                hoverBackgroundColor: "rgba(255,0,0,1)",
                hoverBorderColor: "rgba(255,255,255,1)",
                data: [Math.random()*20, Math.random()*20, Math.random()*20, Math.random()*20, Math.random()*20, Math.random()*20]
            },
            {
                label: "Closed defects",
                backgroundColor: "rgba(0,255,0,0.5)",
                borderColor: "rgba(0,255,0,1)",
                borderWidth: 1,
                hoverBackgroundColor: "rgba(0,255,0,1)",
                hoverBorderColor: "rgba(255,255,255,1)",
                data: [Math.random()*20, Math.random()*20, Math.random()*20, Math.random()*20, Math.random()*20, Math.random()*20]
            }
            ]
        };
        var ctx = document.getElementById("apl_stat_"+apl_info.id);
        var apl_stats_bar=new Chart(ctx, {
            type: "bar",
            data: data,
            options: options
            }
            );
    };
    
    var onLineMouseOut = function(){
        var line=this;
        thatlib.mark_apl(line.apl_id,false);
    };
    
    var onLineMouseClick = function(){
        var line=this;
        console.debug(line.tap_id);
        show_tap_profile(thatlib,line.tap_id);
    };
   

	var setContextMenuXY=function(latLng){
		var mapWidth = $('#'+thatlib.map_div_id).width();
		var mapHeight = $('#'+thatlib.map_div_id).height();
		var menuWidth = $('.map_contextmenu').width();
		var menuHeight = $('.map_contextmenu').height();
		var clickedPosition = getCanvasXY(latLng);
		var x = clickedPosition.x ;
		var y = clickedPosition.y ;
		console.debug(mapWidth,mapHeight,menuWidth,menuHeight,x,y);
	    if((mapWidth - x ) < menuWidth)//if to close to the map border, decrease x position
		    x = x - menuWidth;
		if((mapHeight - y ) < menuHeight)//if to close to the map border, decrease y position
		    y = y - menuHeight;
	    $('.map_contextmenu').css('left',x  );
		$('.map_contextmenu').css('top',y );
	};
	var getCanvasXY=function(latLng){
		var scale = Math.pow(2, thatlib.map.getZoom());
		var nw = new google.maps.LatLng(
			thatlib.map.getBounds().getNorthEast().lat(),
			thatlib.map.getBounds().getSouthWest().lng()
		);
		var worldCoordinateNW = thatlib.map.getProjection().fromLatLngToPoint(nw);
		var worldCoordinate = thatlib.map.getProjection().fromLatLngToPoint(latLng);
		var currentLatLngOffset = new google.maps.Point(
          Math.floor((worldCoordinate.x - worldCoordinateNW.x) * scale),
          Math.floor((worldCoordinate.y - worldCoordinateNW.y) * scale)
		);
		return currentLatLngOffset;
	};
	var hide_context_menu=function(){
		$('.map_contextmenu').remove();
	};
	var show_pillar_context_menu=function(e,marker){
		var projection;
		var map_contextmenuDir;
		var id=marker.id;
		projection=thatlib.map.getProjection();
		$('.map_contextmenu').remove();
		map_contextmenuDir=document.createElement("div");
		map_contextmenuDir.className='map_contextmenu';
		map_contextmenuDir.innerHTML='<a id="cm_create_new_tap" idvalue="'+id+'"><div class="menu_context">Create new tap</div></a>'
									+'<a id="cm_create_add_pillar" idvalue="'+id+'"><div class="menu_context">Add pillars to previous</div></a>'
									+'<a id="cm_change_type_pillar" idvalue="'+id+'"><div class="menu_context">Change pillar type</div></a>'
									+'<a id="cm_change_cut_pillar" idvalue="'+id+'"><div class="menu_context">Change pillar cut</div></a>'
									+'<a id="cm_delete_pillar" idvalue="'+id+'"><div class="menu_context">Delete pillar</div></a>'
									+'<a id="cm_close"><div class="menu_context">Close</div></a>';
		$(thatlib.map.getDiv()).append(map_contextmenuDir);
		setContextMenuXY(e.latLng);
		map_contextmenuDir.style.visibility="visible";
		
		$('#cm_close').click(function(){
                hide_context_menu();
                });
		$('#cm_create_new_tap').click(function(){
				var id=this.getAttribute("idvalue");
				thatlib.create_new_child_pillar(id);
				hide_context_menu();
				});
		$('#cm_create_add_pillar').click(function(){
				var id=this.getAttribute("idvalue");
				hide_context_menu();
				ap_contextmenuDir=document.createElement("div");
				map_contextmenuDir.className='map_contextmenu';
				str='<div id="cm_add_new_pils" idvalue="'+id+'" class="menu_context"><center><br>';
				str=str+'Add <input type="number" id="cm_cnp_count_edit" value="2" style="width: 50px;"> pillars <br></center>';
				str=str+'Type: <select class="form-control" id="cm_cnp_pillar_type" style="font-size: inherit;height: 28px;"><option value="" title="Select pillar type...">Select type...</option> ';
				thatlib.settings.pillar_type.forEach(function(item){
					str=str+'<option value="'+item.id+'">'+item.name+'</option>';
					});
				str=str+'</select><br>Cut: <select class="form-control" id="cm_cnp_pillar_cut" style="font-size: inherit;height: 28px;"><option value="" title="Select pillar cut...">Select cut...</option> ';
				thatlib.settings.pillar_cut.forEach(function(item){
					str=str+'<option value="'+item.id+'">'+item.name+'</option>';
					});
				str=str+'</select><center><br><button type="button" class="btn btn-success" id="cm_cnp_button">Create</button>';
				str=str+'<button type="button" class="btn btn-danger" id="cm_cnp_cancel_button">Cancel</button></center>'
				str=str+'</div>';
				map_contextmenuDir.innerHTML=str;
				$(thatlib.map.getDiv()).append(map_contextmenuDir);
				setContextMenuXY(e.latLng);
				map_contextmenuDir.style.visibility="visible";
				$('#cm_cnp_button').click(function(){
					id=$('#cm_add_new_pils').attr("idvalue");
					ptid=$('#cm_cnp_pillar_type').val();
					pcid=$('#cm_cnp_pillar_cut').val();
					console.debug(ptid,pcid);
					cnt=$('#cm_cnp_count_edit').val();
					thatlib.add_pillars_to_prev(id,cnt,ptid,pcid);
					hide_context_menu();
				});
				$('#cm_cnp_cancel_button').click(function(){
					hide_context_menu();
				});
				});
		$('#cm_change_type_pillar').click(function(){
				var id=this.getAttribute("idvalue");
				hide_context_menu();
				map_contextmenuDir=document.createElement("div");
				map_contextmenuDir.className='map_contextmenu';
				str='<div id="cm_change_pillar_type" idvalue="'+id+'" class="menu_context">';
				thatlib.settings.pillar_type.forEach(function(item){
					str=str+'<a id="cm_change_type_pillar_button_'+item.id+'" class="cm_chpt_button" idvalue="'+id+'" idtypevalue="'+item.id+'"><div class="menu_context">'+item.name+'</div></a>';
				});
				//'<a id="cm_change_type_pillar" idvalue="'+id+'"><div class="menu_context">Change pillar type</div></a>'
											
				map_contextmenuDir.innerHTML=str;
				$(thatlib.map.getDiv()).append(map_contextmenuDir);
				setContextMenuXY(e.latLng);
				map_contextmenuDir.style.visibility="visible";
				
				
				$('.cm_chpt_button').click(function(){
					id=this.getAttribute("idvalue");
					tid=this.getAttribute("idtypevalue");
					thatlib.change_pillar_type(id,tid);
					hide_context_menu();
				});
		});
		$('#cm_change_cut_pillar').click(function(){
				var id=this.getAttribute("idvalue");
				hide_context_menu();
				map_contextmenuDir=document.createElement("div");
				map_contextmenuDir.className='map_contextmenu';
				str='<div id="cm_change_pillar_cut" idvalue="'+id+'" class="menu_context">';
				thatlib.settings.pillar_cut.forEach(function(item){
					str=str+'<a id="cm_change_cut_pillar_button_'+item.id+'" class="cm_chpc_button" idvalue="'+id+'" idcutvalue="'+item.id+'"><div class="menu_context">'+item.name+'</div></a>';
				});
				map_contextmenuDir.innerHTML=str;
				$(thatlib.map.getDiv()).append(map_contextmenuDir);
				setContextMenuXY(e.latLng);
				map_contextmenuDir.style.visibility="visible";
				$('.cm_chpc_button').click(function(){
					id=this.getAttribute("idvalue");
					cid=this.getAttribute("idcutvalue");
					thatlib.change_pillar_cut(id,cid);
					hide_context_menu();
				});
		});
	};
	var onPillarRightClick = function(e){
		var marker=this;
		show_pillar_context_menu(e,marker);
	};
    var onTransDragend = function(){
        if (thatlib.editable_pillar){
            var marker =this;
			var point= marker.getPosition();
			id=marker.id;
			new_latitude=point.lat();
			new_longitude=point.lng();
			//console.debug('Modified id: '+id+' New_latitude:'+new_latitude+' New longitude:' +new_longitude);
			var data={};
			data.trans_id=id;
			data.new_latitude=new_latitude;
			data.new_longitude=new_longitude;
			xhr=new XMLHttpRequest();
			xhr.open('POST','/apiv1/trans/newcoorddrop',true);
			xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
			xhr.send(JSON.stringify(data));
            xhr.onload=function(){
                thatlib.get_apl_lines_data();
                thatlib.get_trans_data();
            };
            
		}
    };
    var onTransMouseOver=function(){
        
    };
    var onTransMouseOut=function(){
        
    };

    
    var onTransButtonClick=function(){
        console.debug('Click trans button');
        
        };
    var onAPLButtonClick=function(){
        console.debug('Click APL button');
        code_str="";
        for (var i = 0; i<thatlib.settings.apl_list.counter; i++){
            var apl=thatlib.settings.apl_list.apls[i];
			var display_none="display:none;";
			var checked='';
			if ($.inArray(apl.id,thatlib.apl_ids)>=0) {
                checked=' checked';
				display_none="display:block;"
                }
            code_str=code_str+'<div class="apl_list" id="apl_info_'+apl.id+' "idvalue="'+apl.id+'">'+
            '<label class="checkbox-inline chb_apl_menu"><input type="checkbox" value="'+apl.id+'" id="apl_chb_'+apl.id+'" ';
			code_str=code_str+checked;
            code_str=code_str+'>'+apl.name+'</label>&nbsp;<span class="glyphicon glyphicon-fullscreen apl_lb_bound" idvalue="'+apl.id+'" style="cursor:pointer;'+display_none+'" id="apl_goto_'+apl.id+'"/>'+
            '&nbsp;<span class="glyphicon glyphicon-save-file" style="cursor:pointer;" id="apl_save_passport_'+apl.id+'"/>'+
            '&nbsp;<span class="glyphicon glyphicon-log-in apl_lb_link_to_system" style="cursor:pointer;" idvalue="'+apl.id+'" id="apl_goto_system_'+apl.id+'"/>'+
			//glyphicon glyphicon-log-in
			'</div>';
            //'<div class="apl_list_name">'+apl.name+'</div></div>';
        }
        thatlib.show_info_bar(code_str);
		$('.apl_lb_bound').click(function(){
			id=this.getAttribute('idvalue');
			thatlib.set_bounds_apl(id);
			if (thatlib.apls[id].rec_layer!==false){
				lr_name=thatlib.apls[id].rec_layer;
				btn_name=lr_name+"_button";
				thatlib.layers[lr_name].vis=1;
				thatlib.vis_layer(lr_name);
				$("#"+btn_name).addClass("selected_button");
			};
			
		});
		$('.apl_lb_link_to_system').click(function(){
			id=this.getAttribute('idvalue');
			str='/web#id='+id+'&view_type=form&model=uis.papl.apl';
			window.open(str);
		});
        for (var j=0;j<thatlib.settings.apl_list.counter;j++){
            var napl=thatlib.settings.apl_list.apls[j];
            var naid=napl.id;
            $('#apl_chb_'+naid).change(function(){
                intid=Math.round(this.value);
				console.debug(this.value+' is '+ this.checked);
                $('#apl_goto_'+intid).hide();
				if (this.checked){
                    thatlib.apl_ids.push(intid);
					$('#apl_goto_'+intid).show("fast");
                }
                else {
                    ind=thatlib.apl_ids.indexOf(intid);
					console.debug(ind);
					thatlib.apl_ids.splice(ind,1);
					//remid=Math.round(this.value);
                    
                    /*thatlib.apl_ids=jQuery(thatlib.apl_ids,function(value){
                        return value == remid;
                    });*/
                }
                console.debug(thatlib.apl_ids);
				thatlib.get_hash();
            });
        }
    };
    var onPillarButtonClick=function(){
        console.debug('Click pillar button');
        code_str="";
        for (var i = 0; i < thatlib.pillar_data.counter; i++) {
            var marker=thatlib.markers.pillars[thatlib.pillar_data.pillars[i].id];
            code_str=code_str+'<div class="marker_list" id="pil_info_'+marker.id+'" idvalue="'+marker.id+'"><div class="marker_list_name">'+marker.name+'</div><div class="marker_list_bar">'+
            '<div class="progress" style="height: 8px; background:none">'+
			'<div class="progress-bar progress-bar-success" style="width:'+Math.round(Math.random()*33)+'%"></div>'+
			'<div class="progress-bar progress-bar-warning" style="width:'+Math.round(Math.random()*33)+'%"></div>'+
            '<div class="progress-bar progress-bar-danger" style="width:'+Math.round(Math.random()*33)+'%"></div></div>'+
            '</div></div>';
            }
        thatlib.show_info_bar(code_str);
        for (var j=0;j<thatlib.pillar_data.counter;j++){
            var marker=thatlib.markers.pillars[thatlib.pillar_data.pillars[j].id];
            mid=marker.id;
            //console.debug(mid);
            $("#pil_info_"+mid).mouseover(function(){
                var id=this.getAttribute("idvalue");
                thatlib.mark_pillar(id,true);
                //thatlib.map.panTo(thatlib.markers.pillars[id].position);
                });
            $("#pil_info_"+mid).mouseout(function(){
                var id=this.getAttribute("idvalue");
                thatlib.mark_pillar(id,false);
                });
            $("#pil_info_"+mid).click(function(){
                var id=this.getAttribute("idvalue");
                thatlib.mark_pillar(id,true);
                thatlib.map.panTo(thatlib.markers.pillars[id].position);
                });
        }
    };
    //Define info functions
    this.show_status_bar=function(){
        var czoom=this.map.getZoom();
        code="Zoom:"+czoom;
        $("#left_status_bar").html(code);
    };
    this.show_info_bar=function(code){
        $("#left_info_bar").html(code);
    };
    
    //Define functions
    this.set_map_center=function(slat,slong){
        this.center_loc=new google.maps.LatLng(slat,slong);
        this.map.panTo(this.center_loc);
    };
    
    this.set_bounds=function(){
        //console.debug(this.pillar_data.minlat,this.pillar_data.minlong);
        var location = new google.maps.LatLng(this.pillar_data.minlat,this.pillar_data.minlong);
        this.bounds.extend(location);
        location=new google.maps.LatLng(this.pillar_data.maxlat,this.pillar_data.maxlong);
        this.bounds.extend(location);
    };
	this.set_bounds_apl=function(apl_id){
		minlat=180;
		maxlat=0;
		minlng=180;
		maxlng=0;
		this.pillar_data.pillars.forEach(function(item){
			if (item.apl_id==apl_id){
				if (item.latitude>maxlat){maxlat=item.latitude};
				if (item.latitude<minlat){minlat=item.latitude};
				if (item.longitude>maxlng){maxlng=item.longitude};
				if (item.longitude<minlng){minlng=item.longitude};
			};
			});
		//console.debug(minlat,maxlat,minlng,maxlng);
		this.bounds=new google.maps.LatLngBounds();
		var location = new google.maps.LatLng(minlat,minlng);
        this.bounds.extend(location);
        location=new google.maps.LatLng(maxlat,maxlng);
        this.bounds.extend(location);
		this.map.fitBounds(this.bounds);
	};
    
    this.mark_pillar=function(pid, mark){
        cm=this.markers.pillars[pid];
        this.markers.pillars[pid].setIcon(this.get_pillar_icon(cm.apl_id,cm.pillar_icon_code,cm.type_id,cm.rotation,cm.state,mark));
		if (this.map.getZoom()>15){
			if (mark){
				this.markers.pillars[pid].infowindow.open(this.map,this.markers.pillars[pid]);
			}
			if (!mark){
				this.markers.pillars[pid].infowindow.close();
			}	
		}
		
		
    };
    
    this.mark_apl=function(apl_id,mark){
        for (var i=0;i<this.lines_data.counter;i++){
            line=this.lines[i];
            if (line.apl_id===apl_id){
                this.lines[i].setOptions({
                    strokeColor:this.get_line_color(mark)
                });
            }
        }
    };
    
    this.get_trans_icon=function(rotation,state,selectable){
        //Add Icon trans function
        //var s=10;
        var color='blue';
        switch (state.toUpperCase()){
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
        var z1=13;
        var z2=19;
        var x1=0.15;
        var x2=3.8;
        var z=this.map.getZoom();
        var scalez=(z*(x2-x1)-z1*x2+x1*z2)/(z2-z1);
        var pci={
            path: 'M 0,0 10,0 5,10 0,0 0,10 10,10 10,0 z',
            fillColor:'red',
            fillOpacity:fillOpacity,
            scale:scalez,
            strokeColor:color,
            strokeWeight:2,
            anchor: new google.maps.Point(5,10),
			rotation:rotation
        };
        return pci;
    };
    this.get_pillar_icon=function(apl_id,pic,type,rotation,state,selectable){
        var color='blue';
        //if (!this.settings.pillar_icon[pic].stroke_color){color=this.settings.pillar_icon[pic].stroke_color;}
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
        ///!!!stroke_w
        var fillOpacity=0;
        var fillColor='black';
        if (this.settings.pillar_icon[pic].fill_path){fillOpacity=1;}
        if (this.settings.pillar_icon[pic].fill_color!==''){fillColor=this.settings.pillar_icon[pic].fill_color;}

        if (selectable){
            fillOpacity=1;
            fillColor='red';  //NUPD Change to read value from settings
        }
		var azoom=1;
		if (this.settings.pillar_icon[pic].azoom !== ''){azoom=this.settings.pillar_icon[pic].azoom;}
        var z1=12;
        var z2=19;
        var x1=0.12;
        var x2=1.2;
        var z=this.map.getZoom();
        var scalez=azoom*(z*(x2-x1)-z1*x2+x1*z2)/(z2-z1);
		//console.debug(this.apl_ids,apl_id,this.apl_ids.indexOf(apl_id));
		if (this.apl_ids.indexOf(apl_id)===-1){
			scalez=0;
		}
        var strokeWeight=2;  //NUPD Change to read DEF value
        if (this.settings.pillar_icon[pic].stroke_width>0){strokeWeight=this.settings.pillar_icon[pic].stroke_width}
        var pth=this.settings.pillar_icon[pic].path;
        var pci={
            //path:google.maps.SymbolPath.CIRCLE,
            path:pth,//this.settings.pillar_icon[pic].path,
            fillColor:fillColor,
            fillOpacity:fillOpacity,
            scale:scalez,
            strokeColor:color,
            strokeWeight:strokeWeight,
            anchor: new google.maps.Point(5,5),
            rotation: rotation
        };
        return pci;
    };
    
    this.get_line_color=function(selectable){
        var color="#000099";
        if (selectable){
            color="#00FFFF";
        }
        return color;
    };
    
    this.set_show_pillar=function(vis) {
        for (var i = 0; i < thatlib.pillar_data.counter; i++) {
                if (typeof thatlib.markers.pillars[thatlib.pillar_data.pillars[i].id] != "undefined") {
                    thatlib.markers.pillars[thatlib.pillar_data.pillars[i].id].setVisible(vis);
    
                }
        }
    };
    this.set_show_trans=function(vis){
        for (var i=0; i < thatlib.trans_data.counter;i++){
            if (typeof thatlib.markers.trans[thatlib.trans_data.trans[i].id] != "undefined"){
                thatlib.markers.trans[thatlib.trans_data.trans[i].id].setVisible(vis);
                
            }
        }
    };
    
    //SET markers, transformators and lines functions
    
    this.set_lines=function(){
        for (var j=0; j<this.apl_data.counter;j++){
            apl=this.apl_data.apls[j];
            this.apls[apl.id]={
                id: apl.id,
                name: apl.name,
                type: apl.type,
                feeder_num: apl.feeder_num,
                voltage: apl.voltage,
                inv_num: apl.inv_num,
                line_len: apl.line_len,
                status: apl.status,
                pillar_count: apl.pillar_count,
                tap_count: apl.tap_count,
				rec_layer:apl.rec_layer
                };
            }
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
                strokeColor: this.get_line_color(false),//"#0000FF",
                strokeOpacity: 1.0,
                strokeWeight: 2,
                map: this.map,
                apl_id: line.apl_id,
                tap_id: line.tap_id
                });
            google.maps.event.addListener(this.lines[i],'mouseover', onLineMouseOver);
            google.maps.event.addListener(this.lines[i],'mouseout', onLineMouseOut);
            google.maps.event.addListener(this.lines[i],'click',onLineMouseClick);
            }
         $("#apl_count_badge").html(this.apl_data.counter);
         /*
             'id':apl_id.id,
                    'name':apl_id.name,
                    'type':apl_id.apl_type,
                    'feeder_num':apl_id.feeder_num,
                    'voltage':apl_id.voltage,
                    'inv_num':apl_id.inv_num,
                    'line_len':apl_id.line_len_calc,
                    'status':apl_id.status,
                    'pillar_count':"N/A", #Change to counter
                    'tap_count':"N/A" #Change to counter
                    })*/
    };
    this.set_trans_markers=function(){
        for (var i=0;i<this.trans_data.counter; i++){
            cur_trans=this.trans_data.trans[i];
            var location={};
            if (cur_trans.latitude && cur_trans.longitude){
                location = new google.maps.LatLng(cur_trans.latitude, cur_trans.longitude);
                }
            if (typeof this.markers.trans[cur_trans.id] != 'undefined'){
                cur_marker=this.markers.trans[cur_trans.id];
                this.markers.trans[cur_trans.id].setIcon(this.get_trans_icon(cur_trans.rotation,cur_trans.state,false));
                if (cur_marker.position != location){
                    this.markers.trans[cur_trans.id].setPosition(location);
                }
                if (cur_marker.state != cur_trans.state){
                    this.markers.trans[cur_trans.id].setIcon(this.get_trans_icon(cur_trans.rotation,cur_trans.state,false));
                }
				if (cur_marker.rotation != cur_trans.rotation){
					this.marker.trans[cur_trans.id].rotation=cur_trans_rotation
				}
            }
            else{
                this.markers.trans[cur_trans.id]=new google.maps.Marker({
                   id: cur_trans.id,
                   map:this.map,
                   draggable:true,
                   position: location,
                   visible: true,
                   state:cur_trans.state,
				   rotation:cur_trans.rotation,
                   icon:this.get_trans_icon(cur_trans.rotation,cur_trans.state,false)
                });
                google.maps.event.addListener(this.markers.trans[cur_trans.id],'dragend', onTransDragend);
                google.maps.event.addListener(this.markers.trans[cur_trans.id],'mouseover', onTransMouseOver);
                google.maps.event.addListener(this.markers.trans[cur_trans.id],'mouseout', onTransMouseOut);
            }
        }
        $("#trans_count_badge").html(this.trans_data.counter);
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
                /**/
				this.markers.pillars[cur_pillar.id].setIcon(this.get_pillar_icon(cur_pillar.apl_id,cur_pillar.pillar_icon_code,cur_pillar.type_id,cur_pillar.rotation,cur_pillar.state, false));
				//this.markers.pillars[cur_pillar.id].setMap(this.map);
				if (cur_marker.type_id != cur_pillar.type_id){
					this.markers.pillars[cur_pillar.id].type_id=cur_pillar.type_id;
				}
				if (cur_marker.pillar_icon_code!=cur_pillar.pillar_icon_code){
					this.markers.pillars[cur_pillar.id].pillar_icon_code=cur_pillar.pillar_icon_code;
					console.debug('change icon code');
				}
				if (cur_marker.rotation != cur_pillar.rotation){
					this.markers.pillars[cur_pillar.id].rotation=cur_pillar.rotation;
				}
				if (cur_marker.position != location) {
					this.markers.pillars[cur_pillar.id].setPosition(location);
				}
				if (cur_marker.elevation != cur_pillar.elevation) {
					this.markers.pillars[cur_pillar.id].elevation=cur_pillar.elevation;
				}
				if (cur_marker.base_pillar != cur_pillar.base_pillar){
					this.markers.pillars[cur_pillar.id].base_pillar=cur_pillar.base_pillar;
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
				cut_id:cur_pillar.cut_id,
                rotation:cur_pillar.rotation,
				pillar_icon_code:cur_pillar.pillar_icon_code,
				base_pillar:cur_pillar.base_pillar,
                state:cur_pillar.state,
				title:cur_pillar.name,
                icon:this.get_pillar_icon(cur_pillar.apl_id,cur_pillar.pillar_icon_code,cur_pillar.type_id,cur_pillar.rotation,cur_pillar.state, false)
                });
				this.markers.pillars[cur_pillar.id].infowindow=new InfoBubble({
					map:this.map,
					content: (cur_pillar.num_by_vl).toString(),
					disableAutoPan: true,
					hideCloseButton: true,
					maxWidth: 40,
					minWidth:35,
					shadowStyle: 0,
					padding: 1,
					borderRadius: 7,
					arrowSize: 3,
					arrowStyle: 0,
					backgroundColor: 'rgb(255,255,255)',
					borderWidth: 1,
					borderColor: '#0a0a0a'
					/*,
					maxWidth:0,
					zIndex:null,
					pixelOffset: new google.maps.Size(-140, 80),
					disableAutoPan:false,
					boxStyle:{
						opacity:0.9,
						width:"40px"
					},
					closeBoxMargin: "1px 1px 1px 1px",
					//closeBoxURL:"images/close.gif",
					infoBoxClearance: new google.maps.Size(1,1),
					isHiden:false,
					pane: "floatPane",
					enableEventPropagation:false*/
				});
				google.maps.event.addListener(this.markers.pillars[cur_pillar.id], 'dragend', onPillarDragend);
				google.maps.event.addListener(this.markers.pillars[cur_pillar.id], 'dragstart',onPillarDragStart);
				google.maps.event.addListener(this.markers.pillars[cur_pillar.id], 'drag', onPillarDrag);
                google.maps.event.addListener(this.markers.pillars[cur_pillar.id], 'mouseover', onPillarMouseOver);
                google.maps.event.addListener(this.markers.pillars[cur_pillar.id], 'mouseout', onPillarMouseOut);
				google.maps.event.addListener(this.markers.pillars[cur_pillar.id], 'dblclick', onPillarDoubleClick);
				google.maps.event.addListener(this.markers.pillars[cur_pillar.id], 'mousewheel', onPillarMouseWheel);
				google.maps.event.addListener(this.markers.pillars[cur_pillar.id], 'rightclick', onPillarRightClick);
			}
            /*this.markers.pillars.forEach(function(item,i){
				if ($.inArray(item.apl_id,thatlib.apl_ids)<0){
					console.debug(i);
					thatlib.markers.pillars[i].setMap(null);
					//ind=thatlib.markers.pillars.indexOf(item);
					//console.debug(ind);
					//thatlib.markers.pillars.splice(i,1);
				}
				});*/
			//this.markers.pillars[cur_pillar.id].setPosition(location);
            //var imagecur=pillar_image;
            
        }
        $("#pillar_count_badge").html(this.pillar_data.counter);
    };
    //Get data functions
	this.send_change_pillar=function(data){
		xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/pillar/change_pillar', true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            that.get_apl_lines_data();
            that.get_pillar_data();
            };
	};
	this.change_pillar_type=function(id,ptid){
		var data={};
		data.pillar_id=id;
		data.pillar_type_id=ptid;
		this.send_change_pillar(data);
	};
	this.change_pillar_cut=function(id,pcid){
		var data={};
		data.pillar_id=id;
		data.pillar_cut_id=pcid;
		this.send_change_pillar(data);
	};
	this.add_pillars_to_prev=function(id,cnt,ptid,pcid){
		var data={};
		data.pillar_id=id;
		data.pillar_cnt=cnt;
		if (ptid>0){data.pillar_type_id=ptid};
		if (pcid>0){data.pillar_cut_id=pcid};
		xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/pillar/add_pillar_to_prev', true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            that.get_apl_lines_data();
            that.get_pillar_data();
            };
	};
    this.create_new_child_pillar=function(pid){
		var data={};
		data.pillar_id=pid;
		xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/pillar/new_child_pillar', true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            that.get_apl_lines_data();
            that.get_pillar_data();
            };
	};
	this.get_hash=function(){
        //console.debug('Get hash');
		var data={};
        data.apl_ids=this.apl_ids;
        xhr_apl=new XMLHttpRequest();
        xhr_apl.open('POST','/apiv1/apl/data/hash',true);
        xhr_apl.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr_apl.send(JSON.stringify(data));
        var that=this;
        xhr_apl.onload=function(e){
            var res=JSON.parse(this.response);
            var hash=JSON.parse(res.result.hash_apl);
            //console.debug(hash);
            if (that.hash.apl_data!=hash){
                that.hash.apl_data=hash;
                that.get_apl_lines_data();
            }
        };
        xhr_pillar=new XMLHttpRequest();
        xhr_pillar.open('POST','/apiv1/pillar/data/hash',true);
        xhr_pillar.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr_pillar.send(JSON.stringify(data));
        xhr_pillar.onload=function(e){
            var res=JSON.parse(this.response);
            var hash=JSON.parse(res.result.hash_pillar);
            //console.debug(hash);
            if (that.hash.pillar_data!=hash){
                that.hash.pillar_data=hash;
                that.get_pillar_data();
            }
        };
        xhr_trans=new XMLHttpRequest();
        xhr_trans.open('POST','/apiv1/trans/data/hash',true);
        xhr_trans.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr_trans.send(JSON.stringify(data));
        xhr_trans.onload=function(e){
            var res=JSON.parse(this.response);
            var hash=JSON.parse(res.result.hash_trans);
            //console.debug(hash);
            if (that.hash.trans_data!=hash){
                that.hash.trans_data=hash;
                that.get_trans_data();
            }
        };
    }
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
    this.get_trans_data=function(){
        var data={};
        data.apl_ids=this.apl_ids;
        xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/trans/data',true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response);
            var td=JSON.parse(res.result.trans_data);
            that.trans_data=td;
            that.set_trans_markers();
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
	this.get_settings_layers=function(){
		var data={};
		xhr=new XMLHttpRequest();
		xhr.open('POST','/apiv1/settings/layers',true);
		xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
		xhr.onload=function(e){
			var res=JSON.parse(this.response);
			var lr=JSON.parse(res.result.lr_data);
			for (var i=0;i<lr.counter;i++){
				cur_lr=lr.lrs[i];
				that.settings.layers[cur_lr.name]=cur_lr;
				that.layers[cur_lr.name]=[];
				that.layers[cur_lr.name].vis=0;
				that.layers[cur_lr.name].type='ImageMapType';
				that.layers[cur_lr.name].name=cur_lr.name;
				//console.debug(that.layers[cur_lr.name]);
				//ln=cur_lr.name;
				that.layers[cur_lr.name].ImageMap=new google.maps.ImageMapType({
					getTileUrl: function(coord,zoom){
					    ln=this.name;
						pz=zoom;
						url="/maps/"+ln+"/"+pz+"/"+coord.x+"/"+coord.y;
						return url;
					},
					tileSize: new google.maps.Size(256,256),
					isPng: true,
					alt: cur_lr.alt,
					name: cur_lr.name,
					opacity: cur_lr.opacity
				});
				//that.vis_layer(cur_lr.name);
				code='';
				code='<img src="'+cur_lr.url_icon+'" class="img-circle menu_button" alt="'+cur_lr.name+'" nvalue="'+cur_lr.name+'" width="50" height="50" id="'+cur_lr.name+'_button"/>';
				$('#menu_button_bar').append(code);
				$("#"+cur_lr.name+"_button").click(function(e){
					//console.debug(this);
					var nval=this.getAttribute("nvalue");
					e.preventDefault();
					that.toggle_layer(nval);
					$("#"+nval+"_button").toggleClass("selected_button");
				});
		}
		};
	};
	this.get_settings_apl_list=function(){
		var data={};
        xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/apl/list', true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response);
            var al=JSON.parse(res.result.apl_list);
            that.settings.apl_list=al;
            };
	};
	this.get_settings_global=function(){
		var data={};
		data.variables=[];
		this.settings.global_var.forEach(function(item){
			console.debug(item);
			data.variables.push(item);
			});
		xhr=new XMLHttpRequest();
		xhr.open('POST','/apiv1/settings/global', true);
		xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
		xhr.send(JSON.stringify(data));
		var that=this;
		xhr.onload=function(e){
			var res=JSON.parse(this.response);
			var gs=JSON.parse(res.result.gs_data);
			for (var i=0;i<gs.counter;i++){
				that.settings.global_var[gs.gss[i].varname]=gs.gss[i].value;
			}
		};
	};
    this.get_settings_icon_list=function(){
        var data={};
        xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/settings/pillar_icon_list',true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response);
            var pil=JSON.parse(res.result.pi_data);
            for (var i=0;i<pil.counter; i++) {
                cur_pi=pil.pis[i];
                that.settings.pillar_icon[cur_pi.code]=cur_pi;
            }
        };
    };
	this.get_settings_pillar_cut_list=function(){
		var data={};
		xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/settings/pillar_cut_list',true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response);
            var pc=JSON.parse(res.result.pc_data);
            for (var i=0;i<pc.counter; i++) {
                cur_pc=pc.pcs[i];
                that.settings.pillar_cut[cur_pc.id]=cur_pc;
            }
        };
	};
	this.get_settings_pillar_type_list=function(){
		var data={};
		xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/settings/pillar_type_list',true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response);
            var pt=JSON.parse(res.result.pt_data);
            for (var i=0;i<pt.counter; i++) {
                cur_pt=pt.pts[i];
                that.settings.pillar_type[cur_pt.id]=cur_pt;
            }
        };
	}
    this.load_settings=function(){
	   this.get_settings_apl_list();
	   this.get_settings_icon_list();
	   this.get_settings_pillar_type_list();
	   this.get_settings_pillar_cut_list();
	   this.get_settings_global();
    };
	this.init_global_vars=function(){
		this.settings.global_var.push('auto_refresh_time');
		this.settings.global_var.auto_refresh_time=60;
		this.settings.global_var.photo_icon_path="M20 48 L20 64 L44 64 L44 48 L36 48 L64 0 L0 0 L28 48 Z";
		this.settings.global_var.push('photo_icon_path');
		this.settings.global_var.photo_point_icon="M-3,3 3,-3 M-3,-3 3,3"
		this.settings.global_var.push('photo_point_icon');
		
	};
    this.init=function(){
		this.init_global_vars();
	    this.load_settings();
        //this.get_pillar_data();
        this.get_trans_data();
        this.get_hash();
        //this.get_apl_lines_data();
        //console.debug(this.pillar_data);
        //this.init_rosreestr_map();
        //this.init_yandex_map();
        //this.init_esri_map();
        this.init_buttons();
		this.get_settings_layers();
        that=this;
        google.maps.event.addListener(thatlib.map, 'zoom_changed', function() {
            hide_context_menu();
			var zoom = thatlib.map.getZoom();
            that.set_trans_markers();
            that.set_pillar_markers();
            that.show_status_bar();
            if (zoom <= that.showpillarzoom) {
               that.set_show_pillar(false);
            } else {
               that.set_show_pillar(true);
            }
            if (zoom <= that.showtranszoom) {
               that.set_show_trans(false);
            } else {
               that.set_show_trans(true);
            }
        });
        //this.set_map_center(this.pillar_data.latitude,this.pillar_data.longitude);
        //this.map.fitBounds(this.bounds);
    };
    
    this.toggle_layer=function(layer_name){
        console.debug(layer_name);
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
            //this.map.overlayMapTypes.push(this.layers[layer_name].ImageMap);
            this.map.overlayMapTypes.insertAt(0, this.layers[layer_name].ImageMap);
        }
        if (this.layers[layer_name].vis===0) {
            ind=this.map.overlayMapTypes.indexOf(this.layers[layer_name].ImageMap);
			this.map.overlayMapTypes.removeAt(ind);
        }
    };
    
    this.init_buttons=function(){
        $("#pillar_button").click(function(){
            onPillarButtonClick();
        });
        $("#trans_button").click(function(){
            onTransButtonClick();
        });
        $("#apl_button").click(function(){
            onAPLButtonClick();
        });
    };
    /* Loaded from server
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
            url = url+"dpi=96&transparent=true&format=png32";
            url=url+"&bboxSR=4326";
            url=url+"&imageSR=102100";
            url=url+"&size=256,256";
            url=url+"&f=image";
            url=url+"&bbox="+bbox;
			pz=zoom;
			//url="/maps/rosreestr_cadastre/"+pz+"/"+coord.x+"/"+coord.y;
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
    this.init_esri_map=function(){
        this.layers.esri=[];
        this.layers.esri.vis=0;
        this.layers.esri.type='ImageMapType';
        this.layers.esri.name='Esri';
        that=this;
        this.layers.esri.ImageMap=new google.maps.ImageMapType({
            getTileUrl:function(coord,zoom){
               var url="http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/";
               pz=zoom;
               url=url+pz+"/"+coord.y+"/"+coord.x;
               if (zoom>17){
                url = null;
               }
                var ddy=0;
                elem=$('.gm-style:first-child').children().first().children().first().children().first();
                strtop=ddy+'px';
                elem.css({top:strtop});
               //console.debug(url);
			   	//url="/maps/esri_imagery/"+pz+"/"+coord.x+"/"+coord.y;
				return url;
               //GetURLBase+inttostr(GetZ-1)+'/'+inttostr(GetY)+'/'+inttostr(GetX);
            },
            tileSize: new google.maps.Size(256,256),
            isPng: false,
            alt: "Esri Layer",
            name: "Esri images",
            maxZoom:17,
            opacity:1 
        });
        this.vis_layer('esri');
    };
    this.init_yandex_map=function(){
        this.layers.yandex=[];
        this.layers.yandex.vis=0;
        this.layers.yandex.type='ImageMapType';
        this.layers.yandex.name='Yandex Satelite';
        that=this;
        this.layers.yandex.ImageMap=new google.maps.ImageMapType({
        getTileUrl: function (coord,zoom){
            //console.debug(coord.x,coord.y);
            //var url="http://sat01.maps.yandex.net/tiles?l=sat";
            var url="http://sat01.maps.yandex.net/tiles?l=sat&lang=en_US";
            var dy=0;
            if (zoom>10){
                dy=Math.pow(2,zoom-10)
            };
            var ddy=0;
            switch(zoom){
                case 11:
                    ddy=46;
                    break;
                case 12:
                    ddy=88;
                    break;
                case 13:
                    ddy=-82;
                    dy=dy-1;
                    break;
                case 14:
                    ddy=94;
                    dy=dy-1;
                    break;
                case 15:
                    ddy=-22;
                    dy=dy-3;
                    break;
                case 16:
                    dy=dy-6;
                    ddy=-30;
                    break;
                case 17:
                    dy=dy+12;
                    ddy=-50;
                case 18:
                    dy=dy-23;
                    ddy=95;
            }
            elem=$('.gm-style:first-child').children().first().children().first().children().first();
            strtop=ddy+'px';
            elem.css({top:strtop});
            var ya_zoom=zoom;
            var ya_y=coord.y+dy;
            url=url+"&x="+coord.x;
            url=url+"&y="+ya_y;
            url=url+"&z="+ya_zoom;
            if (zoom>18){url=null};
            return url;
        },
        tileSize: new google.maps.Size(256,256),
        isPng: true,
        alt: "Yandex Satelite Layer",
        name: "Yandex.Satelite",
        maxZoom:19,
        opacity:1
        });
        this.vis_layer('yandex');
    };
    
    */
	/*Layers loaded from server */
}

var sitemapslib=new mapslib(apl_ids,'site-map');
sitemapslib.init();
//var photo_ref=new sitephotolib.refresher();
function map_ref() {
    sitemapslib.get_hash();
    //sitemapslib.get_pillar_data();
    //sitemapslib.get_apl_lines_data();
    //sitemapslib.get_trans_data();
    }

map_ref();
ref_functions.push(map_ref);