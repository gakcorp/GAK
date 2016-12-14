# -*- coding: utf-8 -*-
import numpy as np
import matplotlib as mpl
mpl.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import googlemaps
import logging
import math

try:
    import cStringIO as StringIO
except ImportError:
    import StringIO

_logger=logging.getLogger(__name__)
_logger.setLevel(10)


sch_w=16
sch_h=10
sch_dpi=100
ms=18

def drawscheme(apl_ids, drawBP=False, drawTS=False, drawPS=False, drawCross=False, mark_cross_id=None, drawScale=False, drawCrossObj=False, w=sch_w, h=sch_h, dpi=sch_dpi, sizeTS=25, annotateTS=True):
	fig, ax = plt.subplots(figsize=(w,h))
	pss=[]
	for apl in apl_ids:
		#DRAW LINES
		if apl.sup_substation_id:
			if apl.sup_substation_id not in pss:
				pss.append(apl.sup_substation_id)
		for tap in apl.tap_ids:
			tap_points=googlemaps.convert.decode_polyline(tap.tap_encode_path)
			ax.plot([d['lng'] for d in tap_points],[d['lat'] for d in tap_points],'b-')
		if drawTS==True:
			for ts in apl.transformer_ids:
				lat,lng,plat,plng=ts.latitude,ts.longitude,ts.pillar_id.latitude,ts.pillar_id.longitude
				dlat=lat-plat
				dlng=lng-plng
				lngmin,lngmax=ax.get_xlim()
				latmin,latmax=ax.get_ylim()
				latperpx,lngperpx=(h*dpi)/(latmax-latmin),(w*dpi)/(lngmax-lngmin)
				llatpx,llngpx=dlat*latperpx,dlng*lngperpx
				alat=dlat*2*sizeTS/abs(llatpx)
				alng=dlng*2*sizeTS/abs(llngpx)
				lat+=alat
				lng+=alng
				ax.plot([lng,plng],[lat,plat],'b-')
				ax.plot([lng],[lat],'s',ms=sizeTS, markerfacecolor="white",markeredgecolor='blue')
				ax.plot([lng],[lat],'^',ms=sizeTS, markerfacecolor="white",markeredgecolor='blue')
				if annotateTS==True:
					ax.annotate(ts.name,(lng+alng,lat+alat),va="center",ha="center",fontproperties=fm.FontProperties(fname='/usr/share/fonts/truetype/verdana/verdana.ttf'))
		if drawBP==True:
			base_points=[]
			for pil in apl.pillar_id.search([('apl_id','=',apl.id),('pillar_type_id.base','=',True)]):
				base_point={
					'lat':pil.latitude,
					'lng':pil.longitude,
					'n':pil.num_by_vl,
					'd':pil.azimut_from_prev
				}
				base_points.append(base_point)
			bpx=[d['lng'] for d in base_points]
			bpy=[d['lat'] for d in base_points]
			bpn=[d['n'] for d in base_points]
			ax.plot(bpx,bpy,'wo', markersize=ms)
			for i,txt in enumerate(bpn):
				ax.annotate(txt,(bpx[i],bpy[i]),va="center",ha="center")
		
		if drawCross==True:
			for cross in apl.crossing_ids:
				cpoint=[]
				cpoint.append({
					'lat':cross.from_pillar_id.latitude,
					'lng':cross.from_pillar_id.longitude
				})
				if cross.to_pillar_id:
					cpoint.append({
						'lat':cross.to_pillar_id.latitude,
						'lng':cross.to_pillar_id.longitude	
						})
				ax.plot([d['lng'] for d in cpoint],[d['lat'] for d in cpoint],'r-',linewidth=3.0)
				if cross==mark_cross_id:
					ax.plot([d['lng'] for d in cpoint],[d['lat'] for d in cpoint],'g+',mew=5,ms=12)
	if drawPS==True:
		for ss in pss:
			alng,alat=0,0
			lat,lng=ss.latitude,ss.longitude
			olat,olng=lat,lng
			for pil in ss.conn_pillar_ids:
				if pil.apl_id in apl_ids:
					plat,plng=pil.latitude,pil.longitude
					dlat=plat-lat
					dlng=plng-lng
					lngmin,lngmax=ax.get_xlim()
					latmin,latmax=ax.get_ylim()
					latperpx,lngperpx=(h*dpi)/(latmax-latmin),(w*dpi)/(lngmax-lngmin)
					llatpx,llngpx=dlat*latperpx,dlng*lngperpx
					alat=dlat*50/abs(llatpx)
					alng=dlng*50/abs(llngpx)
					ax.plot([olng,plng],[olat,plat],'b-')
					lat+=alat
					lng+=alng
			ax.plot([lng],[lat],'8',ms=25, markerfacecolor="white",markeredgecolor='blue')
			ax.annotate(ss.name,(lng+alng,lat+alat),va="center",ha="center",fontproperties=fm.FontProperties(fname='/usr/share/fonts/truetype/verdana/verdana.ttf'))
		
	
	if drawScale==True:
		lngmin,lngmax=ax.get_xlim()
		latmin,latmax=ax.get_ylim()
		R=6378.1
		brng=math.radians(90)
		d=0.1
		lat1=math.radians(latmin)
		lng1=math.radians(lngmax)
		lat2 =math.asin(math.sin(lat1)*math.cos(d/R)+math.cos(lat1)*math.sin(d/R)*math.cos(brng))
		lng2 =lng1+math.atan2(math.sin(brng)*math.sin(d/R)*math.cos(lat1),math.cos(d/R)-math.sin(lat1)*math.sin(lat2))
		lat3 =math.asin(math.sin(lat2)*math.cos(d/R)+math.cos(lat2)*math.sin(d/R)*math.cos(brng))
		lng3 =lng2+math.atan2(math.sin(brng)*math.sin(d/R)*math.cos(lat2),math.cos(d/R)-math.sin(lat2)*math.sin(lat3))
		lat4 =math.asin(math.sin(lat3)*math.cos(d/R)+math.cos(lat3)*math.sin(d/R)*math.cos(brng))
		lng4 =lng3+math.atan2(math.sin(brng)*math.sin(d/R)*math.cos(lat3),math.cos(d/R)-math.sin(lat3)*math.sin(lat4))
		lat4=math.degrees(lat4)
		lng4=math.degrees(lng4)
		lat3=math.degrees(lat3)
		lng3=math.degrees(lng3)
		lat2=math.degrees(lat2)
		lng2=math.degrees(lng2)
		lat1=math.degrees(lat1)
		lng1=math.degrees(lng1)
		ax.plot([lng1,lng2],[lat1,lat2],'k-', linewidth=2.0)
		ax.plot([lng3,lng4],[lat3,lat4],'k-', linewidth=2.0)
	ax.spines['top'].set_visible(False)
	ax.spines['right'].set_visible(False)
	ax.axis('off')
	ax.axis('equal')
	background_stream = StringIO.StringIO()
	fig.savefig(background_stream, format='png', dpi=dpi, transparent=True)
	res=background_stream.getvalue().encode('base64')
	return res