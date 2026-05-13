# Wuxia Game Development Rules

## 1) Core Architecture
- Keep game logic in `src/engine` and keep it framework-agnostic (no React imports).
- Treat UI as a state observer. `src/components` and `src/pages` read from stores and do not implement combat rules.
- Keep global game state in `src/store` as the single source of truth.

## 2) Data-Driven First
- New gameplay content should be added in `src/data` first, then wired through `src/types`.
- Do not hardcode skill-specific behavior in shared engine logic unless it is a generic mechanic.
- Prefer adding new data entries over adding new branching logic.

## 3) Type Contract Discipline
- Define domain contracts in `src/types` before implementing engine/store code.
- Any schema change must update related type files in the same change.
- Avoid `any`. Use explicit domain types for battle, character, and skill flows.

## 4) Skill ID and Naming Rules
- Skill IDs must follow `skill_{category}_{number}_{pinyin}`.
- `number` is immutable and never reused, even if a skill is removed.
- Use lowercase snake_case for IDs and stable English field names in data files.

## 5) Boundaries and Dependencies
- `src/engine` can depend on `src/types` and `src/data` contracts, never on React UI.
- `src/store` can call engine APIs and expose state/selectors/actions.
- `src/components` and `src/pages` can call stores, but should not reach into deep engine internals directly.

## 6) Delivery Sequence
- Follow this iteration order: data skeleton -> skill engine -> combat loop -> world systems.
- If world features require engine rewrites, pause and refactor abstractions before adding more content.

## 7) Quality Gates
- Every change must pass: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`.
- Keep CI green before merging.
- Add or update tests whenever engine/store behavior changes.

## 8) Collaboration Rules (Human + AI)
- Keep PRs small and scoped to one concern when possible.
- Document non-obvious decisions in `README.md` or targeted docs in the same PR.
- Prefer deterministic logic and seedable/randomness-ready interfaces for future balance simulation.
