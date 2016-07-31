'use strict';

var GAME = function (config) {
    this.config = config;
    var this_ = this;

    var socket;
    var scene, camera, clock;
    var renderer, keyboard, mouse;
    var players = [], me = null;
    var fps;

    init();

    function init() {
        socket = io.connect();
        keyboard = new THREEx.KeyboardState();
        mouse = new THREE.Vector3();
        clock = new THREE.Clock();
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( 30, window.innerWidth/window.innerHeight, 0.1, 1000 );
        renderer = new THREE.WebGLRenderer( {antialias: false, alpha: true} );
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
        });

        socket.on('disconnected', function (net) {
            console.log('disconnected');
            var p = scene.getObjectByName(net.id);
            if(p)
                scene.remove(p);
        });

        socket.on('update', function (net) {

        });

    }

    function render() {
        requestAnimationFrame( render );

        controls();
        update();

        fps = parseInt(1/clock.getDelta());

        renderer.render(scene, camera);
    };

    function build() {
        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        var cube = new THREE.Mesh( geometry, material );
        cube.name = socket.id;
        cube.velocity = 0;
        Player = cube;
        scene.add( cube );

        var gridHelper = new THREE.GridHelper( 100, 100 );
        gridHelper.rotateX(Math.PI/2);
        scene.add( gridHelper );

        camera.position.z = 50;
    }

    function physics() {

        scene.traverse(function (child) {
            if(child instanceof THREE.Mesh)
            {
                if(child.name == Player.name)
                {
                    if(Player.move) Player.velocity = 1;
                    Player.velocity *= 0.85;
                    child.lookAt(mouse.clone().add(child.position));
                    var move = new THREE.Vector3(child.position.x + Player.velocity * mouse.x,
                                                child.position.y + Player.velocity * mouse.y,
                                                0);
                    //if(bounds.containsPoint(move))
                    //{
                        child.position.copy(move);
                        move.z = 50;
                        camera.position.copy(move);
                    //}
                }
                else
                {
                    if(child.move)
                        child.velocity = 1;
                    child.velocity *= 0.85;
                    var direction = new THREE.Vector3();
                    direction.copy(child.direction); 
                    child.lookAt(direction.clone().add(child.position));
                    var move = new THREE.Vector3(child.position.x + child.velocity * direction.x,
                                                child.position.y + child.velocity * direction.y,
                                                0);
                    child.position.copy(move);
                }
            }
        });
    }

    function server_update(net) {
        net.data.forEach(function (player) {
            var p = scene.getObjectByName(player.id);
            if(p)
            {
                if(player.id != Player.name)
                {
                    p.position.copy(player.position);
                    p.direction = player.direction;
                    p.move = player.move;
                    p.velocity = player.velocity;
                    //player.position.z = 50;
                    //camera.position.copy(player.position);
                }
            }
            else
            {
                var geometry = new THREE.BoxGeometry( 1, 1, 1 );
                var material = new THREE.MeshBasicMaterial( {color: Math.random() * 0x00ff00} );
                var cube = new THREE.Mesh( geometry, material );
                cube.name = player.id;
                cube.direction = player.direction;
                cube.move = player.move;
                cube.velocity = player.velocity;
                cube.position.copy(player.position);
                scene.add(cube);
            }
        });
    }

    function update() {
        socket.emit('player_update', {id: Player.name, direction: mouse, move: Player.move});
    }

    function controls() {
        Player.move = keyboard.pressed("W");
    }    
}