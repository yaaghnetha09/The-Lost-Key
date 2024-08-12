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

// Create player
const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(-mazeWidth / 2 + 1, 0.25, -mazeHeight / 2 + 1);
scene.add(player);

// Maze walls and end point
let mazeWalls = [];
let endPoint;

// Wall texture
const textureLoader = new THREE.TextureLoader();
const wallTextureUrl = './assets/textures/wall2.jpg';
const wallTexture = textureLoader.load(wallTextureUrl);

// Load the floor texture
const floorTextureUrl = './assets/textures/floor2.jpg';
const floorTexture = textureLoader.load(floorTextureUrl);

// Ceiling texture
const ceilingTextureUrl = './assets/textures/floor2.jpg';
const ceilingTexture = textureLoader.load(ceilingTextureUrl);

// Set texture repeat to avoid stretching if necessary
ceilingTexture.wrapS = THREE.RepeatWrapping;
ceilingTexture.wrapT = THREE.RepeatWrapping;
ceilingTexture.repeat.set(mazeWidth, mazeHeight);

function createCeiling() {
    const ceilingGeometry = new THREE.PlaneGeometry(mazeWidth, mazeHeight);
    const ceilingMaterial = new THREE.MeshLambertMaterial({ map: ceilingTexture });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2; // Rotate to horizontal
    ceiling.position.y = 2; // Position it above the walls
    scene.add(ceiling);
}

// Set texture repeat to avoid stretching
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

// Utility function to shuffle an array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Initialize Audio Context and Load Sound
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let collisionSoundBuffer;

function loadSound(url) {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => audioContext.decodeAudioData(data))
        .then(buffer => buffer);
}

loadSound('./assets/sound/collision.mp3').then(buffer => {
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
            maze[x + direction.x][z + direction.z] = false; // carve between cells
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

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(mazeWidth, mazeHeight);
    const floorMaterial = new THREE.MeshLambertMaterial({ map: floorTexture });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Initialize maze data
    initializeMaze();

    // Start recursive backtracking from top-left corner
    carvePath(1, 1);

    // Add boundary walls and maze walls
    for (let x = 0; x < mazeWidth; x++) {
        for (let z = 0; z < mazeHeight; z++) {
            if (maze[x][z]) {
                createWall(x - mazeWidth / 2, 1, z - mazeHeight / 2);
            }
        }
    }

    // Set end point position
    const endPointGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const endPointMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    endPoint = new THREE.Mesh(endPointGeometry, endPointMaterial);
    endPoint.position.set(mazeWidth / 2 - 2, 0.25, mazeHeight / 2 - 2);
    scene.add(endPoint);
}

// Initial maze generation
generateMaze();
createCeiling();
// Render loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    updateMiniMap();
}

animate();

// Player movement and collision detection
let lastKey = '';

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
        case 'ArrowLeft':
            rotationDelta = rotationSpeed;
            break;
        case 'ArrowRight':
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

    // Check if player reached the end point
    const endPointBox = new THREE.Box3().setFromObject(endPoint);
    if (playerBox.intersectsBox(endPointBox)) {
        alert('You reached the end!');
        generateMaze();
    }

    return false;
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
        (endPoint.position.x + mazeWidth / 2) * (miniMapWidth / mazeWidth),
        (endPoint.position.z + mazeHeight / 2) * (miniMapHeight / mazeHeight),
        miniMapWidth / mazeWidth,
        miniMapHeight / mazeHeight
    );

    const miniMapImage = miniMapCanvas.toDataURL();
    document.getElementById('mini-map').src = miniMapImage;
}
