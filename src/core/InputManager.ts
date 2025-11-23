import * as THREE from 'three';

export enum GameAction {
  MoveForward = 'MoveForward',
  MoveBackward = 'MoveBackward',
  MoveLeft = 'MoveLeft',
  MoveRight = 'MoveRight',
  Jump = 'Jump',
  Sprint = 'Sprint',
  Crouch = 'Crouch',
  Reload = 'Reload',
  Interact = 'Interact',
  Fire = 'Fire',
  Aim = 'Aim',
  NextWeapon = 'NextWeapon',
  PrevWeapon = 'PrevWeapon',
  Weapon1 = 'Weapon1',
  Weapon2 = 'Weapon2',
  Weapon3 = 'Weapon3',
  Weapon4 = 'Weapon4',
  Weapon5 = 'Weapon5',
  Weapon6 = 'Weapon6',
  Weapon7 = 'Weapon7',
  Weapon8 = 'Weapon8',
  Weapon9 = 'Weapon9',
  Pause = 'Pause',
  Scoreboard = 'Scoreboard',
  Grenade = 'Grenade',
  LastWeapon = 'LastWeapon',
}

export class InputManager {
  private keys: Record<string, boolean> = {};
  public mouse = {
    x: 0,
    y: 0,
    buttons: {} as Record<number, boolean>,
    deltaX: 0,
    deltaY: 0,
  };

  private bindings: Record<GameAction, string[]> = {
    [GameAction.MoveForward]: ['KeyW', 'ArrowUp'],
    [GameAction.MoveBackward]: ['KeyS', 'ArrowDown'],
    [GameAction.MoveLeft]: ['KeyA', 'ArrowLeft'],
    [GameAction.MoveRight]: ['KeyD', 'ArrowRight'],
    [GameAction.Jump]: ['Space'],
    [GameAction.Sprint]: ['ShiftLeft', 'ShiftRight'],
    [GameAction.Crouch]: ['KeyC', 'ControlLeft'],
    [GameAction.Reload]: ['KeyR'],
    [GameAction.Interact]: ['KeyE'],
    [GameAction.Grenade]: ['KeyG'],
    [GameAction.Fire]: ['Mouse0'],
    [GameAction.Aim]: ['Mouse1'],
    [GameAction.NextWeapon]: ['WheelUp'],
    [GameAction.PrevWeapon]: ['WheelDown'],
    [GameAction.Weapon1]: ['Digit1'],
    [GameAction.Weapon2]: ['Digit2'],
    [GameAction.Weapon3]: ['Digit3'],
    [GameAction.Weapon4]: ['Digit4'],
    [GameAction.Weapon5]: ['Digit5'],
    [GameAction.Weapon6]: ['Digit6'],
    [GameAction.Weapon7]: ['Digit7'],
    [GameAction.Weapon8]: ['Digit8'],
    [GameAction.Weapon9]: ['Digit9'],
    [GameAction.Pause]: ['Escape'],
    [GameAction.Scoreboard]: ['Tab'],
    [GameAction.LastWeapon]: ['KeyQ'],
  };

  private mouseSensitivity: number;
  private onJumpCallback?: () => void;
  private onReloadCallback?: () => void;
  private onInteractCallback?: () => void;
  private onZoomCallback?: (zoomed: boolean) => void;
  private onPauseCallback?: () => void;
  private onWeaponSelectCallback?: (index: number) => void;
  private onNextWeaponCallback?: () => void;
  private onPrevWeaponCallback?: () => void;
  private onScrollCallback?: (direction: number) => void;
  private onGrenadeCallback?: () => void;
  private onLastWeaponCallback?: () => void;

