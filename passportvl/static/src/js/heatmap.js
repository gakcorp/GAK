odoo.define('passportvl.form_widgets', function (require)
{
    var core = require('web.core');
	/*var Model=require('web.Model');*/
	var instance = openerp;
	heatmap=instance.web.form.AbstractField.extend(
    {
        hmap: null,
		render_value: function()
		{
			this.$el.find('#heat_def_map').remove();
            var def_heat_map=$('<div id="heat_def_map" class="heat_map"></div>');
            /*def_heat_map.css('width','100%');
			#def_heat_map.css('height','100%');*/
			this.$el.append(def_heat_map);
			data = new ol.source.Vector();
			var OsmLayer=new ol.layer.Tile({source: new ol.source.OSM()});
			
			cwm=this.$el;
			hmap=new ol.Map({
				controls:[new ol.control.FullScreen()],
				target:def_heat_map.get()[0],
				renderer: 'canvas',
				layers: [OsmLayer]});
			
			this.$el.width(this.$el.parent().width());
			this.$el.height(this.$el.parent().height());
			hmap.setSize([def_heat_map.parent().width(),def_heat_map.parent().height()]);
            this.hmap=hmap;
				
			a_val=$.parseJSON(this.get_value());
			sumlat=0;
			sumlng=0;
			cnt=a_val.length;
			a_val.forEach(function(item,i,a_val){
				var coord=[item.lng,item.lat];
				
				sumlat=sumlat+item.lat;
				sumlng=sumlng+item.lng;
				var lonLat = new ol.geom.Point(ol.proj.transform(coord, 'EPSG:4326', 'EPSG:3857'));
				var pointFeature=new ol.Feature({
					geometry:lonLat,
					weight:item.cnt
				});
				data.addFeature(pointFeature);
			
			hmap.setView(new ol.View({
                center: ol.proj.transform([sumlng/cnt, sumlat/cnt], 'EPSG:4326', 'EPSG:3857'),
                zoom: 13
				}));	
			});
			heatMapLayer = new ol.layer.Heatmap({
				source: data,
				radius: 3
			});
			hmap.addLayer(heatMapLayer);
		}
	});
	core.form_widget_registry.add('heatmap', heatmap);
});