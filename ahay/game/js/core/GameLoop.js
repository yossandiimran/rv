// Fixed-timestep loop: update() runs at 60 Hz, render() once per animation frame.
export const STEP = 1 / 60;
const MAX_FRAME = 0.25; // clamp after tab suspension

export class GameLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.acc = 0;
    this.last = 0;
    this.running = false;
    this.tick = this.tick.bind(this);
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.tick);
  }
  tick(now) {
    if (!this.running) return;
    this.acc += Math.min((now - this.last) / 1000, MAX_FRAME);
    this.last = now;
    while (this.acc >= STEP) {
      this.update();
      this.acc -= STEP;
    }
    this.render();
    requestAnimationFrame(this.tick);
  }
}
