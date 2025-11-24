import { KillfeedManager } from './KillfeedManager';

export class HUDManager {
  private healthBarMask: HTMLElement;
  private healthText: HTMLElement;
  private healthWrapper: HTMLElement;
  private armorBarMask: HTMLElement;
  private armorText: HTMLElement;
  private staminaBarMask: HTMLElement;
  private staminaText: HTMLElement;
  private weaponName: HTMLElement;
  private ammoDisplay: HTMLElement;
  private waveDisplay: HTMLElement;
  private scoreDisplay: HTMLElement;
  private enemiesDisplay: HTMLElement;
  private reloadIndicator: HTMLElement;
  private powerupIndicator: HTMLElement;
  private damageOverlay: HTMLElement;
  private sniperScope: HTMLElement;
  private crosshair: HTMLElement;
  private crosshairTop: HTMLElement;
  private crosshairBottom: HTMLElement;
  private crosshairLeft: HTMLElement;
  private crosshairRight: HTMLElement;
  private killIcon: HTMLElement;
  private headshotIcon: HTMLElement;
  private multiKillDisplay: HTMLElement;
  private streakDisplay: HTMLElement;
  private multiKillTimeout: number | null = null;
  private streakTimeout: number | null = null;

  public killfeed: KillfeedManager;

  // Vignette system
  private vignetteImpactFlash: HTMLElement;
  private vignetteDamagePulse: HTMLElement;
  private vignetteCritical: HTMLElement;
  private impactFlashTimeout: number | null = null;
  private damagePulseTimeout: number | null = null;
  private damageOverlayTimeout: number | null = null;

  constructor() {
    this.killfeed = new KillfeedManager();
    this.healthBarMask = document.getElementById('health-bar-mask')!;
    this.healthText = document.getElementById('health-text-value')!;
    this.healthWrapper = document.getElementById('health-wrapper')!;
    this.armorBarMask = document.getElementById('armor-bar-mask')!;
    this.armorText = document.getElementById('armor-text-value')!;
    this.staminaBarMask = document.getElementById('stamina-bar-mask')!;
    this.staminaText = document.getElementById('stamina-text-value')!;
    this.weaponName = document.getElementById('weapon-name')!;
    this.ammoDisplay = document.getElementById('ammo-display')!;
    this.waveDisplay = document.getElementById('wave-display')!;
    this.scoreDisplay = document.getElementById('score-display')!;
    this.enemiesDisplay = document.getElementById('enemies-remaining')!;
    this.reloadIndicator = document.getElementById('reload-indicator')!;
    this.powerupIndicator = document.getElementById('powerup-indicator')!;
    this.damageOverlay = document.getElementById('damage-overlay')!;
    this.sniperScope = document.getElementById('sniper-scope')!;
    this.crosshair = document.getElementById('crosshair')!;
    this.crosshairTop = document.getElementById('cross-top')!;
    this.crosshairBottom = document.getElementById('cross-bottom')!;
    this.crosshairLeft = document.getElementById('cross-left')!;
    this.crosshairRight = document.getElementById('cross-right')!;
    this.killIcon = document.getElementById('kill-icon')!;
    this.headshotIcon = document.getElementById('headshot-icon')!;
    this.multiKillDisplay = document.getElementById('multikill-display')!;
    this.streakDisplay = document.getElementById('streak-display')!;

    // Vignette system
    this.vignetteImpactFlash = document.getElementById('vignette-impact-flash')!;
    this.vignetteDamagePulse = document.getElementById('vignette-damage-pulse')!;
    this.vignetteCritical = document.getElementById('vignette-critical')!;
  }

  public updateHealth(health: number, maxHealth: number): void {
    const pct = Math.max(0, (health / maxHealth) * 100);
    this.healthBarMask.style.width = `${pct}%`;
    this.healthText.textContent = Math.ceil(health).toString();

    // Update critical vignette based on HP
    this.updateCriticalVignette(pct);

    // Low health bar animation
    if (pct < 25) {
      this.healthWrapper.classList.add('critical');
    } else {
      this.healthWrapper.classList.remove('critical');
    }
  }

