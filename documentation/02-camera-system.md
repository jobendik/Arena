# 02 - CAMERA SYSTEM

**Priority**: 🔴 CRITICAL - Foundation System  
**Status**: ⬜ Not Started  
**Dependencies**: 01 - Player Controller  
**Estimated Complexity**: High  
**Time Estimate**: 6-10 hours

---

## 📋 Overview

The camera system is the **player's eyes** into the game world. In a first-person shooter, the camera **IS** the player's perception. This system handles FOV changes, camera shake, recoil, head bob, and all camera-related feel elements.

### Why This Matters
- **Gunfeel foundation**: 50% of gunfeel comes from camera response
- **Impact feedback**: Camera shake/kick conveys power
- **Speed sensation**: FOV changes create sense of velocity
- **Player immersion**: Subtle movements create presence
- **Differentiation**: Great camera feel = memorable game

---

## 🎯 Design Goals

### Feel Targets
- [x] **Responsive**: Camera reacts instantly to events
- [x] **Weighty**: Actions feel impactful through camera
- [x] **Smooth**: No jarring transitions or jitter
- [x] **Dynamic**: FOV/position adjusts to game state
- [x] **Readable**: Never obscures gameplay

### Reference Games
- DOOM Eternal (aggressive camera punch)
- Call of Duty MW (smooth aim feel)
- Titanfall 2 (speed-based FOV)
- Apex Legends (responsive but stable)

---

## 🔗 Dependencies & Integration

### Required Before This
- 01 - Player Controller (camera follows player)
- Basic input system (mouse look)

### Required For This
- Mouse input (raw input preferred)
- Transform hierarchy (camera parent/child structure)

### Systems That Depend On This
- 04 - Weapon System (weapon positioning, recoil)
- 08 - Recoil System (camera kick patterns)
- 26 - Screen Shake (explosion shake)
- All visual feedback systems

---

## 🏗️ Core Components

### 1. Camera Hierarchy
```
Player Entity
├── Camera Parent (rotation X/Y/Z, position offsets)
│   ├── Camera (render component, FOV)
│   ├── Weapon Parent (attached to camera)
│   │   └── Weapon Model
│   └── Effects Parent (muzzle flash, etc.)
```

### 2. Camera Variables
```javascript
// Base settings
baseFOV: 90.0
nearClip: 0.1
farClip: 1000.0

// Mouse sensitivity
mouseSensitivity: 0.3
verticalClamp: 89.0 // degrees
invertY: false

// FOV modifiers
sprintFOVBoost: 10.0
jumpFOVBoost: 3.0
landFOVReduction: 5.0
adsFOVReduction: 20.0
fovTransitionSpeed: 8.0

// Head bob
bobEnabled: true
bobFrequency: 10.0
bobHorizontalAmplitude: 0.05
bobVerticalAmplitude: 0.08
bobSprintMultiplier: 1.5

// Breathing bob (idle)
breathingEnabled: true
breathingFrequency: 2.0
breathingAmplitude: 0.01

// Camera shake
shakeDecay: 5.0
shakeFrequency: 25.0
maxShakeIntensity: 1.0

// Recoil
recoilRecoverySpeed: 8.0
recoilSmoothness: 10.0
```

---

## ✅ Implementation Checklist

### Phase 1: Basic Camera & Mouse Look (Priority: Immediate)

#### Camera Entity Setup
- [ ] Create camera entity as child of player
- [ ] Position camera at eye height (1.6 units from ground)
- [ ] Set base FOV (90 degrees recommended)
- [ ] Configure near/far clip planes
- [ ] Set up camera parent for rotation control
- [ ] Test: Camera renders world correctly

#### Mouse Look (Yaw/Pitch)
- [ ] Capture mouse movement (delta X/Y)
- [ ] Apply mouse sensitivity multiplier
- [ ] Apply horizontal rotation (yaw) to player entity
- [ ] Apply vertical rotation (pitch) to camera parent
- [ ] Clamp vertical rotation (-89° to +89°)
- [ ] Implement vertical invert option
- [ ] Test: Mouse look feels responsive and smooth

#### Mouse Look Polish
- [ ] Remove mouse smoothing (use raw input)
- [ ] Ensure zero input lag
- [ ] Handle mouse sensitivity consistently
- [ ] Add sensitivity adjustment in settings
- [ ] Test: 1:1 mouse movement feels perfect

### Phase 2: Dynamic FOV System (Priority: High)

#### FOV State Management
- [ ] Create FOV state tracker (base/sprint/ads/jump/land)
- [ ] Implement smooth FOV transition (lerp)
- [ ] Set target FOV based on player state
- [ ] Update FOV each frame toward target
- [ ] Test: FOV changes smoothly

