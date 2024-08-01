import * as THREE from "three";
// import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';


//scene creation
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


// //adding of OrbitControls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableZoom = true;
// controls.autoRotate = false;


//lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(50, 50, 50);
scene.add(pointLight);


//fetching of the maze data from mazeData.json file
fetch('./mazeData.json')
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
})
.then(mazeData =>{
  console.log('Maze data:', mazeData);
  createMaze(mazeData);
  animate();
})
.catch(error =>{
  console.error('Error fetching the maze data:', error);
});


// wall creation
// Wall dimensions
  const wall_height = 3;
  const wall_width = 0.2;
  const cell_size = 5;

  //maze creation
  //create maze walls using mazeData
  function createMaze(mazeData){
    mazeData.forEach(cell => {
      const { i, j, walls } = cell;
      const x = i * cell_size;
      const z = j * cell_size;

      if (walls[0]){ //top wall
        createWall(
          new THREE.Vector3(x-cell_size/2, 0, z-cell_size/2),
          new THREE.Vector3(x+cell_size/2, 0, z-cell_size/2),
          true
        );
      }
      if (walls[1]) { //right wall
        createWall(
          new THREE.Vector3(x+cell_size/2, 0, z-cell_size/2),
          new THREE.Vector3(x+cell_size/2, 0, z+cell_size/2),
          false
        );
      }
      if (walls[2]) { //bottom wall
        createWall(
          new THREE.Vector3(x-cell_size/2, 0, z+cell_size/2),
          new THREE.Vector3(x+cell_size/2, 0, z+cell_size/2),
          true
        );
      }
      if (walls[3]) { //left wall
        createWall(
          new THREE.Vector3(x-cell_size/2, 0, z-cell_size/2),
          new THREE.Vector3(x-cell_size/2, 0, z+cell_size/2),
          false
        );
      }
    });
  }

  function createWall(start, end, isHorizontal) {
    const length = start.distanceTo(end);
    const geometry = new THREE.BoxGeometry(
      isHorizontal ? length : wall_width, 
    wall_height, 
    isHorizontal ? wall_width : length
    )
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const wall = new THREE.Mesh(geometry, material);
  
    //Set wall position at the midpoint
    wall.position.set(
      (start.x + end.x) / 2,
      wall_height / 2,
      (start.z + end.z) / 2
    );
  
    scene.add(wall);
  }

  function createWindow(position, width, height) {
    const length = width;//length = width
    const depth = 0.1;//to make the window thin to look realistic 
    const geometry = new THREE.BoxGeometry(length,height,depth);
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00, transparent: true, opacity: 0.5});
    const window = new THREE.Mesh(geometry, material);
  
    //window position
    window.position.set(position.x, position.y, position.z);
  
    scene.add(window);

    if (isHorizontal){
      const window_position = new THREE.Vector3(
        (start.x + end.x) / 2,
        wall_height / 2,
        (start.z + end.z) / 2
      );
      createWindow(window_position, 2, 1);
    } else{
      const window_position=new THREE.Vector3(
        (start.x + end.x) / 2,
        wall_height / 2,
        (start.z + end.z) / 2
      );
      createWindow(window_position, 2, 1);
    }
  }
  



//camera view
camera.position.set(0, 65, 65);
camera.lookAt(new THREE.Vector3(0, 0, 0));


// rendering
  function animate() {
    requestAnimationFrame(animate);
    // controls.update();
    renderer.render(scene, camera);
  }