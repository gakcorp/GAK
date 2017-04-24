odoo.define('apl_mro.form_widgets', function (require)
{
	var core = require('web.core');
	var Model=require('web.Model');
	var session = require('web.session');
	var instance = openerp;
	var FieldBinaryImage=core.form_widget_registry.get('image');

	defectmap=instance.web.form.AbstractField.extend(
	{
			start: function()
			{
				var longitude=this.field_manager.get_field_value("longitude");
				var latitude=this.field_manager.get_field_value("latitude");
				var defMap=$('<div id="defmap"></div>');
				defMap.css('width','800px');
				defMap.css('height','600px');
				this.$el.append(defMap);
				var OsmLayer=new ol.layer.Tile({source: new ol.source.OSM()});
				OsmLayer.setVisible(true);
				var point = new ol.geom.Point(ol.proj.transform([longitude,latitude], 'EPSG:4326', 'EPSG:3857'));
				var pointFeature = new ol.Feature(point);
				var vectorSource = new ol.source.Vector({projection: 'EPSG:4326',features: [pointFeature]});
				var vectorLayer = new ol.layer.Vector({source: vectorSource});
				var map = new ol.Map({
               			 				target: defMap.get()[0],  // The DOM element that will contains the map
                						renderer: 'canvas', // Force the renderer to be used
                						layers: [				
												OsmLayer,
												vectorLayer],
										view: new ol.View({
														center: ol.proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857'),
														zoom: 10
														}),
            						});
				map.setSize([defMap.width(),defMap.height()]);
			},
	});
	
	defectphoto=FieldBinaryImage.extend(
	{
		start: function()
		{
			this._super.apply(this, arguments);
			try
			{
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
		}
	});
	
	core.form_widget_registry.add('defectmap', defectmap);
	core.form_widget_registry.add('defectphoto', defectphoto);
});