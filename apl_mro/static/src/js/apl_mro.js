odoo.define('apl_mro.form_widgets', function (require)
{
	var core = require('web.core');
	var Model=require('web.Model');
	var session = require('web.session');
	var instance = openerp;
	var FieldBinaryImage=core.form_widget_registry.get('image');
	var AplMAP=core.form_widget_registry.get('aplmap');

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
				DefectModel.query(['pillar_id','transformer_id']).filter([['id','=',defectID]]).all().then(function(defects)
				{
					var Pillar_IDs=defects[0].pillar_id;
					var Trans_IDs=defects[0].transformer_id;
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
	
	core.form_widget_registry.add('defectmap', defectmap);
	core.form_widget_registry.add('defectphoto', defectphoto);
});