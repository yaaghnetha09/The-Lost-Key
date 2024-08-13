import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

const scene = new THREE.Scene();
const size = { width: window.innerWidth, height: window.innerHeight };
const mazeWidth = Math.floor(size.width / 100);
const mazeHeight = Math.floor(size.height / 100);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
camera.position.set(0, 10, 20);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector(".webgl") });
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 10, 7.5).normalize();
scene.add(directionalLight);

//player
let player;
let playerLoaded = false;
let treasureChestLoaded = false;

loader.load('../character/boyfinal.glb', (gltf) => {
    player = gltf.scene;
    player.scale.set(0.5, 0.5, 0.5); 
    player.position.set(-mazeWidth / 2 + 1, 0.5, -mazeHeight / 2 + 1);
    scene.add(player);
    playerLoaded = true;
}, undefined, (error) => {
    const box = new THREE.Box3().setFromObject(player);
    console.log('Bounding box:', box);
}, undefined, (error) => {
    console.error('Error loading model:', error);
});

// Maze walls and treasure box
let mazeWalls = [];
let treasureChest;

// Wall texture
const textureLoader = new THREE.TextureLoader();
const wallTextureUrl = '/assets/images/le1/wall2.jpg';
const wallTexture = textureLoader.load(wallTextureUrl);

//floor texture
const floorTextureUrl = '/assets/images/le1/floor2.jpg';
const floorTexture = textureLoader.load(floorTextureUrl);

// Ceiling texture
const ceilingTextureUrl = '/assets/images/le1/floor2.jpg';
const ceilingTexture = textureLoader.load(ceilingTextureUrl);

//texture repeat to avoid stretching
ceilingTexture.wrapS = THREE.RepeatWrapping;
ceilingTexture.wrapT = THREE.RepeatWrapping;
ceilingTexture.repeat.set(mazeWidth, mazeHeight);

function createCeiling() {
    const ceilingGeometry = new THREE.PlaneGeometry(mazeWidth, mazeHeight);
    const ceilingMaterial = new THREE.MeshLambertMaterial({ map: ceilingTexture });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2; 
    ceiling.position.y = 2;
    scene.add(ceiling);
}

function createTreasureChest() {
    const cubeSize = 0.5;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 }); // Gold color
    return new THREE.Mesh(cubeGeometry, cubeMaterial);
}
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(mazeWidth, mazeHeight);

// Maze dimensions and data
const maze = [];
const visited = [];
const directions = [
    { x: 0, z: -1 }, // Up
    { x: 1, z: 0 },  // Right
    { x: 0, z: 1 },  // Down
    { x: -1, z: 0 }  // Left
];

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//Audio Context and Load Sound
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let collisionSoundBuffer;

function loadSound(url) {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => audioContext.decodeAudioData(data))
        .then(buffer => buffer);
}

loadSound('/assets/sound/collision.mp3').then(buffer => {
    collisionSoundBuffer = buffer;
});

function playSound(buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function initializeMaze() {
    for (let x = 0; x < mazeWidth; x++) {
        maze[x] = [];
        visited[x] = [];
        for (let y = 0; y < mazeHeight; y++) {
            maze[x][y] = true; // true represents a wall
            visited[x][y] = false;
        }
    }
}

function isValid(x, z) {
    return x >= 0 && x < mazeWidth && z >= 0 && z < mazeHeight;
}

function carvePath(x, z) {
    visited[x][z] = true;
    maze[x][z] = false; // false represents a path

    // Shuffle directions for randomized paths
    shuffle(directions);

    for (const direction of directions) {
        const newX = x + direction.x * 2;
        const newZ = z + direction.z * 2;

        if (isValid(newX, newZ) && !visited[newX][newZ]) {
            maze[x + direction.x][z + direction.z] = false;
            carvePath(newX, newZ);
        }
    }
}

function createWall(x, y, z) {
    const wallGeometry = new THREE.BoxGeometry(1, 2, 1);
    const wallMaterial = new THREE.MeshLambertMaterial({ map: wallTexture });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, y, z);
    scene.add(wall);
    mazeWalls.push(wall);
}

