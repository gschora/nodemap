var debug = true;
var KOMPASSSPEED = 250;
var init = false;

var Buffer = require('buffer').Buffer;


var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
var sp = null;
if (!debug){
	sp = new SerialPort("/dev/ttyUSB4", {
		parser: serialport.parsers.readline("\n"),
		// parser: serialport.parsers.raw,
		baudrate: 9600,
		databits: 8,
		stopbits: 1,
		parity: 0,

	});
}
// var Convert = {
// 	chars: " !\"#$%&'()*+'-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~",
// 	hex: '0123456789ABCDEF', bin: ['0000', '0001', '0010', '0011', '0100', '0101', '0110', '0111', '1000', '1001', '1010', '1011', '1100', '1101', '1110', '1111'],
// 	decToHex: function(d){
// 		return (this.hex.charAt((d - d % 16)/16) + this.hex.charAt(d % 16));
// 	},
// 	toBin: function(ch){
// 		var d = this.toDec(ch);
// 		var l = this.hex.charAt(d % 16);
// 		var h = this.hex.charAt((d - d % 16)/16);
// 		var hhex = "ABCDEF";
// 		var lown = l < 10 ? l : (10 + hhex.indexOf(l));
// 		var highn = h < 10 ? h : (10 + hhex.indexOf(h));
// 		return this.bin[highn] + ' ' + this.bin[lown];
// 	},
// 	toHex: function(ch){
// 		return this.decToHex(this.toDec(ch));
// 	},
// 	toDec: function(ch){
// 		var p = this.chars.indexOf(ch);
// 		return (p <= -1) ? 0 : (p + 32);
// 	}
// };
if(!debug){
	sp.on("data", function (data) {
		// console.log(data);
		var dataList = data.split(",");
		// console.log(data);
		switch (dataList[0]) {
			case 'T':
				var tilt = parseSensorTilt(dataList);
				process.send(tilt);
				break;
			case 'C':
				var compass = parseSensorCompass(dataList);
				process.send(compass);
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
	return {x_tilt : x_tilt, y_tilt : y_tilt};
}

function parseSensorCompass(data){
	var angle_compass = data[2].split("=")[1]/10;
	var pitch_compass = (data[3].split("=")[1]*180/170).toPrecision(2);
	var roll_compass = (data[4].split("=")[1]*180/170).toPrecision(2);

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
	if (!debug){
		getSensorData();
	}
	setTimeout(main,KOMPASSSPEED); //damit mache ich eine loop! bei while(true) habe ich 50% Prozessorauslastung!!!
}
main();