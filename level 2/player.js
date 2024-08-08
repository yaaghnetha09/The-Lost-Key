import * as THREE from "three";
// import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

//NOTE : THIS CODE IS TAKEN AND INSPIRED FROM https://github.com/simondevyoutube/ThreeJS_Tutorial_CharacterController/blob/main/main.js
// THIS IS EDITED FOR OUR OWN USAGE


//Proxy class to manage animations
class BasicCharacterControllerProxy {
    constructor(animations) {
      this._animations = animations;
    }
  
    get animations() {
      return this._animations;
    }
};


//main character controller class, where every rendering takes place
class BasicCharacterController{
    constructor(params) {
        this._Init(params);
      }
    
      _Init(params) { //taking of parameters
        this._params = params;
        this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0); //decelaration
        this._acceleration = new THREE.Vector3(1, 0.25, 50.0); //accelaration
        this._velocity = new THREE.Vector3(0, 0, 0); //velocity
    
        this._animations = {};
        this._input = new BasicCharacterControllerInput();
        this._stateMachine = new CharacterFSM(new BasicCharacterControllerProxy(this._animations));
    
        //player creation and initialze player mesh;
        this.Player();
        this._target = this.mesh; //Initialize _target

        // Initialize player bounding box
        this.PlayerBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        this.PlayerBB.setFromObject(this.mesh);
      }
    
      //function to create player mesh
      Player(){
            this.geometry = new THREE.BoxGeometry(3, 3, 3);
            this.material = new THREE.MeshBasicMaterial({ color: 0xFFC0CB });
            this.mesh = new THREE.Mesh(this.geometry, this.material);
    
            // position, initial
            this.mesh.position.set(0, 0.5, 0);
            this._params.scene.add(this.mesh);
        }

        get Position() {
          return this.mesh.position;
        }
      
        get Rotation() {
          return this.mesh.quaternion;
        }

    // update function to handel movement and collision with walls
    Update(timeInSeconds) {
      //check if the target (player mesh) is defined
        if (!this._target) {
          return;
        }
    
        //updation of the state machine with the current time and input;
        this._stateMachine.Update(timeInSeconds, this._input);
    

        const velocity = this._velocity;

        //calculate deceleration based on the current velocity
        const frameDecceleration = new THREE.Vector3(
            velocity.x * this._decceleration.x,
            velocity.y * this._decceleration.y,
            velocity.z * this._decceleration.z
        );
        frameDecceleration.multiplyScalar(timeInSeconds);
        frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
            Math.abs(frameDecceleration.z), Math.abs(velocity.z));
    
        //apply deceleration to velocity
        velocity.add(frameDecceleration);
    

        const controlObject = this._target; //player mesh;
        const _Q = new THREE.Quaternion(); // Quaternion for rotations
        const _A = new THREE.Vector3(); //axis vector for rotations
        const _R = controlObject.quaternion.clone(); //clone current rotation;
    

        const acc = this._acceleration.clone();

        //If shift key is pressed then increase acceleration of the player
        if (this._input._keys.shift) {
          acc.multiplyScalar(2.0);
        }
  

        //key inputs from character input class, for movement 
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
    
        ////apply new rotation to the player
        controlObject.quaternion.copy(_R);
    
        //save the old position so it will be usefull to to revert when wall collision occurs;
        const oldPosition = new THREE.Vector3();
        oldPosition.copy(controlObject.position);
    
        //calculate forward and sideways movement based on the current rotation;
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(controlObject.quaternion);
        forward.normalize();
    
        const sideways = new THREE.Vector3(1, 0, 0);
        sideways.applyQuaternion(controlObject.quaternion);
        sideways.normalize();
    
        sideways.multiplyScalar(velocity.x * timeInSeconds);
        forward.multiplyScalar(velocity.z * timeInSeconds);
    
        //apply calculated movement to the player position
        controlObject.position.add(forward);
        controlObject.position.add(sideways);
    

        // oldPosition.copy(controlObject.position);

        //update player bounding box position
        this.PlayerBB.setFromObject(this.mesh);

        //check collision with each wall
        let collisionDetected = false;
        for (const wall of this._params.walls) {
            const WallBB = new THREE.Box3().setFromObject(wall);
            if (this.checkCollision(WallBB)) {
            collisionDetected = true;
            break;
          }
        }


        //If collision detected, revert to old position
        if (collisionDetected) {
          controlObject.position.copy(oldPosition);
        }

        // /update animations if any;
        if (this._mixer) {
          this._mixer.update(timeInSeconds);
        }
  }


        //function to check collision with wall
        checkCollision(WallBB) {
          // Intersection test
          return this.PlayerBB.intersectsBox(WallBB);
      
          // // Contains test
          // if (this.PlayerBB.containsBox(WallBB)) {
          //   this.mesh.scale.y = 3;
          // } else {
          //   this.mesh.scale.y = 1;
          // }
        }
};



