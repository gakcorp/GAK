//var apl_ids=[3];

console.debug('Start calculate scheme');
var pillar_data=[];
var pillar_links=[];
var ps_data=[];
var trans_data=[];

var pillars=[];
var trans=[];


var paper_width=700;
var paper_height=400;
var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: $('#scheme_holder'),
    width:paper_width,
    height:paper_height,
    model:graph,
    gridSize:1,
    interactive: false
})
paper.$el.css('pointer-events', 'none');


function print_pillar(pd) {

var set_pillar = function(pillar) {
    console.debug(pillar.sid);
    pillars[pillar.id] = new joint.shapes.basic.Circle({
        position:{'x': Math.round((paper_width/(pillar_data.counter_main+3))*(pillar.start_tap+1)), 'y': Math.round(paper_height/2+pillar.y_shift*50)},
        size:{width:20, height:20},
        id:pillar.sid,
        attrs:{
            circle:{'fill':'#CCCCCC'},
            text:{'text':pillar.num_by_vl,'font-size': 10, 'x-alignment':'right','y-allignment':'bottom'}
            }
        });
    graph.addCell(pillars[pillar.id]);
    };
console.debug(pillar_data)
if (pd) {
    for (var i=0; i<pd.counter;i++){
        set_pillar(pd.pillars[i]);
    }
}
}

function print_trans(td) {

var set_trans = function(tr) {
    trans[tr.id] = new joint.shapes.basic.Rect({
        position:{'x': Math.round((paper_width/(pillar_data.counter_main+3))*(tr.tap+1))-5, 'y': Math.round(paper_height/2+tr.y_shift*50)},
        size:{width:30, height:30},
        id:tr.sid,
        attrs:{
            rect:{'fill':'#CCCCCC'},
            text:{'text':tr.name,'font-size': 10}
            }
        });
    graph.addCell(trans[tr.id]);
    };
if (td) {
    for (var i=0; i<td.counter;i++){
       set_trans(trans_data.transformers[i]); 
    }
}
}

function print_link(ld) {
var set_pillar_links=function(plink){
    console.debug(plink.target_id);
    var link=new joint.dia.Link({
        source:{id: plink.source_id},
        target:{id: plink.target_id}
    });
    graph.addCell(link);
}
if (ld) {
    for (var i=0; i<ld.counter;i++){
        set_pillar_links(ld.links[i]);
    }
}
}
function load_data() {
    var data={};
    data['apl_ids']=apl_ids;

    var xhr=new XMLHttpRequest();
    xhr.open('POST', '/apiv1/data/scheme/pillardata/',true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.send(JSON.stringify(data));
    
   
    xhr.onload = function(e) {
    var resp = JSON.parse(this.response);
    pillar_data=JSON.parse(resp.result.pillar_data);
    print_pillar(pillar_data);
    trans_data=JSON.parse(resp.result.trans_data);
    print_trans(trans_data);
    pillar_links=JSON.parse(resp.result.pillar_links);
    print_link(pillar_links);
    }
}




load_data(); 







