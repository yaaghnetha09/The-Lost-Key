import * as THREE from 'three';
import { GLTFLoader } from 'https://threejs.org/examples/jsm/loaders/GLTFLoader.js';

export class Player {
    constructor(scene, walls, endMarker) {
        this.scene = scene;
        this.walls = walls;
        this.endMarker = endMarker; 
        this.player = null;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 5;
        this.playerBox = new THREE.Box3(); 
        this.endMarkerBox = new THREE.Box3().setFromObject(this.endMarker);
    }

    loadModel() {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load('/character/charactermain.glb', (gltf) => {
                this.player = gltf.scene;
                this.player.scale.set(1.5, 1.5, 1.5);
                this.player.position.set(0, 2, 0);
                this.scene.add(this.player);
                resolve(this.player); 
            }, undefined, (error) => {
                reject(error); // Reject the Promise if there's an error
            });
        });
    }

    update(delta) {
        if (!this.player) return;


        const direction = new THREE.Vector3();
        this.player.getWorldDirection(direction);

        
        const moveDistance = this.speed * delta;
        const moveVector = direction.clone().multiplyScalar(this.velocity.z * moveDistance);

        
        this.player.position.add(moveVector);

        //update the player's bounding box
        this.playerBox.setFromObject(this.player);

        //check for collisions with walls
        if (this.checkCollisions()) {
            //collision detected, revert the movement
            this.player.position.sub(moveVector);
        }

        //check for collisions with the end marker
        if (this.checkEndMarkerCollision()) {
            this.onReachEndMarker();
        }
    }

    setVelocity(x, z) {
        //set the player's velocity(no need to handle x-direction in this case)
        this.velocity.set(x, 0, z);
    }

    checkCollisions() {
        for (let wall of this.walls) {
            const wallBox = new THREE.Box3().setFromObject(wall);
            if (this.playerBox.intersectsBox(wallBox)) {
                
                return true;
            }
        }
    
        return false;
    }

    checkEndMarkerCollision() {
        return this.playerBox.intersectsBox(this.endMarkerBox);
    }

    onReachEndMarker() {
        console.log('Player reached the end marker. Transitioning to the next level...');
        
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = 'flex';

        setTimeout(() => {
            window.location.href = '/level%203/index.html';
        }, 8000); // 8 second delay
    }
}
