import * as THREE from 'three';
import { ENEMY_TYPES } from '../config/gameConfig';

export interface Enemy {
  mesh: THREE.Group;
  type: string;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  fireRate: number;
  accuracy: number;
  score: number;
  lastShotTime: number;
  body: THREE.Mesh;
  head: THREE.Mesh;
  ring: THREE.Mesh;
  muzzleFlash: THREE.Mesh | null;
  strafeDir: number;
  strafeTime: number;
  weaponType: string;
  shootSound: THREE.Audio;
  hurtSounds: THREE.Audio[];
  deathSound: THREE.Audio;
  jumpSound: THREE.Audio;
}

export class EnemyManager {
  private enemies: Enemy[] = [];
  private scene: THREE.Scene;
  private spawnPoints: THREE.Vector3[];
  private listener: THREE.AudioListener;
  private audioLoader: THREE.AudioLoader;
  private audioBuffers: Record<string, AudioBuffer> = {};

  constructor(scene: THREE.Scene, listener: THREE.AudioListener) {
    this.scene = scene;
    this.listener = listener;
    this.audioLoader = new THREE.AudioLoader();
    this.spawnPoints = [
      new THREE.Vector3(25, 0, 25),
      new THREE.Vector3(-25, 0, 25),
      new THREE.Vector3(25, 0, -25),
      new THREE.Vector3(-25, 0, -25),
      new THREE.Vector3(25, 0, 0),
      new THREE.Vector3(-25, 0, 0),
      new THREE.Vector3(0, 0, 25),
      new THREE.Vector3(0, 0, -25),
    ];
    this.loadAudio();
  }

  private loadAudio(): void {
    const audioFiles = {
      pistolShoot: 'assets/audio/weapons/Pistol-Fire.mp3_b6b25ed9.mp3',
      akShoot: 'assets/audio/weapons/AK47-Fire.mp3_aad0f6c9.mp3',
      awpShoot: 'assets/audio/weapons/AWP-Fire.mp3_1b838826.mp3',
      hurtFemale1: 'assets/audio/enemy/Female-Grunt-1.mp3_5f82c672.mp3',
      hurtFemale2: 'assets/audio/enemy/Female-Grunt-2.mp3_b787f958.mp3',
      hurtFemale3: 'assets/audio/enemy/Female-Grunt-3.mp3_4d6460fd.mp3',
      deathFemale: 'assets/audio/enemy/Female-Death-1.mp3_37cc105e.mp3',
      jumpFemale: 'assets/audio/enemy/Female-Jump-2.mp3_3f5bd70e.mp3',
      // Kulu (Heavy) Sounds
      hurtKulu1: 'assets/audio/enemy/Kulu-Grunt-1.mp3_ea942b67.mp3',
      hurtKulu2: 'assets/audio/enemy/Kulu-Grunt-2.mp3_8e323b62.mp3',
      hurtKulu3: 'assets/audio/enemy/Kulu-Grunt-3.mp3_5bae51a4.mp3',
      deathKulu: 'assets/audio/enemy/Kulu-Death-1.mp3_d65e968a.mp3',
      jumpKulu1: 'assets/audio/enemy/Kulu-Jump-1.mp3_3aef7e5f.mp3',
      jumpKulu2: 'assets/audio/enemy/Kulu-Jump-2.mp3_8cba70b6.mp3',
    };

    Object.entries(audioFiles).forEach(([key, path]) => {
      this.audioLoader.load(
        path,
        (buffer) => {
          this.audioBuffers[key] = buffer;
        },
        undefined,
        (error) => {
          console.error(`Failed to load ${key}:`, error);
        }
      );
    });
  }