#### Sprint FOV
- [ ] Detect sprint state from player controller
- [ ] Increase FOV by sprint boost value
- [ ] Transition over 0.2-0.3 seconds
- [ ] Return to base FOV on sprint end
- [ ] Test: Sprint feels faster through FOV

#### Jump FOV
- [ ] Detect jump event
- [ ] Add temporary FOV boost
- [ ] Peak FOV at apex of jump
- [ ] Return FOV on descent
- [ ] Test: Jump feels dynamic

#### Landing FOV
- [ ] Detect landing event
- [ ] Brief FOV reduction (zoom in)
- [ ] Duration: 0.1-0.15 seconds
- [ ] Return to base FOV
- [ ] Scale reduction by fall velocity (optional)
- [ ] Test: Landing feels weighty

#### ADS FOV (For Scoped Weapons)
- [ ] Detect ADS state
- [ ] Reduce FOV significantly (30-40 degrees less)
- [ ] Smooth transition in
- [ ] Smooth transition out
- [ ] Test: ADS feels like zooming

### Phase 3: Head Bob System (Priority: Medium)

#### Walking Head Bob
- [ ] Track player velocity
- [ ] Calculate bob phase based on time + velocity
- [ ] Apply sine wave to vertical position
- [ ] Apply cosine wave to horizontal position
- [ ] Scale amplitude by movement speed
- [ ] Test: Walking has subtle rhythm

#### Sprint Head Bob
- [ ] Increase bob frequency during sprint
- [ ] Increase bob amplitude
- [ ] Add slight camera tilt (optional, 1-2 degrees)
- [ ] Test: Sprinting feels energetic

#### Bob Smoothing
- [ ] Smooth bob transitions on start/stop
- [ ] Fade bob when airborne
- [ ] Disable bob when stationary
- [ ] Test: No jarring bob changes

#### Breathing Bob (Idle)
- [ ] Detect idle state (no input, grounded)
- [ ] Apply slow sine wave (2-3 seconds cycle)
- [ ] Very subtle vertical movement
- [ ] Very subtle rotation
- [ ] Test: Idle feels alive, not static

### Phase 4: Camera Shake System (Priority: High)

#### Shake Architecture
- [ ] Create shake class/system
- [ ] Support multiple simultaneous shakes
- [ ] Each shake has: intensity, duration, frequency
- [ ] Shakes decay over time
- [ ] Combine all active shakes
- [ ] Test: Shake system works independently

#### Weapon Fire Shake
- [ ] Add small shake on weapon fire
- [ ] Duration: 0.05-0.1 seconds
- [ ] Intensity scales with weapon power
- [ ] Different patterns per weapon type
- [ ] Test: Shooting feels punchy

#### Explosion Shake
- [ ] Large shake on explosions
- [ ] Intensity based on distance to explosion
- [ ] Longer duration (0.5-1.0 seconds)
- [ ] Lower frequency than gunfire
- [ ] Test: Explosions feel massive

#### Damage Shake
- [ ] Medium shake when taking damage
- [ ] Scale with damage amount
- [ ] Brief duration (0.2 seconds)
- [ ] Test: Damage feels impactful

#### Landing Shake
- [ ] Shake on landing
- [ ] Scale with fall velocity
- [ ] Very brief (0.1 seconds)
- [ ] Test: Heavy landings feel heavy

### Phase 5: Camera Recoil/Kick (Priority: High)

#### Recoil System Integration
- [ ] Accept recoil input (pitch, yaw amounts)
- [ ] Apply recoil as additive rotation
- [ ] Store recoil offset separately
- [ ] Smooth recoil recovery over time
- [ ] Test: Recoil applies correctly

#### Recoil Recovery
- [ ] Gradually return camera to center
- [ ] Use lerp/smooth damp for natural feel
- [ ] Faster recovery when not firing
- [ ] Slower during sustained fire
- [ ] Test: Recoil recovery feels natural

#### Recoil Patterns
- [ ] Support vertical recoil (pitch up)
- [ ] Support horizontal recoil (yaw left/right)
- [ ] Support per-weapon recoil patterns
- [ ] Add slight randomization
- [ ] Test: Each weapon feels unique

### Phase 6: Camera Position Offsets (Priority: Low)

#### Weapon Sway
- [ ] Apply subtle position offset from mouse movement
- [ ] Inverse kinematic feel (weapon lags)
- [ ] Small magnitude (0.01-0.05 units)
- [ ] Smooth interpolation
- [ ] Test: Camera/weapon connection feels dynamic

