# -*- coding: utf-8 -*-

from openerp import http
from openerp.http import request
from openerp.tools import html_escape as escape
import json

class cartography_portal(http.Controller):
	@http.route('/maps', auth='public')
	def maps(self, *arg, **post):
		request.uid = request.session.uid
		
		values = {}
		return request.render("uis_ag_google_maps.uis_cartography_main", values)