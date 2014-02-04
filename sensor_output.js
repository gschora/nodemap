var debug = false;
var KOMPASSSPEED = 250;
var init = false;

var Buffer = require('buffer').Buffer;


var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
var sp = null;
if (!debug){
	sp = new SerialPort("/dev/ttyUSB0", {
		parser: serialport.parsers.readline("\n"),
		// parser: serialport.parsers.raw,
		baudrate: 9600,
		databits: 8,
		stopbits: 1,
		parity: 0,

	});
}

if(!debug){
	sp.on("data", function (data) {
		// console.log(data);
		var dataList = data.split(",");
		// console.log(data);
		switch (dataList[0]) {
			case 'T':
				var tilt = parseSensorTilt(dataList);
				// process.send(tilt);
				break;
			case 'C':
				var compass = parseSensorCompass(dataList);
				// process.send(compass);
				break;
		}
	// console.log(dataList[3])
	// if(dataList[2] !== undefined){
 //    	var angle = getAngle(dataList[2]);
 //    	process.send({ angle_compass: angle });
	// }	
  	});
}

function parseSensorTilt(data){
	var x_tilt = data[2].split("=")[1]/10;
	var y_tilt = data[3].split("=")[1]/10;
	// console.log ("Sen x_tilt: "+x_tilt + " y_tilt: "+y_tilt);
	return {x_tilt : x_tilt, y_tilt : y_tilt};
}

function parseSensorCompass(data){
	var angle_compass = data[2].split("=")[1]/10;
	var pitch_compass = (data[3].split("=")[1]*180/170).toPrecision(2);
	var roll_compass = (data[4].split("=")[1]*180/170).toPrecision(2);

	console.log("Com angle: "+angle_compass+" pitch: "+pitch_compass+" roll: "+roll_compass);

	return {angle_compass : angle_compass, pitch_compass : pitch_compass, roll_compass : roll_compass};
}

function getSensorData(){
	sp.write("C")
	sp.write("T");
}



function getAngle(data){
	return data.split("=")[1]/10;
}


function main(){
	if (!init){
		// sp.write("B0");
		// sp.set_baud_rate(19200);
		if(!debug){
			sp.write("p");
		}

		init = true;
	}
	getSensorData();
	setTimeout(main,KOMPASSSPEED); //damit mache ich eine loop! bei while(true) habe ich 50% Prozessorauslastung!!!
}
main();