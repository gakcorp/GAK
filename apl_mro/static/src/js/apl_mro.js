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
			
			render_value: function()
			{
				this._super.apply(this, arguments);
				var map=this.map;
				
				var defectID=this.field_manager.get_field_value("id");
				var DefectModel=new Model("uis.papl.mro.defect");
				
				DefectModel.query(['pillar_id','transformer_id']).filter([['id','=',defectID]]).all().then(function(defects)
				{
					var Pillar_IDs=defects[0].pillar_id;
					var Layers=map.getLayers().getArray();
					for (var i in Layers)
					{
						if (Layers[i].attributes['type']=="pillar")
						{
							console.log(Layers[i].getSource());
						}
					}
				});
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