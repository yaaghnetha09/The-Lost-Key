import { createScene } from './scene.js';
import { createCity } from './future.js';

export function createGame() {
  const scene = createScene();
  const city = createCity(8);
  scene.initialize(city);

  document.addEventListener('mousedown', scene.onMouseDown, false);
  document.addEventListener('mouseup', scene.onMouseUp, false);
  document.addEventListener('mousemove', scene.onMouseMove, false);
  document.addEventListener('contextmenu', (event) => event.preventDefault(), false);

  const game = {
    update() {
      city.update();
      scene.update(city);
    }
  };

  function gameLoop() {
    game.update();
  }

  setInterval(gameLoop, 1000);
  scene.start();
  return game;
}