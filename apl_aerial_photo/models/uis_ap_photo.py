# -*- coding: utf-8 -*-

import math, urllib, json, time
import os, exifread
import re
from PIL import Image
import base64
import psycopg2
from openerp import models, fields, api

def dms2dd(degrees,minutes,seconds, direction):
	dd=float(degrees)+float(minutes)/60+float(seconds)/(60*60)
	if direction == 'S' or direction =='W':
		dd *=-1
	return dd

def parse_dms(dms,direction):
	parts=re.split('[^\d\w]+',dms)
	dd=dms2dd(parts[1],parts[2],int(parts[3])/int(parts[4]),direction)
	print parts
	return dd
		
class uis_ap_photo(models.Model):
	_name='uis.ap.photo'
	_description='Photo_apl'
	name=fields.Char('Name')
	image=fields.Binary(string='Image')
	thumbnail=fields.Binary(string="Thumbnail")
	image_filename=fields.Char(string='Image file name')
	image_date=fields.Date(string='Image date')
	load_hist_id=fields.One2many('uis.ap.photo.load_hist','photo_ids','Load data')
	longitude=fields.Float(digits=(2,6), string='Longitude')
	latitude=fields.Float(digits=(2,6), string='Latitude')

class uis_ap_photo_load_hist(models.Model):
	_name='uis.ap.photo.load_hist'
	_description='Photo_apl'
	name=fields.Char('Name')
	load_date=fields.Date(string='Load date')
	photo_count=fields.Integer(string='Photo_count')
	photo_ids=fields.Many2one('uis.ap.photo', string='Photos')
	folder_name=fields.Char(string='Folder')
	
	def load_photos(self, cr,uid,ids,context=None):
		re_photos=self.pool.get('uis.ap.photo').browse(cr,uid,ids,context=context)
		print "Start load photos"
		path='/home'
		val=self.browse(cr,uid,ids,context=context)
		if val.folder_name != '':
			path=val.folder_name
		for file in os.listdir(path):
			if file.endswith(".JPG"):
				with open(path+'/'+file,'rb') as f:
					print (file)
					tags=exifread.process_file(f)
					dms_longitude=tags["GPS GPSLongitude"]
					dms_longitude_ref=tags["GPS GPSLongitudeRef"]
					plong=parse_dms(str(dms_longitude),dms_longitude_ref)
					dms_latitude=tags["GPS GPSLatitude"]
					dms_latitude_ref=tags["GPS GPSLatitudeRef"]
					plat=parse_dms(str(dms_latitude),dms_latitude_ref)
					print plat,plong
					for tag in tags.keys():
						if tag not in ('JPEGThumbnail', 'TIFFThumbnail', 'Filename', 'EXIF MakerNote'):
							print "Key: %s, value %s" % (tag, tags[tag])
					im=f.read()
					#jpgfile = Image.open(f)
					#im_b64=base64.b64encode(f.read())
					#im_b64=base64.encodestring(im)
					im_b64=base64.encodestring(f.read())
					
					np=re_photos.create({'name':str(file)})
					np.latitude=plat
					np.longitude=plong
					np.image_filename=file
					np.image=im_b64
					np.thumbnail=base64.b64encode(tags['JPEGThumbnail'])
				