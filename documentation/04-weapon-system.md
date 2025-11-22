# 04 - WEAPON SYSTEM

**Priority**: 🔴 CRITICAL - Foundation System  
**Status**: ⬜ Not Started  
**Dependencies**: 01-Player Controller, 02-Camera System, 06-Hit Detection  
**Estimated Complexity**: Very High  
**Time Estimate**: 12-20 hours

---

## 📋 Overview

The weapon system is the **core interaction** of Rift. This system handles all shooting mechanics, weapon behavior, ammo management, reload, weapon switching, and weapon feel. It must feel snappy, powerful, and satisfying.

### Why This Matters
- **Primary interaction**: 90% of gameplay is shooting
- **Game identity**: Weapons define the game's personality
- **Player agency**: Weapons are the player's primary tool
- **Viral potential**: Great gunfeel generates clips and buzz
- **Skill expression**: Weapon mastery is the core skill

---

## 🎯 Design Goals

### Feel Targets
- [x] **Punchy**: Every shot feels powerful and meaningful
- [x] **Snappy**: Zero delay from click to effect
- [x] **Distinct**: Each weapon has unique personality
- [x] **Responsive**: Reloads and swaps are fast
- [x] **Satisfying**: Spam firing is fun, precision is rewarding

### Reference Games
- DOOM Eternal (power + variety)
- Call of Duty (weapon feel polish)
- Valorant (weapon clarity)
- Counter-Strike (precision + skill)

---

## 🔗 Dependencies & Integration

### Required Before This
- 01 - Player Controller (weapon follows player)
- 02 - Camera System (weapon attaches to camera)
- 06 - Hit Detection (determines hits)
- Basic input system (fire, reload, switch)

### Required For This
- Weapon models/geometries
- Fire sound effects
- Muzzle flash effects
- Hit detection system

### Systems That Depend On This
- 07 - Basic Feedback (hitmarkers from weapons)
- 08 - Recoil System (per-weapon patterns)
- 09 - Spread System (accuracy)
- 20 - Muzzle Flash (visual feedback)
- 41 - Weapon Audio (sound design)
- All combat systems

---

## 🏗️ Core Components

### 1. Weapon Architecture
```
Weapon System
├── Weapon Manager (switching, active weapon)
├── Weapon Base Class
│   ├── Stats (damage, fire rate, ammo, etc.)
│   ├── Fire System (automatic, semi-auto, burst)
│   ├── Reload System
│   ├── Ammo Management
│   ├── Recoil Profile
│   ├── Spread Profile
│   └── Audio/Visual Events
├── Weapon Types
│   ├── Pistol
│   ├── Rifle (AR, Sniper)
│   ├── SMG
│   ├── Shotgun
│   ├── LMG
│   └── Special (Rocket, Grenade Launcher)
└── Weapon Models/Animations
```

### 2. Core Weapon Stats
```javascript
// Example weapon configuration
{
  // Identity
  weaponName: "Assault Rifle",
  weaponType: "rifle",
  weaponSlot: 1,
  
  // Damage
  damage: 25,
  headshotMultiplier: 2.0,
  damageDropoffStart: 20, // units
  damageDropoffEnd: 50,
  minDamage: 15,
  
  // Fire behavior
  fireMode: "automatic", // automatic, semi-auto, burst
  fireRate: 600, // rounds per minute
  burstCount: 3, // if burst mode
  burstDelay: 0.1, // seconds between bursts
  
  // Ammo
  magSize: 30,
  reserveAmmo: 150,
  reloadTime: 2.0, // seconds
  emptyReloadTime: 2.3,
  
  // Accuracy
  baseSpread: 0.5, // degrees
  spreadIncrease: 0.3, // per shot
  maxSpread: 5.0,
  spreadRecovery: 10.0, // degrees/second
  movementSpreadMultiplier: 1.5,
  jumpSpreadMultiplier: 2.0,
  adsSpreadMultiplier: 0.3,
  
  // Recoil
  recoilPitchMin: 1.0,
  recoilPitchMax: 1.5,
  recoilYawMin: -0.3,
  recoilYawMax: 0.3,
  recoilPattern: [], // optional pattern
  recoilRecovery: 8.0,
  
  // Feel
  muzzleFlashScale: 1.0,
  screenShakeIntensity: 0.3,
  cameraKickIntensity: 1.0,
  
  // Visual
  modelPath: "weapons/rifle.glb",
  crosshairType: "cross",
  tracerColor: [0, 255, 255], // cyan
  
  // Audio
  fireSound: "rifle_fire",
  reloadSound: "rifle_reload",
  emptyClickSound: "empty_click"
}
```

