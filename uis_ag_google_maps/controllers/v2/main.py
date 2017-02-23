# -*- coding: utf-8 -*-

from openerp import http
from openerp.http import request
from openerp.tools import html_escape as escape
import logging
import json
import openerp

_ulog=openerp.addons.passportvl.models.uis_papl_logger.ulog

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

class cartography_portal(http.Controller):
	
	def get_layers_list(self):
		tlr=_ulog(code='MP_GEN_LRSTNGS',lib=__name__,desc='Generate layers list')
		cr,uid,context=request.cr,request.uid,request.context
		lr_obj=request.registry['uis.settings.layers']
		domain=[("shown","=",True)]
		lr_ids=lr_obj.search(cr,uid,domain,context=context)
		lr_data={
			"counter":0,
			"lrs":[]
		}
		for lr in lr_obj.browse(cr,uid,lr_ids,context=context).sorted(key=lambda r:r.order):
			tlr.add_comment('[%r] Layer %r (%r)'%(lr_data["counter"]+1, lr.name,lr.title))
			lr_data["counter"]=lr_data["counter"]+1
			lr_data["lrs"].append({
				'name':lr.name,
				'title':lr.title,
				'alt':lr.alt,
				'opacity':lr.opacity,
				'order':lr.order,
				'url_icon':'/web/image?model=uis.settings.layers&id='+str(lr.id)+'&field=icon',
			})
		tlr.fix_end()
		return lr_data
	def get_ps_list(self,mark_ids=None):
		tlr=_ulog(code="MP_GEN_PSLST",lib=__name__,desc='Generate powersubstation list')
		cr, uid,context=request.cr,request.uid,request.context
		ps_data={
			"counter":0,
			"counter_filtered":0,
			"pss":[]
		}
		ps_obj=request.registry['uis.papl.substation']
		domain=[]
		ps_ids=ps_obj.search(cr,uid,domain,context=context)
		for ps in ps_obj.browse(cr,uid,ps_ids,context=context).sorted(key=lambda r:r.name):
			tlr.add_comment('[%r] power substation %r'%(ps.id,ps.name))
			ps_data["counter"]+=1
			mark=False
			show=False
			if ps.id in mark_ids:
				mark=True
				show=True
				ps_data["counter_filtered"]+=1
			ps_data["pss"].append({
					'id':ps.id,
					'name':ps.name,
					'state':ps.state,
					'rotation':0,
					'department':ps.department_id.name,
					'latitude':ps.latitude,
					'longitude':ps.longitude,
					'mark':mark,
					'show':show
				})
		tlr.fix_end()
		return ps_data
	def get_apl_list(self,filter_ids=None):
		tlr=_ulog(code="MP_GEN_PSLST",lib=__name__,desc='Generate APL list')
		cr, uid,context=request.cr,request.uid,request.context
		apl_data={
			"counter":0,
			"counter_filtered":0,
			"total_length":0,
			"apls":[]
		}
		apl_obj=request.registry['uis.papl.apl']
		domain=[]
		apl_ids=apl_obj.search(cr,uid,domain,context=context)
		for apl in apl_obj.browse(cr,uid,apl_ids,context=context).sorted(key=lambda r:r.name):
			tlr.add_comment('[%r] apl %r'%(apl.id,apl.name))
			apl_data["counter"]+=1
			mark, show= False,False
			if apl.id in filter_ids:
				mark=True
				show=True
				apl_data["counter_filtered"]+=1
			apl_data["total_length"]+=apl.line_len_calc
			apl_data["apls"].append({
				'id':apl.id,
				'name':apl.name,
				'mark':mark,
				'show':show
			})
		tlr.fix_end()
		return apl_data
	def get_trans_list(self,filter_ids=None):
		tlr=_ulog(code="MP_GEN_TRLST",lib=__name__,desc='Generate Trans List')
		cr, uid,context=request.cr,request.uid,request.context
		trans_data={
			"counter":0,
			"counter_filtered":0,
			"transs":[]
		}
		trans_obj=request.registry['uis.papl.transformer']
		domain=[]
		trans_ids=trans_obj.search(cr,uid,domain,context=context)
		for trans in trans_obj.browse(cr,uid,trans_ids, context=context).sorted(key=lambda r:r.name):
			tlr.add_comment('[%r] Transformer %r'%(trans.id,trans.name))
			trans_data["counter"]+=1
			mark,show=False,False
			if trans.id in filter_ids:
				mark=True
				show=True
				trans_data["counter_filtered"]+=1
			trans_data["transs"].append({
				'id':trans.id,
				'name':trans.name,
				'mark':mark,
				
				})
		tlr.fix_end()
		return trans_data
	def get_pillar_list(self,filter_ids=None):
		tlr=_ulog(code="MP_GEN_PLRLST", lib=__name__,desc='Generate Pillar list')
		cr,uid,context=request.cr,request.uid,request.context
		pillar_data={
			"counter":0,
			"counter_filtered":0,
			"pillars":[]
		}
		pillar_obj=request.registry['uis.papl.pillar']
		domain=[]
		pillar_ids=pillar_obj.search(cr,uid,domain, context=context)
		for pillar in pillar_obj.browse(cr,uid,pillar_ids,context=context).sorted(key=lambda r:r.apl_id):
			pillar_data["counter"]+=1
			pillar_data["pillars"].append({
				'id':pillar.id,
				'name':pillar.name
				})
		tlr.fix_end()
		return pillar_data
	#NUPD Вынести в модуль аэрофотосъемки
	def get_ph_list(self,mark_ids=None, apl_ids=None, ps_ids=None):
		tlr=_ulog(code="MP_GEN_PHTLST",lib=__name__,desc="Generate photo list")
		cr, uid,context=request.cr,request.uid,request.context
		photo_data={"counter":0,"phs":[]}
		photo_obj=request.registry['uis.ap.photo']
		domain=[]
		p_id=[]
		photo_ids=photo_obj.search(cr, uid, domain, context=context)
		for ph in photo_obj.browse(cr,uid,photo_ids,context=context).sorted(key=lambda r:r.image_date):
			photo_data["counter"]+=1
			_logger.debug(ph)
			pill_data={
				"counter":0,
				"pillars":[]
			}
			for pil in ph.near_pillar_ids:
				pill_data["counter"]=pill_data["counter"]+1
				pill_data["pillars"].append({
						'id':pil.id,
						'num_by_vl':pil.num_by_vl
						})
			photo_data["phs"].append({
				'id':ph.id,
				'lat':ph.latitude,
				'long':ph.longitude,
				'alt':ph.altitude,
				'thumbnail':'/web/image?model=uis.ap.photo&id='+str(ph.id)+'&field=thumbnail',
				'url_image':'/web/image?model=uis.ap.photo&id='+str(ph.id)+'&field=image',
				'rotation':ph.rotation,
				'pillar_data':pill_data
			})
		tlr.fix_end()
		return photo_data
	@http.route('/maps', auth='public')
	def maps(self, *arg, **post):
		request.uid = request.session.uid
		cr,uid,context=request.cr,request.uid,request.context
		ps_ids=[]
		apl_ids=[]
		trans_ids=[]
		for ps_id in post.get('ps_ids',"").split(","):
			try:
				ps_ids.append(int(ps_id))
			except ValueError:
				pass
		for apl_id in post.get('apl_ids',"").split(","):
			try:
				apl_ids.append(int(apl_id))
			except ValueError:
				pass
		
		lr_data=self.get_layers_list()
		ps_data=self.get_ps_list(ps_ids)
		apl_data=self.get_apl_list(apl_ids)
		trans_data=self.get_trans_list(trans_ids)
		ph_data=self.get_ph_list()
		pillar_data=self.get_pillar_list()
		values = {
			'lr_data':lr_data,
			'ps_data':ps_data,
			'apl_data':apl_data,
			'trans_data':trans_data,
			'pillar_data':pillar_data,
			'ph_data':ph_data
		}
		return request.render("uis_ag_google_maps.uis_cartography_main", values)