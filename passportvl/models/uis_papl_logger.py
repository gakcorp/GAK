# -*- coding: utf-8 -*-
import openerp
from openerp import models, fields, api, modules
#from openerp.osv import fields, osv
import logging
import datetime

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

class uis_logger(models.Model):
	_name='uis.logger'
	_description='System logger'
	code=fields.Char(string='Code')
	desc=fields.Char(string='Description')
	libr=fields.Char(string='Library')
	start_dt=fields.Datetime(string='Start time')
	end_dt=fields.Datetime(string='End time')
	delay=fields.Float(digits=(3,2), string="Medium delay")
	
	def cnr_log(self):
		nlog=self.sudo().create({})
		return nlog
	@api.v8	
	def add_log(self,context=None,code="DEFCODE",desc="",lib=__name__,debug_level=10):
		_logger.setLevel(debug_level)
		nlog=self.create({})
		'''nlog=self.create({
							'code':code,
							'desc':desc,
							'libr':lib
							})'''
		nlog.write({})
		return nlog
	
	def fix_delay(self, delay=0):
		for log in self:
			_logger.debug(log.description+"in %r sec"%delay)
			log.sudo().write({
				'delay':delay
			})
	@classmethod
	def tcm(self):
		_logger.debug(self)

def ulog(obj,code="DEF",desc="",lib=__name__,debug_level=10):
	nlr=None
	if obj.pool:
		_logger.debug(obj.pool)
		#obj.env['uis.logger']
		_logger.debug(obj.pool.get('uis.logger'))
		nlr=obj.pool.get('uis.logger').cnr_log()
		#nlr=obj.pool.get('uis.logger').add_log(code=code,desc=desc,lib=lib,debug_level=debug_level)
		_logger.setLevel(debug_level)
		_logger.debug('[Lib:%r]:%r:=%r'%(lib,code,desc))
		_logger.debug(nlr)
	return nlr