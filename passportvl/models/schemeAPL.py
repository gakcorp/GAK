# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont
scheme_width=800
scheme_height=400
pillar_radius=10
trans_size=20
ps_x_size=40
ps_y_size=80
fontPath ="/usr/share/fonts/truetype/verdana/verdana.ttf"
font12= ImageFont.truetype (fontPath,12)
font10= ImageFont.truetype (fontPath,10)

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
    ps_id=apl_id.sup_substation_id
    if ps_id:
        ps_data["counter"]=ps_data["counter"]+1
        ps_data["ps"].append({
            'id':ps_id.id,
            'name':ps_id.name,
            'sid':'PS'+str(ps_id.id),
            'fid':str(apl_id.feeder_num)
        })
    apl_pillar_ids=apl_id.pillar_id
    apl_pillar_ids=apl_pillar_ids.sorted(key=lambda r:r.num_by_vl)
    if apl_pillar_ids:
        if apl_pillar_ids[0]:
            pillar_data["counter"]=pillar_data["counter"]+1;
            pillar_data["pillars"].append({
                        'id':apl_pillar_ids[0].id,
                        'sid':'P'+str(apl_pillar_ids[0].id),
                        'name':apl_pillar_ids[0].name,
                        'num_by_vl':apl_pillar_ids[0].num_by_vl,
                        'start_tap_id':0,
                        'start_tap':0,
                        'y_shift':0
                    })
            pp=apl_pillar_ids[0]
            if ps_data["counter"]>0:
                pillar_links["counter"]=pillar_links["counter"]+1
                pillar_links["links"].append({
                    'source_id':str(ps_data["ps"][0]["sid"]),
                    'target_id':'P'+str(apl_pillar_ids[0].id)
                    })
    tap_ids=apl_id.tap_ids
    s_tap_ids=tap_ids.sorted(key=lambda r:r.num_by_vl)
    for tap in s_tap_ids:
        #print tap.name
        if tap.conn_pillar_id:
            pillar_data["counter"]=pillar_data["counter"]+1
            pillar_data["counter_main"]=pillar_data["counter_main"]+1
            pillar_data["pillars"].append({
                'id':tap.conn_pillar_id.id,
                'sid':'P'+str(tap.conn_pillar_id.id),
                'name':tap.conn_pillar_id.name,
                'num_by_vl':tap.conn_pillar_id.num_by_vl,
                'start_tap_id':tap.id,
                'start_tap':tap.num_by_vl,
                'y_shift':0
            })
            tap_pillar_ids=tap.pillar_ids
            s_tap_pillar_ids=tap_pillar_ids.sorted(key=lambda r:r.num_by_vl, reverse=True)
            if s_tap_pillar_ids[0]:
                y_shift=-1
                if (tap.num_by_vl//2)*2-tap.num_by_vl<0:
                    y_shift=1
                pillar_data["counter"]=pillar_data["counter"]+1
                pillar_data["pillars"].append({
                    'id':s_tap_pillar_ids[0].id,
                    'sid':'P'+str(s_tap_pillar_ids[0].id),
                    'name':s_tap_pillar_ids[0].name,
                    'num_by_vl':s_tap_pillar_ids[0].num_by_vl,
                    'start_tap_id':tap.id,
                    'start_tap':tap.num_by_vl,
                    'y_shift':y_shift
                })
                pillar_links["counter"]=pillar_links["counter"]+1
                pillar_links["links"].append({
                    'source_id':'P'+str(tap.conn_pillar_id.id),
                    'target_id':'P'+str(s_tap_pillar_ids[0].id)
                })
            if pp:
                pillar_links["counter"]=pillar_links["counter"]+1
                pillar_links["links"].append({
                    'source_id':'P'+str(pp.id),
                    'target_id':'P'+str(tap.conn_pillar_id.id)
                })
            pp=tap.conn_pillar_id
    apl_pillar_ids=apl_pillar_ids.sorted(key=lambda r:r.num_by_vl, reverse=True)
    if apl_pillar_ids:
        if apl_pillar_ids[0]:
            pillar_data["counter"]=pillar_data["counter"]+1;
            pillar_data["pillars"].append({
                    'id':apl_pillar_ids[0].id,
                    'sid':'P'+str(apl_pillar_ids[0].id),
                    'name':apl_pillar_ids[0].name,
                    'num_by_vl':apl_pillar_ids[0].num_by_vl,
                    'start_tap_id':0,
                    'start_tap':pillar_data["counter_main"]+1,
                    'y_shift':0
                })
        if pp:
            pillar_links["counter"]=pillar_links["counter"]+1
            pillar_links["links"].append({
                'source_id':'P'+str(pp.id),
                'target_id':'P'+str(apl_pillar_ids[0].id)
            })
    for trans in apl_id.transformer_ids:
        y_shift=-2
        if (trans.tap_id.num_by_vl//2)*2-trans.tap_id.num_by_vl<0:
            y_shift=2
        trans_data["counter"]=trans_data["counter"]+1
        trans_data["transformers"].append({
            'id':trans.id,
            'sid':'T'+str(trans.id),
            'name':trans.name,
            'tap':trans.tap_id.num_by_vl,
            'y_shift':y_shift
        })
        if trans.pillar_id:
            pillar_links["counter"]=pillar_links["counter"]+1
            pillar_links["links"].append({
                'source_id':'P'+str(trans.pillar_id.id),
                'target_id':'T'+str(trans.id)
            })
    return ps_data,pillar_data, trans_data, pillar_links    

def drawpillar(draw,x,y,text):
    points=(int(x-pillar_radius/2),int(y-pillar_radius/2),int(x+pillar_radius/2),int(y+pillar_radius/2))
    draw.ellipse (points,fill="grey", outline="black")
    #fnt = ImageFont.truetype("arial.ttf", 15)
    #fnt = ImageFont.load("arial.pil")
    draw.text((int(x-2*pillar_radius),int(y+pillar_radius)), text, font=font12, fill=(0,0,0,128))

def drawtrans(draw,x,y,text):
    x1=int(x-trans_size/2)
    x2=int(x+trans_size/2)
    y1=int(y-trans_size/2)
    y2=int(y+trans_size/2)
    #print x1,x2,y1,y2
    draw.rectangle(((x1,y1),(x2,y2)), fill="white", outline ="black")
    draw.line((x1,y1,x,y2), fill="black")
    draw.line((x,y2,x2,y1), fill="black")
    draw.text((x2+10, y), text, font=font12, fill=(0,0,0,128))

def drawps(draw,x,y,text,fid):
    x1=x-ps_x_size
    y1=int(y-ps_y_size/2)
    x2=x
    y2=int(y+ps_y_size/2)
    draw.rectangle(((x1,y1),(x2,y2)), fill="white", outline="black")
    draw.rectangle(((x-3,y-3),(x+3,y+3)),fill="white", outline="black")
    draw.text((x+5,y-10),fid, fill=(0,0,0,128))
    draw.text((x1,y1-20), text, font=font10, fill=(0,0,0,128))
    

def drawlines(draw,x1,y1,x2,y2):
    draw.line((x1,y1,x2,y2), fill="black")
    
def drawScheme(img,apl_id):
    points={}
    draw = ImageDraw.Draw(img)
    #draw.ellipse ((90,90,110,110),fill="red", outline="blue")
    ps_data, pillar_data, trans_data, pillar_links = getSchemedata(apl_id)
    dx=int(scheme_width/(pillar_data["counter_main"]+5))
    #print dx
    my=int(scheme_height/2)
    dy=int(my/3)
    my=int(my-dy/2)
    for ps in ps_data["ps"]:
        cx=dx
        cy=my
        points[ps["sid"]]=(cx,cy)
    for pil in pillar_data["pillars"]:
        cx=dx*(pil["start_tap"]+2)
        cy=my+pil["y_shift"]*dy
        #drawpillar(draw,cx,cy,str(pil["num_by_vl"]))
        points[pil["sid"]]=(cx,cy)
    for trans in trans_data["transformers"]:
        cx=dx*(trans["tap"]+2)
        cy=my+trans["y_shift"]*dy
        #drawtrans(draw,cx,cy,str(trans["name"]))
        points[trans["sid"]]=(cx,cy)
    
    for line in pillar_links["links"]:
        source_id=line["source_id"]
        target_id=line["target_id"]
        x1,y1=points[source_id]
        x2,y2=points[target_id]
        drawlines(draw,x1,y1,x2,y2)
    for ps in ps_data["ps"]:
        sid=ps["sid"]
        cx,cy=points[sid]
        drawps(draw,cx,cy,ps["name"],ps["fid"])
    for pil in pillar_data["pillars"]:
        sid=pil["sid"]
        cx,cy=points[sid]
        drawpillar(draw,cx,cy,str(pil["num_by_vl"]))
    for trans in trans_data["transformers"]:
        sid=trans["sid"]
        cx,cy=points[sid]
        drawtrans(draw,cx,cy,trans["name"])
    return draw