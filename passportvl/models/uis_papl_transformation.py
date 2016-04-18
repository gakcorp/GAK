# -*- coding: utf-8 -*-
import math, urllib, json, time
from openerp import models, fields, api
class uis_papl_transformationa(models.Model):
	_name='uis.papl.transformer'
	_description='Transformer'
	name=fields.Char(string='Name')s