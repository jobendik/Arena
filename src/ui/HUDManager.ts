export class HUDManager {
  private healthBar: HTMLElement;
  private armorBar: HTMLElement;
  private staminaBar: HTMLElement;
  private ammoDisplay: HTMLElement;
  private waveDisplay: HTMLElement;
  private scoreDisplay: HTMLElement;
  private enemiesDisplay: HTMLElement;
  private reloadIndicator: HTMLElement;
  private powerupIndicator: HTMLElement;
  private lowHealthOverlay: HTMLElement;
  private damageOverlay: HTMLElement;
  private sniperScope: HTMLElement;
  private crosshair: HTMLElement;
  private crosshairTop: HTMLElement;
  private crosshairBottom: HTMLElement;
  private crosshairLeft: HTMLElement;
  private crosshairRight: HTMLElement;

  constructor() {
    this.healthBar = document.getElementById('health-bar')!;
    this.armorBar = document.getElementById('armor-bar')!;
    this.staminaBar = document.getElementById('stamina-bar')!;
    this.ammoDisplay = document.getElementById('ammo-display')!;
    this.waveDisplay = document.getElementById('wave-display')!;
    this.scoreDisplay = document.getElementById('score-display')!;
    this.enemiesDisplay = document.getElementById('enemies-remaining')!;
    this.reloadIndicator = document.getElementById('reload-indicator')!;
    this.powerupIndicator = document.getElementById('powerup-indicator')!;
    this.lowHealthOverlay = document.getElementById('low-health-overlay')!;
    this.damageOverlay = document.getElementById('damage-overlay')!;
    this.sniperScope = document.getElementById('sniper-scope')!;
    this.crosshair = document.getElementById('crosshair')!;
    this.crosshairTop = document.getElementById('cross-top')!;
    this.crosshairBottom = document.getElementById('cross-bottom')!;
    this.crosshairLeft = document.getElementById('cross-left')!;
    this.crosshairRight = document.getElementById('cross-right')!;
  }

  public updateHealth(health: number, maxHealth: number): void {
    const pct = (health / maxHealth) * 100;
    this.healthBar.style.width = `${pct}%`;
    this.healthBar.style.background =
      pct > 60
        ? 'linear-gradient(90deg, #22c55e, #4ade80)'
        : pct > 30
        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
        : 'linear-gradient(90deg, #ef4444, #f87171)';
    this.lowHealthOverlay.style.opacity = pct < 30 ? '0.5' : '0';
  }

  public updateArmor(armor: number, maxArmor: number): void {
    this.armorBar.style.width = `${(armor / maxArmor) * 100}%`;
  }

  public updateStamina(stamina: number, maxStamina: number): void {
    this.staminaBar.style.width = `${(stamina / maxStamina) * 100}%`;
  }

  public updateAmmo(current: number, reserve: number): void {
    this.ammoDisplay.textContent = `${current} / ${reserve}`;
    this.ammoDisplay.className = current === 0 ? 'empty' : current <= 5 ? 'low' : '';
  }

  public updateWave(wave: number): void {
    this.waveDisplay.textContent = `WAVE ${wave}`;
  }

  public updateScore(score: number): void {
    const currentScore = parseInt(this.scoreDisplay.textContent || '0');
    if (score > currentScore) {
      this.scoreDisplay.classList.add('pop');
      setTimeout(() => this.scoreDisplay.classList.remove('pop'), 100);
    }
    this.scoreDisplay.textContent = score.toString();
  }

  public updateEnemiesRemaining(count: number): void {
    this.enemiesDisplay.textContent = `Enemies: ${count}`;
  }

  public showReloading(show: boolean): void {
    this.reloadIndicator.style.opacity = show ? '1' : '0';
  }

  public showPowerup(text: string, show: boolean): void {
    this.powerupIndicator.textContent = text;
    this.powerupIndicator.style.opacity = show ? '1' : '0';
  }

  public flashDamage(directionAngle?: number): void {
    this.damageOverlay.style.opacity = '0.8';
    
    if (directionAngle !== undefined) {
      // Rotate the damage indicator to point towards the source of damage
      // The image points down by default, so we adjust accordingly
      this.damageOverlay.style.transform = `translate(-50%, -50%) rotate(${directionAngle}deg)`;
    } else {
      // Generic damage (no specific direction)
      this.damageOverlay.style.transform = 'translate(-50%, -50%)';
    }
    
    setTimeout(() => {
      this.damageOverlay.style.opacity = '0';
    }, 200);
  }

  public showHitmarker(isKill: boolean): void {
    const hitmarker = document.getElementById('hitmarker')!;
    hitmarker.style.opacity = '1';
    hitmarker.style.transform = isKill
      ? 'translate(-50%, -50%) scale(1.5)'
      : 'translate(-50%, -50%) scale(1)';

    const lines = hitmarker.querySelectorAll('line');
    lines.forEach((line) => {
      line.setAttribute('stroke', isKill ? '#ef4444' : '#ffffff');
    });

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
}