#### Landing Impact
- [ ] Brief downward position offset on land
- [ ] Return to normal quickly
- [ ] Scale with fall velocity
- [ ] Test: Landing has impact

#### Damage Impact
- [ ] Slight position offset when damaged
- [ ] Direction based on hit source (optional)
- [ ] Very brief
- [ ] Test: Damage is felt

### Phase 7: Camera Constraints & Edge Cases (Priority: Low)

#### Collision Prevention
- [ ] Implement camera collision detection (optional)
- [ ] Push camera forward if inside geometry
- [ ] Smooth transition
- [ ] Test: Camera never clips

#### View Clamp
- [ ] Enforce vertical look limits (-89° to +89°)
- [ ] Prevent camera flip at poles
- [ ] Smooth clamping at limits
- [ ] Test: Can't look straight up/down past limit

#### Reset Functions
- [ ] Implement camera shake clear
- [ ] Implement recoil reset
- [ ] Implement FOV reset
- [ ] Test: Camera can return to neutral

---

## 🔍 Verification Criteria

### Automated Checks (GPT-Readable)
```javascript
// Check if camera exists
✓ Entity with camera component exists
✓ Camera is child of player entity
✓ Camera position is at eye height (~1.6 units)

// Check camera variables
✓ baseFOV defined (typically 80-100)
✓ mouseSensitivity defined
✓ verticalClamp defined
✓ fovTransitionSpeed defined

// Check mouse look
✓ Mouse input captured
✓ Yaw rotation applied to player/parent
✓ Pitch rotation applied to camera
✓ Vertical clamp implemented

// Check FOV system
✓ Target FOV variable exists
✓ Current FOV lerps toward target
✓ Sprint FOV boost implemented
✓ Jump FOV implemented

// Check head bob
✓ Bob calculation based on velocity
✓ Sine/cosine wave applied to position
✓ Bob amplitude variables exist
✓ Bob frequency variables exist

// Check shake system
✓ Shake function/method exists
✓ Active shakes tracked
✓ Shake decay implemented
✓ Multiple shakes can combine

// Check recoil
✓ Recoil offset variable exists
✓ Recoil recovery implemented
✓ Recoil applies to camera rotation
```

### Manual Testing Checklist
- [ ] **Smooth**: Mouse look has zero jitter
- [ ] **Responsive**: Camera responds instantly to input
- [ ] **Readable**: Shake doesn't obscure enemies
- [ ] **Impactful**: Shooting/damage feels powerful
- [ ] **Natural**: Bob/sway enhance immersion
- [ ] **Comfortable**: No motion sickness

### Performance Checks
- [ ] Camera update < 0.5ms per frame
- [ ] No frame drops during shake
- [ ] No GC allocation from camera logic

---

## 📁 Code Location Hints

### Expected File Structure
```
/scripts
  /camera
    cameraController.js        ← Main camera script
    cameraFOV.js              ← FOV management
    cameraShake.js            ← Shake system
    cameraBob.js              ← Head bob
    cameraRecoil.js           ← Recoil handling
```

### PlayCanvas Implementation
```javascript
// cameraController.js example structure
var CameraController = pc.createScript('cameraController');

// Attributes
CameraController.attributes.add('baseFOV', { type: 'number', default: 90 });
CameraController.attributes.add('mouseSensitivity', { type: 'number', default: 0.3 });
// ... more attributes

CameraController.prototype.initialize = function() {
    // Setup
    this.camera = this.entity.camera;
    this.currentFOV = this.baseFOV;
    this.targetFOV = this.baseFOV;
    this.pitch = 0;
    this.yaw = 0;
    this.activeShakes = [];
    this.recoilOffset = new pc.Vec3();
    
    // Lock pointer
    this.app.mouse.on(pc.EVENT_MOUSEDOWN, function () {
        this.app.mouse.enablePointerLock();
    }, this);
};

CameraController.prototype.update = function(dt) {
    this.handleMouseLook(dt);
    this.updateFOV(dt);
    this.updateHeadBob(dt);
    this.updateShake(dt);
    this.updateRecoil(dt);
    this.applyRotation();
};

CameraController.prototype.handleMouseLook = function(dt) {
    if (this.app.mouse.isPointerLocked()) {
        var dx = this.app.mouse.getDx() || 0;
        var dy = this.app.mouse.getDy() || 0;
        
        this.yaw -= dx * this.mouseSensitivity;
        this.pitch -= dy * this.mouseSensitivity;
        this.pitch = pc.math.clamp(this.pitch, -89, 89);
    }
};

CameraController.prototype.updateFOV = function(dt) {
    // Lerp current FOV toward target FOV
    this.currentFOV = pc.math.lerp(this.currentFOV, this.targetFOV, dt * this.fovTransitionSpeed);
    this.camera.fov = this.currentFOV;
};

CameraController.prototype.addShake = function(intensity, duration) {
    this.activeShakes.push({
        intensity: intensity,
        duration: duration,
        elapsed: 0
    });
};

// ... more methods
```

