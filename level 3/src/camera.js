import * as THREE from 'three';

export function createCamera(gameWindow) {
    const camera = new THREE.PerspectiveCamera(75, gameWindow.offsetWidth / gameWindow.offsetHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);
    return camera;
}
