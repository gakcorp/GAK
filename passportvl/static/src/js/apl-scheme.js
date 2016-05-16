var paper_width=800;
var paper_height=400;
var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: $('#scheme_holder'),
    width:paper_width,
    height:paper_height,
    model:graph,
    gridSize:1
})

var pillars=[];
var trans=[];
    
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

if (pillar_data) {
    for (var i=0; i<pillar_data.counter;i++){
        set_pillar(pillar_data.pillars[i]);
    }
}

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
if (trans_data) {
    for (var i=0; i<trans_data.counter;i++){
       set_trans(trans_data.transformers[i]); 
    }
    //code
}

var set_pillar_links=function(plink){
    console.debug(plink.target_id);
    var link=new joint.dia.Link({
        source:{id: plink.source_id},
        target:{id: plink.target_id}
    });
    graph.addCell(link);
}
if (pillar_links) {
    for (var i=0; i<pillar_links.counter;i++){
        set_pillar_links(pillar_links.links[i]);
    }
}
