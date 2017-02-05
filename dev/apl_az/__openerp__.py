{
    'name': 'APL MRO',
    'version': '0.1',
    'summary': 'Air Power Line Maintenance, Repair and Operation',
    'description': """
Manage Maintenance process for APL (Passport VL)
=================================================

Air power line Maintenance, Repair and Operation.

Main Features
-------------
    * Request Service/Maintenance Management
    * Maintenance Work Orders Management
    * Parts Management
    * Tasks Management (standard job)
    * Convert Maintenance Order to Task
    * Print Maintenance Order
    * Print Maintenance Request
    """,
    
    'author': 'GIS.Aktiv',
    'website': 'http://www.uisgis.ru',
    'category': 'Air Power Line Management',
    'sequence': 0,
    'depends': ['base'],
    'data':['mainView.xml'],
    'application': True,
}
# 'views/uis_papl_mro_view.xml',

#'views/mod_transformer_view.xml' 'views/mod_apl_view.xml', 
#'images': ['images/maintenance_requests.png','images/maintenance_orders.png','images/maintenance_order.png','images/maintenance_tasks.png','images/maintenance_task.png'],

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
#   'data': [
#        'security/mro_security.xml',
#        'security/ir.model.access.csv',
#        'wizard/reject_view.xml',
#        'wizard/convert_order.xml',
#        'asset_view.xml',
#        'mro_workflow.xml',
#        'mro_request_workflow.xml',
#        'mro_sequence.xml',
#        'mro_data.xml',
#        'mro_view.xml',
#        'mro_report.xml',
#        'views/report_mro_order.xml',
#        'views/report_mro_request.xml',
#    ],
