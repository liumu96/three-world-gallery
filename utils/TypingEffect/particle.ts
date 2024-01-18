class Particle {
  x: number;
  y: number;
  z: number;

  isGrowing: boolean;
  toDelete: boolean;

  scale: number;
  maxScale: number;
  deltaScale: number;
  age: number;
  ageDelta: number;
  rotationZ: number;
  deltaRotation: number;

  constructor([x, y]: [number, number]) {
    this.x = x + 0.15 * (Math.random() - 0.5);
    this.y = y + 0.15 * (Math.random() - 0.5);
    this.z = 0;

    this.isGrowing = true;
    this.toDelete = false;

    this.scale = 0;
    this.maxScale = 0.1 + 1.5 * Math.pow(Math.random(), 10);
    this.deltaScale = 0.03 + 0.03 * Math.random();
    this.age = Math.PI * Math.random();
    this.ageDelta = 0.01 + 0.02 * Math.random();
    this.rotationZ = 0.5 * Math.random() * Math.PI;
    this.deltaRotation = 0.01 * (Math.random() - 0.5);
  }

  grow(): void {
    this.age += this.ageDelta;
    this.rotationZ += this.deltaRotation;

    if (this.isGrowing) {
      this.scale += this.deltaScale;
      if (this.scale >= this.maxScale) {
        this.isGrowing = false;
      }
    } else if (this.toDelete) {
      this.scale -= this.deltaScale;
      if (this.scale <= 0) {
        this.scale = 0;
        this.deltaScale = 0;
      }
    } else {
      this.scale = this.maxScale + 0.2 * Math.sin(this.age);
    }
  }
}

export default Particle;
