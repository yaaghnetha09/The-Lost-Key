import * as THREE from 'three';
import { createCamera } from './camera.js';

export function createScene() {
  const gameWindow = document.getElementById('render-target');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x777777);

  const camera = createCamera(gameWindow);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(gameWindow.offsetWidth, gameWindow.offsetHeight);
  gameWindow.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const loader = new THREE.CubeTextureLoader();
const textureCube = loader.load([
  'public/x minus.jpeg',
  'public/x plus.jpeg',
  'public/y minus.jpeg',
  'public/y plus.jpeg',
  'public/z minus.jpeg',
  'public/z plus.jpeg',
]);
scene.background = textureCube;


  let player = null;
  let endPoint = null;
  let city = null;
  let allBuildingMeshes = [];

  const playerSpeed = 5; 
  const jumpSpeed = 10; 
  const gravity = 9.8; 
  let isJumping = false;
  let jumpVelocity = 0;
  let isGrounded = false;

  let moveDirection = { x: 0, z: 0 };
  let playerRotationY = 0;
  let rotationSpeed = 0.05;

  
  const textureLoader = new THREE.TextureLoader();
const textures = [
    textureLoader.load('public/Prédio 1.jpeg'), 
    textureLoader.load('public/Light blue tile Wall Online Zoom Background Template - VistaCreate.jpeg'), 
    textureLoader.load('public/Predio 6.jpeg')
];

  


  function initialize(cityData) {
    city = cityData;
    scene.clear();
    allBuildingMeshes = [];

    addRoads();

    // Add grass ground
    const groundGeometry = new THREE.PlaneGeometry(city.size, city.size);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(city.size / 2 - 0.5, 0, city.size / 2 - 0.5);
    scene.add(ground);

    for (let x = 0; x < city.size; x++) {
      for (let y = 0; y < city.size; y++) {
        const tile = city.data[x][y];
        if (tile.building) {
          const height = Number(tile.building.slice(-1));
          const buildingGeometry = new THREE.BoxGeometry(1, height, 1);

          const textureIndex = (x + y) % textures.length; 
          const buildingMaterial = new THREE.MeshLambertMaterial({  map: textures[textureIndex] });
          const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
          buildingMesh.position.set(x, height / 2, y);
          buildingMesh.userData = { height };
          scene.add(buildingMesh);
          allBuildingMeshes.push(buildingMesh); 
      }
    }
  }

    player = createPlayerOnBuilding();
    endPoint = createEndPointOnBuilding();

    setupLights();
  }

  function addRoads() {
    const roadWidth = 2;
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

    for (let x = 0; x < city.size; x++) {
      for (let y = 0; y < city.size; y++) {
        if ((x % 2 === 0 || y % 2 === 0) && !(city.data[x][y].building)) {
          const roadGeometry = new THREE.BoxGeometry(roadWidth, 0.1, roadWidth);
          const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
          roadMesh.position.set(x, 0, y);
          scene.add(roadMesh);

          const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const lineGeometry = new THREE.BoxGeometry(0.1, 0.01, roadWidth);
          const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
          lineMesh.position.set(x, 0.05, y);
          scene.add(lineMesh);
        }
      }
    }
  }

  
  function createPlayerOnBuilding() {
    const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);

    for (let x = 0; x < city.size; x++) {
      for (let y = 0; y < city.size; y++) {
        const tile = city.data[x][y];
        if (tile.building) {
          const height = Number(tile.building.slice(-1));
          playerMesh.position.set(x, height + 0.25, y);
          scene.add(playerMesh);
          return playerMesh;
        }
      }
    }

    playerMesh.position.set(-4, 0.25, -4);
    scene.add(playerMesh);
    return playerMesh;
  }

  function createEndPointOnBuilding() {
    const endPointGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const endPointMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const endPointMesh = new THREE.Mesh(endPointGeometry, endPointMaterial);

    for (let x = city.size - 1; x >= 0; x--) {
      for (let y = city.size - 1; y >= 0; y--) {
        const tile = city.data[x][y];
        if (tile.building) {
          const height = Number(tile.building.slice(-1));
          endPointMesh.position.set(x, height + 0.25, y);
          scene.add(endPointMesh);
          return endPointMesh;
        }
      }
    }
    
    endPointMesh.position.set(4, 0.25, 4);
    scene.add(endPointMesh);
    return endPointMesh;
  }

  function setupLights() {
    const lights = [
      new THREE.AmbientLight(0xffffff, 0.2),
      new THREE.DirectionalLight(0xffffff, 0.3),
      new THREE.DirectionalLight(0xffffff, 0.3),
      new THREE.DirectionalLight(0xffffff, 0.3),
    ];

    lights[1].position.set(0, 1, 0);
    lights[2].position.set(1, 1, 0);
    lights[3].position.set(0, 1, 1);

    scene.add(...lights);
  }

  function draw(delta) {
    renderer.render(scene, camera);
    applyGravity(delta);
    movePlayer(delta);
    updateCamera();
    checkEndPoint();
  }

  function start() {
    let lastTime = performance.now();
    function animate() {
      const now = performance.now();
      const delta = (now - lastTime) / 1000; 
      lastTime = now;
      draw(delta);
      requestAnimationFrame(animate);
    }
    animate();
  }

  function stop() {
    renderer.setAnimationLoop(null);
  }

  function movePlayer(delta) {
    if (player) {
      const moveSpeed = playerSpeed * delta;
      player.position.x += Math.sin(player.rotation.y) * moveDirection.z * moveSpeed;
      player.position.z += Math.cos(player.rotation.y) * moveDirection.z * moveSpeed;
      player.position.x += Math.cos(player.rotation.y) * moveDirection.x * moveSpeed;
      player.position.z -= Math.sin(player.rotation.y) * moveDirection.x * moveSpeed;


      
      const playerBoundingBox = new THREE.Box3().setFromObject(player);

      let onBuilding = false;
      for (const buildingMesh of allBuildingMeshes) {
        const buildingBoundingBox = new THREE.Box3().setFromObject(buildingMesh);
        if (playerBoundingBox.intersectsBox(buildingBoundingBox)) {
          onBuilding = true;

          
          const buildingHeight = buildingMesh.userData.height;
          if (player.position.y < buildingHeight) {
            player.position.y = buildingHeight + 0.25; 
          }
          isGrounded = true; 
        }
      }

      if (!onBuilding) {
        isGrounded = false; 
      }
    }
  }

  function rotatePlayer(rotationDelta) {
    if (player) {
      player.rotation.y += rotationDelta * rotationSpeed;
    }
  }

  function jumpPlayer() {
    if (isGrounded) {
      isJumping = true;
      jumpVelocity = jumpSpeed;
    }
  }

  function applyGravity(delta) {
    if (player) {
      if (isGrounded) {
        player.position.y = Math.floor(player.position.y) + 0.25;
        if (!isJumping) {
          jumpVelocity = 0;
        }
      } else {
        jumpVelocity -= gravity * delta;
        player.position.y += jumpVelocity * delta;

       
        if (player.position.y < 0.25) {
          alert("You fell off the building! Game Over.");
          stop();
        }
      }

      if (isJumping) {
        player.position.y += jumpVelocity * delta;
        jumpVelocity -= gravity * delta;

        if (jumpVelocity <= 0) {
          isJumping = false;
        }
      }
    }
  }

  function updateCamera() {
    if (player) {
      camera.position.set(
        player.position.x - Math.sin(player.rotation.y) * 0.9,
        player.position.y + 0.45,
        player.position.z - Math.cos(player.rotation.y) * 0.9
      );
      camera.lookAt(player.position);
    }
  }

  function checkEndPoint() {
    if (player && endPoint) {
      const distance = player.position.distanceTo(endPoint.position);
      if (distance < 0.5) {
        alert("You reached the end point! You win!");
        stop();
      }
    }
  }

  window.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowUp':
        moveDirection.z = 1;
        break;
      case 'ArrowDown':
        moveDirection.z = -1;
        break;
      case 'a':
        playerRotationY += rotationSpeed;
        break;
      case 'd':
        playerRotationY -= rotationSpeed;
        break;
      case ' ':
        jumpPlayer();
        break;
    }
    if (player) {
      player.rotation.y = playerRotationY;
    }
  });

  window.addEventListener('keyup', (event) => {
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        moveDirection.z = 0;
        break;
    }
  });

  start();

  return { scene, stop, initialize };
}