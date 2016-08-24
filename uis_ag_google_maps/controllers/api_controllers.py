# -*- coding: utf-8 -*-
from openerp import http
from openerp.http import request
from openerp.tools import html_escape as escape
import datetime
import json
import logging
import urllib
import time

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

class maps_data_json(http.Controller):
	def _get_clean_tap_ids(self,data):
		clean_ids=[]
		for s in data['tap_ids']:
			try:
				i=int(s)
				clean_ids.append(i)
			except ValueError:
				pass
		return clean_ids

	def _get_clean_apl_ids(self,data):
		clean_ids=[]
		for s in data['apl_ids']:
			try:
				i=int(s)
				clean_ids.append(i)
			except ValueError:
				pass
		return clean_ids

	def _get_apl_lines_data(self,clean_ids):
		cr, uid,context=request.cr,request.uid,request.context
		apl_obj=request.registry['uis.papl.apl']
		apl_data={
			"counter":0,
			"apls":[]
		}
		lines_data={
			"counter":0,
			"lines":[]
		}
		domain=[("id","in",clean_ids)]
		apl_ids=apl_obj.search(cr, uid, domain, context=context)
		for apl_id in apl_obj.browse(cr, uid, apl_ids, context=context):
			pil_count=0;
			apl_data["counter"]=apl_data["counter"]+1
			apl_data["apls"].append({
					'id':apl_id.id,
					'name':apl_id.name,
					'type':apl_id.apl_type,
					'feeder_num':apl_id.feeder_num,
					'voltage':apl_id.voltage,
					'inv_num':apl_id.inv_num,
					'line_len':apl_id.line_len_calc,
					'status':apl_id.status,
					'rec_layer':apl_id.rec_layer_id.name,
					'pillar_count':"N/A", #Change to counter
					'tap_count':"N/A" #Change to counter
					})
			#apl_id.pillar_id.sorted(key=lambda r: r.num_by_vl)
			for pillar_id in apl_id.pillar_id:
				if pillar_id.parent_id:
					parentid=pillar_id.parent_id
					lines_data["counter"]=lines_data["counter"]+1
					lines_data["lines"].append({
						'line_id':str(parentid.id)+"_"+str(pillar_id.id),
						'lat1':pillar_id.latitude,
						'long1':pillar_id.longitude,
						'lat2':parentid.latitude,
						'long2':parentid.longitude,
						'tap_id':pillar_id.tap_id.id,
						'apl_id':pillar_id.apl_id.id,
						'apl_name':pillar_id.apl_id.name,
						'tap_name':pillar_id.tap_id.name
					})
			for trans in apl_id.transformer_ids:
				if trans.pillar_id:
					pillarid=trans.pillar_id
					lines_data["counter"]=lines_data["counter"]+1
					lines_data["lines"].append({
						'line_id':str(pillarid.id)+"_T"+str(trans.id),
						'lat1':trans.latitude,
						'long1':trans.longitude,
						'lat2':pillarid.latitude,
						'long2':pillarid.longitude,
						'tap_id':pillarid.tap_id.id,
						'apl_id':pillarid.apl_id.id,
						'apl_name':pillarid.apl_id.name,
						'tap_name':pillarid.tap_id.name
					})
		#'Return for APL %r Photo %r near Pillar %r' % (pil.apl_id.id, ph.id, pil.name)
		return apl_data,lines_data

	def _get_pillar_data(self,clean_ids):
		cr, uid,context=request.cr,request.uid,request.context
		#code _get_pillar_data
		apl_obj=request.registry['uis.papl.apl']
		pillar_data={
			"counter":0,
			"latitude":0,
			"longitude":0,
			"pillars":[]
		}
		minlat=120
		maxlat=0
		minlong=120
		maxlong=0
		domain=[("id","in",clean_ids)]
		apl_ids=apl_obj.search(cr, uid, domain, context=context)
		for apl_id in apl_obj.browse(cr, uid, apl_ids, context=context):
			#apl_id.pillar_id.sorted(key=lambda r: r.num_by_vl)
			for pillar_id in apl_id.pillar_id:
				#print "Do pillar"+pillar_id.name
				pillar_data["counter"]=pillar_data["counter"]+1
				if pillar_id.latitude>maxlat:
					maxlat=pillar_id.latitude
				if pillar_id.latitude<minlat:
					minlat=pillar_id.latitude
				if pillar_id.longitude>maxlong:
					maxlong=pillar_id.longitude
				if pillar_id.longitude<minlong:
					minlong=pillar_id.longitude
				rotation=0
				if pillar_id.pillar_type_id.auto_rotate:
					rotation=pillar_id.azimut_from_prev+pillar_id.pillar_type_id.auto_rotate_delta
				if pillar_id.pillar_type_id.auto_rotate_formula:
					exec pillar_id.pillar_type_id.auto_rotate_formula
				if pillar_id.pillar_stay_rotation:
					rotation=pillar_id.pillar_stay_rotation
				pillar_data["pillars"].append({
					'id':pillar_id.id,
					'name':pillar_id.name,
					'apl':apl_id.name,
					'apl_id':apl_id.id,
					'tap_id':pillar_id.tap_id.id,
					'elevation':pillar_id.elevation,
					'latitude': escape(str(pillar_id.latitude)),
					'longitude': escape(str(pillar_id.longitude)),
					'num_by_vl':pillar_id.num_by_vl,
					'prev_id':pillar_id.parent_id.id,
					'type_id':pillar_id.pillar_type_id.id,
					'cut_id':pillar_id.pillar_cut_id.id,
					'pillar_icon_code':pillar_id.pillar_icon_code,
					'rotation':rotation,
					'base_pillar':pillar_id.pillar_type_id.base,
					'state':'EXPLOTATION' #Add state from MRO
					#'prevlatitude': escape(str(pillar_id.prev_latitude)),
					#'prevlangitude': escape(str(pillar_id.prev_longitude))
					})
		medlat=(maxlat+minlat)/2
		medlong=(maxlong+minlong)/2
		pillar_data["latitude"]=medlat
		pillar_data["longitude"]=medlong
		pillar_data["minlat"]=minlat
		pillar_data["maxlat"]=maxlat
		pillar_data["minlong"]=minlong
		pillar_data["maxlong"]=maxlong
		#end code _pillar_data
		return pillar_data
	def _get_ps_data(self,clean_ids):
		cr, uid,context=request.cr,request.uid,request.context
		ps_data={
			"counter":0,
			"ps":[]
		}
		#!!!!!!!!!!!!!!!!!!!!!!!!!!
		return ps_data
	def _get_trans_data(self,clean_ids):
		cr, uid,context=request.cr,request.uid,request.context
		trans_data={
			"counter":0,
			"trans":[]
		}
		apl_obj=request.registry['uis.papl.apl']
		domain=[("id","in",clean_ids)]
		apl_ids=apl_obj.search(cr,uid,domain,context=context)
		for apl in apl_obj.browse(cr,uid,apl_ids, context=context):
			for trans in apl.transformer_ids:
				trans_data["counter"]=trans_data["counter"]+1
				trans_data["trans"].append({
					'id':trans.id,
					'name':trans.name,
					'state':trans.state,
					'longitude':trans.longitude,
					'latitude':trans.latitude,
					'rotation':trans.trans_stay_rotation
				})
		return trans_data
	def _get_elevation(self,lat,lng):
		el=0
		if (lat<>0) and (lng<>0):
			url="https://maps.googleapis.com/maps/api/elevation/json?locations="+str(lat)+","+str(lng)+"&key=AIzaSyClGM7fuqSCiIXgp35PiKma2-DsSry3wrI"
			response=urllib.urlopen(url)
			data=json.loads(response.read())
			if data["status"]=="OK":
				el=data["results"][0]["elevation"]
			else:
				_logger.debug('Pause for get elevation from Google Elevation API')
				time.sleep (100.0 / 1000.0)
				response = urllib.urlopen(url)
				data=json.loads(response.read())
				if data["status"]=="OK":
					el=data["results"][0]["elevation"]
		return el
	def _get_tap_elevation_data(self,clean_ids):
		cr,uid,context=request.cr,request.uid,request.context
		total_point=100
		elevation_data={
			"counter":0,
			"x_axis":[],
			"e_data":[],
			"p_data":[]
		}
		tap_obj=request.registry['uis.papl.tap']
		pillar_obj=request.registry['uis.papl.pillar']
		domain=[("id","in",[clean_ids])]
		tap_ids=tap_obj.search(cr,uid,domain,context=context)
		for tap in tap_obj.browse(cr,uid,tap_ids,context=context):
			pil_count=len(tap.pillar_ids)
			ep=[]
			tlen=0
			for pil in tap.pillar_ids.sorted(key=lambda r: r.num_by_vl):
				if pil.parent_id:
					tlen=tlen+pil.len_prev_pillar
				domain_end_pillar=[("parent_id","in",[pil.id])]
				pil_parent_ids=pillar_obj.search(cr,uid,domain_end_pillar,context=context)
				if not pil_parent_ids:
					ep=pil
			_logger.debug('End pillar of %r TAP is %r'%(tap.name,ep.name))
			#_logger.debug('Tap %r / Count of pillar is %r / Tap calc lenght is %r m'%(tap.name,pil_count,tap_len))
			tap_len=tap.line_len_calc
			dx=tlen/(total_point-1)
			cx=0
			pils=[]
			cp=ep
			np=cp.parent_id
			pil_start=0
			while cx<tlen:
				cur_max_cx=pil_start+cp.len_prev_pillar
				if cx<cur_max_cx:
					cdx=cx-pil_start
				if cx>cur_max_cx:
					cp=np
					np=cp.parent_id
					pil_start=pil_start+cp.len_prev_pillar
				cdx=cx-pil_start
				prop=cdx/(cp.len_prev_pillar-0.001)
				lat1,long1,lat2,long2=cp.latitude,cp.longitude,np.latitude,np.longitude
				clat=lat1+prop*(lat2-lat1)
				clong=long1+prop*(long2-long1)
				el=self._get_elevation(clat,clong)
				_logger.debug('Define elevation for coord len %r/%r (lat=%r;lng=%r) = %r (meters)'%(cx,tlen,clat,clong,el))
				elevation_data["counter"]=elevation_data["counter"]+1;
				elevation_data["x_axis"].append(cx);
				elevation_data["e_data"].append(el);
				cx=cx+dx
		#code for generate elevation_data
		return elevation_data
	#Define API hash functions
	@http.route('/apiv1/tap/elevation_data',type='json', auth="public", csfr=False)
	def api_v1_tap_elevation_data(self, *arg, **post):
		start=datetime.datetime.now()
		data=json.loads(json.dumps(request.jsonrequest))
		#code elevation data
		#_logger.debug(data)
		clean_ids=data['tap_ids']
		elevation_data=self._get_tap_elevation_data(clean_ids)
		values={
			'elevation_data':json.dumps(elevation_data)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate TAP elevation data in %r seconds'%elapsed.total_seconds())
		return values

	@http.route('/apiv1/apl/data/hash',type='json', auth="public", csfr=False)
	def api_v1_apl_data_hash(self, *arg, **post):
		start=datetime.datetime.now()
		#cr,uid,context=request.cr, request.uid, request.context
		data=json.loads(json.dumps(request.jsonrequest))
		clean_ids=self._get_clean_apl_ids(data)
		apl_data,lines_data=self._get_apl_lines_data(clean_ids)
		out=hash(str(apl_data)+str(lines_data))
		values ={
			'hash_apl':json.dumps(out)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate APL data HASH in %r seconds'%elapsed.total_seconds())
		return values

	@http.route('/apiv1/pillar/data/hash', type='json', auth="public", csfr=False)
	def api_v1_pillar_data_hash(self, *arg, **post):
		start=datetime.datetime.now()
		#cr,uid,context=request.cr, request.uid, request.context
		data=json.loads(json.dumps(request.jsonrequest))
		clean_ids=self._get_clean_apl_ids(data)
		pillar_data=self._get_pillar_data(clean_ids)
		out=hash(str(pillar_data))
		values ={
			'hash_pillar':json.dumps(out)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate PILLAR data HASH in %r seconds'%elapsed.total_seconds())
		return values
	@http.route('/apiv1/ps/data/hash',type='json',auth="public",csfr=False)
	def api_v1_ps_data_hash(self, *arg, **post):
		start=datetime.datetime.now()
		data=json.loads(json.dumps(request.jsonrequest))
		clean_ids=self._get_clean_apl_ids(data)
		ps_data=self._get_ps_data(clean_ids)
		out=hash(str(ps_data))
		values ={
			'hash_ps':json.dumps(out)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate PS data HASH in %r seconds'%elapsed.total_seconds())
		return values
	@http.route('/apiv1/trans/data/hash',type='json', auth="public", csfr=False)
	def api_v1_trans_data_hash(self, *arg, **post):
		start=datetime.datetime.now()
		data=json.loads(json.dumps(request.jsonrequest))
		clean_ids=self._get_clean_apl_ids(data)
		trans_data=self._get_trans_data(clean_ids)
		out=hash(str(trans_data))
		values ={
			'hash_trans':json.dumps(out)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate TRANS data HASH in %r seconds'%elapsed.total_seconds())
		return values
		#Define Settings Functions
	@http.route('/apiv1/settings/global',type="json", auth="public",csfr=False)
	def api_v1_settings_global(self, *arg, **post):
		start=datetime.datetime.now()
		data=json.loads(json.dumps(request.jsonrequest))
		_logger.debug(data)
		cr,uid,context=request.cr,request.uid,request.context
		gs_obj=request.registry['uis.global.settings']
		gs_data={
			"counter":0,
			"gss":[]
		}
		vnames=[];
		for vname in data['variables']:
			try:
				vname=str(vname)
				vnames.append(vname)
			except ValueError:
				pass
		domain=[("enabled","=",True),("var","in",vnames)]
		gs_ids=gs_obj.search(cr,uid,domain,context=context)
		for gs in gs_obj.browse(cr,uid,gs_ids,context=context):
			gs_data["counter"]=gs_data["counter"]+1
			gs_data["gss"].append({
				'varname':gs.var,
				'value':gs.value
			})
		values={
			'gs_data':json.dumps(gs_data)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate global settings in %r seconds'%elapsed.total_seconds())
		return values
	@http.route('/apiv1/settings/layers',type="json",auth="public",csfr=False)
	def api_v1_settings_layers(self, *arg, **post):
		start=datetime.datetime.now()
		data=json.loads(json.dumps(request.jsonrequest))
		cr,uid,context=request.cr,request.uid,request.context
		lr_obj=request.registry['uis.settings.layers']
		domain=[("shown","=",True)]
		lr_ids=lr_obj.search(cr,uid,domain,context=context)
		lr_data={
			"counter":0,
			"lrs":[]
		}
		for lr in lr_obj.browse(cr,uid,lr_ids,context=context).sorted(key=lambda r:r.order):
			lr_data["counter"]=lr_data["counter"]+1
			lr_data["lrs"].append({
				'name':lr.name,
				'title':lr.title,
				'alt':lr.alt,
				'opacity':lr.opacity,
				'order':lr.order,
				'url_icon':'/web/image?model=uis.settings.layers&id='+str(lr.id)+'&field=icon',
			})
		values={
			'lr_data':json.dumps(lr_data)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate layers list in %r seconds'%elapsed.total_seconds())
		return values
	@http.route('/apiv1/settings/pillar_type_list',type="json",auth="public", csfr=False)
	def api_v1_pillar_type_list(self, *arg, **post):
		start=datetime.datetime.now()
		data=json.loads(json.dumps(request.jsonrequest))
		cr,uid,context=request.cr,request.uid,request.context
		pt_obj=request.registry['uis.papl.pillar.type']
		domain=[]
		pt_ids=pt_obj.search(cr,uid,domain,context=context)
		pt_data={
			"counter":0,
			"pts":[]
		}
		for pt in pt_obj.browse(cr,uid,pt_ids,context=context):
			pt_data["counter"]=pt_data["counter"]+1
			pt_data["pts"].append({
				'id':pt.id,
				'name':pt.name
				})
		values={
			'pt_data':json.dumps(pt_data)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate Pillar type list in %r seconds'%elapsed.total_seconds())
		return values
	@http.route('/apiv1/settings/pillar_cut_list',type="json",auth="public", csfr=False)
	def api_v1_pillar_cut_list(self, *arg, **post):
		start=datetime.datetime.now()
		data=json.loads(json.dumps(request.jsonrequest))
		cr,uid,context=request.cr,request.uid,request.context
		pc_obj=request.registry['uis.papl.pillar.cut']
		domain=[]
		pc_ids=pc_obj.search(cr,uid,domain,context=context)
		pc_data={
			"counter":0,
			"pcs":[]
		}
		for pc in pc_obj.browse(cr,uid,pc_ids,context=context):
			pc_data["counter"]=pc_data["counter"]+1
			pc_data["pcs"].append({
				'id':pc.id,
				'name':pc.name
				})
		values={
			'pc_data':json.dumps(pc_data)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate Pillar cut list in %r seconds'%elapsed.total_seconds())
		return values
	@http.route('/apiv1/settings/pillar_icon_list',type="json", auth="public", csfr=False)
	def api_v1_pillar_icon_list(self,*arg,**post):
		start=datetime.datetime.now()
		data=json.loads(json.dumps(request.jsonrequest))
		cr,uid,context=request.cr,request.uid,request.context
		pi_obj=request.registry['uis.icon.settings.pillar']
		domain=[]
		pi_ids=pi_obj.search(cr,uid,domain,context=context)
		pi_data={
			"counter":0,
			"pis":[]
		}
		for pi in pi_obj.browse(cr,uid,pi_ids,context=context):
			pi.pillar_icon_code
			pi_data["counter"]=pi_data["counter"]+1
			pi_data["pis"].append({
				'code':pi.pillar_icon_code,
				'path':pi.pillar_icon_path,
				'fill_path':pi.fill_path,
				'fill_color':pi.fill_color,
				'stroke_width':pi.stroke_width,
				'stroke_color':pi.stroke_color,
				'anchor':pi.anchor,
				'azoom':pi.add_zoom
				})
		values={
			'pi_data':json.dumps(pi_data)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate Pillar icon list in %r seconds'%elapsed.total_seconds())
		return values
			
	#Define List functions
	@http.route('/apiv1/apl/list',type="json", auth="public", csfr=False)
	def api_v1_apl_list(self,*arg, **post):
		start=datetime.datetime.now()
		cr, uid, context=request.cr, request.uid, request.context
		apl_obj=request.registry['uis.papl.apl']
		data=json.loads(json.dumps(request.jsonrequest))
		apl_ids=apl_obj.search(cr,uid,[],context=context)
		clean_ids=[]
		for apl in apl_obj.browse(cr,uid,apl_ids, context=context):
			clean_ids.append(apl.id)
		apl_data,lines_data=self._get_apl_lines_data(clean_ids)
		values ={
			'apl_list':json.dumps(apl_data)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate APL list in %r seconds'%elapsed.total_seconds())
		return values

	#Define Data functions
	@http.route('/apiv1/apl/data',type="json", auth="public", csfr=False)
	def api_v1_apl_data(self, *arg, **post):
		start=datetime.datetime.now()
		data=json.loads(json.dumps(request.jsonrequest))
		clean_ids=self._get_clean_apl_ids(data)
		apl_data,lines_data=self._get_apl_lines_data(clean_ids)
		values ={
			'apl_data':json.dumps(apl_data),
			'lines_data':json.dumps(lines_data)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate APL data in %r seconds'%elapsed.total_seconds())
		return values

	@http.route('/apiv1/pillar/data', type="json", auth="public", csfr=False)
	def api_v1_pillar_data(self, *arg, **post):
		start=datetime.datetime.now()
		#cr, uid, context=request.cr, request.uid, request.context
		data=json.loads(json.dumps(request.jsonrequest))
		clean_ids=self._get_clean_apl_ids(data)
		pillar_data=self._get_pillar_data(clean_ids)
		values ={
			'pillar_data':json.dumps(pillar_data)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate PILLAR data in %r seconds'%elapsed.total_seconds())
		return values
	@http.route('/apiv1/ps/data',type="json",auth="publc",csfr=False)
	def api_v1_ps_data(self, *arg, **post):
		start=datetime.datetime.now()
		data=json.loads(kson.dumps(request.jsonrequest))
		clean_ids=self._get_clean_apl_ids(data)
		ps_data=self._get_ps_data(clean_ids)
		values={
			'ps_data':json.dumps(ps_data)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate PS date in %r seconds'%elapsed.total_seconds())
		return values
	@http.route('/apiv1/trans/data', type="json", auth="public", csfr=False)
	def api_v1_trans_data(self, *arg, **post):
		start=datetime.datetime.now()
		#cr, uid, context=request.cr, request.uid, request.context
		#trans_obj =request.registry['uis.papl.transmormer']
		data=json.loads(json.dumps(request.jsonrequest))
		clean_ids=self._get_clean_apl_ids(data)
		trans_data=self._get_trans_data(clean_ids)
		values ={
			'trans_data':json.dumps(trans_data)
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate TRANS data in %r seconds'%elapsed.total_seconds())
		return values

	#Define Newcoord data
	@http.route('/apiv1/pillar/change_pillar',type="json", auth="public", csfr=False)
	def api_v1_pillar_change(self,*arg, **post):
		_logger.info('Post pillar changes (PILLAR)')
		cr, uid, context=request.cr, request.uid, request.context
		pillar_obj = request.registry['uis.papl.pillar']
		pillar_type_obj=request.registry['uis.papl.pillar.type']
		pillar_cut_obj=request.registry['uis.papl.pillar.cut']
		data=json.loads(json.dumps(request.jsonrequest))
		pid=data['pillar_id']
		domainpil=[("id","in",[pid])]
		pillar_ids=pillar_obj.search(cr,uid,domainpil,context=context)
		for pil in pillar_obj.browse(cr, uid, pillar_ids, context=context):
			_logger.debug(data)
			if 'pillar_type_id' in data:
				domain_pt=[("id","in",[data['pillar_type_id']])]
				pt_ids=pillar_type_obj.search(cr,uid,domain_pt,context=context)
				pil.pillar_type_id=pillar_type_obj.browse(cr,uid,pt_ids,context=context)[0]
			if 'pillar_cut_id' in data:
				domain_pc=[("id","in",[data['pillar_cut_id']])]
				pc_ids=pillar_type_obj.search(cr,uid,domain_pc,context=context)
				pil.pillar_cut_id=pillar_cut_obj.browse(cr,uid,pc_ids,context=context)[0]
		
		values ={
			'result':1
		}
		return values	
	@http.route('/apiv1/pillar/cycle_type',type="json", auth="public", csfr=False)
	def api_v1_pillar_cycle_type(self,*arg,**ppost):
		_logger.info('POST pillar cycle change type (PILLAR)')
		cr, uid, context=request.cr, request.uid, request.context
		pillar_obj = request.registry['uis.papl.pillar']
		pillar_type_obj=request.registry['uis.papl.pillar.type']
		data=json.loads(json.dumps(request.jsonrequest))
		pid=data['pillar_id']
		domainpil=[("id","in",[pid])]
		pillar_ids=pillar_obj.search(cr,uid,domainpil,context=context)
		for pil in pillar_obj.browse(cr, uid, pillar_ids, context=context):
			ptid=pil.pillar_type_id
			domainpt=[]
			pt_ids=pillar_type_obj.search(cr,uid,domainpt,context=context)
			pts=pillar_type_obj.browse(cr,uid,pt_ids,context=context)
			ti=len(pts)
			cp=0
			npt=[]
			fixnextpos=False
			for pt in pts:
				cp=cp+1
				if cp==1:
					npt=pt
				if fixnextpos:
					npt=pt
					fixnextpos=False
				if pt==ptid:
					fixnextpos=True
			pil.pillar_type_id=npt
		values ={
			'result':1
		}
		return values
	
	@http.route('/apiv1/pillar/ch_pillar_to_base', type="json",auth="public",csfr=False)
	def api_v1_pillar_ch_pillar_to_base(self, *arg, **post):
		start=datetime.datetime.now()
		cr, uid, context=request.cr, request.uid, request.context
		pillar_obj = request.registry['uis.papl.pillar']
		pillar_type_obj=request.registry['uis.papl.pillar.type']
		pillar_cut_obj=request.registry['uis.papl.pillar.cut']
		data=json.loads(json.dumps(request.jsonrequest))
		pid=data['pillar_id']
		cnt=data['pillar_cnt']
		pt,pc=False,False
		if 'pillar_type_id' in data:
			domain_pt=[("id","in",[data['pillar_type_id']])]
			pt_ids=pillar_type_obj.search(cr,uid,domain_pt,context=context)
			pt=pillar_type_obj.browse(cr,uid,pt_ids,context=context)[0]
		if 'pillar_cut_id' in data:
			domain_pc=[("id","in",[data['pillar_cut_id']])]
			pc_ids=pillar_type_obj.search(cr,uid,domain_pc,context=context)
			pc=pillar_cut_obj.browse(cr,uid,pc_ids,context=context)[0]
		domain=[("id","in",[pid])]
		pillar_ids=pillar_obj.search(cr, uid, domain, context=context)
		pcnt=0
		for pil in pillar_obj.browse(cr, uid, pillar_ids, context=context):
			cp=pil.parent_id
			while not(cp.pillar_type_id.base) and cp.parent_id:
				if pt:
					cp.pillar_type_id=pt
				if pc:
					cp.pillar_cut_id=pc
				cp=cp.parent_id
				pcnt=pcnt+1
		values={
			'result':1
		}
		stop=datetime.datetime.now()s
		elapsed=stop-start
		_logger.info('Change pillar types (%r) and cut (&r) for %r pillars in %r seconds'%(pt,pc,pcnt,elapsed.total_seconds()))
		return values
	@http.route('/apiv1/pillar/add_pillar_to_prev',type="json", auth="public", csfr=False)
	def api_v1_pillar_add_pillar_to_prev(self, *arg, **post):
		start=datetime.datetime.now()
		cr, uid, context=request.cr, request.uid, request.context
		pillar_obj = request.registry['uis.papl.pillar']
		pillar_type_obj=request.registry['uis.papl.pillar.type']
		pillar_cut_obj=request.registry['uis.papl.pillar.cut']
		data=json.loads(json.dumps(request.jsonrequest))
		pid=data['pillar_id']
		cnt=data['pillar_cnt']
		pt,pc=False,False
		if 'pillar_type_id' in data:
			domain_pt=[("id","in",[data['pillar_type_id']])]
			pt_ids=pillar_type_obj.search(cr,uid,domain_pt,context=context)
			pt=pillar_type_obj.browse(cr,uid,pt_ids,context=context)[0]
		if 'pillar_cut_id' in data:
			domain_pc=[("id","in",[data['pillar_cut_id']])]
			pc_ids=pillar_type_obj.search(cr,uid,domain_pc,context=context)
			pc=pillar_cut_obj.browse(cr,uid,pc_ids,context=context)[0]
		domain=[("id","in",[pid])]
		pillar_ids=pillar_obj.search(cr, uid, domain, context=context)
		for pil in pillar_obj.browse(cr, uid, pillar_ids, context=context):
			pp=pil.parent_id;
			pp_old_num_by_vl=pp.num_by_vl
			dlat=(pil.latitude-pp.latitude)/(1+int(cnt))
			dlng=(pil.longitude-pp.longitude)/(1+int(cnt))
			i=1
			cp=pp;
			while i<=int(cnt):
				np=cp.create_new_child(num_by_vl=cp.num_by_vl+1,parent_id=cp,latitude=dlat+cp.latitude,longitude=dlng+cp.longitude,tap_id=pil.tap_id,pillar_type_id=pt, pillar_cut_id=pc)
				cp=np
				i=i+1
			if pp.tap_id != cp.tap_id:
				pp.num_by_vl=pp_old_num_by_vl
			pil.parent_id=cp
			pil.num_by_vl=cp.num_by_vl+1
			pil.tap_id.sys_pil_fix_lpp()
			pil.tap_id.act_normalize_num()
		values={
			'result':1
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate new pillars in %r seconds'%elapsed.total_seconds())
		return values
	@http.route('/apiv1/pillar/new_child_pillar', type="json", auth="public", csfr=False)
	def api_v1_pillar_new_child_pillar(self, *arg, **post):
		start=datetime.datetime.now()
		cr, uid, context=request.cr, request.uid, request.context
		pillar_obj = request.registry['uis.papl.pillar']
		data=json.loads(json.dumps(request.jsonrequest))
		pid=data['pillar_id']
		domain=[("id","in",[pid])]
		pillar_ids=pillar_obj.search(cr, uid, domain, context=context)
		for pil in pillar_obj.browse(cr, uid, pillar_ids, context=context):
			nt=pil.tap_id.create_new_tap()
			pil.create_new_child(num_by_vl=1,tap_id=nt)
		values ={
			'result':1
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate new pillar in %r seconds'%elapsed.total_seconds())
		return values
	@http.route('/apiv1/pillar/newcoorddrop', type="json", auth="public", csfr=False)
	def api_v1_pillar_new_coordinate_drop(self, *arg, **post):
		start=datetime.datetime.now()
		cr, uid, context=request.cr, request.uid, request.context
		pillar_obj = request.registry['uis.papl.pillar']
		data=json.loads(json.dumps(request.jsonrequest))
		pid=data['pillar_id']
		new_latitude=data['new_latitude']
		new_longitude=data['new_longitude']
		domain=[("id","in",[pid])]
		pillar_ids=pillar_obj.search(cr, uid, domain, context=context)
		for pil in pillar_obj.browse(cr, uid, pillar_ids, context=context):
			pil.latitude=new_latitude
			pil.longitude=new_longitude
			if not(pil.pillar_type_id.base):
				pil.tap_id.sys_pil_fix_lpp()
			if (pil.pillar_type_id.base):
				pil.tap_id.do_normal_magni(cr,uid,[pil.tap_id.id],context=context)
		values ={
			'result':1
		}
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate newcoord (data) drop in %r seconds'%elapsed.total_seconds())
		return values
	
	@http.route('/apiv1/trans/newcoorddrop', type="json", auth="public", csfr=False)
	def api_v1_trans_new_coordinate_drop(self, *arg, **post):
		_logger.info('POST Newcoord json data for transformator (TRANS)')
		cr, uid, context=request.cr, request.uid, request.context
		trans_obj = request.registry['uis.papl.transformer']
		data=json.loads(json.dumps(request.jsonrequest))
		pid=data['trans_id']
		new_latitude=data['new_latitude']
		new_longitude=data['new_longitude']
		domain=[("id","in",[pid])]
		trans_ids=trans_obj.search(cr, uid, domain, context=context)
		for trans in trans_obj.browse(cr, uid, trans_ids, context=context):
			trans.latitude=new_latitude
			trans.longitude=new_longitude
		values ={
			'result':1
		}
		return values
