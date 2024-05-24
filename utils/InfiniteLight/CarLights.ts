import * as THREE from "three";
import { InfiniteLight } from ".";

export class CarLights {
  webgl: InfiniteLight;
  options: any;
  color: number;
  mesh!: THREE.Mesh<
    THREE.InstancedBufferGeometry,
    THREE.ShaderMaterial,
    THREE.Object3DEventMap
  >;
  speed: any;
  constructor(
    webgl: InfiniteLight,
    options: any,
    color: number,
    speed: number
  ) {
    this.webgl = webgl;
    this.options = options;
    this.color = color;
    this.speed = speed;
  }

  init() {
    const options = this.options;
    let curve = new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1)
    );
    let baseGeometry = new THREE.TubeGeometry(curve, 25, 1, 8, false);
    const instancedGeometry = new THREE.InstancedBufferGeometry();
    instancedGeometry.attributes = baseGeometry.attributes;
    instancedGeometry.index = baseGeometry.index;

    if (baseGeometry.boundingBox)
      instancedGeometry.boundingBox = baseGeometry.boundingBox.clone();
    if (baseGeometry.boundingSphere)
      instancedGeometry.boundingSphere = baseGeometry.boundingSphere.clone();

    instancedGeometry.instanceCount = options.nPairs * 2;
    // let material = new THREE.MeshBasicMaterial({ color: 0x545454 });
    // let mesh = new THREE.Mesh(baseGeometry, material);

    // this.mesh = mesh;
    // this.webgl.scene.add(mesh);

    let aOffset = [];
    let aMetrics = [];

    let sectionWidth = options.roadWidth / options.roadSections;

    for (let i = 0; i < options.nPairs; i++) {
      // We give it a minimum value to make sure the lights aren't too thin or short.
      // Give it some randomness but keep it over 0.1
      let radius = Math.random() * 0.1 + 0.1;

      // Give it some randomness but keep it over length *0.02
      let length =
        Math.random() * options.length * 0.08 + options.length * 0.02;

      // 1a. Get it's lane index
      // Instead of random, keep lights per lane consistent
      let section = i % 3;

      // 1b. Get its lane's centered position
      let sectionX =
        section * sectionWidth - options.roadWidth / 2 + sectionWidth / 2;
      let carWidth = 0.5 * sectionWidth;
      let offsetX = 0.5 * Math.random();
      let offsetY = radius * 1.3;
      let offsetZ = Math.random() * options.length;

      aOffset.push(sectionX - carWidth / 2 + offsetX);
      aOffset.push(offsetY);
      aOffset.push(-offsetZ);

      aOffset.push(sectionX + carWidth / 2 + offsetX);
      aOffset.push(offsetY);
      aOffset.push(-offsetZ);

      aMetrics.push(radius);
      aMetrics.push(length);

      aMetrics.push(radius);
      aMetrics.push(length);
    }

    // Add the offset to the instanced geometry.
    instancedGeometry.attributes.aOffset = new THREE.InstancedBufferAttribute(
      new Float32Array(aOffset),
      3,
      false
    );

    instancedGeometry.attributes.aMetrics = new THREE.InstancedBufferAttribute(
      new Float32Array(aMetrics),
      2,
      false
    );

    const material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: Object.assign(
        {
          uColor: new THREE.Uniform(new THREE.Color(this.color)),
          uTravelLength: new THREE.Uniform(options.length),
          uTime: new THREE.Uniform(0),
          uSpeed: new THREE.Uniform(this.speed),
        },
        options.distortion.uniforms
      ),
    });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <getDistortion_vertex>",
        options.distortion.getDistortion
      );
    };

    let mesh = new THREE.Mesh(instancedGeometry, material);
    mesh.frustumCulled = false;

    this.mesh = mesh;

    this.webgl.scene.add(mesh);
  }

  update(t: number) {
    this.mesh.material.uniforms.uTime.value = t;
  }
}

const fragmentShader = `
uniform vec3 uColor;
void main() {
  vec3 color = vec3(uColor);
  gl_FragColor = vec4(color,1.);
}
`;

const vertexShader = `
attribute vec3 aOffset;
attribute vec2 aMetrics;
uniform float uTime;
uniform float uSpeed;
uniform float uTravelLength;
#include <getDistortion_vertex>
void main() {
  vec3 transformed = position.xyz;

  // 1. Set the radius and length
  float radius = aMetrics.r;
  float len = aMetrics.g;
  transformed.xy *= radius; 
  transformed.z *= len;

  // 2. Add time, and it's position to make it move
  float zOffset = uTime * uSpeed + aOffset.z;
  // 2.1. Mod by uTravelLength to make it loop whenever it goes over
  // 2.2. Add len to make it loop a little bit later
  zOffset = len - mod(zOffset , uTravelLength);

  // 3. Then place them in the correct position
  transformed.z += zOffset;
  transformed.xy += aOffset.xy;

  float progress = abs(transformed.z / uTravelLength);
  transformed.xyz += getDistortion(progress);
  
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
  gl_Position = projectionMatrix * mvPosition;
}`;
