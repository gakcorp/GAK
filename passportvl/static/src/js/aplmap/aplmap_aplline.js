class AplLine
{
	constructor(objectArray)
	{
		this.startObject=objectArray[0];
		this.endObject=objectArray[objectArray.length-1];
		var coordArray=[];
		if (objectArray.length==1)
		{
			if (this.endObject.getPrevPillar())
			{
				this.startObject=this.endObject.getPrevPillar();
				coordArray.push(this.endObject.getPrevPillar().getLatLng());
			}
			else 
			{
				coordArray.push(this.endObject.getLatLng());
			}
		}
		for (var i in objectArray) coordArray.push(objectArray[i].getLatLng());
		this.polyline=new L.polyline.antPath(coordArray, {pulseColor: '#0000FF', opacity: 0.5, color: '#FFFFFF', weight: 3});
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