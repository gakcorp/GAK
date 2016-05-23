# -*- coding: utf-8 -*-

import math, urllib, json, time
import os, exifread
import re
from PIL import Image
import base64
import psycopg2
from openerp import models, fields, api
from datetime import datetime

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

def parse_date(str_date):
	parts=re.findall(r"[\d']+", str_date)
	rdate= datetime.strptime(str(str_date),'%Y:%m:%d %H:%M:%S')
	return rdate

def strdiv(strdiv):
	print strdiv
	parts=re.findall(r"[\d']+",str(strdiv))
	print parts
	rval=int(parts[0])/int(parts[1])
	return rval
	
class uis_ap_photo(models.Model):
	_name='uis.ap.photo'
	_description='Photo_apl'
	name=fields.Char('Name')
	image=fields.Binary(string='Image')
	image_length=fields.Integer(string='Image Length')
	image_width=fields.Integer(string='Image Width')
	focal_length=fields.Float(digits=(2,4), string="Focal Length")
	thumbnail=fields.Binary(string="Thumbnail")
	image_filename=fields.Char(string='Image file name')
	image_date=fields.Datetime(string='Image date')
	load_hist_id=fields.One2many('uis.ap.photo.load_hist','photo_ids','Load data')
	longitude=fields.Float(digits=(2,6), string='Longitude')
	latitude=fields.Float(digits=(2,6), string='Latitude')
	altitude=fields.Float(digits=(2,4), string='Altitude')

class uis_ap_photo_load_hist(models.Model):
	_name='uis.ap.photo.load_hist'
	_description='Photo_apl_hist'
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
		for filen in os.listdir(path):
			if filen.endswith(".JPG"):
				img=file(path+'/'+filen,'rb').read().encode('base64')
				with open(path+'/'+filen,'rb') as f:
					print (filen)
					tags=exifread.process_file(f)
					dms_longitude=tags["GPS GPSLongitude"]
					dms_longitude_ref=tags["GPS GPSLongitudeRef"]
					plong=parse_dms(str(dms_longitude),dms_longitude_ref)
					dms_latitude=tags["GPS GPSLatitude"]
					dms_latitude_ref=tags["GPS GPSLatitudeRef"]
					plat=parse_dms(str(dms_latitude),dms_latitude_ref)
					idate=tags["Image DateTime"]
					
					#EXIF ExifImageWidth, value 4000
					ciw=str(tags["EXIF ExifImageWidth"])
					#EXIF ExifImageLength, value 3000
					cil=str(tags["EXIF ExifImageLength"])
					#EXIF FocalLength, value 361/100
					cfl=strdiv(tags["EXIF FocalLength"])
					#GPS GPSAltitude, value 181921/1000
					calt=strdiv(tags["GPS GPSAltitude"])

					print plat,plong
					for tag in tags.keys():
						if tag not in ('JPEGThumbnail', 'TIFFThumbnail', 'Filename', 'EXIF MakerNote'):
							print "Key: %s, value %s" % (tag, tags[tag])
					idate=parse_date(str(idate))
					# !!!! Need validate name file
					np=re_photos.create({'name':str(idate.year)+'_'+str(idate.month)+'_'+str(idate.day)+'_'+str(filen)})
					np.latitude=plat
					np.longitude=plong
					np.image_filename=filen
					np.image=img
					np.image_date=idate
					np.image_length=int(cil)
					np.image_width=int(ciw)
					np.focal_length=cfl
					np.altitude=calt
					#np.load_hist_id=val.id
					#np.image_date.from_string(idate)
					np.thumbnail=base64.b64encode(tags['JPEGThumbnail'])
				