# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont
import logging
import datetime
from . import uismodels

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

_logger.debug('Start scheme APLv2')
scheme_width=800
scheme_height=800
border=20
pillar_radius=8
trans_size=20
ps_x_size=40
ps_y_size=80
latperpx=0
lngperpx=0
show_dist=200
fontPath ="/usr/share/fonts/truetype/verdana/verdana.ttf"
font12= ImageFont.truetype (fontPath,12)
font10= ImageFont.truetype (fontPath,10)
font08= ImageFont.truetype (fontPath,8)

def latlng2schemexy(lat,lng,minlat,minlng,maxlat,maxlng,width=scheme_width,height=scheme_height,b=border):
    latperpx=(width-2*b)/(maxlat-minlat)
    lngperpx=(height-2*b)/(maxlng-minlng)
    klat=1
    klng=1
    if latperpx<lngperpx:
        klat=1
        klng=latperpx/lngperpx
    if lngperpx<latperpx:
        klng=1
        klat=lngperpx/latperpx
    y=width-int(b+klat*(lat-minlat)*latperpx)
    x=int(b+klng*(lng-minlng)*lngperpx)
    return x,y
def getMinMaxLatLng(apl_id):
    minlat,maxlat,minlng,maxlng=360,0,360,0
    for pil in apl_id.pillar_id:
        _logger.debug('pillar %r'%pil.id)
        clat,clng=pil.latitude,pil.longitude
        if (clat!=0):
            if (clat>maxlat):
                maxlat=clat
            if (clat<minlat):
                minlat=clat
        if (clng!=0):
            if (clng>maxlng):
                maxlng=clng
            if (clng<minlng):
                minlng=clng
    return minlat,minlng,maxlat,maxlng
def getSchemedata(apl_id):
    ps_data={
        "counter":0,
        "ps":[]
    }
    pillar_data={
        "counter":0,
        "counter_main":0,
        "pillars":[]
        }
    pillar_links={
        "counter":0,
        "links":[]
    }
    trans_data={
        "counter":0,
        "transformers":[]
    }
    base_pils=[]
    for pil in apl_id.pillar_id:
        if (not(pil.parent_id))|pil.pillar_type_id.base:
            pillar_data["counter"]=pillar_data["counter"]+1
            base_pils.append(pil)
            pillar_data["pillars"].append({
                        'id':pil.id,
                        'sid':'P'+str(pil.id),
                        'name':pil.name,
                        'num_by_vl':pil.num_by_vl,
                        'latitude':pil.latitude,
                        'longitude':pil.longitude
                    })
    for tap in apl_id.tap_ids:
        pillar_data["counter"]=pillar_data["counter"]+1
        pillar_data["pillars"].append({
                    'id':tap.conn_pillar_id.id,
                    'sid':'P'+str(tap.conn_pillar_id.id),
                    'name':tap.conn_pillar_id.name,
                    'num_by_vl':tap.conn_pillar_id.num_by_vl,
                    'latitude':tap.conn_pillar_id.latitude,
                    'longitude':tap.conn_pillar_id.longitude
                    })
    
    for trans in apl_id.transformer_ids:
        trans_data["counter"]=trans_data["counter"]+1
        d=40
        dlat=1
        dlng=1
        if trans.longitude<trans.pillar_id.longitude:
            dlng=-1
        if trans.latitude<trans.pillar_id.latitude:
            dlat=-1
            
        plng=trans.longitude+d*lngperpx*dlng
        plat=trans.latitude+d*latperpx*dlat
        trans_data["transformers"].append({
            'id':trans.id,
            'sid':'T'+str(trans.id),
            'name': trans.name,
            'latitude': trans.latitude,
            'longitude': trans.longitude,
            'rotation':trans.trans_stay_rotation,
            'platitude':plat,
            'plongitude':plng
        })
        pillar_links["counter"]=pillar_links["counter"]+1
        sdist=''
        pillar_links["links"].append({
            'lat1':plat,
            'lat2':trans.pillar_id.latitude,
            'lng1':plng,
            'lng2':trans.pillar_id.longitude,
            'dist':sdist
        })
    for pil in base_pils:
        lat1=pil.latitude
        lng1=pil.longitude
        lat2=pil.latitude
        lng2=pil.longitude
        _logger.debug('Finder for base pillar %r'%pil.name)
        if pil.parent_id:
            np=pil.parent_id
            while (not(np.pillar_type_id.base)) and (np.parent_id) and (np.tap_id==pil.tap_id):
                _logger.debug('Prev pillar is %r'%np.name)
                np=np.parent_id
            lat2=np.latitude
            lng2=np.longitude
        pillar_links["counter"]=pillar_links["counter"]+1
        dist=uismodels.distance2points(lat1,long1,lat2,long2)
        sdist=''
        if dist>show_dist:
            sdist=int(dist)
        pillar_links["links"].append({
            'lat1':lat1,
            'lat2':lat2,
            'lng1':lng1,
            'lng2':lng2,
            'dist':sdist
        })
    return ps_data,pillar_data, trans_data, pillar_links    

