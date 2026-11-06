# Guardian Gauntlet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all stage guardians dramatically more challenging through readable, escalating three-phase combat while protecting the game’s 60 FPS target.

**Architecture:** Extend the deterministic boss simulation in `site/core.js`; expose phase transitions as events. Update the existing game HUD and capped visual/audio event handling in `site/game.js`, `site/index.html`, and `site/styles.css`. Keep the current render governor, bullet cap, and reward progression.

**Tech Stack:** Browser JavaScript, Canvas 2D, CSS, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-06-guardian-gauntlet-design.md`

## Global Constraints

- Keep simulation deterministic and independent of rendering frame rate.
- Respect the existing hostile-projectile cap of 300; do not add unbounded effects.
- Keep attack lanes legible and ensure dangerous attacks have a plausible escape route.
- Do not add dependencies or change ordinary enemy balance, controls, or boss rewards.
- Update the visible build and service-worker asset/cache versions together.

## Review Focus

- A boss already below a phase threshold at update time must enter the correct phase once, without skipping transition rewards or crashing.
- All guardians and phases must keep projectile counts within the 300-shot cap.
- The final phase must still expose a readable telegraph long enough to react.
- Boss defeat during any phase must award exactly the existing core/rewards and clear hostile shots.
- No boss must fire after it leaves the active play area or after defeat.

---

### Task 1: Three-phase guardian combat

**Files:**
- Modify: `site/core.js`
- Modify: `tests/guardian-patterns.test.cjs`

**Interfaces:**
- Consumes: existing `BOSS_ATTACKS`, `moveEnemy`, `hostileShot`, `hostileMissile`, and `defeat` flow.
- Produces: internal `bossPhase(e)` returning `1 | 2 | 3`; phase transition events `{type:'bossPhase', phase, x, y, name}`.

- [ ] **Step 1: Add failing tests** for exact phase boundaries (phase II at 70% remaining HP, phase III at 35%), one transition event per phase change, all three signature attack families in phase III, and the 300-hostile-shot cap.
- [ ] **Step 2: Run** `node --test tests/guardian-patterns.test.cjs`; confirm new assertions fail against current two-phase behavior.
- [ ] **Step 3: Implement** `bossPhase(e)` and three-phase, guardian-specific attack schedules in `site/core.js`. Use current signature attacks in phase one (2.5-second recovery), vary them in phase two (1.7-second recovery), and combine patterns in phase three (1.2-second recovery). Keep each shot emission behind the existing `hostileShot` / `hostileMissile` cap, leave an escape lane in each final pattern, and provide a minimum 0.8-second final-phase tell before attacks. Emit the transition event once when the phase advances.
- [ ] **Step 4: Run** `node --test tests/guardian-patterns.test.cjs tests/guardian-cores.test.cjs`; confirm phase logic passes and core rewards remain unchanged.

### Task 2: Clear phase transitions and attack readout

**Files:**
- Modify: `site/game.js`
- Modify: `site/index.html`
- Modify: `site/styles.css`
- Modify: `site/sw.js`
- Modify: `tests/guardian-patterns.test.cjs`

**Interfaces:**
- Consumes: Task 1’s `bossPhase` event fields `phase`, `x`, `y`, and `name`; existing boss HUD (`bossName`, `bossPhase`, `bossFill`).
- Produces: compact phase label and a brief, reduced-motion-aware transition cue; build version 64 and matching versioned assets/cache.

- [ ] **Step 1: Update** `site/game.js` to announce each phase once using the existing announcement/effect caps; show `PHASE I / II / III` with the current guardian’s attack tell in the HUD. Update `site/index.html` version and `v=` asset parameters to `64`. Bump the service-worker cache name and its precache asset versions in `site/sw.js`; preserve the network-first navigation behavior from the base-URL fix.
- [ ] **Step 2: Update** `site/styles.css` with a short, restrained phase cue and a `prefers-reduced-motion` fallback; preserve mobile HUD placement.
- [ ] **Step 3: Run** all Node tests: `node --test tests/*.test.cjs site/tests/*.test.cjs`; confirm all existing gameplay and performance tests pass.
- [ ] **Step 4: Inspect** the fight in browser at phone and desktop view sizes; confirm phase label, attack tell, and reduced-motion styling remain legible without blocking the field.

### Task 3: Publish and verify the live game

**Files:**
- Publish the approved changes on `main` through the existing GitHub Pages workflow.

- [ ] **Step 1: Check** `git diff --check` and `git status --short`; confirm only the planned files changed.
- [ ] **Step 2: Commit and push** the game update to `main`.
- [ ] **Step 3: Wait** for the GitHub Pages deployment to complete successfully.
- [ ] **Step 4: Open** the exact base URL `https://decniner.github.io/neon-orbit/` in the browser; confirm it shows version 64, reaches the playable difficulty/start screen, and is not served from the old service-worker cache.

## Plan self-review

- Spec coverage: all three guardians gain a third phase; each fight escalates with distinct patterns; HUD tells and transition cues improve readability; projectile/effect work is bounded; controls and rewards stay intact; the live build is verified.
- Review-focus cases: phase threshold/event behavior and projectile caps belong to Task 1; transition details and mobile/reduced-motion behavior are covered in Task 2; reward regressions are checked with `guardian-cores.test.cjs`; deployment/cache behavior is checked at the exact base URL in Task 3.
- Dependency and interface check: Task 1 emits `bossPhase` fields `phase`, `x`, `y`, `name`; Task 2 consumes these exact names. Task 2 produces the versioned assets required by Task 3.
- Proportion: three tasks are split at independently reviewable simulation, presentation, and release boundaries.
