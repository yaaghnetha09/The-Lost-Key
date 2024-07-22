const scene = new THREE.Scene();
const size = { width: window.innerWidth, height: window.innerHeight };
const mazeWidth = size.width / 100;
const mazeHeight = size.height / 100;

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

camera.position.set(player.position.x, player.position.y + 0.5, player.position.z + 1);
camera.lookAt(player.position);

// Maze walls and end point
let mazeWalls = [];
let endPoint;

// Generate maze
function generateMaze() {
    // Remove existing maze objects from the scene
    scene.children.forEach(child => {
        if (child instanceof THREE.Mesh && child != player) {
            scene.remove(child);
        }
    });
    mazeWalls = [];

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(mazeWidth, mazeHeight);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    scene.add(floor);

    const textureLoader = new THREE.TextureLoader();
    const textureUrl = 'https://i1.wp.com/img.talkandroid.com/uploads/2012/05/Temple_Run_Wallpaper_A.png';
    const texture = textureLoader.load(textureUrl);

    // Set texture repeat to avoid stretching
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, size.height);

    // Calculate wall height based on screen height
    const wallHeight = size.height;

    // Generate new maze walls with more open paths
    for (let x = 0; x < mazeWidth; x++) {
        for (let y = 0; y < mazeHeight; y++) {
            if (Math.random() > 0.7) { // Reduced wall density
                const wallGeometry = new THREE.BoxGeometry(1, wallHeight, 1);
                const wallMaterial = new THREE.MeshLambertMaterial({ map: texture });
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(x - mazeWidth / 2, wallHeight / 2, y - mazeHeight / 2);
                scene.add(wall);
                mazeWalls.push(wall);
            }
        }
    }

    // boundary wall condition start
    const boundaryWallGeometry = new THREE.BoxGeometry(1, wallHeight, 1);
    const boundaryWallMaterial = new THREE.MeshLambertMaterial({ map: texture });

    for (let i = -mazeWidth / 2; i <= mazeWidth / 2; i++) {
        // Top and bottom walls
        const topWall = new THREE.Mesh(boundaryWallGeometry, boundaryWallMaterial);
        topWall.position.set(i, wallHeight / 2, -mazeHeight / 2);
        scene.add(topWall);

        const bottomWall = new THREE.Mesh(boundaryWallGeometry, boundaryWallMaterial);
        bottomWall.position.set(i, wallHeight / 2, mazeHeight / 2);
        scene.add(bottomWall);
    }

    for (let i = -mazeHeight / 2; i <= mazeHeight / 2; i++) {
        // Left and right walls
        const leftWall = new THREE.Mesh(boundaryWallGeometry, boundaryWallMaterial);
        leftWall.position.set(-mazeWidth / 2, wallHeight / 2, i);
        scene.add(leftWall);

        const rightWall = new THREE.Mesh(boundaryWallGeometry, boundaryWallMaterial);
        rightWall.position.set(mazeWidth / 2, wallHeight / 2, i);
        scene.add(rightWall);
    }
    // boundary wall condition end

    // Set end point position
    const endPointGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const endPointMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    endPoint = new THREE.Mesh(endPointGeometry, endPointMaterial);
    endPoint.position.set(mazeWidth / 2 - 1, 0.25, mazeHeight / 2 - 1);
    scene.add(endPoint);
}
generateMaze();

// Render loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

// Player movement and collision detection
let lastKey = '';

function handleKeyDown(event) {
    const moveDistance = 0.1; // Smaller step size for smoother movement
    let rotationDelta = 0;
    const rotationSpeed = 0.05; // Speed of rotation

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
    generateMaze();
});