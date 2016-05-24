var ref_time=10000;
var ref_functions=[]

var res_shed=setInterval(ref_timer_fun,ref_time);
function ref_timer_fun() {
    var tf=ref_functions.length;
    console.debug('start refresher');
    for (var i=0;i<tf;i++){
        ref_functions[i];
    }
}