/* https://jsfiddle.net/vLL4jLdg/ */
odoo.define('passportvl.form_widgets', function (require)
{
    var core = require('web.core');
	/*var Model=require('web.Model');*/
	var instance = openerp;
	series_chart=instance.web.form.AbstractField.extend(
    {
		hchart: null,
		title: null,
		
		render_value: function()
		{
			if (this.options.title){title=this.options.title;}
			
			this.$el.find('#scont').remove();
            series_chart_div=$('<div id="scont" class="series_chart"></div>');
            /*def_heat_map.css('width','100%');
			#def_heat_map.css('height','100%');*/
			this.$el.append(series_chart_div);
			
			this.$el.width(this.$el.parent().width());
			this.$el.height(this.$el.parent().height());
			sc_val=$.parseJSON(this.get_value());
			//console.log(sc_val);
			//series_chart_div.append(sc_val);
			var categories=[], flags=[];
			for (i=0;i<sc_val.length;i++){
				if (flags[sc_val[i].category]) continue;
				flags[sc_val[i].category]=true;
				categories.push(sc_val[i].category);
			}
			chart_options={
				chart:{
					renderTo:series_chart_div[0],
					type:'bar'
				}
			};
			schart=new Highcharts.Chart(chart_options);
			//chart_options.credits.enabled=false;
			
			/*chart=series_chart_div.highcharts({
				credits:{enabled:false},
				chart:{
					type:'bar',
					renderTo:'scont'},
				xAxis: {
					categories: categories
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
					},{
					showInLegend:false,
					color:'#aa00ff',
					name: 'CONFIRMED',
					data: [2, 2, 3, 2, 1]
					},{
					showInLegend:false,
					name: 'DRAFT',
					color:'#aaaaaa',
					data: [5, 3, 4, 7, 2]
					},{
					showInLegend:false,
					name: 'CANCELED',
					color:'#ccffcc',
					data: [5, 3, 4, 7, 2]
					},
					]
				});*/
			//chart.setSize([series_chart_div.parent().width(),series_chart_div.parent().height()]);
			/*chart=Highcharts.chart({
				credits:{enabled:false},
				chart:{type:'bar'},
				title:{text:null},
				});*/
			
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