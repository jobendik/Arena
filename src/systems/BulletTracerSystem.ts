import * as THREE from 'three';

interface BulletTracer {
  line: THREE.Line;
  lifetime: number;
  maxLifetime: number;
  material: THREE.LineBasicMaterial;
}

export class BulletTracerSystem {
  private tracers: BulletTracer[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Create neon bullet tracer line from gun to impact point
   * Bright geometric line that reinforces visual identity
   */
  public createTracer(start: THREE.Vector3, end: THREE.Vector3, color: number = 0x00ffff): void {
    const points = [start.clone(), end.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 3, // Note: linewidth > 1 only works with WebGLRenderer on some systems
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    this.tracers.push({
      line,
      lifetime: 0,
      maxLifetime: 0.08, // Very brief, 80ms flash
      material,
    });
  }

  /**
   * Create multiple tracers for shotgun spread
   */
  public createMultipleTracers(
    start: THREE.Vector3,
    endpoints: THREE.Vector3[],
    color: number = 0x00ffff
  ): void {
    endpoints.forEach((end) => {
      this.createTracer(start, end, color);
    });
  }

  public update(delta: number): void {
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tracer = this.tracers[i];
      tracer.lifetime += delta;

      if (tracer.lifetime >= tracer.maxLifetime) {
        this.scene.remove(tracer.line);
        tracer.material.dispose();
        tracer.line.geometry.dispose();
        this.tracers.splice(i, 1);
      } else {
        // Quick fade
        const fadeProgress = tracer.lifetime / tracer.maxLifetime;
        tracer.material.opacity = 0.8 * (1 - fadeProgress);
      }
    }
  }

  public clear(): void {
    this.tracers.forEach((tracer) => {
      this.scene.remove(tracer.line);
      tracer.material.dispose();
      tracer.line.geometry.dispose();
    });
    this.tracers.length = 0;
  }
}
