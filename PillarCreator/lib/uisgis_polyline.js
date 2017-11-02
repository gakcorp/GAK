class AplLine
    {
        constructor(latlng,map,startPillar,endPillar)
        {
            this.polyline=new L.polyline.antPath(latlng, {pulseColor: '#0000FF', opacity: 0.5, color: '#FFFFFF', weight: 3});
            this.startPillar=startPillar;
            this.map=map;
            this.endPillar=endPillar;
            this.polyline.addTo(this.map);
            this.lineTap=endPillar.pillarTap;
            this.visPillarAttr=endPillar.visPillarAttr;
            var aplLine=this;
            this.PillarArray=[];
            this.polyline.on('mousedown',function()
            {
                aplLine.onMouseDown();
            });            
        }
        
        setNewEndCoord(latlng)
        {
            var Coord=this.polyline.getLatLngs();
            this.moveLineRelativelyCoord(Coord[0],Coord[1],latlng);
            Coord[1]=latlng;
            this.polyline.setLatLngs(Coord);
        }
        
        setNewStartCoord(latlng)
        {
            var Coord=this.polyline.getLatLngs();
            this.moveLineRelativelyCoord(Coord[1],Coord[0],latlng);
            Coord[0]=latlng;
            this.polyline.setLatLngs(Coord);
        }
        
        remove()
        {
            this.map.removeLayer(this.polyline);
            var tempArray=this.PillarArray.slice();
            for (var i in tempArray)
            {
                tempArray[i].remove();
            }
        }
        
        onMouseDown()
        {
            this.visPillarAttr.SelectLine(this);
        }
        
        addPillarToLine()
        {
            var StartLat=this.polyline.getLatLngs()[0].lat;
            var StartLng=this.polyline.getLatLngs()[0].lng;
            var EndLat=this.polyline.getLatLngs()[1].lat;
            var EndLng=this.polyline.getLatLngs()[1].lng;
            var pillarCount=this.PillarArray.length+2;
            var deltaLat=(EndLat-StartLat)/(pillarCount);
            var deltaLng=(EndLng-StartLng)/(pillarCount);
            var pillarLat=StartLat;
            var pillarLng=StartLng;
            var i=null;
            for (i in this.PillarArray)
            {
                pillarLat+=deltaLat;
                pillarLng+=deltaLng;
                this.PillarArray[i].setLatLng(L.latLng(pillarLat, pillarLng));
            }
            pillarLat+=deltaLat;
            pillarLng+=deltaLng;
            var pillar = new PillarMarker(L.latLng(pillarLat, pillarLng),{draggable: true, isBase:false},this.map);
            pillar.addTo(this.map);
            if (i) this.PillarArray[i].addToBetween(pillar,this.endPillar);
            else this.startPillar.addToBetween(pillar,this.endPillar);
            this.PillarArray.push(pillar);
            pillar.setParentLine(this);
            pillar.setPillarIcon(this.visPillarAttr.PillarIconMap, null);
            return pillar;
        }
        
        moveLineRelativelyCoord(fixLatLng, oldLatLng, newLatLng)
        {
            var oldDelta=oldLatLng.lat-fixLatLng.lat;
            if (oldDelta==0) oldDelta=0.000000001;
            
            for (var i in this.PillarArray)
            {
                var pillar=this.PillarArray[i];
                var k=(pillar.getLatLng().lat-fixLatLng.lat)/oldDelta;
                var newLat=fixLatLng.lat+(newLatLng.lat-fixLatLng.lat)*k;
                var newLng=fixLatLng.lng+(newLatLng.lng-fixLatLng.lng)*k;
                pillar.noMove=true;
                pillar.setLatLng(L.latLng(newLat, newLng));
            }
        }
        
        transferPillarFromLines(firstLine,secondLine, centralPillar)
        {
            var firstPillar1=null;
            var lastPillar1=null;
            var firstPillar2=null;
            var lastPillar2=null;
            var k=firstLine.getDistance()/secondLine.getDistance();
            var StartLat=this.polyline.getLatLngs()[0].lat;
            var StartLng=this.polyline.getLatLngs()[0].lng;
            var EndLat=this.polyline.getLatLngs()[1].lat;
            var EndLng=this.polyline.getLatLngs()[1].lng;
            var deltaLat=(EndLat-StartLat);
            var deltaLng=(EndLng-StartLng);
            for (var i in firstLine.PillarArray)
            {
                var pillar=firstLine.PillarArray[i];
                this.PillarArray.push(pillar);
                pillar.setParentLine(this);
                if (!firstPillar1) firstPillar1=pillar;
                lastPillar1=pillar;
                var coordK=(firstLine.getDistanceFromStart(pillar.getLatLng())*k)/(firstLine.getDistance()*(1+k));
                pillar.noMove=true;
                pillar.setLatLng([StartLat+deltaLat*coordK,StartLng+deltaLng*coordK]);
            }
            if (centralPillar)
            {
                var pillar=firstLine.endPillar;
                this.PillarArray.push(pillar);
            }
            for (var i in secondLine.PillarArray)
            {
                var pillar=secondLine.PillarArray[i];
                this.PillarArray.push(pillar);
                pillar.setParentLine(this);
                if (!firstPillar2) firstPillar2=pillar;
                lastPillar2=pillar;
                var coordK=(secondLine.getDistanceFromStart(pillar.getLatLng())+k*secondLine.getDistance())/((1+k)*secondLine.getDistance());
                pillar.noMove=true;
                pillar.setLatLng([StartLat+deltaLat*coordK,StartLng+deltaLng*coordK]);
            }
            firstLine.PillarArray=[];
            secondLine.PillarArray=[];
            if (centralPillar)
            {
                var pillar=firstLine.endPillar;
                pillar.setParentLine(this);
                var coordK=(firstLine.getDistanceFromStart(pillar.getLatLng())*k)/(firstLine.getDistance()*(1+k));
                pillar.noMove=true;
                pillar.setLatLng([StartLat+deltaLat*coordK,StartLng+deltaLng*coordK]);
                return;
            }

            if (firstPillar1)
            {
                if (this.startPillar.pillarTap==firstPillar1.pillarTap) this.startPillar.setNextPillar(firstPillar1);
                firstPillar1.setPrevPillar(this.startPillar);
            }
            else if (firstPillar2)
            {
                if (this.startPillar.pillarTap==firstPillar2.pillarTap) this.startPillar.setNextPillar(firstPillar2);
                firstPillar2.setPrevPillar(this.startPillar);
            }
            else
            {
                if (this.startPillar.pillarTap==this.endPillar.pillarTap) this.startPillar.setNextPillar(this.endPillar);
                this.endPillar.setPrevPillar(this.startPillar);
            }
            
            if (lastPillar2)
            {
                this.endPillar.setPrevPillar(lastPillar2);
                lastPillar2.setNextPillar(this.endPillar);
            }
            else if (lastPillar1)
            {
                this.endPillar.setPrevPillar(lastPillar1);
                lastPillar1.setNextPillar(this.endPillar);
            }
            
            if (lastPillar1 && firstPillar2)
            {
                lastPillar1.setNextPillar(firstPillar2);
                firstPillar2.setPrevPillar(lastPillar1);
            }
        }
        
        setLineTap(lineTap)
        {
            this.lineTap=lineTap;
        }
        
        getDistance()
        {
          var latLngs=this.polyline.getLatLngs();
          return latLngs[0].distanceTo(latLngs[1]);
        }
        
        getDistanceFromStart(latLng)
        {
            var latLngs=this.polyline.getLatLngs();
            return latLngs[0].distanceTo(latLng);
        }
        
        removePillar(pillar)
        {
            var index = this.PillarArray.indexOf(pillar);
            if (index>-1) this.PillarArray.splice(index, 1);
        }
        
        selectLine()
        {
            this.polyline.setStyle({pulseColor: "#FF0000"});
        }
        
        unselectLine()
        {
            this.polyline.setStyle({pulseColor: "#0000FF"});
        }
    }