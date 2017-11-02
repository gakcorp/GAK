class AplLine
{
	constructor(startObject, endObject)
	{
		this.startObject=startObject;
		this.endObject=endObject;
		this.polyline=new L.polyline.antPath([this.startObject.getLatLng(),this.endObject.getLatLng()], {pulseColor: '#0000FF', opacity: 0.5, color: '#FFFFFF', weight: 3});
	}
	
	addTo(map)
	{
		this.polyline.addTo(map);
	}
	
	getStartObject()
	{
		return this.startObject;
	}
	
	getEndObject()
	{
		return this.endObject;
	}
}