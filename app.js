var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var THREE = require("three");

var www_root = __dirname + '/www';

app.get('/', function(req, res) {
    res.sendFile(www_root + '/index.html');
});

app.get('/js/*', function(req, res) {
    res.sendFile(www_root + req.url);
});

app.get('/css/*', function(req, res) {
    res.sendFile(www_root + req.url);
});

http.listen(80, function() {
    console.log('listening on *:80');
});

var players = {};
var inputs = {};

io.on('connection', function(socket){
    console.log('a user connected ' + socket.id.split('#').pop());
    var player = {
        name: socket.id.split('#').pop(),
        velocity: 0,
        position: new THREE.Vector3(0,0,0),
        direction: new THREE.Vector3(0,0,0),
        move: false
    };
    players[socket.id.split('#').pop()] = player;
    inputs[socket.id.split('#').pop()] = [];
    socket.on('player_update', function (net) {
        if(inputs[net.name])
            inputs[net.name].push(net);
    });
    socket.on('disconnect', function() {
        console.log('user disconnected ' + socket.id.split('#').pop());
        var name = socket.id.split('#').pop();
        delete players[name];
        delete inputs[name];
        io.emit('disconnected', {name: name});
    });
});

function physics() {

    for(var name in players) {
        var player = players[name];
        var input = inputs[name].shift();
        if(input)
        {
            player.move = input.move;
            if(player.move) player.velocity = Math.min((player.velocity + 0.001)*1.25, 0.30);
            player.direction = input.direction;
            player.velocity *= 0.85;
            var direction = new THREE.Vector3().copy(player.direction);
            var position = new THREE.Vector3().copy(player.position);
            position.add(direction.multiplyScalar(player.velocity));
            player.position = position;
        }
        else
        {
            //player.velocity *= 0.85;
            //var direction = new THREE.Vector3().copy(player.direction);
            //var position = new THREE.Vector3().copy(player.position);
            //position.add(direction.multiplyScalar(player.velocity));
            //player.position = position;
        }
    }
}

function update() {
    io.emit('update', {players: players});
}

setInterval(physics, 15);
setInterval(update, 45);