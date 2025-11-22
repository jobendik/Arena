# 01 - PLAYER CONTROLLER

**Priority**: 🔴 CRITICAL - Foundation System  
**Status**: ⬜ Not Started  
**Dependencies**: None (foundational)  
**Estimated Complexity**: High  
**Time Estimate**: 8-12 hours

---

## 📋 Overview

The player controller is the **absolute foundation** of Rift's gameplay. This system handles all player movement, physics, and input response. It must feel snappy, responsive, and precise - like an extension of the player's body.

### Why This Matters
- **First impression**: Movement is the first thing players experience
- **Core loop**: Players spend 100% of gameplay time moving
- **Feel foundation**: All other systems build on this feel
- **Differentiation**: Exceptional movement separates good FPS from great FPS

---

## 🎯 Design Goals

### Feel Targets
- [x] **Snappy**: Zero input lag, instant response
- [x] **Precise**: Predictable, controllable, fair
- [x] **Fluid**: Smooth transitions, maintained momentum
- [x] **Skill-based**: High skill ceiling, mastery rewarding
- [x] **Fast**: High base speed, sprint multiplier

### Reference Games
- DOOM Eternal (snap + aggression)
- Titanfall 2 (fluid + momentum)
- Quake Champions (precise + air control)
- Krunker (instant + responsive)

---

## 🔗 Dependencies & Integration

### Required Before This
- None (this is first)

### Required For This
- Input system (can be basic key polling initially)
- Physics engine (PlayCanvas physics)
- Character collider

### Systems That Depend On This
- Camera system (follows player)
- Weapon system (inherits player velocity)
- Audio system (footsteps, movement sounds)
- Animation system (movement animations)
- All gameplay features

---

## 🏗️ Core Components

### 1. Movement State Machine
```
States:
├── Grounded
│   ├── Idle
│   ├── Walking
│   ├── Sprinting
│   └── Sliding (optional)
├── Airborne
│   ├── Jumping
│   ├── Falling
│   └── Coyote Time
└── Special
    ├── Dashing (if ability enabled)
    └── Stunned/Immobile
```

### 2. Movement Variables
```javascript
// Core speeds (units/second)
walkSpeed: 8.0
sprintSpeed: 12.0
crouchSpeed: 4.0
slideSpeed: 15.0 (initial)

// Acceleration
groundAcceleration: 50.0
groundDeceleration: 60.0
airAcceleration: 20.0
airDeceleration: 10.0

// Jump
jumpForce: 10.0
gravity: 25.0
fallMultiplier: 2.5
jumpCutMultiplier: 0.5
coyoteTime: 0.15 // seconds
jumpBufferTime: 0.1 // seconds

// Air control
airControlStrength: 0.8
maxAirSpeed: 15.0

// Friction
groundFriction: 8.0
airFriction: 0.5

// Step/Slope
maxStepHeight: 0.4
maxSlopeAngle: 45.0
```

---

## ✅ Implementation Checklist

### Phase 1: Basic Movement (Priority: Immediate)

#### Character Setup
- [ ] Create player entity in PlayCanvas scene
- [ ] Add capsule collider (height: 2.0, radius: 0.4)
- [ ] Add rigidbody component (or custom physics)
- [ ] Set up collision layers (player, world, enemies)
- [ ] Configure mass and drag
- [ ] Position camera parent entity

#### Ground Detection
- [ ] Implement ground raycast (from center, down)
- [ ] Add ground check with small threshold (0.1 units)
- [ ] Create ground normal detection
- [ ] Implement slope angle calculation
- [ ] Add "isGrounded" state boolean
- [ ] Implement slope movement adjustment

#### Basic WASD Movement
- [ ] Capture input (W/A/S/D or Arrow keys)
- [ ] Convert input to movement vector
- [ ] Normalize diagonal movement
- [ ] Apply movement relative to camera direction
- [ ] Implement basic velocity application
- [ ] Test: Player moves in 8 directions

#### Acceleration & Deceleration
- [ ] Implement ground acceleration curve
- [ ] Implement ground deceleration (release keys)
- [ ] Add friction to stop player completely
- [ ] Prevent instant stops (feel sluggish check)
- [ ] Test: Movement feels snappy but controlled

### Phase 2: Jump System (Priority: Immediate)

#### Basic Jump
- [ ] Capture jump input (Space)
- [ ] Apply upward force on jump
- [ ] Prevent double jumping (unless designed)
- [ ] Add jump cooldown (optional, 0.1s)
- [ ] Test: Player jumps predictably

#### Advanced Jump Feel
- [ ] Implement coyote time (grace period after ledge)
  - [ ] Track time since left ground
  - [ ] Allow jump within coyote window
- [ ] Implement jump buffering
  - [ ] Track jump input timing
  - [ ] Execute buffered jump on landing
- [ ] Implement jump cut
  - [ ] Detect jump button release
  - [ ] Apply downward force multiplier
  - [ ] Allow variable jump height
