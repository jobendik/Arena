import * as THREE from 'three';
import { Player } from './entities/Player';
import { EnemyManager, Enemy } from './entities/EnemyManager';
import { WeaponSystem } from './systems/WeaponSystem';
import { ParticleSystem } from './systems/ParticleSystem';
import { PickupSystem } from './systems/PickupSystem';
import { Arena } from './world/Arena';
import { InputManager } from './core/InputManager';
import { PostProcessing } from './core/PostProcessing';
import { HUDManager } from './ui/HUDManager';
import { GameState } from './types';
import { PLAYER_CONFIG, CAMERA_CONFIG } from './config/gameConfig';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private postProcessing: PostProcessing;

  private player: Player;
  private weaponSystem: WeaponSystem;
  private enemyManager: EnemyManager;
  private particleSystem: ParticleSystem;
  private pickupSystem: PickupSystem;
  private arena: Arena;
  private inputManager: InputManager;
  private hudManager: HUDManager;

  private gameState: GameState;
  private lastTime = 0;
  private gameTime = 0;
  private pointLights: Array<{ light: THREE.PointLight; baseIntensity: number; phase: number }> = [];
  private skyMaterial?: THREE.ShaderMaterial;

  constructor() {
    console.log('Initializing game...');
    
    // Initialize Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.baseFOV,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Audio Listener
    const listener = new THREE.AudioListener();
    this.camera.add(listener);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    (this.renderer as any).outputEncoding = THREE.sRGBEncoding;
    
    const container = document.getElementById('game-container');
    if (!container) {
      console.error('Game container not found!');
      throw new Error('Game container element not found');
    }
    container.appendChild(this.renderer.domElement);
    console.log('Renderer added to DOM');

    // Initialize game systems
    this.player = new Player();
    this.weaponSystem = new WeaponSystem(this.camera, listener);
    this.enemyManager = new EnemyManager(this.scene);
    this.particleSystem = new ParticleSystem(this.scene);
    this.pickupSystem = new PickupSystem(this.scene);
    this.arena = new Arena(this.scene);
    this.inputManager = new InputManager(CAMERA_CONFIG.mouseSensitivity);
    this.hudManager = new HUDManager();
    this.postProcessing = new PostProcessing(this.renderer, this.scene, this.camera);

    // Initialize game state
    this.gameState = {
      running: false,
      paused: false,
      wave: 1,
      score: 0,
      kills: 0,
      shotsFired: 0,
      shotsHit: 0,
      timeStarted: 0,
      waveInProgress: false,
      betweenWaves: false,
    };

    this.setupScene();
    this.setupEventListeners();
    
    console.log('Game initialized successfully');
  }

  private setupScene(): void {
    // Lighting
    this.scene.add(new THREE.AmbientLight(0x1a1a3a, 0.3));

    const mainLight = new THREE.DirectionalLight(0xff6b35, 1.2);
    mainLight.position.set(30, 50, -30);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 4096;
    mainLight.shadow.mapSize.height = 4096;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 150;
    mainLight.shadow.camera.left = -60;
    mainLight.shadow.camera.right = 60;
    mainLight.shadow.camera.top = 60;
    mainLight.shadow.camera.bottom = -60;
    this.scene.add(mainLight);

    const dir2 = new THREE.DirectionalLight(0x4a9eff, 0.4);
    dir2.position.set(-30, 20, 30);
    this.scene.add(dir2);

    const dir3 = new THREE.DirectionalLight(0xff4488, 0.6);
    dir3.position.set(0, 10, 50);
    this.scene.add(dir3);
    
    // Animated point lights
    const centerLight = new THREE.PointLight(0xff3366, 2, 25);
    centerLight.position.set(0, 3, 0);
    this.scene.add(centerLight);
    this.pointLights.push({ light: centerLight, baseIntensity: 2, phase: 0 });
    
    const cornerColors = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff88];
    const cornerPositions = [[20, 4, 20], [-20, 4, 20], [20, 4, -20], [-20, 4, -20]];
    cornerPositions.forEach((pos, i) => {
      const light = new THREE.PointLight(cornerColors[i], 1.5, 30);
      light.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(light);
      this.pointLights.push({ light, baseIntensity: 1.5, phase: i * 0.5 });
    });

    // Sky
    const skyGeo = new THREE.SphereGeometry(400, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        topColor: { value: new THREE.Color(0x0a0a1a) },
        bottomColor: { value: new THREE.Color(0x1a0a2e) },
        sunColor: { value: new THREE.Color(0xff4400) },
        sunPosition: { value: new THREE.Vector3(100, 20, -100) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 sunColor;
        uniform vec3 sunPosition;
        varying vec3 vWorldPosition;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
          vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
          float heightFactor = (viewDirection.y + 1.0) * 0.5;
          vec3 skyColor = mix(bottomColor, topColor, pow(heightFactor, 0.5));
          
          vec3 sunDir = normalize(sunPosition);
          float sunDot = max(0.0, dot(viewDirection, sunDir));
          skyColor += sunColor * (pow(sunDot, 64.0) * 2.0 + pow(sunDot, 8.0) * 0.3);
          
          float aurora = sin(viewDirection.x * 3.0 + time * 0.5) * 
                         sin(viewDirection.z * 2.0 + time * 0.3) * 0.5 + 0.5;
          skyColor += vec3(0.2, 0.5, 1.0) * aurora * pow(heightFactor, 2.0) * 0.15;
          
          vec2 starUV = viewDirection.xz / (viewDirection.y + 0.1);
          float stars = step(0.998, random(floor(starUV * 200.0))) * heightFactor * 0.8;
          float twinkle = sin(time * 3.0 + random(floor(starUV * 200.0)) * 100.0) * 0.5 + 0.5;
          skyColor += vec3(1.0) * stars * twinkle;
          
          gl_FragColor = vec4(skyColor, 1.0);
        }
      `,
      side: THREE.BackSide,
    });
    this.skyMaterial = skyMat;
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));

    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.012);
    this.scene.add(this.camera);
  }

  private setupEventListeners(): void {
    this.inputManager.setJumpCallback(() => {
      this.player.jumpBufferTimer = PLAYER_CONFIG.jumpBuffer;
    });

    this.inputManager.setReloadCallback(() => {
      this.tryReload();
    });

    this.inputManager.setPauseCallback(() => {
      this.togglePause();
    });

    this.inputManager.setWeaponSelectCallback((index) => {
      this.weaponSystem.switchWeapon(index);
    });

    this.inputManager.setScrollCallback((delta) => {
      this.weaponSystem.scrollWeapon(delta);
    });

    this.inputManager.setZoomCallback((isZoomed) => {
      const changed = this.weaponSystem.setZoom(isZoomed);
      if (changed) {
        this.hudManager.toggleScope(isZoomed);
        // Instant FOV change for responsiveness
        if (isZoomed) {
          this.player.currentFOV = 40; // Zoomed FOV
        } else {
          this.player.currentFOV = CAMERA_CONFIG.baseFOV;
        }
      }
    });

    window.addEventListener('resize', () => this.onWindowResize());
    
    document.addEventListener('click', () => {
      if (!this.gameState.running && !this.gameState.paused) {
        this.startGame();
      } else if (this.gameState.paused) {
        this.togglePause();
      } else {
        document.body.requestPointerLock();
      }
    });
  }

  private startGame(): void {
    this.hudManager.hideStartScreen();
    this.hudManager.hideGameOver();

    // Reset game state
    this.gameState = {
      running: true,
      paused: false,
      wave: 1,
      score: 0,
      kills: 0,
      shotsFired: 0,
      shotsHit: 0,
      timeStarted: performance.now(),
      waveInProgress: false,
      betweenWaves: false,
    };

    // Reset systems
    this.player.reset();
    this.weaponSystem.reset();
    this.enemyManager.clear();
    this.particleSystem.clear();
    this.pickupSystem.clear();

    // Spawn initial pickups
    this.pickupSystem.spawnWavePickups(this.player.health, PLAYER_CONFIG.maxHealth, this.gameState.wave);

    this.updateHUD();
    this.renderer.domElement.requestPointerLock();

    setTimeout(() => this.startWave(), 1000);
  }

  private startWave(): void {
    this.gameState.waveInProgress = true;
    this.gameState.betweenWaves = false;
    this.enemyManager.spawnWave(this.gameState.wave);
    this.hudManager.showMessage(`WAVE ${this.gameState.wave}`);
    this.updateHUD();
  }

  private waveComplete(): void {
    this.gameState.waveInProgress = false;
    this.gameState.betweenWaves = true;
    this.gameState.score += this.gameState.wave * 500;

    this.hudManager.showMessage('WAVE CLEARED');
    this.pickupSystem.spawnWavePickups(this.player.health, PLAYER_CONFIG.maxHealth, this.gameState.wave);

    setTimeout(() => {
      this.gameState.wave++;
      this.startWave();
    }, 3000);
  }

  private tryReload(): void {
    const reloadStarted = this.weaponSystem.tryReload(() => {
      this.hudManager.showReloading(false);
      this.updateHUD();
    });

    if (reloadStarted) {
      this.hudManager.showReloading(true);
    }
  }

  private togglePause(): void {
    this.gameState.paused = !this.gameState.paused;
    this.hudManager.showPauseMenu(this.gameState.paused);

    if (this.gameState.paused) {
      document.exitPointerLock();
    } else {
      this.renderer.domElement.requestPointerLock();
    }
  }

  // private quitToMenu(): void {
  //   this.gameState.running = false;
  //   this.gameState.paused = false;
  //   document.exitPointerLock();
  //   this.hudManager.showPauseMenu(false);
  //   location.reload();
  // }

  private gameOver(): void {
    this.gameState.running = false;
    document.exitPointerLock();

    const time = (performance.now() - this.gameState.timeStarted) / 1000;
    const accuracy =
      this.gameState.shotsFired > 0
        ? Math.round((this.gameState.shotsHit / this.gameState.shotsFired) * 100)
        : 0;

    this.hudManager.showGameOver({
      wave: this.gameState.wave,
      kills: this.gameState.kills,
      accuracy,
      time: `${Math.floor(time / 60)}:${Math.floor(time % 60)
        .toString()
        .padStart(2, '0')}`,
      score: this.gameState.score,
    });
  }

  private updateHUD(): void {
    this.hudManager.updateHealth(this.player.health, PLAYER_CONFIG.maxHealth);
    this.hudManager.updateArmor(this.player.armor, PLAYER_CONFIG.maxArmor);
    this.hudManager.updateStamina(this.player.stamina, PLAYER_CONFIG.maxStamina);
    this.hudManager.updateAmmo(this.weaponSystem.currentMag, this.weaponSystem.reserveAmmo);
    this.hudManager.updateWave(this.gameState.wave);
    this.hudManager.updateScore(this.gameState.score);
    this.hudManager.updateEnemiesRemaining(this.enemyManager.getEnemyCount());
  }

  private update(delta: number): void {
    if (!this.gameState.running || this.gameState.paused) return;

    // Input
    const inputDir = this.inputManager.getMovementInput();
    const wantsToSprint = this.inputManager.isKeyPressed('ShiftLeft') && inputDir.length() > 0;
    const wantsJump = this.player.jumpBufferTimer > 0;
    const canCutJump = !this.inputManager.isKeyPressed('Space') && this.player.canCutJump;

    // Update player
    this.player.update(delta, inputDir, wantsToSprint, wantsJump, canCutJump, this.arena.arenaObjects);
    this.player.updatePowerups(delta);

    // Update player rotation from mouse
    this.player.rotation.y -= this.inputManager.mouse.deltaX;
    this.player.rotation.x -= this.inputManager.mouse.deltaY;
    this.player.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.player.rotation.x));
    this.inputManager.resetMouseDelta();

    // Shooting
    if (this.inputManager.isMouseButtonPressed(0)) {
      const { direction, shotFired } = this.weaponSystem.shoot(
        this.camera,
        this.player.onGround,
        this.player.isSprinting,
        this.player.velocity
      );

      if (shotFired) {
        this.gameState.shotsFired++;
        this.handleShooting(direction);
      }
    }

    // Update weapon
    this.weaponSystem.update(
      delta,
      { x: this.inputManager.mouse.deltaX, y: this.inputManager.mouse.deltaY },
      this.player.isSprinting,
      this.player.headBobTime
    );

    // Update camera
    this.updateCamera(delta);

    // Update enemies
    this.enemyManager.update(delta, this.player.position, this.arena.navMeshObstacles, (enemy) => {
      this.handleEnemyShoot(enemy);
    });

    // Update particles and pickups
    this.particleSystem.update(delta);
    this.pickupSystem.update(this.player.position, this.player, (amount) =>
      this.weaponSystem.addAmmo(amount)
    );

    // Update arena
    this.arena.update(this.gameTime);
    
    // Update sky shader
    if (this.skyMaterial) {
      this.skyMaterial.uniforms.time.value = this.gameTime;
    }
    
    // Update point lights
    this.pointLights.forEach((pl) => {
      pl.light.intensity = pl.baseIntensity * (Math.sin(this.gameTime * 2 + pl.phase) * 0.3 + 0.7);
    });

    // Update HUD
    const horizSpeed = Math.sqrt(this.player.velocity.x ** 2 + this.player.velocity.z ** 2);
    const isMoving = horizSpeed > 0.5;
    this.hudManager.updateCrosshair(
      this.weaponSystem.getCurrentSpread(),
      isMoving,
      this.player.isSprinting,
      !this.player.onGround
    );
    if (this.player.powerup) {
      this.hudManager.showPowerup(
        `${this.player.powerup.toUpperCase()} (${Math.ceil(this.player.powerupTimer)}s)`,
        true
      );
    } else {
      this.hudManager.showPowerup('', false);
    }

    // Check wave completion
    if (this.enemyManager.getEnemyCount() === 0 && this.gameState.waveInProgress) {
      this.waveComplete();
    }

    this.updateHUD();
  }

  private handleShooting(direction: THREE.Vector3): void {
    const raycaster = new THREE.Raycaster(this.camera.position.clone(), direction);
    let hitEnemy = false;

    this.enemyManager.getEnemies().forEach((enemy) => {
      const headBox = new THREE.Box3().setFromObject(enemy.head);
      const bodyBox = new THREE.Box3().setFromObject(enemy.body);

      const hitHead = raycaster.ray.intersectsBox(headBox);
      const hitBody = !hitHead && raycaster.ray.intersectsBox(bodyBox);

      if (hitHead || hitBody) {
        hitEnemy = true;
        this.gameState.shotsHit++;

        const killed = this.enemyManager.damageEnemy(
          enemy,
          25 * this.player.damageMultiplier,
          hitHead
        );

        this.particleSystem.spawn(
          enemy.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)),
          0xef4444,
          5
        );

        if (killed) {
          this.gameState.kills++;
          this.gameState.score += enemy.score;
          this.particleSystem.spawn(
            enemy.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)),
            0x22c55e,
            15
          );
          this.enemyManager.removeEnemy(enemy);

          if (Math.random() < 0.3) {
            const types = ['health', 'ammo', 'armor'];
            this.pickupSystem.create(
              types[Math.floor(Math.random() * types.length)],
              enemy.mesh.position.clone()
            );
          }
        }

        this.hudManager.showHitmarker(killed);
        this.hudManager.showHitFeedback(killed, hitHead);
      }
    });

    if (!hitEnemy) {
      // Hit wall/floor
      const intersects = raycaster.intersectObjects(this.scene.children, true);
      if (intersects.length > 0) {
        this.particleSystem.spawn(intersects[0].point, 0x666666, 3);
      }
    }
  }

  private handleEnemyShoot(enemy: Enemy): void {
    if (enemy.muzzleFlash) {
      (enemy.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 1;
      setTimeout(() => {
        (enemy.muzzleFlash!.material as THREE.MeshBasicMaterial).opacity = 0;
      }, 50);
    }

    const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(enemy.mesh.quaternion);
    dir.x += (Math.random() - 0.5) * enemy.accuracy;
    dir.y += (Math.random() - 0.5) * enemy.accuracy;
    dir.normalize();

    const raycaster = new THREE.Raycaster(enemy.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), dir);
    const playerBox = new THREE.Box3(
      new THREE.Vector3(
        this.player.position.x - 0.4,
        this.player.position.y - PLAYER_CONFIG.height,
        this.player.position.z - 0.4
      ),
      new THREE.Vector3(this.player.position.x + 0.4, this.player.position.y, this.player.position.z + 0.4)
    );

    if (raycaster.ray.intersectsBox(playerBox)) {
      const isDead = this.player.takeDamage(enemy.damage);
      
      // Calculate angle from player to enemy for directional damage indicator
      const dx = enemy.mesh.position.x - this.player.position.x;
      const dz = enemy.mesh.position.z - this.player.position.z;
      const angleToEnemy = Math.atan2(dx, dz) * (180 / Math.PI);
      const playerYaw = this.player.rotation.y * (180 / Math.PI);
      const relativeAngle = angleToEnemy - playerYaw;
      
      this.hudManager.flashDamage(relativeAngle);
      this.weaponSystem.cameraShake.intensity = Math.max(this.weaponSystem.cameraShake.intensity, 0.04);

      if (isDead) {
        this.gameOver();
      }
    }
  }

  private updateCamera(delta: number): void {
    this.camera.position.copy(this.player.position);

    // Apply recoil and camera shake
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y =
      this.player.rotation.y +
      this.weaponSystem.recoilYaw * Math.PI / 180 +
      this.weaponSystem.microShake.x +
      this.weaponSystem.cameraShake.x;
    this.camera.rotation.x =
      this.player.rotation.x -
      this.weaponSystem.recoilPitch * Math.PI / 180 -
      this.weaponSystem.microShake.y +
      this.weaponSystem.cameraShake.y;

    // Camera FOV
    let targetFOV = CAMERA_CONFIG.baseFOV;
    if (this.weaponSystem.isZoomed) {
      targetFOV = 40;
    } else if (this.player.isSprinting) {
      targetFOV = CAMERA_CONFIG.sprintFOV;
    } else if (this.player.isJumping) {
      targetFOV = CAMERA_CONFIG.jumpFOV;
    } else if (!this.player.onGround) {
      targetFOV = CAMERA_CONFIG.landFOV; // Actually landFOV is usually for landing impact, but let's keep existing logic structure
    }

    targetFOV += this.weaponSystem.fovPunch;

    // If zoomed, we want instant or very fast transition
    const lerpSpeed = this.weaponSystem.isZoomed ? 50 : CAMERA_CONFIG.fovLerpSpeed;
    
    this.player.currentFOV +=
      (targetFOV - this.player.currentFOV) * lerpSpeed * delta;
    this.camera.fov = this.player.currentFOV;
    this.camera.updateProjectionMatrix();

    // Head bob
    const horizSpeed = Math.sqrt(this.player.velocity.x ** 2 + this.player.velocity.z ** 2);
    if (horizSpeed > 0.1 && this.player.onGround) {
      const bobMult = this.player.isSprinting ? 1.5 : 1;
      this.player.headBobTime += delta * CAMERA_CONFIG.bobFrequency * bobMult;
      const speedRatio = horizSpeed / PLAYER_CONFIG.walkSpeed;
      this.camera.position.y += Math.sin(this.player.headBobTime) * CAMERA_CONFIG.bobAmplitudeY * speedRatio;
      const sway = Math.cos(this.player.headBobTime * 0.5) * CAMERA_CONFIG.bobAmplitudeX * speedRatio;
      this.camera.position.x += sway * Math.cos(this.player.rotation.y);
      this.camera.position.z += sway * Math.sin(this.player.rotation.y);
    } else if (this.player.onGround) {
      this.player.headBobTime += delta * CAMERA_CONFIG.breathFrequency;
      this.camera.position.y += Math.sin(this.player.headBobTime) * CAMERA_CONFIG.breathAmplitude;
    }

    // Landing/jump effects
    if (this.player.landingImpact > 0) {
      this.camera.position.y -= this.player.landingImpact;
      this.player.landingImpact *= 0.8;
      if (this.player.landingImpact < 0.001) this.player.landingImpact = 0;
    }
    if (this.player.jumpLift > 0) {
      this.camera.position.y += this.player.jumpLift;
      this.player.jumpLift *= 0.85;
      if (this.player.jumpLift < 0.001) this.player.jumpLift = 0;
    }

    // Update post-processing
    this.postProcessing.setChromaAmount(this.weaponSystem.chromaIntensity);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.postProcessing.resize(window.innerWidth, window.innerHeight);
  }

  public start(): void {
    this.lastTime = performance.now();
    this.animate();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.gameTime += delta;

    this.update(delta);
    this.postProcessing.render();
  };
}
