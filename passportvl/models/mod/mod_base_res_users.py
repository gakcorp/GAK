from openerp import api
from openerp.osv import fields, osv
import logging

_logger=logging.getLogger(__name__)

class res_users(osv.Model):
    """ Update of res.users class

     - add field for the related paplemployee of the user
     - if adding groups to an user, check if base.group_user is in it (member of
       'Employee'), create an employee form linked to it. """
    _name = 'res.users'
    _inherit = ['res.users']

    _columns = {
        'employee_papl_ids': fields.one2many('uis.papl.employee', 'user_id', 'Related ActivGIS employees'),
	'papl_dept_ids': fields.many2many('uis.papl.department',string="Departments",store=True),
	'is_manager': fields.boolean(string='Is Manager'),
    }
