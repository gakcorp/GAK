# -*- coding: utf-8 -*-
import math, urllib, json, time
from openerp import models, fields, api

class uis_papl_department(models.Model):
	_name='uis.papl.department'
	_description='Organisation structure for Department'
	name=fields.Char(string='Name')
	substation_ids=fields.One2many('uis.papl.substation','department_id', string='Department')
	substation_count=fields.Integer(string="Substations count", compute='_get_ss_calc')
	apl_count=fields.Integer(string="APL count", compute='_get_ss_calc')
	pillar_count=fields.Integer(string="Pillar count", compute='_get_ss_calc')
	line_len=fields.Float(digits=(6,2), compute='_get_ss_calc')
	parent_department_id=fields.Many2one('uis.papl.department', string='Parent Department')
	url_maps=fields.Char(compute='_ss_get_url_maps', name='URL maps')
	
	@api.depends('substation_ids')
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
			depart.apl_count=aplc
			depart.substation_count=ssc
			depart.pillar_count=pillarc
			depart.line_len=linelen
				
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
		print "Debug info. Start Show_map for Department"
		print self.url_maps
		return{
			'name': 'Maps',
			'res_model':'ir.actions.act_url',
			'type':'ir.actions.act_url',
			'target':'new',
			'url':self.url_maps
			}