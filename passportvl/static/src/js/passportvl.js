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
			OsmLayer.attributes={"type":"OsmLayer"};
			/*var rrLayer=new ol.layer.Tile({
				preload:1,
				source: new ol.source.TileImage({
					url:'/maps/rosreestr_cadastre/{z}/{x}/{y}',
					projection: 'EPSG:4326'
					})
				});*/
				
			
            var map = new ol.Map({
             			 			//controls:ol.control.defaults().extend([
									//			new ol.control.FullScreen()/*,
									//			new ol.control.OverviewMap({
									//				layers:[vectorTransLayer],
									//				label: 'Transformers'
									//				})*/
									//		]),
									controls:[new ol.control.FullScreen(), new ol.control.Zoom()],
									target: defMap.get()[0],  // The DOM element that will contains the map
                					renderer: 'canvas', // Force the renderer to be used
                					layers: [OsmLayer, vectorLineLayer, vectorPillarBaseLayer,vectorPillarLayer,vectorTransLayer,vectorSubLayer],
									interactions: ol.interaction.defaults({mouseWheelZoom:false})
            					});	
								
			var thisWidth,thisHeight;
			if (this.$el.parent().width()) thisWidth=this.$el.parent().width();
			if (this.$el.parent().height()) thisHeight=this.$el.parent().height();
			if (this.$el.width()) thisWidth=this.$el.width();
			if (this.$el.height()) thisHeight=this.$el.height();
			if ((!thisWidth)||(!thisHeight))
			{
				console.log("AltitudeChart no size");
				thisWidth=700;
				thisHeight=300;
			}
			else
			{
				if (this.options.altitude_chart=="true") thisHeight=thisHeight/2;
			}
			
			console.log(thisHeight);
				
			map.setSize([thisWidth,thisHeight]);
			
            
            this.map=map;
			
			if (this.options.altitude_chart=="true") this.render_altitude_chart(map,AplID);
            
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
        },
		
		render_altitude_chart: function(map,apl_id)
		{
			this.$el.find('#altitudeChart').remove();
			var thisWidth,thisHeight;
			if (this.$el.parent().width()) thisWidth=this.$el.parent().width();
			if (this.$el.parent().height()) thisHeight=this.$el.parent().height();
			if (this.$el.width()) thisWidth=this.$el.width();
			if (this.$el.height()) thisHeight=this.$el.height();
			if ((!thisWidth)||(!thisHeight))
			{
				console.log("AltitudeChart no size");
				thisWidth=700;
				thisHeight=300;
			}
			else thisHeight=thisHeight/2;
			var apl_name=this.field_manager.get_field_value("name");
			var divChart=$('<div id="altitudeChart"></div>');
			this.$el.append(divChart);
			
			if (map)
			{
				var vectorAltSource=new ol.source.Vector({projection: 'EPSG:4326'});
				var vectorAltLayer=new ol.layer.Vector({source: vectorAltSource});
				vectorAltLayer.attributes={"type":"altitude_layer"};
				map.addLayer(vectorAltLayer);
			}
			var ActPillar, ActPillarStroke;
			
			var altChart=new Highcharts.Chart(
			{
				credits:
				{
					enabled: false,
				},
				chart: 
				{
					width: thisWidth,
					height: thisHeight,
					renderTo: divChart.get(0),
					type: 'area', 
        			},
				tooltip: 
				{
					crosshairs: [true]
				},
        			title: 
				{
            				text: 'Высотная диаграмма линии:'+apl_name
        			},
        			legend: 
				{
            				enabled: true
        			},
					xAxis:
					{
						allowDecimals: false,
						min: 1,
						title:
						{
							text: 'Номер опоры'
						},
					},
					yAxis:
					{
						title:
						{
							text: 'Высота [м]'
						},
					},
				plotOptions: 
				{
				 	series:
				 	{
						fillOpacity: 0.3,
						pointStart: 0,
            					marker: 
						{
                					enabled: false,
                					symbol: 'circle',
                					radius: 2,
                					states: 
							{
                    						hover: 
								{
                        						enabled: true
                    						}
                					}
            					},
				 		events: 
				    	{
							show: function () 
							{
        							var chart = this.chart,
            							series = chart.series,
            							i = series.length,
            							otherSeries;

        							while (i--) 
								{
          								otherSeries = series[i];
          								if (otherSeries != this && otherSeries.visible) 
									{
            									otherSeries.hide();
          								}
        							}
      							},
							legendItemClick: function (event) 
							{
								if (this.visible) return false;
							},
				    	},
						point:
						{
							events:
							{
								mouseOut: function()
								{
									if (map)
									{
										if (ActPillar)
										{
											ActPillar.getStyle().getText().setStroke(ActPillarStroke);
											vectorAltSource.clear();
											ActPillar=null;
										}
									}
								},
								mouseOver: function()
								{
									if (map)
									{
										var Layers=map.getLayers().getArray();
										for (var i in Layers)
										{
											if (Layers[i].attributes['type']=="pillar")
											{
												var Features=Layers[i].getSource().getFeatures();
												for (var a in Features)
												{
													if ((Features[a].attributes['type']=="pillar") && (Features[a].attributes['id']==this.id))
													{
														ActPillar=Features[a].clone();
														ActPillarStroke=ActPillar.getStyle().getText().getStroke();
														ActPillar.getStyle().getText().setStroke(new ol.style.Stroke({color : 'red',width : 0.5}));
														vectorAltSource.addFeature(ActPillar);
														map.setView(new ol.View({
																	center: ActPillar.getGeometry().getCoordinates(),
																	zoom: 15
																	}));
													}
												}
											}
										}
									}
								},
							},
						},
					},
				}
			});
			var APLModel=new Model('uis.papl.apl');
            		APLModel.query(['tap_ids']).filter([['id','=',apl_id]]).all().then(function(APL)
            		{
				var tap_ids=APL[0].tap_ids;
				var TapModel=new Model('uis.papl.tap');
				TapModel.query(['id','name','is_main_line','pillar_ids']).filter([['id','in',tap_ids]]).all().then(function(taps)
                    		{
					for (var i in taps)
					{
						var TapID=taps[i].id;
						var TapName=taps[i].name;
						var TapIsMainLine=taps[i].is_main_line;
						var TapPillars=taps[i].pillar_ids;
						var PillarModel=new Model('uis.papl.pillar');
						(function(TapName,TapIsMainLine,TapPillars)
						{
							PillarModel.query(['id','num_by_vl','elevation']).order_by('num_by_vl').filter([['id','in',TapPillars]]).all().then(function(pillars)
                    					{
								var altSeries = [];
                        					for (var i in pillars)
                        					{
									altSeries.push({x: pillars[i].num_by_vl, y: pillars[i].elevation, id: pillars[i].id});
								}
								if (TapIsMainLine)
								{
									altChart.addSeries(
									{
										name : TapName,
    									data : altSeries,
										visible: true,
										colorIndex: 0,
									});
								}
								else
								{
									altChart.addSeries(
									{
										name : TapName,
    										data : altSeries,
										visible: false,
										colorIndex: 0,
									})
								}	
							});
						})(TapName,TapIsMainLine,TapPillars);
					}
				});	
			});
		},
    });
	
	weather_table=instance.web.form.AbstractField.extend(
	{
		Apl_ID: null,
		render_value: function()
		{
			try
			{
				if (typeof(this.get("value"))=="number") var Apl_ID=this.get("value");
				else Apl_ID=this.get("value")[0];
				if (this.Apl_ID==Apl_ID) return;
				this.Apl_ID=Apl_ID;
				this._super.apply(this, arguments);
				this.$el.find('#weather_div').remove();
				var WeatherDiv=$('<div id="weather_div" class="weather_table"></div>');
				this.$el.append(WeatherDiv);
				var WeatherTable=$('<table id="weather_id"><tr id="weather_title"><th></th></tr><tr id="weather_image"><td></td></tr><tr id="weather_description"><td></td></tr><tr id="weather_temp_day"><td>Температура днем [°C]</td></tr><tr id="weather_temp_night"><td>Температура ночью [°C]</td></tr><tr id="weather_wind_speed"><td>Скорость ветра [м/c]</td></tr></table>');
				var APLModel=new Model("uis.papl.apl");
				APLModel.query(['pillar_id','name']).filter([['id','=',Apl_ID]]).all().then(function(APL)
				{
					var PillarModel=new Model("uis.papl.pillar");
					WeatherDiv.append('<h3>Прогноз погоды на 7 дней в районе линии '+APL[0].name+'</h3>');
					WeatherDiv.append(WeatherTable);
					PillarModel.query(['longitude','latitude']).filter([['id','=',APL[0].pillar_id[0]]]).all().then(function(Pillar)
					{
						if (Pillar.length<1) return;
						$.ajax(
						{
							url : 'https://api.openweathermap.org/data/2.5/forecast/daily?lat='+Pillar[0].latitude+'&lon='+Pillar[0].longitude+'&units=metric&APPID=00e684844073fbbd8dabdef237e25ec6&lang=ru',
							method : 'GET',
							success : function (data) 
							{
								for (var i in data.list)
								{
									var dayDate=new Date(parseInt(data.list[i].dt)*1000);
									$('#weather_title').append('<th>'+dayDate.toISOString().split('T')[0]+'</th>');
									$('#weather_image').append('<td>'+data.list[i].weather[0].description+'</td>');
									$('#weather_description').append('<td><img src="https://openweathermap.org/img/w/'+data.list[i].weather[0].icon+'.png" /></td>');
									$('#weather_temp_day').append('<td>'+data.list[i].temp.day+'</td>');
									$('#weather_temp_night').append('<td>'+data.list[i].temp.night+'</td>');
									$('#weather_wind_speed').append('<td>'+data.list[i].speed+'</td>');
								}
							}
						});
					});
				});
			}
			catch (exception)
			{
				console.log(exception);	
			}
		},
	}); 
	
	var form_widget = require('web.form_widgets');
	
	form_widget.WidgetButton.include({
		on_click: function() 
		{
			if(this.node.attrs.id == "load_pillars")
			{
				$("#Load_Pillars_File").unbind( "change" );
				$("#Load_Pillars_File").change(function() 
				{
					var textFile=this.files[0];
					if (textFile.type == 'text/plain')
					{
						var reader = new FileReader();
						reader.onerror = function()
						{
							alert('Ошибка чтения файла!');
						};
						reader.onloadend = function(event)
						{
							var TJSON = event.target.result;
							var model = new instance.web.Model("uis.papl.apl");
							model.call("load_pillars",[TJSON]).then(function(result)
							{
								if (result==1) alert("Опоры успешно загружены"); 
								else alert("Ошибка загрузки опор"); 
							});
						};
						reader.readAsText(textFile);
					}
					else
					{
						alert('Выбран не текстовый файл');
					}
				});
				$("#Load_Pillars_File").click();
				return;
			}
			this._super();
		},
	});
    
    core.form_widget_registry.add('aplmap', aplmap);
	core.form_widget_registry.add('weather_table', weather_table);
});