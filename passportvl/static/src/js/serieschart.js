odoo.define('passportvl.form_widgets', function (require)
{
    var core = require('web.core');
	/*var Model=require('web.Model');*/
	var instance = openerp;
	series_chart=instance.web.form.AbstractField.extend(
    {
		hchart: null,
		title:null,
		
		render_value: function()
		{
			if (this.options.title){title=this.options.title;}
			
			this.$el.find('#series_chart_div').remove();
            var series_chart_div=$('<div id="series_chart_div" class="series_chart"></div>');
            /*def_heat_map.css('width','100%');
			#def_heat_map.css('height','100%');*/
			this.$el.append(series_chart_div);
			Highcharts.chart('series_chart_div',{
				credits:{enabled:false},
				chart:{type:'bar'},
				title:{text:title},
				});
		}
	});
	core.form_widget_registry.add('series_chart', series_chart);
});
	


/*<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>

<div id="container" style="min-width: 310px; max-width: 400px; height: 200px; margin: 0 auto"></div>


Highcharts.chart('container', {
    credits:{
        	enabled:false
        },
    chart: {
        type: 'bar',
   			
    },
    title: {
        text: null,
    },
    xAxis: {
        categories: ['Minor', 'Major', 'Pre-fault', 'Emergency', 'Critycal']
    },
    yAxis: {
        min: 0,
        title: {
            text: null
        }
    },
    legend: {
        reversed: false
    },
    plotOptions: {
        series: {
            stacking: 'percent'
        }
    },
    series: [ {
        showInLegend:false,
        color:'#00ff00',
        name: 'DONE',
        data: [3, 4, 4, 2, 5]
    },{
        showInLegend:false,
        name: 'WORK',
        color:'#0000ff',
        data: [3, 4, 4, 2, 5]
    }, {
        showInLegend:false,
        name: 'PLANED',
        color:'#ffff00',
        data: [3, 4, 4, 2, 5]
    },
    {
    		showInLegend:false,
        color:'#aa00ff',
        name: 'CONFIRMED',
        data: [2, 2, 3, 2, 1]
    },
    {
    		showInLegend:false,
        name: 'DRAFT',
        color:'#aaaaaa',
        data: [5, 3, 4, 7, 2]
    },
    {
    		showInLegend:false,
        name: 'CANCELED',
        color:'#ccffcc',
        data: [5, 3, 4, 7, 2]
    },
    
    ]
});*/