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
        const idealOffset = new THREE.Vector3(-15, 20, -30);
        idealOffset.applyQuaternion(this._params.target.Rotation);
        idealOffset.add(this._params.target.Position);
        return idealOffset;
    }


    _CalculateIdealLookat() {
        const idealLookat = new THREE.Vector3(0, 10, 50);
        idealLookat.applyQuaternion(this._params.target.Rotation);
        idealLookat.add(this._params.target.Position);
        return idealLookat;
    }


    Update(timeElapsed) {
        const idealOffSet = this._CalculateIdealOffset();
        const idealLookat = this._CalculateIdealLookat();

        // to get the spring effect
        // const t = 0.15;

        //here camera movement isn't frame rte dependent, it is 
        // changing by a constant factor
        // we can modify this to look good, so to make it correct we have to multiply the coefficient with frame time

        // const t = 4.0 * timeElapsed;
         // the below one is completely frame rate independent, than above one

        const t = 1.0 - Math.pow(0.001, timeElapsed);
        
        this._currentPosition.lerp(idealOffSet, t);
        this._currentPosition.lerp(idealLookat, t);

        this._camera.position.copy(this._currentPosition);
        this._camera.lookAt(this._currentLookat);
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