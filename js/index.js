var scene, camera, renderer;

var analyser;

var fftSize = 128;

var notes = [];

var board;

var hasAbility = true, abilityFillInterval, currentFill;

var missCount = 0, loseIfMiss = false, lose = false, score = 0, streak = 1;

var song = null, mediaElement;

var requestId;

var container = document.getElementById( 'container' );
var ability = document.getElementById( 'ability' );
var abilityFill = document.getElementById( 'abilityFill' );
var abilityText = document.getElementById( 'abilityText' );
var loadAudio = document.getElementById( 'loadAudio' );
var inputAudio = document.getElementById('inputAudio');
var missButton = document.getElementById('missButton');
var missDiv = document.getElementById('missDiv');
var resultDiv = document.getElementById('resultDiv');
var closeButton = document.getElementById('closeButton');
var overlay = document.getElementById( 'overlay' );
var gameName = document.getElementById( 'gameName' );
var songName = document.getElementById( 'songName' );

function addNotes() {
    [...Array(4)].forEach((_, id) => {
        const note = addNote(id);
        scene.add(note);
        notes.push(note);
    })
}

function moveNotes() {
    var colors = [0, 0, 0, 0];
    analyser.getFrequencyData().forEach((elem, id) => {
        let _id;
        if (id % 4 === 0) {
            _id = 1;
        } else if (id % 2 === 0) {
            _id = 2;
        } else if (id % 3 === 0) {
            _id = 3;
        } else {
            _id = 0;
        }
        colors[_id] += elem;
        notes[_id].position.y -= elem/3000;
        if (notes[_id].position.y < -32) {
            missCount++;
            streak = 1;
            notes[_id].position.y = 50;
        }
    });
    colors.forEach((color, id) => {
        if (color < 800) {
            notes[id].material.color.setHex(0xE5E5E5);
        } else if (color >= 800 && color < 1400) {
            notes[id].material.color.setHex(0xA8D5E2);
        } else if (color >= 1400 && color < 2000) {
            notes[id].material.color.setHex(0xFCA311);
        } else {
            notes[id].material.color.setHex(0xA50104);
        }
    })
}

function closeGame() {
    mediaElement.pause();
    scene.remove(board);
    ability.style.display = "none";
    board = null;
    notes.forEach((note) => scene.remove(note));
    notes = [];
    missCount = 0;
    mediaElement.currentTime = 0.0;
    resultDiv.style.display = "none";
    streakDiv.style.display = "none";
    scoreDiv.style.display = "none";
    missDiv.style.display = "none";
    overlay.style.display = "block";
    gameName.style.display = "block";
    songName.style.left = '50%';
    songName.style.top = 'calc(25% + 40px)';
    analyser = null;
    cancelAnimationFrame(requestId);
    renderer.render( scene, camera );
}

function handleMoves(e) {
        if (!_.isEmpty(board)) {
            board.scale.x = 1;
        }
        if (e.code === "KeyZ") {
            board.position.x = -12;
        }
        if (e.code === "KeyX") {
            board.position.x = -4;
        }
        if (e.code === "KeyC") {
            board.position.x = 4;
        }
        if (e.code === "KeyV") {
            board.position.x = 12;
        }
        if (e.code === "Space" && hasAbility) {
            const _oldPosition = board.position.x;
            hasAbility = false;
            board.scale.x = 5;
            board.position.x = 1;
            ability.style.opacity = 0.3;
            currentFill = 0;
            abilityFill.style.width = currentFill + "%";
            abilityText.style.display = 'none';
            abilityFillInterval = setInterval(() => {
                abilityFill.style.width = currentFill + "%";
                currentFill += 1;
            }, 50);
            setTimeout(() => {
                board.scale.x = 1;
                board.position.x = _oldPosition;
            }, 500);
            setTimeout(() => hasAbility = true, 5000);
        }
        if (e.code === "Escape") {
            closeGame();
        }
}

function createScene() {
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x000000 );
    renderer.setPixelRatio( window.devicePixelRatio );
    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();

    const fov = 75;
    const aspect = 2;
    const near = 0.1;
    const far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 40;
    scene.add( camera );
}

function createLights() {
    var light = new THREE.AmbientLight( 0x404040 );
    scene.add( light );
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
    directionalLight.position.x = -20;
    directionalLight.position.y = 20;
    directionalLight.position.z = 20;
    directionalLight.target = board;
    scene.add( directionalLight );
}

function addSong() {
    inputAudio.click();
}