- [ ] Test: Jumping feels precise and fair

#### Gravity & Falling
- [ ] Apply constant downward gravity
- [ ] Implement fall multiplier (faster falling)
- [ ] Add terminal velocity cap
- [ ] Implement landing detection
- [ ] Add landing frame (brief immobility optional)
- [ ] Test: Falling feels weighty not floaty

### Phase 3: Sprint System (Priority: High)

#### Sprint Mechanics
- [ ] Capture sprint input (Shift / Toggle)
- [ ] Increase movement speed multiplier
- [ ] Smooth speed transition (lerp)
- [ ] Add sprint start/stop audio hooks
- [ ] Limit sprint direction (forward only? or omnidirectional?)
- [ ] Test: Sprint feels faster and intentional

#### Sprint FOV (Camera Integration)
- [ ] Increase FOV by 10-15 degrees
- [ ] Smooth FOV transition (0.2s)
- [ ] Return FOV on sprint end
- [ ] Test: Sprint feels fast without motion sickness

### Phase 4: Air Control (Priority: High)

#### Mid-Air Movement
- [ ] Allow directional input while airborne
- [ ] Apply reduced acceleration (air accel)
- [ ] Maintain horizontal momentum
- [ ] Allow strafing direction change
- [ ] Limit air speed accumulation
- [ ] Test: Player can adjust mid-air without full control

#### Momentum Preservation
- [ ] Carry sprint velocity into jump
- [ ] Preserve horizontal velocity on takeoff
- [ ] Allow momentum chaining (bhop-style)
- [ ] Test: Fast movement feels rewarding

### Phase 5: Slide System (Priority: Medium - Optional but Recommended)

#### Slide Initiation
- [ ] Detect crouch input during sprint
- [ ] Trigger slide state
- [ ] Set initial slide velocity
- [ ] Add slide duration timer (1.5s)
- [ ] Lock player to slide direction

#### Slide Physics
- [ ] Apply slide friction curve
- [ ] Reduce slide speed over time
- [ ] Maintain some momentum on exit
- [ ] Allow slide canceling (jump)
- [ ] Slide boosts from slopes (optional)
- [ ] Test: Slide feels smooth and tactical

#### Slide-to-Jump Combo
- [ ] Allow jump during slide
- [ ] Preserve slide momentum
- [ ] Convert horizontal to jump arc
- [ ] Add slight boost (optional)
- [ ] Test: Slide-jump chain feels fluid

### Phase 6: Step & Slope Handling (Priority: Medium)

#### Step-Up Mechanic
- [ ] Detect obstacles below max step height
- [ ] Auto-step up small ledges (0.3-0.5 units)
- [ ] Smooth vertical transition
- [ ] No manual jump required
- [ ] Test: Player smoothly climbs stairs

#### Slope Movement
- [ ] Detect slope angle
- [ ] Adjust movement speed on slopes
- [ ] Prevent sliding on steep slopes
- [ ] Allow slide boost downhill (if slide enabled)
- [ ] Block movement beyond max slope angle
- [ ] Test: Slopes feel natural

### Phase 7: Edge Cases & Polish (Priority: Low)

#### Collision Edge Cases
- [ ] Handle stuck-in-geometry scenarios
- [ ] Prevent wall clipping
- [ ] Smooth collision response
- [ ] Handle player-enemy collision
- [ ] Test edge of level boundaries

#### Movement Smoothing
- [ ] Implement velocity smoothing (optional)
- [ ] Add subtle position interpolation
- [ ] Smooth rotation transitions
- [ ] Test: No jittery movement

---

## 🔍 Verification Criteria

### Automated Checks (GPT-Readable)
```javascript
// Check if player controller exists
✓ Entity with name "Player" or tag "player" exists
✓ Player has script component attached
✓ Script contains movement logic

// Check movement variables
✓ walkSpeed defined and > 0
✓ sprintSpeed defined and > walkSpeed
✓ jumpForce defined and > 0
✓ gravity defined and > 0

// Check ground detection
✓ Ground raycast function exists
✓ isGrounded boolean exists and updates
✓ Ground normal calculation present

// Check input handling
✓ Input capture for WASD exists
✓ Sprint input captured
✓ Jump input captured
✓ Mouse input for camera direction exists

// Check state machine
✓ Movement states defined (idle, walk, sprint, jump, fall)
✓ State transitions implemented
✓ Current state tracked

// Check physics application
✓ Velocity calculation present
✓ Velocity applied to rigidbody or transform
✓ Friction applied
✓ Gravity applied
```

### Manual Testing Checklist
- [ ] **Responsive**: Input lag < 50ms
- [ ] **Snappy**: Release keys → instant stop
- [ ] **Smooth**: No jittering or stuttering
- [ ] **Predictable**: Same input = same result
- [ ] **Fun**: Movement alone is enjoyable

### Performance Checks
- [ ] No physics spikes (check profiler)
- [ ] Consistent framerate during movement
- [ ] No memory leaks from movement updates
- [ ] Runs at 60 FPS minimum

