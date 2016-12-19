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
		
	@http.route('/maps', auth='public')
	def maps(self, *arg, **post):
		request.uid = request.session.uid
		cr,uid,context=request.cr,request.uid,request.context
		lr_data=self.get_layers_list()
		values = {
			'lr_data':lr_data
			#json.dumps
		}
		return request.render("uis_ag_google_maps.uis_cartography_main", values)