  private updateCriticalVignette(healthPercent: number): void {
    if (healthPercent < 15) {
      // Very critical - intense pulsing
      this.vignetteCritical.style.opacity = '1';
      this.vignetteCritical.classList.add('pulsing');
    } else if (healthPercent < 30) {
      // Critical - strong visible vignette with pulsing
      this.vignetteCritical.style.opacity = '0.85';
      this.vignetteCritical.classList.add('pulsing');
    } else if (healthPercent < 50) {
      // Moderate damage - noticeable vignette
      this.vignetteCritical.style.opacity = '0.55';
      this.vignetteCritical.classList.remove('pulsing');
    } else if (healthPercent < 75) {
      // Light damage - subtle warning
      this.vignetteCritical.style.opacity = '0.25';
      this.vignetteCritical.classList.remove('pulsing');
    } else {
      // Healthy - fade out
      this.vignetteCritical.style.opacity = '0';
      this.vignetteCritical.classList.remove('pulsing');
    }
  }

  public updateArmor(armor: number, maxArmor: number): void {
    const pct = Math.max(0, (armor / maxArmor) * 100);
    this.armorBarMask.style.width = `${pct}%`;
    this.armorText.textContent = Math.ceil(armor).toString();
  }

  public updateStamina(stamina: number, maxStamina: number): void {
    const pct = Math.max(0, (stamina / maxStamina) * 100);
    this.staminaBarMask.style.width = `${pct}%`;
    this.staminaText.textContent = Math.ceil(stamina).toString();
  }

  public updateWeaponName(name: string): void {
    this.weaponName.textContent = name;
  }

  public updateAmmo(current: number, reserve: number): void {
    this.ammoDisplay.textContent = `${current} / ${reserve}`;
    this.ammoDisplay.className = current === 0 ? 'empty' : current <= 5 ? 'low' : '';
  }

  private currentWave: number = 0;

  public updateWave(wave: number): void {
    // Only show animation when wave actually changes
    if (wave === this.currentWave) return;
    this.currentWave = wave;

    this.waveDisplay.textContent = `WAVE ${wave}`;

    // Trigger wave start animation
    this.waveDisplay.classList.remove('active', 'wave-start');

    // Use requestAnimationFrame to restart animation without blocking
    requestAnimationFrame(() => {
      this.waveDisplay.classList.add('wave-start');
    });

    // After animation, settle into active state
    setTimeout(() => {
      this.waveDisplay.classList.remove('wave-start');
      this.waveDisplay.classList.add('active');
    }, 1500); // Match animation duration (1.5s from CSS)
  }

  public updateScore(score: number): void {
    const currentScore = parseInt(this.scoreDisplay.textContent || '0');
    if (score > currentScore) {
      this.scoreDisplay.classList.remove('pop');

      // Use requestAnimationFrame to restart animation without blocking
      requestAnimationFrame(() => {
        this.scoreDisplay.classList.add('pop');
      });
    }
    this.scoreDisplay.textContent = score.toString();
  }

  public updateEnemiesRemaining(count: number): void {
    this.enemiesDisplay.textContent = `Enemies: ${count}`;
  }

  public showReloading(isReloading: boolean): void {
    if (isReloading) {
      this.reloadIndicator.style.opacity = '1';
      this.reloadIndicator.classList.add('active');
    } else {
      this.reloadIndicator.style.opacity = '0';
      this.reloadIndicator.classList.remove('active');
    }
  }

  public showPowerup(text: string, show: boolean): void {
    this.powerupIndicator.textContent = text;
    this.powerupIndicator.style.opacity = show ? '1' : '0';
  }

