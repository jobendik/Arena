import * as THREE from 'three';
import { PLAYER_CONFIG } from '../config/gameConfig';

export class Player {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public rotation = { x: 0, y: 0 };
  public health: number;
  public armor: number;
  public stamina: number;
  public onGround = true;
  public isSprinting = false;
  public coyoteTimer = 0;
  public jumpBufferTimer = 0;
  public isJumping = false;
  public canCutJump = false;
  public prevVelocity: THREE.Vector3;
  public powerup: string | null = null;
  public powerupTimer = 0;
  public damageMultiplier = 1;
  public speedMultiplier = 1;
  public headBobTime = 0;
  public currentFOV: number;
  public landingImpact = 0;
  public jumpLift = 0;

  constructor() {
    this.position = new THREE.Vector3(0, PLAYER_CONFIG.height, 0);
    this.velocity = new THREE.Vector3();
    this.prevVelocity = new THREE.Vector3();
    this.health = PLAYER_CONFIG.maxHealth;
    this.armor = 0;
    this.stamina = PLAYER_CONFIG.maxStamina;
    this.currentFOV = 75; // Will be updated by camera config
  }

  public takeDamage(damage: number): boolean {
    let remaining = damage;

    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, remaining);
      this.armor -= absorbed;
      remaining -= absorbed;
    }

    if (remaining > 0) {
      this.health -= remaining;
    }

    return this.health <= 0;
  }

  public heal(amount: number): void {
    this.health = Math.min(PLAYER_CONFIG.maxHealth, this.health + amount);
  }

  public addArmor(amount: number): void {
    this.armor = Math.min(PLAYER_CONFIG.maxArmor, this.armor + amount);
  }

  public addAmmo(amount: number): number {
    return amount; // Will be handled by weapon system
  }

  public setPowerup(type: string, duration: number): void {
    this.powerup = type;
    this.powerupTimer = duration;

    switch (type) {
      case 'damage':
        this.damageMultiplier = 2;
        break;
      case 'speed':
        this.speedMultiplier = 1.5;
        break;
      case 'rapid':
        // Handled in weapon system
        break;
    }
  }

  public updatePowerups(delta: number): void {
    if (this.powerupTimer > 0) {
      this.powerupTimer -= delta;
      if (this.powerupTimer <= 0) {
        this.powerup = null;
        this.damageMultiplier = 1;
        this.speedMultiplier = 1;
      }
    }
  }

  public update(
    delta: number,
    inputDir: THREE.Vector3,
    wantsToSprint: boolean,
    wantsJump: boolean,
    canCutJump: boolean,
    arenaObjects: Array<{ mesh: THREE.Mesh; box: THREE.Box3 }>
  ): void {
    this.prevVelocity.copy(this.velocity);

    const hasInput = inputDir.length() > 0;
    if (hasInput) {
      inputDir.normalize();
      inputDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
    }

    // Sprint and stamina
    this.isSprinting = wantsToSprint && this.onGround && this.stamina > 0;
    if (this.isSprinting) {
      this.stamina -= PLAYER_CONFIG.staminaDrain * delta;
      if (this.stamina < 0) {
        this.stamina = 0;
        this.isSprinting = false;
      }
    } else {
      this.stamina = Math.min(PLAYER_CONFIG.maxStamina, this.stamina + PLAYER_CONFIG.staminaRegen * delta);
    }

    // Movement
    const baseSpeed = this.isSprinting ? PLAYER_CONFIG.sprintSpeed : PLAYER_CONFIG.walkSpeed;
    const targetSpeed = baseSpeed * this.speedMultiplier;

    const isGrounded = this.onGround;
    const accel = isGrounded ? PLAYER_CONFIG.groundAccel : PLAYER_CONFIG.airAccel;
    const decel = isGrounded ? PLAYER_CONFIG.groundDecel : PLAYER_CONFIG.airDecel;

    const horizVel = new THREE.Vector2(this.velocity.x, this.velocity.z);

    if (hasInput) {
      const targetVel = new THREE.Vector2(inputDir.x, inputDir.z).multiplyScalar(targetSpeed);
      horizVel.lerp(targetVel, accel * delta);
    } else {
      const decayFactor = Math.exp(-decel * delta);
      horizVel.multiplyScalar(decayFactor);
    }

    this.velocity.x = horizVel.x;
    this.velocity.z = horizVel.y;

    // Head bob time for weapon animation
    const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    this.headBobTime += delta * speed * 2;

    // Jump mechanics
    if (this.onGround) {
      this.coyoteTimer = PLAYER_CONFIG.coyoteTime;
      this.isJumping = false;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);

    const canJump = this.coyoteTimer > 0 || this.onGround;
    if (canJump && wantsJump) {
      this.velocity.y = PLAYER_CONFIG.jumpForce;
      this.isJumping = true;
      this.canCutJump = true;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    }

    if (canCutJump && this.canCutJump && this.velocity.y > 0) {
      this.velocity.y *= PLAYER_CONFIG.jumpCutMultiplier;
      this.canCutJump = false;
    }

    // Gravity
    this.velocity.y -= PLAYER_CONFIG.gravity * delta;

    // Move and collision
    const newPos = this.position.clone().add(this.velocity.clone().multiplyScalar(delta));

    // Arena bounds
    const bounds = 30 - 0.5; // Half of arena size
    if (newPos.x < -bounds) { newPos.x = -bounds; this.velocity.x = 0; }
    if (newPos.x > bounds) { newPos.x = bounds; this.velocity.x = 0; }
    if (newPos.z < -bounds) { newPos.z = -bounds; this.velocity.z = 0; }
    if (newPos.z > bounds) { newPos.z = bounds; this.velocity.z = 0; }

    // Collision with arena objects
    const playerRadius = 0.4;
    const stepHeight = PLAYER_CONFIG.stepHeight;
    this.onGround = false;

    arenaObjects.forEach((obj) => {
      const box = obj.box.clone();
      const playerBox = new THREE.Box3(
        new THREE.Vector3(newPos.x - playerRadius, newPos.y - PLAYER_CONFIG.height, newPos.z - playerRadius),
        new THREE.Vector3(newPos.x + playerRadius, newPos.y, newPos.z + playerRadius)
      );

      if (playerBox.intersectsBox(box)) {
        const heightDiff = box.max.y - (newPos.y - PLAYER_CONFIG.height);
        if (heightDiff > 0 && heightDiff < stepHeight && this.velocity.y <= 0) {
          newPos.y = box.max.y + PLAYER_CONFIG.height;
          this.velocity.y = 0;
          this.onGround = true;
        } else if (playerBox.max.y > box.max.y && this.velocity.y < 0) {
          newPos.y = box.max.y + PLAYER_CONFIG.height;
          this.velocity.y = 0;
          this.onGround = true;
        } else if (playerBox.min.y < box.min.y && this.velocity.y > 0) {
          newPos.y = box.min.y + PLAYER_CONFIG.height;
          this.velocity.y = 0;
        } else {
          const overlapX = Math.min(playerBox.max.x - box.min.x, box.max.x - playerBox.min.x);
          const overlapZ = Math.min(playerBox.max.z - box.min.z, box.max.z - playerBox.min.z);

          if (overlapX < overlapZ) {
            newPos.x += newPos.x < box.min.x ? -overlapX : overlapX;
            this.velocity.x = 0;
          } else {
            newPos.z += newPos.z < box.min.z ? -overlapZ : overlapZ;
            this.velocity.z = 0;
          }
        }
      }
    });

    // Ground collision
    if (newPos.y <= PLAYER_CONFIG.height) {
      const landingSpeed = Math.abs(this.prevVelocity.y);
      if (landingSpeed > 5) {
        this.landingImpact = Math.min(landingSpeed / 20, 1);
      }
      newPos.y = PLAYER_CONFIG.height;
      this.velocity.y = 0;
      this.onGround = true;
    }

    this.position.copy(newPos);
  }

  public reset(): void {
    this.position.set(0, PLAYER_CONFIG.height, 0);
    this.velocity.set(0, 0, 0);
    this.health = PLAYER_CONFIG.maxHealth;
    this.armor = 0;
    this.stamina = PLAYER_CONFIG.maxStamina;
    this.powerup = null;
    this.powerupTimer = 0;
    this.damageMultiplier = 1;
    this.speedMultiplier = 1;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
  }
}
