import * as THREE from "three";
import { BasicCharacterController } from "./player.js";


class ThirdPersonCamera {
    constructor(params) {
        this._params = params;
        this._camera = params.camera;
    
        this._currentPosition = new THREE.Vector3();
        this._currentLookat = new THREE.Vector3();
    }
}


class ThirdpersonCameraDemo {
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
          this._mixers.map(m => m.update(timeElapsedS));
        }
    
        if (this._controls) {
          this._controls.Update(timeElapsedS);
        }
    
        this._thirdPersonCamera.Update(timeElapsedS);
      }
}