  public flashDamage(directionAngle?: number): void {
    // Debounce to prevent duplicate visual indicators
    if (this.damageOverlayTimeout !== null) {
      // Already showing damage indicator, skip this call
      return;
    }

    this.damageOverlay.style.opacity = '1';
    // RED indicator - drop-shadow creates a red glow effect
    this.damageOverlay.style.filter = 'drop-shadow(0 0 8px red) drop-shadow(0 0 15px red)';

    if (directionAngle !== undefined) {
      // Rotate the damage indicator to point towards the source of damage
      // The image points down by default, so we adjust accordingly
      this.damageOverlay.style.transform = `translate(-50%, -50%) rotate(${(directionAngle + 180) % 360}deg)`;
    } else {
      // Generic damage (no specific direction)
      this.damageOverlay.style.transform = 'translate(-50%, -50%)';
    }

    this.damageOverlayTimeout = setTimeout(() => {
      this.damageOverlay.style.opacity = '0';
      this.damageOverlay.style.filter = 'none';
      this.damageOverlayTimeout = null;
    }, 300) as unknown as number;
  }

  public showNearMissIndicator(directionAngle: number): void {
    // Clear any existing timeout to prevent conflicts
    if (this.damageOverlayTimeout !== null) {
      clearTimeout(this.damageOverlayTimeout);
    }

    // WHITE indicator for near misses - bright white glow
    this.damageOverlay.style.opacity = '0.5'; // Less intense than actual hit
    this.damageOverlay.style.filter = 'drop-shadow(0 0 8px white) drop-shadow(0 0 15px white)';

    // Rotate to show direction of incoming fire (flip front/back only)
    this.damageOverlay.style.transform = `translate(-50%, -50%) rotate(${(directionAngle + 180) % 360}deg)`;

    this.damageOverlayTimeout = setTimeout(() => {
      this.damageOverlay.style.opacity = '0';
      this.damageOverlay.style.filter = 'none'; // Reset filter
      this.damageOverlayTimeout = null;
    }, 150) as unknown as number; // Shorter duration than actual hit
  }

  public showDamageVignette(damageAmount: number, maxHealth: number, directionAngle?: number): void {
    // Calculate damage intensity (0-1)
    const damagePercent = (damageAmount / maxHealth) * 100;
    const intensity = Math.min(damagePercent / 50, 1.0); // Cap at 50% of max health for full intensity

    // LAYER 1: Impact Flash (instant, sharp)
    if (this.impactFlashTimeout) clearTimeout(this.impactFlashTimeout);
    this.vignetteImpactFlash.style.opacity = Math.min(0.9, 0.5 + intensity * 0.7).toString();

    // Optional directional impact (stronger on the side of the hit)
    if (directionAngle !== undefined) {
      const radians = (directionAngle * Math.PI) / 180;
      const x = Math.sin(radians) * 10;
      const y = -Math.cos(radians) * 10;
      this.vignetteImpactFlash.style.transform = `translate(${x}%, ${y}%)`;
    } else {
      this.vignetteImpactFlash.style.transform = 'translate(0, 0)';
    }

    this.impactFlashTimeout = window.setTimeout(() => {
      this.vignetteImpactFlash.style.opacity = '0';
      this.vignetteImpactFlash.style.transform = 'translate(0, 0)';
    }, 120);

    // LAYER 2: Damage Pulse (expanding glow)
    if (this.damagePulseTimeout) clearTimeout(this.damagePulseTimeout);

    // Color based on damage severity
    const pulseColor = damagePercent > 30
      ? 'rgba(255, 0, 51, INTENSITY)' // Heavy hit - bright red
      : 'rgba(255, 165, 0, INTENSITY)'; // Light hit - orange

    const pulseIntensity = Math.max(0.6, intensity * 1.2); // Much more visible
    this.vignetteDamagePulse.style.background = `
      radial-gradient(
        ellipse at center,
        transparent 30%,
        ${pulseColor.replace('INTENSITY', (pulseIntensity * 0.3).toString())} 45%,
        ${pulseColor.replace('INTENSITY', (pulseIntensity * 0.7).toString())} 60%,
        ${pulseColor.replace('INTENSITY', (pulseIntensity * 0.95).toString())} 75%,
        ${pulseColor.replace('INTENSITY', (pulseIntensity * 0.8).toString())} 90%
      )
    `;

    this.vignetteDamagePulse.style.opacity = Math.min(pulseIntensity, 0.95).toString();
    this.vignetteDamagePulse.classList.add('pulsing');

    // Expand pulse
    setTimeout(() => {
      this.vignetteDamagePulse.classList.remove('pulsing');
    }, 100);

    this.damagePulseTimeout = window.setTimeout(() => {
      this.vignetteDamagePulse.style.opacity = '0';
    }, 400);

    // Show directional damage arrow (red for hits)
    if (directionAngle !== undefined) {
      this.flashDamage(directionAngle);
    }
  }

