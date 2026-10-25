# Decisions Log – Pet Clinic Rush

Record important design decisions here, especially those that cross agent boundaries.
Format: `## YYYY-MM-DD <decision title>`
- Explain the context, the option considered, and the chosen approach.
- Reference relevant task IDs or contract files when helpful.
- Never delete another agent's entries.

## 2026-10-21 Treatments live in the UI layer, not in src/treatments
- Context: both agents implemented the seven mini-actions at the same time. B shipped
  `ui/ToolTray.ts` + `ui/TreatmentOverlay.ts`, which GameScene already drives; my
  parallel `src/treatments/**` registry was never imported by gameplay.
- Decision: keep one implementation (the overlay) and delete my duplicate registry,
  `objects/ToolTray.ts`, `objects/FeedbackFx.ts` and `utils/pool.ts` instead of leaving
  two divergent sources of truth.
- Consequences: the `Treatment` interface from the brief is satisfied by
  `TreatmentOverlay`'s start/cancel/complete callback contract. If gameplay ever needs
  treatments outside the overlay (mini-games, animations), reintroduce the registry then.

## 2026-10-21 Star rating is a pure system function
- `finish()` in GameScene used to compute stars inline from hearts and max combo, which
  contradicted the spec (stars follow the score thresholds).
- Decision: `systems/StarSystem.ts` owns `calculateStars`, `buildLevelResult` and
  `goalReached`; GameScene only supplies score/hearts/cured/coins/time.
- Rationale: one tested implementation, and Agent B's ResultScene gets a stable payload.

## 2026-10-21 C0 contract-first kickoff
- Decision: contracts-first approach (Agent A drafts types/events/assetKeys first, Agent B reviews & approves).
- Rationale: prevents rework when assets or gameplay systems change; both agents can work in parallel after approval.
- Next: Agent B reviews CONTRACT_CHANGES.md and replies APPROVED or COUNTER-PROPOSAL.

## 2026-10-21 Asset fallback strategy
- Decision: placeholder generator in src/utils/placeholders.ts takes over if real assets are absent.
- Rationale: keeps gameplay unblocked while Agent B delivers final art; the PreloadScene checks the cache and generates on the fly.
- Implementation: PreloadScene.loadKey() calls resolveKey() which checks scene.textures.exists(); if false, generates a placeholder of the requested size.

## 2026-10-21 EventBus centralisation
- Decision: single EventBus instance (exported as `eventBus` from src/contracts/events) used by all scenes/systems.
- Rationale: decouples gameplay from UI; UI listens to events, gameplay emits them. Makes playtesting and test doubles easier.
- Scope: only events listed in src/contracts/events.ts may be emitted; no ad-hoc event names.