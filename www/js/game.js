'use strict';

var GAME = function (config) {
    this.config = config;
    var this_ = this;

    var socket;
    var scene, camera, clock;
    var renderer, keyboard, mouse;
    var players = {}, me = null;
    var inputs = [];
    var fps;

    init();

    function init() {
        socket = io.connect();
        keyboard = new THREEx.KeyboardState();
        mouse = new THREE.Vector3();
        clock = new THREE.Clock();
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( 30, window.innerWidth/window.innerHeight, 0.1, 1000 );
        renderer = new THREE.WebGLRenderer( {antialias: true, alpha: true} );
        renderer.setSize( window.innerWidth, window.innerHeight );
        $(".container").append( renderer.domElement );
        
        window.addEventListener( 'resize', function ( event ) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize( window.innerWidth, window.innerHeight );
        }, false );

        window.addEventListener( 'mousemove', function ( event ) {

            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
            //mouse.x = 1;
            //mouse.y = 0;
            mouse.z = 0;
            mouse.normalize();

        }, false );

        socket.on('connect', function () {
            build();
            render();
            setInterval(function () {
                $("#fps").text(fps);
            }, 500);
            setInterval(physics, 15);
            setInterval(controls, 18);
        });

        socket.on('disconnected', function (net) {
            console.log('disconnected');
            var p = scene.getObjectByName(net.name);
            if(p)
                scene.remove(p);
        });

        socket.on('update', server_update);

    }

    function render() {

        requestAnimationFrame( render );

        //controls();
        //update();

        //fps = parseInt(1/clock.getDelta());

        renderer.render(scene, camera);

    };

    function build() {

        var gridHelper = new THREE.GridHelper( 100, 100 );
        gridHelper.rotateX(Math.PI/2);
        scene.add( gridHelper );

        camera.position.z = 50;

        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshBasicMaterial( {color: 0x0000ff} );
        var hero = new THREE.Mesh( geometry, material );
        hero.name = socket.id;

        me = {
            name: socket.id,
            velocity: 0,
            position: hero.position,
            direction: new THREE.Vector3(),
            move: false,
            hero: hero
        }

        players[socket.id] = me;

        scene.add( hero );

    }

    function physics() {

        for(var name in players) {
            var player = players[name];
            if(me.name == player.name)
            {
                var input = inputs.shift();
                if(input)
                {
                    player.move = input.move;
                    if(player.move) player.velocity = Math.min((player.velocity + 0.001)*1.25, 0.3);
                    player.direction.copy(input.direction);
                    player.hero.lookAt(player.position.clone().add(player.direction));
                    player.velocity *= 0.85;
                    player.position.add(player.direction.clone().multiplyScalar(player.velocity));
                }
                else
                {
                    //player.velocity *= 0.85;
                    //player.position.add(player.direction.clone().multiplyScalar(player.velocity));
                }
                camera.position.copy(player.position);
                camera.position.z = 50;
            }
            else
            {
                //if(player.move) player.velocity = Math.min((player.velocity + 0.001)*1.25, 0.3);
                //player.hero.lookAt(player.position.clone().add(player.direction));
                player.velocity *= 0.85;
                player.position.add(player.direction.clone().multiplyScalar(player.velocity));
            }
        }
    }

    function server_update(net) {
        for(var name in net.players) {
            var player = net.players[name];
            if(players[name])
            {
                if(me.name != player.name)
                {
                    players[name].velocity = player.velocity;
                    players[name].position.copy(player.position);
                    players[name].direction.copy(player.direction);
                    players[name].move = player.move;
                    players[name].hero.lookAt(players[name].position.clone().add(players[name].direction));
                }
            }
            else
            {
                var geometry = new THREE.BoxGeometry( 1, 1, 1 );
                var material = new THREE.MeshBasicMaterial( {color: Math.random() * 0x00ff00} );
                var hero = new THREE.Mesh( geometry, material );
                hero.name = name;
                players[name] = {
                    name: name,
                    velocity: player.velocity,
                    position: hero.position.copy(player.position),
                    direction: new THREE.Vector3().copy(player.direction),
                    move: player.move,
                    hero: hero
                }
                scene.add(hero);
            }
        }
    }

    function update() {
        inputs.push({direction: me.direction, move: me.move});
        socket.emit('player_update', {name: me.name, direction: me.direction, move: me.move});
    }

    function controls() {
        me.move = keyboard.pressed("W");
        me.direction.copy(mouse);
        update();
    }
}