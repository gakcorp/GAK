odoo.define('apl_mro.form_widgets', function (require)
{
	var core = require('web.core');
	var Model=require('web.Model');
	var session = require('web.session');
	var instance = openerp;
	var FieldBinaryImage=core.form_widget_registry.get('image');
	var AplMAP=core.form_widget_registry.get('aplmap');
	
	var kanban_widgets = require('web_kanban.widgets');
	var Kanban_AbstractField = kanban_widgets.AbstractField;

	defectmap=AplMAP.extend(
	{
			GetAplID: function()
			{
				return this.field_manager.get_field_value("apl_id");
			},
			
			LoadAllObjects: function()
			{
				this._super.apply(this, arguments);
				var map=this.map;
				
				var defectID=this.field_manager.get_field_value("id");
				var DefectModel=new Model("uis.papl.mro.defect");
				var vectorDefectSource=new ol.source.Vector({projection: 'EPSG:4326'});
				var vectorDefectLayer=new ol.layer.Vector({source: vectorDefectSource});
				vectorDefectLayer.attributes={"type":"defect"};
				map.addLayer(vectorDefectLayer);
				
				DefectModel.query(['pillar_ids','transformer_ids']).filter([['id','=',defectID]]).all().then(function(defects)
				{
					var Pillar_IDs=defects[0].pillar_ids;
					var Trans_IDs=defects[0].transformer_ids;
					var Layers=map.getLayers().getArray();
					if (Pillar_IDs)
					{
						var chView=false;
						for (var i in Layers)
						{
							if (Layers[i].attributes['type']=="pillar")
							{
								var Features=Layers[i].getSource().getFeatures();
								for (var a in Features)
								{
									if ((Features[a].attributes['type']=="pillar") && (Pillar_IDs.indexOf(Features[a].attributes['id'])!=-1))
									{
										var oFeature=Features[a];
										oFeature.getStyle().getText().setStroke(new ol.style.Stroke({color : 'red',width : 0.5}));
										Layers[i].getSource().removeFeature(oFeature);
										vectorDefectSource.addFeature(oFeature);
										if (!chView)
										{
											chView=true;
											map.setView(new ol.View({
																	center: oFeature.getGeometry().getCoordinates(),
																	zoom: 17
																	}));
										}
									}
								}
							}
						}
					}
					
					if (Trans_IDs)
					{
						var chView=false;
						for (var i in Layers)
						{
							if (Layers[i].attributes['type']=="trans")
							{
								var Features=Layers[i].getSource().getFeatures();
								for (var a in Features)
								{
									if ((Features[a].attributes['type']=="trans") && (Trans_IDs.indexOf(Features[a].attributes['id'])!=-1))
									{
										var oFeature=Features[a];
										oFeature.getStyle().getText().setStroke(new ol.style.Stroke({color : 'red',width : 0.5}));
										Layers[i].getSource().removeFeature(oFeature);
										vectorDefectSource.addFeature(oFeature);
										if (!chView)
										{
											chView=true;
											map.setView(new ol.View({
																	center: oFeature.getGeometry().getCoordinates(),
																	zoom: 17
																	}));
										}
									}
								}
							}
						}
					}
				});
			},
			
			render_value: function()
			{
				this._super.apply(this, arguments);
			},
	});
	
	defectphoto=FieldBinaryImage.extend(
	{
		render_value: function()
		{
			this._super.apply(this, arguments);
			try
			{
				this.$el.find('#defCanvas').remove();
				var ImgWidth=this.options.size[0];
				var ImgHeight=this.options.size[1];
				var DJSON=JSON.parse(this.field_manager.get_field_value("defect_photo_area"));
				var canvas=$('<canvas id="defCanvas"></canvas>');
				canvas.css({position:'absolute',width:ImgWidth,height:ImgHeight,top:0,left:0,'z-index':'1500'});
				this.$el.append(canvas);
				var fabricCanvas = new fabric.Canvas(canvas.get()[0]);
				$(fabricCanvas.wrapperEl).css({position:'absolute',width:ImgWidth,height:ImgHeight,top:0,left:0});
				fabricCanvas.setWidth(ImgWidth);
				fabricCanvas.setHeight(ImgHeight);
				var kW=ImgWidth/DJSON.canvaswidth;
				var kH=ImgHeight/DJSON.canvasheight;
				var Coordinates=DJSON.coordinates;
				var DefCircles=DJSON.defcircles;
				for (var i in Coordinates)
				{
					var MasCoord=Coordinates[i];
					var FirstPoint;
					var LastPoint;
					for (var a in MasCoord)
					{
						if (a==0) FirstPoint=MasCoord[a];
						else
						{
							var Line=new fabric.Line([LastPoint[0]*kW,LastPoint[1]*kH,MasCoord[a][0]*kW,MasCoord[a][1]*kH],{stroke:'red'});
							Line.selectable=false;
							fabricCanvas.add(Line);
						}
						LastPoint=MasCoord[a];
					}
					var Line=new fabric.Line([LastPoint[0]*kW,LastPoint[1]*kH,FirstPoint[0]*kW,FirstPoint[1]*kH],{stroke:'red'});
					Line.selectable=false;
					fabricCanvas.add(Line);
				}
				for (var i in DefCircles)
				{
					var circle=new fabric.Circle({left:DefCircles[i][0]*kW,top:DefCircles[i][1]*kH,radius:DefCircles[i][2]*((kW+kH)/2),fill: 'rgba(0,0,0,0)',stroke:'red'});
					circle.selectable=false;
					fabricCanvas.add(circle);
				}
				
			}
			catch (exception)
			{
				console.log(exception)
			}
		},
	});

	order_timeline=instance.web.form.AbstractField.extend(
	{
		render_value: function()
		{
			this._super.apply(this, arguments);
			this.$el.find('#timeline_div').remove();
			var order_id=this.field_manager.get_field_value("id")
			var OrderModel=new Model('uis.papl.mro.order');
			var TimeLineDiv=$('<div id="timeline_div"></div>');
			this.$el.append(TimeLineDiv);
			var stateName={
				1: "Отменен",
				2: "Проект",
				3: "Подтвержден",
				4: "Назначен",
				5: "Принят в работу",
				6: "В работе",
				7: "Завершен",
				8: "Выполнен"
			};
			var stateColor={
				1: "#C5C0D1",
				2: "#A6CF41",
				3: "#1E9E1E",
				4: "#E3E534",
				5: "#FFA500",
				6: "#EB6444",
				7: "#00AEEF",
				8: "#00AEEF"
			};
			OrderModel.query(['create_date','start_planned_date','end_planned_date','order_steps_json']).filter([['id','=',order_id]]).all().then(function(Order)
            		{
				try
				{
					var create_date=Date.parse(Order[0].create_date.replace(' ','T')+'Z');
					var start_planned_date=Date.parse(Order[0].start_planned_date.replace(' ','T')+'Z');
					var end_planned_date=Date.parse(Order[0].end_planned_date.replace(' ','T')+'Z');
                                	var order_steps_json=Order[0].order_steps_json;
					var currentTime = new Date().getTime();

					var groups = new vis.DataSet([
						{
            						id: 'gr3', 
            						content:'Ответственные',       					
						},
        					{
            						id: 'gr1', 
            						content:'Работа'
        					},
						{
            						id: 'gr2', 
            						content:'Планируемое время',
        					},
    					]);

					var items = new vis.DataSet([
    						{id: 1, content: 'Подготовка', start: create_date, end: start_planned_date, group: 'gr2'},
						{id: 2, content: 'Проведение работ', start: start_planned_date+1, end: end_planned_date, group: 'gr2'},
  					]);
					
					try
					{
						var SJSON=JSON.parse(order_steps_json);
						var ids=3;
						for (var i=0; i<SJSON.steps.length; i++)
						{
							if (i==SJSON.steps.length-1)
							{
								if ((SJSON.steps[i].state!=1) && (SJSON.steps[i].state!=8))
								{
									var startDate=Date.parse(SJSON.steps[i].date.replace(' ','T')+'Z');
									var item={id: ids, content: stateName[SJSON.steps[i].state], start: startDate, end: currentTime, group: 'gr1', style: 'background-color:'+stateColor[SJSON.steps[i].state]};
									ids++;
									var eitem={id: ids, content: SJSON.steps[i].author, start: startDate, type: 'box', group: 'gr3', className: 'timeline_employee'};
									ids++;
									items.add(item);
									items.add(eitem);
								}
								else
								{
									var tContent=SJSON.steps[i].author;
									if (SJSON.steps[i].state==1) tContent=tContent+"<br>Отменен</br>";
									if (SJSON.steps[i].state==8) tContent=tContent+"<br>Выполнен</br>";
									var endDate=Date.parse(SJSON.steps[i].date.replace(' ','T')+'Z');
									var eitem={id: ids, content: tContent, start: endDate, type: 'box', group: 'gr3', className: 'timeline_employee'};
									ids++;
									items.add(eitem);
								}
							}
							else
							{
								var tContent=SJSON.steps[i].author;
								if (i==0) tContent=tContent+"<br>Создан</br>";
								var startDate=Date.parse(SJSON.steps[i].date.replace(' ','T')+'Z');
								var endDate=Date.parse(SJSON.steps[i+1].date.replace(' ','T')+'Z');
								var item={id: ids, content: stateName[SJSON.steps[i].state], start: startDate, end: endDate, group: 'gr1', type: 'range', style: 'background-color:'+stateColor[SJSON.steps[i].state]};
								ids++;
								var eitem={id: ids, content: tContent, start: startDate, type: 'box', group: 'gr3', className: 'timeline_employee'};
								ids++;
								items.add(item);
								items.add(eitem);
							}
						}
					}
					catch (exception)
					{
						console.log(exception)
					}
					var options = {stack: false, align: 'left'};
					var timeline = new vis.Timeline(TimeLineDiv.get(0), items,groups, options);
				}
				catch (exception)
				{
					console.log(exception)
				}
			});

		},
	});

	defectphoto_kanban=Kanban_AbstractField.extend(
	{
		start: function()
		{
			this._super.apply(this, arguments);
			try
			{;
				if (!this.field.raw_value) return;
				var DJSON=JSON.parse(this.field.raw_value);
				var fabricCanvas = new fabric.Canvas();
				fabricCanvas.setWidth(DJSON.canvaswidth);
				fabricCanvas.setHeight(DJSON.canvasheight);
				var Coordinates=DJSON.coordinates;
				var DefCircles=DJSON.defcircles;
				for (var i in Coordinates)
				{
					var MasCoord=Coordinates[i];
					var FirstPoint;
					var LastPoint;
					for (var a in MasCoord)
					{
						if (a==0) FirstPoint=MasCoord[a];
						else
						{
							var Line=new fabric.Line([LastPoint[0],LastPoint[1],MasCoord[a][0],MasCoord[a][1]],{stroke:'red'});
							Line.selectable=false;
							fabricCanvas.add(Line);
						}
						LastPoint=MasCoord[a];
					}
					var Line=new fabric.Line([LastPoint[0],LastPoint[1],FirstPoint[0],FirstPoint[1]],{stroke:'red'});
					Line.selectable=false;
					fabricCanvas.add(Line);
				}
				for (var i in DefCircles)
				{
					var circle=new fabric.Circle({left:DefCircles[i][0],top:DefCircles[i][1],radius:DefCircles[i][2],fill: 'rgba(0,0,0,0)',stroke:'red'});
					circle.selectable=false;
					fabricCanvas.add(circle);
				}
				var canvasImg=$('<img style="max-width:100%;" src="'+fabricCanvas.toDataURL('png')+'"></canvas>');
				this.$el.append(canvasImg);
			}
			catch (exception)
			{
				console.log(exception);
			}
		},
	});

	
	core.form_widget_registry.add('defectmap', defectmap);
	core.form_widget_registry.add('defectphoto', defectphoto);
	core.form_widget_registry.add('order_timeline', order_timeline);
	kanban_widgets.registry.add('defectphoto_kanban',defectphoto_kanban);
});