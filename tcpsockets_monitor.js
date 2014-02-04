var net = require('net');

var HOST = '127.0.0.1';
var PORT = 52001;

var client = net.connect(PORT, HOST, function() { //'connect' listener
	console.log('client connected');
	// client.write('world!\r\n');
});
client.on('data', function(data) {
	var pos = convertData(data);
	if (pos !== null) {
		console.log(pos);
	}

});
client.on('end', function() {
	console.log('client disconnected');
});

function convertData(data) {

	var monitor = data.toString().split("\n")[0].split("   ");
	// console.log(monitor.length);
	if (monitor.length > 1) {
		var pos = {
			"lat": monitor[1],
			"lon": monitor[2],
			"height": monitor[3],
			"status": monitor[4],
			"numSat": monitor[5]
		}

		return pos;
		// console.log(pos);
	}
	// console.log(test);
	// var splitdata = data.toString().match('GPRMC.+');
	// if (splitdata !== null) {
	// 	var rmc = splitdata[0].split(",");
	// 	// bogenminute auf wgs84 umrechnen (durch 60 dividieren), sonst stimmt die position nicht!!!!!
	// 	var convLat = rmc[3].slice(0, 2) + "." + (rmc[3].slice(2) / 60).toPrecision(7).slice(2);
	// 	// lon kann 3-stellig sein, deshalb kann am begin eine 0 stehen, diese einfach wegmachen
	// 	var convLon = (rmc[5].slice(0, 3) + "." + (rmc[5].slice(3) / 60).toPrecision(7).slice(2)).replace(/^[0]/, "");
	// 	var pos = {
	// 		"lat": convLat,
	// 		"lon": convLon,
	// 		"vel": (rmc[7] * 1.852).toPrecision(3),
	// 		"head": rmc[8]
	// 	}
	// 	return pos;
	// }
	return null;

}