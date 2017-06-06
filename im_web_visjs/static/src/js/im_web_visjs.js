odoo.define('im_web_visjs.form_widgets', function (require)
{
	var core = require('web.core');
	var instance = openerp;
	imvis_time_line=instance.web.form.AbstractField.extend({
		timeline: null,
		render_value: function(){
			items=this.get_value();
			options={};
			if (this.options){options=this.options;}
			this.$el.find('#im_time_line').remove();
			time_line_div=$('<div id="im_time_line" class="im_time_line"></div>');
			this.$el.width(this.$el.parent().width());
			this.$el.height(this.$el.parent().height());
			this.timeline=new vis.Timeline(time_line_div,items,options);
		}
	});
	core.form_widget_registry.add('imvis_timeline', imvis_time_line);
});
