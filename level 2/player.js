import * as THREE from "three";
//NOTE : THIS CODE IS TAKEN AND INSPIRED FROM https://github.com/simondevyoutube/ThreeJS_Tutorial_CharacterController/blob/main/main.js
// THIS IS IMPROVISED FOR OUR OWN USAGE


class BasicCharacterControllerProxy {
    constructor(animations) {
      this._animations = animations;
    }
  
    get animations() {
      return this._animations;
    }
};


class BasicCharacterController{
    constructor(params) {
        this._Init(params);
      }
    
      _Init(params) {
        this._params = params;
        this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
        this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
        this._velocity = new THREE.Vector3(0, 0, 0);
    
        this._animations = {};
        this._input = new BasicCharacterControllerInput();
        this._stateMachine = new CharacterFSM(
            new BasicCharacterControllerProxy(this._animations));
    
        this.Player();
        this._target = this.mesh; //Initialize _target
      }
    
      //player creation
      Player(){
            this.geometry = new THREE.SphereGeometry(2.3, 32, 32);
            this.material = new THREE.MeshBasicMaterial({ color: 0xFFC0CB });
            this.mesh = new THREE.Mesh(this.geometry, this.material);
    
            // position, initial
            this.mesh.position.set(0, 0.5, 0);
            this._params.scene.add(this.mesh);
        }


    Update(timeInSeconds) {
        if (!this._target) {
          return;
        }
    
        this._stateMachine.Update(timeInSeconds, this._input);
    
        const velocity = this._velocity;
        const frameDecceleration = new THREE.Vector3(
            velocity.x * this._decceleration.x,
            velocity.y * this._decceleration.y,
            velocity.z * this._decceleration.z
        );
        frameDecceleration.multiplyScalar(timeInSeconds);
        frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
            Math.abs(frameDecceleration.z), Math.abs(velocity.z));
    
        velocity.add(frameDecceleration);
    
        const controlObject = this._target;
        const _Q = new THREE.Quaternion();
        const _A = new THREE.Vector3();
        const _R = controlObject.quaternion.clone();
    
        const acc = this._acceleration.clone();
        if (this._input._keys.shift) {
          acc.multiplyScalar(2.0);
        }
  
    
        if (this._input._keys.forward) {
          velocity.z += acc.z * timeInSeconds;
        }
        if (this._input._keys.backward) {
          velocity.z -= acc.z * timeInSeconds;
        }
        if (this._input._keys.left) {
          _A.set(0, 1, 0);
          _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
          _R.multiply(_Q);
        }
        if (this._input._keys.right) {
          _A.set(0, 1, 0);
          _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
          _R.multiply(_Q);
        }
    
        controlObject.quaternion.copy(_R);
    
        const oldPosition = new THREE.Vector3();
        oldPosition.copy(controlObject.position);
    
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(controlObject.quaternion);
        forward.normalize();
    
        const sideways = new THREE.Vector3(1, 0, 0);
        sideways.applyQuaternion(controlObject.quaternion);
        sideways.normalize();
    
        sideways.multiplyScalar(velocity.x * timeInSeconds);
        forward.multiplyScalar(velocity.z * timeInSeconds);
    
        controlObject.position.add(forward);
        controlObject.position.add(sideways);
    
        oldPosition.copy(controlObject.position);
    
        if (this._mixer) {
          this._mixer.update(timeInSeconds);
        }
    }
};



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
};

class FiniteStateMachine{
    constructor() {
        this._states = {};
        this._currentState = null;
    }

    _AddState(name, type) {
        this._states[name] = type;
    }

    SetState(name) {
        const prevState = this._currentState;//setting the current state
        
        if (prevState) {
          if (prevState.Name == name) {
            return;
          }
          prevState.Exit();//signals the old state which is exiting
        }
    
        const state = new this._states[name](this);
    
        this._currentState = state; // notifies the new state that is active;
        state.Enter(prevState);
    }

    Update(timeElapsed, input) { //gets called on every frame and passes the frame time and input
        //to the currently active state
        if (this._currentState) {
          this._currentState.Update(timeElapsed, input);
        }
    }
    
};

// child of fsm, so to add a character specific states like idle, walk, run
class CharacterFSM extends FiniteStateMachine {
    constructor(proxy) {
      super();
      this._proxy = proxy;
      this._Init();
    }
  
    _Init() {
      this._AddState('idle', IdleState);
      this._AddState('walk', WalkState);
    }
};

// Define a base `State` class for your FSM
class State {
    constructor(parent) {
      this._parent = parent;
    }
  
    Enter() {}
    Exit() {}
    Update() {}
}


// comes to rest when entered
class IdleState extends State {
    constructor(parent) {
      super(parent);
    }
  
    get Name() {
      return 'idle';
    }
  
    Enter(prevState) {
      const idleAction = this._parent._proxy._animations['idle'].action;
      if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
        idleAction.time = 0.0;
        idleAction.enabled = true;
        idleAction.setEffectiveTimeScale(1.0);
        idleAction.setEffectiveWeight(1.0);
        idleAction.crossFadeFrom(prevAction, 0.5, true);
        idleAction.play();
      } else {
        idleAction.play();
      }
    }
  
    Exit() {
    }
  
    Update(_, input) {
      if (input._keys.forward || input._keys.backward) {
        this._parent.SetState('walk');
      }
    }
};


//walk state
class WalkState extends State {
    constructor(parent) {
      super(parent);
    }
  
    get Name() {
      return 'walk';
    }
  
    Enter(prevState) {
      const curAction = this._parent._proxy._animations['walk'].action;
      if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
  
        curAction.enabled = true;
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
  
        curAction.crossFadeFrom(prevAction, 0.5, true);
        curAction.play();
      } else {
        curAction.play();
      }
    }

    Exit() {
    }
  
    Update(timeElapsed, input) {
        if (input._keys.forward || input._keys.backward) {
            //if the player is previously in walk state then return
            return;
        }
      
        this._parent.SetState('idle');
    }
}


function checkCollision() {
  // Intersection test or touching test
  if(PlayerBB.intersectsBox(wallBB)) { // bounding box vs bounding box
    animation1();
  } else {
    Player.material.opacity = 1.0;
  }

  //contains test
  if(PlayerBB.containsBox(wallBB)) { // bounding box contains bounding box
    Player.scale.y = 3;
  } else {
    Player.scale.y = 1;
  }
}

function animation1() {
  Player.material.transparent = true;
  Player.material.opacity = 0.5;
}

export { BasicCharacterController };
  
  