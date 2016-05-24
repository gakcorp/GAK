function photolib(apl_ids,map) {
    this.map=map;
    this.apl_ids=apl_ids;
    this.photo_count='n/a';
    this.photo_count_hash='n/a';
    this.photo_data=[];
    this.photo_data_hash='';
    
    
    //Define functions
    this.req_xhr_json=function(method,path,async,indata){
        var xhr=new XMLHttpRequest();
        xhr.open(method,path,async);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(indata));
        return xhr
        
        };
        
    
    this.show_photo_count=function(){
        document.getElementById('photo_count_badge').innerHTML=this.photo_count;    
    }
    this.get_photo_count=function(){

        var data={};
        var res='';
        data['apl_ids']=this.apl_ids
        xhr_res=this.req_xhr_json('POST','/apiv1/photo/count',true,data);
        xhr_res.onload=function(e){
            var res=JSON.parse(this.response);
            pcd=JSON.parse(res.result.count_data);
            photo_count=pcd.count;
            show_photo_count();
        }
        
    }
    this.get_photo_count_hash=function(){
        
    }
    this.refresher=function(){
        console.debug('Photo refresher')
        this.get_photo_count_hash();
        this.get_photo_count();
    }
};

var sitephotolib=new photolib(apl_ids,map);
ref_functions.push(sitephotolib.refresher());

/*
var photo_count='n/a';
var photo_data=[];
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
    var old_val=photo_count
    get_photo_count(apl_ids)
    if (old_val != photo_count) {
        get_photo_data(apl_ids)
    }
}
*/
//ref_functions.push(photo_get_photo_count)


/*var photo_count='n/a'
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
    var old_val=photo_count
    get_photo_count(apl_ids)
    if (old_val != photo_count) {
        get_photo_data(apl_ids)
    }
}

ref_functions.push(photo_get_photo_count)*/