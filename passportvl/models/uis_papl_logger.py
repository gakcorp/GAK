# -*- coding: utf-8 -*-
from openerp import models, fields, api
import logging
import datetime

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

class uis_logger(models.Model):
	_name='uis.logger'
	_description='System logger'
	code=fields.Char(string='Name')
	desc=fields.Char(string='Description')
	lib=fields.Char(string='Library')
	delay=fields.Float(digits=(3,2), string="Medium delay")
	
	def add_log(self,code="DEFC",desc="",lib=__name__,debug_level=10):
		_logger.setLevel(debug_level)
		nlog=self.sudo().create({
							  'code':code,
							  'desc':desc,
							  'lib':lib
							  })
		nlog.write({})
		return nlog
	
	def fix_delay(self, delay=0):
		for log in self:
			_logger.debug(log.description+"in %r sec"%delay)
			log.sudo().write({
				'delay':delay
			})
	