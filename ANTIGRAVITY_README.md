# Antigravity Execution Brief — Complete & Optimize WebOS

This document is a **ready-to-run instruction + detailed prompt** for Antigravity to finish and optimize this half-built browser-based operating system project.

---

## 1) Mission

You are Antigravity. Complete this WebOS project from ~50% to production-ready MVP with clean architecture, reliable state/data persistence, and scalable folder/file management.

Primary outcomes:
- Finish missing core functionality for a browser desktop + file explorer experience.
- Refactor into a maintainable folder structure aligned with feature-based boundaries.
- Improve performance, type-safety, and state consistency.
- Add optional backend instructions/contracts (and implement backend if needed) for future multi-device sync.
- Keep UX premium (glassmorphism/cinematic feel) but prioritize correctness and maintainability.

---

## 2) Current Project Snapshot (what already exists)

Tech already in use:
- React + TypeScript + Vite
- Zustand for state
- Dexie/IndexedDB for persistence
- Framer Motion for desktop transitions

Current implemented capabilities:
- Desktop shell with wallpaper, taskbar, window container, root context menu.
- Window store supports open/close/focus/minimize/maximize/restore and z-index management.
- File system store supports create/rename/delete (including recursive folder descendant delete).
- Dexie persistence manager saves filesystem and windows with debounced writes.

Current constraints / notable gaps:
- Architecture in README claims `apps/core/hooks` modular layout, but actual code is still mixed under `components`, `store`, etc.
- File IDs are partly hardcoded and partly random, with no robust path/slug strategy.
- No strict domain layer or service abstractions for filesystem operations.
- No robust validations (duplicate names in same folder, illegal chars, reserved names, extension handling, etc.).
- No backend contract currently enforced (project is local-first only).
- Test coverage appears absent.

---

## 3) Required Deliverables

### A. Architecture & Folder Structure Refactor
Refactor to a clear feature/domain-oriented structure. Use this target as default (adapt if justified):

```txt
client/src/
  app/
    App.tsx
    providers/
    router/
  core/
    config/
    constants/
    types/
    utils/
  features/
    desktop/
      components/
      hooks/
      store/
    window-manager/
      components/
      hooks/
      store/
      services/
      types/
    filesystem/
      components/
      hooks/
      store/
      services/
      validators/
      selectors/
      types/
  shared/
    components/
    hooks/
    lib/
    styles/
  infrastructure/
    db/
      dexie/
    api/
```

Rules:
- Move code incrementally with minimal behavior regressions.
- Keep import paths consistent; add barrel exports where helpful.
- Delete dead files after migration.

### B. Filesystem Completion
Implement robust filesystem domain logic:
- Stable item model with required metadata (`id`, `name`, `type`, `parentId`, timestamps, optional mime/ext/size).
- Prevent duplicate names inside the same folder (case-insensitive policy, clearly documented).
- Validate names and reject empty/invalid/reserved names.
- Improve rename flow (preserve extension for files unless explicitly changed).
- Add move support (drag/drop optional, API support required).
- Add copy/duplicate support.
- Add soft-delete bin/trash or explicit hard-delete mode (choose one, document).
- Add sorting + selectors (name/date/type, asc/desc).
- Add search filter in folder view.

### C. Window Manager Completion
- Persist window layout state safely (position/size/minimized/maximized/focus order).
- Clamp window positions/sizes to viewport.
- Improve restore logic for minimized/maximized transitions.
- Add app/window registry so window content is mapped by `appType` cleanly.
- Ensure no z-index/focus race conditions.

### D. Persistence/Data Layer Hardening
- Version Dexie schema safely and document migration plan.
- Batch writes with debounce/throttle and error guards.
- Add repository/service wrappers so UI never directly depends on DB table ops.
- Add startup hydration with fallback defaults and corruption handling.

### E. Backend-Ready Contract (and backend if needed)
If backend is not implemented now, still provide full contracts and integration points.

