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
				$(document.body).append('<div id="cwrap" class="cwrap"></div>');
				$("#cwrap").append('<div id="fotorama" class="fotorama cfotorama"  data-nav="thumbs" data-width="100%" data-height="100%">'+this.innerHTML+'</div>')
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
							$('#fotorama').append('<img src="'+url+'">')
						}
						$('#fotorama').fotorama();
					});
				}
				else
				{
					$('#fotorama').fotorama();
				}
			});
    		},
	});

	core.form_widget_registry.add('fotorama', fotorama);
});
