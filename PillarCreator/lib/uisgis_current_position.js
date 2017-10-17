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
                            var posIcon=L.icon({iconUrl: './images/position.png', iconSize: [25,37] , iconAnchor: [12, 37]});
                            currentPosition.marker=L.marker([latitude, longitude], {icon: posIcon}).addTo(currentPosition.map);
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