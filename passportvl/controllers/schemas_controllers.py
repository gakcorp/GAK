
from openerp import http
from openerp.http import request
from openerp.tools import html_escape as escape
import json

class apl_schemas(http.Controller):
    @http.route('/apl_scheme', auth='public')
    def apl_schema(self, *arg, **post):
        cr, uid, context = request.cr, request.uid, request.context
        #pillar_obj = request.registry['uis.papl.pillar']
        apl_obj=request.registry['uis.papl.apl']
        #trans_obj=request.registry['uis.papl.transformer']
        values=""
        clean_ids=[]
        for s in post.get('apl_ids',"").split(","):
            try:
                i=int(s)
                clean_ids.append(i)
                print i
            except ValueError:
                pass
        values = {
            #'partner_url': post.get('partner_url'),
            'apl_ids': json.dumps(clean_ids)
        }
        return request.render("passportvl.uis_apl_scheme", values)