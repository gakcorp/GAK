{
    'name': 'APL AERO PHOTO',
    'version': '0.1',
    'summary': 'Aerial photos for APL, Pillars and Substations',
    'description': """
Manage and show aerial photos for APL, Pillars and Substation
=================================================

Main Features
-------------
    * Auto load photos from server (ftp) folder
    * Load exif data for aerial photos (geodata, latitude, longitude)
    * Automatic binding aerial photos to Pillar, APL
    * View images for pillars and apl forms
    """,
    
    'author': 'GIS.Aktiv',
    'website': 'http://www.uisgis.ru',
    'category': 'Air Power Line Management',
    'sequence': 0,
    'depends': ['passportvl','base','mail'],
    'demo': ['demo/demo.xml'],
    'data':[
        'views/mod_apl_view.xml',
        'views/uis_papl_aerialphoto_view.xml',
        'views/mod_apl_view.xml',
        'views/mod_google_map_template.xml',
        'views/reports/mod_uis_papl_apl_report_passport.xml',
        'views/uis_ap_vis_object.xml',
        'action/uis_ap_action_recalc_scheme.xml',
	'views/uis_papl_aerial_pre_photo_view.xml'
    ],
    'application': True,
}
#,'views/mod_pillar_view.xml',
#,
#        'views/mod_google_map_template.xml'
#'views/mod_apl_view.xml',
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