// Generate maze
function generateMaze() {
    // Clear previous walls and floor
    for (let i = scene.children.length - 1; i >= 0; i--) {
        const child = scene.children[i];
        if (child instanceof THREE.Mesh && child !== player) {
            scene.remove(child);
        }
    }
    mazeWalls = [];

    //floor
    const floorGeometry = new THREE.PlaneGeometry(mazeWidth, mazeHeight);
    const floorMaterial = new THREE.MeshLambertMaterial({ map: floorTexture });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Initialize maze data
    initializeMaze();

    // Start recursive backtracking from top-left corner
    carvePath(1, 1);

    //boundary walls
    for (let x = -1; x <= mazeWidth; x++) {
        createWall(x - mazeWidth / 2, 1, -mazeHeight / 2 - 1); // Bottom boundary
        createWall(x - mazeWidth / 2, 1, mazeHeight / 2);     // Top boundary
    }
    for (let z = 0; z < mazeHeight; z++) {
        createWall(-mazeWidth / 2 - 1, 1, z - mazeHeight / 2); // Left boundary
        createWall(mazeWidth / 2, 1, z - mazeHeight / 2);     // Right boundary
    }

    //internal maze walls
    for (let x = 0; x < mazeWidth; x++) {
        for (let z = 0; z < mazeHeight; z++) {
            if (maze[x][z]) {
                createWall(x - mazeWidth / 2, 1, z - mazeHeight / 2);
            }
        }
    }
    treasureChest = createTreasureChest();
    treasureChest.position.set(mazeWidth / 2 - 2, 0.25, mazeHeight / 2 - 2);
    scene.add(treasureChest);
    //ceiling
    createCeiling();
}

generateMaze();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    updateMiniMap();
    if (playerLoaded && treasureChestLoaded) {
        updateMiniMap();
    }
}

animate();
let lastKey;

function handleKeyDown(event) {
    const moveDistance = 0.1;
    let rotationDelta = 0;
    const rotationSpeed = 0.05;

    lastKey = event.key;
    const prevPosition = player.position.clone();

    switch (event.key) {
        case 'ArrowUp':
            player.position.x += Math.sin(player.rotation.y) * moveDistance;
            player.position.z += Math.cos(player.rotation.y) * moveDistance;
            break;
        case 'ArrowDown':
            player.position.x -= Math.sin(player.rotation.y) * moveDistance;
            player.position.z -= Math.cos(player.rotation.y) * moveDistance;
            break;
        case 'a':
            rotationDelta = rotationSpeed;
            break;
        case 'd':
            rotationDelta = -rotationSpeed;
            break;
    }

    player.rotation.y += rotationDelta;

    camera.position.set(
        player.position.x - Math.sin(player.rotation.y) * 0.9,
        player.position.y + 0.45,
        player.position.z - Math.cos(player.rotation.y) * 0.9
    );
    camera.lookAt(player.position);

    if (checkCollision()) {
        player.position.copy(prevPosition);
    }
}

function checkCollision() {
    const playerBox = new THREE.Box3().setFromObject(player);

    for (let i = 0; i < mazeWalls.length; i++) {
        const wallBox = new THREE.Box3().setFromObject(mazeWalls[i]);
        if (playerBox.intersectsBox(wallBox)) {
            playSound(collisionSoundBuffer);
            return true;
        }
    }

    if (treasureChest) {
        const chestBox = new THREE.Box3().setFromObject(treasureChest);
        if (playerBox.intersectsBox(chestBox)) {
            console.log('You have reached the treasure chest!');
            alert('You reached the treasure chest!');
            generateMaze();
            window.location.href = './http://127.0.0.1:5501/level%202/index.html';
            return;
        }
    }
}

window.addEventListener('keydown', handleKeyDown);

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    size.width = window.innerWidth;
    size.height = window.innerHeight;
});

function updateMiniMap() {
    if (!player || !treasureChest) {
        console.warn('Player or treasure chest not loaded yet');
        return;
    }
    const miniMapCanvas = document.createElement('canvas');
    const miniMapWidth = 200;
    const miniMapHeight = 200;
    miniMapCanvas.width = miniMapWidth;
    miniMapCanvas.height = miniMapHeight;
    const miniMapContext = miniMapCanvas.getContext('2d');

    miniMapContext.fillStyle = '#fff';
    miniMapContext.fillRect(0, 0, miniMapWidth, miniMapHeight);

    miniMapContext.fillStyle = '#000';
    for (const wall of mazeWalls) {
        miniMapContext.fillRect(
            (wall.position.x + mazeWidth / 2) * (miniMapWidth / mazeWidth),
            (wall.position.z + mazeHeight / 2) * (miniMapHeight / mazeHeight),
            miniMapWidth / mazeWidth,
            miniMapHeight / mazeHeight
        );
    }

    miniMapContext.fillStyle = '#0f0';
    miniMapContext.fillRect(
        (player.position.x + mazeWidth / 2) * (miniMapWidth / mazeWidth),
        (player.position.z + mazeHeight / 2) * (miniMapHeight / mazeHeight),
        miniMapWidth / mazeWidth,
        miniMapHeight / mazeHeight
    );

    miniMapContext.fillStyle = '#f00';
    miniMapContext.fillRect(
        (treasureChest.position.x + mazeWidth / 2) * (miniMapWidth / mazeWidth),
        (treasureChest.position.z + mazeHeight / 2) * (miniMapHeight / mazeHeight),
        miniMapWidth / mazeWidth,
        miniMapHeight / mazeHeight
    );

    const miniMapImage = miniMapCanvas.toDataURL();
    document.getElementById('mini-map').src = miniMapImage;
}
