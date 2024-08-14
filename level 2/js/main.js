import * as THREE from "three";
import { Player } from './player.js';
import { FirstPersonCamera } from './camera.js';
import { MiniMap } from "./minimap.js";

// Scene creation
const scene = new THREE.Scene();

// Load skybox images
const loader = new THREE.CubeTextureLoader();
const skyboxTexture = loader.load([
  '/assets/images/le2/skybox_px.png', // Right
  '/assets/images/le2/skybox_nx.png', // Left
  '/assets/images/le2/skybox_py.png', // Top
  '/assets/images/le2/skybox_ny.png', // Bottom
  '/assets/images/le2/skybox_pz.png', // Front
  '/assets/images/le2/skybox_nz.png'  // Back
]);

scene.background = skyboxTexture;

const w = window.innerWidth;
const h = window.innerHeight;
const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(25, 10, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Variables
const walls = [];
const clock = new THREE.Clock();
const snow_wall = '/assets/images/le2/wall_stone.jpeg';
const snow_floor = '/assets/images/le2/snow_floor.jpg';
const goldtex = '/assets/images/le2/gold_text.webp';
const wall_height = 7;
const wall_width = 0.5;
const cell_size = 10;
const end_point = { i: 9, j: 0.5 };

let miniMap, player, firstPersonCamera, endMarker = null;

// Rendering loop
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (player && player.player) {
    player.update(delta);
    firstPersonCamera.update();

    const playerPosition = player.player.position;

    //update the minimap
    miniMap.update({
      x: Math.round(playerPosition.x / cell_size),
      y: Math.round(playerPosition.z / cell_size)
    });
  }

  renderer.render(scene, camera);
}


fetch('/level%202/map/mazeData.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(mazeData => {
    console.log('Maze data:', mazeData);
    const maze_width = mazeData.reduce((max, cell) => Math.max(max, cell.i), 0) + 1;
    const maze_height = mazeData.reduce((max, cell) => Math.max(max, cell.j), 0) + 1;

    create_floor(maze_width, maze_height, cell_size, snow_floor); 
    createMaze(mazeData); 

    miniMap = new MiniMap(maze_width, maze_height);
    miniMap.drawMaze(mazeData); 

    miniMap.setEndPosition({ x: 9, y: 0.5 });
    
   
    endMarker = createEndMarker(end_point, cell_size);
    if(endMarker != null){
      console.log("Created");
    }else {
      console.log("NO");
    }

    //initialize the player and camera
    player = new Player(scene, walls, endMarker);
    return player.loadModel();
  })
  .then(() => {
    //initialize the first-person camera after the player model is loaded
    firstPersonCamera = new FirstPersonCamera(camera, player.player);
    
    animate();
  })
  .catch(error => {
    console.error('Error fetching the maze data:', error);
  });


// Handle Fullscreen on F11 Key
window.addEventListener('keydown', (event) => {
  if (event.code === 'F11') {
    event.preventDefault();

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  //keyboard controls for player movement
  switch (event.code) {
    case 'ArrowUp':
      player.setVelocity(0, 1);
      break;
    case 'ArrowDown':
      player.setVelocity(0, -1);
      break;
    case 'ArrowLeft':
      player.player.rotation.y += 0.05;
      break;
    case 'ArrowRight':
      player.player.rotation.y -= 0.05;
      break;
  }
});

window.addEventListener('keyup', () => {
  player.setVelocity(0, 0);
});

//handle Window Resize 
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});


// Function to create the floor
function create_floor(maze_width, maze_height, cell_size, snow_floor) {
  const floorGeometry = new THREE.PlaneGeometry(maze_width * cell_size, maze_height * cell_size);
  const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);

  floor.rotation.x = Math.PI / 2; // Make the floor lie on the xz plane
  floor.position.set(
    (maze_width * cell_size) / 2 - cell_size / 2,
    0,
    (maze_height * cell_size) / 2 - cell_size / 2
  );

  scene.add(floor);
}

//function to create the maze walls
function createMaze(mazeData) {
  mazeData.forEach(cell => {
    const { i, j, walls } = cell;
    const x = i * cell_size;
    const z = j * cell_size;

    if (walls[0]) { //top
      createWall(new THREE.Vector3(x - cell_size / 2, 0, z - cell_size / 2),
        new THREE.Vector3(x + cell_size / 2, 0, z - cell_size / 2),
        true, snow_wall);
    }
    if (walls[1]) { //right
      createWall(new THREE.Vector3(x + cell_size / 2, 0, z - cell_size / 2),
        new THREE.Vector3(x + cell_size / 2, 0, z + cell_size / 2),
        false, snow_wall);
    }
    if (walls[2]) { //bottom
      createWall(new THREE.Vector3(x - cell_size / 2, 0, z + cell_size / 2),
        new THREE.Vector3(x + cell_size / 2, 0, z + cell_size / 2),
        true, snow_wall);
    }
    if (walls[3]) { //left
      createWall(new THREE.Vector3(x - cell_size / 2, 0, z - cell_size / 2),
        new THREE.Vector3(x - cell_size / 2, 0, z + cell_size / 2),
        false, snow_wall);
    }
  });
}

function createWall(start, end, isHorizontal, snow_wall) {
  const length = start.distanceTo(end);
  const geometry = new THREE.BoxGeometry(isHorizontal ? length : wall_width, wall_height, isHorizontal ? wall_width : length);
  const texture = new THREE.TextureLoader().load(snow_wall);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const wall = new THREE.Mesh(geometry, material);

  const x = (start.x + end.x) / 2;
  const y = wall_height / 2 + 0.1;
  const z = (start.z + end.z) / 2;
  wall.position.set(x, y, z);

  scene.add(wall);
  walls.push(wall); // for collision detection
}

function createEndMarker(end, cell_size) {
  const endX = end.i * cell_size - cell_size / 2;
  const endZ = end.j * cell_size - cell_size / 2;
  const position = new THREE.Vector3(endX, 1, endZ);

  const geometry = new THREE.BoxGeometry(3, 3, 3);
  const texture = new THREE.TextureLoader().load(goldtex);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const marker = new THREE.Mesh(geometry, material);

  marker.position.copy(position);
  scene.add(marker);

  return marker;
}

// //camera view
// camera.position.set(0, 65, 65);
// camera.lookAt(new THREE.Vector3(0, 0, 0));