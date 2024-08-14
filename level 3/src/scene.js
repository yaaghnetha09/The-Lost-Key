import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/loaders/GLTFLoader.js';
import { createCamera } from './camera.js';

function createKey() {
    const keyGroup = new THREE.Group();
    const rustBrownColor = 0x8B4513;

    const shaftGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 32); 
    const shaftMaterial = new THREE.MeshStandardMaterial({ color: rustBrownColor });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    keyGroup.add(shaft);

    
    const bowGeometry = new THREE.TorusGeometry(0.1, 0.02, 16, 100); 
    const bowMaterial = new THREE.MeshStandardMaterial({ color: rustBrownColor });
    const bow = new THREE.Mesh(bowGeometry, bowMaterial);
    bow.position.set(0, 0.6, 0); 
    bow.rotation.y = Math.PI / 2;
    keyGroup.add(bow);

    // Smaller teeth
    const teethGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.1); 
    const teethMaterial = new THREE.MeshStandardMaterial({ color: rustBrownColor });

    const teeth1 = new THREE.Mesh(teethGeometry, teethMaterial);
    teeth1.position.set(0, -0.4, 0.1); 
    teeth1.rotation.z = Math.PI / 2;
    keyGroup.add(teeth1);

    const teeth2 = teeth1.clone();
    teeth2.position.y -= 0.2;
    keyGroup.add(teeth2);

    const teeth3 = teeth1.clone();
    teeth3.position.y += 0.2; 
    keyGroup.add(teeth3);

    const shadowGeometry = new THREE.PlaneGeometry(0.4, 0.1); 
    const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -0.6, 0); 
    keyGroup.add(shadow);

    return keyGroup;
}




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
  let rotationDelta = 0;
  let rotationSpeed = 0.05 ;

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
    const key = createKey(); // Create the key object as the endpoint
    

  for (let x = city.size - 1; x >= 0; x--) {
      for (let y = city.size - 1; y >= 0; y--) {
          const tile = city.data[x][y];
          if (tile.building) {
              const height = Number(tile.building.slice(-1));
              key.position.set(
                  x * roadWidth - (city.size * roadWidth) / 2 + roadWidth / 2,
                  height + 0.25,
                  y * roadWidth - (city.size * roadWidth) / 2 + roadWidth / 2
              );
              scene.add(key);
              return key;
          }
      }
  }

  key.position.set(4, 0.25, 4); 
  scene.add(key);
  return key;
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
    updateRotation(delta);
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
  let hasFallen = false; 
  

function jumpPlayer() {
    if (isGrounded) {
        isJumping = true;
        jumpVelocity = jumpSpeed;
        isGrounded = false;
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

            if (player.position.y < 0.25 && !hasFallen) {
                hasFallen = true; 
            
                const gameOverMessage = document.createElement('div');
                gameOverMessage.innerText = "You fell off the building! Game Over.";
                gameOverMessage.style.position = 'absolute';
                gameOverMessage.style.top = '50%';
                gameOverMessage.style.left = '50%';
                gameOverMessage.style.transform = 'translate(-50%, -50%)';
                gameOverMessage.style.padding = '20px';
                gameOverMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                gameOverMessage.style.color = '#fff';
                gameOverMessage.style.fontSize = '24px';
                gameOverMessage.style.borderRadius = '10px';
                document.body.appendChild(gameOverMessage);
            
                stop();
                
               
                setTimeout(() => {
                    window.location.href = 'http://127.0.0.1:5501/homepage/index.html';
                }, 2000); 
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
function updateRotation(delta) {
    if (player) {
        playerRotationY += rotationDelta;
        player.rotation.y = playerRotationY;
    }
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
                const offset = playerBoundingBox.max.y - playerBoundingBox.min.y;
                player.position.y += (buildingHeight + 0.25) - playerBoundingBox.max.y + offset;

                isGrounded = true;
                break;
            }
        }

        if (!onBuilding) {
            isGrounded = false;
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
        // Create bounding boxes for the player and the end point
        const playerBox = new THREE.Box3().setFromObject(player);
        const endPointBox = new THREE.Box3().setFromObject(endPoint);

        // Check if the bounding boxes intersect (i.e., if the player is touching the end point)
        if (playerBox.intersectsBox(endPointBox)) {
            const winMessage = document.createElement('div');
            winMessage.innerText = "You reached the end point! You win!";
            winMessage.style.position = 'absolute';
            winMessage.style.top = '50%';
            winMessage.style.left = '50%';
            winMessage.style.transform = 'translate(-50%, -50%)';
            winMessage.style.padding = '20px';
            winMessage.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';
            winMessage.style.color = '#fff';
            winMessage.style.fontSize = '24px';
            winMessage.style.borderRadius = '10px';
            document.body.appendChild(winMessage);

            stop();

            setTimeout(() => {
                window.location.href = 'http://127.0.0.1:5501/homepage/index.html';
            }, 2000); 
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
                rotationDelta = rotationSpeed;
                break;
        case 'd':
                rotationDelta = -rotationSpeed;
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
    case 'a':
    case 'd':
        rotationDelta = 0; 
        break;
    }
  });

  start();

  return { scene, stop, initialize };
}