---

## ✅ Implementation Checklist

### Phase 1: Weapon Manager & Architecture (Priority: Immediate)

#### Weapon Manager Setup
- [ ] Create WeaponManager singleton/class
- [ ] Track active weapon index
- [ ] Track owned weapons array
- [ ] Implement weapon switching logic
- [ ] Handle weapon swap animations (optional)
- [ ] Test: Can switch between weapons

#### Weapon Base Class
- [ ] Create Weapon base class/script
- [ ] Define all core weapon stats as attributes
- [ ] Implement initialization method
- [ ] Implement cleanup method
- [ ] Test: Weapon instances can be created

#### Weapon Loading System
- [ ] Load weapon configs from JSON or attributes
- [ ] Instantiate weapon models
- [ ] Attach weapons to camera parent
- [ ] Position weapons correctly in view
- [ ] Test: Weapons appear in view

### Phase 2: Core Fire System (Priority: Immediate)

#### Basic Firing
- [ ] Capture fire input (left mouse / trigger)
- [ ] Implement fire cooldown timer
- [ ] Calculate next fire time based on fire rate
- [ ] Prevent firing when reloading
- [ ] Prevent firing when no ammo
- [ ] Test: Can fire weapon with cooldown

#### Fire Modes
- [ ] **Automatic**: Hold to fire continuously
  - [ ] Fire while button held
  - [ ] Respect fire rate cooldown
- [ ] **Semi-Automatic**: Click per shot
  - [ ] Require button release between shots
  - [ ] Still respect fire rate
- [ ] **Burst**: Fixed shots per click
  - [ ] Fire burst count bullets
  - [ ] Delay between burst bullets
  - [ ] Require full burst before next input
- [ ] Test: All fire modes work correctly

#### Ammo Management
- [ ] Track current magazine ammo
- [ ] Track reserve ammo
- [ ] Decrement ammo on fire
- [ ] Prevent firing at 0 ammo
- [ ] Play empty click sound
- [ ] Test: Ammo depletes correctly

### Phase 3: Reload System (Priority: High)

#### Basic Reload
- [ ] Capture reload input (R key)
- [ ] Check if reload is needed (mag < max)
- [ ] Start reload timer
- [ ] Block firing during reload
- [ ] Restore ammo on completion
- [ ] Deduct from reserves
- [ ] Test: Reload works correctly

#### Reload Variations
- [ ] Normal reload (mag has bullets)
- [ ] Empty reload (mag is empty, longer time)
- [ ] Tactical reload (reload before empty)
- [ ] Auto-reload (optional, reload at 0)
- [ ] Test: All reload types work

#### Reload Canceling
- [ ] Allow weapon switch during reload
- [ ] Weapon switch cancels reload
- [ ] No ammo refund if canceled
- [ ] Resume reload if switching back (optional)
- [ ] Test: Reload canceling works

### Phase 4: Hit Registration (Priority: Immediate)

#### Hitscan Implementation
- [ ] Cast ray from camera forward
- [ ] Apply spread offset to ray direction
- [ ] Use weapon range for max distance
- [ ] Detect what the ray hits (enemy, world)
- [ ] Calculate hit position
- [ ] Test: Hits register correctly

#### Damage Application
- [ ] Get damage value from weapon stats
- [ ] Check if hit is headshot
- [ ] Apply headshot multiplier
- [ ] Apply damage dropoff by distance
- [ ] Send damage to hit entity
- [ ] Test: Damage applies correctly

#### Hit Events
- [ ] Fire 'weapon:hit' event with hit data
- [ ] Fire 'weapon:kill' event if target dies
- [ ] Fire 'weapon:headshot' event if headshot
- [ ] Test: Events fire correctly

### Phase 5: Weapon Switching (Priority: Medium)

#### Switch Input
- [ ] Capture weapon switch inputs (1,2,3 keys)
- [ ] Capture scroll wheel switching
- [ ] Capture Q key (last weapon toggle)
- [ ] Test: All inputs captured