---

## 📁 Code Location Hints

### Expected File Structure
```
/scripts
  /player
    playerController.js        ← Main movement script
    playerInput.js             ← Input handling
    playerPhysics.js           ← Physics calculations (optional separation)
    playerStates.js            ← State machine (optional)
```

### PlayCanvas Implementation
```javascript
// playerController.js example structure
var PlayerController = pc.createScript('playerController');

// Movement variables
PlayerController.attributes.add('walkSpeed', { type: 'number', default: 8.0 });
PlayerController.attributes.add('sprintSpeed', { type: 'number', default: 12.0 });
// ... more attributes

PlayerController.prototype.initialize = function() {
    // Setup
    this.velocity = new pc.Vec3();
    this.isGrounded = false;
    this.isSprinting = false;
};

PlayerController.prototype.update = function(dt) {
    this.checkGround();
    this.handleInput();
    this.updateVelocity(dt);
    this.applyMovement(dt);
};

PlayerController.prototype.checkGround = function() {
    // Ground detection logic
};

PlayerController.prototype.handleInput = function() {
    // Input capture and processing
};

PlayerController.prototype.updateVelocity = function(dt) {
    // Acceleration, friction, gravity
};

PlayerController.prototype.applyMovement = function(dt) {
    // Apply final velocity to player
};
```

---

## 🐛 Common Issues & Solutions

### Issue: Player slides after releasing keys
**Solution**: Increase ground deceleration value, add stronger friction

### Issue: Movement feels floaty
**Solution**: Increase gravity, reduce air time, add fall multiplier

### Issue: Can't climb small ledges
**Solution**: Implement step-up system with max step height

### Issue: Player gets stuck on geometry
**Solution**: Add collision margin, smooth collision response, increase capsule radius

### Issue: Diagonal movement too fast
**Solution**: Normalize input vector before applying

### Issue: Input feels delayed
**Solution**: Use FixedUpdate or ensure input capture is in update loop

---

## ⚡ Performance Considerations

### Optimization Targets
- Movement update: < 1ms per frame
- Ground check: < 0.1ms per frame
- No garbage collection during movement

### Optimization Strategies
- [ ] Cache transform references
- [ ] Reuse Vec3 objects (don't create new each frame)
- [ ] Use object pooling for raycasts
- [ ] Minimize collision checks
- [ ] Use layer masks for raycasts

---

## 🔄 Integration Points

### Systems This Connects To
1. **Camera System** - Passes velocity for motion blur, shake
2. **Weapon System** - Movement affects weapon sway, spread
3. **Audio System** - Footstep timing, sprint sounds
4. **Animation System** - Blend tree based on velocity
5. **Network System** - Position/rotation replication
6. **HUD** - Speedometer, stamina bar (if applicable)

### Events This System Fires
```javascript
Events.fire('player:jump');
Events.fire('player:land', { velocity, height });
Events.fire('player:sprint:start');
Events.fire('player:sprint:end');
Events.fire('player:slide:start');
Events.fire('player:crouch:start');
Events.fire('player:move', { velocity, isGrounded });
```

---

## 📚 Reference Resources

### Internal Documents
- [Game Philosophy](../GAME-PHILOSOPHY.md)
- [02 - Camera System](./02-camera-system.md)
- [03 - Input System](./03-input-system.md)

### External References
- [Quake III Movement Code](https://github.com/id-Software/Quake-III-Arena)
- [Source Engine Player Movement](https://developer.valvesoftware.com/wiki/Movement)
- [Titanfall 2 GDC Talk](https://www.youtube.com/watch?v=fuKYq_zBCzg)

### PlayCanvas Docs
- [Rigidbody Component](https://developer.playcanvas.com/en/api/pc.RigidBodyComponent.html)
- [Collision Component](https://developer.playcanvas.com/en/api/pc.CollisionComponent.html)
- [Raycasting](https://developer.playcanvas.com/en/api/pc.RigidBodyComponentSystem.html#raycastFirst)

---

## 📊 Success Metrics

### Quantitative
- [ ] Input response time < 50ms
- [ ] Movement feels good in 9/10 playtests
- [ ] Zero physics bugs in testing
- [ ] 60 FPS maintained during movement

### Qualitative
- [ ] Players say "movement feels amazing"
- [ ] Players naturally explore movement mechanics
- [ ] Movement alone is engaging for 30+ seconds
- [ ] Testers compare favorably to reference games

---

## 🎯 Definition of Done

This system is complete when:
- [x] All checkboxes in implementation checklist are checked
- [x] All verification criteria pass
- [x] Manual testing feels exceptional
- [x] Performance targets met
- [x] No known bugs
- [x] Code is documented
- [x] Integration events fire correctly
- [x] At least one other developer has tested and approved

---

**Status**: ⬜ Not Started  
**Last Updated**: [Date]  
**Owner**: [Developer Name]  
**Reviewers**: []  
**Blockers**: None