---

## 🐛 Common Issues & Solutions

### Issue: Mouse look feels laggy or choppy
**Solution**: Use raw mouse delta, avoid smoothing, ensure update in correct loop

### Issue: Camera clips through walls
**Solution**: Implement camera collision detection, push camera forward

### Issue: Vertical look goes upside down
**Solution**: Clamp pitch rotation between -89 and +89 degrees

### Issue: Head bob causes motion sickness
**Solution**: Reduce amplitude, increase frequency, add disable option

### Issue: Shake is too violent
**Solution**: Reduce intensity, increase decay rate, cap maximum

### Issue: FOV changes are jarring
**Solution**: Increase transition speed (lower value), smooth lerp

---

## ⚡ Performance Considerations

### Optimization Targets
- Camera update: < 0.5ms per frame
- Shake calculation: < 0.1ms per frame
- FOV transition: Negligible cost

### Optimization Strategies
- [ ] Cache transform references
- [ ] Reuse Vec3/Quat objects
- [ ] Limit active shakes (max 5-10)
- [ ] Use efficient trigonometry for bob
- [ ] Avoid recalculating unchanged values

---

## 🔄 Integration Points

### Systems This Connects To
1. **Player Controller** - Reads movement state for FOV/bob
2. **Weapon System** - Applies weapon recoil, sway
3. **Audio System** - Footstep timing from bob
4. **Damage System** - Damage shake, damage camera effects
5. **Explosion System** - Explosion shake intensity
6. **UI System** - HUD follows camera

### Events This System Listens For
```javascript
Events.on('player:sprint:start', () => { targetFOV = baseFOV + sprintFOV; });
Events.on('player:sprint:end', () => { targetFOV = baseFOV; });
Events.on('player:jump', () => { targetFOV = baseFOV + jumpFOV; });
Events.on('player:land', (data) => { addLandingShake(data.velocity); });
Events.on('weapon:fire', (data) => { addShake(data.intensity, 0.1); });
Events.on('explosion', (data) => { addShake(data.intensity, data.duration); });
Events.on('player:damage', (data) => { addDamageShake(data.damage); });
```

### Events This System Fires
```javascript
Events.fire('camera:fov:changed', { fov: currentFOV });
Events.fire('camera:shake:added', { intensity, duration });
Events.fire('camera:recoil:applied', { pitch, yaw });
```

---

## 📚 Reference Resources

### Internal Documents
- [Game Philosophy](../GAME-PHILOSOPHY.md)
- [01 - Player Controller](./01-player-controller.md)
- [08 - Recoil System](./08-recoil-system.md)
- [26 - Screen Shake](../03-visual-effects/26-screen-shake.md)

### External References
- [GDC: The Art of Screenshake](https://www.youtube.com/watch?v=AJdEqssNZ-U)
- [Source Engine Camera](https://developer.valvesoftware.com/wiki/View_Punch)
- [DOOM 2016 Camera Talk](https://www.youtube.com/watch?v=7GBJcQWrLCs)

### PlayCanvas Docs
- [Camera Component](https://developer.playcanvas.com/en/api/pc.CameraComponent.html)
- [Mouse Input](https://developer.playcanvas.com/en/api/pc.Mouse.html)
- [Pointer Lock](https://developer.playcanvas.com/en/tutorials/using-the-pointer-lock-api/)

---

## 📊 Success Metrics

### Quantitative
- [ ] Mouse response time < 16ms (1 frame at 60fps)
- [ ] FOV transitions smooth at 60fps
- [ ] Zero camera-related bugs in testing
- [ ] Shake intensity configurable

### Qualitative
- [ ] Players say camera "feels right"
- [ ] Shooting feels impactful
- [ ] Movement feels fast through FOV
- [ ] No motion sickness reports

---

## 🎯 Definition of Done

This system is complete when:
- [x] All checkboxes in implementation checklist are checked
- [x] All verification criteria pass
- [x] Mouse look feels perfect (unanimous agreement)
- [x] FOV changes enhance speed sensation
- [x] Camera shake adds impact without obscuring gameplay
- [x] Performance targets met
- [x] No known bugs
- [x] Code is documented
- [x] Integration events working
- [x] Settings menu allows customization

---

**Status**: ⬜ Not Started  
**Last Updated**: [Date]  
**Owner**: [Developer Name]  
**Reviewers**: []  
**Blockers**: Requires 01-Player Controller
