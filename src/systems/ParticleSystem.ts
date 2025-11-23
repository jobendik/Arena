import * as THREE from 'three';

class ParticlePool {
  private pool: THREE.Object3D[] = [];
  private createFn: () => THREE.Object3D;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, createFn: () => THREE.Object3D, initialSize: number = 20) {
    this.scene = scene;
    this.createFn = createFn;
    for (let i = 0; i < initialSize; i++) {
      const obj = createFn();
      obj.visible = false;
      this.scene.add(obj);
      this.pool.push(obj);
    }
  }

  public get(): THREE.Object3D {
    let obj: THREE.Object3D;
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.createFn();
      this.scene.add(obj);
    }
    obj.visible = true;
    return obj;
  }

  public release(obj: THREE.Object3D): void {
    obj.visible = false;
    this.pool.push(obj);
  }
}

export interface Particle {
  mesh: THREE.Mesh | THREE.Sprite;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  initialScale?: number;
}

interface Shell {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationalVelocity: THREE.Vector3;
  lifetime: number;
  onHit?: (pos: THREE.Vector3) => void;
  hasHit: boolean;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private shells: Shell[] = [];
  private scene: THREE.Scene;
  
  // Pools
  private spherePool: ParticlePool;
  private cubePool: ParticlePool;
  private shellPool: ParticlePool;

  private hitImpactTexture?: THREE.Texture;
  private hitSpriteLowTexture?: THREE.Texture;
  private skullTexture?: THREE.Texture;
  private fireSmokeTexture?: THREE.Texture;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Initialize pools
    this.spherePool = new ParticlePool(scene, () => {
      return new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
    }, 100);

