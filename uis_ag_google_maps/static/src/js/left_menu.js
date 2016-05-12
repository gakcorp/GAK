$("#map_button").click(function(e) {
        e.preventDefault();
        console.debug('Map button Click');
        map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        //$("#wrapper").toggleClass("toggled");
		});

$("#earth_button").click(function(e){
    e.preventDefault();
    console.debug('Earth button Click');
    map.setMapTypeId(google.maps.MapTypeId.HYBRID);
});

$("#rosreestr_button").click(function(e){
    e.preventDefault();
    console.debug('Earth button Click');
    if (rosreestr_show==1) {
        rosreestr_show=0;
        map.overlayMapTypes.push(RosreestrMapType);
        $("#rosreestr_button").toggleClass("selected_button");
        }
    else{
        map.overlayMapTypes.clear();
        rosreestr_show=1;
        $("#rosreestr_button").toggleClass("selected_button");
        }
});