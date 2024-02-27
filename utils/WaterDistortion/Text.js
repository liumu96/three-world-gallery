import * as THREE from "three";

const font = require("/public/fonts/SourceSansPro-Black.json");
const GlyphURL = require("/public/fonts/SourceSansPro-Black.png");
const MSDFShader = require("three-bmfont-text/shaders/msdf");

const createGeometry = require("three-bmfont-text");

const createTextMaterial = (glyphs, options = {}) => {
  const mdsf = MSDFShader({
    transparent: true,
    side: THREE.DoubleSide,
    map: glyphs,
    color: "rgb(248, 225, 225)",
    negate: false,
    ...options,
  });

  const material = new THREE.RawShaderMaterial({
    ...mdsf,
  });
  material.extensions.derivatives = true;
  return material;
};

export class Text {
  constructor(sceneManager, text) {
    this.sceneManager = sceneManager;
    this.glyphs = null;
    this.font = font;
    this.text = text;

    this.baseScale = 1;
    this.scaleY = 1;
    this.scaleX = 1;

    this.scaleMultX = 1;
    this.scaleMultY = 1;

    this.mesh = null;
  }

  load(loader) {
    loader.begin("glyphs");
    const glyphsLoader = new THREE.TextureLoader();
    glyphsLoader.crossOrigin = "";

    glyphsLoader.load("/fonts/SourceSansPro-Black.png", (glyphs) => {
      this.glyphs = glyphs;
      loader.end("glyphs");
    });
  }

  init() {
    const geometry = createGeometry({
      font: this.font,
      align: "center",
      text: this.text,
    });
    const material = createTextMaterial(this.glyphs);
    const mesh = new THREE.Mesh(geometry, material);
    this.mesh = mesh;
    this.resizeText(true);
    this.sceneManager.scene.add(mesh);
  }

  updateText() {}

  update() {
    const scaleXChange = lerp(this.scaleX, this.baseScale, 0.1, 0.00001);
    const scaleYChange = lerp(this.scaleY, this.baseScale, 0.1, 0.00001);
    if (scaleXChange !== 0 || scaleYChange !== 0) {
      this.setScale(this.scaleX + scaleXChange, this.scaleY + scaleYChange);
    }
  }

  resizeText(force = false) {
    let scale = 0.1;
    let scaleMultX = 1.3;
    let scaleMultY = 1.05;
    if (window.innerWidth >= 800) {
      scaleMultX = 1.3;
      scaleMultY = 1.05;
      scale = 0.15;
    }
    if (window.innerWidth >= 1200) {
      scaleMultX = 1.3;
      scaleMultY = 1.05;
      scale = 0.2;
    }
    this.scaleMultX = scaleMultX;
    this.scaleMultY = scaleMultY;
    this.baseScale = scale;
    if (force) {
      this.setScale(scale, scale);
    }
  }

  setScale(scaleX, scaleY) {
    const mesh = this.mesh;
    const layout = mesh.geometry.layout;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    mesh.scale.x = scaleX;
    mesh.scale.y = -scaleY;
    mesh.position.x = (-layout.width / 2) * scaleX;
    mesh.position.y = (-layout.height / 2) * scaleY;
  }

  onResize() {
    this.resizeText(true);
  }
}

const lerp = (current, target, speed = 0.1, limit = 0.001) => {
  let change = (target - current) * speed;
  if (Math.abs(change) < limit) {
    change = target - current;
  }
  return change;
};
