# -*- encoding: utf-8 -*-
############################################################################
#
#Intellium Inc, web widget for vis.js lib
# Copyright (C) 2017 nr Intellium Inc.
# 
# @author Alexandr Kopylov <>
#
##############################################################################
{
    'name': "vis.js Widget",
    'category': "web",
    'version': "9.0.1.0.0",
    "author": "Intellium Inc, "
              "Russian Federation, "
              "Moscow, "
              "Intellium base service platform",
    'depends': ['base', 'web'],
    'data': [
        'view/im_web_visjs_widget_view.xml'
    ],
    'auto_install': False,
    'installable': True,
    'web_preload': True,
}