  public createEnemy(type: string, position: THREE.Vector3): void {
    const typeData = ENEMY_TYPES[type];
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: typeData.color,
      emissive: typeData.color,
      emissiveIntensity: 0.2,
      metalness: 0.3,
      roughness: 0.7,
    });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.4, 8), bodyMat);
    body.position.y = 0.7;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), bodyMat.clone());
    head.position.y = 1.65;
    head.castShadow = true;
    group.add(head);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.1), eyeMat);
    leftEye.position.set(-0.15, 1.7, 0.26);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.1), eyeMat);
    rightEye.position.set(0.15, 1.7, 0.26);
    group.add(rightEye);

    const gunGroup = new THREE.Group();
    const gun = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.3 })
    );
    gun.position.z = 0.3;
    gunGroup.add(gun);

    const enemyMuzzle = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 })
    );
    enemyMuzzle.position.z = 0.7;
    gunGroup.add(enemyMuzzle);
    gunGroup.position.set(0.3, 1.0, 0);
    group.add(gunGroup);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.05, 8, 16),
      new THREE.MeshBasicMaterial({ color: typeData.color })
    );
    ring.position.y = 0.7;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    group.position.copy(position);
    this.scene.add(group);

    // Assign weapon based on enemy type
    let weaponType = 'pistolShoot';
    if (type === 'soldier') {
      weaponType = 'akShoot';
    } else if (type === 'heavy') {
      weaponType = 'awpShoot';
    }

    // Create audio objects
    const shootSound = new THREE.Audio(this.listener);
    group.add(shootSound);

    const hurtSounds: THREE.Audio[] = [];
    for (let i = 0; i < 3; i++) {
      const hurtSound = new THREE.Audio(this.listener);
      group.add(hurtSound);
      hurtSounds.push(hurtSound);
    }

    const deathSound = new THREE.Audio(this.listener);
    group.add(deathSound);

    const jumpSound = new THREE.Audio(this.listener);
    group.add(jumpSound);

    // Assign buffers based on enemy type
    if (type === 'heavy') {
      // Use Kulu sounds for heavy
      if (this.audioBuffers['deathKulu']) deathSound.setBuffer(this.audioBuffers['deathKulu']);
      if (this.audioBuffers['jumpKulu1']) jumpSound.setBuffer(this.audioBuffers['jumpKulu1']);
      
      // Randomize hurt sounds
      const kuluHurts = ['hurtKulu1', 'hurtKulu2', 'hurtKulu3'];
      hurtSounds.forEach((sound, index) => {
        const key = kuluHurts[index % kuluHurts.length];
        if (this.audioBuffers[key]) sound.setBuffer(this.audioBuffers[key]);
      });
    } else {
      // Default to Female sounds for others
      if (this.audioBuffers['deathFemale']) deathSound.setBuffer(this.audioBuffers['deathFemale']);
      if (this.audioBuffers['jumpFemale']) jumpSound.setBuffer(this.audioBuffers['jumpFemale']);
      
      const femaleHurts = ['hurtFemale1', 'hurtFemale2', 'hurtFemale3'];
      hurtSounds.forEach((sound, index) => {
        const key = femaleHurts[index % femaleHurts.length];
        if (this.audioBuffers[key]) sound.setBuffer(this.audioBuffers[key]);
      });
    }

    // Set weapon sound
    if (this.audioBuffers[weaponType]) {
      shootSound.setBuffer(this.audioBuffers[weaponType]);
    }

    this.enemies.push({
      mesh: group,
      type,
      health: typeData.health,
      maxHealth: typeData.health,
      speed: typeData.speed,
      damage: typeData.damage,
      fireRate: typeData.fireRate,
      accuracy: typeData.accuracy,
      score: typeData.score,
      lastShotTime: 0,
      body,
      head,
      ring,
      muzzleFlash: enemyMuzzle,
      strafeDir: Math.random() > 0.5 ? 1 : -1,
      strafeTime: 0,
      weaponType,
      shootSound,
      hurtSounds,
      deathSound,
      jumpSound,
    });
  }

  private hasLineOfSight(
    enemyPos: THREE.Vector3,
    playerPos: THREE.Vector3,
    obstacles: Array<{ mesh: THREE.Mesh; box: THREE.Box3 }>
  ): boolean {
    // Cast ray from enemy eye level to player center mass
    const eyeHeight = 1.5;
    const from = enemyPos.clone();
    from.y = eyeHeight;
    const to = playerPos.clone();
    to.y = 0.8; // Player center mass

    const direction = to.clone().sub(from).normalize();
    const distance = from.distanceTo(to);

    const raycaster = new THREE.Raycaster(from, direction, 0, distance - 0.5); // Stop before player

    // Check if ray hits any obstacle - use recursive true to check children
    const meshes = obstacles.map(obj => obj.mesh);
    const intersects = raycaster.intersectObjects(meshes, true);

    // If there are intersections before reaching the player, no line of sight
    return intersects.length === 0;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    obstacles: Array<{ x: number; z: number; width: number; depth: number }>,
    arenaObjects: Array<{ mesh: THREE.Mesh; box: THREE.Box3 }>,
    onEnemyShoot: (enemy: Enemy) => void
  ): void {
    const playerPos2D = playerPos.clone();
    playerPos2D.y = 1;

    this.enemies.forEach((enemy) => {
      const enemyPos = enemy.mesh.position.clone();
      enemyPos.y = 1;

      const dist = enemyPos.distanceTo(playerPos2D);
      const dir = playerPos2D.clone().sub(enemyPos).normalize();

      // Look at player
      enemy.mesh.lookAt(playerPos2D);

      // Movement with obstacle avoidance
      let moveDir = dir.clone();

      // Check for obstacles
      obstacles.forEach((obs) => {
        const toObstacle = new THREE.Vector2(obs.x - enemyPos.x, obs.z - enemyPos.z);
        const obsDist = toObstacle.length();
        if (obsDist < obs.width + 2) {
          const avoidDir = toObstacle.normalize().multiplyScalar(-1);
          moveDir.x += avoidDir.x * 0.5;
          moveDir.z += avoidDir.y * 0.5;
        }
      });

      // Strafe logic
      enemy.strafeTime += delta;
      if (enemy.strafeTime > 2) {
        enemy.strafeDir *= -1;
        enemy.strafeTime = 0;
      }

      if (dist < 15 && dist > 5) {
        const strafeVec = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(enemy.strafeDir);
        moveDir.add(strafeVec.multiplyScalar(0.3));
      }

      moveDir.normalize();

      // Calculate intended movement
      let newX = enemy.mesh.position.x;
      let newZ = enemy.mesh.position.z;
      
      if (dist > 8) {
        newX += moveDir.x * enemy.speed * delta;
        newZ += moveDir.z * enemy.speed * delta;
      } else if (dist < 6) {
        newX -= dir.x * enemy.speed * 0.3 * delta;
        newZ -= dir.z * enemy.speed * 0.3 * delta;
      }

      // Check collision with arena objects before moving
      const enemyRadius = 0.5;
      let canMove = true;
      
      for (const obj of arenaObjects) {
        // Expand the bounding box slightly for the check
        const expandedBox = obj.box.clone();
        expandedBox.min.x -= enemyRadius;
        expandedBox.min.z -= enemyRadius;
        expandedBox.max.x += enemyRadius;
        expandedBox.max.z += enemyRadius;
        
        // Check if new position would collide
        if (newX >= expandedBox.min.x && newX <= expandedBox.max.x &&
            newZ >= expandedBox.min.z && newZ <= expandedBox.max.z &&
            enemy.mesh.position.y >= expandedBox.min.y && enemy.mesh.position.y <= expandedBox.max.y) {
          canMove = false;
          break;
        }
      }
      
      // Only move if no collision
      if (canMove) {
        enemy.mesh.position.x = newX;
        enemy.mesh.position.z = newZ;
      }

      // Shoot only if has line of sight
      const now = performance.now();
      if (dist < 25 && now - enemy.lastShotTime > 1000 / enemy.fireRate) {
        // Check line of sight before shooting
        if (this.hasLineOfSight(enemy.mesh.position, playerPos, arenaObjects)) {
          enemy.lastShotTime = now;
          onEnemyShoot(enemy);
        }
      }

      // Update appearance based on health
      if (enemy.ring) {
        enemy.ring.rotation.z += delta * 2;
      }

      const healthRatio = enemy.health / enemy.maxHealth;
      const baseColor = new THREE.Color(ENEMY_TYPES[enemy.type].color);
      const currentColor = baseColor.clone().lerp(new THREE.Color(0x333333), 1 - healthRatio);
      (enemy.body.material as THREE.MeshStandardMaterial).color.copy(currentColor);
      (enemy.body.material as THREE.MeshStandardMaterial).emissive.copy(currentColor);
      (enemy.body.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 * healthRatio;
      (enemy.head.material as THREE.MeshStandardMaterial).color.copy(currentColor);
      (enemy.head.material as THREE.MeshStandardMaterial).emissive.copy(currentColor);
    });
  }

  public damageEnemy(enemy: Enemy, damage: number, isHeadshot: boolean): boolean {
    enemy.health -= isHeadshot ? damage * 2 : damage;
    
    // Play hurt sound if still alive, death sound if killed
    if (enemy.health <= 0) {
      this.playDeathSound(enemy);
    } else {
      this.playHurtSound(enemy);
    }
    
    return enemy.health <= 0;
  }

  private playHurtSound(enemy: Enemy): void {
    const randomIndex = Math.floor(Math.random() * 3);
    const hurtKey = `hurtFemale${randomIndex + 1}`;
    if (this.audioBuffers[hurtKey]) {
      const sound = enemy.hurtSounds[randomIndex];
      if (sound.isPlaying) sound.stop();
      sound.setBuffer(this.audioBuffers[hurtKey]);
      sound.setVolume(0.5);
      sound.play();
    }
  }

  private playDeathSound(enemy: Enemy): void {
    if (this.audioBuffers['deathFemale']) {
      if (enemy.deathSound.isPlaying) enemy.deathSound.stop();
      enemy.deathSound.setBuffer(this.audioBuffers['deathFemale']);
      enemy.deathSound.setVolume(0.6);
      enemy.deathSound.play();
    }
  }

  public playShootSound(enemy: Enemy): void {
    if (this.audioBuffers[enemy.weaponType]) {
      if (enemy.shootSound.isPlaying) enemy.shootSound.stop();
      enemy.shootSound.setBuffer(this.audioBuffers[enemy.weaponType]);
      enemy.shootSound.setVolume(0.4);
      enemy.shootSound.play();
    }
  }

  public removeEnemy(enemy: Enemy): void {
    this.scene.remove(enemy.mesh);
    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
    }
  }

  public getEnemies(): Enemy[] {
    return this.enemies;
  }

  public getEnemyCount(): number {
    return this.enemies.length;
  }

  public clear(): void {
    this.enemies.forEach((e) => this.scene.remove(e.mesh));
    this.enemies.length = 0;
  }

  public spawnWave(wave: number): void {
    const shuffledSpawns = [...this.spawnPoints].sort(() => Math.random() - 0.5);
    let idx = 0;

    // Wave 1-2: Only grunts with pistols
    // Wave 3+: Start introducing soldiers with AKs
    // Wave 5+: Start introducing heavies with AWPs
    
    if (wave <= 2) {
      // Early waves: only grunts
      for (let i = 0; i < 3 + wave; i++) {
        this.createEnemy('grunt', shuffledSpawns[idx++ % 8].clone());
      }
    } else {
      // Later waves: mix of enemy types
      for (let i = 0; i < 3 + wave; i++) {
        this.createEnemy('grunt', shuffledSpawns[idx++ % 8].clone());
      }
      for (let i = 0; i < Math.floor(wave / 2); i++) {
        this.createEnemy('soldier', shuffledSpawns[idx++ % 8].clone());
      }
      if (wave >= 5) {
        for (let i = 0; i < Math.floor(wave / 3); i++) {
          this.createEnemy('heavy', shuffledSpawns[idx++ % 8].clone());
        }
      }
    }
  }
}
