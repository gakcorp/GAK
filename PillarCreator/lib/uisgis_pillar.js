var PillarMarker=L.Marker.extend(
      {
        prevPillar: null,
        nextPillar: null,
        num_by_vl: null,
        visPillarAttr: null,
        pillarTap: null,
        map: null,
        inputLine: null,
        outputLine: null,
        parentLine: null,
        tapsLine: null,
        pillarType: -1,
        pillarCut: -1,
        pillarMaterial: -1,
        id: -1,
        
        onMouseDown: function(event)
        {
          this.visPillarAttr.SelectPillar(this);
        },
        
        onMove: function(event)
        {
          if ((!this.options.isBase) && (!this.noMove))
          {
            var latPrevPillar=this.prevPillar.getLatLng().lat;
            var lngPrevPillar=this.prevPillar.getLatLng().lng;
            var latNextPillar=this.nextPillar.getLatLng().lat;
            var lngNextPillar=this.nextPillar.getLatLng().lng;
            var newDistance=this.prevPillar.getLatLng().distanceTo(event.latlng);
            var fullDistance=this.prevPillar.getLatLng().distanceTo(this.nextPillar.getLatLng());
            var k=newDistance/fullDistance;
            if (k>0.9999) k=0.9999;
            var newLat=latPrevPillar+(latNextPillar-latPrevPillar)*k;
            var newLng=lngPrevPillar+(lngNextPillar-lngPrevPillar)*k;
            this.noMove=true;
            this.setLatLng(L.latLng(newLat, newLng));
          }
          if (this.noMove)
          {
            this.noMove=false;
          }
          if (this.inputLine)
          {
            this.inputLine.setNewEndCoord(this.getLatLng());
          }
          if (this.outputLine)
          {
            this.outputLine.setNewStartCoord(this.getLatLng());
          }
          for (var i in this.tapsLine)
          {
            this.tapsLine[i].setNewStartCoord(this.getLatLng());
          }
          this.visPillarAttr.UpdateCoord();
        },
        
        initialize: function(latlng, options, map, visPillarAttr)
        {
          this.setLatLng(latlng);
          L.setOptions(this, options);
          this.on('mousedown',this.onMouseDown);
          this.on('move',this.onMove);
          this.visPillarAttr=visPillarAttr;
          this.map=map;
          this.tapsLine=[];
        },
        
        setPillarTap: function(TAP)
        {
          this.pillarTap=TAP;
          TAP.addPillar(this);
          if (this.inputLine)
          {
            this.inputLine.setLineTap(TAP);
          }
        },
        
        addToForward: function(forwardPillar)
        {
          forwardPillar.setPillarTap(this.pillarTap);
          if (!this.outputLine)
          {
            var aplLine=new AplLine([this.getLatLng(),forwardPillar.getLatLng()],this.map,this,forwardPillar);
            this.outputLine=aplLine;
            forwardPillar.inputLine=aplLine;
            this.nextPillar=forwardPillar;
            forwardPillar.prevPillar=this;
          }
          else
          {
            var oldEndPillar=this.outputLine.endPillar;
            this.outputLine.remove();
            this.outputLine=null;
            this.addToForward(forwardPillar);
            forwardPillar.addToForward(oldEndPillar);
            this.pillarTap.sortPillar(null);
          }
        },
        
        addToBack: function(backPillar)
        {
          backPillar.setPillarTap(this.pillarTap);
          if (!this.inputLine)
          {
            backPillar.addToForward(this);
            this.pillarTap.sortPillar(backPillar);
          }
          else
          {
            this.inputLine.startPillar.addToForward(backPillar);
          }
        },
        
        addToBetween: function(pillar, nextPillar)
        {
          pillar.nextPillar=nextPillar;
          pillar.prevPillar=this;
          nextPillar.prevPillar=pillar;
          pillar.visPillarAttr=this.visPillarAttr;
          pillar.setPillarTap(nextPillar.pillarTap);
          if (this.pillarTap==nextPillar.pillarTap)
          {
            this.nextPillar=pillar;
            this.pillarTap.sortPillar(null);
          }
          else
          {
            pillar.pillarTap.sortPillar(pillar);
          }
        },
        
        addToTap: function(pillar)
        {
          var aplLine=new AplLine([this.getLatLng(),pillar.getLatLng()],this.map,this,pillar);
          pillar.inputLine=aplLine;
          pillar.prevPillar=this;
          aplLine.setLineTap(pillar.pillarTap);
          this.tapsLine.push(aplLine);
        },
        
        setInputLine: function(aplLine)
        {
          this.inputLine=aplLine;
        },
        
        setOutputLine: function(aplLine)
        {
          this.outputLine=aplLine;
        },
        
        setNextPillar: function(pillar)
        {
          this.nextPillar=pillar;
        },
        
        setPrevPillar: function(pillar)
        {
          this.prevPillar=pillar;
        },
        
        setNumByVL: function(num_by_vl)
        {
          this.num_by_vl=num_by_vl;
          this.setPillarIcon(null);
        },
        
        setPillarIcon: function(actFillColor)
        {
          if (!this.pillarTap) return;
          var fillColor='#0000FF';
          var strokeColor='#0000FF';
          var contourColor='True';
          var strokeThick=1;
          for (var i of PillarMarker.PillarIconMap.keys())
          {
              if (PillarMarker.PillarIconMap.get(i).pillarType==this.pillarType && PillarMarker.PillarIconMap.get(i).pillarCut==this.pillarCut)
              {
                  if  (PillarMarker.PillarIconMap.get(i).fillColor) fillColor=PillarMarker.PillarIconMap.get(i).fillColor;
                  if  (PillarMarker.PillarIconMap.get(i).strokeColor) strokeColor=PillarMarker.PillarIconMap.get(i).strokeColor;
                  if  (PillarMarker.PillarIconMap.get(i).strokeThick) strokeThick=PillarMarker.PillarIconMap.get(i).strokeThick;
                  if  (PillarMarker.PillarIconMap.get(i).contourColor) contourColor=PillarMarker.PillarIconMap.get(i).contourColor;
                  if (contourColor=='False') fillColor='none';
                  if (actFillColor) fillColor=actFillColor;
                  var pillarIcon=new L.divIcon({html: '<svg width="30" height="30"><path fill="'+fillColor+'" stroke="'+strokeColor+'" stroke-width="'+strokeThick+'" d="'+PillarMarker.PillarIconMap.get(i).svg+'" transform="translate(5,5)"/><foreignObject class="node" width="30" height="15" x="15" y="15"><div style="color:'+strokeColor+'">'+this.num_by_vl+'</div></foreignObject></svg>', className: 'markerClass', iconAnchor: [10,10]});
                  this.setIcon(pillarIcon);
                  return;
              }
          }
          for (var i of PillarMarker.PillarIconMap.keys())
          {
              if (PillarMarker.PillarIconMap.get(i).pillarType==this.pillarType && PillarMarker.PillarIconMap.get(i).pillarCut==-1)
              {
                  if  (PillarMarker.PillarIconMap.get(i).fillColor) fillColor=PillarMarker.PillarIconMap.get(i).fillColor;
                  if  (PillarMarker.PillarIconMap.get(i).strokeColor) strokeColor=PillarMarker.PillarIconMap.get(i).strokeColor;
                  if  (PillarMarker.PillarIconMap.get(i).strokeThick) strokeThick=PillarMarker.PillarIconMap.get(i).strokeThick;
                  if  (PillarMarker.PillarIconMap.get(i).contourColor) contourColor=PillarMarker.PillarIconMap.get(i).contourColor;
                  if (contourColor=='False') fillColor='none';
                  if (actFillColor) fillColor=actFillColor;
                  var pillarIcon=new L.divIcon({html: '<svg width="30" height="30"><path fill="'+fillColor+'" stroke="'+strokeColor+'" stroke-width="'+strokeThick+'" d="'+PillarMarker.PillarIconMap.get(i).svg+'" transform="translate(5,5)"/><foreignObject class="node" width="30" height="15" x="15" y="15"><div style="color:'+strokeColor+'">'+this.num_by_vl+'</div></foreignObject></svg>', className: 'markerClass', iconAnchor: [10,10]});
                  this.setIcon(pillarIcon);
                  return;
              }
          }
          i="2";
          if  (PillarMarker.PillarIconMap.get(i).fillColor) fillColor=PillarMarker.PillarIconMap.get(i).fillColor;
          if  (PillarMarker.PillarIconMap.get(i).strokeColor) strokeColor=PillarMarker.PillarIconMap.get(i).strokeColor;
          if  (PillarMarker.PillarIconMap.get(i).strokeThick) strokeThick=PillarMarker.PillarIconMap.get(i).strokeThick;
          if  (PillarMarker.PillarIconMap.get(i).contourColor) contourColor=PillarMarker.PillarIconMap.get(i).contourColor;
          if (contourColor=='False') fillColor='none';
          if (actFillColor) fillColor=actFillColor;
          var pillarIcon=new L.divIcon({html: '<svg width="30" height="30"><path fill="'+fillColor+'" stroke="'+strokeColor+'" stroke-width="'+strokeThick+'" d="'+PillarMarker.PillarIconMap.get(i).svg+'" transform="translate(5,5)"/><foreignObject class="node" width="30" height="15" x="15" y="15"><div style="color:'+strokeColor+'">'+this.num_by_vl+'</div></foreignObject></svg>', className: 'markerClass', iconAnchor: [10,10]});
          this.setIcon(pillarIcon);
        },
        
        setParentLine: function(parentLine)
        {
          this.parentLine=parentLine;
        },
        
        setPillarType: function(pillarType)
        {
          this.pillarType=pillarType;
        },
        
        setPillarCut: function(pillarCut)
        {
          this.pillarCut=pillarCut;
        },
        
        setPillarMaterial: function(pillarMaterial)
        {
          this.pillarMaterial=pillarMaterial;
        },
        
        remove: function()
        {
          this.visPillarAttr.HidePillarControl();
          this.map.removeLayer(this);
          if (this.inputLine && this.outputLine)
          {
            var startPillar=this.inputLine.startPillar;
            var endPillar=this.outputLine.endPillar;
            if (startPillar.pillarTap==this.pillarTap)
            {
              startPillar.outputLine=null
              endPillar.inputLine=null;
              startPillar.addToForward(endPillar);
              startPillar.outputLine.transferPillarFromLines(this.inputLine,this.outputLine,false);
              this.inputLine.remove();
              this.outputLine.remove();
              this.pillarTap.sortPillar(null);
            }
            else
            {
              ///Отпайка///
              var aplLine=new AplLine([startPillar.getLatLng(),endPillar.getLatLng()],this.map,startPillar,endPillar);
              var removeLineIndex=startPillar.tapsLine.indexOf(this.inputLine);
              if (removeLineIndex) startPillar.tapsLine.splice(removeLineIndex, 1);
              startPillar.tapsLine.push(aplLine);
              endPillar.inputLine=aplLine;
              aplLine.transferPillarFromLines(this.inputLine,this.outputLine,false);
              this.inputLine.remove();
              this.outputLine.remove();
              this.inputLine=null;
              this.outputLine=null;
              if (this.num_by_vl==1) this.pillarTap.sortPillar(this.nextPillar);
              else this.pillarTap.sortPillar(null);
            }
            console.log(startPillar.nextPillar.num_by_vl+"   "+endPillar.prevPillar.num_by_vl);
          }
          else
          {
            if (this.inputLine)
            {
              var startPillar=this.inputLine.startPillar;
              if (startPillar.pillarTap==this.pillarTap)
              {
                startPillar.outputLine=null;
                startPillar.nextPillar=null;
                this.inputLine.remove();
                this.pillarTap.sortPillar(null);
              }
              else
              {
                //отпайка
                var removeLineIndex=startPillar.tapsLine.indexOf(this.inputLine);
                if (removeLineIndex) startPillar.tapsLine.splice(removeLineIndex, 1);
                this.inputLine.remove();
                this.inputLine=null;
                this.pillarTap.remove();
              }
            }
            else
            {
              if (this.outputLine)
              {
                var endPillar=this.outputLine.endPillar;
                endPillar.inputLine=null;
                endPillar.prevPillar=null;
                this.outputLine.remove();
                this.pillarTap.sortPillar(endPillar);
              }
              else
              {
                if (this.prevPillar)
                {
                  this.prevPillar.nextPillar=this.nextPillar;
                }
                if (this.nextPillar)
                {
                  this.nextPillar.prevPillar=this.prevPillar;
                }
                if (!this.prevPillar || !this.nextPillar) this.pillarTap.remove();
                this.pillarTap.sortPillar(null);
              }
            }
          }
          for (var i in this.tapsLine)
          {
            this.tapsLine[i].endPillar.pillarTap.remove();
          }
          if (this.parentLine)
          {
            this.parentLine.removePillar(this);
          }
          /////Запоминаем только удаленные опоры с id из Odoo/////
          if ((this.id!=-1) && (String(this.id).indexOf('ext_')==-1))
          {
            this.visPillarAttr.removePillars.push(this.id);
          }
        },
        
        getJSON()
        {
          var JSON={};
          if (this.id!=-1) JSON.id=this.id
          else
          {
            JSON.id='ext_'+this.visPillarAttr.id_counter;
            this.id=JSON.id;
            this.visPillarAttr.id_counter++;
          }
          JSON.num_by_vl=this.num_by_vl;
          JSON.apl_id=this.visPillarAttr.actAPL.id;
          JSON.tap_id=this.pillarTap.id;
          JSON.pillar_material_id=this.pillarMaterial;
          JSON.pillar_type_id=this.pillarType;
          JSON.pillar_cut_id=this.pillarCut;
          JSON.latitude=this.getLatLng().lat;
          JSON.longitude=this.getLatLng().lng;
          if (this.prevPillar)
          {
            if (this.prevPillar.id==-1)
            {
              this.prevPillar.id='ext_'+this.visPillarAttr.id_counter;
              this.visPillarAttr.id_counter++;
            }
            JSON.parent_id=this.prevPillar.id
          }
          if (this.inputLine)
          {
            if (this.inputLine.startPillar.id==-1)
            {
              this.inputLine.startPillar.id='ext_'+this.visPillarAttr.id_counter;
              this.visPillarAttr.id_counter++;
            }
            JSON.prev_base_pillar_id=this.inputLine.startPillar.id;
          }
          if (this.parentLine)
          {
            if (this.parentLine.startPillar.id==-1)
            {
              this.parentLine.startPillar.id='ext_'+this.visPillarAttr.id_counter;
              this.visPillarAttr.id_counter++;
            }
            JSON.prev_base_pillar_id=this.parentLine.startPillar.id;
          }
          return JSON;
        },
        
        toBase()
        {
          this.options.isBase=true;
          
          var nextBasePillar=this.parentLine.endPillar;
          var aplLine=new AplLine([this.getLatLng(),nextBasePillar.getLatLng()],this.map,this,nextBasePillar);
          this.outputLine=aplLine;
          nextBasePillar.inputLine=aplLine;
          var nextPillar=this.nextPillar;
          while(!nextPillar.options.isBase)
          {
            nextPillar.parentLine=aplLine;
            aplLine.PillarArray.push(nextPillar);
            nextPillar=nextPillar.nextPillar;
          }
          
          var prevBasePillar=this.parentLine.startPillar;
          aplLine=new AplLine([prevBasePillar.getLatLng(),this.getLatLng()],this.map,prevBasePillar,this);
          this.inputLine=aplLine;
          if (this.pillarTap==prevBasePillar.pillarTap)
          {
            prevBasePillar.outputLine=aplLine;
          }
          else
          {
            var removeLineIndex=prevBasePillar.tapsLine.indexOf(this.parentLine);
            if (removeLineIndex) prevBasePillar.tapsLine.splice(removeLineIndex, 1);
            prevBasePillar.tapsLine.push(aplLine);
          }
          var prevPillar=this.prevPillar;
          while((!prevPillar.options.isBase) && (this.pillarTap==prevPillar.pillarTap))
          {
            prevPillar.parentLine=aplLine;
            aplLine.PillarArray.unshift(prevPillar);
            prevPillar=prevPillar.prevPillar;
          }
          this.parentLine.PillarArray=[];
          this.parentLine.remove();
          this.parentLine=null;
        },
        
        toNoBase()
        {
          if (this.inputLine && this.outputLine)
          {
            var startPillar=this.inputLine.startPillar;
            var endPillar=this.outputLine.endPillar;
            if (startPillar.pillarTap==this.pillarTap)
            {
              var aplLine=new AplLine([startPillar.getLatLng(),endPillar.getLatLng()],this.map,startPillar,endPillar);
              startPillar.outputLine=aplLine;
              endPillar.inputLine=aplLine;
              aplLine.transferPillarFromLines(this.inputLine,this.outputLine,true);
              this.inputLine.remove();
              this.outputLine.remove();
              this.inputLine=null;
              this.outputLine=null;
            }
            else
            {
              var aplLine=new AplLine([startPillar.getLatLng(),endPillar.getLatLng()],this.map,startPillar,endPillar);
              var removeLineIndex=startPillar.tapsLine.indexOf(this.inputLine);
              if (removeLineIndex) startPillar.tapsLine.splice(removeLineIndex, 1);
              startPillar.tapsLine.push(aplLine);
              endPillar.inputLine=aplLine;
              aplLine.transferPillarFromLines(this.inputLine,this.outputLine,true);
              this.inputLine.remove();
              this.outputLine.remove();
              this.inputLine=null;
              this.outputLine=null;
              if (!this.prevPillar) this.prevPillar=startPillar;
            }
            this.options.isBase=false;
          }
        },
        
        isBaseByType()
        {
          var pillarType=this.visPillarAttr.PillarTypeMap.get(String(this.pillarType));
          if (pillarType) return pillarType.isBase;
          else return false;
        },
        
      });