    this.cubePool = new ParticlePool(scene, () => {
      return new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.03, 0.03),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
    }, 50);

    this.shellPool = new ParticlePool(scene, () => {
      return new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.05, 6),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 })
      );
    }, 30);

    this.loadTextures();
  }

  private loadTextures(): void {
    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
      'assets/images/Hit-Impact.png_3363db53.png',
      (texture) => {
        this.hitImpactTexture = texture;
      },
      undefined,
      (err) => console.warn('Failed to load hit impact texture:', err)
    );

    textureLoader.load(
      'assets/images/Hit-Sprite-Low.png_bf709f5e.png',
      (texture) => {
        this.hitSpriteLowTexture = texture;
      },
      undefined,
      (err) => console.warn('Failed to load hit sprite texture:', err)
    );

    textureLoader.load(
      'assets/images/Skull-Spritesheet.png_0d1e8283.png',
      (texture) => {
        this.skullTexture = texture;
        // Assuming spritesheet, but for now we'll use it as a single sprite or handle UVs if we knew the layout.
        // Since we don't know the layout (rows/cols), we'll treat it as a single high-impact icon for now.
        // If it looks weird, we can adjust UVs later.
      },
      undefined,
      (err) => console.warn('Failed to load skull texture:', err)
    );

    textureLoader.load(
      'assets/images/Fire-Smoke-Spritesheet.png_b8350fa1.png',
      (texture) => {
        this.fireSmokeTexture = texture;
      },
      undefined,
      (err) => console.warn('Failed to load fire smoke texture:', err)
    );
  }

  /**
   * Spawn basic particle burst - simple geometric particles
   */
  public spawn(position: THREE.Vector3, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const particle = this.spherePool.get() as THREE.Mesh;
      (particle.material as THREE.MeshBasicMaterial).color.setHex(color);
      (particle.material as THREE.MeshBasicMaterial).opacity = 1;
      (particle.material as THREE.MeshBasicMaterial).transparent = false;
      
      particle.position.copy(position);
      particle.scale.set(1, 1, 1);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5
      );

      this.particles.push({
        mesh: particle,
        velocity,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.5,
      });
    }
  }

  /**
   * Spawn explosive sprite-based impact effect
   * Bright, satisfying bloom that makes every shot feel significant
   */
  public spawnImpactEffect(position: THREE.Vector3, isKill: boolean = false): void {
    if (isKill && this.skullTexture) {
      this.spawnKillEffect(position);
    }

    const texture = isKill ? this.hitImpactTexture : this.hitSpriteLowTexture;
    if (!texture) {
      // Fallback to basic particles
      this.spawn(position, isKill ? 0xffff00 : 0xff8800, isKill ? 15 : 8);
      return;
    }

    // Create multiple overlapping sprites for intense bloom effect
    const spriteCount = isKill ? 3 : 2;
    for (let i = 0; i < spriteCount; i++) {
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 1,
        color: isKill ? 0xffff00 : 0xff4400, // Yellow for kills, orange for hits
      });

      const sprite = new THREE.Sprite(spriteMaterial);
      const baseScale = isKill ? 0.8 : 0.5;
      const scale = baseScale + i * 0.2; // Layered effect
      sprite.scale.set(scale, scale, scale);
      sprite.position.copy(position);

      this.scene.add(sprite);
      this.particles.push({
        mesh: sprite,
        velocity: new THREE.Vector3(0, 0, 0),
        lifetime: 0,
        maxLifetime: isKill ? 0.3 : 0.2, // Brief but intense
        initialScale: scale,
      });
    }
  }

  public spawnKillEffect(position: THREE.Vector3): void {
    if (!this.skullTexture) return;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: this.skullTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 1,
      color: 0xffffff,
      depthTest: false // Always visible on top
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1.5, 1.5, 1.5);
    sprite.position.copy(position);
    sprite.position.y += 1.0; // Float above enemy

    this.scene.add(sprite);
    this.particles.push({
      mesh: sprite,
      velocity: new THREE.Vector3(0, 2, 0), // Float up
      lifetime: 0,
      maxLifetime: 1.0,
      initialScale: 1.5,
    });
  }

  /**
   * Spawn surface impact particles - debris flying from surface
   */
  public spawnSurfaceImpact(position: THREE.Vector3, normal: THREE.Vector3, color: number): void {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const particle = this.cubePool.get() as THREE.Mesh;
      (particle.material as THREE.MeshBasicMaterial).color.setHex(color);
      (particle.material as THREE.MeshBasicMaterial).opacity = 1;
      
      particle.position.copy(position);
      particle.scale.set(1, 1, 1);

      // Particles fly away from surface along normal with some spread
      const velocity = normal.clone().multiplyScalar(3 + Math.random() * 2);
      velocity.x += (Math.random() - 0.5) * 2;
      velocity.y += (Math.random() - 0.5) * 2;
      velocity.z += (Math.random() - 0.5) * 2;

      this.particles.push({
        mesh: particle,
        velocity,
        lifetime: 0,
        maxLifetime: 0.4 + Math.random() * 0.3,
      });
    }
  }

  public spawnExplosion(position: THREE.Vector3): void {
    // Core flash
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 1 })
    );
    flash.position.copy(position);
    this.scene.add(flash);
    this.particles.push({
      mesh: flash,
      velocity: new THREE.Vector3(0, 0, 0),
      lifetime: 0,
      maxLifetime: 0.2,
      initialScale: 1
    });

    // Smoke cloud
    if (this.fireSmokeTexture) {
      for (let i = 0; i < 5; i++) {
        const smoke = new THREE.Sprite(new THREE.SpriteMaterial({
          map: this.fireSmokeTexture,
          color: 0x444444,
          transparent: true,
          opacity: 0.8
        }));
        smoke.position.copy(position);
        smoke.position.add(new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ));
        smoke.scale.set(3, 3, 3);
        this.scene.add(smoke);
        this.particles.push({
          mesh: smoke,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 3,
            (Math.random() - 0.5) * 2
          ),
          lifetime: 0,
          maxLifetime: 1.5,
          initialScale: 3
        });
      }
    }

    // Debris
    this.spawn(position, 0xff4400, 30);
    this.spawn(position, 0x222222, 20);
  }

  /**
   * Spawn a shell casing that ejects from the weapon
   */
  public spawnShellCasing(position: THREE.Vector3, direction: THREE.Vector3, onHit?: (pos: THREE.Vector3) => void): void {
    const mesh = this.shellPool.get() as THREE.Mesh;
    
    mesh.position.copy(position);
    // Random initial rotation
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    
    const speed = 2 + Math.random() * 2;
    const velocity = direction.clone().multiplyScalar(speed);
    
    this.shells.push({
      mesh,
      velocity,
      rotationalVelocity: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      ),
      lifetime: 3.0,
      onHit,
      hasHit: false
    });
  }

  public update(delta: number): void {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.lifetime += delta;

      if (particle.lifetime >= particle.maxLifetime) {
        if (particle.mesh instanceof THREE.Mesh) {
          if (particle.mesh.geometry.type === 'SphereGeometry') {
            this.spherePool.release(particle.mesh);
          } else if (particle.mesh.geometry.type === 'BoxGeometry') {
            this.cubePool.release(particle.mesh);
          } else {
            this.scene.remove(particle.mesh);
          }
        } else {
          this.scene.remove(particle.mesh);
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Move particle
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(delta));
      
      // Apply gravity
      particle.velocity.y -= 5 * delta;

      // Fade out
      const lifeRatio = particle.lifetime / particle.maxLifetime;
      if (particle.mesh instanceof THREE.Sprite) {
        particle.mesh.material.opacity = 1 - lifeRatio;
        // Scale up slightly
        if (particle.initialScale) {
          const scale = particle.initialScale * (1 + lifeRatio * 0.5);
          particle.mesh.scale.set(scale, scale, 1);
        }
      } else {
        (particle.mesh.material as THREE.Material).opacity = 1 - lifeRatio;
        (particle.mesh.material as THREE.Material).transparent = true;
      }
    }

    // Update shells
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const shell = this.shells[i];
      shell.lifetime -= delta;
      
      if (shell.lifetime <= 0) {
        this.shellPool.release(shell.mesh);
        this.shells.splice(i, 1);
        continue;
      }
      
      // Gravity
      shell.velocity.y -= 9.8 * delta;
      
      // Move
      shell.mesh.position.add(shell.velocity.clone().multiplyScalar(delta));
      
      // Rotate
      shell.mesh.rotation.x += shell.rotationalVelocity.x * delta;
      shell.mesh.rotation.y += shell.rotationalVelocity.y * delta;
      shell.mesh.rotation.z += shell.rotationalVelocity.z * delta;
      
      // Floor collision
      if (shell.mesh.position.y <= 0.025) { // Half height
        if (!shell.hasHit) {
          shell.hasHit = true;
          if (shell.onHit) {
            shell.onHit(shell.mesh.position);
          }
          // Bounce
          shell.velocity.y = Math.abs(shell.velocity.y) * 0.5;
          shell.velocity.x *= 0.7;
          shell.velocity.z *= 0.7;
          shell.rotationalVelocity.multiplyScalar(0.5);
        } else {
          // Already hit, just slide/roll
          if (shell.mesh.position.y < 0.025) shell.mesh.position.y = 0.025;
          shell.velocity.y = 0;
          shell.velocity.x *= 0.9;
          shell.velocity.z *= 0.9;
          shell.rotationalVelocity.multiplyScalar(0.9);
        }
      }
    }
  }

  public clear(): void {
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.particles.length = 0;
  }
}
