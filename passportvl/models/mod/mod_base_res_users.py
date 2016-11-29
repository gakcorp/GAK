# -*- coding: utf-8 -*-
from openerp.addons.passportvl.models import uis_papl_logger
from openerp.addons.passportvl.models import uis_papl_apl

#from openerp import api, fields, models, fields
from openerp import _, tools
from openerp.exceptions import UserError

from openerp.osv import fields, osv
#cv_apl_def_type=openerp._('*NT*')
#cv_apl_voltage=openerp._(*0*)
#cv_apl_feed=openerp._('*NFD*')
#cv_apl_substation=openerp._('*NPS*')
#cv_apl_voltage=openerp._('kV')
#cv_apl_feed_abbr=openerp._('F')

#class uis_apl_passportvl_mod_res_users(osv.Model):
#	_name = 'res.users'
#	_inherit = 'res_users'
#		
#	_columns = {
#		'papl_abbr_apl_def_type': fields.char('Abbrevation empty APL type')
#	}
#uis_apl_passportvl_mod_res_users()
#class uis_apl_passportvl_base_res_users(models.Model):#
	#_name = 'res.users'
	#_inherit = 'res.users'
	
	#papl_settings_ids=fields.One2many('uis.settings','uid','Passport APL settings')
	#pillar_id=fields.One2many('uis.papl.pillar','apl_id', string ="Pillars")
	#_description='Class to modernizing base user class'
	#define apl settings (module passport) for users
	#papl_abbr_apl_def_type = fields.Char('Abbreviation empty APL type')#, required=False, translate=False, default=uis_papl_apl.cv_apl_def_type)

#uis_apl_passportvl_base_res_users()