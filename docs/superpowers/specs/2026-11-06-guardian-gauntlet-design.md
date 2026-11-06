# Guardian Gauntlet — Design

## Intent

Make each stage-ending guardian feel dramatically more demanding and memorable, matching Den’s request for boss encounters that are ten times more challenging while keeping the game responsive at 60 FPS.

## Goals

- Turn each guardian into a multi-phase duel with distinct identity and escalating pressure.
- Make the selected difficulty matter across regular enemies and guardians: Medium is the balanced baseline, Easy is gentler, and Hard/Insane add hull and attack tempo in distinct steps.
- Reward reading telegraphs, positioning, and using the existing dash, decoys, drones, and weapon upgrades.
- Keep attack lanes legible and provide enough warning to dodge even during late phases.
- Bound projectile, particle, and animation work so the existing render governor can preserve frame pacing.

## Non-goals

- Add new dependencies, online features, or a new game mode.
- Increase challenge by multiplying health alone or filling the screen with unavoidable projectiles.
- Change controls or existing boss rewards.

## Approaches

1. **Richer, escalating guardian encounters — selected.** Give each existing guardian three readable phases, a signature attack rotation, and deliberate combinations in the final phase. Raise pressure through shorter recovery windows and smart lane coverage. This creates a major skill challenge without relying on raw health or visual clutter.
2. **Raw-stat spike.** Multiply boss health and damage. This is easy to implement but mostly stretches fights and can make mistakes feel arbitrary; it does not create richer play.
3. **Arena hazards.** Add persistent hazards and stage geometry. This could be visually striking, but adds more collision and rendering work and competes with projectile readability.

The user selected richer boss encounters and specified that bosses must be ten times more challenging. “Ten times” is treated as a dramatic increase in encounter skill and pressure, not a literal tenfold health or damage multiplier.

## Experience and behavior

- Preserve the three guardians: Aegis Warden, Cinder Matriarch, and Night Sentinel.
- Add a third phase to every fight. Phase transitions become explicit gameplay events and receive a distinct short visual/audio cue.
- Phase one teaches the guardian’s signature pattern; phase two accelerates and varies it; phase three combines patterns with tighter but still dodgeable timing.
- Scale enemy hull and attack cadence by the selected difficulty. Replace the current Medium 2× hull with 1×; keep Easy below baseline and make Hard/Insane progressively tougher through both hull and faster attack tempo.
- Keep the current clear telegraph before dangerous attacks. Attack patterns must leave a player with a plausible escape route, including at corridor edges.
- Let the existing combat kit matter: drones continue intercepting dangerous shots, decoys can draw guided threats, and weapons remain effective throughout the fight.
- On victory, preserve the current core rewards, stage progression, and no-pause flow.

## Performance and accessibility constraints

- Keep simulation deterministic and independent of rendering frame rate.
- Respect the existing hostile-projectile cap; do not add unbounded per-frame objects or particle generation.
- Reuse the current canvas, event, and capped effect systems. Prefer concise phase indicators and telegraphs over full-screen flashes.
- Ensure attacks can be distinguished by shape, timing, and direction as well as color.
- Verify normal play and all three boss phases with focused tests; run the full existing test suite and inspect the browser build at the base URL.

## Open implementation choices

- Use phase thresholds at 70% and 35% remaining health; scale attack recovery by selected difficulty, with a bounded attack budget and at least 0.8 seconds of final-phase warning.
- Keep HUD changes compact: show guardian phase and its current telegraph without covering the playfield.
- Increment the visible game version and asset/cache version together for release.
