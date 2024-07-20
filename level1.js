const scene = new THREE.Scene();
const size = { width: window.innerWidth, height: window.innerHeight };
const mazeWidth = size.width/100; 
const mazeHeight = size.height/100;

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
player.position.set(-mazeWidth / 2 + 0.5, 0.25, -mazeHeight / 2 + 0.5);
scene.add(player);

camera.position.set(player.position.x, player.position.y + 0.5, player.position.z + 1);
camera.lookAt(player.position);

// Generate maze
function generateMaze() {
    // Remove existing maze objects from the scene
    scene.children.forEach(child => {
        if (child instanceof THREE.Mesh && child !== player) {
            scene.remove(child);
        }
    });

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(mazeWidth, mazeHeight);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0); 
    scene.add(floor);

    const textureLoader = new THREE.TextureLoader();
    const textureUrl = './assets/images/Bricks091_1K-JPG_Color.jpg';
    const texture = textureLoader.load(textureUrl);

    // Set texture repeat to avoid stretching
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, size.height );

    // Calculate wall height based on screen height
    const wallHeight = size.height ;

    // Generate new maze walls with more open paths
    for (let x = 0; x < mazeWidth; x++) {
        for (let y = 0; y < mazeHeight; y++) {
            if (Math.random() > 0.7) { // Reduced wall density
                const wallGeometry = new THREE.BoxGeometry(1, wallHeight, 1);
                const wallMaterial = new THREE.MeshLambertMaterial({ map: texture });
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(x - mazeWidth / 2, wallHeight / 2, y - mazeHeight / 2);
                scene.add(wall);
            }
        }
    }
    const wallGeometry = new THREE.BoxGeometry(1, 2, 1);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    for (let i = -mazeWidth / 2; i <= mazeWidth / 2; i++) {
        // Top and bottom walls
        const topWall = new THREE.Mesh(wallGeometry, wallMaterial);
        topWall.position.set(i, 1, -mazeHeight / 2);
        scene.add(topWall);

        const bottomWall = new THREE.Mesh(wallGeometry, wallMaterial);
        bottomWall.position.set(i, 1, mazeHeight / 2);
        scene.add(bottomWall);
    }

    for (let j = -mazeHeight / 2; j <= mazeHeight / 2; j++) {
        // Left and right walls
        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.position.set(-mazeWidth / 2, 1, j);
        scene.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        rightWall.position.set(mazeWidth / 2, 1, j);
        scene.add(rightWall);
    }

    // Set end point position
    const endPointGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const endPointMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const endPoint = new THREE.Mesh(endPointGeometry, endPointMaterial);
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
function handleKeyDown(event) {
    const moveDistance = 0.1; // Smaller step size for smoother movement

    switch (event.key) {
        case 'ArrowUp':
            player.position.z -= moveDistance;
            break;
        case 'ArrowDown':
            player.position.z += moveDistance;
            break;
        case 'ArrowLeft':
            player.position.x -= moveDistance;
            break;
        case 'ArrowRight':
            player.position.x += moveDistance;
            break;
    }

    camera.position.set(player.position.x, player.position.y + 0.5, player.position.z + 1);
    camera.lookAt(player.position);

    checkCollision();
}

function checkCollision() {
    const halfMazeWidth = mazeWidth / 2;
    const halfMazeHeight = mazeHeight / 2;

    // Ensure player stays within maze boundaries
    if (player.position.x < -halfMazeWidth) player.position.x = -halfMazeWidth;
    if (player.position.x > halfMazeWidth) player.position.x = halfMazeWidth;
    if (player.position.z < -halfMazeHeight) player.position.z = -halfMazeHeight;
    if (player.position.z > halfMazeHeight) player.position.z = halfMazeHeight;

    // Collision detection with walls
    scene.children.forEach(child => {
        if (child !== player && child.geometry instanceof THREE.BoxGeometry) {
            const wallBox = new THREE.Box3().setFromObject(child);
            const playerBox = new THREE.Box3().setFromObject(player);

            if (playerBox.intersectsBox(wallBox)) {
                // Simple collision response: move player back to previous position
                switch (event.key) {
                    case 'ArrowUp':
                        player.position.z += moveDistance;
                        break;
                    case 'ArrowDown':
                        player.position.z -= moveDistance;
                        break;
                    case 'ArrowLeft':
                        player.position.x += moveDistance;
                        break;
                    case 'ArrowRight':
                        player.position.x -= moveDistance;
                        break;
                }
            }
        }
    });

    // Check if player reached the end point
    const endPointBox = new THREE.Box3().setFromObject(endPoint);
    const playerBox = new THREE.Box3().setFromObject(player);

    if (playerBox.intersectsBox(endPointBox)) {
        alert('You reached the end!');
        generateMaze();
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
    generateMaze();
});



