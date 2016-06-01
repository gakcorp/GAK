$("#map_button").click(function(e) {
        e.preventDefault();
        console.debug('Map button Click');
        sitemapslib.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        //$("#wrapper").toggleClass("toggled");
		});

$("#earth_button").click(function(e){
    e.preventDefault();
    console.debug('Earth button Click');
    sitemapslib.map.setMapTypeId(google.maps.MapTypeId.HYBRID);
});

$("#rosreestr_button").click(function(e){
    e.preventDefault();
    sitemapslib.toggle_layer('rosreestr')
    $("#rosreestr_button").toggleClass("selected_button");
});