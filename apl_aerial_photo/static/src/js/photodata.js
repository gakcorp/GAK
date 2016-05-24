var photo_count='n/a'
var photo_data=[]

function get_photo_count(a) {
    var data={};
    data['apl_ids']=a;

    var xhr=new XMLHttpRequest();
    xhr.open('POST', '/apiv1/photo/count/',true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.send(JSON.stringify(data));
    
    xhr.onload = function(e) {
    var resp = JSON.parse(this.response);
    pcd=JSON.parse(resp.result.count_data);
    photo_count=pcd.count;
    document.getElementById('photo_count_badge').innerHTML=photo_count;
    }
}

function get_photo_data(a) {
    var data={};
    data['apl_ids']=a;

    var xhr=new XMLHttpRequest();
    xhr.open('POST', '/apiv1/photo/data/',true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.send(JSON.stringify(data));
    
    xhr.onload = function(e) {
    var resp = JSON.parse(this.response);
    photo_data=JSON.parse(resp.result.photo_data);
    }
}

function photo_get_photo_count(apl_ids) {
    get_photo_count(apl_ids)
}