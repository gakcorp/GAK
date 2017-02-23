function show_tap_profile(lib,tap_id){
    lib.show_info_bar(tap_id);
    get_tap_elevation_data(tap_id);
};

function get_tap_elevation_data(tap_id){
        var data={
            'tap_ids':tap_id};
        //data.tap_ids={tap_id};
        xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/tap/elevation_data',true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response);
            var td=JSON.parse(res.result.elevation_data);
            console.debug(td);
            };
};