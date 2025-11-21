import * as THREE from 'three';
import { WEAPON_CONFIG } from '../config/gameConfig';
import { WeaponType } from '../types';

export interface SmokeParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
}

export class WeaponSystem {
  public currentWeaponType: WeaponType = WeaponType.AK47;
  private weapons: Record<WeaponType, { mag: number; reserve: number }>;

  public isReloading = false;
  public isZoomed = false;
  public reloadTimer = 0;
  private lastShotTime = 0;
  public shotsFiredInBurst = 0;
  public timeSinceLastShot = 0;

  // Recoil
  public recoilPitch = 0;
  public recoilYaw = 0;
  public recoilRecoveryTimer = 0;
  public weaponKickZ = 0;
  public weaponKickRotX = 0;
  public microShake = { x: 0, y: 0, timer: 0 };

  // Spread
  public currentBloom = 0;

  // Screen effects
  public fovPunch = 0;
  public cameraShake = { x: 0, y: 0, intensity: 0 };
  public chromaIntensity = 0;

  // Animation
  public weaponSwayX = 0;
  public weaponSwayY = 0;
  public sprintBlend = 0;
  public reloadBlend = 0;

  // Smoke
  public smokeParticles: SmokeParticle[] = [];

  // Audio
  private audioBuffers: Record<string, AudioBuffer> = {};
  private fireSound: THREE.Audio;
  private reloadSound: THREE.Audio;
  private tailSound: THREE.Audio;
  private loadSound: THREE.Audio;
  private cockSound: THREE.Audio;
  private zoomSound: THREE.Audio;

  // Weapon model
  private weaponGroup: THREE.Group;
  private muzzleFlash: THREE.Mesh;
  private muzzleFlash2: THREE.Mesh;
  private muzzleLight: THREE.PointLight;
  private camera: THREE.Camera;

