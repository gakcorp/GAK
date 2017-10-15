class CurrentPosition
{
    constructor(map)
    {
        this.map=map;
        this.marker=null;
    }
    
    startShow()
    {
        currentPosition=this;
        setInterval(function()
        {
            GpsGate.Client.getGpsInfo(function(gps)
            {
                try
                {
                    var latitude=gps.trackPoint.position.latitude;
                    var longitude=gps.trackPoint.position.longitude;
                    if (true)
                    {
                        if (!currentPosition.marker)
                        {
                            currentPosition.marker=L.marker([latitude, longitude]).addTo(currentPosition.map);
                        }
                        else
                        {
                            currentPosition.marker.setLatLng([latitude, longitude]);
                        }
                    }
                }
                catch (err)
                {
                    console.log("Ошиька загрузки текущего местоположения "+err);
                }
            });
        },3000);
    }
}