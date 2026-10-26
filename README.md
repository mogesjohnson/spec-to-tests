# spec-to-tests

Turn a markdown spec or ADR into failing Vitest acceptance tests before any code exists.

`spec-to-tests` reads the spec with plain rules (no network, no model), finds the acceptance
criteria, and writes:

- `tests/acceptance/<name>.test.ts`: a `describe(<spec title>)` with one `it.todo('AC-NN ...')`
  per testable criterion.
- `tests/acceptance/<name>.checklist.md`: every criterion ID linked to its test, plus a
  **Needs clarification** section for vague criteria.
- `src/<name>.stubs.ts`: throwing stubs for functions, classes, interfaces and types the spec
  names, imported by the test file. Written only when the spec names some.

## Usage

```sh
npm ci && npm run build
node dist/cli.js docs/spec/login.md            # or: npx spec-to-tests docs/spec/login.md
node dist/cli.js docs/spec/login.md --out ../app --force
```

| Flag | Meaning |
| --- | --- |
| `--out <dir>` | Root to write `tests/` and `src/` under. Default: the current directory. |
| `--force` | Overwrite existing files. Without it the CLI exits 1 and writes nothing. |
| `--llm` | Stub: prints `LLM mode (local Ollama) not implemented yet` and uses the rules. |

Exit codes: 0 written, 1 a file already exists, 2 usage or read error.

## What counts as a criterion

1. Checklist items: `- [ ] ...` and `- [x] ...`.
2. Any line with the word MUST, SHOULD or SHALL (case-insensitive, whole word).
3. Bullets and numbered items under a heading matching `/acceptance criteria|AC|requirements/i`.

Code fences are skipped, duplicates (ignoring case and punctuation) are dropped, and IDs
`AC-01`, `AC-02`... follow document order.

A criterion is **vague** when it uses fast, quick, user-friendly, intuitive, easy, simple,
robust, scalable, efficient, seamless or responsive with no number or unit within 40
characters. Vague criteria get a commented note in the test file instead of a test, and a
line under "Needs clarification", so the tool never guesses at a bound.

Stubs come from backticked `name()` calls, `` `interface Foo` ``, `` `class Bar` ``,
`` `type Baz` ``, and declarations in a `ts` code block under a `## Interface` or `## API` heading.

## Example: mogesjohnson/shadow-army

Run against [shadow-army](https://github.com/mogesjohnson/shadow-army) at `ab04992`, from that
repo's root. Full output is in [`examples/`](examples/).

| Spec | Criteria | Vague | Stubs |
| --- | --- | --- | --- |
| `docs/adr/0012-local-only-post-office.md` | 1 | 0 | none |
| `docs/legacy/spec/shadow-army-2.0.md` | 25 | 0 | 10 (`authorize`, `canonicalPath`, `redact`...) |
| `docs/spec/v2.md` (not committed: 313 criteria) | 312 tests | 1 | 2 (`send`, `redact`) |

```console
$ node dist/cli.js docs/legacy/spec/shadow-army-2.0.md --out examples/legacy-spec-2.0
wrote examples/legacy-spec-2.0/tests/acceptance/shadow-army-2.0.test.ts
wrote examples/legacy-spec-2.0/tests/acceptance/shadow-army-2.0.checklist.md
wrote examples/legacy-spec-2.0/src/shadow-army-2.0.stubs.ts
```

```ts
describe('Shadow Army 2.0: Chat Harness Specification', () => {
  it.todo('AC-01 MUST, SHOULD and MAY follow RFC 2119.');
  it.todo('AC-04 CARD-1 A card MUST NOT take focus while the draft is non-empty or within 700 ms of a keystroke. ...');
```

From `docs/spec/v2.md`, the one vague criterion lands in the checklist, not in a test:

```md
## Needs clarification

- [ ] AC-251 The quick message. ... (vague: quick; spec line 366)
```

## Development

See [AGENTS.md](AGENTS.md) and [RULES.md](RULES.md). `npm test` runs the unit tests,
`npm run typecheck` the types, and `node scripts/setup-hooks.mjs` installs the commit hooks.

## Limits

- Rules only. A MUST line that is prose context (such as "MUST, SHOULD and MAY follow RFC
  2119") still becomes a criterion; delete it from the generated file.
- `--llm` is a stub. No watch mode, no npm release yet.
