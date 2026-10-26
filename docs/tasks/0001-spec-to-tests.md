# 0001: spec-to-tests v0.1

Status: in progress
Owner: Moges Johnson; agent: grok-bot

## Goal

`spec-to-tests <spec.md> [--out dir] [--llm] [--force]` turns a markdown spec or ADR into
failing Vitest acceptance tests before any code exists.

## Acceptance criteria

- [ ] Extracts checklist items, MUST/SHOULD/SHALL lines, and bullets under headings that
      match /acceptance criteria|AC|requirements/i, deduplicated, with IDs `AC-01`, `AC-02`...
- [ ] Writes `tests/acceptance/<name>.test.ts` with one `it.todo('AC-NN ...')` per criterion.
- [ ] Writes `tests/acceptance/<name>.checklist.md` linking each ID to its test, plus a
      "Needs clarification" section for vague criteria (fast, intuitive... with no number or unit).
- [ ] Vague criteria get no test, only a commented note.
- [ ] Backticked `fn()`, `interface Foo`, `class Bar` or a ts block under "## Interface"/"## API"
      produce `src/<name>.stubs.ts`, imported by the test file.
- [ ] `--llm` prints "LLM mode (local Ollama) not implemented yet" and falls back.
- [ ] Existing files are never overwritten without `--force`.
- [ ] `npx vitest run` passes the extractor and vague-detection unit tests.

## Out of scope

- A real LLM mode, watch mode, and publishing to npm.
