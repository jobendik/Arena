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
}

export class EnemyManager {
  private enemies: Enemy[] = [];
  private scene: THREE.Scene;
  private spawnPoints: THREE.Vector3[];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
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
    });
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    obstacles: Array<{ x: number; z: number; width: number; depth: number }>,
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

      // Move
      if (dist > 8) {
        enemy.mesh.position.x += moveDir.x * enemy.speed * delta;
        enemy.mesh.position.z += moveDir.z * enemy.speed * delta;
      } else if (dist < 6) {
        enemy.mesh.position.x -= dir.x * enemy.speed * 0.3 * delta;
        enemy.mesh.position.z -= dir.z * enemy.speed * 0.3 * delta;
      }

      // Shoot
      const now = performance.now();
      if (dist < 25 && now - enemy.lastShotTime > 1000 / enemy.fireRate) {
        enemy.lastShotTime = now;
        onEnemyShoot(enemy);
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
    return enemy.health <= 0;
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

    for (let i = 0; i < 3 + wave; i++) {
      this.createEnemy('grunt', shuffledSpawns[idx++ % 8].clone());
    }
    for (let i = 0; i < Math.floor(wave / 2); i++) {
      this.createEnemy('soldier', shuffledSpawns[idx++ % 8].clone());
    }
    for (let i = 0; i < Math.floor(wave / 3); i++) {
      this.createEnemy('heavy', shuffledSpawns[idx++ % 8].clone());
    }
  }
}
