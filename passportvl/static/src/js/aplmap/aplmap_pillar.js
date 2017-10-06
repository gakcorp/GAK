class Pillar
{
	constructor(id, name, num_by_vl, material, type, cut, icon, latitude, longitude, apl, tap, elevation)
	{
		this.id=id;
		this.name=name;
		this.num_by_vl=num_by_vl;
		this.material=material;
		this.type=type;
		this.cut=cut;
		this.icon=icon;
		this.latitude=latitude;
		this.longitude=longitude;
		this.apl=apl;
		this.tap=tap;
		this.elevation=elevation;
		this.prevPillar=null;
		this.marker=L.marker([this.latitude,this.longitude]);
		this.prevPillar=null;
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
	}
	
	setIcon(zoom)
	{
		if (this.type)
		{
			if (zoom>14 && this.type.isBase())
			{
				var pillarIcon=new L.divIcon({html: '<svg width="50" height="30"><path fill="'+this.icon.fillColor+'" stroke="'+this.icon.strokeColor+'" stroke-width="'+this.icon.strokeWidth+'" d="'+this.icon.iconSVG+'" transform="translate(5,5)"/><foreignObject class="node" width="35" height="15" x="15" y="15"><div style="color:'+this.icon.strokeColor+'">'+this.name+'</div></foreignObject></svg>', className: 'disableClassName', iconAnchor: [10,10]});
				this.marker.setIcon(pillarIcon);
				return;
			}
			if (zoom>15 && !this.type.isBase())
			{
				var pillarIcon=new L.divIcon({html: '<svg width="50" height="30"><path fill="'+this.icon.fillColor+'" stroke="'+this.icon.strokeColor+'" stroke-width="'+this.icon.strokeWidth+'" d="'+this.icon.iconSVG+'" transform="translate(5,5)"/><foreignObject class="node" width="35" height="15" x="15" y="15"><div style="color:'+this.icon.strokeColor+'">'+this.name+'</div></foreignObject></svg>', className: 'disableClassName', iconAnchor: [10,10]});
				this.marker.setIcon(pillarIcon);
				return;
			}
		}
		var pillarIcon=new L.divIcon({className: 'disableClassName'});
		this.marker.setIcon(pillarIcon);
	}
	
	selectPillar()
	{
		var pillarIcon=new L.divIcon({html: '<svg width="50" height="30"><path fill="'+'#ff0000'+'" stroke="'+'#ff0000'+'" stroke-width="'+this.icon.strokeWidth+'" d="'+this.icon.iconSVG+'" transform="translate(5,5)"/><foreignObject class="node" width="35" height="15" x="15" y="15"><div style="color:'+'#ff0000'+'">'+this.name+'</div></foreignObject></svg>', className: 'disableClassName', iconAnchor: [10,10]});
		this.marker.setIcon(pillarIcon);
	}
	
	unselectPillar()
	{
		this.setIcon();
	}
	
	changeZoom(zoom)
	{
		this.setIcon(zoom);
	}
	
	getLatLng()
	{
		return this.marker.getLatLng();
	}
	
	getNumByVl()
	{
		return this.num_by_vl;
	}
	
	setPrevPillar(pillar)
	{
		this.prevPillar=pillar;
	}
	
	getPrevPillar()
	{
		return this.prevPillar;
	}
	
	getJSTSCoord()
	{
		var latlng=this.marker.getLatLng();
		var coordProj=L.CRS.EPSG3857.project(latlng);
		var coordPoint=new jsts.geom.Coordinate(coordProj.x, coordProj.y);
		return coordPoint;
	}
	
	setInLine(line)
	{
		this.inLine=line;
	}
	
	setOutLine(line)
	{
		this.outLine=line;
	}
	
	getTap()
	{
		return this.tap;
	}
	
	getInLine()
	{
		return this.inLine;
	}
	
	getOutLine()
	{
		return this.outLine;
	}
}