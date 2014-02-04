//var app = require('http').createServer(handler),
var express = require('express');
var application = express.createServer();
var io = require('socket.io').listen(application);
io.set('log level', 1);
//    fs = require('fs');
// var sys = require('sys');
// var serialport = require("serialport");
// var SerialPort = serialport.SerialPort; // localize object constructor
// try {
//     var sp = new SerialPort("/dev/ttyACM0", {
//         parser: serialport.parsers.readline("\n")
//     });
// }
// catch (e) {
//     console.error("kein serialport verfügbar!");
// }
// var fs = require("fs");
//var filestream = fs.createWriteStream("gps_log.txt", {
//    flags: "a",
//    encoding: "encoding",
//    mode: 0666
//});
//sp.on("data", function(data) {
//    var prossesedData = data.match("GPGLL");
//    if (prossesedData !== null) {
//        filestream.write(data + "\n");
//    }
//});
//var readStream = fs.createReadStream("gps_log.txt", {
//    encoding: 'utf8'
//});
application.configure(function() {
    // console.info("configure express...");
    // application.use(express.logger());
    application.use(express.static(__dirname + '/html'));
    application.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});
application.listen(8081);
// console.info("express startet at 8080");
var isConnected = false;
io.sockets.on('connection', function(socket) {
    isConnected = true;
    socket.on('disconnect', function() {
        isConnected = false;
    });
    //    sp.on("data", function(data) {
    console.info("connection mit client aufgebaut!!!");
    // fs.readFile('gps_log.txt', 'utf-8', function(err, data) {
    //     if (err) throw err;
    //     if (data) {
    //         var lines = data.split("\n");
    //         var lilength = 0;
    //         setInterval(function() {
    //             if (isConnected) {
    //                 if (lilength < lines.length) {
    //                     console.log(lilength);
    //                     var data = lines[lilength];
    //                     var prossesedData = data.match("GPGLL");
    //                     if (prossesedData !== null) {
    //                         //          umwandlung in float bringt ungenauigkeiten, deshalb erst ganz am schluss!!!
    //                         var posLat = data.split(",")[1]; //.replace(".", "");
    //                         var posLon = data.split(",")[3]; //.replace(".", "");
    //                         if (posLat !== "") {
    //                             //bogenminute auf wgs84 umrechnen (durch 60 dividieren), sonst stimmt die position nicht!!!!!
    //                             var convLat = posLat.slice(0, 2) + "." + (posLat.slice(2) / 60).toPrecision(7).slice(2);
    //                             //            lon kann 3-stellig sein, deshalb kann am begin eine 0 stehen, diese einfach wegmachen
    //                             var convLon = (posLon.slice(0, 3) + "." + (posLon.slice(3) / 60).toPrecision(7).slice(2)).replace(/^[0]/, "");
    //                             socket.emit('gpsPosition', {
    //                                 lat: convLat,
    //                                 lon: convLon
    //                             });
    //                         }
    //                     }
    //                 }
    //                 lilength = lilength + 1;
    //             }
    //         }, 50);
    //     }
    // });
});
//function readnsend (socket){
//
//        console.log(lines.lenght);
//    });
//}