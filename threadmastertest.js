var cp = require('child_process');
var n = cp.fork(__dirname + '/relais_threads.js');

n.on('message', function(m) {
	// if (m.log !== null){
	// 	console.log(m.log);
	// }
});

n.send({ command: 'initRelais' });
n.send({ command: 'startSteer' });
// n.send({ command: 'left' });
// n.send({ command: 'right' });
// n.send({ command: 'middle' });
// n.send({ command: 'stop' });


