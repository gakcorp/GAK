from openerp import models, fields, api, tools
import logging
import os, exifread
from uis_ap_photo import parse_dms
from uis_ap_photo import parse_date
from uis_ap_photo import uis_ap_photo
import googlemaps
from PIL import ImageFile

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

class uis_ap_pre_photo(models.Model):
	_name = 'uis.ap.pre_photo'
	_description = "Pre_Photo"
	name=fields.Char('Name')
	image=fields.Binary(string='Image')
	image_length=fields.Integer(string='Image Length')
	image_width=fields.Integer(string='Image Width')
	image_400=fields.Binary(string='Image400')
	image_800=fields.Binary(string='Image800')
	focal_length=fields.Float(digits=(2,2), string="Focal Length")
	image_filename=fields.Char(string='Image file name')
	image_date=fields.Datetime(string='Image date')
	longitude=fields.Float(digits=(2,6), string='Longitude')
	latitude=fields.Float(digits=(2,6), string='Latitude')
	altitude=fields.Float(digits=(2,2), string='Altitude')
	elevation_point=fields.Float(digits=(2,2), string="Ground Elevation")
	state=fields.Selection((('normal','Normal'),('warning','Warning'),('critical','Critical')),'State',compute='_state_func')
	_sql_constraints = [('name_uniq', 'unique (name)', 'The name pre photo must be unique !')]
	@api.model
	def check_photos(self):
		#path=self.env['uis.global.settings'].get_value('uis_prephoto_folder')
		path='/tmp/photo'
		ImageFile.LOAD_TRUNCATED_IMAGES=True
		for filen in os.listdir(path):
			if filen.lower().endswith(".jpg"):
				try:
					img=file(path+'/'+filen,'rb').read().encode('base64')
					with open(path+'/'+filen,'rb') as f:
						tags=exifread.process_file(f)

						dms_longitude=tags["GPS GPSLongitude"]
						dms_longitude_ref=tags["GPS GPSLongitudeRef"]
						plong=parse_dms(str(dms_longitude),dms_longitude_ref)

						dms_latitude=tags["GPS GPSLatitude"]
						dms_latitude_ref=tags["GPS GPSLatitudeRef"]
						plat=parse_dms(str(dms_latitude),dms_latitude_ref)
					
						idate=tags["Image DateTime"]
						idate=parse_date(str(idate))

						ciw=str(tags["EXIF ExifImageWidth"])

						cil=str(tags["EXIF ExifImageLength"])

						try:
							cfl=strdiv(tags["EXIF FocalLength"])
						except:
							#_logger.debug('error in Exif FocalLenght tag=%r'%tags["EXIF FocalLength"])
							cfl=-1

						try:
							calt=strdiv(tags["GPS GPSAltitude"])
						except:
							#_logger.debug('Error in EXIF GPS Altitude tag=%r'%tags["GPS GPSAltitude"])
							calt=-1

						try:
							#key=self.env['uis.global.settings'].get_value('uis_google_api_key')
							key='AIzaSyClGM7fuqSCiIXgp35PiKma2-DsSry3wrI'
							client=googlemaps.Client(key)
							res=client.elevation((plat, plong))
							for item in res:
								elv=item['elevation']
						except googlemaps.exceptions.ApiError:
							elv=-1

						prph=self.create({'name':str(idate.year)+'_'+str(idate.month)+'_'+str(idate.day)+'_'+str(filen)})

						prph.latitude=plat
						prph.longitude=plong
						prph.image_filename=filen
						prph.image=img
						try:
							prph.image_400=tools.image.image_resize_image(img, size=(400,300))
							prph.image_800=tools.image.image_resize_image(img, size=(800,600))
						except:
							pass
						prph.image_date=idate
						prph.image_length=int(cil)
						prph.image_width=int(ciw)
						prph.focal_length=cfl
						prph.altitude=calt
						prph.elevation_point=elv
						try:
							os.remove(path+'/'+filen)
						except Exception as e:
							_logger.debug('Error Delete File %r %r'%(path+'/'+filen,str(e)))
				except Exception as e:
					_logger.debug('Error Parse File %r %r'%(path+'/'+filen,str(e)))
						
	def _state_func(self):
		for prph in self:
			if ((prph.image_date == False) or (prph.latitude==0) or (prph.longitude==0) or (prph.image_length==0) or (prph.image_width==0)):
				prph.state='critical'
				continue
			if ((prph.focal_length==-1) or (prph.altitude==-1) or (prph.elevation_point==-1)):
				prph.state='warning'
				continue
			if ((prph.altitude < prph.elevation_point) or (prph.altitude > prph.elevation_point+100)):
				prph.state='warning'
				continue
			prph.state='normal'
	@api.multi
	def save_photo(self):
		ImageFile.LOAD_TRUNCATED_IMAGES=True
		for prph in self:
			np=self.env['uis.ap.photo'].create({'name':prph.name})
			np.latitude=prph.latitude
			np.longitude=prph.longitude
			np.image_filename=prph.image_filename
			np.image=prph.image
			np.image_400=prph.image_400
			np.image_800=prph.image_800
			np.image_date=prph.image_date
			np.image_length=prph.image_length
			np.image_width=prph.image_width
			np.focal_length=prph.focal_length
			np.altitude=prph.altitude
			np.elevation_point=prph.elevation_point
			
			prph.unlink()









		