class Substation
{
	constructor(id, name,latitude,longitude,pillarMap)
	{
		this.id=id;
		this.name=name;
		this.latitude=latitude;
		this.longitude=longitude;
		this.marker=L.marker([this.latitude,this.longitude]);
		this.pillarMap=pillarMap;
		this.marker.bindPopup(this.name);
	}
	
	addTo(map)
	{
		this.marker.addTo(map);
		this.setIcon(map.getZoom());
		for (var i in this.pillarMap)
		{
			var aplLine=new AplLine([this,this.pillarMap[i]]);
			this.pillarMap[i].setInLine(aplLine);
			aplLine.addTo(map);
		}
	}
	
	setIcon(zoom)
	{
		if (!zoom) return;
		var scaleK=zoom/18;
		if (zoom<17 && zoom>14) scaleK=scaleK/1.5;
		if (zoom<15) scaleK=scaleK/2;
		var icon=new L.divIcon({html: '<div><svg width="60" height="50" transform="scale('+scaleK+')"><path stroke="black" stroke-width="2" fill="none" d="M 0,0 0,5 5,5 5,50 55,50 55,5 60,5 60,0 0,0 M 10,5 50,5 50,45 10,45 10,5"/><path d="M400.268,175.599c-1.399-3.004-4.412-4.932-7.731-4.932h-101.12l99.797-157.568c1.664-2.628,1.766-5.956,0.265-8.678C389.977,1.69,387.109,0,384.003,0H247.47c-3.234,0-6.187,1.826-7.637,4.719l-128,256c-1.323,2.637-1.178,5.777,0.375,8.294c1.562,2.517,4.301,4.053,7.262,4.053h87.748l-95.616,227.089c-1.63,3.883-0.179,8.388,3.413,10.59c1.382,0.845,2.918,1.254,4.446,1.254c2.449,0,4.864-1.05,6.537-3.029l273.067-324.267C401.206,182.161,401.667,178.611,400.268,175.599z" transform="scale(0.06) translate(250,150)"/></svg></div>', className: 'markerClass',iconAnchor: [30,25], iconSize: [100,100]});
		this.marker.setIcon(icon);
	}
	
	changeZoom(zoom)
	{
		this.setIcon(zoom);
	}
	
	getLatLng()
	{
		return this.marker.getLatLng();
	}
	
	getJSTSCoord()
	{
		var latlng=this.marker.getLatLng();
		var coordProj=L.CRS.EPSG3857.project(latlng);
		var coordPoint=new jsts.geom.Coordinate(coordProj.x, coordProj.y);
		return coordPoint;
	}
}