function handleAddSong() {
    song = inputAudio.files[0];
    songName.innerText = "Current song: " + song.name.split(/(.mp3|.wav)/)[0].slice(0, 16) + (song.name.length > 16 ? '...' : '');
    song.src = URL.createObjectURL(this.files[0]);
}

function handleChangeMissSetting() {
    loseIfMiss = !loseIfMiss;
    missButton.innerText = "Lose On Misses: " + (loseIfMiss ? "On" : "Off");
}

function createAudioAnalyzer() {
    var listener = new THREE.AudioListener();

    var audio = new THREE.Audio( listener );

    if (song) {
        mediaElement = new Audio(song.src);
    } else {
        mediaElement = new Audio( '/song.mp3' );
    }
    mediaElement.onended = handleWin;
    mediaElement.play();

    audio.setMediaElementSource( mediaElement );

    analyser = new THREE.AudioAnalyser( audio, fftSize );
}

function changeUI() {
    var scoreDiv = document.getElementById( 'scoreDiv' );
    var streakDiv = document.getElementById( 'streakDiv' );
    scoreDiv.innerText = score;
    streakDiv.innerText = "x" + streak;
    streakDiv.style.fontSize = (2 + streak/50) + "em";
    if (hasAbility) {
        abilityText.style.display = 'block';
        ability.style.opacity = 1;
        currentFill = 100;
        abilityFill.style.width = currentFill + "%";
        clearInterval(abilityFillInterval);
    }
}

function showEndGameDialog(innerHTML) {
    mediaElement.pause();
    scene.remove(board);
    notes.forEach((note) => scene.remove(note));
    notes = [];
    resultDiv.innerHTML = innerHTML;
    resultDiv.style.display = "block";
    ability.style.display = "none";
    resultDiv.appendChild(closeButton);
    renderer.render( scene, camera );
}

function handleLose() {
    missDiv.innerText = "Miss: " + missCount;
    if (missCount >= 25) {
        lose = true;
    }
    if (lose) {
        lose = false;
        showEndGameDialog('<div class="header">You lose.</div> <br/> Let\'s go training map. <br/>Turn off "Lose On Misses" setting');
   }
}

function handleWin() {
    showEndGameDialog(`<div class="header">You win!</div> <br/> Your score: ${score}<br/> Thanks for playing <br/> You can play other song. Click "Load Your Song" in the menu`);
}

function checkCollision() {
    var originPoint = board.position.clone();

    for (var vertexIndex = 0; vertexIndex < board.geometry.vertices.length; vertexIndex++) {
        var localVertex = board.geometry.vertices[vertexIndex].clone();
        var globalVertex = localVertex.applyMatrix4(board.matrix);
        var directionVector = globalVertex.sub(board.position);

        var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects(notes);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            collisionResults[0].object.position.y = 50;
            streak++;
            score = score + 1*streak;
            break;
        }
    }
}

function render() {
    if (analyser.getFrequencyData()) {
        moveNotes();
    }
    changeUI();
    loseIfMiss && handleLose();
}

function animate() {

    requestId = requestAnimationFrame( animate );

    if (!_.isEmpty(board)) {
        checkCollision();
    }
    if (!_.isEmpty(notes)) {
        render();
    }
    renderer.render( scene, camera );
}

function initUI() {
    overlay.style.display = 'none';
    gameName.style.display = 'none';
    streakDiv.style.display = "block";
    scoreDiv.style.display = "block";
    ability.style.display = 'block';
    songName.style.left = 'calc(90% - 100px)';
    songName.style.top = '3%';
    if (loseIfMiss) {
        missDiv.style.display = 'block';
    }
}

function initValues() {
    score = 0;
}

function init() {
    // initialize
    initUI();
    initValues();
    if (!scene) {
        createScene();
    }
    addNotes();
    addBoard();
    createLights();
    createAudioAnalyzer();

    renderer.render( scene, camera );
    
    // actions
    if (_.isEmpty(board)) {
        window.removeEventListener("keydown", handleMoves);
    } else {
        window.addEventListener("keydown", handleMoves);
    }
    animate();
    window.addEventListener( 'resize', onResize, false );
}

function main() {
    var startButton = document.getElementById( 'startButton' );
    closeButton.addEventListener( 'click', closeGame );
    loadAudio.addEventListener( 'click', addSong );
    missButton.addEventListener( 'click', handleChangeMissSetting );
    inputAudio.addEventListener( 'change', handleAddSong );
    startButton.addEventListener( 'click', init );
}

window.addEventListener('load', main, false);