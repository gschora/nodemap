

// var serialport = require("serialport");
// var SerialPort = serialport.SerialPort; // localize object constructor
// var sp = new SerialPort("/dev/ttyUSB0", {
//     parser: serialport.parsers.raw,
//     baudrate: 19200,
//     databits: 8,
//     stopbits: 1,
//     parity: 0,
// });
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------


var net = require('net');
var HOST_rtkmon = '127.0.0.1';
var PORT_rtkmon = 52001;

var express = require('express');
var application = express.createServer();
application.configure(function() {
    application.use(express.static(__dirname + '/html'));
    application.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});
application.listen(8081);

// -------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------
var io = require('socket.io').listen(application);
var logger = io.log;
io.set('log level', 1);
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var cp = require('child_process');
var relaisProcess = cp.fork(__dirname + '/relais_threads.js');
logger.info('Relaisprocess started');
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var compass_cp = require('child_process');
var compassProcess = compass_cp.fork(__dirname + '/sensor.js');
logger.info('Compassprocess started');

var angle_compass = null;
var pitch_compass = null;
var roll_compass = null;
var x_tilt = null;
var y_tilt = null;
compassProcess.on("message", function(data){
    // console.log(data);
    if (data.angle_compass !== undefined){
        angle_compass = data.angle_compass;
        pitch_compass = data.pitch_compass;
        roll_compass = data.roll_compass;
    } else if( data.x_tilt != undefined){
        x_tilt = data.x_tilt;
        y_tilt = data.y_tilt;
    }

    // console.log("angle: "+data.angle_compass);
});


// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------


io.sockets.on('connection', function(socket) {
    logger.info("connection mit client aufgebaut!!!");

    rtkclient.on('data', function(data) {
        var pos = convertData(data);
        if (pos !== null) {
            socket.emit('gpsPosition', pos);
        }
    });
    rtkclient.on('end', function() {
        logger.info('client disconnected');
    });
    socket.on('pointSide', function(data) {
        POINTSIDE = data.pointSide;
        if (data.pointSide == 'left'){
            relaisProcess.send({ command: 'left' });
        } else if (data.pointSide == 'right'){
            relaisProcess.send({ command: 'right' });
        } else if (data.pointSide == 'middle'){
            relaisProcess.send({ command: 'middle' });
        }
        // if (data.pointSide.toString() == "left") {
        //         // myfibre.run("left");
        //         steerThread.emit("pointSide","left");
        // } else if (data.pointSide.toString() == "right") {
        //         // myfibre.run("right");
        //         steerThread.emit("pointSide","right");
        // } else if (data.pointSide.toString() == "middle") {
        //         // middle();
        //         steerThread.emit("pointSide","middle");
        // } else if (data.pointSide.toString() == "stop") {
        //         // clearAll();
        //         steerThread.emit("pointSide","stop");
        // }
    });
    socket.on('disconnect', function() {
        logger.warn("connection mit client verloren!!!");
    });
});
// -------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------
var ioControll = require('socket.io').listen(8082);
ioControll.set('log level', 1);

ioControll.sockets.on('connection', function (socket) {
    socket.on('relaisSpeed', function (data) {
        relaisProcess.send({relaisSpeed:data});
        // console.log(data);
  });
    socket.on('hydroDuration', function (data) {
        relaisProcess.send({hydroDuration:data});
        // console.log(data);
  });
    socket.on('steerSingleLeft', function () {
        relaisProcess.send({ command: 'singleLeft' });
        // console.log("singleLeft");
  });
    socket.on('steerSingleRight', function () {
        relaisProcess.send({ command: 'singleRight' });
        // console.log("singleRight");
  });
    socket.on('singleStop', function () {
        relaisProcess.send({ command: 'singleStop' });
        // console.log("steerStop");
  });
    socket.on('startAutoSteer', function (data) {
    console.log("startAutoSteer:"+data.startAutoSteer);
    if (data.startAutoSteer){
        relaisProcess.send({ command: 'startAutoSteer' });
    } else{
        relaisProcess.send({ command: 'stopAutoSteer' });
    }
  });
});
// -------------------------------------------------------------------------------------------
var rtkclient = net.connect(PORT_rtkmon, HOST_rtkmon, function() { //'connect' listener
    logger.info('rtkmon connected');
});
rtkclient.on('error',function(){
    logger.error('rtklib not started!');
});

function convertData(data) {
    var monitor = data.toString().split("\n")[0].split("   ");
    // console.log(monitor);
    var pos = null;
    // console.log(angle_compass);

    if (monitor.length > 1) {
            var statNumSat = monitor[4].split("  ");
            if (statNumSat.length == 2){
                pos = {
                    "lat": monitor[1],
                    "lon": monitor[2],
                    "height": monitor[3],
                    "status": statNumSat[0],
                    "numSat": statNumSat[1],
                    "angle_compass": angle_compass,
                    "pitch_compass": pitch_compass,
                    "roll_compass": roll_compass,
                    "x_tilt": x_tilt,
                    "y_tilt": y_tilt
                }
            }else {
                pos = {
                    "lat": monitor[1],
                    "lon": monitor[2],
                    "height": monitor[3],
                    "status": monitor[4],
                    "numSat": monitor[5],
                    "angle_compass":0,// angle_compass,
                    "pitch_compass":0,// pitch_compass,
                    "roll_compass": 0,//roll_compass,
                    "x_tilt":0,// y_tilt,
                    "y_tilt":0// x_tilt
                }
            }
        // console.info(pos);
        return pos;
    }
    return null;

}
