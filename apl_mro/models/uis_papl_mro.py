# -*- coding: utf-8 -*-
from openerp import models, fields, api
import logging
import json
import json

_logger=logging.getLogger(__name__)
_logger.setLevel(10)


class apl_mro_order(models.Model):

    STATE_SELECTION = [(1,'CANCELED'),(2, 'DRAFT'),(3, 'CONFIRM'),(4, 'ASSIGNMENT'),(5, 'READY FOR WORK'),(6, 'WORK'),(7, 'COMPLETED'),(8, 'DONE')]

    _inherit=['mail.thread','ir.needaction_mixin']
    _name='uis.papl.mro.order'
    _description='Order'
    name=fields.Char('Order name', size=64,required=True, track_visibility=True)
    description=fields.Text('Order Description', required=True, track_visibility=True)
    apl_id=fields.Many2one('uis.papl.apl',string='Air power line',required=True, track_visibility=True)
    pillar_ids=fields.Many2many('uis.papl.pillar', relation='order_pillar_rel',column1='order_id', column2='pillar_id', track_visibility=True)
    pillar_ids_from_defect=fields.Many2many('uis.papl.pillar', relation='order_pillar_from_defect_rel',column1='order_id', column2='pillar_id',compute='get_def_pillars',store=True, track_visibility=True)
    tap_ids=fields.Many2many('uis.papl.tap', relation='order_tap_rel',column1='order_id', column2='tap_id', track_visibility=True)
    tap_ids_from_defect=fields.Many2many('uis.papl.tap', relation='order_tap_from_defect_rel',column1='order_id', column2='tap_id',compute='get_def_taps',store=True, track_visibility=True)
    transformer_ids=fields.Many2many('uis.papl.transformer',relation='order_transformer_rel',column1='order_id', column2='transformer_id', track_visibility=True)
    transformer_ids_from_defect=fields.Many2many('uis.papl.transformer',relation='order_transformer_from_defect_rel',column1='order_id', column2='transformer_id',compute='get_def_trans',store=True, track_visibility=True)

    
    start_planned_date=fields.Datetime('Planned start date', required=True, track_visibility=True)
    end_planned_date=fields.Datetime('Planned end date', required=True, track_visibility=True)
    take_to_work_date=fields.Datetime('Take to work date', track_visibility=True)
    start_date=fields.Datetime('Start date', track_visibility=True)
    end_date=fields.Datetime('End date', track_visibility=True)
    
    defect_ids=fields.Many2many('uis.papl.mro.defect',relation='order_tdefect_rel',column1='order_id', column2='defect_id', track_visibility=True)
    defect_ids_kanban=fields.Many2many('uis.papl.mro.defect',store=False,compute='_get_defect_kanban')

    contractor_id=fields.Many2one('res.company',string='Contractor', track_visibility=True)
    contractor_logo=fields.Binary('logo',related='contractor_id.logo',readonly=True)

    state=fields.Selection(STATE_SELECTION, 'Status', readonly=True, default=2, track_visibility=True)
    state_label=fields.Char('State Label',store=True,compute='_get_state_label')
    state_progress=fields.Float('State Progress',store=False, compute='_get_state_label')

    attachments=fields.Many2many('ir.attachment',compute='_get_attachments',store=False, relation='order_attachment_rel',column1='order_id', column2='attachment_id')

    order_steps_json=fields.Text(string='Order Steps JSON')
    @api.onchange('apl_id')
    def change_order_object(self):
        self.transformer_ids=[]
        self.pillar_ids=[]
        self.tap_ids=[]
        self.defect_ids=[]
    @api.depends('defect_ids','defect_ids.pillar_ids')
    def get_def_pillars(self):
       for order in self:
	  pillar_ids=[]
	  for defect in order.defect_ids:
		for pillar in defect.pillar_ids:
			if pillar.id not in pillar_ids:
				pillar_ids.append(pillar.id)
	  order.pillar_ids_from_defect=pillar_ids
    @api.depends('defect_ids','defect_ids.tap_ids')
    def get_def_taps(self):
       for order in self:
	  tap_ids=[]
	  for defect in order.defect_ids:
		for tap in defect.tap_ids:
			if tap.id not in tap_ids:
				tap_ids.append(tap.id)
	  order.tap_ids_from_defect=tap_ids
    @api.depends('defect_ids','defect_ids.transformer_ids')
    def get_def_trans(self):
       for order in self:
	  trans_ids=[]
	  for defect in order.defect_ids:
		for trans in defect.transformer_ids:
			if trans.id not in trans_ids:
				trans_ids.append(trans.id)
	  order.transformer_ids_from_defect=trans_ids
    @api.multi
    def order_confirmed(self):
       for order in self:
          order.state=3
          order.add_step()
          for defect in order.defect_ids:
	     defect.suspend_security().state=4
    @api.multi
    def order_assigned(self):
       for order in self:
          order.state=4
          emps=self.env['res.users'].sudo().search([('is_manager','=',True),('company_id','=',order.contractor_id.id)])
          for emp in emps:
             order.message_subscribe([emp.partner_id.id])
          try:
             mail_template=self.env.ref('apl_mro.new_order')
             if mail_template:
                mail_template.suspend_security().send_mail(order.id,force_send=True)
          except:
             _logger.error('apl_mro.new_order not found')
          order.add_step()
    @api.multi
    def order_take_to_work(self):
       for order in self:
          order.message_subscribe([self.env['res.users'].sudo().browse(self.env.uid).partner_id.id])
          order.suspend_security().take_to_work_date=fields.datetime.now()
	  order.suspend_security().state=5
          try:
             mail_template=self.env.ref('apl_mro.order_change_status')
             if mail_template:
                mail_template.suspend_security().send_mail(order.id,force_send=True)
          except:
             _logger.error('apl_mro.order_change_status')
          order.add_step()
    @api.multi
    def order_get_started(self):
       for order in self:
          order.suspend_security().start_date=fields.datetime.now()
          order.suspend_security().state=6
	  for defect in order.defect_ids:
	     defect.suspend_security().state=5
	  try:
             mail_template=self.env.ref('apl_mro.order_change_status')
             if mail_template:
                mail_template.suspend_security().send_mail(order.id,force_send=True)
          except:
             _logger.error('apl_mro.order_change_status')
          order.add_step()
    @api.multi
    def order_completed(self):
       for order in self:
          order.suspend_security().state=7
          try:
             mail_template=self.env.ref('apl_mro.order_change_status')
             if mail_template:
                mail_template.suspend_security().send_mail(order.id,force_send=True)
          except:
             _logger.error('apl_mro.order_change_status')
          order.add_step()
    @api.multi
    def order_not_accepted(self):
       for order in self:
          order.state=6
          try:
             mail_template=self.env.ref('apl_mro.order_change_status')
             if mail_template:
                mail_template.suspend_security().send_mail(order.id,force_send=True)
          except:
             _logger.error('apl_mro.order_change_status')
          order.add_step()
    @api.multi
    def order_done(self):
       for order in self:
          order.end_date=fields.datetime.now()
          order.state=8
	  for defect in order.defect_ids:
	     defect.suspend_security().state=6
          try:
             mail_template=self.env.ref('apl_mro.order_change_status')
             if mail_template:
                mail_template.suspend_security().send_mail(order.id,force_send=True)
	  except:
             _logger.error('apl_mro.order_change_status')
          order.add_step()
    @api.multi
    def order_cancel(self):
       for order in self:
          order.state=1
	  for defect in order.defect_ids:
	     defect.suspend_security().state=3
	  try:
             mail_template=self.env.ref('apl_mro.order_change_status')
             if mail_template:
                mail_template.suspend_security().send_mail(order.id,force_send=True)
	  except:
             _logger.error('apl_mro.order_change_status')
          order.add_step()
    @api.multi
    def order_draft(self):
       for order in self:
          order.state=2
          order.add_step()
    def _get_attachments(self):
       for order in self:
           attach=self.env['ir.attachment'].sudo().search([('res_id','=',order.id),('res_model','=','uis.papl.mro.order')])
           order.attachments=attach
       return
    @api.model
    def _needaction_domain_get(self):
       if self.env.user.has_group('passportvl.contractor'):
          return ['|','|',('state', '=', 4),'&',('state', '=', 5),('start_planned_date','<',str(fields.datetime.now())),'&',('state', '=', 6),('end_planned_date','<',str(fields.datetime.now()))]
       if self.env.user.has_group('passportvl.workshop_main_power_engineer') or self.env.user.has_group('passportvl.workshop_engineer'):
          return ['|','|','|','|',('state', '=', 2),('state', '=', 3),'&','&',('start_planned_date','<',str(fields.datetime.now())),('state', '!=', 8),('state', '!=', 1),'&','&',('end_planned_date','<',str(fields.datetime.now())),('state', '!=', 8),('state', '!=', 1),('state', '=', 7)]
    def get_server_url(self):
	return self.env['uis.global.settings'].sudo().get_value('uis_server_port')+"/web#id="+str(self.id)+"&view_type=form&model=uis.papl.mro.order"
    def get_contractor_manager_emails(self):
       manager_emails=None
       manager_id=self.env['res.users'].sudo().search([('is_manager','=',True),('company_id','=',self.contractor_id.id)])
       for manager in manager_id:
	  if ((manager_emails==None) and manager.email):
	     manager_emails=manager.email
          else:
	     if ((manager_emails!=None) and manager.email):
                manager_emails=manager_emails+","+manager.email  
       if (manager_emails!=None): 
          return manager_emails
       else:
          return ""
    def get_customer_emails(self):
       customer_emails=None
       customer_id=self.env['res.users'].sudo().search([('partner_id','in',self.message_partner_ids.mapped('id')),('company_id','!=',self.contractor_id.id)])
       for customer in customer_id:
	  if ((customer_emails==None) and customer.email):
	     customer_emails=customer.email
          else:
	     if ((customer_emails!=None) and customer.email):
                customer_emails=customer_emails+","+customer.email
       if (customer_emails!=None): 
          return customer_emails
       else:
          return ""
    def get_contractor_emails(self):
       contractor_emails=None
       contractor_id=self.env['res.users'].sudo().search([('partner_id','in',self.message_partner_ids.mapped('id')),('company_id','=',self.contractor_id.id)])
       for contractor in contractor_id:
	  if ((contractor_emails==None) and contractor.email):
	     contractor_emails=contractor.email
          else:
	     if ((contractor_emails!=None) and contractor.email):
                contractor_emails=contractor_emails+","+contractor.email
       if (contractor_emails!=None): 
          return contractor_emails
       else:
          return ""
    def get_last_message_author(self):
       return self.message_ids[0].create_uid.name
    @api.depends('defect_ids')
    def _get_defect_kanban(self):
       for order in self:
          for defect in order.defect_ids:
             if (defect.image_800!=False):
                order.defect_ids_kanban=[(4,defect.id,0)]
    def add_step(self):
       _logger.debug(self.order_steps_json)
       if self.order_steps_json==False:
          user_name=self.create_uid.name
          self.sudo().order_steps_json='{"steps":[{"state":2,"author":"'+self.create_uid.name+'","date":"'+self.create_date+'"}]}'
       user_name=self.env['res.users'].sudo().browse(self.env.uid)[0].name
       self.sudo().order_steps_json=self.order_steps_json[:self.order_steps_json.find("]}")]+',{"state":'+str(self.state)+',"author":"'+user_name+'","date":"'+str(fields.datetime.now())+'"}]}'
    @api.depends('state')
    def _get_state_label(self):
       for order in self:
          order.state_label=order.STATE_SELECTION[order.state-1][1]
          order.state_progress=(100.0/7.0)*(order.state-1)    