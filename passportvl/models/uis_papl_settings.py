class uis_licenses(models.Model):
	_name='uis.licenses'
	_description='Licenses of AG System'
	name=fields.Char('Name')
	lic_type=fields.Char('Type')
	