  constructor(camera: THREE.Camera, listener: THREE.AudioListener) {
    this.camera = camera;
    // Initialize weapons ammo
    this.weapons = {} as any;
    Object.values(WeaponType).forEach((type) => {
      this.weapons[type] = {
        mag: WEAPON_CONFIG[type].magSize,
        reserve: WEAPON_CONFIG[type].reserveAmmo,
      };
    });

    this.weaponGroup = this.createWeaponModel();
    (camera as any).add(this.weaponGroup);

    // Initialize Audio
    this.fireSound = new THREE.Audio(listener);
    this.reloadSound = new THREE.Audio(listener);
    this.tailSound = new THREE.Audio(listener);
    this.loadSound = new THREE.Audio(listener);
    this.cockSound = new THREE.Audio(listener);
    this.zoomSound = new THREE.Audio(listener);

    this.loadAllAudio();

    // Create muzzle effects
    this.muzzleFlash = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 })
    );
    this.muzzleFlash.position.set(0, 0.02, -0.6);
    this.weaponGroup.add(this.muzzleFlash);

    this.muzzleFlash2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.15, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0 })
    );
    this.muzzleFlash2.position.set(0, 0.02, -0.62);
    this.weaponGroup.add(this.muzzleFlash2);

    this.muzzleLight = new THREE.PointLight(0xffaa00, 0, 5);
    this.muzzleLight.position.copy(this.muzzleFlash.position);
    this.weaponGroup.add(this.muzzleLight);
  }

  private loadAllAudio(): void {
    const audioLoader = new THREE.AudioLoader();
    const loadedPaths = new Set<string>();

    Object.values(WEAPON_CONFIG).forEach((config) => {
      Object.values(config.audio).forEach((path) => {
        if (path && !loadedPaths.has(path)) {
          loadedPaths.add(path);
          audioLoader.load(
            path,
            (buffer) => {
              this.audioBuffers[path] = buffer;
            },
            undefined,
            (error) => {
              console.warn(`Failed to load audio: ${path}`, error);
            }
          );
        }
      });
    });
  }

  public switchWeapon(index: number): void {
    const types = Object.values(WeaponType);
    if (index >= 0 && index < types.length) {
      const newType = types[index];
      if (newType !== this.currentWeaponType && !this.isReloading) {
        this.currentWeaponType = newType;
        this.resetWeaponState();
        console.log(`Switched to ${WEAPON_CONFIG[newType].name}`);
      }
    }
  }

  public scrollWeapon(delta: number): void {
    const types = Object.values(WeaponType);
    let currentIndex = types.indexOf(this.currentWeaponType);
    currentIndex += delta;

    if (currentIndex < 0) currentIndex = types.length - 1;
    if (currentIndex >= types.length) currentIndex = 0;

    this.switchWeapon(currentIndex);
  }

  public setZoom(zoomed: boolean): boolean {
    // Only allow zoom for sniper weapons
    if (this.currentWeaponType !== WeaponType.Sniper && this.currentWeaponType !== WeaponType.AWP) {
      return false;
    }

    if (this.isZoomed === zoomed) return false;

    this.isZoomed = zoomed;
    this.weaponGroup.visible = !zoomed; // Hide weapon when zoomed
    
    // Play zoom sound
    const config = WEAPON_CONFIG[this.currentWeaponType];
    if (config.audio.zoom && this.audioBuffers[config.audio.zoom]) {
      if (this.zoomSound.isPlaying) this.zoomSound.stop();
      this.zoomSound.setBuffer(this.audioBuffers[config.audio.zoom]);
      this.zoomSound.setVolume(0.4);
      this.zoomSound.play();
    }

    return true;
  }

  private resetWeaponState(): void {
    this.isReloading = false;
    this.isZoomed = false;
    this.weaponGroup.visible = true;
    this.reloadTimer = 0;
    this.shotsFiredInBurst = 0;
    this.currentBloom = 0;
    this.recoilPitch = 0;
    this.recoilYaw = 0;

    // Remove old model
    if (this.weaponGroup.parent) {
      this.weaponGroup.parent.remove(this.weaponGroup);
    }

    // Create new model
    this.weaponGroup = this.createWeaponModel();
    
    // Re-add muzzle effects
    this.weaponGroup.add(this.muzzleFlash);
    this.weaponGroup.add(this.muzzleFlash2);
    this.weaponGroup.add(this.muzzleLight);

    // Add to camera
    (this.camera as any).add(this.weaponGroup);
    
    // Update muzzle light color/range based on new weapon
    const config = WEAPON_CONFIG[this.currentWeaponType];
    this.muzzleLight.color.setHex(config.muzzle.lightColor);
    this.muzzleLight.distance = config.muzzle.lightRange;
  }  public get currentMag(): number {
    return this.weapons[this.currentWeaponType].mag;
  }

  public set currentMag(value: number) {
    this.weapons[this.currentWeaponType].mag = value;
  }

  public get reserveAmmo(): number {
    return this.weapons[this.currentWeaponType].reserve;
  }

  public set reserveAmmo(value: number) {
    this.weapons[this.currentWeaponType].reserve = value;
  }

  // Weapon model
  private createWeaponModel(): THREE.Group {
    switch (this.currentWeaponType) {
      case WeaponType.AK47: return this.createAK47Model();
      case WeaponType.AWP: return this.createAWPModel();
      case WeaponType.LMG: return this.createLMGModel();
      case WeaponType.M4: return this.createM4Model();
      case WeaponType.Pistol: return this.createPistolModel();
      case WeaponType.Scar: return this.createScarModel();
      case WeaponType.Shotgun: return this.createShotgunModel();
      case WeaponType.Sniper: return this.createSniperModel();
      case WeaponType.Tec9: return this.createTec9Model();
      default: return this.createAK47Model();
    }
  }

  private createAK47Model(): THREE.Group {
    const group = new THREE.Group();
    
    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x5d4037, metalness: 0.1, roughness: 0.8 }) // Wood
    );
    body.position.set(0, 0, -0.1);
    group.add(body);

    // Metal parts
    const receiver = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.13, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 })
    );
    receiver.position.set(0, 0.01, -0.1);
    group.add(receiver);

    // Barrel
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.3 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, -0.5);
    group.add(barrel);

    // Magazine (Curved look via rotation)
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.25, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    mag.position.set(0, -0.15, -0.05);
    mag.rotation.x = 0.3;
    group.add(mag);

    group.position.set(0.25, -0.25, -0.4);
    return group;
  }

  private createAWPModel(): THREE.Group {
    const group = new THREE.Group();
    
    // Green Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.15, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x2e7d32, metalness: 0.2, roughness: 0.7 })
    );
    body.position.set(0, 0, -0.2);
    group.add(body);

    // Long Barrel
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.05, -0.8);
    group.add(barrel);

    // Scope
    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.12, -0.1);
    group.add(scope);

    group.position.set(0.3, -0.3, -0.5);
    return group;
  }

  private createLMGModel(): THREE.Group {
    const group = new THREE.Group();
    
    // Bulky Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.2, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x424242 })
    );
    body.position.set(0, 0, -0.1);
    group.add(body);

    // Box Mag
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.2, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
    );
    mag.position.set(0, -0.15, 0);
    group.add(mag);

    // Barrel
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, -0.6);
    group.add(barrel);

    group.position.set(0.3, -0.35, -0.4);
    return group;
  }

  private createM4Model(): THREE.Group {
    const group = new THREE.Group();
    
    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    body.position.set(0, 0, -0.1);
    group.add(body);

    // Barrel with handguard
    const handguard = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.09, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    handguard.position.set(0, 0.02, -0.4);
    group.add(handguard);

    // Carry handle / Sight
    const sight = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.06, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    sight.position.set(0, 0.1, -0.1);
    group.add(sight);

    group.position.set(0.25, -0.25, -0.4);
    return group;
  }

  private createPistolModel(): THREE.Group {
    const group = new THREE.Group();
    
    // Slide
    const slide = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.8 })
    );
    slide.position.set(0, 0.05, 0);
    group.add(slide);

    // Grip
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.15, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x2c3e50 })
    );
    grip.position.set(0, -0.05, 0.05);
    grip.rotation.x = -0.2;
    group.add(grip);

    group.position.set(0.2, -0.2, -0.3);
    return group;
  }

  private createScarModel(): THREE.Group {
    const group = new THREE.Group();
    
    // Tan Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.15, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xd2b48c }) // Tan
    );
    body.position.set(0, 0, -0.1);
    group.add(body);

    // Upper receiver
    const upper = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.08, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xc2a47c })
    );
    upper.position.set(0, 0.08, -0.15);
    group.add(upper);

    // Mag
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.2, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    mag.position.set(0, -0.15, -0.05);
    group.add(mag);

    group.position.set(0.25, -0.25, -0.4);
    return group;
  }

  private createShotgunModel(): THREE.Group {
    const group = new THREE.Group();
    
    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.12, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    body.position.set(0, 0, -0.1);
    group.add(body);

    // Long Barrel
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.6);
    group.add(barrel);

    // Pump
    const pump = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x5d4037 }) // Wood pump
    );
    pump.position.set(0, -0.05, -0.5);
    group.add(pump);

    group.position.set(0.25, -0.25, -0.4);
    return group;
  }

  private createSniperModel(): THREE.Group {
    const group = new THREE.Group();
    
    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.1, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    body.position.set(0, 0, -0.2);
    group.add(body);

    // Barrel
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.05, -0.8);
    group.add(barrel);

    // Scope
    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.04, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.1, -0.1);
    group.add(scope);

    group.position.set(0.3, -0.3, -0.5);
    return group;
  }

  private createTec9Model(): THREE.Group {
    const group = new THREE.Group();
    
    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    body.position.set(0, 0.05, 0);
    group.add(body);

    // Barrel shroud
    const shroud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x111111, wireframe: false })
    );
    shroud.rotation.x = Math.PI / 2;
    shroud.position.set(0, 0.05, -0.25);
    group.add(shroud);

    // Mag (Forward of trigger)
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.2, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    mag.position.set(0, -0.1, -0.1);
    group.add(mag);

    group.position.set(0.2, -0.2, -0.3);
    return group;
  }

  public canShoot(playerPowerup: string | null): boolean {
    if (this.isReloading || this.currentMag <= 0) return false;

    const config = WEAPON_CONFIG[this.currentWeaponType];
    const now = performance.now();
    const fireRate = config.fireRate * (playerPowerup === 'rapid' ? 2.5 : 1);

    // For semi-auto, ensure trigger release (simple check: time > 1/fireRate)
    // But for true semi-auto we'd need input state "justPressed".
    // Assuming input system handles "justPressed" or we just rely on fireRate.

    return now - this.lastShotTime >= 1000 / fireRate;
  }

  public shoot(
    camera: THREE.Camera,
    playerOnGround: boolean,
    playerIsSprinting: boolean,
    playerVelocity: THREE.Vector3
  ): { direction: THREE.Vector3; shotFired: boolean } {
    if (!this.canShoot(null)) {
      return { direction: new THREE.Vector3(), shotFired: false };
    }

    const config = WEAPON_CONFIG[this.currentWeaponType];

    // Reset burst if enough time passed
    if (this.timeSinceLastShot > config.sprayPattern.resetTime) {
      this.shotsFiredInBurst = 0;
    }

    this.lastShotTime = performance.now();
    this.timeSinceLastShot = 0;
    this.currentMag--;

    // Calculate shot direction with spread and pattern
    const dir = this.calculateShotDirection(camera, playerOnGround, playerIsSprinting, playerVelocity);

    // Apply recoil
    this.applyRecoil();

    // Play sound
    const soundPath = config.audio.fire;
    if (this.audioBuffers[soundPath]) {
      if (this.fireSound.isPlaying) this.fireSound.stop();
      this.fireSound.setBuffer(this.audioBuffers[soundPath]);
      this.fireSound.setVolume(0.5);
      this.fireSound.play();
    }

    // Play tail sound if available (for echo/reverb effect)
    if (config.audio.tail && this.audioBuffers[config.audio.tail]) {
      if (this.tailSound.isPlaying) this.tailSound.stop();
      this.tailSound.setBuffer(this.audioBuffers[config.audio.tail]);
      this.tailSound.setVolume(0.3);
      this.tailSound.play();
    }

    // Trigger effects
    this.triggerMuzzleFlash();
    this.triggerScreenEffects();
    this.spawnSmoke();

    this.shotsFiredInBurst++;

    return { direction: dir, shotFired: true };
  }

  private calculateShotDirection(
    camera: THREE.Camera,
    playerOnGround: boolean,
    playerIsSprinting: boolean,
    playerVelocity: THREE.Vector3
  ): THREE.Vector3 {
    const config = WEAPON_CONFIG[this.currentWeaponType];
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

    // Calculate spread
    let spread = config.spread.base;
    const horizSpeed = Math.sqrt(playerVelocity.x ** 2 + playerVelocity.z ** 2);

    if (!playerOnGround) {
      spread *= 2.0; // config.spread.air
    } else if (playerIsSprinting) {
      spread *= 1.5; // config.spread.sprint
    } else if (horizSpeed > 1) {
      spread *= 1.2; // config.spread.move
    }

    spread += this.currentBloom;

    // First shot accuracy
    // if (this.shotsFiredInBurst === 0) {
    //   spread *= config.spread.firstShotBonus; // Missing in interface
    // }

    // Spray pattern
    let patternPitch = 0,
      patternYaw = 0;
    if (config.sprayPattern.enabled) {
      const idx = Math.min(this.shotsFiredInBurst, config.sprayPattern.vertical.length - 1);
      patternPitch = config.sprayPattern.vertical[idx] * config.sprayPattern.scale;
      patternYaw =
        (config.sprayPattern.horizontal[idx] || 0) * config.sprayPattern.scale;
    }

    // Apply offsets
    dir.x += (Math.random() - 0.5) * spread + patternYaw;
    dir.y += (Math.random() - 0.5) * spread - patternPitch;
    dir.normalize();

    // Add bloom
    this.currentBloom = Math.min(
      config.spread.max, // config.spread.maxBloom -> max
      this.currentBloom + config.spread.increasePerShot // bloomPerShot -> increasePerShot
    );

    return dir;
  }

  public getCurrentSpread(): number {
    const config = WEAPON_CONFIG[this.currentWeaponType];
    // Return base weapon spread + current bloom (accumulated from firing)
    return config.spread.base + this.currentBloom;
  }

  private applyRecoil(): void {
    const config = WEAPON_CONFIG[this.currentWeaponType];
    const cfg = config.recoil;

    const pitchKick = cfg.pitchAmount + (Math.random() - 0.5) * cfg.pitchRandom;
    const yawKick = (Math.random() - 0.5) * cfg.yawAmount + (Math.random() - 0.5) * cfg.yawRandom;

    // maxPitch/maxYaw missing in interface, using hardcoded limits
    this.recoilPitch = Math.min(0.5, this.recoilPitch + pitchKick);
    this.recoilYaw = Math.max(-0.5, Math.min(0.5, this.recoilYaw + yawKick));
    this.recoilRecoveryTimer = 0.1; // cfg.recoveryDelay missing

    this.weaponKickZ = cfg.kickZ; // kickBackZ -> kickZ
    this.weaponKickRotX = (cfg.kickRotX * Math.PI) / 180; // kickRotationX -> kickRotX

    this.microShake.timer = 0.1; // cfg.shakeDuration missing
    this.microShake.x = (Math.random() - 0.5) * config.screen.shakeIntensity;
    this.microShake.y = (Math.random() - 0.5) * config.screen.shakeIntensity;
  }

  private triggerMuzzleFlash(): void {
    const config = WEAPON_CONFIG[this.currentWeaponType];
    const cfg = config.muzzle;

    const scale = cfg.flashScale.min + Math.random() * (cfg.flashScale.max - cfg.flashScale.min);
    this.muzzleFlash.scale.setScalar(scale);
    this.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
    (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 1;

    this.muzzleFlash2.scale.setScalar(scale * 0.7);
    this.muzzleFlash2.rotation.z = Math.random() * Math.PI * 2;
    (this.muzzleFlash2.material as THREE.MeshBasicMaterial).opacity = 0.8;

    this.muzzleLight.intensity = cfg.lightIntensity;

    setTimeout(() => {
      (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 0;
      (this.muzzleFlash2.material as THREE.MeshBasicMaterial).opacity = 0;
      this.muzzleLight.intensity = 0;
    }, cfg.flashDuration * 1000);
  }

  private triggerScreenEffects(): void {
    const config = WEAPON_CONFIG[this.currentWeaponType];
    const cfg = config.screen;

    this.fovPunch = Math.min(cfg.maxFovPunch, this.fovPunch + cfg.fovPunch);
    this.cameraShake.intensity = Math.max(this.cameraShake.intensity, cfg.shakeIntensity);
    this.chromaIntensity = Math.min(cfg.maxChroma, this.chromaIntensity + cfg.chromaIntensity);
  }

  private spawnSmoke(): void {
    const config = WEAPON_CONFIG[this.currentWeaponType];
    const cfg = config.muzzle;

    for (let i = 0; i < cfg.smokeParticles; i++) {
      const smokeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 0.1),
        new THREE.MeshBasicMaterial({
          color: 0xaaaaaa,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
        })
      );

      smokeMesh.position.copy(this.muzzleFlash.position);
      smokeMesh.position.x += (Math.random() - 0.5) * 0.1;
      smokeMesh.position.y += (Math.random() - 0.5) * 0.1;
      smokeMesh.rotation.z = Math.random() * Math.PI * 2;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5 + cfg.smokeSpeed
      );

      this.weaponGroup.add(smokeMesh);

      this.smokeParticles.push({
        mesh: smokeMesh,
        velocity,
        lifetime: 0,
        maxLifetime: 1.0 + Math.random() * 0.5,
      });
    }
  }

  public tryReload(onReloadComplete: () => void): boolean {
    const config = WEAPON_CONFIG[this.currentWeaponType];
    if (this.isReloading || this.currentMag >= config.magSize || this.reserveAmmo <= 0) {
      return false;
    }

    this.isReloading = true;

    // Play reload sound
    const soundPath = config.audio.reload;
    if (this.audioBuffers[soundPath]) {
      if (this.reloadSound.isPlaying) this.reloadSound.stop();
      this.reloadSound.setBuffer(this.audioBuffers[soundPath]);
      this.reloadSound.setVolume(0.5);
      this.reloadSound.play();
    }

    // Play load sound after a delay (mid-reload for shotgun/sniper)
    if (config.audio.load && this.audioBuffers[config.audio.load]) {
      const loadPath = config.audio.load;
      setTimeout(() => {
        if (this.loadSound.isPlaying) this.loadSound.stop();
        this.loadSound.setBuffer(this.audioBuffers[loadPath]);
        this.loadSound.setVolume(0.5);
        this.loadSound.play();
      }, (config.reloadTime * 0.5) * 1000);
    }

    // Play cock sound near the end (for shotgun)
    if (config.audio.cock && this.audioBuffers[config.audio.cock]) {
      const cockPath = config.audio.cock;
      setTimeout(() => {
        if (this.cockSound.isPlaying) this.cockSound.stop();
        this.cockSound.setBuffer(this.audioBuffers[cockPath]);
        this.cockSound.setVolume(0.5);
        this.cockSound.play();
      }, (config.reloadTime * 0.8) * 1000);
    }

    setTimeout(() => {
      const needed = config.magSize - this.currentMag;
      const toLoad = Math.min(needed, this.reserveAmmo);
      this.currentMag += toLoad;
      this.reserveAmmo -= toLoad;
      this.isReloading = false;
      onReloadComplete();
    }, config.reloadTime * 1000);

    return true;
  }

  public addAmmo(amount: number): void {
    this.reserveAmmo += amount;
  }

  public update(delta: number, mouseMovement: { x: number; y: number }, isSprinting: boolean, headBobTime: number = 0): void {
    const config = WEAPON_CONFIG[this.currentWeaponType];
    this.timeSinceLastShot += delta;

    // Bloom decay
    this.currentBloom = Math.max(0, this.currentBloom - config.spread.recoveryRate * delta); // bloomRecovery -> recoveryRate

    // Recoil recovery
    if (this.recoilRecoveryTimer > 0) {
      this.recoilRecoveryTimer -= delta;
    } else {
      this.recoilPitch = Math.max(0, this.recoilPitch - config.recoil.recoveryRate * delta); // recoverySpeed -> recoveryRate
      this.recoilYaw *= 1 - config.recoil.recoveryRate * delta;
    }

    // Weapon kickback recovery
    this.weaponKickZ *= 1 - 5 * delta; // kickBackRecovery missing, using 5
    this.weaponKickRotX *= 1 - 5 * delta;

    // Micro-shake
    if (this.microShake.timer > 0) {
      this.microShake.timer -= delta;
      this.microShake.x *= config.screen.shakeDecay; // shakeDecay from screen? or recoil?
      this.microShake.y *= config.screen.shakeDecay;
    }

    // Camera shake
    if (this.cameraShake.intensity > 0) {
      this.cameraShake.x = (Math.random() - 0.5) * this.cameraShake.intensity;
      this.cameraShake.y = (Math.random() - 0.5) * this.cameraShake.intensity;
      this.cameraShake.intensity *= config.screen.shakeDecay;
    }

    // FOV punch recovery
    this.fovPunch = Math.max(0, this.fovPunch - config.screen.fovPunchRecovery * delta);

    // Chroma recovery
    this.chromaIntensity *= config.screen.chromaDecay;
    if (this.chromaIntensity < 0.0001) this.chromaIntensity = 0;

    // Weapon sway
    const cfg = config.animation;
    this.weaponSwayX += (mouseMovement.x * cfg.swayAmount - this.weaponSwayX) * cfg.swayRecovery * delta;
    this.weaponSwayY += (mouseMovement.y * cfg.swayAmount - this.weaponSwayY) * cfg.swayRecovery * delta;

    // Sprint blend
    const targetSprint = isSprinting ? 1 : 0;
    this.sprintBlend += (targetSprint - this.sprintBlend) * cfg.sprintLerpSpeed * delta;

    // Reload blend
    const targetReload = this.isReloading ? 1 : 0;
    this.reloadBlend += (targetReload - this.reloadBlend) * cfg.reloadLerpSpeed * delta;

    // Update smoke
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const smoke = this.smokeParticles[i];

      smoke.mesh.position.add(smoke.velocity.clone().multiplyScalar(delta));
      smoke.velocity.y += delta * 2;
      smoke.velocity.multiplyScalar(0.95);

      smoke.lifetime += delta;
      const lifeRatio = 1 - (smoke.lifetime / smoke.maxLifetime);
      (smoke.mesh.material as THREE.MeshBasicMaterial).opacity = lifeRatio * 0.4;
      smoke.mesh.scale.setScalar(1 + (1 - lifeRatio) * 2);
      smoke.mesh.lookAt(this.weaponGroup.parent!.position); // Look at camera

      if (smoke.lifetime >= smoke.maxLifetime) {
        this.weaponGroup.remove(smoke.mesh);
        this.smokeParticles.splice(i, 1);
      }
    }

    // Apply weapon position/rotation
    this.updateWeaponTransform(delta, headBobTime);
  }

  private updateWeaponTransform(delta: number, headBobTime: number): void {
    const config = WEAPON_CONFIG[this.currentWeaponType];
    const cfg = config.animation;

    // Calculate target position/rotation
    let targetX = cfg.baseX - this.weaponSwayX;
    let targetY = cfg.baseY - this.weaponSwayY;
    let targetZ = cfg.baseZ;

    // Weapon bob (breathing/walking motion)
    const bobX = Math.cos(headBobTime * 0.5) * 0.015 * cfg.bobInfluence;
    const bobY = Math.sin(headBobTime) * 0.035 * cfg.bobInfluence;
    targetX += bobX;
    targetY += bobY;

    // Kickback from shooting
    targetZ += this.weaponKickZ;

    // Sprint offset
    targetX += cfg.sprintOffsetX * this.sprintBlend;
    targetY += cfg.sprintOffsetY * this.sprintBlend;

    // Reload offset
    targetY -= cfg.reloadDipY * this.reloadBlend;

    // Rotations
    let targetRotX = -this.weaponKickRotX + (cfg.reloadRotX * this.reloadBlend);
    let targetRotZ = (cfg.sprintRotZ * this.sprintBlend);

    // Smooth lerp to target
    const lerpSpeed = 15;
    this.weaponGroup.position.x += (targetX - this.weaponGroup.position.x) * lerpSpeed * delta;
    this.weaponGroup.position.y += (targetY - this.weaponGroup.position.y) * lerpSpeed * delta;
    this.weaponGroup.position.z += (targetZ - this.weaponGroup.position.z) * lerpSpeed * delta;
    this.weaponGroup.rotation.x += (targetRotX - this.weaponGroup.rotation.x) * lerpSpeed * delta;
    this.weaponGroup.rotation.z += (targetRotZ - this.weaponGroup.rotation.z) * lerpSpeed * delta;
  }

  public reset(): void {
    const config = WEAPON_CONFIG[this.currentWeaponType];
    this.currentMag = config.magSize;
    this.reserveAmmo = config.reserveAmmo;
    this.isReloading = false;
    this.recoilPitch = 0;
    this.recoilYaw = 0;
    this.currentBloom = 0;
    this.shotsFiredInBurst = 0;
    this.fovPunch = 0;
    this.cameraShake.intensity = 0;
    this.chromaIntensity = 0;
  }
}
