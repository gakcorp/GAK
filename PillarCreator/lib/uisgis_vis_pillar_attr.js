class VisPillarAttr
{
    constructor(mainDiv,TapMap, PillarTypeMap, PillarCutMap, PillarMaterialMap, actAPL,map,id_counter, removePillars,FileName)
    {
        this.mainDiv=mainDiv;
        this.TapMap=TapMap;
        this.PillarTypeMap=PillarTypeMap;
        this.PillarCutMap=PillarCutMap;
        this.PillarMaterialMap=PillarMaterialMap;
        this.actAPL=actAPL;
        this.map=map
        this.rosreestr=true;
        this.baseLayer="Arcgis";
        this.id_counter=id_counter;
        this.removePillars=removePillars;
        this.FileName=FileName;
        mainDiv.append("<img id='addPillarToForward' src='./images/addPillarToForward.png' class='icon'>");
        mainDiv.append("<img id='addPillarToBack' src='./images/addPillarToBack.png' class='icon'>");
        mainDiv.append("<img id='addTapPillar' src='./images/addTapPillar.png' class='icon'>");
        mainDiv.append("<img id='deletePillar' src='./images/deletePillar.png' class='icon'>");
        mainDiv.append("<img id='addLinePillar' src='./images/addLinePillar.png' class='icon'>");
        mainDiv.append("<img id='Save' src='./images/Save.png' class='icon'>");
        mainDiv.append("<img id='newTap' src='./images/newTap.png' class='icon'>");
        mainDiv.append("<div id='div_pillar_vl_num' class='controlText controlInput'><label for='pillar_vl_num'>Номер опоры: </label><input id='pillar_vl_num' disabled></div>");
        mainDiv.append("<div id='div_pillar_latitude' class='controlText controlInput'><label for='pillar_latitude'>Широта опоры: </label><input id='pillar_latitude'></div>");
        mainDiv.append("<div id='div_pillar_longitude' class='controlText controlInput'><label for='pillar_longitude'>Долгота опоры: </label><input id='pillar_longitude'></div>");
        mainDiv.append("<div id='div_pillar_tap_id' class='controlText controlInput'><label for='pillar_tap_id'>Отпайка: </label><select id='pillar_tap_id'></select></div>");
        mainDiv.append("<div id='div_pillar_type' class='controlText controlInput'><label for='pillar_type'>Тип опоры: </label><select id='pillar_type'></select></div>");
        mainDiv.append("<div id='div_pillar_cut' class='controlText controlInput'><label for='pillar_cut'>Сечение опоры: </label><select id='pillar_cut'></select></div>");
        mainDiv.append("<div id='div_pillar_material' class='controlText controlInput'><label for='pillar_material'>Материал опоры: </label><select id='pillar_material'></select></div>");
        mainDiv.append("<div id='div_line_tap_id' class='controlText controlInput'><label for='line_tap_id'>Отпайка: </label><input id='line_tap_id'></div>");
        mainDiv.append("<div id='div_line_length' class='controlText controlInput'><label for='line_length'>Длина линии: </label><input id='line_length'></div>");
        $('#pillar_tap_id').append($("<option selected disabled hidden></option>").attr("value",-1));
        $('#pillar_type').append($("<option selected disabled hidden></option>").attr("value",-1));
        $('#pillar_cut').append($("<option selected disabled hidden></option>").attr("value",-1));
        $('#pillar_material').append($("<option selected disabled hidden></option>").attr("value",-1));
        this.addPillarToForwardSelect=false;
        this.addPillarToBackSelect=false;
        this.addTapPillarSelect=false
        $("#addTapPillar").hide();
        $("#deletePillar").hide();
        $("#addLinePillar").hide();
        $("#div_line_tap_id").hide();
        $("#div_line_length").hide();
        for (var i of TapMap.keys())
        {
            $('#pillar_tap_id').append($("<option></option>").attr("value",i).text(TapMap.get(i).name));
        }
        for (var i of PillarTypeMap.keys())
        {
            $('#pillar_type').append($("<option></option>").attr("value",i).text(PillarTypeMap.get(i).name));
        }
        for (var i of PillarCutMap.keys())
        {
            $('#pillar_cut').append($("<option></option>").attr("value",i).text(PillarCutMap.get(i)));
        }
        for (var i of PillarMaterialMap.keys())
        {
            $('#pillar_material').append($("<option></option>").attr("value",i).text(PillarMaterialMap.get(i)));
        }
        var visPillarAttr=this;
        $("#addPillarToForward").on('click', function()
        {
           visPillarAttr.addPillarToForward();
        });
        $("#addPillarToBack").on('click', function()
        {
           visPillarAttr.addPillarToBack();
        });
        $("#deletePillar").on('click', function()
        {
           visPillarAttr.deletePillar();
        });
        $('#addLinePillar').on('click',function()
        {
            visPillarAttr.addLinePillar();
        });
        $("#addTapPillar").on('click', function()
        {
           visPillarAttr.addTapPillar();
        });
        $("#Save").on('click', function()
        {
           visPillarAttr.Save();
        });
        $("#newTap").on('click', function()
        {
           visPillarAttr.newTap();
        });
        $('#pillar_tap_id').on('change',function()
        {
            visPillarAttr.ChangeTapID();
        });
        $('#pillar_type').on('change',function()
        {
            visPillarAttr.ChangePillarType();
        });
        $('#pillar_cut').on('change',function()
        {
            visPillarAttr.ChangePillarCut();
        });
        $('#pillar_material').on('change',function()
        {
            visPillarAttr.ChangePillarMaterial();
        });
        
        map.on('baselayerchange', function (event)
        {
            visPillarAttr.baseLayer=event.name;
        });
        
        try
        {
            var layerControlElement = document.getElementsByClassName('leaflet-control-layers-overlays')[0];
            layerControlElement.getElementsByTagName('input')[0].click();
            this.rosreestr=false;
        }
        catch (err)
        {     
        }
        
        map.on('overlayadd', function (event)
        {
            visPillarAttr.rosreestr=true
        });
                            
        map.on('overlayremove', function (event)
        {
            visPillarAttr.rosreestr=false;
        });
      
    }
    
    SelectPillar(actPillar)
    {
        if (this.actLine) this.UnselectLine();
        if (this.actPillar)
        {
            if (this.actPillar!=actPillar)
            {
                this.UnselectPillar();
                this.actPillar=actPillar;
                this.actPillar.setPillarIcon("#FF0000");
                this.UpdatePillarProps(0);
            }
        }
        else
        {
            this.actPillar=actPillar;
            this.actPillar.setPillarIcon("#FF0000");
            this.UpdatePillarProps();
        }
    }
    
    UnselectPillar()
    {
        this.actPillar.setPillarIcon(null);
        this.actPillar=null;
    }
    
    SelectLine(actLine)
    {
        if (this.actLine) this.UnselectLine();
        actLine.selectLine();
        if (this.actPillar) this.UnselectPillar();
        this.actLine=actLine;
        this.HidePillarControl();
        $("#div_line_tap_id").show();
        $("#div_line_length").show();
        $("#addLinePillar").show();
        $('#line_tap_id').val(actLine.lineTap.name);
        $("#line_length").val(Math.round(actLine.getDistance() * 100) / 100);
    }
    
    UnselectLine()
    {
        if (!this.actLine) return;
        this.actLine.unselectLine();
        this.actLine=null;
    }
    
    HidePillarControl()
    {
        $("#addPillarToForward").hide();
        $("#addPillarToBack").hide();
        $("#addTapPillar").hide();
        $("#deletePillar").hide();
        $("#div_pillar_vl_num").hide();
        $("#div_pillar_latitude").hide();
        $("#div_pillar_longitude").hide();
        $("#div_pillar_tap_id").hide();
        $('#div_pillar_type').hide();
        $('#div_pillar_cut').hide();
        $('#div_pillar_material').hide();
    }
    
    UpdateCoord()
    {
        if (!this.actPillar) return;
        $('#pillar_latitude').val(this.actPillar.getLatLng().lat);
        $('#pillar_longitude').val(this.actPillar.getLatLng().lng);
    }
    
    UpdatePillarProps()
    {
        if (!this.actPillar) return;
        $("#div_pillar_vl_num").show();
        $("#div_pillar_latitude").show();
        $("#div_pillar_longitude").show();
        $("#div_pillar_tap_id").show();
        $('#div_pillar_type').show();
        $('#div_pillar_cut').show();
        $('#div_pillar_material').show();
        $("#div_line_tap_id").hide();
        $("#div_line_length").hide();
        $("#addLinePillar").hide();
        $('#pillar_vl_num').val(this.actPillar.num_by_vl);
        $('#pillar_latitude').val(this.actPillar.getLatLng().lat);
        $('#pillar_longitude').val(this.actPillar.getLatLng().lng);
        if (this.actPillar.pillarTap!=null)
        {
            $('#pillar_tap_id').val(this.actPillar.pillarTap.id);
        }
        else
        {
            $('#pillar_tap_id').val(-1);
        }
        if (this.actPillar.pillarType!=null)
        {
            $('#pillar_type').val(this.actPillar.pillarType);
        }
        if (this.actPillar.pillarCut!=null)
        {
            $('#pillar_cut').val(this.actPillar.pillarCut);
        }
        else
        {
            $('#pillar_type').val(-1);
        }
        if (this.actPillar.pillarMaterial!=null)
        {
            $('#pillar_material').val(this.actPillar.pillarMaterial);
        }
        else
        {
            $('#pillar_material').val(-1);
        }
        if (this.actPillar.pillarTap==null)
        {
            $("#addPillarToForward").hide();
            $("#addPillarToBack").hide();
            $("#addTapPillar").hide();
        }
        else
        {
        if (this.actPillar.options.isBase)
        {
                $("#addPillarToForward").show();
                $("#addPillarToBack").show();
                $("#addTapPillar").show();
                if (this.actPillar.inputLine)
                {
                    if (this.actPillar.inputLine.startPillar.outputLine!=this.actPillar.inputLine)  $("#addPillarToBack").hide(); 
                }
                $("#deletePillar").show();
            }
            else
            {
                $("#addPillarToForward").hide();
                $("#addPillarToBack").hide();
                $("#addTapPillar").show();
                $("#deletePillar").show();
            }
        }
    }
    
    ChangeTapID()
    {
        if (!this.actPillar) return;
        if (!this.actPillar.pillarTap)
        {
            var TAP=this.TapMap.get($('#pillar_tap_id').val());
            if (TAP.GetPillarsCount()>0)
            {
                alert("Данная отпайка уже содержит другие опоры - сначала удалите их или переместите на другую отпайку");
                this.UpdatePillarProps();
                return;
            }
            this.actPillar.setPillarTap(TAP);
            this.UpdatePillarProps();
            this.actPillar.setPillarIcon("#FF0000");
        }
        else
        {
            var oldPillarTap=this.actPillar.pillarTap;
            var newPillarTap=this.TapMap.get($('#pillar_tap_id').val());
            if (oldPillarTap!=newPillarTap)
            {
                newPillarTap.CopyPillarFrom(oldPillarTap);
                this.UpdatePillarProps();
            }
        }
    }
    
    ChangePillarType()
    {
        if (this.actPillar)
        {
            this.actPillar.setPillarType($('#pillar_type').val());
            if (this.actPillar.pillarTap) this.actPillar.setPillarIcon("#FF0000");
            if (!(this.actPillar.options.isBase) && (this.PillarTypeMap.get($('#pillar_type').val()).isBase))
            {
                this.actPillar.toBase();
            }
            if ((this.actPillar.options.isBase) && !(this.PillarTypeMap.get($('#pillar_type').val()).isBase))
            {
                this.actPillar.toNoBase();
            }
        }
    }
    
    ChangePillarCut()
    {
        if (this.actPillar)
        {
            this.actPillar.setPillarCut($('#pillar_cut').val());
            this.actPillar.setPillarIcon("#FF0000");
        }
    }
    
    ChangePillarMaterial()
    {
        if (this.actPillar)
        {
            this.actPillar.setPillarMaterial($('#pillar_material').val());
        }
    }
    
    addPillarToForward()
    {
        if (!this.addPillarToForwardSelect)
        {
            this.addPillarToForwardSelect=true;
            $('.leaflet-container').css('cursor','crosshair');
            $("#addPillarToForward").css("border","2px solid orange");
        }
    }
    
    addPillarToBack()
    {
        if (!this.addPillarToBackSelect)
        {
            this.addPillarToBackSelect=true;
            $('.leaflet-container').css('cursor','crosshair');
            $("#addPillarToBack").css("border","2px solid orange");
        }
    }
    
    addTapPillar()
    {
        if (!this.addTapPillarSelect)
        {
            this.addTapPillarSelect=true;
            $('.leaflet-container').css('cursor','crosshair');
            $("#addTapPillar").css("border","2px solid orange");
        }
    }
    
    addPillar(e)
    {
        if (this.actPillar)
        {
            if (!this.actPillar.pillarTap)
            {
              alert('Проставьте отпайку');
              this.addPillarToForwardSelect=false;
              this.addPillarToBackSelect=false;
              $('.leaflet-container').css('cursor','');
              return;
            }
        }
        var marker = new PillarMarker(e.latlng,{draggable: true, isBase: true},this.map, this).addTo(this.map);
        this.setAngularPillar(marker);
        if (this.actPillar && this.addPillarToForwardSelect)
        {
            this.actPillar.addToForward(marker);
        }
        if (this.actPillar && this.addPillarToBackSelect)
        {
            this.actPillar.addToBack(marker);
        }
        this.SelectPillar(marker);
        this.addPillarToForwardSelect=false;
        this.addPillarToBackSelect=false;
        $('.leaflet-container').css('cursor','');
        $("#addPillarToForward").css("border","2px solid white");
        $("#addPillarToBack").css("border","2px solid white");
    }
    
    addPillarToTap(e)
    {
        var marker = new PillarMarker(e.latlng,{draggable: true, isBase: true},this.map, this).addTo(this.map);
        this.setAngularPillar(marker);
        this.actPillar.addToTap(marker);
        this.SelectPillar(marker);
        this.addTapPillarSelect=false;
        $('.leaflet-container').css('cursor','');
        $("#addTapPillar").css("border","2px solid white");
    }
    
    deletePillar()
    {
        if (this.actPillar)
        {
            this.actPillar.remove();
            this.actPillar=null;
        }
    }
    
    addLinePillar()
    {
        if (this.actLine)
        {
            var pillar=this.actLine.addPillarToLine();
            this.setIntermediatePillar(pillar);
        }
    }
    
    Save()
    {
        var MapJSON={};
        MapJSON.id=this.actAPL.id;
        MapJSON.name=this.actAPL.name;
        MapJSON.mapLatitude=this.map.getCenter().lat;
        MapJSON.mapLongitude=this.map.getCenter().lng;
        MapJSON.mapZoom=this.map.getZoom();
        MapJSON.rosreestr=this.rosreestr;
        MapJSON.baseLayer=this.baseLayer;
        MapJSON.removePillars=this.removePillars;
        var tapsArray=[];
        for (var i of this.TapMap.keys())
        {
            var tapJSON={};
            var Tap=this.TapMap.get(i);
            tapJSON.id=Tap.id;
            tapJSON.name=Tap.name;
            var pillarsArray=[];
            for (var k of Tap.PillarMap.keys())
            {
                var pillar=Tap.PillarMap.get(k);
                pillarsArray.push(pillar.getJSON());
            }
            tapJSON.pillarsArray=pillarsArray;
            tapsArray.push(tapJSON);
        }
        MapJSON.tapsArray=tapsArray;
        MapJSON.id_counter=this.id_counter;
        var blob = new Blob([JSON.stringify(MapJSON)], {type: "text/plain;charset=utf-8"});
        if (this.FileName) saveAs(blob, this.FileName);
        else saveAs(blob, this.actAPL.name+".txt");
    }
    
    setIntermediatePillar(pillar)
    {
        for (var i of this.PillarTypeMap.keys())
        {
            if (this.PillarTypeMap.get(i).isIntermediate())
            {
                pillar.setPillarType(this.PillarTypeMap.get(i).id);
            }
        }
    }
    
    setAngularPillar(pillar)
    {
        for (var i of this.PillarTypeMap.keys())
        {
            if (this.PillarTypeMap.get(i).isAngular())
            {
                pillar.setPillarType(this.PillarTypeMap.get(i).id);
            }
        }
    }
    
    newTap()
    {
        this.mainDiv.hide();
        var newTapDiv=$("<div class='controlText controlInput'></div>");
        $('#controlpanel').append(newTapDiv);
        newTapDiv.append("<label for='new_tap_name'>Введите имя отпайки:    </label><input type='text' id='new_tap_name'></input>");
        newTapDiv.append("<button id='new_tap_create' style='margin-right: 10px; margin-top: 15px'>Создать</button>");
        newTapDiv.append("<button id='new_tap_cancel' style='margin-right: 10px; margin-top: 15px'>Отмена</button>");
        
        var visPillarAttr=this;
        
        $("#new_tap_create").on('click', function()
        {
            if ($('#new_tap_name').val())
            {
                var newTap=new Tap("ext_"+visPillarAttr.id_counter,$('#new_tap_name').val());
                visPillarAttr.id_counter++;
                visPillarAttr.actAPL.pushTap(newTap);
                $('#pillar_tap_id').find('option').remove();
                $('#pillar_tap_id').append($("<option selected disabled hidden></option>").attr("value",-1));
                for (var i of visPillarAttr.TapMap.keys())
                {
                    $('#pillar_tap_id').append($("<option></option>").attr("value",i).text(visPillarAttr.TapMap.get(i).name));
                }
                $("#new_tap_create").unbind('click');
                $("#new_tap_cancel").unbind('click');
                newTapDiv.remove();
                visPillarAttr.mainDiv.show();
            }
            else
            {
                alert("Введите имя отпайки");
                return;
            }
        });
        
        $("#new_tap_cancel").on('click', function()
        {
            $("#new_tap_create").unbind('click');
            $("#new_tap_cancel").unbind('click');
            newTapDiv.remove();
            visPillarAttr.mainDiv.show();
        });
    }
}