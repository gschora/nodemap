var HYDROTIME = 200;
var RELAISSPEED = 500;
var relaisWorking = false;
var timeoutPID = null;
var INITRELAIS = false;
var POINTSIDE = "middle";
var startSteer = false;


var debug = false; //schaltet ob befehle ans relais geschickt werden oder nicht

process.on('message', function(m) {
	// console.log("."+m);
	switch (m.command){
		case 'initRelais':
			console.info('initRelais received');
			initCard();
			console.info('Relais initiated');
			break;
		case 'startAutoSteer':
			console.info('startAutoSteer received');
			startSteer = true;
			break;
		case 'stopAutoSteer':
			console.info('stopAutoSteer received');
			startSteer = false;
			break;
		case 'left':
			console.info('left received');
			POINTSIDE = 'left';
			// startSteer = true;
			break;
		case 'right':
			console.info('right received');
			POINTSIDE = 'right';
			// startSteer = true
			break;
		case 'middle':
			console.info('middle received');
			POINTSIDE = 'middle';
			// startSteer = true;
			break;
		case 'stop':
			console.info('stop received');
			POINTSIDE = 'stop';
			startSteer = false;
			break;
		case 'singleLeft':
			console.info('singleLeft received');
			if (!relaisWorking){
				directionFiber.run("left");
			}
			break;
		case 'singleRight':
			console.info('singleRight received');
			if (!relaisWorking){
				directionFiber.run("right");
			}	
			break;
		case 'singleStop':
			console.info('singleStop received');
			POINTSIDE = 'middle';
			clearAll();
			break;
	}
	if(m.relaisSpeed !== undefined){
		RELAISSPEED = m.relaisSpeed.relaisspeed;
		console.log("Relaisspeed:"+RELAISSPEED);
	} else if(m.hydroDuration !== undefined){
		HYDROTIME = m.hydroDuration.hydroduration;
		console.log("hydrotime:"+HYDROTIME);
	} 
});


var Future = require('fibers');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
var sp = null;
if (!debug){
	sp = new SerialPort("/dev/ttyUSB3", {
		parser: serialport.parsers.raw,
		baudrate: 19200,
		databits: 8,
		stopbits: 1,
		parity: 0,

	});
}
var directionFiber= new Fiber(function(direction){
	switch(direction){
		case "left": left(); break;
		case "right": right(); break;
	}
});

// x Rahmenaufbau
// 	Byte 0 Kommando
// 	Byte 1 Kartenadresse
// 	Byte 2 Daten
// 	Byte 3 Prüfsumme (XOR aus Byte0, Byte1 und Byte2 )

function getXOR(command, address, data) {
	var xor = command ^ address ^ data;
	return xor;
}

function sleep(ms) {
	var fiber = Fiber.current;
	timeoutPID = setTimeout(function() {
		fiber.run();
	}, ms);
	yield();
}

function initCard() {
	var command = 1;
	var address = 1; //wichtig address darf NICHT 0 sein weil sonst das xor nicht funktioniert!!!!
	var data = 0;
	var xor = getXOR(command, address, data);
	var initCard = new Buffer([command, address, data, xor]);
	if(!debug){
		sp.write(initCard);
	}
	INITRELAIS = true;
	console.log("Relais initialized");
}

function setPort(direction) {
	var command = 3;
	var address = 1; //wichtig address und data dürfen NICHT 0 sein weil sonst das xor nicht funktioniert!!!!
	var data;
	switch (direction) {
	case "left":
		data = 1;
		break;
	case "right":
		data = 2;
		break;
	case "middle":
		data = 0;
		break;
	}
	var xor = getXOR(command, address, data);
	var setPort = new Buffer([command, address, data, xor]);
	if(!debug){
		sp.write(setPort);
	}

}

function left() {
	clearTimeout(timeoutPID);
	relaisWorking = true;
	setPort("left");
	console.log("relais_left");
	sleep(HYDROTIME);
	setPort("middle");
	relaisWorking = false;

}

function right() {
	clearTimeout(timeoutPID);
	relaisWorking = true;
	setPort("right");
	console.log("relais_right");
	sleep(HYDROTIME);
	setPort("middle");
	relaisWorking = false;
}

function middle() {
	clearTimeout(timeoutPID);
	setPort("middle");
	console.log("relais_middle");
	relaisWorking = false;
}

function clearAll() {
	clearTimeout(timeoutPID);
	setPort("middle");
	console.log("relais_clearAll");
	relaisWorking = false;
}

// Fiber(function(){

// 	// while (true){
// 	// 	if (!INITRELAIS){
// 	// 		initCard(); //Relais initialisieren und dann kurz warten
// 	// 		sleep(3000);
// 	// 	}
// 	// 	if (startSteer){
// 	// 		if (!relaisWorking){
// 	// 			switch (POINTSIDE){
// 	// 				case 'left':
// 	// 					directionFiber.run("left");
// 	// 					break;
// 	// 				case 'right':
// 	// 					directionFiber.run("right");
// 	// 					break;
// 	// 				case 'middle':
// 	// 					middle();
// 	// 					break;
// 	// 				case 'stop':
// 	// 					clearAll();
// 	// 					break;
// 	// 			}
// 	// 		}
// 	// 		sleep(RELAISSPEED);
// 	// 	}
// 	// }
// }).run();
function main(){
	if (!INITRELAIS){
		initCard(); //Relais initialisieren und dann kurz warten
		setTimeout(3000);
	}
	if (startSteer){
		if (!relaisWorking){
			switch (POINTSIDE){
				case 'left':
					directionFiber.run("left");
					break;
				case 'right':
					directionFiber.run("right");
					break;
				case 'middle':
					middle();
					break;
				case 'stop':
					clearAll();
					break;
			}
		}

	}
	setTimeout(main,RELAISSPEED); //damit mache ich eine loop! bei while(true) habe ich 50% Prozessorauslastung!!!
}
main();
