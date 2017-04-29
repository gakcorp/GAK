var onPillarDragStart = function(e){
		if (thatlib.editable_pillar){
			var marker=this;
			if (marker.base_pillar === false){
				point1=marker.getPosition();
				pid=marker.prev_id;
				point2=thatlib.markers.pillars[pid].getPosition();
				px1=point1.lat();
				px2=point2.lat();
				py1=point1.lng();
				py2=point2.lng();
				pk=(py2-py1)/(px2-px1);
				pk2=-1/pk;
				pb=py1-px1*(py2-py1)/(px2-px1);	
			}				
		}
	};
 var onPillarDrag = function(e){
		if (thatlib.editable_pillar){
			//console.debug(e);
			var marker=this;
			if (marker.base_pillar===false){
				var point3=marker.getPosition();
				var px3=point3.lat();
				var py3=point3.lng();
				var pb2=py3-pk2*px3;
				px4=(pb2-pb)/(pk-pk2);
				py4=pk2*px4+pb2;
				//console.debug('k='+pb2+'p3='+'('+px3+';'+py3+') p4.lat='+px4+';lng='+py4);
				var location = new google.maps.LatLng(px4,py4);
				thatlib.markers.pillars[marker.id].setPosition(location);//NUPD cur_pillar to marker
			}
		}
	};
	var onPillarDragend = function(){
        if (thatlib.editable_pillar){
            var marker =this;
			var point= marker.getPosition();
			id=marker.id;
			new_latitude=point.lat();
			new_longitude=point.lng();
			if (marker.base_pillar === false){
				new_latitude=px4;
				new_longitude=py4;
			}
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
                thatlib.get_pillar_data();
            };
            
		}
        
    };
	

var onPillarDoubleClick = function(){
	if (thatlib.editable_pillar){
		var marker=this;
		var data={};
		id=marker.id;
		data.pillar_id=id;
		xhr=new XMLHttpRequest();
		xhr.open('POST','/apiv1/pillar/cycle_type',true);
		xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
		xhr.send(JSON.stringify(data));
        xhr.onload=function(){
        thatlib.get_pillar_data();
        };
	}
};
	var onPillarMouseWheel = function(e){
		show_info_bar('Test');
	};
	
var onPillarMouseOut=function(){
    var marker=this;
    thatlib.mark_pillar(marker.id, false);
};

var onPillarMouseOver = function(){
        var marker=this;
        var code_str='';
        code_str='Pillar ID : '+marker.id+'</br>';
        code_str=code_str+'APL : '+marker.apl+'</br>';
        code_str=code_str+'Num by VL : '+marker.num_by_vl+'</br>';
        code_str=code_str+'Full name : '+marker.name+'</br>';
        if (marker.type_id>0){code_str=code_str+'Type : '+ thatlib.settings.pillar_type[marker.type_id].name+'</br>';}
		else{code_str=code_str+'Type : no data</br>';}
		if (marker.cut_id>0){code_str=code_str+'Cut : '+ thatlib.settings.pillar_cut[marker.cut_id].name+'</br>';}
		else{code_str=code_str+'Cut: no data</br>';}
        code_str=code_str+'Elevation : '+marker.elevation+'</br>';
        code_str=code_str+'Rotation : '+marker.rotation+'</br>';
        open_def=Math.round(Math.random()*100);
        closed_def=Math.round(Math.random()*100);
        repairs_def=Math.round(Math.random()*closed_def);
        code_str=code_str+'1 year Defects (open/closed/repairs): '+open_def+'/'+closed_def+'/'+repairs_def+'</br>';
        code_str=code_str+'<div><div id="pillar_pie_stat"><canvas id="pillar_stat_'+marker.id+'" width="60" height="60"></canvas></div>';
        code_str=code_str+'<div id="pillar_bar_stat"><canvas id="pillar_stat_bar_'+marker.id+'" width="120" height="60"></canvas></div></div>';
        thatlib.show_info_bar(code_str);
        thatlib.mark_pillar(marker.id, true);
        var data = {
            datasets: [{
                data: [open_def,closed_def,repairs_def],
                backgroundColor: ["#FF0000","#00FF00","#0000FF"],
                label: '1Y Deffects' 
            }],
            labels: ['open','closed','repairs']
            };
        //var ctx = $("#pillar_stat_"+marker.id);
        var options={
            cutoutPercentage:70,
            legend:{
                display:false
            }
            };
        var ctx1 = document.getElementById("pillar_stat_"+marker.id)/*.getContext("2d")*/;
        var Chart1 = new Chart(ctx1, {
            type: 'pie',
            data: data,
            options:options/*,
            animation:{
                animateScale:true
            }*/
        });
        var data2={
            labels:["01","02","03","04","05","06"],
            datasets:[
                {
                    label:"Defects",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderColor: "rgba(255,255,255,0.8)",
                    borderWidth: 1,
                    hoverBackgroundColor: "rgba(255,255,255,1)",
                    hoverBorderColor: "rgba(255,255,255,1)",
                    data:[Math.round(Math.random()*20),Math.round(Math.random()*20),Math.round(Math.random()*20),Math.round(Math.random()*20),Math.round(Math.random()*20),Math.round(Math.random()*20)]
                }
            ]
        };
        var options2={
            scales:{
                xAxes:[{
                    display:false
                    }]
                },
            legend:{
                display:false
                }
            };
        var ctx2 = document.getElementById("pillar_stat_bar_"+marker.id);
        var Bar1= new Chart(ctx2, {
            type: 'bar',
            data: data2,
            options:options2
            });
    };