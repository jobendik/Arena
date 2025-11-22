import * as THREE from 'three';

interface BulletTracer {
  mesh: THREE.Mesh;
  lifetime: number;
  maxLifetime: number;
  material: THREE.MeshBasicMaterial;
  startPoint: THREE.Vector3;
  endPoint: THREE.Vector3;
}

export class BulletTracerSystem {
  private tracers: BulletTracer[] = [];
  private scene: THREE.Scene;
  private tracerTexture?: THREE.Texture;
  private fireTracerTexture?: THREE.Texture;

  constructor(scene: THREE.Scene, _camera: THREE.Camera) {
    this.scene = scene;
    this.loadTextures();
  }

  private loadTextures(): void {
    const textureLoader = new THREE.TextureLoader();
    
    // Load tracer textures
    textureLoader.load(
      'assets/images/Bullet-Trace.png_1b6132fc.png',
      (texture) => {
        this.tracerTexture = texture;
      },
      undefined,
      (err) => console.warn('Failed to load bullet trace texture:', err)
    );

    textureLoader.load(
      'assets/images/Bullet-Fire-Trace.jpg_d795b3f8.jpg',
      (texture) => {
        this.fireTracerTexture = texture;
      },
      undefined,
      (err) => console.warn('Failed to load fire trace texture:', err)
    );
  }

  /**
   * Create visually impressive textured bullet tracer beam
   * Dopamine-inducing fast tracer with proper texture stretching
   */
  public createTracer(start: THREE.Vector3, end: THREE.Vector3, color: number = 0x00ffff, useFireTexture: boolean = false): void {
    const startPoint = start.clone();
    const endPoint = end.clone();
    
    // Calculate direction and distance
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
    const distance = direction.length();
    
    if (distance < 0.1) return;
    
    // Choose texture based on weapon
    const texture = useFireTexture && this.fireTracerTexture ? this.fireTracerTexture : this.tracerTexture;
    
    // Create a plane stretched along X axis (1x1 base)
    const geometry = new THREE.PlaneGeometry(1, 1);
    
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color: color,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      fog: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Position at midpoint between start and end
    mesh.position.copy(startPoint).addScaledVector(direction, 0.5);
    
    // Orient plane along the ray: plane's local X axis → ray direction
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(
      new THREE.Vector3(1, 0, 0), // plane's X axis
      direction.clone().normalize()
    );
    mesh.quaternion.copy(quaternion);
    
    // Scale: X = length of ray, Y = thickness (visual width)
    const thickness = 0.25; // THICK, highly visible beams
    mesh.scale.set(distance, thickness, 1);
    
    this.scene.add(mesh);

    this.tracers.push({
      mesh,
      lifetime: 0,
      maxLifetime: 0.2, // Longer lifetime for better visibility
      material,
      startPoint,
      endPoint,
    });
  }

  /**
   * Create multiple tracers for shotgun spread
   */
  public createMultipleTracers(
    start: THREE.Vector3,
    endpoints: THREE.Vector3[],
    color: number = 0x00ffff,
    useFireTexture: boolean = false
  ): void {
    endpoints.forEach((end) => {
      this.createTracer(start, end, color, useFireTexture);
    });
  }

  public update(delta: number): void {
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tracer = this.tracers[i];
      tracer.lifetime += delta;

      if (tracer.lifetime >= tracer.maxLifetime) {
        this.scene.remove(tracer.mesh);
        tracer.material.dispose();
        tracer.mesh.geometry.dispose();
        this.tracers.splice(i, 1);
      } else {
        // Fast, snappy fade: alpha = 1 - age/lifetime
        const fadeProgress = tracer.lifetime / tracer.maxLifetime;
        tracer.material.opacity = 1.0 - fadeProgress;
      }
    }
  }

  public clear(): void {
    this.tracers.forEach((tracer) => {
      this.scene.remove(tracer.mesh);
      tracer.material.dispose();
      tracer.mesh.geometry.dispose();
    });
    this.tracers.length = 0;
  }
}
