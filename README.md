# myanki

A minimal Anki-style flashcard app for LeetCode problem patterns. Flip a card, see the answer, repeat. Pre-populated with five canonical LeetCode patterns (Two Sum, Valid Parentheses, Reverse a Linked List, BFS vs DFS, Two Pointers).

> Out of the box: a CLI for terminal studying, a small browser UI served by `Bun.serve`, and a JSON file as the backing store. No database, no framework, no build step.

## Quickstart

```bash
bun install

# Seed the runtime deck from the example file (only needed once; /data is gitignored)
cp data/deck.json.example data/deck.json

# Web UI → http://localhost:3000
bun run dev

# Or terminal session → reads stdin, flips cards
bun run cli
```

## Scripts

| Script                  | What it does                                                  |
| ----------------------- | ------------------------------------------------------------- |
| `bun run dev`           | Web UI on port 3000 (override with `MYANKI_PORT=8080 bun run dev`) |
| `bun run cli`           | Interactive flashcard session in the terminal                  |
| `bun test`              | Run unit tests (`bun:test`)                                   |
| `bun run typecheck`     | `tsc --noEmit` against strict tsconfig                        |
| `bun run lint`          | Biome lint (warnings are errors)                              |
| `bun run check:all`     | The quality gate: lint + typecheck + test, all three          |

## Layout

```
src/
  cards.ts      Card / Deck data model + pure operations
  deck.ts       JSON file persistence (load, save)
  server.ts     Bun.serve HTTP server (static + JSON API)
  cli.ts        Terminal flashcard session
tests/
  cards.test.ts Unit tests for the data model
public/
  index.html    UI markup
  app.js        Browser JS (vanilla, no framework)
  style.css     Light/dark themed CSS
data/
  deck.json.example  Starter deck (5 leetcode patterns)
  deck.json          Runtime deck (gitignored)
.warren/
  config.yaml        Defaults applied to every dispatched run
  triggers.yaml      Cron schedules (empty array for now)
  preview.yaml       Per-run preview env config (commented-out)
  pr-template.md     Overridable PR description fragments (empty)
.seeds/
  issues.jsonl       Bootstrap issue queue (3 open seeds)
.mulch/
  expertise/         Conventions/patterns the agent reads each run
.plot/               Runtime plot workspace state (empty)
.github/workflows/   CI + auto-merge
```

## API

| Method | Path                 | Body                             | Returns                                    |
| ------ | -------------------- | -------------------------------- | ------------------------------------------ |
| GET    | `/api/deck`          | —                                | Full Deck JSON                             |
| GET    | `/api/next`          | —                                | Random Card JSON, or 204 if deck is empty  |
| POST   | `/api/cards`         | `{question, answer, tags?}`      | New Card (201)                             |
| DELETE | `/api/cards/:id`     | —                                | 204 (or no-op if id not found)             |

## Warren integration

This repo is set up to be a first-class warren project:

- `.warren/config.yaml` — `defaultProvider: minimax`, `defaultModel: MiniMax-M3`, `qualityGate: bun run check:all`
- `.warren/triggers.yaml` — empty (`[]`); add cron entries to enable scheduling
- `.seeds/issues.jsonl` — three open seeds covering the natural next features
- `.mulch/expertise/*.jsonl` — baseline conventions and build notes
- `.github/workflows/ci.yml` — runs the quality gate on every push and PR
- `.github/workflows/auto-merge.yml` — warren-created PRs merge once CI passes

Add it to a warren install with:

```bash
TOKEN="<your WARREN_API_TOKEN>"
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"gitUrl":"https://github.com/yegorske50/myanki"}' \
     http://localhost:8080/projects
```

Then refresh, dispatch, watch the agent flip a card → commit → push → PR auto-merges.

## License

MIT
