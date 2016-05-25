function photolib(apl_ids,map) {
    this.map=map;
    this.apl_ids=apl_ids;
    this.photo_count='n/a';
    this.photo_count_hash='n/a';
    this.photo_data=[];
    this.photo_data_hash='';
    
    
    //Define functions
    this.show_photo_markers=function(){
        
    }
    this.get_photo_count=function(){
        var data={};
        data['apl_ids']=this.apl_ids
        xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/photo/count',true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response)
            var pcd=JSON.parse(res.result.count_data);
            that.photo_count=pcd.count;
            document.getElementById('photo_count_badge').innerHTML=that.photo_count;  
            };
    }
    this.get_photo_data=function(){
        var data={};
        data['apl_ids']=this.apl_ids
        xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/photo/data',true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response)
            var pcd=JSON.parse(res.result.photo_data);
            that.photo_data=pcd.photo_data;
            that.show_photo_markers();
            };
    }
    this.get_photo_count_hash=function(){
        var data={};
        data['apl_ids']=this.apl_ids;
        xhr=new XMLHttpRequest();
        xhr.open('POST','/apiv1/photo/photo_count_hash',true);
        xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        var that=this;
        xhr.onload=function(e){
            var res=JSON.parse(this.response)
            var pcd=JSON.parse(res.result.res);
            if (pcd.photo_count_hash != this.photo_count_hash) {
                that.photo_count_hash=pcd.photo_count_hash;
                that.get_photo_count();
                that.get_photo_data();
            }
            
            };
    }
    
    this.refresher=function(){
        console.debug('Photo refresher')
        var r1=this.get_photo_count_hash();
        var r2=this.get_photo_count();
        return 1;
    }
};


var sitephotolib=new photolib(apl_ids,map);
//var photo_ref=new sitephotolib.refresher();
function photo_ref() {
    sitephotolib.get_photo_count_hash();
    sitephotolib.get_photo_count();
};
ref_functions.push(photo_ref);

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