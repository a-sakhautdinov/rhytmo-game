function addBoard() {
    board = createObject(6, 6, 2, 0xffffff, { x: -4, y: -20, z: 0 });
    
    scene.add(board);
}

function addNote(id) {
    return createObject(2, 2, 2, 0xC5979D, { x: id*8 - 12, y: 50, z: 0 });
}


function createObject(width, height, depth, color, position) {
    var geometry = new THREE.BoxGeometry( width, height, depth );
    var material = new THREE.MeshPhongMaterial( {color} );
    var cube = new THREE.Mesh( geometry, material );
    cube.position.x = position.x;
    cube.position.y = position.y;
    cube.position.z = position.z;

    return cube;
}