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

var players = [];

io.on('connection', function(socket){
    console.log('a user connected ' + socket.id.split('#').pop());
    var player = {
        name: socket.id.split('#').pop(),
        velocity: 0,
        position: new THREE.Vector3(0,0,0),
        direction: new THREE.Vector3(0,0,0),
        move: false
    };
    players.push(player);
    socket.on('player_update', function (net) {
        players.forEach(function (player) {
            if(player.name == net.name){
                player.move = net.move;
                player.direction = net.direction;
            }
        });
    });
    socket.on('disconnect', function(){
        console.log('user disconnected ' + socket.id.split('#').pop());
        var name = socket.id.split('#').pop();
        var index = null;
        players.forEach(function (player) {
        if(player.name == name)
        {
            index = players.indexOf(player);
            return false;
        }
        });
        if (index > -1)
        players.splice(index, 1);
        io.emit('disconnected', {name: name});
    });
});

function physics() {
    players.forEach(function (player) {
        if(player.move) player.velocity = 1;
        player.velocity *= 0.85;
        var v = player.velocity;
        var move = new THREE.Vector3(player.position.x + v * player.direction.x, player.position.y + v * player.direction.y, 0);
        player.position = move;
    });
}

function update() {
    io.emit('update', {info: players});
}

setInterval(physics, 15);
setInterval(update, 45);