# -*- coding: utf-8 -*-
import math, urllib, json, time
from openerp import models, fields, api

class uis_papl_department(models.Model):
	_name='uis.papl.department'
	_description='Organisation structure for Department'
	name=fields.Char(string='Name')
	control_summ=fields.Float(digits=(6,2),store=False, compute='_get_control_summ')
	substation_ids=fields.One2many('uis.papl.substation','department_id', string='Substations')
	substation_count=fields.Integer(string="Substations count", store=True, compute='_get_ss_calc')
	apl_count=fields.Integer(string="APL count", store=True, compute='_get_ss_calc')
	pillar_count=fields.Integer(string="Pillar count", store=True, compute='_get_ss_calc')
	line_len=fields.Float(digits=(6,2), store=True, compute='_get_ss_calc')
	parent_department_id=fields.Many2one('uis.papl.department', string='Parent Department')
	url_maps=fields.Char(compute='_ss_get_url_maps', name='URL maps')
	address=fields.Char(string="Address")
	telephone=fields.Char(string="Phone num")
	
	@api.onchange('control_summ')
	def onchange_control_summ(self):
		for depart in self:
			depart._get_ss_calc
			
	@api.multi
	def _get_control_summ(self):
		for depart in self:
			cs=0
			for substation in depart.substation_ids:
				cs=cs+1
				for apl in substation.apl_id:
					cs=cs+1
					for pillar in apl.pillar_id:
						cs=cs+1
					cs=cs+apl.line_len_calc
			child_depart_ids=self.search([('parent_department_id', '=', depart.id)])
			for cdepart in child_depart_ids:
				for substation in cdepart.substation_ids:
					cs=cs+1
					for apl in substation.apl_id:
						cs=cs+1
						for pillar in apl.pillar_id:
							cs=cs+1
						cs=cs+apl.line_len_calc	
			#print depart
			depart.control_summ=cs
		
	@api.depends('control_summ','substation_ids')
	def _get_ss_calc(self):
		for depart in self:
			ssc=0
			aplc=0
			pillarc=0
			linelen=0
			for substation in depart.substation_ids:
				ssc=ssc+1
				for apl in substation.apl_id:
					aplc=aplc+1
					for pillar in apl.pillar_id:
						pillarc=pillarc+1
					linelen=linelen+apl.line_len_calc
			child_depart_ids=self.search([('parent_department_id', '=', depart.id)])
			for cdepart in child_depart_ids:
				for substation in cdepart.substation_ids:
					ssc=ssc+1
					for apl in substation.apl_id:
						aplc=aplc+1
						for pillar in apl.pillar_id:
							pillarc=pillarc+1
						linelen=linelen+apl.line_len_calc	
			#print depart
			depart.apl_count=aplc
			depart.substation_count=ssc
			depart.pillar_count=pillarc
			depart.line_len=linelen
			depart.control_summ=aplc+ssc+pillarc+linelen
			
	@api.depends('substation_ids')
	def _ss_get_url_maps(self):
		for depart in self:
			url='/apl_map/?apl_ids='
			for substation in depart.substation_ids:
				for apl in substation.apl_id:
					url=url+unicode(str(apl.id))+','
			child_depart_ids=self.search([('parent_department_id', '=', depart.id)])
			for cdepart in child_depart_ids:
				for substation in cdepart.substation_ids:
					for apl in substation.apl_id:
						url=url+unicode(str(apl.id))+','
			depart.url_maps=url
	@api.multi
	def act_show_map(self):
		#print self.url_maps
		return{
			'name': 'Maps',
			'res_model':'ir.actions.act_url',
			'type':'ir.actions.act_url',
			'target':'new',
			'url':self.url_maps
			}