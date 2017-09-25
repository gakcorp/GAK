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
			var WContext=this.view.dataset.get_context();
			if (this.options.editmode=="true") var editMode=true;
			else var editMode=false;
			this.$el.dblclick(function()
			{
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
				if (!editMode) $("#l_controle_block").append('<img id="l_polyline_icon" class="l_text_icon" src="/apl_aerial_photo/static/src/icon/polyline.png">');
				if (!editMode) $("#l_controle_block").append('<img id="l_circle_icon" class="l_text_icon" src="/apl_aerial_photo/static/src/icon/circle.png">');
				if (!editMode) $("#l_controle_block").append('<img id="l_defect_icon" class="l_text_icon" src="/apl_aerial_photo/static/src/icon/defect.png">');


				$('#close_button').click(function()
				{
					$("#cwrap").remove();
				});

				var near_apl_ids;

				var fotorama;
				var masURL=this.innerHTML.split('&');
				var IdExpr=/.*id=(\d+)/;
				var ModelExpr=/.*model=(.+)/;
				var FieldExpr=/.*field=(.+)/;
				var ID,ModelName,FieldName;
				var mainPhotoLatitude, mainPhotoLongitude;
				var fabricCanvas;
				var map;
				var l_mouseleave=true;
				var photoClicked=false;
				var fotoramaWasLoad=false;
				var pillarVisMap=new Map();
				var transformerVisMap=new Map();
				var polylineMode=false;
				var defAPLMap=[];
				var defPillarMap=[];
				var defTransMap=[];
				var defCircleMap={};

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
					//console.log(mainPhoto);
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
							dscr=$(".fotorama__caption");
							console.log(dscr);
							$('#div'+ID).append(dscr);
							console.log(ID);
						});

						var APLModel=new Model('uis.papl.apl');
						APLModel.query(['name']).filter([['id','=',near_apl_ids]]).all().then(function(APLs)
						{
							for (var i=0;i<APLs.length;i++)
							{
								defAPLMap.push({id: Number(APLs[i].id),name: APLs[i].name});
							}
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
				$('.fotorama').on('fotorama:showend', function(e,fotorama,extra){
					
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

					defAPLMap=[];
					defPillarMap=[];
					defTransMap=[];

					defCircleMap={};

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
					PhotoModel.query(['len_start_apl','longitude','latitude','rotation','view_distance','focal_angles','next_photo_ids','pillar_ids','near_pillar_ids','transformer_ids','near_transformer_ids','visable_view_json','near_apl_ids']).filter([['id','=',ID]]).all().then(function(photos)
					{
						var next_photo_ids=photos[0]['next_photo_ids'];
						var len_start_apl=photos[0]['len_start_apl'];
						var d_caption="";
						/*var url = session.url('/web/image', {model: ModelName,
                                        					id: ID,
                                        					field: FieldName,
										unique: ID
										});
						$('#fotorama').append('<img src="'+url+'">');*/
						
						var pos_fotorama=0;
						for (var nextid in next_photo_ids)
						{
								var p_field='image_400';
								var tS=64;
								
								if (next_photo_ids[nextid]==ID){
									//console.log (nextid);
									p_field=FieldName;
									pos_fotorama=nextid;
									d_caption=len_start_apl;
								}
								var nexturl = session.url('/web/image', {model: ModelName,
                                        							id: next_photo_ids[nextid],
                                        							field: p_field,
																	unique: next_photo_ids[nextid]
										});
								$('#fotorama').append('<img src="'+nexturl+'" data-caption="'+d_caption+'">');
						}
						
						
						fotorama=$('#fotorama').fotorama().data('fotorama');
						//console.log(pos_fotorama);
						fotorama.show(pos_fotorama);
						var latitude=photos[0]['latitude'];
						mainPhotoLatitude=latitude;
						var longitude=photos[0]['longitude'];
						mainPhotoLongitude=longitude;
						var rotation=photos[0]['rotation'];
						var viewDistance=2*photos[0]['view_distance'];
						var focalAngle=photos[0]['focal_angles'];
						var VisibilityViewJSON=photos[0]['visable_view_json'];
						var pillar_ids=photos[0]['pillar_ids'];
						var near_pillar_ids=photos[0]['near_pillar_ids'];

						var near_transformer_ids=photos[0]['near_transformer_ids'];
						var transformer_ids=photos[0]['transformer_ids'];

						near_apl_ids=photos[0]['near_apl_ids'];
				
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
											controls:ol.control.defaults().extend([
												new ol.control.FullScreen()
											]),
               			 					target: 'map',  // The DOM element that will contains the map
                							renderer: 'canvas', // Force the renderer to be used
                							layers: [				
										OsmLayer,
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
						//var PhotoPolygon=getPhotoPolygon(point,viewDistance,focalAngle,rotation);
						var PhotoPolygon=getPhotoPolygonByJSON(point,VisibilityViewJSON);
						var PolygonFeature = new ol.Feature(PhotoPolygon);
						PolygonFeature.setStyle(mainStyle);
						vectorSource.addFeature(PolygonFeature);
						var NextPhotoModel=new Model(ModelName);
						NextPhotoModel.query(['id','name','longitude','latitude','rotation','view_distance','focal_angles','visable_view_json']).filter([['id','in',next_photo_ids]]).limit(100).all().then(function(nextphotos)
						//NextPhotoModel.query(['id','name','longitude','latitude','rotation','view_distance','focal_angles','visable_view_json']).filter([]).all().then(function(nextphotos)																																																					
						{
								
							for (var i=0;i<nextphotos.length;i++)
							{
								var PhotoID=nextphotos[i]['id'];
								var name=nextphotos[i]['name'];
								var nextid=nextphotos[i]['id'];
								var nextlongitude=nextphotos[i]['longitude'];
								var nextlatitude=nextphotos[i]['latitude'];
								var rotation=nextphotos[i]['rotation'];
								var viewDistance=2*nextphotos[i]['view_distance'];
								var focalAngle=nextphotos[i]['focal_angles'];
								var VisibilityViewJSON=nextphotos[i]['visable_view_json'];
								var nextFill=new ol.style.Fill({color: 'transparent'});
								var nextStroke=new ol.style.Stroke({color : 'orange',width : 0.3});
								var nextPoint=new ol.style.Circle({radius: 5,stroke: nextStroke});
								var nextStyle=new ol.style.Style({fill: nextFill,stroke: nextStroke, image: nextPoint});
								var point = new ol.geom.Point(ol.proj.transform([nextlongitude,nextlatitude], 'EPSG:4326', 'EPSG:3857'));
								var pointFeature = new ol.Feature(point);
								pointFeature.setStyle(nextStyle);
								pointFeature.attributes = {"vistype":"photo","visid":PhotoID};
								vectorSource.addFeature(pointFeature);
								//var PhotoPolygon=getPhotoPolygon(point,viewDistance,focalAngle,rotation);
								var PhotoPolygon=getPhotoPolygonByJSON(point,VisibilityViewJSON);
								var PolygonFeature = new ol.Feature(PhotoPolygon);
								PolygonFeature.setStyle(nextStyle);
								vectorSource.addFeature(PolygonFeature);
							}
						});

						var PillarModel=new Model('uis.papl.pillar');
						//PillarModel.query(['id','num_by_vl','longitude','latitude','prev_longitude','prev_latitude']).filter([['id','in',near_pillar_ids]]).limit(100).all().then(function(pillars)
						PillarModel.query(['id','num_by_vl','longitude','latitude','prev_longitude','prev_latitude']).filter([]).all().then(function(pillars)
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

						
						PillarModel.query(['id','name','longitude','latitude','apl_id']).filter([['id','in',pillar_ids]]).limit(100).all().then(function(pillars)
						{
							var tempMas=[];
							for (var i in pillars)
							{
								var longitude=pillars[i]['longitude'];
								var latitude=pillars[i]['latitude'];
								var wgs84Sphere = new ol.Sphere(6378137);
								tempMas.push({id: i, distance: wgs84Sphere.haversineDistance([longitude,latitude],[mainPhotoLongitude,mainPhotoLatitude])});	
								defPillarMap.push({id: pillars[i]['apl_id'][0]+"_"+pillars[i].id,name: pillars[i].name});
							}
							var sortMas=sortMasByDistance(tempMas);
							for (var i in sortMas)
							{
								pillar_tbody.append('<tr><td style="display:none;">'+pillars[sortMas[i].id].id+'</td><td>'+pillars[sortMas[i].id].name+'</td><td>'+Math.floor(sortMas[i].distance)+'</td></tr>');
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

						TransformerModel.query(['id','name','longitude','latitude','apl_id']).filter([['id','in',transformer_ids]]).limit(100).all().then(function(transformers)
						{
							var tempMas=[];
							for (var i in transformers)
							{
								var longitude=transformers[i]['longitude'];
								var latitude=transformers[i]['latitude'];
								var wgs84Sphere = new ol.Sphere(6378137);
								tempMas.push({id: i, distance: wgs84Sphere.haversineDistance([longitude,latitude],[mainPhotoLongitude,mainPhotoLatitude])});
								defTransMap.push({id: transformers[i]['apl_id'][0]+"_"+transformers[i].id,name: transformers[i].name});	
							}
							var sortMas=sortMasByDistance(tempMas);
							for (var i in sortMas)
							{
								trans_tbody.append('<tr><td style="display:none;">'+transformers[sortMas[i].id].id+'</td><td>'+transformers[sortMas[i].id].name+'</td><td>'+Math.floor(sortMas[i].distance)+'</td></tr>');
							}
						});
						photoClicked=false;
					});
				}
				function getPhotoPolygonByJSON(point, json_data){
					//console.debug(json_data)
					data=$.parseJSON(json_data);
					var arr_points=[];
					
					for (var i=0;i<data.length; i++){
						
						arr_points[i]=ol.proj.transform([data[i].lng,data[i].lat], 'EPSG:4326', 'EPSG:3857')
						//console.debug()
					//	arr_points.push([data[i].lat,data[i].lng])
					}
					//console.log(arr_points);
					var polygon=new ol.geom.Polygon([arr_points]);
					return polygon
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

				function sortMasByDistance(exSortMas)
				{
					objArray=exSortMas.slice();
					var sortMas=[];
					for (;;)
					{
						if (objArray.length<=0) break;
						var minValue=objArray[0].distance;
						var ind=0;
						for (var i in objArray)
						{
							if (objArray[i].distance<minValue)
							{
								ind=i;
								minValue=objArray[i].distance;
							}
						}
						sortMas.push(objArray[ind]);
						objArray.splice(ind,1);
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
					if (polylineMode) return;
					if (!visObject) return;
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

				$("#l_polyline_icon").click(function()
				{
					var firstPoint, firstCircle, prevCircle;
					var dynLine;
					fabricCanvas.off('object:moving');
					polylineMode=true;

					fabricCanvas.on('mouse:up', function(options)
					{
						var point=new fabric.Point(options.e.layerX,options.e.layerY);
						if (!firstPoint) firstPoint=point;
						if ((dynLine)&&(point.x>firstPoint.x-30)&&(point.x<firstPoint.x+30)&&(point.y>firstPoint.y-30)&&(point.y<firstPoint.y+30))
						{
							dynLine.set({x2:firstPoint.x,y2:firstPoint.y});
							firstCircle.inline=dynLine;
							firstCircle.prevCircle=prevCircle;
							prevCircle.nextCircle=firstCircle;
							fabricCanvas.renderAll();
							dynLine=null;
							firstPoint=null;
							fabricCanvas.off('mouse:up');
							fabricCanvas.off('mouse:move');
							polylineMode=false;
						}
						else
						{
							var circle=new fabric.Circle({radius:6,top:point.y-6,left:point.x-6,fill: 'rgba(0,0,0,0)',stroke:'red'});
							circle.MyID=circle.top+":"+circle.left;
							if (prevCircle)
							{
								circle.prevCircle=prevCircle;
								prevCircle.nextCircle=circle;
							}
							prevCircle=circle;
							circle.hasControls=false;
							circle.lockScalingX=true;
							circle.lockScalingY=true;
							circle.lockUniScaling=true;
							circle.lockRotation=true;
							if (dynLine)
							{
								circle.inline=dynLine;
							}
							dynLine=new fabric.Line([point.x,point.y,point.x+10,point.y+10],{stroke:'red'});
							dynLine.selectable=false;
							fabricCanvas.add(circle);
							fabricCanvas.add(dynLine);
							circle.outline=dynLine;
							if (!firstCircle)
							{ 
								firstCircle=circle;
								defCircleMap[circle.MyID]=firstCircle;;
							}
						}
					});

					fabricCanvas.on('mouse:move', function(options)
					{
						if (dynLine)
						{
							dynLine.set({x2:options.e.layerX,y2:options.e.layerY});
							fabricCanvas.renderAll();
						}
					});

					fabricCanvas.on('object:moving',function(options)
					{
						if (options.target.type=="circle")
						{
							if ((options.target.inline)&&(options.target.outline))
							{
								options.target.inline.set({x2:options.target.left+6,y2:options.target.top+6});
								options.target.outline.set({x1:options.target.left+6,y1:options.target.top+6});
							}
						}
					});
				});

				$('html').keyup(function(e)
				{
   					if(e.keyCode == 46) 
					{
        				visObject=fabricCanvas.getActiveObject();
						if (!visObject) return;
						if (visObject.type=="circle")
						{
							if ((!visObject.inline)&&(!visObject.outline))
							{
								fabricCanvas.remove(visObject);
								fabricCanvas.renderAll();
								return;
							}
							fabricCanvas.remove(visObject.inline);
							fabricCanvas.remove(visObject.outline);
							var prevCircle=visObject.prevCircle;
							var nextCircle=visObject.nextCircle;
							newLine=new fabric.Line([prevCircle.left+6,prevCircle.top+6,nextCircle.left+6,nextCircle.top+6],{stroke:'red'});
							newLine.selectable=false;
							fabricCanvas.add(newLine);
							prevCircle.outline=newLine;
							nextCircle.inline=newLine;
							prevCircle.nextCircle=nextCircle;
							nextCircle.prevCircle=prevCircle;
							if (defCircleMap[visObject.MyID])
							{
								delete defCircleMap[visObject.MyID];
								if ((nextCircle)&&(nextCircle!=visObject)) defCircleMap[nextCircle.MyID]=nextCircle;
							}
							fabricCanvas.remove(visObject);
							fabricCanvas.renderAll();
						}
    					}
				});
				
				$("#l_circle_icon").click(function()
				{
					polylineMode=true;
					fabricCanvas.on('mouse:up', function(options)
					{
						var circle=new fabric.Circle({radius:12,top:options.e.layerY-12,left:options.e.layerX-12,fill: 'rgba(0,0,0,0)',stroke:'red'});
						circle.vistype="defcircle";
						circle.setControlsVisibility({
														mt: false, 
														mb: false, 
														ml: false, 
														mr: false, 
														mtr: false, 
													});
						fabricCanvas.add(circle);
						fabricCanvas.off('mouse:up');
						polylineMode=false;
					});
				});

				$("#l_defect_icon").click(function()
				{
					$("#cwrap").append('<div id="defectForm" class="defectForm"><h3>Создать новый дефект</h3></div>');
					var defectForm=$('#defectForm');
					defectForm.append('<label for="defname">Наименование дефекта</label>');
					defectForm.append('<input type="text" id="defname" class="defectInputText" name="defname" placeholder="Наименование дефекта..">');
					defectForm.append('<label for="apl">Линия</label>');
					defectForm.append('<select id="apl" class="defectInputText" name="apl"></select>');
					defectForm.append('<label for="objtype">Тип объекта</label>');
					defectForm.append('<select id="objtype" class="defectInputText" name="objtype"><option value="pillar">Опора</option><option value="transformer">Трансформатор</option></select>');
					defectForm.append('<label for="obj">Объекты</label>');
					defectForm.append('<select multiple id="obj" class="defectInputText" name="obj"></select>');
					defectForm.append('<label for="defcat">Категория дефекта</label>');
					defectForm.append('<select id="defcat" class="defectInputText" name="defcat"><option value="1">Незначительная</option><option value="2">Значительная</option><option value="3">Предаварийная</option><option value="4">Аварийная</option></select>');
					defectForm.append('<label for="defdefin">Описание дефекта</label>');
					defectForm.append('<textarea id="defdefin" class="defectInputText" style="height:120px" name="defdefin" placeholder="Описание дефекта..">');
					defectForm.append('<input type="submit" id="createdef" class="defectInputSubmit" value="Создать">');
					defectForm.append('<input type="submit" id="canceldef" class="defectInputSubmit" value="Отмена">');
					
					for (var i in defAPLMap) $('#apl').append('<option value="'+defAPLMap[i].id+'">'+defAPLMap[i].name+'</option>');
					
					setDefObject();
					
					$('#objtype').change(function()
					{
						setDefObject();
					});
					$('#apl').change(function()
					{
						setDefObject();
					});
					
					function setDefObject()
					{
						$('#obj').empty();
						var objType=$('#objtype').val();
						var aplID=$('#apl').val();
						var actMap;
						if ($('#objtype').val()=="pillar") actMap=defPillarMap;
						if ($('#objtype').val()=="transformer") actMap=defTransMap;
						for (var i in actMap)
						{
							var masID=actMap[i].id.split('_');
							if (masID.length>1)
							{
								if (masID[0]==aplID) $('#obj').append('<option value="'+masID[1]+'">'+actMap[i].name+'</option>');
							}
						}
					}
					$('#canceldef').on('click',function()
					{
						defectForm.remove();
					});
					$('#createdef').on('click',function()
					{
						var defname=$('#defname').val();
						if (!defname)
						{
							alert('Заполните наименование дефекта');
							return;
						}
						var obj=$('#obj').val();
						if (!obj)
						{
							alert('Выберите объект дефекта');
							return;
						}
						var defdefin=$('#defdefin').val();
						if (!defdefin)
						{
							alert('Заполните описание дефекта');
							return;
						}
						spinner=new Spinner().spin();
						$("#cwrap").append($(spinner.el));
						var ObjType;
						if ($('#objtype').val()=="pillar") ObjType="uis.papl.pillar";
						if ($('#objtype').val()=="transformer") ObjType="uis.papl.transformer";
						var ObjIDs=[];
						ObjIDs=obj.slice();
						var AplID=$('#apl').val();
						var DefCat=$('#defcat').val();
						var DJSON='{"canvaswidth":'+fabricCanvas.getWidth()+',"canvasheight":'+fabricCanvas.getHeight();
						if (Object.keys(defCircleMap).length)
						{
							DJSON=DJSON+',"coordinates": [';
							var firstCircleCh=true;
							for (var i in defCircleMap)
							{
								var firstCircle=defCircleMap[i];
								var CJSON='[['+firstCircle.left+','+firstCircle.top+']';
								var a=0;
								var circle=firstCircle;
								for(;;)
								{
									circle=circle.nextCircle;
									if (circle==firstCircle) break;
									a=a+1;
									if (a>50) break;
									CJSON=CJSON+',['+circle.left+','+circle.top+']';
								}
								CJSON=CJSON+']';
								if (firstCircleCh) 
								{
									DJSON=DJSON+CJSON;
									firstCircleCh=false;
								}
								else DJSON=DJSON+','+CJSON;
							}
							DJSON=DJSON+']';
						}
						DJSON=DJSON+',"defcircles": [';
						var fabricObjects=fabricCanvas.getObjects();
						var wasCircle=false;
						for (var i in fabricObjects)
						{
							if (fabricObjects[i].vistype=="defcircle")
							{
								if (!wasCircle)
								{
									DJSON=DJSON+'['+fabricObjects[i].left+','+fabricObjects[i].top+','+Math.round(fabricObjects[i].getWidth()/2)+']';
									wasCircle=true;
								}
								else DJSON=DJSON+',['+fabricObjects[i].left+','+fabricObjects[i].top+','+Math.round(fabricObjects[i].getWidth()/2)+']';
							}
						}
						DJSON=DJSON+']}';
						var DefModel=new Model('uis.papl.mro.defect');
						DefModel.call('create_defect',[defname,AplID,ObjType,ObjIDs,DefCat,defdefin,ID,mainPhotoLongitude,mainPhotoLatitude,DJSON],{context:WContext}).then(function(result)
						{
							spinner.stop();
							defectForm.remove();
							alert('Дефект успешно создан! ID: '+result);
						});
					});
				});

			});
		}
	});

	core.form_widget_registry.add('fotorama', fotorama);
});