//class to handle user inputs for character movement
class BasicCharacterControllerInput{
    constructor(){
        this._Init();//initialize key input handling;
    }

    _Init() {
      //object to keep track of which keys are pressed so as to handling them will be easier;
        this._keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
        };

        //add event listeners for handling when keydown and keyup events
        document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
    }

    //event handler for keydown events;
    _onKeyDown(event) {
        switch (event.keyCode) {
          case 87: // 'w' key for moving forward 
            this._keys.forward = true;
            break;
          case 65: // 'a' key for moving left
            this._keys.left = true;
            break;
          case 83: // 's' key for moving backward
            this._keys.backward = true;
            break;
          case 68: // 'd' key for moving right
            this._keys.right = true;
            break;
        }
    }

    //event handler for keyup events
    _onKeyUp(event) {
        switch(event.keyCode) {
          case 87: // 'w' key for moving forward
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


//usage of finite state machine class to manage different states
//the most important class;
class FiniteStateMachine{
    constructor() {
        this._states = {}; //object to store all possible states;
        this._currentState = null; // variable to keep track of the current state;
    }

    //function to add a new state to the FSM
    _AddState(name, type) {
        this._states[name] = type; // Store the state class by name
    }

    //function to change the current state
    SetState(name) {
        const prevState = this._currentState;//store the previous, state setting the current state
        
        // If there's a previous state and it's the same as the new state, do nothing;
        if (prevState) {
          if (prevState.Name == name) {
            return;
          }
          prevState.Exit();//signals the old state which is exiting i.e call the Exit function of the previous state
        }
    
        // Instantiate the new state
        const state = new this._states[name](this);
    
        this._currentState = state; //Update the current state i.e notifies the new state that is active;
        state.Enter(prevState); //call the Enter function of the new state
    }

    //function to update the current state
    Update(timeElapsed, input) { //gets called on every frame and passes the frame time and input
        //to the currently active state
        //If there's a current state, call its Update functioon
        if (this._currentState) {
          this._currentState.Update(timeElapsed, input);
        }
    }
    
};

// child of fsm, so to add a character specific states like idle, walk, run
class CharacterFSM extends FiniteStateMachine {
    constructor(proxy) {
      super(); // Call the parent constructor (FiniteStateMachine)
      this._proxy = proxy;// Store the proxy object for accessing animations
      this._Init();// Initialize character-specific states
    }
  
    //initialize function to add character-specific states
    _Init() {
      this._AddState('idle', IdleState); //add the 'idle' state
      this._AddState('walk', WalkState); //add the 'walk' state
    }
};

// Define a base `State` class for FSM
class State {
    constructor(parent) {
      this._parent = parent; // Store the parent FSM instance
    }
   
    // function called when the state is entered
    Enter() {}
    //function called when the state is exited
    Exit() {}
    //function called on every frame update
    Update() {}
}


//state class for walk state
class WalkState extends State {
    constructor(parent) {
      super(parent); // Call the parent constructor (State)
    }
  
    // Getter for the state's name
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


// state class for idle state
// comes to rest when entered
class IdleState extends State {
  constructor(parent) {
    super(parent);// Call the parent constructor (State)
  }

  // Getter for the state's name
  get Name() {
    return 'idle';
  }

  //function called when the state is entered
  Enter(prevState) {
    // Get the idle animation action from the proxy
    const idleAction = this._parent._proxy._animations['idle'].action;

    //// iff there was a previous state,  transition from its animation
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;
      idleAction.time = 0.0;
      idleAction.enabled = true;
      idleAction.setEffectiveTimeScale(1.0);
      idleAction.setEffectiveWeight(1.0);
      idleAction.crossFadeFrom(prevAction, 0.5, true);
      idleAction.play();
    } else {
       //if there was no previous state,just play the idle animation;
      idleAction.play();
    }
  }

  //function called when the state is exited
  Exit() {
    //nothing is written as there are no specific actions needed when exiting the idle state 
  }

  //function called on every frame update
  Update(_, input) {
    // If any movement key is pressed then  switch to the walk state
    if (input._keys.forward || input._keys.backward) {
      this._parent.SetState('walk');
    }
  }
};


export { BasicCharacterController };
  
  