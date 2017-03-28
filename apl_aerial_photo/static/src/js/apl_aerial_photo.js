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
				var fotorama;
				$(document.body).append('<div id="cwrap" class="cwrap"></div>');
				$("#cwrap").append('<div id="fotorama" class="fotorama cfotorama"  data-nav="thumbs" data-width="100%" data-height="100%">'+this.innerHTML+'</div>');
				$("#cwrap").append('<a id="hrefid" href="#" class="close-thik"></a>');
				$('#hrefid').click(function()
				{
					$("#cwrap").remove();
				});
				var masURL=this.innerHTML.split('&');
				var IdExpr=/.*id=(\d+)/gi;
				var ModelExpr=/.*model=(.+)/gi;
				var FieldExpr=/.*field=(.+)/gi;
				var ID,ModelName,FieldName;
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
				if (((ModelName=='uis.ap.photo')||(ModelName=='uis.ap.pre_photo'))&&(ID))
				{
					var PhotoModel=new Model(ModelName);
					PhotoModel.query(['next_photo_ids']).filter([['id','=',ID]]).limit(15).all().then(function(photos)
					{
						var next_photo_ids=photos[0]['next_photo_ids'];
						for (var i=0;i<next_photo_ids.length;i++)
						{
							var url = session.url('/web/image', {model: ModelName,
                                        							id: next_photo_ids[i],
                                        							field: FieldName,
												unique: ID+"_"+next_photo_ids[i]
										});
							$('#fotorama').append('<img src="'+url+'">');
						}
						fotorama=$('#fotorama').fotorama().data('fotorama');
					});
				}
				else
				{
					fotorama=$('#fotorama').fotorama().data('fotorama');
				}
				
				if (true)
				{
					var l_mouseleave=true;
					var fabricCanvas;
					var canvasMap=new Map();
					var PhotoID;
					var PillarMap;
					var TransMap;

					$("#cwrap").append('<div id="l_button" class="l_button">\<<div id="l_panel" class="l_panel"></div></div>');
					$("#l_panel").append('<div id="l_controle_block" class="l_controle_block"></div>');
					$("#l_controle_block").append('<img id="l_rectangle_icon" class="l_rectangle_icon" src="/apl_aerial_photo/static/src/icon/rectangle.png">');
					$("#l_controle_block").append('<img id="l_delete_icon" class="l_text_icon" src="/apl_aerial_photo/static/src/icon/delete.png">');
					$("#l_controle_block").append('<img id="l_zoom_icon" class="l_text_icon" src="/apl_aerial_photo/static/src/icon/zoom.png">');
					$("#l_controle_block").append('<img id="l_save_icon" class="l_text_icon" src="/apl_aerial_photo/static/src/icon/save.png">');
					var table=$('<table class="l_table"><caption>Pillars</caption><thead><tr><th>ID</th><th>Name</th></tr></thead></table>')
					var tbody=$('<tbody></tbody>');
					var trans_table=$('<table class="l_table"><caption>Transformers</caption><thead><tr><th>ID</th><th>Name</th></tr></thead></table>')
					var trans_tbody=$('<tbody></tbody>');
					table.append(tbody);
					trans_table.append(trans_tbody);
					$("#l_controle_block").append(table);
					$("#l_controle_block").append(trans_table);
					tbody.on("click","tr", function() {
								clickTableTR(this);
								});
					trans_tbody.on("click","tr", function() {
								clickTableTR(this);
								});


					function getVisObjects()
					{
						if (!fotorama) return;	
						var mainPhoto=fotorama.activeFrame.$stageFrame.children("img")[0];
						if (mainPhoto)
						{
							var IdExpr=/.*id=(\d+)/;
							var mas=IdExpr.exec(mainPhoto.src);
							var id;
							if (mas) id=mas[1];
							if (!id) return;
							PhotoID=id;
							tbody.find('tr').remove();
							trans_tbody.find('tr').remove();
							var PhotoModel=new Model(ModelName);
							PillarMap=new Map();
							TransMap=new Map();
							PhotoModel.query(['pillar_ids','transformer_ids']).filter([['id','=',id]]).limit(100).all().then(function(photos)
							{
								var near_pillar_ids=photos[0]['pillar_ids'];
								var near_transformer_ids=photos[0]['transformer_ids'];
								if (near_pillar_ids)
								{
									var PillarModel=new Model('uis.papl.pillar');
									PillarModel.query(['name']).filter([['id','in',near_pillar_ids]]).limit(100).all().then(function(pillars)
									{
										
										for (var i=0;i<pillars.length;i++)
										{
											tbody.append('<tr><td>'+pillars[i].id+'</td><td>'+pillars[i].name+'</td></tr>');
											PillarMap.set(pillars[i].name,pillars[i].id);
										}
									});
									var TransModel=new Model('uis.papl.transformer');
									TransModel.query(['name']).filter([['id','in',near_transformer_ids]]).limit(100).all().then(function(transformers)
									{
										
										for (var i=0;i<transformers.length;i++)
										{
											trans_tbody.append('<tr><td>'+transformers[i].id+'</td><td>'+transformers[i].name+'</td></tr>');
											TransMap.set(transformers[i].name,transformers[i].id);
										}
									});
								}
							});
							if (fabricCanvas) fabricCanvas.wrapperEl.parentNode.style.visibility = 'hidden';
							fabricCanvas=canvasMap.get(id);
							if (fabricCanvas) fabricCanvas.wrapperEl.parentNode.style.visibility = 'visible';
							else
							{
								var canvasDiv=$('<div id="div'+id+'"></div>');
								canvasDiv.css({position:'fixed',width:mainPhoto.width,height:mainPhoto.height,top:mainPhoto.offsetTop,left:mainPhoto.offsetLeft});
								var mainCanvas=$('<canvas id="canvas'+id+'"></canvas)');
								$("#cwrap").append(canvasDiv);
								canvasDiv.append(mainCanvas);
								fabricCanvas = new fabric.Canvas('canvas'+id);
								fabricCanvas.setHeight(mainPhoto.height);
								fabricCanvas.setWidth(mainPhoto.width);
								canvasMap.set(id,fabricCanvas);
							}
							if (fabricCanvas)
							{
								var VisObjectModel=new Model('uis.ap.vis_object');
								VisObjectModel.query(['name','rect_coordinate_json']).filter([['photo_id.id','=',PhotoID]]).limit(100).all().then(function(visObjects)
								{
									for (var i=0;i<visObjects.length;i++)
									{
										try
										{
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
											fabricCanvas.add(group);
										}
										catch(e)
										{
											console.log(e);
										}
									}
								});
							}
						}
					}

					$('.fotorama').on('fotorama:show', function (e, fotorama, extra) {
  						getVisObjects();
					});

					$('.fotorama').on('fotorama:load', function (e, fotorama, extra) {
						if (fotorama.activeFrame.$stageFrame.children("img")[0])
						{
							getVisObjects();
							$('.fotorama').off('fotorama:load');
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
						if (fabricCanvas.getActiveObject()) fabricCanvas.remove(fabricCanvas.getActiveObject());	
					});
					$("#l_zoom_icon").click(function()
					{
						if ($(".zoomContainer")[0])
						{
							$(".zoomContainer").remove();
							fabricCanvas.wrapperEl.parentNode.style.visibility = 'visible';
						}
						else
						{							var mainPhoto=fotorama.activeFrame.$stageFrame.children("img")[0];
							$(mainPhoto).attr("data-zoom-image",mainPhoto.src.replace(/image_\d+/, "image"));
							fabricCanvas.wrapperEl.parentNode.style.visibility = 'hidden';
							$(mainPhoto).elevateZoom({zoomType: "lens"});
						}
					});
					$("#l_save_icon").click(function()
					{
						var Vis_Object=new Model('uis.ap.vis_object');
						var objCount=0;
						var callCount=0;
						var PillarIDs=[];
						var TransformerIDs=[];
						var mainPhoto=fotorama.activeFrame.$stageFrame.children("img")[0];
						console.log(mainPhoto.src.replace(/image_\d+/, "image"));
						fabric.Image.fromURL(mainPhoto.src.replace(/image_\d+/, "image"),function(image)
						{
							var kW=image.getWidth()/fabricCanvas.getWidth();
							var kH=image.getHeight()/fabricCanvas.getHeight();
							fabricCanvas.forEachObject(function(obj)
							{
    								if (obj.type=="group")
								{
									var objType;
									var objID;
									var rect=obj.item(0);
									var imgBinary=image.toDataURL({left:obj.getLeft()*kW,top:obj.getTop()*kH,width:rect.getWidth()*kW,height:rect.getHeight()*kH}).replace(/^data:image\/(png|jpg);base64,/, "");	
									objCount++;
									var RJSON='{"groupleft":'+obj.left+',"grouptop":'+obj.top+',"rectleft":'+rect.getLeft()+',"recttop":'+rect.getTop()+',"rectheight":'+rect.getHeight()+',"rectwidth":'+rect.getWidth()+
										',"canvaswidth":'+fabricCanvas.getWidth()+',"canvasheight":'+fabricCanvas.getHeight()+'}';
									if (PillarMap.get(obj.item(1).text))
									{
										objType='uis.papl.pillar';
										objID=PillarMap.get(obj.item(1).text);
										PillarIDs.push(objID);
									}
									if (TransMap.get(obj.item(1).text))
									{
										objType='uis.papl.transformer';
										objID=TransMap.get(obj.item(1).text);
										TransformerIDs.push(objID);
									}
									if (objID)
									{
										Vis_Object.call('create_update_vis_object',[PhotoID,obj.item(1).text,objID,objType,RJSON,imgBinary]).then(function (result) {
											callCount++;
											if (callCount>=objCount)
											{
												Vis_Object.call('delete_objects',[PhotoID,'uis.papl.pillar',PillarIDs]).then(function(result){});
												Vis_Object.call('delete_objects',[PhotoID,'uis.papl.transformer',TransformerIDs]).then(function(result){});
											}
										});
									}
								}
							});
							if ((PillarIDs.length==0)&&(TransformerIDs.length==0))
							{
								Vis_Object.call('delete_objects',[PhotoID,'uis.papl.pillar',PillarIDs]).then(function(result){});
								Vis_Object.call('delete_objects',[PhotoID,'uis.papl.transformer',TransformerIDs]).then(function(result){});
							}
						});
	
					});

					function clickTableTR(tr)
					{
						if (fabricCanvas.getActiveObject())
						{
							var actObject=fabricCanvas.getActiveObject();
							if (actObject.get("type")=="rect")
							{
								var text = new fabric.Text($($(tr).children()[1]).html(), { left: actObject.get("left"), top: actObject.get("top"), fontSize: 12});
								text.lockRotation=true;
								fabricCanvas.add(text);
								var group = new fabric.Group([actObject.clone(),text.clone()]);
								group.lockRotation=true;
								text.remove();
								actObject.remove();
								fabricCanvas.add(group);
								fabricCanvas.setActiveObject(group);
							}
							if (actObject.get("type")=="group")
							{
								actObject.item(1).set({text:$($(tr).children()[1]).html()});
								fabricCanvas.renderAll();
							}
						}
					}
				}
			});
    		},
	});

	core.form_widget_registry.add('fotorama', fotorama);
});
