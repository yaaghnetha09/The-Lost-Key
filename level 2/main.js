import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

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


const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(50, 50, 50);
scene.add(pointLight);

// wall creation

// wall dimension
wallHeight = 1;
wallWidth = 0.1;
cellSize = 1;

// Fetch the maze data
fetch('mazeData.json')
  .then(response => response.json())
  .then(mazeData => {
    createMaze(mazeData);
    animate();
  })
  .catch(error => console.error('Error fetching the maze data:', error));

// create maze walls using mazeData
mazeData.forEach(cell => {
    const { i, j, walls } = cell;
    const x = i * cellSize;
    const z = j * cellSize;

    if (walls[0]) {
        createWall();
    }
    if (walls[1]) {
        createWall();
    }
    if (walls[2]) {
        createWall();
    }
    if (walls[3]) {
        createWall();
    }
});

// create wall
const createWall = (start, end) => {
    const geometry = new THREE.BoxGeometry(0.1, wallHeight, start.distanceTo(end));
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set((start.x + end.x) / 2, wallHeight / 2, (start.z + end.z) / 2);
    //to face the end point
    wall.lookAt(end);
    scene.add(wall);
};

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// renderer.render(scene, camera);