Minimum API contract to define:
- `GET /fs/tree`
- `POST /fs/items`
- `PATCH /fs/items/:id`
- `DELETE /fs/items/:id`
- `POST /fs/items/:id/move`
- `POST /fs/items/:id/copy`
- `GET /windows/layout`
- `PUT /windows/layout`

For each endpoint define:
- request payload schema
- response schema
- error schema/codes
- optimistic concurrency strategy (`updatedAt`/etag/version)

If implementing backend now, prefer:
- Node + Fastify or Express + TypeScript
- SQLite/Postgres abstraction
- zod validation
- shared types package for frontend/backend

### F. Quality, Tooling, and Testing
- Add lint rules and stricter TS checks where reasonable.
- Add unit tests for filesystem reducers/actions/services.
- Add at least one integration test for key user flow (create folder → rename → open window → persist → reload).
- Add script commands in package.json for test/lint/typecheck.

### G. Documentation
Update docs so new contributors can onboard quickly:
- Revised root README architecture section
- Developer setup/run/build/test instructions
- Persistence model explanation
- Backend contract documentation

---

## 4) Execution Strategy (how Antigravity should work)

1. **Audit first**: scan all source files and list current modules, coupling, and risks.
2. **Plan by phases** with checklists (Refactor → Domain hardening → Persistence → Backend contract → Tests).
3. **Ship in small safe commits** with meaningful messages.
4. **Run checks after each phase** (`typecheck`, `lint`, tests, build).
5. **Preserve UX behavior** while improving internals.
6. **Document every significant decision** with short rationale in markdown notes/changelog.

---

## 5) Non-Negotiable Engineering Rules

- TypeScript strictness must not be weakened.
- No `any` unless justified and wrapped with TODO + issue note.
- Avoid giant components/stores; split logic into services/selectors/hooks.
- Keep state updates immutable and predictable.
- Avoid tight coupling between rendering and persistence side-effects.
- Ensure all async persistence paths handle failures gracefully.
- Maintain backward compatibility for existing saved local data where possible.

---

## 6) Prompt to Execute (copy this to Antigravity)

```md
You are Antigravity, acting as a senior architect + full-stack engineer.

Project: WebOS (browser-based operating system) in React + TypeScript + Zustand + Dexie.
Current state: around 50% complete.
Goal: complete and optimize to production-quality MVP with proper folder structure, robust file management, and backend-ready architecture.

Tasks:
1) Perform full code audit and present a phased plan with risks.
2) Refactor into feature/domain-oriented folder structure with minimal regressions.
3) Harden filesystem domain (validation, duplicate handling, rename rules, move/copy/delete strategy, sorting/selectors/search).
4) Harden window manager (registry, focus/z-index correctness, viewport clamping, persisted layout reliability).
5) Improve persistence layer (Dexie versioning, migration strategy, repository abstraction, hydration fallback).
6) Provide backend API contracts for filesystem + windows layout and implement backend if necessary.
7) Add tests (unit + at least one integration flow) and improve lint/typecheck/tooling.
8) Update documentation and provide final migration notes.

Constraints:
- Keep TypeScript strict.
- Minimize UI behavior breakage.
- Use clean commits and clear changelog notes.
- Ensure the app builds, lints, and tests pass.

Expected output format:
- Phase-by-phase changelog.
- Final architecture tree.
- API contract table.
- Test report.
- Known limitations + next steps.
```

---

## 7) Acceptance Criteria

The task is complete when ALL are true:
- Project structure reflects modular feature/domain architecture.
- Filesystem behaviors are robust, validated, and tested.
- Window manager behavior is stable and persisted correctly.
- Persistence layer supports safe hydration and versioned migration.
- Backend contracts are documented and integration-ready (or backend delivered).
- Lint + typecheck + tests + production build pass.
- Documentation is updated and accurate.

---

## 8) Nice-to-Have Enhancements (after core completion)

- Keyboard shortcuts (rename, delete, new folder, search focus).
- Multi-select and bulk operations in file explorer.
- Virtualized large folder rendering.
- Command palette / launcher search.
- Theme tokens and accessibility pass (contrast/focus states).

