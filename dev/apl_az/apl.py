from openerp.osv import fields, osv

class airway(osv.osv):
	_name = 'airway'
	_description = "Airway"
	_columns = {
		#'AirwayID' : fields.integer('ID', required=True),
		'name' : fields.char('Name', size=50, required=True),
	}

class rack(osv.osv):
	_name = 'rack'
	_description = "Rack"
	_columns = {
		#'RackID' : fields.integer('ID', required=True),
		'name' : fields.char('Name', size=50, required=True),
		#'AirwayLink' : fields.many2one('airway', ondelete='cascade',string='AirwayLink',required=True),
		'airway_id': fields.many2one('airway', ondelete='cascade', string='Airway', required=True)
	}