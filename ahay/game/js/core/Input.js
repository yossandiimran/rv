// Unifies keyboard + touch into named actions.
// held: currently down. pressed: went down since last tick (edge), cleared by endTick().
const KEYS = {
  KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right",
  KeyW: "up", ArrowUp: "up", KeyS: "down", ArrowDown: "down",
  KeyJ: "punch", KeyK: "kick", KeyL: "special",
  ShiftLeft: "block", ShiftRight: "block", Space: "dodge", Escape: "pause",
};

export class Input {
  constructor() {
    this.held = new Set();
    this.pressed = new Set();
    this.stick = { x: 0, y: 0 };
    addEventListener("keydown", (e) => {
      const a = KEYS[e.code];
      if (!a) return;
      e.preventDefault();
      if (!e.repeat) this.press(a);
    });
    addEventListener("keyup", (e) => {
      const a = KEYS[e.code];
      if (a) this.release(a);
    });
    addEventListener("blur", () => this.clear());
    document.addEventListener("visibilitychange", () => { if (document.hidden) this.clear(); });
  }
  press(a) { if (!this.held.has(a)) this.pressed.add(a); this.held.add(a); }
  release(a) { this.held.delete(a); }
  clear() { this.held.clear(); this.pressed.clear(); this.stick.x = this.stick.y = 0; }
  endTick() { this.pressed.clear(); }
  // Movement vector, normalized so diagonals are not faster.
  move() {
    let x = this.stick.x + (this.held.has("right") ? 1 : 0) - (this.held.has("left") ? 1 : 0);
    let y = this.stick.y + (this.held.has("down") ? 1 : 0) - (this.held.has("up") ? 1 : 0);
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }
  intent() {
    const m = this.move();
    const p = this.pressed, h = this.held;
    return {
      mx: m.x, my: m.y,
      punch: p.has("punch"), kick: p.has("kick"), special: p.has("special"),
      dodge: p.has("dodge"), block: h.has("block"),
    };
  }
  // Wires the on-screen joystick and buttons (pointer events, multi-touch safe).
  bindTouch(root) {
    const joy = root.querySelector("#joystick");
    const knob = root.querySelector("#joystick-knob");
    let joyId = null;
    const setStick = (e) => {
      const r = joy.getBoundingClientRect();
      const max = r.width / 2;
      let dx = e.clientX - (r.left + max), dy = e.clientY - (r.top + max);
      const len = Math.hypot(dx, dy);
      if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
      this.stick.x = Math.abs(dx / max) < 0.18 ? 0 : dx / max;
      this.stick.y = Math.abs(dy / max) < 0.18 ? 0 : dy / max;
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const resetStick = (e) => {
      if (e && joyId !== null && e.pointerId !== joyId) return;
      joyId = null;
      this.stick.x = this.stick.y = 0;
      knob.style.transform = "";
    };
    joy.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      joyId = e.pointerId;
      joy.setPointerCapture?.(e.pointerId);
      setStick(e);
    });
    joy.addEventListener("pointermove", (e) => { if (e.pointerId === joyId) setStick(e); });
    for (const t of ["pointerup", "pointercancel", "lostpointercapture"]) joy.addEventListener(t, resetStick);

    root.querySelectorAll("[data-action]").forEach((btn) => {
      const a = btn.dataset.action;
      const up = () => { this.release(a); btn.classList.remove("down"); };
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        btn.setPointerCapture?.(e.pointerId);
        this.press(a);
        btn.classList.add("down");
        navigator.vibrate?.(8);
      });
      for (const t of ["pointerup", "pointercancel", "lostpointercapture"]) btn.addEventListener(t, up);
    });
  }
}
