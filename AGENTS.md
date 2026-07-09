# AGENTS.md

> Conventions for AI agents (warren's built-in `pi`, `claude-code`, `sapling`,
> plus any external agent) working in this repository. Authoritative source
> for these conventions is `.warren/config.yaml` and
> `.mulch/expertise/*.jsonl` — this file is a convenience summary.

## Quality gates

The quality gate is `bun run check:all`, which expands to:

- `bun run lint` — biome check (warnings are errors)
- `bun run typecheck` — `tsc --noEmit` against the strict `tsconfig.json`
- `bun test` — `bun:test` unit tests under `tests/`

**Every commit must leave all three green.** Do not declare a run "done" with a red gate. If a check fails, fix the failure (including lint warnings) before stopping the run.

## Conventions

- **Stack.** Bun only. No npm / yarn / pnpm. No separate Node runtime.
- **TypeScript.** `strict: true` plus `noUncheckedIndexedAccess`. Use `?? null` or explicit length checks after array index. Don't widen `any`. Prefer narrowing.
- **Source layout.** `src/` for implementation, `tests/` for unit tests (mirrors src), `public/` for static assets, `data/` for runtime-persisted state.
- **Card model.** Card is immutable; mutations happen via `addCardToDeck` / `removeCardFromDeck` returning a new `Deck`. The `pickRandomCard` function is pure; don't add side effects.
- **HTTP layer.** `Bun.serve` only. Don't introduce Express / Fastify / Hono.
- **Persistence.** JSON file at `data/deck.json` (gitignored). Format schema is whatever `src/deck.ts` writes — don't hand-edit it.
- **No bundler.** `public/app.js` is loaded by the browser as plain modern JS. Don't introduce a bundler unless you also migrate the test layer.

## Workflow

1. Run `ml prime` first to read project expertise.
2. Read `README.md` and this file if they're stale.
3. Make the smallest change that satisfies the prompt.
4. Run `bun run check:all` before committing.
5. Commit only when green.
6. Warren handles the push, branch, PR, and auto-merge — don't `git push` yourself.

## Out of scope (intentional)

- Spaced repetition (SM-2) — filed as seed `mya-001`.
- Multi-deck support — filed as seed `mya-002`.
- CLI review state persistence — filed as seed `mya-003`.
- User accounts, auth, sync — far future.

Pick one seed at a time, land it as one PR. Don't batch two unrelated seeds into a single run.

## Files agents edit

- `src/` — yes
- `tests/` — yes, alongside `src/` changes
- `public/` — yes, for UI work
- `data/*.json` — never (gitignored; the agent reads/writes via the API)
- `.warren/`, `.mulch/`, `.seeds/`, `.plot/` — only the canonical editor:
  - `.warren/config.yaml` — operator-level edits (you are the operator)
  - `.warren/triggers.yaml` — operator-level
  - `.mulch/expertise/conventions.jsonl` — append-only, after you learn something new
  - `.seeds/issues.jsonl` — only if the change **introduces** a new follow-up

## Files agents never edit

- `README.md` only when explicitly asked, not as a side effect
- `package.json` dependencies — only with explicit operator approval
- Anything outside the scope of the dispatch prompt
