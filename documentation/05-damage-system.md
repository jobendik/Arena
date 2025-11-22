# 05 - DAMAGE SYSTEM

**Priority**: 🔴 CRITICAL - Foundation System  
**Status**: ⬜ Not Started  
**Dependencies**: 04-Weapon System, 06-Hit Detection  
**Estimated Complexity**: Medium  
**Time Estimate**: 4-6 hours

---

## 📋 Overview

The damage system calculates, applies, and tracks all damage in the game - from player weapons, enemy attacks, environmental hazards, and explosions.

---

## ✅ Implementation Checklist

### Phase 1: Core Damage Architecture

- [ ] Create Damage class/struct with properties:
  - [ ] damage amount
  - [ ] damage source (weapon, enemy, environment)
  - [ ] damage type (bullet, explosive, melee, environmental)
  - [ ] instigator (who dealt damage)
  - [ ] hit location (body, head)
  - [ ] knockback force
- [ ] Create Damageable interface/component for entities that can take damage
- [ ] Implement TakeDamage() method on all damageable entities

### Phase 2: Player Damage System

- [ ] Player health tracking (default: 100)
- [ ] Player armor system (optional, absorbs percentage)
- [ ] Damage reduction calculation
- [ ] Health clamping (0-100)
- [ ] Death detection (health <= 0)
- [ ] Invulnerability frames (optional, after respawn)
- [ ] Fire 'player:damage' event with damage data
- [ ] Fire 'player:death' event

### Phase 3: Enemy Damage System

- [ ] Enemy health per type
- [ ] Hit reaction system
- [ ] Headshot detection and multiplier (2x default)
- [ ] Damage number spawning
- [ ] Enemy death handling
- [ ] Fire 'enemy:damage' event
- [ ] Fire 'enemy:death' event

### Phase 4: Damage Modifiers

- [ ] Distance falloff calculation
- [ ] Armor penetration
- [ ] Headshot multiplier (2.0x)
- [ ] Critical hit system (optional)
- [ ] Damage over time (DOT) system (optional)
- [ ] Vulnerability/resistance modifiers

### Phase 5: Environmental Damage

- [ ] Kill zones (instant death)
- [ ] Damage zones (constant damage)
- [ ] Fall damage calculation
- [ ] Explosion damage with radius falloff

### Phase 6: Feedback Integration

- [ ] Damage vignette trigger
- [ ] Damage sound effects
- [ ] Camera shake on damage
- [ ] Hitmarker for dealing damage
- [ ] Hit direction indicator

---

## 🔍 Verification Criteria

```javascript
✓ Damageable component exists
✓ TakeDamage method implemented
✓ Player health tracked
✓ Enemy health tracked
✓ Headshot multiplier applied
✓ Distance falloff calculated
✓ Damage events fired
✓ Death handling works
```

---

## 🎯 Definition of Done

- [x] All checkboxes checked
- [x] Damage applies correctly
- [x] Headshots deal 2x damage
- [x] Death triggers properly
- [x] Events fire correctly
- [x] Feedback systems triggered

---

**Status**: ⬜ Not Started
