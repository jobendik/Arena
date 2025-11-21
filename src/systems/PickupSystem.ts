import * as THREE from 'three';
import { Player } from '../entities/Player';

export interface Pickup {
  mesh: THREE.Mesh;
  effect: (player: Player, weaponAddAmmo?: (amount: number) => void) => void;
}

export class PickupSystem {
  private pickups: Pickup[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public create(type: string, position: THREE.Vector3): void {
    const configs: Record<
      string,
      { color: number; effect: (player: Player, weaponAddAmmo?: (amount: number) => void) => void }
    > = {
      health: {
        color: 0x22c55e,
        effect: (player) => player.heal(30),
      },
      armor: {
        color: 0x3b82f6,
        effect: (player) => player.addArmor(50),
      },
      ammo: {
        color: 0xf59e0b,
        effect: (_player, weaponAddAmmo) => weaponAddAmmo && weaponAddAmmo(60),
      },
      damage: {
        color: 0xef4444,
        effect: (player) => player.setPowerup('damage', 10),
      },
      speed: {
        color: 0x06b6d4,
        effect: (player) => player.setPowerup('speed', 10),
      },
      rapid: {
        color: 0xa855f7,
        effect: (player) => player.setPowerup('rapid', 10),
      },
    };

    const config = configs[type];
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshStandardMaterial({ 
        color: config.color, 
        emissive: config.color, 
        emissiveIntensity: 0.8,
        metalness: 0.5,
        roughness: 0.3
      })
    );
    mesh.position.copy(position);
    mesh.castShadow = true;

    const outline = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.0, 1.0),
      new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide,
      })
    );
    mesh.add(outline);
    this.scene.add(mesh);

    this.pickups.push({ mesh, effect: config.effect });
  }

  public update(playerPos: THREE.Vector3, player: Player, weaponAddAmmo?: (amount: number) => void): string | null {
    let pickedUp: string | null = null;

    this.pickups.forEach((pickup, index) => {
      pickup.mesh.rotation.y += 0.02;
      const time = performance.now() * 0.003;
      pickup.mesh.position.y = 0.5 + Math.sin(time + index) * 0.1;

      const dist = playerPos.distanceTo(pickup.mesh.position);
      if (dist < 1.5) {
        pickup.effect(player, weaponAddAmmo);
        this.scene.remove(pickup.mesh);
        this.pickups.splice(index, 1);
        pickedUp = 'pickup';
      }
    });

    return pickedUp;
  }

  public spawnWavePickups(playerHealth: number, maxHealth: number, wave: number): void {
    this.create('health', new THREE.Vector3((Math.random() - 0.5) * 40, 0.5, (Math.random() - 0.5) * 40));
    this.create('ammo', new THREE.Vector3((Math.random() - 0.5) * 40, 0.5, (Math.random() - 0.5) * 40));
    this.create('armor', new THREE.Vector3((Math.random() - 0.5) * 40, 0.5, (Math.random() - 0.5) * 40));

    if (playerHealth < maxHealth * 0.5) {
      this.create('health', new THREE.Vector3((Math.random() - 0.5) * 20, 0.5, (Math.random() - 0.5) * 20));
    }

    const powerupTypes = ['damage', 'speed', 'rapid'];
    this.create(powerupTypes[wave % 3], new THREE.Vector3((Math.random() - 0.5) * 20, 0.5, (Math.random() - 0.5) * 20));
  }

  public clear(): void {
    this.pickups.forEach((p) => this.scene.remove(p.mesh));
    this.pickups.length = 0;
  }
}