#### Switch Logic
- [ ] Deactivate current weapon
- [ ] Activate new weapon
- [ ] Set weapon position/visibility
- [ ] Start switch animation (optional)
- [ ] Cancel reload on switch
- [ ] Brief delay before can fire (optional)
- [ ] Test: Switching feels responsive

#### Switch Polish
- [ ] Smooth weapon position transitions
- [ ] Swap sound effects
- [ ] Hide old weapon, show new weapon
- [ ] Update HUD to show new weapon
- [ ] Test: Switching feels polished

### Phase 6: Weapon Feel & Feedback (Priority: High)

#### Firing Feedback
- [ ] Play fire sound effect
- [ ] Spawn muzzle flash
- [ ] Apply camera kick/recoil
- [ ] Apply screen shake
- [ ] Spawn bullet tracer
- [ ] Test: Firing feels punchy

#### Visual Effects
- [ ] Muzzle flash particle effect
- [ ] Bullet tracer line
- [ ] Shell ejection (optional)
- [ ] Weapon animation (recoil kick)
- [ ] Test: Visuals enhance feel

#### Audio Feedback
- [ ] Fire sound (multi-layer preferred)
- [ ] Tail sound
- [ ] Reload sound sequence
- [ ] Empty click sound
- [ ] Switch sound
- [ ] Test: Audio enhances feel

### Phase 7: Weapon Types Implementation (Priority: Medium)

#### Pistol
- [ ] Semi-automatic fire mode
- [ ] Medium damage (40-50)
- [ ] Small magazine (12-15 rounds)
- [ ] Low recoil
- [ ] Accurate
- [ ] Fast reload
- [ ] Test: Pistol feels precise

#### Assault Rifle
- [ ] Automatic fire mode
- [ ] Medium damage (25-35)
- [ ] Medium magazine (30 rounds)
- [ ] Medium recoil with pattern
- [ ] Good balance
- [ ] Test: Rifle feels versatile

#### SMG
- [ ] Automatic fire mode
- [ ] Low damage (20-25)
- [ ] Large magazine (30-40 rounds)
- [ ] High fire rate
- [ ] High recoil
- [ ] High spread (close range weapon)
- [ ] Test: SMG rewards aggression

#### Sniper Rifle
- [ ] Semi-automatic (slow)
- [ ] Very high damage (80-100)
- [ ] Small magazine (5-8 rounds)
- [ ] Heavy recoil
- [ ] Perfect accuracy when still
- [ ] Scope/ADS required
- [ ] Test: Sniper rewards precision

#### Shotgun
- [ ] Semi-automatic
- [ ] High damage per pellet (12 pellets * 10 damage)
- [ ] Small magazine (6-8 shells)
- [ ] Heavy recoil
- [ ] Wide spread cone
- [ ] Damage dropoff steep
- [ ] Test: Shotgun devastating up close

#### LMG (Optional)
- [ ] Automatic fire mode
- [ ] Medium damage (30)
- [ ] Huge magazine (100+ rounds)
- [ ] Heavy recoil
- [ ] Slow reload
- [ ] Slow movement while firing
- [ ] Test: LMG rewards sustained fire

### Phase 8: Advanced Systems (Priority: Low)

#### Weapon Attachments (Optional)
- [ ] Scope system (change zoom)
- [ ] Extended mag (increase capacity)
- [ ] Silencer (reduce sound/muzzle flash)
- [ ] Grip (reduce recoil)
- [ ] Test: Attachments modify stats

#### Ammo Types (Optional)
- [ ] Regular ammo
- [ ] Armor-piercing (bonus vs armored)
- [ ] Explosive (area damage)
- [ ] Test: Ammo types work

#### Weapon Overheating (Optional)
- [ ] Track heat buildup
- [ ] Force cooldown at max heat
- [ ] Visual heat indicator
- [ ] Test: Overheating limits sustained fire

---

## 🔍 Verification Criteria

