# -*- coding: utf-8 -*-
import openerp
from openerp import api
from openerp import SUPERUSER_ID
from openerp import tools
from openerp.modules.module import get_module_resource
from openerp.osv import fields, osv
from openerp.tools.translate import _
from openerp.addons.passportvl.models import uis_papl_apl
from openerp.addons.passportvl.models import uis_papl_tap
from openerp.addons.passportvl.models import uis_papl_pillar
from openerp.addons.passportvl.models import uis_papl_transformation

cv_apl_def_type=uis_papl_apl.cv_apl_def_type
cv_apl_voltage=uis_papl_apl.cv_apl_voltage
cv_apl_feed=uis_papl_apl.cv_apl_feed
cv_apl_substation=uis_papl_apl.cv_apl_substation
cv_apl_voltage_abbr=uis_papl_apl.cv_apl_voltage_abbr
cv_apl_feed_abbr=uis_papl_apl.cv_apl_feed_abbr

cv_tap_empty_apl=uis_papl_tap.cv_tap_empty_apl
cv_tap_empty_conn_pillar=uis_papl_tap.cv_tap_empty_conn_pillar
cv_tap_empty_num_vl=uis_papl_tap.cv_tap_empty_num_vl
cv_tap_abbr_ml=uis_papl_tap.cv_tap_abbr_ml
cv_tap_abbr_tap=uis_papl_tap.cv_tap_abbr_tap

cv_pillar_sep=uis_papl_pillar.cv_pillar_sep
cv_pillar_empty_num_vl=uis_papl_pillar.cv_pillar_empty_num_vl
cv_pillar_empty_tap=uis_papl_pillar.cv_pillar_empty_tap

cv_trans_abbr_transformer=uis_papl_transformation.cv_trans_abbr_transformer
cv_trans_empty_feed=uis_papl_transformation.cv_trans_empty_feed
cv_trans_empty_number=uis_papl_transformation.cv_trans_empty_number
cv_trans_empty_tap=uis_papl_transformation.cv_trans_empty_tap

