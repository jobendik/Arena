# 03 - INPUT SYSTEM

**Priority**: 🔴 CRITICAL - Foundation System  
**Status**: ⬜ Not Started  
**Dependencies**: None (foundational)  
**Estimated Complexity**: Medium  
**Time Estimate**: 4-6 hours

---

## 📋 Overview

The input system handles all player input - keyboard, mouse, gamepad - and makes it accessible to other systems. It must be responsive, rebindable, and support multiple input methods.

### Why This Matters
- **Responsiveness foundation**: All other systems depend on input
- **Accessibility**: Players need custom controls
- **Multi-platform**: Support keyboard/mouse and gamepad
- **Feel**: Input lag destroys game feel

---

## 🎯 Design Goals

- [x] **Zero latency**: Input processed immediately
- [x] **Rebindable**: All controls customizable
- [x] **Multi-input**: Support keyboard, mouse, gamepad
- [x] **Persistent**: Save custom bindings
- [x] **Conflict-free**: No duplicate bindings

---

## ✅ Implementation Checklist

### Phase 1: Input Architecture (Priority: Immediate)

#### Input Manager Setup
- [ ] Create InputManager singleton
- [ ] Initialize input systems (keyboard, mouse, gamepad)
- [ ] Create input action map structure
- [ ] Set up default bindings
- [ ] Test: Input manager initializes

#### Action Mapping System
- [ ] Define all game actions (move, jump, fire, reload, etc.)
- [ ] Create action → key binding map
- [ ] Support multiple keys per action
- [ ] Implement action query methods (isPressed, wasPressed, getValue)
- [ ] Test: Actions map to keys correctly

### Phase 2: Keyboard Input (Priority: Immediate)

#### Key Detection
- [ ] Capture all keyboard events
- [ ] Track key down states
- [ ] Track key up events
- [ ] Track key held duration
- [ ] Test: All keys register

#### Movement Keys
- [ ] Map WASD to movement actions
- [ ] Support arrow keys as alternative
- [ ] Normalize diagonal input
- [ ] Test: Movement input works

#### Action Keys
- [ ] Map space to jump
- [ ] Map shift to sprint
- [ ] Map R to reload
- [ ] Map E to interact
- [ ] Map 1-9 to weapon slots
- [ ] Map Q to weapon toggle
- [ ] Map G to grenade
- [ ] Map F to ability
- [ ] Map Tab to scoreboard
- [ ] Map Escape to pause
- [ ] Test: All action keys work

### Phase 3: Mouse Input (Priority: Immediate)

#### Mouse Movement
- [ ] Capture raw mouse delta
- [ ] No smoothing or acceleration
- [ ] Track mouse position
- [ ] Clamp to screen bounds (menu mode)
- [ ] Test: Mouse movement is 1:1

#### Mouse Buttons
- [ ] Left click → Primary fire
- [ ] Right click → ADS/Secondary
- [ ] Middle click → Ping/Mark (optional)
- [ ] Mouse 4/5 → Custom actions
- [ ] Test: All buttons register

#### Mouse Wheel
- [ ] Scroll up → Next weapon
- [ ] Scroll down → Previous weapon
- [ ] Alternative bindings for zoom/abilities
- [ ] Test: Scroll wheel works

### Phase 4: Gamepad Support (Priority: Medium)

#### Gamepad Detection
- [ ] Detect connected gamepads
- [ ] Support Xbox/PlayStation layouts
- [ ] Handle gamepad connect/disconnect
- [ ] Test: Gamepad detected

#### Analog Sticks
- [ ] Left stick → Movement
- [ ] Right stick → Camera look
- [ ] Deadzone configuration
- [ ] Sensitivity curves
- [ ] Test: Stick input smooth

#### Gamepad Buttons
- [ ] A/X → Jump
- [ ] B/Circle → Crouch
- [ ] X/Square → Reload
- [ ] Y/Triangle → Weapon switch
- [ ] LB/L1 → Grenade
- [ ] RB/R1 → Ability
- [ ] LT/L2 → ADS
- [ ] RT/R2 → Fire
- [ ] D-pad → Weapon selection
- [ ] Start → Pause
- [ ] Select/Back → Scoreboard
- [ ] Test: All buttons work

#### Gamepad Rumble
- [ ] Fire weapon → Light rumble
- [ ] Take damage → Medium rumble
- [ ] Explosion → Heavy rumble
- [ ] Configurable intensity
- [ ] Test: Rumble feels good

### Phase 5: Rebinding System (Priority: Medium)

#### Binding Interface
- [ ] Create rebind UI
- [ ] Show current bindings
- [ ] Capture new key press
- [ ] Detect conflicts
- [ ] Warn on conflicts
- [ ] Test: Can rebind keys

#### Binding Storage
- [ ] Save bindings to JSON
- [ ] Load bindings on startup
- [ ] Reset to defaults option
- [ ] Per-profile bindings (optional)
- [ ] Test: Bindings persist

### Phase 6: Input Contexts (Priority: Low)

#### Context System
- [ ] Gameplay context (all actions active)
- [ ] Menu context (limited actions)
- [ ] Chat context (text input only)
- [ ] Rebind context (capture mode)
- [ ] Switch contexts cleanly
- [ ] Test: Contexts isolate input correctly

### Phase 7: Advanced Features (Priority: Low)

#### Input Buffering
- [ ] Buffer jump input (jump buffer)
- [ ] Buffer fire input (optional)
- [ ] Configurable buffer window
- [ ] Test: Buffered input feels responsive

#### Double Tap Detection
- [ ] Detect double tap (dash, etc.)
- [ ] Configurable timing window
- [ ] Test: Double tap reliable

#### Hold Detection
- [ ] Detect button held
- [ ] Track hold duration
- [ ] Trigger on hold threshold
- [ ] Test: Hold detection works

---

## 🔍 Verification Criteria

```javascript
// Check input manager exists
✓ InputManager class/singleton exists
✓ Initialized in game startup

// Check action mappings
✓ All game actions defined
✓ Default bindings set
✓ Action query methods exist

// Check keyboard
✓ WASD captured
✓ Space captured
✓ All action keys mapped

// Check mouse
✓ Mouse delta captured
✓ Mouse buttons captured
✓ Mouse wheel captured

// Check gamepad
✓ Gamepad detection exists
✓ Analog sticks mapped
✓ Buttons mapped

// Check rebinding
✓ Rebind interface exists
✓ Bindings save/load
✓ Conflict detection exists
```

---

## 📁 Code Location

```
/scripts
  /input
    inputManager.js
    inputActions.js
    inputBindings.js
    gamepadManager.js
```

---

## 🎯 Definition of Done

- [x] All checkboxes checked
- [x] Zero input lag
- [x] All controls rebindable
- [x] Gamepad fully supported
- [x] Bindings persist
- [x] No conflicts
- [x] Performance: <0.5ms per frame

---

**Status**: ⬜ Not Started  
**Last Updated**: [Date]
