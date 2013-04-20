;(function($, window) {
	
	var jQT, map;
	
	jQT = $.jQTouch({
				statusBar: 'black'
	});
		
	$(document).ready(function() {
		
		
		map = $("#map").gmap();
		map.init();
		
		var goHome = function() {
			$("a[href='#home']").click();
		}
		
		$("#home").bind('pageAnimationEnd', function(event, info) {
			if (info.direction == "in") {
				$("#map").show();
				google.maps.event.trigger(map.map, 'resize');
				map.map.fitBounds(map.bounds);
			}
			return false;
		});
	
		//marker form
		$("#new-marker").submit(function(e) {
			var $t      = $(this);
			var $name   = $t.find("#name");
			var $street = $t.find("#street");
			var $city   = $t.find("#city");
			var $state  = $t.find("#state");
			var $zip    = $t.find("#zip");
			
			var address = [
				$street.val(),
				$city.val(),
				$state.val(),
				$zip.val()
			];
			
			var resetFields = function() {
				$name.val("");
				$street.val("");
				$city.val("");
				$state.val("");
				$zip.val("");
			}
			
			map.geocode(address.join(" "), function(response) {
				if(response.success) {	
					var lat = response.results[0].geometry.location.lat();
					var lng = response.results[0].geometry.location.lng();
					
					if(!map.hasLatLng(lat, lng)) {
						var index = map.getOpenIndex();
						console.log("openindex =" + index);
						var marker = map.addMarker(lat, lng, $name.val(), index);
						map.saveRow({name: $name.val(), street: $street.val(), city: $city.val(), state: $state.val(), zip: $zip.val(), lat: lat, lng: lng, index: index});
						resetFields();
						goHome();
					} else {
						alert('\"' + $.trim(address.join(" ")) + '\" already has a marker. Enter a different address.' );
					}
				} else {
					alert("Invalid address. Enter a different address.");
				}
			});
			
			e.preventDefault();
		});
		
		$("#edit-marker").submit(function(e) {
			var $t      = $(this);
			var $name   = $t.find("#name");
			var $street = $t.find("#street");
			var $city   = $t.find("#city");
			var $state  = $t.find("#state");
			var $zip    = $t.find("#zip");
			var index = $t.attr("value");			
			var row = map.getRow(index);
			
			console.log(index);
			
			var address = [
				$street.val(),
				$city.val(),
				$state.val(),
				$zip.val()
			];
			
			var resetFields = function() {
				$name.val("");
				$street.val("");
				$city.val("");
				$state.val("");
				$zip.val("");
			}
			
			map.geocode(address.join(" "), function(response) {
				if(response.success) {	
					var lat = response.results[0].geometry.location.lat();
					var lng = response.results[0].geometry.location.lng();
					
					if(!map.hasLatLng(lat, lng)) {
						for(var i=0, len=map.markers.length; i<len; i++) {
							if(map.markers[i].index==index) {
								map.moveMarker(map.markers[i], lat, lng);
							}
						}
						map.updateRow(index, {name: $name.val(), street: $street.val(), city: $city.val(), state: $state.val(), zip: $zip.val(), lat: lat, lng: lng});
						resetFields();
						goHome();
					} else if($name.val() != row.name){
						map.updateRow(index, {name: $name.val(), street: $street.val(), city: $city.val(), state: $state.val(), zip: $zip.val(), lat: lat, lng: lng});
						for(var i=0, len=map.markers.length; i<len; i++){
							if (map.markers[i].index === index) {
								map.markers[i].setTitle($name.val());
								break;
							}
						}
						resetFields();
						goHome();
					} else if($street.val() === row.street || $city.val() === row.city || $state.val() === row.state || $zip.val() === row.zip) {
						resetFields();
						goHome();
					} else {
						alert('\"' + $.trim(address.join(" ")) + '\" already has a marker. Enter a different address.' );
					}
				} else {
					alert("Invalid address. Enter a different address.");
				}
			});
			
			e.preventDefault();
		});
		
		$("#delete-everything").bind("click", function(e){
			if(confirm("Delete everything?")) {
				map.deleteMarkers();
				map.init();
			}
		});
		
		$("#delete-marker").bind("click", function(e){			
			var index = $("#edit-marker").attr("value");
			/*var i, len;
			for(i = 0, len = map.markers.length; i<len; ++i) { //find index of marker to remove
				if (map.markers[i].index==index) {
					break;
				}				
			}*/
			
			if(confirm("Delete this marker?")) {
				map.markers = [];
				map.deleteRow(index);
			}
			
			map.init();
			goHome();
		});
		
		$("#search").submit(function(e){
			var $t = $(this);
			var $loc = $t.find("#location");
			var $dist = $t.find("#distance");
			var loc = $loc.val();
			var dist = $dist.val();
			var circles = [];
			var circle;
			
			if (loc) {
				map.geocode(loc, function(response) {
					if(response.success) {	
						var lat = response.results[0].geometry.location.lat();
						var lng = response.results[0].geometry.location.lng();
						
						map.setCenter(lat, lng);
					
						if (dist) {
							var options = {
								center: new google.maps.LatLng(lat, lng),
								map: map.map,
								radius: dist*1000,
								fillColor: "green",
							}
							circle = new google.maps.Circle(options);
							circles.push(circle);
							var bounds = circle.getBounds();
							map.map.fitBounds(bounds);
							
							//map.getDist(circle.getCenter(), map.markers[0].getPosition());
							
							//only display markers within circle
							for(var i=0, len=map.markers.length; i<len; i++){
								if(map.getDist(circle.getCenter(), map.markers[i].getPosition()) < dist){
									map.markers[i].setVisible(true);
								} else {
									map.markers[i].setVisible(false);
								}
							}
						}
						
						$("#clear").show().bind("click", function(e){
							$loc.val("");
							map.map.fitBounds(map.bounds);
							$(this).hide();
							for(var i=0, len=circles.length; i<len; i++)
								circles.pop().setVisible(false);
							for(var i=0, len=map.markers.length; i<len; i++)
								map.markers[i].setVisible(true);
						});
					}
				});
			}
			e.preventDefault();
		});
		
		console.log(map.markers);
		console.log(map.db.query("markerTable"));
	});
}(jQuery, this));