#default abbreviation of volotage (if not defined ='kV')
#cv_apl_feed_abbr	-	default abbreviation of feeder (if not defined ='F')
class uis_papl_apl(osv.osv):
	_name ='uis.papl.employee'
	_description = "Employee of ActivGIS (PassporVL) Platform"
	_order = 'name_related'
	_inherits = {'resource.resource': "resource_id"}
	_inherit = ['mail.thread']
	
	_mail_post_access = 'read'
	DISP_APL_FRM = [
		('ta+"-"+va+av+" "+af+fa+"-"+sa+sn', openerp._('APL-6kV F2-Substation name (short APL name)')),
		('af+fa+"-"+sa', openerp._('F2-Substation name')),
		('sa+"-"+af+fa', openerp._('Substation name-F2')),
		('fa+":"+sa',openerp._('2:Substatation name'))]
	#variables:
	#tn = num tap on APL
	#aml = abbriviation of main line
	#atp = abbriviation of tap
	#an = APL Name
	#cp = num connected pillar
	DISP_ML_FRM=[
		('aml+"_"+an',openerp._('ML_APL name')),
		('"_"+an',openerp._('_APL name')),
		('an+"("+aml+")"',openerp._('APL name(ML)'))
	]
	
	DISP_TAP_FRM=[
		('atp+"."+tn+"("+cp+")."+an',openerp._('T.2(52).APL name')),
		('"("+cp+")"+an',openerp._('(52)APL name')),
		('tn+"("+cp+")"+an',openerp._('2(52)APL name')),
		('tn+"("+cp+")"',openerp._('2(52)')),
		('tn+"("+cpn+")"',openerp._('2(34.52)'))
	]
	DISP_MP_FRM=[
		('pn',openerp._('64')),
		('pn+sp+an',openerp._('64.APL name')),
		('"0"+sp+pn',openerp._('0.64')),
		('"0"+sp+pn+an',openerp._('0.64.APL Name'))
	]
	DISP_TP_FRM=[
		('pn+sp+tn',openerp._('32.Tap name')),
		('pn+sp+tcpn+sp+an', openerp._('32.64.APL Name')),
		('tnum+sp+pn+sp+an', openerp._('3.64.32.APL Name')),
		('tcpn+sp+pn',openerp._('64.32')),
		('tcpname+sp+pn',openerp._('21.64.32'))
	]
	DISP_KTP_FRM=[
		('aktp+fn+ktpn',openerp._('TRF0203')),
		('aktp+fn+tn+ktpn',openerp._('TRF020403')),
		('aktp+fn+ktpn+"("+indnm+")"',openerp._('TRF0203(individual name)'))
	]
	_columns = {
		#we need a related field in order to be able to sort the employee by name
		'name_related': fields.related('resource_id', 'name', type='char', string='Name', readonly=True, store=True),
		#fields define value of dispathing APL name
		'code_empty_type_apl':fields.char('Code empty type of APL', help="Default empty code is '%r'"%cv_apl_def_type),
		'code_empty_voltage_apl':fields.char('Code empty voltage APL', help="Default empty code is '%r'"%cv_apl_voltage),
		'code_empty_feed_apl':fields.char('Code empty feeder APL', help="Default empty code is '%r'"%cv_apl_feed),
		'code_empty_substation_apl': fields.char('Code empty substation', help="Default empty code is '%r'"%cv_apl_substation),
		'code_abbr_voltage_apl':fields.char('Abbreviation of volotage', help="Default abbreviation of voltage is '%r'"%cv_apl_voltage_abbr),
		'code_abbr_feed_apl':fields.char('Abbreviation of feeder', help="Default abbreviation of feeder is '%r'"%cv_apl_feed_abbr),
		'disp_apl_frm': fields.selection(DISP_APL_FRM, 'Dispathing APL name format', readonly=False,
										help="Use dispathing APL name with next format\n\
										if field is empty default format is ex.'APL-6kV F2-Substation name (short APL Name)'"),
		#fields define value of dispathing transformers name
		'tr_code_abbr_transformer':fields.char('Abbreviation of transformer',help="Default abbreviation of transformers is %r"%cv_trans_abbr_transformer),
		'tr_code_empty_feed_number':fields.char('Code empty feeder number', help="Default empty code is %r"%cv_trans_empty_feed),
		'tr_code_empty_trans_number':fields.char('Code empty transformer number', help="Default empty code is %r"%cv_trans_empty_number),
		'tr_code_empty_tap_number':fields.char('Code empty tap number', help="Default empty code is %r"%cv_trans_empty_tap),
		'disp_trans_frm':fields.selection(DISP_KTP_FRM,'Dispathing Transformers name format', readonly=False,
										help="Use dispathing transformer name format\n\
										if field is is empty default format is ex. 'TRF0203'"),
		#fields define value of dispathing TAP name
		'code_empty_tap_num_vl':fields.char('Code empty tap number', help="Default empty code is '%r'"%cv_tap_empty_num_vl),
		'code_empty_tap_conn_pillar':fields.char('Code empty connected pillar', help="Default empty code is '%r'"%cv_tap_empty_conn_pillar),
		'code_empty_tap_apl':fields.char('Code empty connected pillar', help="Default empty code is '%r'"%cv_tap_empty_apl),
		'code_abbr_tap':fields.char('Abbreviation of tap', help="Default abbreviation of tap is %r"%cv_tap_abbr_tap),
		'code_abbr_ml':fields.char('Abbreviation of mainline', help="Default abbreviation of Main line is %r"%cv_tap_abbr_ml),
		'disp_ml_frm': fields.selection(DISP_ML_FRM, 'Dispathing mainline APL format', readonly=False,
										help="Use dispathing mainline APL name with next format\n\
										if field is empty default format is ex.'ML.APL Name'"),
		'disp_tap_frm': fields.selection(DISP_TAP_FRM, 'Dispathing TAP name format', readonly=False,
										help="Use dispathing TAP name with next format\n\
										if field is empty default format is ex.'T.2(52).APL name'"),
		#fields define value of dispathing PIL name
		'pv_pillar_sep':fields.char('Separator for mark pillar', help="Default separator id %r"%cv_pillar_sep),
		'pv_pillar_empty_num_vl':fields.char('Code empty pillar number by APL', help="Default empty code is %r"%cv_pillar_empty_num_vl),
		'pv_pillar_empty_tap':fields.char('Code empty tap name', help="Default empty code is %r"%cv_pillar_empty_tap),
		'disp_mp_frm':fields.selection(DISP_MP_FRM, 'Disparhing pillar (main line) format', readonly=False,
										help="Use dispathing Pillar of main line\n\
										if field is empty default format is ex. '2.APL name'"),
		'disp_tp_frm':fields.selection(DISP_TP_FRM, 'Dispathing pillar (tap) format', readonly=False,
										help="Use dispathing name of pillar tap\n\
										if field is empty default format is ex. '(3).2.APL name'"),
		#personal fields
		'color': fields.integer('Color Index'),
		'work_email': fields.char('Work Email', size=240),
		'dept_ids' : fields.many2many('uis.papl.department','employee_dept_ref','employee_id','dept_id',stirng="Departments Reference"),
	}
	 # image: all image fields are base64 encoded and PIL-supported
	image = openerp.fields.Binary("Photo", attachment=True,
		help="This field holds the image used as photo for the employee, limited to 1024x1024px.")
	image_medium = openerp.fields.Binary("Medium-sized photo", attachment=True,
		help="Medium-sized photo of the employee. It is automatically "\
			"resized as a 128x128px image, with aspect ratio preserved. "\
			"Use this field in form views or some kanban views.")
	image_small = openerp.fields.Binary("Small-sized photo", attachment=True,
		help="Small-sized photo of the employee. It is automatically "\
			"resized as a 64x64px image, with aspect ratio preserved. "\
			"Use this field anywhere a small image is required.")

	def _get_default_image(self, cr, uid, context=None):
		image_path = get_module_resource('hr', 'static/src/img', 'default_image.png')
		return tools.image_resize_image_big(open(image_path, 'rb').read().encode('base64'))
	
	defaults = {
		'active': 1,
		'image': _get_default_image,
		'color': 0,
	}

	def onchange_user(self, cr, uid, ids, name, image, user_id, context=None):
		if user_id:
			user = self.pool['res.users'].browse(cr, uid, user_id, context=context)
			values = {
				'name': name or user.name,
				'work_email': user.email,
				'image': image or user.image,
			}
			return {'value': values}