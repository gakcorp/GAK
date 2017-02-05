# -*- coding: utf-8 -*-
import openerp
from openerp import models, fields, api, modules
from openerp.http import request
#from openerp.osv import fields, osv
import logging
import datetime

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

class uis_logger(models.Model):
	_name='uis.logger'
	_description='System logger'
	code=fields.Char(string='Code')
	desc=fields.Text(string='Description')
	desc_char=fields.Char(string='Description(short)', compute='_get_char_desc')
	libr=fields.Char(string='Library')
	start_dt=fields.Datetime(string='Start time')
	start_mks=fields.Float(digits=(3,2), string="start mks")
	end_dt=fields.Datetime(string='End time')
	delay=fields.Float(digits=(3,2), string="Delay")
	ipaddr=fields.Char(string="IP address")
	uqnt=fields.Integer(string='Qnt')
	
	@api.depends('desc')
	def _get_char_desc(self):
		for lr in self:
			chstr=lr.desc
			if len(chstr)>100:
				chstr=chstr[:100]+'...'
			lr.desc_char=chstr
		return True
	
	def add_log(self,context=None,code="DEFCODE",desc="",lib=__name__,debug_level=10):
		ncr=self.pool.cursor()
		ipadr=request.httprequest.environ['REMOTE_ADDR']
		_logger.debug(ipadr)
		#_logger.debug(ipadr)
		std=datetime.datetime.now()
		lr=self.create(ncr,openerp.SUPERUSER_ID,{
			'code':code,
			'libr':lib,
			'start_dt':std,
			'desc':unicode(desc),
			'ipaddr':ipadr
			})
		
		nlog=self.browse(ncr,openerp.SUPERUSER_ID,[lr])
		st_dt=nlog.start_dt
		fmt='%Y-%m-%d %H:%M:%S'
		ds=datetime.datetime.strptime(st_dt,fmt)
		delta=std-ds
		start_mks=delta.total_seconds()
		nlog.sudo().write({
				'start_mks':start_mks
			})
		#_logger.debug(start_mks)
		ncr.commit()
		#ncr.close()
		#nlog.write({})
		_logger.setLevel(debug_level)
		_logger.debug('[Lib:%r]:%r:=%r'%(nlog.libr,nlog.code,unicode(nlog.desc)))
		return nlog
		'''
		for lr in self:
			_logger.setLevel(debug_level)
			_logger.debug('!!!!!!!!! CODE= %r !!!!!!!!!!!!'%code)
#			lr.code=code
#			lr.desc=unicode(desc)
#			lr.libr=lib
#			lr.start_dt=
			lr.create({})
			lr.write({
				'code':code,
				'libr':lib,
				'start_dt':datetime.datetime.now(),
				'desc':unicode(desc)
				})
			_logger.debug(lr)
			_logger.setLevel(debug_level)
			_logger.debug('[Lib:%r]:%r:=%r'%(lib,code,unicode(desc)))

		return True'''
	
	def set_qnt(self, count=1):
		for lr in self:
			lr.sudo().write({
				'uqnt':count
			})
		self.env.cr.commit()
		#self.env.cr.close()
		
	def add_comment(self, com=""):
		for lr in self:
			ndesc=lr.desc+'\r'+unicode(com)
			lr.sudo().write({
				'desc':ndesc
			})
		self.env.cr.commit()
		#self.env.cr.close()
		return True
	
	def fix_end(self):
		for lr in self:
			end_dt=datetime.datetime.now()
			st_dt=lr.start_dt
			lr.sudo().write({
				'end_dt':end_dt
			})
			fmt='%d.%m.%Y %H:%M:%S'
			fmt='%Y-%m-%d %H:%M:%S'
			ds=datetime.datetime.strptime(st_dt,fmt)
			elapsed=end_dt-ds
			el=elapsed.total_seconds()
			el=el-lr.start_mks
			lr.sudo().write({
				'delay':el
			})
		self.env.cr.commit()
		self.env.cr.close()
		return True


def ulog(obj=None,code="DEF",desc="",lib=__name__,debug_level=10):
	nlr=None
	obj=request.registry['uis.logger']
	if obj.pool:
		#if not cr:
		#cr=obj.pool.cursor()
		#nlr=obj.pool.get('uis.logger').cnr_log(cr=cr,uid=openerp.SUPERUSER_ID,ids=[],context=None)
		#nlr.add_log(code=code,desc=desc,lib=lib,debug_level=debug_level)
		nlr=obj.pool.get('uis.logger').add_log(code=code,desc=desc,lib=lib,debug_level=debug_level)
		#cr.fetchone()
		#cr.close()
	return nlr