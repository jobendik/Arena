import * as THREE from 'three';

export interface Particle {
  mesh: THREE.Mesh | THREE.Sprite;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  initialScale?: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private scene: THREE.Scene;
  private hitImpactTexture?: THREE.Texture;
  private hitSpriteLowTexture?: THREE.Texture;
  private skullTexture?: THREE.Texture;
  private fireSmokeTexture?: THREE.Texture;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
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
      const particle = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.03, 0.03),
        new THREE.MeshBasicMaterial({ color })
      );
      particle.position.copy(position);

      // Particles fly away from surface along normal with some spread
      const velocity = normal.clone().multiplyScalar(3 + Math.random() * 2);
      velocity.x += (Math.random() - 0.5) * 2;
      velocity.y += (Math.random() - 0.5) * 2;
      velocity.z += (Math.random() - 0.5) * 2;

      this.scene.add(particle);
      this.particles.push({
        mesh: particle,
        velocity,
        lifetime: 0,
        maxLifetime: 0.4 + Math.random() * 0.3,
      });
    }
  }

  public spawnExplosion(position: THREE.Vector3): void {
    if (!this.fireSmokeTexture) return;

    // Create a large explosion effect
    const spriteMaterial = new THREE.SpriteMaterial({
      map: this.fireSmokeTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 1,
      color: 0xffaa00,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(4, 4, 4);
    sprite.position.copy(position);
    sprite.position.y += 1.0;

    this.scene.add(sprite);
    this.particles.push({
      mesh: sprite,
      velocity: new THREE.Vector3(0, 1, 0),
      lifetime: 0,
      maxLifetime: 0.8,
      initialScale: 4,
    });

    // Add some debris
    this.spawn(position, 0xff4400, 20);
  }

  public update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime += delta;

      if (p.lifetime >= p.maxLifetime) {
        this.scene.remove(p.mesh);
        if (p.mesh instanceof THREE.Sprite) {
          (p.mesh.material as THREE.SpriteMaterial).dispose();
        }
        this.particles.splice(i, 1);
      } else {
        // Apply physics only to non-sprite particles
        if (!(p.mesh instanceof THREE.Sprite)) {
          p.velocity.y -= 15 * delta;
          p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
        }

        // Fade out
        const fadeProgress = p.lifetime / p.maxLifetime;
        if (p.mesh instanceof THREE.Sprite) {
          // Sprites: quick expand then fade
          const spriteMat = p.mesh.material as THREE.SpriteMaterial;
          spriteMat.opacity = 1 - fadeProgress;
          
          // Expand effect for impact
          if (p.initialScale) {
            const expandScale = p.initialScale * (1 + fadeProgress * 0.5);
            p.mesh.scale.set(expandScale, expandScale, expandScale);
          }
        } else {
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - fadeProgress;
        }
      }
    }
  }

  public clear(): void {
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.particles.length = 0;
  }
}
