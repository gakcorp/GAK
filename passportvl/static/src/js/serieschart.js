<script src="https://code.highcharts.com/highcharts.js"></script>
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
});