odoo.define('passportvl.form_widgets', function (require)
{
    var core = require('web.core');
	var Model=require('web.Model');
	var instance = openerp;
    
    aplmap=instance.web.form.AbstractField.extend(
    {
        GetAplID: function()
        {
            return this.field_manager.get_field_value("id");
        },
        
        LoadAllObjects: function()
        {
            return;
        },
        
        map: null,
        
        render_value: function()
		{
            var spClass=this;
            this._super.apply(this, arguments);
            var AplID=this.GetAplID();
            this.$el.find('#defmap').remove();
            var defMap=$('<div id="defmap" class="apl_map"></div>');
            defMap.css('width','900px');
			defMap.css('height','300px');
			this.$el.append(defMap);
            var vectorLineSource=new ol.source.Vector({projection: 'EPSG:4326'});
            var vectorLineLayer=new ol.layer.Vector({source: vectorLineSource});
            vectorLineLayer.attributes={"type":"line"};
            var vectorPillarBaseSource=new ol.source.Vector({projection: 'EPSG:4326'});
            var vectorPillarBaseLayer=new ol.layer.Vector({source: vectorPillarBaseSource});
            vectorPillarBaseLayer.attributes={"type":"pillar"};
            var vectorPillarSource=new ol.source.Vector({projection: 'EPSG:4326'});
            var vectorPillarLayer=new ol.layer.Vector({source: vectorPillarSource});
            vectorPillarLayer.attributes={"type":"pillar"};
            var vectorTransSource=new ol.source.Vector({projection: 'EPSG:4326'});
            var vectorTransLayer=new ol.layer.Vector({source: vectorTransSource});
            vectorTransLayer.attributes={"type":"trans"};
            var vectorSubSource=new ol.source.Vector({projection: 'EPSG:4326'});
            var vectorSubLayer=new ol.layer.Vector({source: vectorSubSource});
            vectorSubLayer.attributes={"type":"substation"};
            vectorPillarLayer.setVisible(false);
            vectorPillarBaseLayer.setVisible(false);
            
			var OsmLayer=new ol.layer.Tile({source: new ol.source.OSM()});
			/*var rrLayer=new ol.layer.Tile({
				preload:1,
				source: new ol.source.TileImage({
					url:'/maps/rosreestr_cadastre/{z}/{x}/{y}',
					projection: 'EPSG:4326'
					})
				});*/
            var map = new ol.Map({
             			 			controls:ol.control.defaults().extend([
												new ol.control.FullScreen()/*,
												new ol.control.OverviewMap({
													layers:[vectorTransLayer],
													label: 'Transformers'
													})*/
											]),
									target: defMap.get()[0],  // The DOM element that will contains the map
                					renderer: 'canvas', // Force the renderer to be used
                					layers: [OsmLayer, vectorLineLayer, vectorPillarBaseLayer,vectorPillarLayer,vectorTransLayer,vectorSubLayer],
            					});
			map.setSize([defMap.width(),defMap.height()]);
            
            this.map=map;
            
            var PillarTypeModel=new Model('uis.papl.pillar.type');
            
            var APLModel=new Model('uis.papl.apl');
            APLModel.query(['pillar_id','transformer_ids',"sup_substation_id","crossing_ids"]).filter([['id','=',AplID]]).all().then(function(APL)
            {
                var Pillar_IDs=APL[0].pillar_id;
                var Trans_IDs=APL[0].transformer_ids;
                var SubstationID=APL[0].sup_substation_id[0];
                var Crossing_IDs=APL[0].crossing_ids;
                
                PillarTypeModel.query(['name','base']).all().then(function(types)
                {
                    var PillarTypeBaseMap=new Map();
                    var PillarMap=new Map();
                    for (var i in types)
                    {
                        PillarTypeBaseMap.set(types[i].id,types[i].base);
                    }
                    
                    var PillarModel=new Model('uis.papl.pillar');
                    PillarModel.query(['id','num_by_vl','longitude','latitude','prev_longitude','prev_latitude','pillar_type_id']).filter([['id','in',Pillar_IDs]]).all().then(function(pillars)
                    {
                        for (var i in pillars)
                        {
                            var pillarID=pillars[i].id;
                            var pillarNum=pillars[i].num_by_vl;
                            var pillarLongitude=pillars[i].longitude;
                            var pillarLatitude=pillars[i].latitude;
                            var pillarPrevLongitude=pillars[i].prev_longitude;
                            var pillarPrevLatitude=pillars[i].prev_latitude;
                            var pillarTypeID=pillars[i].pillar_type_id[0];
                            
                            PillarMap.set(pillars[i].id,i);
                            
                            var pillarFill=new ol.style.Fill({color: 'transparent'});
                            var pillarStroke=new ol.style.Stroke({color : 'black',width : 0.5});
                            var pillarPoint=new ol.style.Circle({radius: 17});
                            var pillarText=new ol.style.Text({text: pillarNum.toString(), fill:pillarFill, stroke:pillarStroke,scale:1.2});
                            var pillarStyle=new ol.style.Style({fill: pillarFill,stroke: pillarStroke, image: pillarPoint, text: pillarText});
                            var point = new ol.geom.Point(ol.proj.transform([pillarLongitude,pillarLatitude], 'EPSG:4326', 'EPSG:3857'));
                            var pointFeature = new ol.Feature(point);
                            pointFeature.setStyle(pillarStyle);
                            pointFeature.attributes={"type":"pillar","id":pillarID};
                            if (PillarTypeBaseMap.get(pillarTypeID)) vectorPillarBaseSource.addFeature(pointFeature);
                            else vectorPillarSource.addFeature(pointFeature);
                            
                            if (i==Math.ceil(pillars.length/2))
                            {
                                map.setView(new ol.View({
                                                    center: ol.proj.transform([pillarLongitude, pillarLatitude], 'EPSG:4326', 'EPSG:3857'),
                                                    zoom: 14
                                                    }));
                            }
                            
                            if ((pillarPrevLongitude!=0)&&(pillarPrevLatitude!=0))
                            {
                                var pillarLineStyle=new ol.style.Style({fill: pillarFill,stroke: pillarStroke, image: pillarPoint});
                                var line = new ol.geom.LineString([ol.proj.transform([pillarLongitude,pillarLatitude], 'EPSG:4326', 'EPSG:3857'),ol.proj.transform([pillarPrevLongitude,pillarPrevLatitude], 'EPSG:4326', 'EPSG:3857')]);
                                var lineFeature= new ol.Feature(line);
                                lineFeature.setStyle(pillarLineStyle);
                                vectorLineSource.addFeature(lineFeature);
                            }
                        }
                        
                        var TransformerModel=new Model('uis.papl.transformer');
                        TransformerModel.query(['id','longitude','latitude','name','pillar_id','pillar2_id','trans_stay_rotation']).filter([['id','in',Trans_IDs]]).all().then(function(transformers)
                        {
                            for (var i in transformers)
                            {
                                var transID=transformers[i].id;
                                var transName=transformers[i].name;
                                var transLongitude=transformers[i].longitude;
                                var transLatitude=transformers[i].latitude;
                                var transRotation=transformers[i].trans_stay_rotation;
                                var transPillar=transformers[i].pillar_id[0];
                                var transPillar2=transformers[i].pillar2_id[0];
                        
                                var transFill=new ol.style.Fill({color: 'transparent'});
                                var transStroke=new ol.style.Stroke({color : 'black',width : 0.5});
                                var transText=new ol.style.Text({text: transName, fill:transFill, stroke:transStroke, scale:1.2});
                                
                                var transFill=new ol.style.Fill({color: 'transparent'});
                                var transStroke=new ol.style.Stroke({color : 'black',width : 0.5});
                                var transText=new ol.style.Text({text: transName, fill:transFill, stroke:transStroke, scale:1.2});
                        
                                var iconStyle = new ol.style.Style({
                                                            image: new ol.style.Icon
                                                            ({
                                                                src: '/passportvl/static/src/img/trans_icon/1_trans_exploitation_30.png',
                                                                scale: 0.75,
                                                                rotation: (180+transRotation)*Math.PI/180
                                                            }),
                                                            text: transText
                                                        });
                        
                                var iconFeature = new ol.Feature({
                                                            geometry: new ol.geom.Point(ol.proj.transform([transLongitude,transLatitude], 'EPSG:4326', 'EPSG:3857'))
                                                        });
                        
                                iconFeature.setStyle(iconStyle);
                                iconFeature.attributes={"type":"trans","id":transID};
                        
                                vectorTransSource.addFeature(iconFeature);
                                
                                var i=PillarMap.get(transPillar);
                                if (i)
                                {
                                    var pillarLongitude=pillars[i].longitude;
                                    var pillarLatitude=pillars[i].latitude;
                                    
                                    var transLineStyle=new ol.style.Style({fill: transFill,stroke: transStroke});
                                    var line = new ol.geom.LineString([ol.proj.transform([pillarLongitude,pillarLatitude], 'EPSG:4326', 'EPSG:3857'),ol.proj.transform([transLongitude,transLatitude], 'EPSG:4326', 'EPSG:3857')]);
                                    var lineFeature= new ol.Feature(line);
                                    lineFeature.setStyle(transLineStyle);
                                    vectorLineSource.addFeature(lineFeature);
                                }
                                
                                i=PillarMap.get(transPillar2);
                                if (i)
                                {
                                    var pillarLongitude=pillars[i].longitude;
                                    var pillarLatitude=pillars[i].latitude;
                                    
                                    var transLineStyle=new ol.style.Style({fill: transFill,stroke: transStroke});
                                    var line = new ol.geom.LineString([ol.proj.transform([pillarLongitude,pillarLatitude], 'EPSG:4326', 'EPSG:3857'),ol.proj.transform([transLongitude,transLatitude], 'EPSG:4326', 'EPSG:3857')]);
                                    var lineFeature= new ol.Feature(line);
                                    lineFeature.setStyle(transLineStyle);
                                    vectorLineSource.addFeature(lineFeature);
                                }
                            }
                            spClass.LoadAllObjects();
                        });
                        
                        var SubstationModel=new Model('uis.papl.substation');
                        SubstationModel.query(['id','longitude','latitude','name','conn_pillar_ids']).filter([['id','=',SubstationID]]).all().then(function(substations)
                        {
                            var subName=substations[0].name;
                            var subLongitude=substations[0].longitude;
                            var subLatitude=substations[0].latitude;
                            var ConPillar_IDs=substations[0].conn_pillar_ids;
                            
                            var subFill=new ol.style.Fill({color: 'transparent'});
                            var subStroke=new ol.style.Stroke({color : 'black',width : 0.5});
                            var subText=new ol.style.Text({text: subName, fill:subFill, stroke:subStroke, scale:1.2, offsetY: 25});
                            var iconStyle = new ol.style.Style({
                                                            image: new ol.style.Icon
                                                            ({
                                                                src: '/passportvl/static/src/img/substation/substation.png',
                                                                scale: 0.75,
                                                            }),
                                                            text:subText
                                                        });
                            
                            var point = new ol.geom.Point(ol.proj.transform([subLongitude,subLatitude], 'EPSG:4326', 'EPSG:3857'));
                            var pointFeature = new ol.Feature(point);
                            pointFeature.setStyle(iconStyle);
                            vectorSubSource.addFeature(pointFeature);
                            
                            for (var i in ConPillar_IDs)
                            {
                                if (PillarMap.get(ConPillar_IDs[i]))
                                {
                                    var pillarLongitude=pillars[PillarMap.get(ConPillar_IDs[i])].longitude;
                                    var pillarLatitude=pillars[PillarMap.get(ConPillar_IDs[i])].latitude;
                                    
                                    var subLineStyle=new ol.style.Style({fill: subFill,stroke: subStroke});
                                    var line = new ol.geom.LineString([ol.proj.transform([pillarLongitude,pillarLatitude], 'EPSG:4326', 'EPSG:3857'),ol.proj.transform([subLongitude,subLatitude], 'EPSG:4326', 'EPSG:3857')]);
                                    var lineFeature= new ol.Feature(line);
                                    lineFeature.setStyle(subLineStyle);
                                    vectorLineSource.addFeature(lineFeature);
                                }
                            }
                        });
                        
                        var CrossingModel=new Model('uis.papl.apl.crossing');
                        CrossingModel.query(['from_pillar_id','to_pillar_id']).filter([['id','in',Crossing_IDs]]).all().then(function(crossings)
                        {
                           for (var i in crossings)
                           {
                                var FromPillar=PillarMap.get(crossings[i].from_pillar_id[0]);
                                var ToPillar=PillarMap.get(crossings[i].to_pillar_id[0]);
                                
                                if ((!FromPillar)||(!ToPillar)) continue;
                                
                                var FromPillarLongitude=pillars[FromPillar].longitude;
                                var FromPillarLatitude=pillars[FromPillar].latitude;
                                var ToPillarLongitude=pillars[ToPillar].longitude;
                                var ToPillarLatitude=pillars[ToPillar].latitude;
                                
                                var crossFill=new ol.style.Fill({color: 'transparent'});
                                var crossStroke=new ol.style.Stroke({color : 'red',width : 3});
                                var crossLineStyle=new ol.style.Style({fill: crossFill,stroke: crossStroke});
                                var line = new ol.geom.LineString([ol.proj.transform([FromPillarLongitude,FromPillarLatitude], 'EPSG:4326', 'EPSG:3857'),ol.proj.transform([ToPillarLongitude,ToPillarLatitude], 'EPSG:4326', 'EPSG:3857')]);
                                var lineFeature= new ol.Feature(line);
                                lineFeature.setStyle(crossLineStyle);
                                vectorLineSource.addFeature(lineFeature);
                           }
                        });
                    });
                });
                
            });
            
            map.on("moveend",function moveEnd()
            {
                if (map.getView().getZoom()>15) vectorPillarLayer.setVisible(true);
                else vectorPillarLayer.setVisible(false);
                if (map.getView().getZoom()>14) vectorPillarBaseLayer.setVisible(true);
                else vectorPillarBaseLayer.setVisible(false);
            });
        }
    });
    
    core.form_widget_registry.add('aplmap', aplmap);
});