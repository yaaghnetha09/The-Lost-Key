import * as THREE from "three";
import { BasicCharacterController } from "./player.js";

class ThirdPersonCamera {
    constructor(params) {
        this._params = params;
        this._camera = params.camera;
    
        this._currentPosition = new THREE.Vector3();
        this._currentLookat = new THREE.Vector3();
    }

    _CalculateIdealOffset() {
        const idealOffset = new THREE.Vector3(0, 5, -5);
        idealOffset.applyQuaternion(this._params.target.Rotation);
        idealOffset.add(this._params.target.Position);
        return idealOffset;
    }


    _CalculateIdealLookat() {
        const idealLookat = new THREE.Vector3(0, 2, 0);
        idealLookat.applyQuaternion(this._params.target.Rotation);
        idealLookat.add(this._params.target.Position);
        return idealLookat;
    }


    Update() {
        const idealOffSet = this._CalculateIdealOffset();
        const idealLookat = this._CalculateIdealLookat();
        this._camera.position.copy(idealOffSet);
        this._camera.lookAt(idealLookat);
    }
}


class ThirdpersonCameraDemo {
  constructor(params) {
    this._params = params;
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });

    document.body.appendChild(this._threejs.domElement);


    this._camera = this._params.camera; 
    this._scene = this._params.scene;

    this._controls = new BasicCharacterController({
      scene: this._scene,
      walls: this._params.walls // Pass walls here
    });

    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this._camera,
      target: this._controls,
  });

    window.addEventListener('resize', () => {
    this._OnWindowResize();
    }, false);

    this._mixers = [];
    this._previousRAF = null;
    this._RAF();
  }


  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

    _RAF() {
        requestAnimationFrame((t) => {
          if (this._previousRAF === null) {
            this._previousRAF = t;
          }
    
          this._RAF();
    
          this._threejs.render(this._scene, this._camera);
          this._Step(t - this._previousRAF);
          this._previousRAF = t;
        });
      }


      _Step(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;
        if (this._mixers) {
          this._mixers.forEach(m => m.update(timeElapsedS));
        }
    
        if (this._controls) {
          this._controls.Update(timeElapsedS);
        }
    
        this._thirdPersonCamera.Update(timeElapsedS);
      }
}

export {ThirdpersonCameraDemo};