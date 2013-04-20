;(function($) {

	var gmap = function(obj, options) {
		var $mapDiv = $(obj);
		var _DB = "markerDB";
		var _TABLE = "markerTable";
	
		var t = {
			bounds: new google.maps.LatLngBounds(),
			db: new localStorageDB(_DB, localStorage),
			geocoder: new google.maps.Geocoder(),
			map: false,
			mapDiv: $mapDiv,
			mapOptions: {
				center: new google.maps.LatLng(39.76, -86.15), 
				mapTypeId: google.maps.MapTypeId.HYBRID, 
				scrollwheel: false,
				zoom: 8,
			},
			markers: [],
		}
		
		//merge options into object
		if(options) {
			t = $.extend(true, t, options);
		}
		
		t.init = function(options) {
		
			t.bounds = new google.maps.LatLngBounds();
		
			if(options) {
				t.mapOptions = $.extend(true, t.mapOptions, options);	
			}
			t.map = new google.maps.Map(t.mapDiv[0], t.mapOptions);
			
			if(!t.db.tableExists(_TABLE)) {
				t.db.createTable(_TABLE, ["name", "street", "city", "state", "zip", "lat", "lng", "index"]);
				t.db.commit();
			} else {
				t.db.query(_TABLE, function(row){
					t.addMarker(row.lat, row.lng, row.name, row.index);
				});
			}
				
			if(t.markers.length>1) {
				t.map.fitBounds(t.bounds);
			} else if (t.markers.length==1) {
				t.map.panTo(t.markers[0].getPosition());
			}
			
			return t.map;
		}
		
		t.addMarker = function(lat, lng, name, index) {
			var latlng = new google.maps.LatLng(lat, lng);
		
			var marker = new google.maps.Marker({
				map: t.map,
				position: latlng,
				title: name,
			});
			
			marker.index = index;

			t.markers.push(marker);
			
			google.maps.event.addListener(marker, 'click', function(){
				var row = t.db.query(_TABLE, {index:marker.index});
				
				console.log(marker.index);
				console.log(t.db.query(_TABLE));
				
				row = row[0];
				
				var form    = $('#edit-marker');
				var $name   = form.find('#name');
				var $street = form.find('#street');
				var $city   = form.find('#city');
				var $state  = form.find('#state');
				var $zip    = form.find('#zip');
				
				$name.val(row.name);
				$street.val(row.street);
				$city.val(row.city);
				$state.val(row.state);	
				$zip.val(row.zip);
				
				form.attr("value", index);
				$("a[href='#edit']").click();
			});
			t.bounds.extend(latlng);
			return marker;
		}
		
		t.moveMarker = function(marker, lat, lng) {
			var latlng = new google.maps.LatLng(lat, lng);
			marker.setPosition(latlng);
			t.bounds.extend(latlng);
		}
		
		t.hasLatLng = function(lat, lng) {
			var result = t.db.query(_TABLE, {"lat":lat, "lng":lng});
			if (result.length === 0) {
				return false;
			} else {
				return true;
			}
		}
		
		t.saveRow = function(row) {
			if(t.db.tableExists(_TABLE)) {
				t.db.insert(_TABLE, {
					name: row.name,
					street: row.street,
					city: row.city,
					state: row.state,
					zip: row.zip,
					lat: row.lat,
					lng: row.lng,
					index: row.index,
				});
				t.db.commit();
			} else {
				console.log("table doesnt exist yet");
			}
		}
		
		t.getRow = function(index) {
			var row = t.db.query(_TABLE, {index:index});
			return row[0];
		}
		
		t.updateRow = function(index, row) {
			if(t.db.tableExists(_TABLE)) {
				t.db.update(_TABLE, {index: index}, function(r) {
					r.name = row.name;
					r.street = row.street;
					r.city = row.city;
					r.state = row.state;
					r.zip = row.zip;
					r.lat = row.lat;
					r.lng = row.lng;
					console.log(r);
					return r;
				});
				t.db.commit();
			} else {
				console.log("table doesnt exist yet");
			}
		}
		
		t.deleteRow = function(index) {
			if(t.db.tableExists(_TABLE)) {
				t.db.deleteRows(_TABLE, {index: index});
				t.db.commit();
			} else {
				console.log("table doesnt exist yet");
			}
		}
		
		t.deleteMarkers = function() {
			t.db.dropTable(_TABLE);
			t.markers = [];
		}
		
		t.geocode = function(location, callback) {
		
			t.geocoder.geocode({"address": location}, function(results, status) {
				
				var response = {
					success: status == google.maps.GeocoderStatus.OK ? true : false,
					status: status,
					results: results
				}
				if(typeof callback === "function") {
					callback(response);
				}				
			});
		}
		
		t.getOpenIndex = function() {
			var max = 1;
			var result = t.db.query(_TABLE);
			for(var i=0, len=result.length; i<len; i++){
				if (result[i].index > max){
					max = result[i].index;
				}
			}
			return (max+1);
		}
		
		t.setCenter = function(lat, lng) {
			t.map.setCenter(new google.maps.LatLng(lat, lng));
		}
		
		function toRad(Value) {
			//converts degrees to radians
			return Value * Math.PI / 180;
		}
		
		t.getDist = function(latlng1, latlng2) {
			var R = 6371; // km
			var lat1 = toRad(latlng1.lat());
			var lon1 = toRad(latlng1.lng());
			var lat2 = toRad(latlng2.lat());
			var lon2 = toRad(latlng2.lng());
			var d = Math.acos(Math.sin(lat1)*Math.sin(lat2) + 
                Math.cos(lat1)*Math.cos(lat2) *
                Math.cos(lon2-lon1)) * R;
			console.log(d + "km");
			return d;	
		}
		
		return t;
	}
	
	//jQuery alias
	$.fn.gmap = function(options) {
		return new gmap($(this), options);
	}
	
})(jQuery);