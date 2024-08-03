import * as THREE from "three";

//player creation

class Player{
    constructor(scene){
        this.geometry = new THREE.SphereGeometry(0.3, 32, 32);
        this.material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        // position, initial
        this.mesh.position.set(0, 0.5, 0);
        
        scene.add(this.mesh);
    }
}

class BasicCharacterController{
    constructor() {

    }
}

class BasicCharacterControllerInput{
    constructor(){
        
    }
}