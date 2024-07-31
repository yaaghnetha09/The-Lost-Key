import * as THREE from "three";
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
// renderer.setAnimationLoop( animate );
document.body.appendChild(renderer.domElement);


// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(50, 50, 50);
scene.add(pointLight);

// wall creation

// Wall dimensions
  const wallHeight = 1;
  const wallWidth = 0.1;
  const cellSize = 1;

  // Fetch the maze data
  fetch('./mazeData.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(mazeData => {
    console.log('Maze data:', mazeData);
    createMaze(mazeData);
    animate();
  })
  .catch(error => {
    console.error('Error fetching the maze data:', error);
  });

  // Create maze walls using mazeData
  function createMaze(mazeData) {
    mazeData.forEach(cell => {
      const { i, j, walls } = cell;
      const x = i * cellSize;
      const z = j * cellSize;

      if (walls[0]) { // Top wall
        createWall(
          new THREE.Vector3(x - cellSize / 2, 0, z - cellSize / 2),
          new THREE.Vector3(x + cellSize / 2, 0, z - cellSize / 2)
        );
      }
      if (walls[1]) { // Right wall
        createWall(
          new THREE.Vector3(x + cellSize / 2, 0, z - cellSize / 2),
          new THREE.Vector3(x + cellSize / 2, 0, z + cellSize / 2)
        );
      }
      if (walls[2]) { // Bottom wall
        createWall(
          new THREE.Vector3(x - cellSize / 2, 0, z + cellSize / 2),
          new THREE.Vector3(x + cellSize / 2, 0, z + cellSize / 2)
        );
      }
      if (walls[3]) { // Left wall
        createWall(
          new THREE.Vector3(x - cellSize / 2, 0, z - cellSize / 2),
          new THREE.Vector3(x - cellSize / 2, 0, z + cellSize / 2)
        );
      }
    });
  }

  function createWall(start, end) {
    const distance = start.distanceTo(end);
    const geometry = new THREE.BoxGeometry(distance, wallHeight, wallWidth);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set((start.x + end.x) / 2, wallHeight / 2, (start.z + end.z) / 2);
    wall.lookAt(end);
    scene.add(wall);
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }