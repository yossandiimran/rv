"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "demo", "game.js"), "utf8");

const gradient = { addColorStop() {} };
const context = new Proxy(
  {},
  {
    get(_target, property) {
      if (property === "createRadialGradient") return () => gradient;
      if (property === "measureText") return (text) => ({ width: String(text).length * 6 });
      return () => {};
    },
    set() {
      return true;
    },
  },
);

function createElement() {
  return {
    classList: {
      add() {},
      remove() {},
      toggle() {},
    },
    addEventListener() {},
    focus() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 640, height: 360 };
    },
    getContext() {
      return context;
    },
    setPointerCapture() {},
    style: {},
    textContent: "",
  };
}

const elements = new Map();
global.document = {
  querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, createElement());
    return elements.get(selector);
  },
  querySelectorAll() {
    return [];
  },
};

global.window = {
  addEventListener() {},
  location: { search: "?autostart=1" },
};

global.Image = class MockImage {
  constructor() {
    this.width = 128;
    this.height = 128;
  }

  set src(value) {
    this.value = value;
    queueMicrotask(() => this.onload?.());
  }
};

let renderedFrames = 0;
global.requestAnimationFrame = (callback) => {
  if (renderedFrames >= 6) return 0;
  renderedFrames += 1;
  setTimeout(() => callback(performance.now()), 0);
  return renderedFrames;
};

vm.runInThisContext(source, { filename: "demo/game.js" });

setTimeout(() => {
  if (renderedFrames < 2) throw new Error("Game loop tidak berjalan.");
  process.stdout.write(`PASS: bootstrap dan ${renderedFrames} frame demo berjalan\n`);
}, 40);
