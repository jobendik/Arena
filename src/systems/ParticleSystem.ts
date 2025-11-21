import * as THREE from 'three';

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawn(position: THREE.Vector3, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 4, 4),
        new THREE.MeshBasicMaterial({ color })
      );
      particle.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5
      );

      this.scene.add(particle);
      this.particles.push({
        mesh: particle,
        velocity,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.5,
      });
    }
  }

  public update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime += delta;

      if (p.lifetime >= p.maxLifetime) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      } else {
        p.velocity.y -= 15 * delta;
        p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
        (p.mesh.material as THREE.MeshBasicMaterial).opacity =
          1 - p.lifetime / p.maxLifetime;
      }
    }
  }

  public clear(): void {
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.particles.length = 0;
  }
}