  constructor(mouseSensitivity: number = 0.002) {
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

  private isBound(action: GameAction, input: string): boolean {
    const bindings = this.bindings[action];
    return bindings ? bindings.includes(input) : false;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keys[e.code] = true;
    
    if (this.isBound(GameAction.Jump, e.code) && this.onJumpCallback) {
      this.onJumpCallback();
    }
    if (this.isBound(GameAction.Reload, e.code) && this.onReloadCallback) {
      this.onReloadCallback();
    }
    if (this.isBound(GameAction.Pause, e.code) && this.onPauseCallback) {
      this.onPauseCallback();
    }
    if (this.isBound(GameAction.Interact, e.code) && this.onInteractCallback) {
      this.onInteractCallback();
    }
    if (this.isBound(GameAction.Grenade, e.code) && this.onGrenadeCallback) {
      this.onGrenadeCallback();
    }
    
    if (this.isBound(GameAction.LastWeapon, e.code) && this.onLastWeaponCallback) {
      this.onLastWeaponCallback();
    }

    // Weapon selection 1-9
    if (this.onWeaponSelectCallback) {
      for (let i = 1; i <= 9; i++) {
        // Cast to any to access dynamic property or use a map if preferred, 
        // but GameAction has Weapon1...Weapon9
        const actionName = `Weapon${i}` as keyof typeof GameAction;
        // We need to get the enum value. 
        // Since GameAction is a string enum (or number?), let's check definition.
        // It was defined as string enum in previous turn.
        const action = GameAction[actionName];
        if (this.isBound(action, e.code)) {
          this.onWeaponSelectCallback(i - 1);
          break;
        }
      }
    }

    if (this.isBound(GameAction.NextWeapon, e.code) && this.onNextWeaponCallback) {
      this.onNextWeaponCallback();
    }
    if (this.isBound(GameAction.PrevWeapon, e.code) && this.onPrevWeaponCallback) {
      this.onPrevWeaponCallback();
    }
  }

  private handleWheel(e: WheelEvent): void {
    const direction = Math.sign(e.deltaY);
    const input = direction > 0 ? 'WheelDown' : 'WheelUp';

    if (this.isBound(GameAction.NextWeapon, input) && this.onNextWeaponCallback) {
      this.onNextWeaponCallback();
    }
    if (this.isBound(GameAction.PrevWeapon, input) && this.onPrevWeaponCallback) {
      this.onPrevWeaponCallback();
    }

    if (this.onScrollCallback) {
      this.onScrollCallback(direction);
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
    const input = `Mouse${e.button}`;
    if (this.isBound(GameAction.Aim, input) && this.onZoomCallback) {
      this.onZoomCallback(true);
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    this.mouse.buttons[e.button] = false;
    const input = `Mouse${e.button}`;
    if (this.isBound(GameAction.Aim, input) && this.onZoomCallback) {
      this.onZoomCallback(false);
    }
  }

  public isKeyPressed(code: string): boolean {
    return !!this.keys[code];
  }

  public isMouseButtonPressed(button: number): boolean {
    return !!this.mouse.buttons[button];
  }

  public isActionPressed(action: GameAction): boolean {
    const boundKeys = this.bindings[action];
    if (!boundKeys) return false;

    for (const key of boundKeys) {
      if (key.startsWith('Mouse')) {
        const button = parseInt(key.replace('Mouse', ''));
        if (this.isMouseButtonPressed(button)) return true;
      } else if (key === 'WheelUp') {
        // Wheel is an event, not a state, so this is tricky for polling.
        // Usually handled via callbacks for discrete actions.
        return false; 
      } else if (key === 'WheelDown') {
        return false;
      } else {
        if (this.isKeyPressed(key)) return true;
      }
    }
    return false;
  }

  public rebind(action: GameAction, newKey: string): void {
    // Remove newKey from other bindings to avoid conflicts (optional but good practice)
    for (const act in this.bindings) {
      const keys = this.bindings[act as GameAction];
      const index = keys.indexOf(newKey);
      if (index !== -1) {
        keys.splice(index, 1);
      }
    }
    
    this.bindings[action] = [newKey];
  }

  public getMovementInput(): THREE.Vector3 {
    const inputDir = new THREE.Vector3();
    if (this.isActionPressed(GameAction.MoveForward)) inputDir.z -= 1;
    if (this.isActionPressed(GameAction.MoveBackward)) inputDir.z += 1;
    if (this.isActionPressed(GameAction.MoveLeft)) inputDir.x -= 1;
    if (this.isActionPressed(GameAction.MoveRight)) inputDir.x += 1;
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

  public setGrenadeCallback(callback: () => void): void {
    this.onGrenadeCallback = callback;
  }

  public setLastWeaponCallback(callback: () => void): void {
    this.onLastWeaponCallback = callback;
  }

  public setNextWeaponCallback(callback: () => void): void {
    this.onNextWeaponCallback = callback;
  }

  public setPrevWeaponCallback(callback: () => void): void {
    this.onPrevWeaponCallback = callback;
  }

  public setInteractCallback(callback: () => void): void {
    this.onInteractCallback = callback;
  }

  public setZoomCallback(callback: (zoomed: boolean) => void): void {
    this.onZoomCallback = callback;
  }

  public setScrollCallback(callback: (direction: number) => void): void {
    this.onScrollCallback = callback;
  }
}
