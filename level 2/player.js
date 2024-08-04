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
        this._input = new BasicCharacterControllerInput();
        this._stateMachine = new FiniteStateMachine();

        this.Player();
    }
}

class BasicCharacterControllerInput{
    constructor(){
        this._Init();
    }

    _Init() {
        this._keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
        };
        document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
    }

    _onKeyDown(event) {
        switch (event.keyCode) {
          case 87: // w
            this._keys.forward = true;
            break;
          case 65: // a
            this._keys.left = true;
            break;
          case 83: // s
            this._keys.backward = true;
            break;
          case 68: // d
            this._keys.right = true;
            break;
        }
    }

    _onKeyUp(event) {
        switch(event.keyCode) {
          case 87: // w
            this._keys.forward = false;
            break;
          case 65: // a
            this._keys.left = false;
            break;
          case 83: // s
            this._keys.backward = false;
            break;
          case 68: // d
            this._keys.right = false;
            break;
        
        }
    }
}

class FiniteStateMachine{
    constructor() {

    }
}