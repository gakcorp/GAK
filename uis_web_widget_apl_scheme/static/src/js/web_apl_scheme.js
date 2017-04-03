odoo.define('uis_web_widget_apl_scheme.apl_scheme_form_widget', function(require)
			{
				var core=require('web.core');
				//console.debug(require);
				var FieldBinaryImage=require('web.form_widgets');
				var FieldBinaryImage=core.form_widget_registry.get('image');
				var Model=require('web.Model');
				var session=require('web.session');
				apl_scheme=FieldBinaryImage.extend(
					{
						start: function(){
							this._super.apply(this,arguments);
							//fields=this.get_fields_values();
							//ID=this.field_manager.datarecord.id;
							//console.debug(this.$el);
							
							this.$el.dblclick(function(){
								//var fields=this.get_fields_values();
								//console.debug(fields);
								$(document.body).append('<div id="scheme_wrap" class="scheme_wrap"></div>');
								$("#scheme_wrap").append('<div id="sigma-container"></div>');
								$("#scheme_wrap").append('<a id="hrefid" href="#" class="close-thik">Close</i></a>');
								$("#hrefid").click(function()
												   {
													$("#scheme_wrap").remove();
													});
								var s=new sigma('sigma-container');
								//console.debug(this);
								console.debug(this.baseURI);
								var a_baseURI=this.baseURI.split('&');
								var IdExpr=/.*id=(\d+)/gi;
								var ModelExpr=/.*model=(.+)/gi;
								var ID,ModelName;
								for (var i=0;i<a_baseURI.length;i++){
									var mas_id=IdExpr.exec(a_baseURI[i]);
									var mas_model=ModelExpr.exec(a_baseURI[i]);
									console.debug(mas_id,mas_model);
									if ((mas_id)&&(mas_id.length>1)){
										ID=mas_id[1];}
									if ((mas_model)&&(mas_model.length>1)){
										ModelName=mas_model[1];}
								}
								console.debug(ID,ModelName);
								//if ((ModelName=='uis.papl.apl')&&(ID)){
									var AplModel=new Model('uis.papl.apl');
									AplModel.query(['sup_substation_id','pillar_id','pillar_id.latitude','pillar_id.longitude']).filter([['id','=',ID]]).all().then(function(pillars){
										console.debug(pillars);
										});
								//}
								
								s.graph.addNode({
									// Main attributes:
									id: 'n0',
									label: 'Hello',
									// Display attributes:
									x: 0,
									y: 0,
									size: 1,
									color: '#f00'
								  }).addNode({
									// Main attributes:
									id: 'n1',
									label: 'World !',
									// Display attributes:
									x: 1,
									y: 1,
									size: 1,
									color: '#00f'
								  }).addEdge({
									id: 'e0',
									// Reference extremities:
									source: 'n0',
									target: 'n1'
								  });
							  
								  // Finally, let's ask our sigma instance to refresh:
								  s.refresh();
							});
						}
					}
				);
				core.form_widget_registry.add('apl_scheme',apl_scheme);
			}
			);