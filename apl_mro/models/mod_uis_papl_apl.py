# -*- coding: utf-8 -*-
#from __future__ import unicode_literals

from openerp.tools.translate import _
import math, urllib, json, time, random
from openerp import models, fields, api, tools
import logging

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

class uis_apl_mro_mod_uis_papl_apl_defects(models.Model):
	_inherit = 'uis.papl.apl'
	_name = 'uis.papl.apl'
	
	all_defect_ids=fields.One2many(string="All defects", comodel_name="uis.papl.mro.defect", inverse_name="apl_id")
	all_defect_count=fields.Integer(string="All defect count", compute='_get_defect_count')
	mro_count=fields.Integer(string="All maintenance count", compute='_get_mro_count')
	defect_heatmap_data_json=fields.Text(string='Heatmap defect data', compute='_get_defect_heatmap_data')
	defect_state_category_data_json=fields.Text(string='Data about defects', compute='_get_defect_state_category_data')
	mro_ids=fields.One2many(string="All mro", comodel_name="uis.papl.mro.order", inverse_name="apl_id")
	mro_timeline_data_json=fields.Text(string="MRO Timeline", compute='_get_mro_timeline_data')
	
	def _get_mro_timeline_data(self):
		for apl in self:
			tldata=[]
			for mro in apl.mro_ids:
				cur_id=mro.id
				perc_done=random.randint(0,98)
				mro_name=unicode(mro.name)#s = unicode(your_object).encode('utf8')
				content=unicode('<div><div>%r</div><div class="progress-bar" role="progressbar" aria-valuenow="%r" aria-valuemin="0" aria-valuemax="100" style="width: %r%%;">%r</div></div>'%(mro_name,perc_done,perc_done,perc_done))
				tldata.append({
					'id':cur_id,
					'content':content,
					'start': mro.start_planned_date,
					'end': mro.end_planned_date
				})
			apl.mro_timeline_data_json=json.dumps(tldata)
			_logger.debug(tldata)
				#div><div>Устранение дефектов</div><div class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 60%;">60%</div></div>
	def _get_defect_state_category_data(self):
		for apl in self:
			dsc_data=[]
			for dfct in apl.all_defect_ids:
				_logger.debug(dfct)
				vl=1
				state, category=dfct.state, dfct.category#.value
				find_position=next((d for d in dsc_data if ((d['category']==category) and (d['state']==state))),None)
				if find_position:
					vl+=find_position['cnt']
					dsc_data[:]=[d for d in dsc_data if not((d['category']==category) and (d['state']==state))]
				dsc_data.append({'category':category,'state':state,'cnt':vl})
			apl.defect_state_category_data_json=json.dumps(dsc_data)
			
	def _get_defect_heatmap_data(self):
		for apl in self:
			defect_heat_data=[]
			#for pil in apl.pillar_id:
			#	rlat,rlng=round(pil.latitude,5),round(pil.longitude,5)
			#	defect_heat_data.append({'lat':rlat,'lng':rlng,'cnt':1})
			for dfct in apl.all_defect_ids:
				for pil in dfct.pillar_ids:
					rlat,rlng=round(pil.latitude,5),round(pil.longitude,5)
					vl=float(dfct.category)*10
					#_logger.debug(vl)
					fv=next((d for d in defect_heat_data if ((d['lat']==rlat) and (d['lng']==rlng))), None)
					if fv:
						vl+=fv['cnt']
					#	_logger.debug(vl)
						defect_heat_data[:]=[d for d in defect_heat_data if not((d['lat']==rlat) and (d['lng']==rlng))]
					defect_heat_data.append({'lat':rlat,'lng':rlng,'cnt':vl})
						
				for tr in dfct.transformer_ids:
					rlat,rlng=round(tr.latitude,5),round(tr.longitude,5)
					vl=float(dfct.category)*10
					#_logger.debug(vl)
					fv=next((d for d in defect_heat_data if ((d['lat']==rlat) and (d['lng']==rlng))), None)
					if fv:
						vl+=fv['cnt']
						defect_heat_data[:]=[d for d in defect_heat_data if not((d['lat']==rlat) and (d['lng']==rlng))]
					defect_heat_data.append({'lat':rlat,'lng':rlng,'cnt':vl})
				for tap in dfct.tap_ids:
					for pil in tap.pillar_ids:
						rlat,rlng=round(pil.latitude,5),round(pil.longitude,5)
					vl=float(dfct.category)*10
					fv=next((d for d in defect_heat_data if ((d['lat']==rlat) and (d['lng']==rlng))), None)
					if fv:
						vl+=fv['cnt']
						defect_heat_data[:]=[d for d in defect_heat_data if not((d['lat']==rlat) and (d['lng']==rlng))]
					defect_heat_data.append({'lat':rlat,'lng':rlng,'cnt':vl})
			apl.defect_heatmap_data_json=json.dumps(defect_heat_data)
	def _get_mro_count(self):
		for apl in self:
			apl.mro_count=len(apl.mro_ids)
			
	def _get_defect_count(self):
		for apl in self:
			apl.all_defect_count=len(apl.all_defect_ids)

	@api.multi
	def action_view_defect(self):
		ids=[]
		for apl in self:
			ids.append(apl.id)
		return {
			'domain': "[('apl_id','in',[" + ','.join(map(str, ids)) + "])]",
			'name': _('All Defects'),
			'view_type': 'form',
			'view_mode': 'tree,form',
			'res_model': 'uis.papl.mro.defect',
			'type': 'ir.actions.act_window',
			'target': 'current',
		}

	@api.multi
	def action_view_maintenance(self):
		ids=[]
		for apl in self:
			ids.append(apl.id)
		return {
			'domain': "[('apl_id','in',[" + ','.join(map(str, ids)) + "])]",
			'name': _('Maintenance Orders'),
			'view_type': 'form',
			'view_mode': 'tree,form',
			'res_model': 'uis.papl.mro.order',
			'type': 'ir.actions.act_window',
			'target': 'current',
		}
	
'''class uis_mro_mod_uis_papl_apl(osv.Model):
    _name = 'uis.papl.apl'
    _inherit = 'uis.papl.apl'

    def _apl_mro_count(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, 0)
        maintenance = self.pool['uis.papl.mro.order']
        for apl in self.browse(cr, uid, ids, context=context):
            res[apl.id] = maintenance.search_count(cr,uid, [('apl_id', '=', apl.id)], context=context)
        return res

    _columns = {
        'mro_count': fields.function(_apl_mro_count, string='# Maintenance', type='integer'),
    }

    '''