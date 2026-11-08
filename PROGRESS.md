# NEON ORBIT Progress

- Current published build: v75 at `https://decniner.github.io/neon-orbit/?build=75`.
- v75 adds stage-scaled, stage-colored force fields to every enemy ship and guardian from Stage 4 onward. Fields absorb damage across all weapon types, grow tougher over later stages, and use shield-impact feedback and a distinct break effect before exposing the hull.
- Performance guardrails: projectile cap remains 300; drone beam flashes stay capped at 8; particle and ring effects remain bounded.
- Validation: JavaScript syntax checks passed and all 70 tests passed across both test folders, including the seeded difficulty-balance simulation. GitHub Pages serves v75 and the updated service worker cache v51.
- Next: tune further from play feedback while protecting the smooth frame target.
