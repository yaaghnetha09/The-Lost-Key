import * as THREE from 'three';

export class FirstPersonCamera {
    constructor(camera, player) {
        this.camera = camera;
        this.player = player;
        this.offset = new THREE.Vector3(-2, 1.5, -3.5);
    }

    update() {
      console.log('FirstPersonCamera update called'); 
        if (!this.player) return;

        const playerDirection = new THREE.Vector3();
        this.player.getWorldDirection(playerDirection);

        const cameraPosition = this.player.position.clone()
            .addScaledVector(playerDirection, this.offset.z) 
            .add(new THREE.Vector3(0, this.offset.y, 0));
        this.camera.position.copy(cameraPosition);


        this.camera.lookAt(this.player.position);
    }

}
