var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
var sp = new SerialPort("/dev/ttyUSB0", {
	parser: serialport.parsers.raw,
	baudrate: 19200,
	databits: 8,
	stopbits: 1,
	parity: 0,

});

// ---------------------------------------------------------------------------
var stdin = process.openStdin();
require('tty').setRawMode(true);

stdin.on('keypress', function(chunk, key) {
	if (key && key.name == 'left') {
		left();

	} else if (key && key.name == 'right') {
		right();

	} else if (key && key.name == 'up') {
		middle();

	} else if (key && key.ctrl && key.name == 'c') process.exit();
});
// ---------------------------------------------------------------------------

var TIME = 1000;
// x Rahmenaufbau
// 	Byte 0 Kommando
// 	Byte 1 Kartenadresse
// 	Byte 2 Daten
// 	Byte 3 Prüfsumme (XOR aus Byte0, Byte1 und Byte2 )

function getXOR(command, address, data) {
	var xor = command ^ address ^ data;
	return xor;
}

function initCard() {
	var command = 1;
	var address = 1; //wichtig address darf NICHT 0 sein weil sonst das xor nicht funktioniert!!!!
	var data = 0;
	var xor = getXOR(command, address, data);
	var initCard = new Buffer([command, address, data, xor]);
	sp.write(initCard);
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
	sp.write(setPort);
}

function left() {
	setPort("left");
	console.log("left");
}

function right() {
	setPort("right");
	console.log("right");
}

function middle() {
	setPort("middle");
	console.log("right");
}

sp.on("data", function(data) {
	console.log("answer:" + data[0] + " " + data[1] + " " + data[2] + " " + data[3]);
});

initCard();

