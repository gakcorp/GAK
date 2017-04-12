odoo.define('apl_aerial_photo.form_widgets', function (require) 
{
	var core = require('web.core');
   	var FieldBinaryImage = require('web.form_widgets');
	var FieldBinaryImage=core.form_widget_registry.get('image');
	var Model=require('web.Model');
	var session = require('web.session');

	fotoramanew = FieldBinaryImage.extend(
	{
		start: function()
		{
			this._super.apply(this, arguments);
			this.$el.dblclick(function()
			{
				var editMode=false;
	
				$(document.body).append('<div id="cwrap" class="cwrap"></div>');
				$("#cwrap").append('<div id="map" class="div_map"></div>');
				var spinner=new Spinner().spin();
				$("#cwrap").append($(spinner.el));
				$("#cwrap").append('<div id="fotorama" class="fotorama cfotorama"  data-nav="thumbs" data-width="100%" data-height="100%">'+this.innerHTML+'</div>');
				$("#cwrap").append('<a id="close_button" href="#" class="close-thik"></a>');
				$("#cwrap").append('<div id="l_button" class="l_button">\<<div id="l_panel" class="l_panel"></div></div>');
				$("#l_panel").append('<div id="l_controle_block" class="l_controle_block"></div>');
				if (editMode)
				{
					$("#l_controle_block").append('<img id="l_rectangle_icon" class="l_rectangle_icon" src="/apl_aerial_photo/static/src/icon/rectangle.png">');
					$("#l_controle_block").append('<img id="l_delete_icon" class="l_text_icon" src="/apl_aerial_photo/static/src/icon/delete.png">');
				}
				$("#l_controle_block").append('<img id="l_zoom_icon" class="l_text_icon" src="/apl_aerial_photo/static/src/icon/zoom.png">');
				if (editMode) $("#l_controle_block").append('<img id="l_save_icon" class="l_text_icon" src="/apl_aerial_photo/static/src/icon/save.png">');

				$('#close_button').click(function()
				{
					$("#cwrap").remove();
				});


				var fotorama=$('#fotorama').fotorama().data('fotorama');
				var masURL=this.innerHTML.split('&');
				var IdExpr=/.*id=(\d+)/gi;
				var ModelExpr=/.*model=(.+)/gi;
				var FieldExpr=/.*field=(.+)/gi;
				var ID,ModelName,FieldName;
				var fabricCanvas;
				var map;
				var l_mouseleave=true;
				var photoClicked=false;
				var pillarVisMap=new Map();
				var transformerVisMap=new Map();

				var pillar_table=$('<table class="l_table"><caption>Pillars</caption><thead><tr><th>ID</th><th>Name</th></tr></thead></table>')
				var pillar_tbody=$('<tbody></tbody>');
				var trans_table=$('<table class="l_table"><caption>Transformers</caption><thead><tr><th>ID</th><th>Name</th></tr></thead></table>')
				var trans_tbody=$('<tbody></tbody>');
				pillar_table.append(pillar_tbody);
				trans_table.append(trans_tbody);
				$("#l_controle_block").append(pillar_table);
				$("#l_controle_block").append(trans_table);

				$("#l_rectangle_icon").click(function()
				{
					if (!fabricCanvas) return;
					var rect = new fabric.Rect({
									left: 100,
									top: 100,
									width: 50,
									height: 50,
									fill: 'rgba(0,0,0,0)',
									stroke: 'red',
    									strokeWidth: 1
								});
					rect.lockRotation=true;
					fabricCanvas.add(rect);
					fabricCanvas.setActiveObject(rect);

				});

				$("#l_delete_icon").click(function()
				{
					if (!fabricCanvas) return;
					var actObject=fabricCanvas.getActiveObject();
					if (actObject) 
					{
						var visID=actObject.visid;
						var visType=actObject.vistype;
						deselectVisObject(visType,visID);
						if (visType=="pillar") 
						{
							pillarVisMap.delete(Number(visID));
							pillar_tbody.find($("tr td:contains('"+visID+"')")).parent().attr("select","false");
						}
						if (visType=="transformer") 
						{
							transformerVisMap.delete(Number(visID));
							trans_tbody.find($("tr td:contains('"+visID+"')")).parent().attr("select","false");
						}
						fabricCanvas.remove(fabricCanvas.getActiveObject());
					}	
				});

				$("#l_zoom_icon").click(function()
				{
					if ($(".zoomContainer")[0])
					{
						$(".zoomContainer").remove();
						fabricCanvas.wrapperEl.parentNode.style.visibility = 'visible';
					}
					else
					{	
						///spinner=new Spinner().spin();
						//$("#cwrap").append($(spinner.el));
						var mainPhoto=fotorama.activeFrame.$stageFrame.children("img")[0];
						$(mainPhoto).attr("data-zoom-image",mainPhoto.src.replace(/image_\d+/, "image"));
						fabricCanvas.wrapperEl.parentNode.style.visibility = 'hidden';
						$(mainPhoto).elevateZoom({zoomType: "lens"});
						//dobavit uborku spinnera

					}
				});

				$("#l_save_icon").click(function()
				{
					var spinner=new Spinner().spin();
					$("#cwrap").append($(spinner.el));
					var Vis_Object=new Model('uis.ap.vis_object');
					var objCount=0;
					var callCount=0;
					var PillarIDs=[];
					var TransformerIDs=[];
					fabricCanvas.forEachObject(function(obj)
					{
						if (obj.type=="group")
						{
							var objType=obj.vistype;
							var objID=obj.visid;
							var rect=obj.item(0);
							var RJSON='{"groupleft":'+obj.left+',"grouptop":'+obj.top+',"rectleft":'+rect.getLeft()+',"recttop":'+rect.getTop()+',"rectheight":'+rect.getHeight()+',"rectwidth":'+rect.getWidth()+
										',"canvaswidth":'+fabricCanvas.getWidth()+',"canvasheight":'+fabricCanvas.getHeight()+'}';
							if (objType=="pillar") 
							{
								objType='uis.papl.pillar';
								PillarIDs.push(objID);
							}
							if (objType=="transformer") 
							{
								objType='uis.papl.transformer';
								TransformerIDs.push(objID);
							}
							objCount++;
							Vis_Object.call('create_update_vis_object',[ID,obj.item(1).text,objID,objType,RJSON]).then(function (result) 
							{
								callCount++;
								if (callCount>=objCount)
								{
									Vis_Object.call('delete_objects',[ID,'uis.papl.pillar',PillarIDs]).then(function(result){});
									Vis_Object.call('delete_objects',[ID,'uis.papl.transformer',TransformerIDs]).then(function(result){})
									spinner.stop();
								}
							});	
						}
					});
					if ((PillarIDs.length==0)&&(TransformerIDs.length==0))
					{
						Vis_Object.call('delete_objects',[ID,'uis.papl.pillar',PillarIDs]).then(function(result){});
						Vis_Object.call('delete_objects',[ID,'uis.papl.transformer',TransformerIDs]).then(function(result){});
						spinner.stop();
					}
				});

				pillar_tbody.on("mouseover","tr",function()
				{
					if ($(this).attr("select")!="true") selectVisObject("pillar",$(this).children()[0].innerText);
				});
				

				pillar_tbody.on("mouseleave","tr",function()
				{
					if ($(this).attr("select")!="true") deselectVisObject("pillar",$(this).children()[0].innerText);
				});

				trans_tbody.on("mouseover","tr",function()
				{
					if ($(this).attr("select")!="true") selectVisObject("transformer",$(this).children()[0].innerText);
				});

				trans_tbody.on("mouseleave","tr",function()
				{
					if ($(this).attr("select")!="true") deselectVisObject("transformer",$(this).children()[0].innerText);
				});


				pillar_tbody.on("click","tr",function()
				{
					if ($(this).attr("select")!="true") 
					{
						var visID=$(this).children()[0].innerText;
						var visText=$(this).children()[1].innerText;
						var actObject=fabricCanvas.getActiveObject();
						if (actObject)
						{
							if (actObject.get("type")=="rect")
							{
								var pillarVis=pillarVisMap.get(Number(visID));
								if (pillarVis)
								{
									alert("Object already exist");
									return;
								}
								else
								{
									var text = new fabric.Text(visText, { left: actObject.get("left"), top: actObject.get("top"), fontSize: 12});
									text.lockRotation=true;
									fabricCanvas.add(text);
									var group = new fabric.Group([actObject.clone(),text.clone()]);
									group.lockRotation=true;
									text.remove();
									actObject.remove();
									group.visid=visID;
									group.vistype="pillar";
									group.opacity=1;
									fabricCanvas.add(group);
									fabricCanvas.setActiveObject(group);
									pillarVisMap.set(Number(visID),group);
								}
							}
						}
						$(this).attr("select",true);
						selectVisObject("pillar",$(this).children()[0].innerText);
					}
					else
					{
						$(this).attr("select",false);
						deselectVisObject("pillar",$(this).children()[0].innerText);
					}
				});

				trans_tbody.on("click","tr",function()
				{
					if ($(this).attr("select")!="true") 
					{
						var visID=$(this).children()[0].innerText;
						var visText=$(this).children()[1].innerText;
						var actObject=fabricCanvas.getActiveObject();
						if (actObject)
						{
							if (actObject.get("type")=="rect")
							{
								var transformerVis=transformerVisMap.get(Number(visID));
								if (transformerVis)
								{
									alert("Object already exist");
									return;
								}
								else
								{
									var text = new fabric.Text(visText, { left: actObject.get("left"), top: actObject.get("top"), fontSize: 12});
									text.lockRotation=true;
									fabricCanvas.add(text);
									var group = new fabric.Group([actObject.clone(),text.clone()]);
									group.lockRotation=true;
									text.remove();
									actObject.remove();
									group.visid=visID;
									group.vistype="transformer";
									group.opacity=1;
									fabricCanvas.add(group);
									fabricCanvas.setActiveObject(group);
									transformerVisMap.set(Number(visID),group);
								}
							}
						}
						$(this).attr("select",true);
						selectVisObject("transformer",$(this).children()[0].innerText);
					}
					else
					{
						$(this).attr("select",false);
						deselectVisObject("transformer",$(this).children()[0].innerText);
					}
				});

				for (var i=0;i<masURL.length;i++)
				{
					var mas=IdExpr.exec(masURL[i]);
					if (mas)
					{
						if (mas.length>1) ID=mas[1];
					}
					mas=ModelExpr.exec(masURL[i]);
					if (mas)
					{
						if (mas.length>1) ModelName=mas[1];
					}
					mas=FieldExpr.exec(masURL[i]);
					if (mas)
					{
						if (mas.length>1) FieldName=mas[1];
					}
				}

				$('.fotorama').on('fotorama:load', function (e, fotorama, extra) {
					$("#div"+ID).remove();
					if (fabricCanvas) fabricCanvas.clear();
					getVisObjects();
				});

				$('#l_button').mouseover(function()
				{
					if (l_mouseleave)
					{
						$('#l_panel').css('left',0);
						$('#l_button').css('left',$('#l_panel').css('width'));
					}
				});

				$('#l_panel').mouseleave(function()
				{
					if (l_mouseleave)
					{
						$('#l_panel').css('left',-1*$('#l_panel').width());
						$('#l_button').css('left',0);
					}	
				});

				$('#l_panel').dblclick(function()
				{
					if (l_mouseleave)
					{
						l_mouseleave=false;
					}
					else
					{
						l_mouseleave=true;
						$('#l_panel').css('left',-1*$('#l_panel').width("img"));
						$('#l_button').css('left',0);
					}
				});

				function ChangeImage()
				{
					var url = session.url('/web/image', {model: ModelName,
                                        					id: ID,
                                        					field: FieldName,
										unique: ID
										});
					fotorama.load([{img: url}]);
				}

				function getVisObjects()
				{
					var mainPhoto=fotorama.activeFrame.$stageFrame.children("img")[0];
					if (mainPhoto)
					{
						var canvasDiv=$('<div id="div'+ID+'"></div>');
						canvasDiv.css({position:'fixed',width:mainPhoto.width,height:mainPhoto.height,top:mainPhoto.offsetTop,left:mainPhoto.offsetLeft});
						var mainCanvas=$('<canvas id="canvas'+ID+'"></canvas)');
						$("#cwrap").append(canvasDiv);
					        canvasDiv.append(mainCanvas);
						fabricCanvas = new fabric.Canvas('canvas'+ID);
						fabricCanvas.setHeight(mainPhoto.height);
						fabricCanvas.setWidth(mainPhoto.width);
						fabricCanvas.on('object:selected',function()
						{
							selectFromPhoto(fabricCanvas.getActiveObject());
						});

						var PhotoModel=new Model(ModelName);
						PhotoModel.query(['longitude','latitude','rotation','view_distance','focal_angles','next_photo_ids','pillar_ids','near_pillar_ids','transformer_ids','near_transformer_ids']).filter([['id','=',ID]]).limit(1).all().then(function(photos)
						{
							var latitude=photos[0]['latitude'];
							var longitude=photos[0]['longitude'];
							var rotation=photos[0]['rotation'];
							var viewDistance=photos[0]['view_distance'];
							var focalAngle=photos[0]['focal_angles'];

							var next_photo_ids=photos[0]['next_photo_ids'];

							var pillar_ids=photos[0]['pillar_ids'];
							var near_pillar_ids=photos[0]['near_pillar_ids'];

							var near_transformer_ids=photos[0]['near_transformer_ids'];
				
							var mainStroke=new ol.style.Stroke({color : 'red',width : 1});
							var mainFill=new ol.style.Fill({color: 'transparent'});
							var mainStyle=new ol.style.Style({stroke: mainStroke, fill: mainFill});
							var mainPoint=new ol.style.Circle({radius: 7,stroke: mainStroke});
							var mainStyle=new ol.style.Style({image: mainPoint,stroke: mainStroke,fill: mainFill});
						

							var point = new ol.geom.Point(ol.proj.transform([longitude,latitude], 'EPSG:4326', 'EPSG:3857'));
							var pointFeature = new ol.Feature(point);
							pointFeature.setStyle(mainStyle);

							var vectorSource = new ol.source.Vector({projection: 'EPSG:4326',features: [pointFeature]});
							var vectorLayer = new ol.layer.Vector({source: vectorSource});
							if (!map)
							{
								var OsmLayer=new ol.layer.Tile({source: new ol.source.OSM()});
								OsmLayer.setVisible(true);
								map = new ol.Map({
               			 						target: 'map',  // The DOM element that will contains the map
                								renderer: 'canvas', // Force the renderer to be used
                								layers: [				
											/*OsmLayer,*/
											vectorLayer],
										view: new ol.View({
                    								center: ol.proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857'),
                    								zoom: 17
                								}),
            									});
								map.on("click", function(e) 
								{
									map.forEachFeatureAtPixel(e.pixel, function (feature, layer) 
									{
										mapClickFunction(feature,layer);
   							 		})
								});
							}
							else
							{
								map.addLayer(vectorLayer);
								map.setView(new ol.View({
                    								center: ol.proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857'),
                    								zoom: 17
                								}));
							}
							var PhotoPolygon=getPhotoPolygon(point,viewDistance,focalAngle,rotation);
							var PolygonFeature = new ol.Feature(PhotoPolygon);
							PolygonFeature.setStyle(mainStyle);
							vectorSource.addFeature(PolygonFeature);

							var NextPhotoModel=new Model(ModelName);
							NextPhotoModel.query(['id','name','longitude','latitude','rotation','view_distance','focal_angles']).filter([['id','in',next_photo_ids]]).limit(100).all().then(function(nextphotos)
							{
								
								for (var i=0;i<nextphotos.length;i++)
								{
									var PhotoID=nextphotos[i]['id'];
									var name=nextphotos[i]['name'];
									var nextid=nextphotos[i]['id'];
									var nextlongitude=nextphotos[i]['longitude'];
									var nextlatitude=nextphotos[i]['latitude'];
									var rotation=nextphotos[i]['rotation'];
									var viewDistance=nextphotos[i]['view_distance'];
									var focalAngle=nextphotos[i]['focal_angles'];
									var nextFill=new ol.style.Fill({color: 'transparent'});
									var nextStroke=new ol.style.Stroke({color : 'orange',width : 0.3});
									var nextPoint=new ol.style.Circle({radius: 5,stroke: nextStroke});
									var nextStyle=new ol.style.Style({fill: nextFill,stroke: nextStroke, image: nextPoint});
									var point = new ol.geom.Point(ol.proj.transform([nextlongitude,nextlatitude], 'EPSG:4326', 'EPSG:3857'));
									var pointFeature = new ol.Feature(point);
									pointFeature.setStyle(nextStyle);
									pointFeature.attributes = {"vistype":"photo","visid":PhotoID};
									vectorSource.addFeature(pointFeature);
									var PhotoPolygon=getPhotoPolygon(point,viewDistance,focalAngle,rotation);
									var PolygonFeature = new ol.Feature(PhotoPolygon);
									PolygonFeature.setStyle(nextStyle);
									vectorSource.addFeature(PolygonFeature);
								}
							});

							var PillarModel=new Model('uis.papl.pillar');
							PillarModel.query(['id','num_by_vl','longitude','latitude','prev_longitude','prev_latitude']).filter([['id','in',near_pillar_ids]]).limit(100).all().then(function(pillars)
							{
								for (var i in pillars)
								{
									var pillarID=pillars[i]['id'];
									var pillarNum=pillars[i]['num_by_vl'];
									var longitude=pillars[i]['longitude'];
									var latitude=pillars[i]['latitude'];
									var prev_longitude=pillars[i]['prev_longitude'];
									var prev_latitude=pillars[i]['prev_latitude'];
									var pillarFill=new ol.style.Fill({color: 'transparent'});
									var pillarStroke=new ol.style.Stroke({color : 'green',width : 0.5});
									var pillarPoint=new ol.style.Circle({radius: 7});
									var pillarText=new ol.style.Text({text: pillarNum.toString(), fill:pillarFill, stroke:pillarStroke,scale:1.4});
									var pillarStyle=new ol.style.Style({fill: pillarFill,stroke: pillarStroke, image: pillarPoint, text: pillarText});
									var point = new ol.geom.Point(ol.proj.transform([longitude,latitude], 'EPSG:4326', 'EPSG:3857'));
									var pointFeature = new ol.Feature(point);
									pointFeature.attributes = {"vistype":"pillar","visid":pillarID};
									pointFeature.setStyle(pillarStyle);
									vectorSource.addFeature(pointFeature);
									if ((prev_longitude!=0)&&(prev_latitude!=0))
									{
										var pillarLineStyle=new ol.style.Style({fill: pillarFill,stroke: pillarStroke, image: pillarPoint});
										var line = new ol.geom.LineString([ol.proj.transform([longitude,latitude], 'EPSG:4326', 'EPSG:3857'),ol.proj.transform([prev_longitude,prev_latitude], 'EPSG:4326', 'EPSG:3857')]);
										var lineFeature= new ol.Feature(line);
										lineFeature.setStyle(pillarLineStyle);
										vectorSource.addFeature(lineFeature);
									}
								}
							});

							PillarModel.query(['id','name']).filter([['id','in',pillar_ids]]).limit(100).all().then(function(pillars)
							{
								for (var i in pillars)
								{
									pillar_tbody.append('<tr><td>'+pillars[i].id+'</td><td>'+pillars[i].name+'</td></tr>');
								}
								spinner.stop();
							});
							
							var TransformerModel=new Model('uis.papl.transformer');
							TransformerModel.query(['id','longitude','latitude','name','pillar_id','pillar2_id']).filter([['id','in',near_transformer_ids]]).limit(100).all().then(function(transformers)
							{
								for (var i in transformers)
								{
									var transformerID=transformers[i]['id'];
									var longitude=transformers[i]['longitude'];
									var latitude=transformers[i]['latitude'];
									var name=transformers[i]['name'];
									var pillar_id=transformers[i]['pillar_id'];
									var pillar2_id=transformers[i]['pillar2_id'];
									var point = new ol.geom.Point(ol.proj.transform([longitude,latitude], 'EPSG:4326', 'EPSG:3857'));
									var transformerFill=new ol.style.Fill({color: 'transparent'});
									var transformerStroke=new ol.style.Stroke({color : 'green',width : 0.5});
									var transformerPoint=new ol.style.Circle({radius: 7});
									var transformerText=new ol.style.Text({text: name, fill:transformerFill, stroke:transformerStroke,scale:1.4});
									var transformerStyle=new ol.style.Style({fill: transformerFill,stroke: transformerStroke, image: transformerPoint, text: transformerText});
									var pointFeature= new ol.Feature(point);
									pointFeature.setStyle(transformerStyle);
									pointFeature.attributes = {"vistype":"transformer","visid":transformerID};
									vectorSource.addFeature(pointFeature);

								}
							});

							TransformerModel.query(['name']).filter([['id','in',near_transformer_ids]]).limit(100).all().then(function(transformers)
							{
								for (var i in transformers)
								{
									trans_tbody.append('<tr><td>'+transformers[i].id+'</td><td>'+transformers[i].name+'</td></tr>');
								}
							});

							var VisObjectModel=new Model('uis.ap.vis_object');
							VisObjectModel.query(['name','rect_coordinate_json','pillar_id','transformer_id']).filter([['photo_id.id','=',ID]]).all().then(function(visObjects)
							{
								for (var i=0;i<visObjects.length;i++)
								{
									try
									{
										var pillar_id=visObjects[i]['pillar_id'];
										var transformer_id=visObjects[i]['transformer_id'];
										var RJSON=JSON.parse(visObjects[i]['rect_coordinate_json']);
										var kW=fabricCanvas.getWidth()/RJSON.canvaswidth;
										var kH=fabricCanvas.getHeight()/RJSON.canvasheight;
										var name=visObjects[i]['name'];
										var rect = new fabric.Rect({left: RJSON.rectleft,
														top: RJSON.recttop,
														width: RJSON.rectwidth*kW,
														height: RJSON.rectheight*kH,
														fill: 'rgba(0,0,0,0)',
														stroke: 'red',
    														strokeWidth: 1
													});
										rect.lockRotation=true;
										var text = new fabric.Text(name, { left: RJSON.rectleft, top: RJSON.recttop, fontSize: 12});
										text.lockRotation=true;
										var group = new fabric.Group([rect,text],{left: RJSON.groupleft*kW,
															top: RJSON.grouptop*kH
														});
										group.lockRotation=true;
										if (!editMode)
										{
											group.lockMovementX=true;
											group.lockMovementY=true;
											group.lockScalingX=true;
											group.lockScalingY=true;
											group.lockUniScaling=true;
										}
										group.opacity=0;
										if (pillar_id) 
										{
											pillarVisMap.set(pillar_id[0],group);
											group.visid=pillar_id[0];
											group.vistype="pillar";
										}
										if (transformer_id) 
										{
											transformerVisMap.set(transformer_id[0],group);
											group.visid=transformer_id[0];
											group.vistype="transformer";
										}
										fabricCanvas.add(group);
									}
									catch(e)
									{
										console.log(e);
									}
								}
							});
						});
						photoClicked=false;
					}
				}

				function getPhotoPolygon(point,viewDistance,focalAngle,rotation)
				{
					focalAngle=focalAngle*Math.PI/180;
					var xDiv=viewDistance*Math.tan(focalAngle/2);
					var x=point.getCoordinates()[0];
					var y=point.getCoordinates()[1];
					var polygon=new ol.geom.Polygon([[[x,y],[x-xDiv,y+viewDistance],[x,y+1.2*viewDistance],[x+xDiv,y+viewDistance],[x,y]]]);
					polygon.rotate((360-rotation)*Math.PI/180,[x,y]);
					return polygon;
				}

				function mapClickFunction(feature,layer)
				{
					if (!feature.attributes) return;
					if (feature.attributes["vistype"]=="photo")
					{
						if (!photoClicked) photoClicked=true;
						else return;
						pillarVisMap=new Map();
						transformerVisMap=new Map();
						$('#div'+ID).remove();
						trans_tbody.find('tr').remove();
						pillar_tbody.find('tr').remove();
						var layerArray=map.getLayers().getArray();
						for (var i in layerArray) 
						{
							if (layerArray[i] instanceof ol.layer.Vector) map.removeLayer(layerArray[i]);
						}
						ID=feature.attributes["visid"];
						var url = session.url('/web/image', {model: ModelName,
                                        					id: ID,
                                        					field: FieldName,
										unique: ID
										});
						fotorama.load([{img: url}]);
						return;
					}
					if (feature.attributes["vistype"]=="pillar")
					{
						var visID=feature.attributes["visid"];
						pillar_tbody.find($("tr td:contains('"+visID+"')")).parent().click();
					}
					if (feature.attributes["vistype"]=="transformer")
					{
						var visID=feature.attributes["visid"];
						trans_tbody.find($("tr td:contains('"+visID+"')")).parent().click();
					}
				}
				
				function selectVisObject(type,visID)
				{
					if (type=="pillar")
					{
						var pillarVis=pillarVisMap.get(Number(visID));
						if (pillarVis) pillarVis.opacity=1;
						if (!editMode) fabricCanvas.deactivateAll();
						fabricCanvas.renderAll();
						var visFeature=getFeatureByID(type,visID);
						if (visFeature)
						{
							var featureStyle=visFeature.getStyle();
							var featureTextStyle=featureStyle.getText();
							featureTextStyle.setStroke(new ol.style.Stroke({color : 'red',width : 0.5}));
							featureStyle.setText(featureTextStyle);
							visFeature.setStyle(featureStyle);
							map.setView(new ol.View({
                    								center: visFeature.getGeometry().getCoordinates(),
                    								zoom: map.getView().getZoom()
                								}));
							pillar_tbody.find($("tr td:contains('"+visID+"')")).parent().css("color","orange");
						}
					}
					if (type=="transformer")
					{
						var transformerVis=transformerVisMap.get(Number(visID));
						if (transformerVis) transformerVis.opacity=1;
						if (!editMode) fabricCanvas.deactivateAll();
						fabricCanvas.renderAll();
						var visFeature=getFeatureByID(type,visID);
						if (visFeature)
						{
							var featureStyle=visFeature.getStyle();
							var featureTextStyle=featureStyle.getText();
							featureTextStyle.setStroke(new ol.style.Stroke({color : 'red',width : 0.5}));
							featureStyle.setText(featureTextStyle);
							visFeature.setStyle(featureStyle);
							map.setView(new ol.View({
                    								center: visFeature.getGeometry().getCoordinates(),
                    								zoom: map.getView().getZoom()
                								}));
							trans_tbody.find($("tr td:contains('"+visID+"')")).parent().css("color","orange");
						}
					}
				}

				function deselectVisObject(type,visID)
				{
					if (type=="pillar")
					{
						var pillarVis=pillarVisMap.get(Number(visID));
						if (pillarVis) pillarVis.opacity=0;
						if (!editMode) fabricCanvas.deactivateAll();
						fabricCanvas.renderAll();
						var visFeature=getFeatureByID(type,visID);
						if (visFeature)
						{
							var featureStyle=visFeature.getStyle();
							var featureTextStyle=featureStyle.getText();
							featureTextStyle.setStroke(new ol.style.Stroke({color : 'green',width : 0.5}));
							featureStyle.setText(featureTextStyle);
							visFeature.setStyle(featureStyle);
							pillar_tbody.find($("tr td:contains('"+visID+"')")).parent().css("color","");
						}
					}
					if (type=="transformer")
					{
						var transformerVis=transformerVisMap.get(Number(visID));
						if (transformerVis) transformerVis.opacity=0;
						if (!editMode) fabricCanvas.deactivateAll();
						fabricCanvas.renderAll();
						var visFeature=getFeatureByID(type,visID);
						if (visFeature)
						{
							var featureStyle=visFeature.getStyle();
							var featureTextStyle=featureStyle.getText();
							featureTextStyle.setStroke(new ol.style.Stroke({color : 'green',width : 0.5}));
							featureStyle.setText(featureTextStyle);
							visFeature.setStyle(featureStyle);
							trans_tbody.find($("tr td:contains('"+visID+"')")).parent().css("color","");
						}
					}
				}
				
				function getFeatureByID(type,visID)
				{
					var layerArray=map.getLayers().getArray();
					for (var i in layerArray) 
					{
						if (layerArray[i] instanceof ol.layer.Vector)
						{
							var layerSource=layerArray[i].getSource();
							var featureArray=layerSource.getFeatures();
							for (var a in featureArray)
							{
								var visFeature=featureArray[a];
								if (visFeature.attributes)
								{
									if ((visFeature.attributes.vistype==type)&&(visFeature.attributes.visid==visID))
									{
										return visFeature;
									}
								}
							}
						}
					}
				}

				function selectFromPhoto(visObject)
				{
					if (visObject.vistype=="pillar")
					{
						var visID=visObject.visid;
						pillar_tbody.find($("tr td:contains('"+visID+"')")).parent().click();
					}
					if (visObject.vistype=="transformer")
					{
						var visID=visObject.visid;
						trans_tbody.find($("tr td:contains('"+visID+"')")).parent().click();
					}				
				}

			});
		}
	});

	core.form_widget_registry.add('fotoramanew', fotoramanew);
});