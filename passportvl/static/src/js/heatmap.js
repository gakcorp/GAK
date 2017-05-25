odoo.define('passportvl.form_widgets', function (require)
{
    var core = require('web.core');
	/*var Model=require('web.Model');*/
	var instance = openerp;
	heatmap=instance.web.form.AbstractField.extend(
    {
        map: null,
        render_value: function()
		{
			this.$el.find('#heat_def_map').remove();
            var def_heat_map=$('<div id="heat_def_map" class="heat_map"></div>');
            def_heat_map.css('width','400px');
			def_heat_map.css('height','200px');
			this.$el.append(def_heat_map);
			data = new ol.source.Vector();
			var OsmLayer=new ol.layer.Tile({source: new ol.source.OSM()});
			
			cwm=this;
			hmap=new ol.Map({
				target:def_heat_map.get()[0],
				renderer: 'canvas',
				layers: [OsmLayer],
				controls:[]
			});
			
			hmap.setSize([def_heat_map.width(),def_heat_map.height()]);
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