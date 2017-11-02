class Crossing
{
	constructor(id, startObject, endObject)
	{
		this.id=id;
		this.startOject=startObject;
		this.endObject=endObject;
		this.fline=L.polyline([startObject.getLatLng(),endObject.getLatLng()], {offset: 3});
		this.sline=L.polyline([startObject.getLatLng(),endObject.getLatLng()], {offset: -3});
	}
	
	addTo(map)
	{
		this.fline.addTo(map);
		this.sline.addTo(map);
	}
}