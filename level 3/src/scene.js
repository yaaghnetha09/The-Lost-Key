import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/loaders/GLTFLoader.js';
import { createCamera } from './camera.js';

export function createScene() {
  const gameWindow = document.getElementById('render-target');

  const scene = new THREE.Scene();
  scene.background = 'public/sky box/Daylight Box_Top.bmp'

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

  let player = null;
  let isPlayerLoaded = false;
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

const roadWidth = 2; 

function initialize(cityData) {
  city = cityData;
  scene.clear();
  allBuildingMeshes = [];

  addRoads(); 

  for (let x = 0; x < city.size; x++) {
      for (let y = 0; y < city.size; y++) {
          const tile = city.data[x][y];
          if (tile.building) {
             const height = Number(tile.building.slice(-1)); 
              const buildingGeometry = new THREE.BoxGeometry(roadWidth, height, roadWidth);

              const textureIndex = (x + y) % textures.length; 
              const buildingMaterial = new THREE.MeshLambertMaterial({ map: textures[textureIndex] });
              const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);

              buildingMesh.position.set(x * roadWidth - (city.size * roadWidth) / 2 + roadWidth / 2, height / 2, y * roadWidth - (city.size * roadWidth) / 2 + roadWidth / 2);

              buildingMesh.userData = { height };
              scene.add(buildingMesh);
              allBuildingMeshes.push(buildingMesh);
          }
      }
  }

  setupLights();

  const loader = new GLTFLoader();
loader.load('../character/charactermain.glb', function (gltf) {
    player = gltf.scene;
    player.scale.set(0.5, 0.5, 0.5);
    isPlayerLoaded = true;
    scene.add(player); 
    checkModelLoaded();
    player = createPlayerOnBuilding(); 
    endPoint = createEndPointOnBuilding(); 
}, undefined, function (error) {
    console.error('An error happened while loading the model:', error);
});
  
}

function addRoads() {
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const mazeSize = city.size * roadWidth;

    const roadGeometry = new THREE.BoxGeometry(roadWidth, 0.1, roadWidth);

   
    for (let x = 0; x < city.size; x++) {
        for (let y = 0; y < city.size; y++) {
           
            const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
            roadMesh.position.set(x * roadWidth - mazeSize / 2 + roadWidth / 2, 0, y * roadWidth - mazeSize / 2 + roadWidth / 2);
            scene.add(roadMesh);
        }
    }

   
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lineWidth = 0.1; 
    const lineHeight = 0.01; 

    for (let x = 0; x < city.size; x++) {
        for (let y = 0; y < city.size; y++) {
            const lineGeometry = new THREE.BoxGeometry(lineWidth, lineHeight, roadWidth);
            const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
            lineMesh.position.set(x * roadWidth - mazeSize / 2 + roadWidth / 2, 0.05, y * roadWidth - mazeSize / 2 + roadWidth / 2);
            scene.add(lineMesh);
        }
    }
    const wallHeight = 1; 
    const wallThickness = 0.5;

    // Top Wall
    const topWallGeometry = new THREE.BoxGeometry(mazeSize + wallThickness, wallHeight, wallThickness);
    const topWallMesh = new THREE.Mesh(topWallGeometry, roadMaterial);
    topWallMesh.position.set(0, wallHeight / 2, -mazeSize / 2 - wallThickness / 2);
    scene.add(topWallMesh);

    // Bottom Wall
    const bottomWallGeometry = new THREE.BoxGeometry(mazeSize + wallThickness, wallHeight, wallThickness);
    const bottomWallMesh = new THREE.Mesh(bottomWallGeometry, roadMaterial);
    bottomWallMesh.position.set(0, wallHeight / 2, mazeSize / 2 + wallThickness / 2);
    scene.add(bottomWallMesh);

    // Left Wall
    const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, mazeSize + wallThickness);
    const leftWallMesh = new THREE.Mesh(leftWallGeometry, roadMaterial);
    leftWallMesh.position.set(-mazeSize / 2 - wallThickness / 2, wallHeight / 2, 0);
    scene.add(leftWallMesh);

    // Right Wall
    const rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, mazeSize + wallThickness);
    const rightWallMesh = new THREE.Mesh(rightWallGeometry, roadMaterial);
    rightWallMesh.position.set(mazeSize / 2 + wallThickness / 2, wallHeight / 2, 0);
    scene.add(rightWallMesh);
}


function checkModelLoaded() {
    if (!isPlayerLoaded) {
        console.error('Player model is not loaded yet.');
        return;
    }
    const boundingBox = new THREE.Box3().setFromObject(player);
    if (boundingBox.isEmpty()) { 
        requestAnimationFrame(checkModelLoaded);
        return;
    }

    createPlayerOnBuilding();
}

function createPlayerOnBuilding() {
  
    for (let x = 0; x < city.size; x++) {
        for (let y = 0; y < city.size; y++) {
            const tile = city.data[x][y];
            if (tile.building) {
                const height = Number(tile.building.slice(-1));
                player.position.set(
                    x * roadWidth - (city.size * roadWidth) / 2 + roadWidth / 2,
                    height + 0.5,
                    y * roadWidth - (city.size * roadWidth) / 2 + roadWidth / 2
                );
                scene.add(player);
                return player;
            }
        }
    }
  
    player.position.set(-4, 0.25, -4); 
    scene.add(player);
    return player;
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
              endPointMesh.position.set(
                  x * roadWidth - (city.size * roadWidth) / 2 + roadWidth / 2,
                  height + 0.25,
                  y * roadWidth - (city.size * roadWidth) / 2 + roadWidth / 2
              );
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

       
        if (isGrounded || moveDirection.z !== -1) {
            player.position.x += Math.sin(player.rotation.y) * moveDirection.z * moveSpeed;
            player.position.z += Math.cos(player.rotation.y) * moveDirection.z * moveSpeed;
        }

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
                const offset = playerBoundingBox.max.y - playerBoundingBox.min.y;
                player.position.y += (buildingHeight + 0.25) - playerBoundingBox.max.y + offset;

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
let hasFallen = false; 

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

            if (player.position.y < 0.25 && !hasFallen ){
                hasFallen = true; 
                alert("You fell off the building! Game Over.");
                stop();
            
                
                setTimeout(() => {
                    //window.location.href = 'http://127.0.0.1:5501/homepage/index.html';
                }, 100); 
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
            //window.location.href = 'http://127.0.0.1:5501/homepage/index.html';
        }
    }
}

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            moveDirection.z = 1;
            break;
        case 'ArrowDown':
            if (isGrounded) {
                moveDirection.z = -1;
            }
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