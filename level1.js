const scene = new THREE.Scene();
const size = { width: window.innerWidth, height: window.innerHeight };
const mazeWidth = 15;
const mazeHeight = 15;

// Camera setup
const camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector(".webgl") });
renderer.setSize(size.width, size.height);
// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 10, 7.5).normalize();
scene.add(directionalLight);

// Create player
const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
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
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Generate new maze walls with more open paths
    for (let x = 0; x < mazeWidth; x++) {
        for (let y = 0; y < mazeHeight; y++) {
            if (Math.random() > 0.7) { // Reduced wall density
                const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
                const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(x - mazeWidth / 2, 0.5, y - mazeHeight / 2);
                scene.add(wall);
            }
        }
    }

    // Set end point position
    const endPointGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const endPointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const endPoint = new THREE.Mesh(endPointGeometry, endPointMaterial);
    endPoint.position.set(mazeWidth / 2 - 1, 0.25, mazeHeight / 2 - 1);
    scene.add(endPoint);
}

generateMaze();