### Automated Checks (GPT-Readable)
```javascript
// Check if weapon system exists
✓ WeaponManager class/script exists
✓ Weapon base class exists
✓ At least one weapon configured

// Check weapon stats
✓ Each weapon has damage value
✓ Each weapon has fire rate
✓ Each weapon has mag size
✓ Each weapon has reload time
✓ Each weapon has recoil values
✓ Each weapon has spread values

// Check fire system
✓ Fire input captured
✓ Fire cooldown implemented
✓ Ammo decremented on fire
✓ Empty magazine prevents firing

// Check reload
✓ Reload input captured
✓ Reload timer implemented
✓ Ammo restored on reload
✓ Reserves decremented

// Check hit detection
✓ Raycast from camera on fire
✓ Spread applied to ray direction
✓ Damage applied to hit targets
✓ Headshot detection exists

// Check weapon switching
✓ Multiple weapons can exist
✓ Active weapon tracked
✓ Switch input captured
✓ Weapons activate/deactivate

// Check feedback
✓ Fire sound plays
✓ Muzzle flash spawns
✓ Recoil applied to camera
✓ Hit events fired
```

### Manual Testing Checklist
- [ ] **Responsive**: Zero delay from click to fire
- [ ] **Punchy**: Shooting feels powerful
- [ ] **Distinct**: Weapons feel different
- [ ] **Reliable**: Hits register accurately
- [ ] **Satisfying**: Spam firing is fun

### Performance Checks
- [ ] Weapon update < 1ms per frame
- [ ] Hit detection < 0.5ms per shot
- [ ] No frame drops when firing
- [ ] No memory leaks from weapons

---

## 📁 Code Location Hints

### Expected File Structure
```
/scripts
  /weapons
    weaponManager.js           ← Manages all weapons
    weaponBase.js              ← Base weapon class
    /types
      pistol.js                ← Pistol implementation
      rifle.js                 ← Rifle implementation
      smg.js                   ← SMG implementation
      shotgun.js               ← Shotgun implementation
      sniper.js                ← Sniper implementation
    weaponStats.json           ← Weapon configurations
    weaponSwitcher.js          ← Switching logic
```

### PlayCanvas Implementation Example
```javascript
// weaponBase.js
var WeaponBase = pc.createScript('weaponBase');

// Weapon stats attributes
WeaponBase.attributes.add('weaponName', { type: 'string' });
WeaponBase.attributes.add('damage', { type: 'number', default: 25 });
WeaponBase.attributes.add('fireRate', { type: 'number', default: 600 });
WeaponBase.attributes.add('magSize', { type: 'number', default: 30 });
WeaponBase.attributes.add('reloadTime', { type: 'number', default: 2.0 });
// ... more attributes

WeaponBase.prototype.initialize = function() {
    this.currentAmmo = this.magSize;
    this.reserveAmmo = this.magSize * 5;
    this.isReloading = false;
    this.nextFireTime = 0;
    this.fireDelay = 60 / this.fireRate; // convert RPM to seconds
};

WeaponBase.prototype.update = function(dt) {
    if (this.isReloading) {
        // Handle reload timer
        return;
    }
    
    this.handleInput(dt);
};

WeaponBase.prototype.handleInput = function(dt) {
    // Check fire input
    if (this.app.mouse.isPressed(pc.MOUSEBUTTON_LEFT)) {
        this.attemptFire();
    }
    
    // Check reload input
    if (this.app.keyboard.wasPressed(pc.KEY_R)) {
        this.startReload();
    }
};

WeaponBase.prototype.attemptFire = function() {
    var now = Date.now() / 1000;
    
    // Check cooldown
    if (now < this.nextFireTime) return;
    
    // Check ammo
    if (this.currentAmmo <= 0) {
        this.playEmptyClick();
        return;
    }
    
    // Fire!
    this.fire();
    this.nextFireTime = now + this.fireDelay;
    this.currentAmmo--;
};

WeaponBase.prototype.fire = function() {
    // Perform hitscan
    var origin = this.app.root.findByName('Camera').getPosition();
    var direction = this.app.root.findByName('Camera').forward;
    
    // Apply spread
    direction = this.applySpread(direction);
    
    // Raycast
    var result = this.app.systems.rigidbody.raycastFirst(origin, direction);
    
    if (result) {
        this.handleHit(result);
    }
    
    // Fire feedback
    this.app.fire('weapon:fire', {
        weapon: this,
        position: origin,
        direction: direction
    });
};

WeaponBase.prototype.startReload = function() {
    if (this.currentAmmo >= this.magSize) return;
    if (this.reserveAmmo <= 0) return;
    
    this.isReloading = true;
    
    setTimeout(() => {
        this.finishReload();
    }, this.reloadTime * 1000);
};

WeaponBase.prototype.finishReload = function() {
    var needed = this.magSize - this.currentAmmo;
    var reloaded = Math.min(needed, this.reserveAmmo);
    
    this.currentAmmo += reloaded;
    this.reserveAmmo -= reloaded;
    this.isReloading = false;
};

// ... more methods
```

