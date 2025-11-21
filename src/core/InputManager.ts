import * as THREE from 'three';

export class InputManager {
  private keys: Record<string, boolean> = {};
  public mouse = {
    x: 0,
    y: 0,
    buttons: {} as Record<number, boolean>,
    deltaX: 0,
    deltaY: 0,
  };

  private mouseSensitivity: number;
  private onJumpCallback?: () => void;
  private onReloadCallback?: () => void;
  private onPauseCallback?: () => void;
  private onWeaponSelectCallback?: (index: number) => void;
  private onScrollCallback?: (delta: number) => void;

  constructor(mouseSensitivity: number) {
    this.mouseSensitivity = mouseSensitivity;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    document.addEventListener('wheel', (e) => this.handleWheel(e));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keys[e.code] = true;
    if (e.code === 'Space' && this.onJumpCallback) {
      this.onJumpCallback();
    }
    if (e.code === 'KeyR' && this.onReloadCallback) {
      this.onReloadCallback();
    }
    if (e.code === 'Escape' && this.onPauseCallback) {
      this.onPauseCallback();
    }
    
    // Weapon selection 1-9
    if (this.onWeaponSelectCallback) {
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        this.onWeaponSelectCallback(num - 1);
      }
    }
  }

  private handleWheel(e: WheelEvent): void {
    if (this.onScrollCallback) {
      this.onScrollCallback(Math.sign(e.deltaY));
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys[e.code] = false;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (document.pointerLockElement) {
      this.mouse.deltaX = e.movementX * this.mouseSensitivity;
      this.mouse.deltaY = e.movementY * this.mouseSensitivity;
      this.mouse.x += this.mouse.deltaX;
      this.mouse.y += this.mouse.deltaY;
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    this.mouse.buttons[e.button] = true;
  }

  private handleMouseUp(e: MouseEvent): void {
    this.mouse.buttons[e.button] = false;
  }

  public isKeyPressed(code: string): boolean {
    return !!this.keys[code];
  }

  public isMouseButtonPressed(button: number): boolean {
    return !!this.mouse.buttons[button];
  }

  public getMovementInput(): THREE.Vector3 {
    const inputDir = new THREE.Vector3();
    if (this.keys['KeyW']) inputDir.z -= 1;
    if (this.keys['KeyS']) inputDir.z += 1;
    if (this.keys['KeyA']) inputDir.x -= 1;
    if (this.keys['KeyD']) inputDir.x += 1;
    return inputDir;
  }

  public resetMouseDelta(): void {
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
  }

  public setJumpCallback(callback: () => void): void {
    this.onJumpCallback = callback;
  }

  public setReloadCallback(callback: () => void): void {
    this.onReloadCallback = callback;
  }

  public setPauseCallback(callback: () => void): void {
    this.onPauseCallback = callback;
  }

  public setWeaponSelectCallback(callback: (index: number) => void): void {
    this.onWeaponSelectCallback = callback;
  }

  public setScrollCallback(callback: (delta: number) => void): void {
    this.onScrollCallback = callback;
  }
}
