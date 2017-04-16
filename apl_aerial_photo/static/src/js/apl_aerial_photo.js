odoo.define('apl_aerial_photo.form_widgets', function (require) 
{
	var core = require('web.core');
   	var FieldBinaryImage = require('web.form_widgets');
	var FieldBinaryImage=core.form_widget_registry.get('image');
	var Model=require('web.Model');
	var session = require('web.session');

	fotorama = FieldBinaryImage.extend(
	{
		start: function()
		{
			this._super.apply(this, arguments);
			this.$el.dblclick(function()
			{
				var editMode=true;
	
				$(document.body).append('<div id="cwrap" class="cwrap"></div>');
				$("#cwrap").append('<div id="map" class="div_map"></div>');
				var spinner;
				$("#cwrap").append('<div id="fotorama" class="fotorama cfotorama"  data-nav="thumbs" data-width="100%" data-height="100%" data-arrows="false" data-click="false" data-swipe="false"></div>');
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


				//var fotorama=$('#fotorama').fotorama().data('fotorama');
				var fotorama;
				var masURL=this.innerHTML.split('&');
				var IdExpr=/.*id=(\d+)/;
				var ModelExpr=/.*model=(.+)/;
				var FieldExpr=/.*field=(.+)/;
				var ID,ModelName,FieldName;
				var fabricCanvas;
				var map;
				var l_mouseleave=true;
				var photoClicked=false;
				var fotoramaWasLoad=false;
				var pillarVisMap=new Map();
				var transformerVisMap=new Map();

				var pillar_table=$('<table class="l_table"><caption>Опоры</caption><thead><tr><th style="display:none;">ID</th><th>Имя</th><th>Дистанция</th></tr></thead></table>')
				var pillar_tbody=$('<tbody></tbody>');
				var trans_table=$('<table class="l_table"><caption>Трансформаторы</caption><thead><tr><th style="display:none;">ID</th><th>Имя</th><th>Дистанция</th></tr></thead></table>')
				var trans_tbody=$('<tbody></tbody>');
				pillar_table.append(pillar_tbody);
				trans_table.append(trans_tbody);
				$("#l_controle_block").append(pillar_table);
				$("#l_controle_block").append(trans_table);

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
				InitPhotoModel();


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

				$(".zoomContainer").on('load',function()
				{
					console.log("!!!!!!!");
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
						spinner=new Spinner().spin();
						$("#cwrap").append($(spinner.el));
						var mainPhoto=fotorama.activeFrame.$stageFrame.children("img")[0];
						$(mainPhoto).attr("data-zoom-image",mainPhoto.src.replace(/image_\d+/, "image"));
						fabricCanvas.wrapperEl.parentNode.style.visibility = 'hidden';
						$(mainPhoto).elevateZoom({zoomType: "lens"});
						//dobavit uborku spinnera

					}
				});

				$("#l_save_icon").click(function()
				{
					spinner=new Spinner().spin();
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

				$('#map').on("mouseover",function()
				{
					frontMap();
				});
				$('#map').on("mouseleave",function()
				{
					frontFotorama();
				});

				pillar_tbody.on("mouseover","tr",function()
				{
					frontMap();
					if ($(this).attr("select")!="true") selectVisObject("pillar",$(this).children()[0].innerText);
				});

				pillar_tbody.on("mouseleave","tr",function()
				{
					frontFotorama();
					if ($(this).attr("select")!="true") deselectVisObject("pillar",$(this).children()[0].innerText);
				});

				trans_tbody.on("mouseover","tr",function()
				{
					frontMap();
					if ($(this).attr("select")!="true") selectVisObject("transformer",$(this).children()[0].innerText);
				});

				trans_tbody.on("mouseleave","tr",function()
				{
					frontFotorama();
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

				$('.fotorama').on('fotorama:load', function (e, fotorama, extra) 
				{
					var mainPhoto=fotorama.activeFrame.$stageFrame.children("img")[0];
					if ((mainPhoto)&&(!fotoramaWasLoad))
					{
						$(".fotorama__nav__shaft").css({"pointer-events":"auto"});
						fotoramaWasLoad=true;
						var canvasDiv=$('<div id="div'+ID+'"></div>');
						canvasDiv.css({position:'fixed',width:mainPhoto.width,height:mainPhoto.height,top:mainPhoto.offsetTop,left:mainPhoto.offsetLeft,'z-index':'1500'});
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
							spinner.stop();
						});
					}
				});

				$('.fotorama').on('fotorama:show', function (e, fotorama, extra) {
					if (fotoramaWasLoad) 
					{	
						var masExpr=IdExpr.exec(fotorama.activeFrame.img);
						if (masExpr.length>1)
						{
							$('#div'+ID).remove();
							ID=masExpr[1];
							InitPhotoModel();
						}
					}
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

				function InitPhotoModel()
				{
					spinner=new Spinner().spin();
					$("#cwrap").append($(spinner.el));
					fotoramaWasLoad=false;
					pillarVisMap=new Map();
					transformerVisMap=new Map();
					trans_tbody.find('tr').remove();
					pillar_tbody.find('tr').remove();
					if (map)
					{
						var layerArray=map.getLayers().getArray();
						for (var i in layerArray) 
						{
							if (layerArray[i] instanceof ol.layer.Vector) map.removeLayer(layerArray[i]);
						}
					}
					if (fotorama)
					{
						fotorama.splice(0,100);
						$('#fotorama').empty();
					}
					$(".zoomContainer").remove();
					var PhotoModel=new Model(ModelName);
					PhotoModel.query(['longitude','latitude','rotation','view_distance','focal_angles','next_photo_ids','pillar_ids','near_pillar_ids','transformer_ids','near_transformer_ids']).filter([['id','=',ID]]).all().then(function(photos)
					{
						var mainPhotoPoint;
						var next_photo_ids=photos[0]['next_photo_ids'];
						var url = session.url('/web/image', {model: ModelName,
                                        					id: ID,
                                        					field: FieldName,
										unique: ID
										});
						$('#fotorama').append('<img src="'+url+'">');
						for (var nextid in next_photo_ids)
						{
								var nexturl = session.url('/web/image', {model: ModelName,
                                        							id: next_photo_ids[nextid],
                                        							field: 'image_400',
												unique: next_photo_ids[nextid]
										});
								$('#fotorama').append('<img src="'+nexturl+'">');
						}
						fotorama=$('#fotorama').fotorama().data('fotorama');
						var latitude=photos[0]['latitude'];
						var longitude=photos[0]['longitude'];
						var rotation=photos[0]['rotation'];
						var viewDistance=photos[0]['view_distance'];
						var focalAngle=photos[0]['focal_angles'];

						var pillar_ids=photos[0]['pillar_ids'];
						var near_pillar_ids=photos[0]['near_pillar_ids'];

						var near_transformer_ids=photos[0]['near_transformer_ids'];
						var transformer_ids=photos[0]['transformer_ids'];
				
						var mainStroke=new ol.style.Stroke({color : 'red',width : 1});
						var mainFill=new ol.style.Fill({color: 'transparent'});
						var mainStyle=new ol.style.Style({stroke: mainStroke, fill: mainFill});
						var mainPoint=new ol.style.Circle({radius: 7,stroke: mainStroke});
						var mainStyle=new ol.style.Style({image: mainPoint,stroke: mainStroke,fill: mainFill});
						

						var point = new ol.geom.Point(ol.proj.transform([longitude,latitude], 'EPSG:4326', 'EPSG:3857'));
						mainPhotoPoint=point;
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
										OsmLayer,
										vectorLayer],
									view: new ol.View({
                    							center: ol.proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857'),
                    							zoom: 18
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
                    							zoom: 18
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

						
						PillarModel.query(['id','name','longitude','latitude']).filter([['id','in',pillar_ids]]).limit(100).all().then(function(pillars)
						{
							var tempMap=new Map();
							for (var i in pillars)
							{
								var longitude=pillars[i]['longitude'];
								var latitude=pillars[i]['latitude'];
								var line = new ol.geom.LineString([ol.proj.transform([longitude,latitude], 'EPSG:4326', 'EPSG:3857'),mainPhotoPoint.getCoordinates()]);
								tempMap.set(i,line.getLength())							
							}
							var sortMas=sortMapByDistance(tempMap);
							for (var i in sortMas)
							{
								pillar_tbody.append('<tr><td style="display:none;">'+pillars[sortMas[i]].id+'</td><td>'+pillars[sortMas[i]].name+'</td><td>'+Math.floor(tempMap.get(sortMas[i]))+'</td></tr>');
							}
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

						TransformerModel.query(['id','name','longitude','latitude']).filter([['id','in',transformer_ids]]).limit(100).all().then(function(transformers)
						{
							var tempMap=new Map();
							for (var i in transformers)
							{
								var longitude=transformers[i]['longitude'];
								var latitude=transformers[i]['latitude'];
								var line = new ol.geom.LineString([ol.proj.transform([longitude,latitude], 'EPSG:4326', 'EPSG:3857'),mainPhotoPoint.getCoordinates()]);
								tempMap.set(i,line.getLength())	
							}
							var sortMas=sortMapByDistance(tempMap);
							for (var i in sortMas)
							{
								trans_tbody.append('<tr><td style="display:none;">'+transformers[sortMas[i]].id+'</td><td>'+transformers[sortMas[i]].name+'</td><td>'+Math.floor(tempMap.get(sortMas[i]))+'</td></tr>');
							}
						});
						photoClicked=false;
					});
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

				function sortMapByDistance(exSortMap)
				{
					var sortMap=new Map(exSortMap);
					var sortMas=[];
					var ch=sortMap.size
					for(;;)
					{
						if (sortMap.size<=0) break;
						var keys=Array.from(sortMap.keys());
						var ind=keys[0];
						var minValue=sortMap.get(ind);
						for (var i in keys)
						{
							if (sortMap.get(keys[i])<minValue)
							{
								minValue=sortMap.get(keys[i]);
								ind=keys[i];
							} 
						}
						sortMas.push(ind);
						sortMap.delete(ind);
					}
					return sortMas;
				}

				function mapClickFunction(feature,layer)
				{
					if (!feature.attributes) return;
					if (feature.attributes["vistype"]=="photo")
					{
						if (!photoClicked) photoClicked=true;
						else return;
						$('#div'+ID).remove();
						ID=feature.attributes["visid"];
						InitPhotoModel();
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
				
				function frontMap()
				{
					$("#map").css({"z-index":"1600"});
				}

				function frontFotorama()
				{
					$("#map").css({"z-index":"1100"});
				}

			});
		}
	});

	core.form_widget_registry.add('fotorama', fotorama);
});