  public showHitmarker(isKill: boolean): void {
    const hitmarker = document.getElementById('hitmarker')!;
    const img = hitmarker.querySelector('img');

    hitmarker.style.opacity = '1';
    hitmarker.style.transform = isKill
      ? 'translate(-50%, -50%) scale(1.5)'
      : 'translate(-50%, -50%) scale(1.2)';

    if (img) {
      img.style.filter = isKill
        ? 'drop-shadow(0 0 5px #ef4444) sepia(1) saturate(1000%) hue-rotate(-50deg)' // Red for kill
        : 'drop-shadow(0 0 2px #ffffff)'; // White for hit
    }

    setTimeout(() => {
      hitmarker.style.opacity = '0';
      hitmarker.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 100);
  }

  public toggleScope(show: boolean): void {
    this.sniperScope.style.opacity = show ? '1' : '0';
    this.crosshair.style.opacity = show ? '0' : '1';
  }

  public showMessage(message: string, duration: number = 2000): void {
    const msgDisplay = document.getElementById('message-display');
    if (msgDisplay) {
      msgDisplay.textContent = message;
      msgDisplay.style.opacity = '1';
      setTimeout(() => {
        msgDisplay.style.opacity = '0';
      }, duration);
    }
  }

  public showGameOver(stats: { wave: number; kills: number; accuracy: number; time: string; score: number }): void {
    const gameOver = document.getElementById('game-over');
    if (gameOver) {
      gameOver.style.display = 'flex';
      const finalScore = document.getElementById('final-score');
      const finalWaves = document.getElementById('final-waves');
      const finalKills = document.getElementById('final-kills');
      const finalAccuracy = document.getElementById('final-accuracy');
      const finalTime = document.getElementById('final-time');

      if (finalScore) finalScore.textContent = stats.score.toString();
      if (finalWaves) finalWaves.textContent = stats.wave.toString();
      if (finalKills) finalKills.textContent = stats.kills.toString();
      if (finalAccuracy) finalAccuracy.textContent = stats.accuracy.toString();
      if (finalTime) finalTime.textContent = stats.time;
    }
  }

  public hideGameOver(): void {
    const gameOver = document.getElementById('game-over');
    if (gameOver) {
      gameOver.style.display = 'none';
    }
  }

  public updateCrosshair(spread: number, isMoving: boolean = false, isSprinting: boolean = false, isAirborne: boolean = false): void {
    // Map spread directly to crosshair gap - AAA FPS standard
    // Base gap: 8px for tight feel, spread multiplier: 10000 for proper visibility
    // CS:GO/Valorant style: minimal base, reactive to shooting
    let gap = 8 + spread * 10000;

    // Movement penalties (visual representation of accuracy loss)
    if (isAirborne) {
      gap *= 1.8; // Significant penalty when jumping
    } else if (isSprinting) {
      gap *= 1.4; // Running reduces accuracy
    } else if (isMoving) {
      gap *= 1.15; // Walking slightly reduces accuracy
    }

    // Clamp maximum gap to prevent screen-filling crosshair (AAA games cap at ~50-60px)
    gap = Math.min(gap, 55);

    // Apply the gap to each line
    this.crosshairTop.style.transform = `translateX(-50%) translateY(-${gap}px)`;
    this.crosshairBottom.style.transform = `translateX(-50%) translateY(${gap}px)`;
    this.crosshairLeft.style.transform = `translateY(-50%) translateX(-${gap}px)`;
    this.crosshairRight.style.transform = `translateY(-50%) translateX(${gap}px)`;
  }

  public showHitFeedback(isKill: boolean, isHeadshot: boolean): void {
    // Remove any existing feedback classes
    this.crosshair.classList.remove('hit', 'headshot', 'kill');

    // Add appropriate feedback class
    if (isKill) {
      this.crosshair.classList.add('kill');
    } else if (isHeadshot) {
      this.crosshair.classList.add('headshot');
    } else {
      this.crosshair.classList.add('hit');
    }

    // Remove the class after animation
    setTimeout(() => {
      this.crosshair.classList.remove('hit', 'headshot', 'kill');
    }, 100);
  }

  public showPauseMenu(show: boolean): void {
    (document.getElementById('pause-menu')! as HTMLElement).style.display = show ? 'flex' : 'none';
  }

  public hideStartScreen(): void {
    (document.getElementById('start-screen')! as HTMLElement).style.display = 'none';
  }

  public showKillIcon(): void {
    this.killIcon.style.opacity = '1';
    this.killIcon.style.transform = 'translate(-50%, -50%) scale(1.2)';

    setTimeout(() => {
      this.killIcon.style.transform = 'translate(-50%, -50%) scale(1.0)';
    }, 50);

    setTimeout(() => {
      this.killIcon.style.opacity = '0';
    }, 500);
  }

  public showHeadshotIcon(): void {
    this.headshotIcon.style.opacity = '1';
    this.headshotIcon.style.transform = 'translate(-50%, -50%) scale(1.2)';

    setTimeout(() => {
      this.headshotIcon.style.transform = 'translate(-50%, -50%) scale(1.0)';
    }, 50);

    setTimeout(() => {
      this.headshotIcon.style.opacity = '0';
    }, 500);
  }

  public showMultiKill(count: number): void {
    let text = '';
    let tierClass = '';

    switch (count) {
      case 2: text = 'DOUBLE KILL'; tierClass = 'impact-tier-1'; break;
      case 3: text = 'TRIPLE KILL'; tierClass = 'impact-tier-2'; break;
      case 4: text = 'QUAD KILL'; tierClass = 'impact-tier-3'; break;
      case 5: text = 'PENTA KILL'; tierClass = 'impact-tier-3'; break;
      default: text = 'GODLIKE'; tierClass = 'impact-tier-4'; break;
    }

    this.multiKillDisplay.textContent = text;
    this.multiKillDisplay.className = ''; // Clear classes
    this.multiKillDisplay.style.opacity = '1';

    // Use requestAnimationFrame to restart animation without blocking
    requestAnimationFrame(() => {
      this.multiKillDisplay.classList.add('impact-text', tierClass, 'shake');
    });

    if (this.multiKillTimeout) clearTimeout(this.multiKillTimeout);
    this.multiKillTimeout = window.setTimeout(() => {
      this.multiKillDisplay.style.opacity = '0';
      this.multiKillDisplay.className = '';
    }, 3000);
  }

  public showHitStreak(count: number): void {
    if (count < 3) return; // Show from 3 hits

    this.streakDisplay.textContent = `${count} HIT STREAK`;
    this.streakDisplay.className = '';
    this.streakDisplay.style.opacity = '1';

    // Determine tier based on streak
    let tierClass = 'impact-tier-1';
    if (count >= 10) tierClass = 'impact-tier-4';
    else if (count >= 7) tierClass = 'impact-tier-3';
    else if (count >= 5) tierClass = 'impact-tier-2';

    // Use requestAnimationFrame to restart animation without blocking
    requestAnimationFrame(() => {
      this.streakDisplay.classList.add('impact-text', tierClass);
      if (count >= 5) this.streakDisplay.classList.add('shake');
    });

    if (this.streakTimeout) clearTimeout(this.streakTimeout);
    this.streakTimeout = window.setTimeout(() => {
      this.streakDisplay.style.opacity = '0';
      this.streakDisplay.className = '';
    }, 2000);
  }

  public addKillFeed(killer: string, victim: string, weapon: string, isHeadshot: boolean, isMultiKill: boolean = false): void {
    this.killfeed.addKill(killer, victim, weapon, isHeadshot, isMultiKill);
  }

  public reset(): void {
    // Reset wave tracker so first wave animation shows
    this.currentWave = 0;
  }
}