def drawpillar(draw,x,y,text):
    points=(int(x-pillar_radius/2),int(y-pillar_radius/2),int(x+pillar_radius/2),int(y+pillar_radius/2))
    draw.ellipse (points,fill="grey", outline="black")
    #fnt = ImageFont.truetype("arial.ttf", 15)
    #fnt = ImageFont.load("arial.pil")
    draw.text((int(x-pillar_radius/2),int(y+2+pillar_radius/2)), text, font=font10, fill=(0,0,0,128))

def drawtrans(draw,x,y,text):
    x1=int(x-trans_size/2)
    x2=int(x+trans_size/2)
    y1=int(y-trans_size/2)
    y2=int(y+trans_size/2)
    #print x1,x2,y1,y2
    draw.rectangle(((x1,y1),(x2,y2)), fill="white", outline ="black")
    draw.line((x1,y1,x,y2), fill="black")
    draw.line((x,y2,x2,y1), fill="black")
    draw.text((x2+10, y), text, font=font10, fill=(0,0,0,128))

def drawps(draw,x,y,text,fid):
    x1=x-ps_x_size
    y1=int(y-ps_y_size/2)
    x2=x
    y2=int(y+ps_y_size/2)
    draw.rectangle(((x1,y1),(x2,y2)), fill="white", outline="black")
    draw.rectangle(((x-3,y-3),(x+3,y+3)),fill="white", outline="black")
    draw.text((x+5,y-10),fid, fill=(0,0,0,128))
    draw.text((x1,y1-20), text, font=font10, fill=(0,0,0,128))
    

def drawlines(draw,x1,y1,x2,y2,text):
    draw.line((x1,y1,x2,y2), fill="black")
    drae.text((int((x1+x2)/2),int((y1+y2)/2)),text,font=font08,fill=(0,0,0,128))
    
def drawScheme(img,apl_id):
    _logger.debug('Start draw scheme for apl_id=%r'%apl_id)
    points={}
    draw = ImageDraw.Draw(img)
    #draw.ellipse ((90,90,110,110),fill="red", outline="blue")
    minlat,minlng,maxlat,maxlng=getMinMaxLatLng(apl_id)
    _logger.debug('Defined min|max lat/lng (%r|%r/%r|%r)'%(minlat,maxlat,minlng,maxlng))
    ps_data, pillar_data, trans_data, pillar_links = getSchemedata(apl_id)
    for link in pillar_links["links"]:
        x1,y1=latlng2schemexy(link["lat1"],link["lng1"],minlat,minlng,maxlat,maxlng)
        x2,y2=latlng2schemexy(link["lat2"],link["lng2"],minlat,minlng,maxlat,maxlng)
        drawlines(draw,x1,y1,x2,y2,str(link["dist"]))
    for pil in pillar_data["pillars"]:
        x,y=latlng2schemexy(pil["latitude"],pil["longitude"],minlat,minlng,maxlat,maxlng)
        _logger.debug('draw pillar %r in x,y (%r,%r)'%(pil["num_by_vl"],x,y))
        drawpillar(draw,x,y,str(pil["num_by_vl"]))
    for trans in trans_data["transformers"]:
        x,y=latlng2schemexy(trans["platitude"],trans["plongitude"],minlat,minlng,maxlat,maxlng)
        _logger.debug('draw transformer %r in (%r,%r)'%(trans["name"],x,y))
        drawtrans(draw,x,y,trans["name"])
    return draw