---

## 🐛 Common Issues & Solutions

### Issue: Shots don't register
**Solution**: Ensure raycast origin is camera position, direction is forward

### Issue: Fire rate inconsistent
**Solution**: Use fixed timestamp comparison, not frame delta time

### Issue: Reload doesn't work
**Solution**: Check reload timer, ensure not firing during reload

### Issue: Weapon switching broken
**Solution**: Properly deactivate old weapon before activating new

### Issue: Ammo goes negative
**Solution**: Clamp ammo to 0, prevent firing at 0

### Issue: Recoil feels wrong
**Solution**: Tune recoil recovery speed, add slight randomization

---

## ⚡ Performance Considerations

### Optimization Targets
- Weapon update: < 1ms per frame
- Fire logic: < 0.5ms per shot
- Hit detection: < 0.5ms per shot
- No GC from weapon logic

### Optimization Strategies
- [ ] Cache transform references
- [ ] Reuse Vec3 objects for raycasting
- [ ] Pool muzzle flash particles
- [ ] Limit active effects per weapon
- [ ] Use object pooling for bullet tracers

---

## 🔄 Integration Points

### Systems This Connects To
1. **Camera System** - Receives recoil, shake, FOV changes
2. **Recoil System** - Per-weapon recoil patterns
3. **Spread System** - Accuracy calculations
4. **Hit Detection** - Validates hits
5. **Audio System** - Fire, reload, empty sounds
6. **VFX System** - Muzzle flash, tracers, impacts
7. **HUD** - Ammo display, crosshair
8. **Damage System** - Applies damage to targets

### Events This System Fires
```javascript
Events.fire('weapon:fire', { weapon, position, direction, spread });
Events.fire('weapon:hit', { weapon, target, hitPosition, damage, headshot });
Events.fire('weapon:kill', { weapon, target });
Events.fire('weapon:headshot', { weapon, target });
Events.fire('weapon:reload:start', { weapon });
Events.fire('weapon:reload:complete', { weapon });
Events.fire('weapon:empty', { weapon });
Events.fire('weapon:switch', { oldWeapon, newWeapon });
Events.fire('weapon:ammo:changed', { weapon, currentAmmo, reserveAmmo });
```

---

## 📚 Reference Resources

### Internal Documents
- [Game Philosophy](../GAME-PHILOSOPHY.md)
- [06 - Hit Detection](./06-hit-detection.md)
- [08 - Recoil System](./08-recoil-system.md)
- [09 - Spread System](./09-spread-system.md)

### External References
- [Destiny 2 Weapon Feel GDC](https://www.youtube.com/watch?v=U_lnU0V1pPA)
- [Call of Duty Weapon Design](https://www.youtube.com/watch?v=ymiYuEpGIh0)
- [Valorant Weapon Design](https://playvalorant.com/en-us/news/dev/ask-valorant-about-weapons/)

---

## 📊 Success Metrics

### Quantitative
- [ ] 0ms input lag from click to fire
- [ ] Hit detection 100% accurate
- [ ] Fire rate matches configured RPM
- [ ] Reload time matches configured duration

### Qualitative
- [ ] Players say weapons "feel good"
- [ ] Each weapon has distinct personality
- [ ] Shooting is satisfying for 5+ minutes straight
- [ ] Weapons compared favorably to reference games

---

## 🎯 Definition of Done

This system is complete when:
- [x] All checkboxes checked
- [x] All verification criteria pass
- [x] At least 3 weapons fully implemented
- [x] Shooting feels exceptional
- [x] Reloading is snappy
- [x] Switching is instant
- [x] Hit detection is perfect
- [x] Performance targets met
- [x] No known bugs
- [x] Code documented
- [x] Events integrated
- [x] Playtesting approved

---

**Status**: ⬜ Not Started  
**Last Updated**: [Date]  
**Owner**: [Developer Name]  
**Reviewers**: []  
**Blockers**: Requires 01, 02, 06
