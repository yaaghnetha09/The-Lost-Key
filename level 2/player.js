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
  };
  
  