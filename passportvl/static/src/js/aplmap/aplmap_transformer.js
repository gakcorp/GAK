class Transformer
{
	constructor(id, name,latitude,longitude,trans_stay_rotation,pillarIn,pillarOut,apl,tap)
	{
		this.id=id;
		this.name=name;
		this.latitude=latitude;
		this.longitude=longitude;
		this.rotation=trans_stay_rotation;
		this.pillarIn=pillarIn;
		this.pillarOut=pillarOut;
		this.apl=apl;
		this.tap=tap;
		this.marker=L.marker([this.latitude,this.longitude]);
		this.marker.bindPopup(this.name);
		this.inLine=null;
		this.outLine=null;
	}
	
	getID()
	{
		return this.id;
	}
	
	addTo(map)
	{
		this.marker.addTo(map);
		this.setIcon(map.getZoom());
		if (this.pillarIn)
		{
			var aplLine=new AplLine([this.pillarIn,this]);
			this.setInLine(aplLine);
			aplLine.addTo(map);
		}
		if (this.pillarOut)
		{
			var aplLine=new AplLine([this,this.pillarOut]);
			this.pillarOut.setInLine(aplLine);
			aplLine.addTo(map);
		}
	}
	
	setIcon(zoom)
	{
		if (!zoom) return;
		if (zoom<14)
		{
			var pillarIcon=new L.divIcon({className: 'disableClassName'});
			this.marker.setIcon(pillarIcon);
			return;
		}
		var scaleK=1;
		if (zoom==16) scaleK=0.7;
		if (zoom<16) scaleK=0.5
		var rotation=180+this.rotation;
		var icon=new L.divIcon({html: '<div><svg width="30" height="30"><path stroke="black" stroke-width="2" fill="none" d="M -11,-11 -11,11 11,11 11,-11 -11,-11 -11,11 0,-11 11,11" transform="scale('+1*scaleK+') translate('+15/scaleK+','+15/scaleK+') rotate('+rotation+',0,0)"/></svg></div>', className: 'markerClass',iconAnchor: [15,15], iconSize: [100,100]});
		this.marker.setIcon(icon);
	}
	
	changeZoom(zoom)
	{
		this.setIcon(zoom);
	}
	
	getJSTSCoord()
	{
		var latlng=this.marker.getLatLng();
		var coordProj=L.CRS.EPSG3857.project(latlng);
		var coordPoint=new jsts.geom.Coordinate(coordProj.x, coordProj.y);
		return coordPoint;
	}
	
	getLatLng()
	{
		return this.marker.getLatLng();
	}
	
	setInLine(line)
	{
		this.inLine=line;
	}
	
	setOutLine(line)
	{
		this.outLine=line;
	}
	
	getInLine()
	{
		return this.inLine;
	}
	
	getOutLine()
	{
		return this.outLine;
	}
	
	getSortJSTSCoords()
	{
		var tempMas=[];
		if (this.pillarIn) tempMas.push(this.pillarIn.getJSTSCoord());
		tempMas.push(this.getJSTSCoord())
		if (this.pillarOut) tempMas.push(this.pillarOut.getJSTSCoord());
		return tempMas;
	}
}