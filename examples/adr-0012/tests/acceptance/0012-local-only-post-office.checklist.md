# 0012: A local-only post office with a secret for each start: acceptance checklist

Source: `docs/adr/0012-local-only-post-office.md`. Tests: [`0012-local-only-post-office.test.ts`](0012-local-only-post-office.test.ts).

## Criteria

- [ ] [AC-01](0012-local-only-post-office.test.ts#ac-01) Anything that can reach the post office, or a soldier's port, can make a soldier run commands on the owner's machine. A Claude Code mod can read a long-lived process's output, but writes its input only once. So the sessions must live in a separate process that the mod talks to. (test: `AC-01 Anything that can reach the post office, or a soldier's port, can make a soldier run commands on the owner's machine. A Claude Code mod can read a long-lived process's output, but writes its input only once. So the sessions must live in a separate process that the mod talks to.`, spec line 7)

## Needs clarification

None.
