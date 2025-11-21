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

  public flashDamage(): void {
    this.damageOverlay.style.opacity = '0.5';
    setTimeout(() => {
      this.damageOverlay.style.opacity = '0';
    }, 100);
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

  public showMessage(text: string, duration = 2000): void {
    const display = document.getElementById('message-display')!;
    display.textContent = text;
    display.style.opacity = '1';
    setTimeout(() => {
      display.style.opacity = '0';
    }, duration);
  }

  public updateCrosshair(spread: number): void {
    const size = spread * 500;
    const gap = 4,
      length = 8,
      thickness = 2;

    const set = (id: string, w: number, h: number, l: number, t: number) => {
      const el = document.getElementById(id);
      if (el) {
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.left = `${l}px`;
        el.style.top = `${t}px`;
      }
    };

    set('cross-top', thickness, length, -thickness / 2, -size - length - gap);
    set('cross-bottom', thickness, length, -thickness / 2, size + gap);
    set('cross-left', length, thickness, -size - length - gap, -thickness / 2);
    set('cross-right', length, thickness, size + gap, -thickness / 2);
  }

  public showGameOver(stats: {
    wave: number;
    kills: number;
    accuracy: number;
    time: string;
    score: number;
  }): void {
    document.getElementById('final-waves')!.textContent = stats.wave.toString();
    document.getElementById('final-kills')!.textContent = stats.kills.toString();
    document.getElementById('final-accuracy')!.textContent = stats.accuracy.toString();
    document.getElementById('final-time')!.textContent = stats.time;
    document.getElementById('final-score')!.textContent = stats.score.toString();
    (document.getElementById('game-over')! as HTMLElement).style.display = 'flex';
  }

  public hideGameOver(): void {
    (document.getElementById('game-over')! as HTMLElement).style.display = 'none';
  }

  public showPauseMenu(show: boolean): void {
    (document.getElementById('pause-menu')! as HTMLElement).style.display = show ? 'flex' : 'none';
  }

  public hideStartScreen(): void {
    (document.getElementById('start-screen')! as HTMLElement).style.display = 'none';
  }
}
