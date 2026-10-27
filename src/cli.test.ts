// End-to-end tests of the CLI entry (main) on a temp spec: exit codes, files, --force, stubs import.
import { existsSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isEntry, main } from './cli.js';

const SPEC = `# Billing spec

Expose \`chargeCard()\` from a \`class Billing\`.

## Acceptance criteria

- [ ] A declined card returns an error code
- [ ] The receipt is intuitive
`;

let dir: string;
let spec: string;
let out: string;
const quiet = () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  return vi.spyOn(console, 'error').mockImplementation(() => {});
};

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'stt-cli-'));
  spec = join(dir, 'billing.md');
  out = join(dir, 'out');
  writeFileSync(spec, SPEC);
});
afterEach(() => vi.restoreAllMocks());

describe('main', () => {
  it('writes the test, checklist and stubs and exits 0', () => {
    quiet();
    expect(main([spec, '--out', out])).toBe(0);
    for (const f of ['tests/acceptance/billing.test.ts', 'tests/acceptance/billing.checklist.md', 'src/billing.stubs.ts']) {
      expect(existsSync(join(out, f)), f).toBe(true);
    }
    const t = readFileSync(join(out, 'tests/acceptance/billing.test.ts'), 'utf8');
    expect(t).toContain("it.todo('AC-01 A declined card returns an error code')");
    expect(t).toContain('// AC-02 needs clarification');
  });

  it('refuses to overwrite with exit 1, names the files, and leaves them untouched', () => {
    const err = quiet();
    expect(main([spec, '-o', out])).toBe(0);
    const testFile = join(out, 'tests/acceptance/billing.test.ts');
    writeFileSync(testFile, 'hand edits');
    expect(main([spec, '-o', out])).toBe(1);
    expect(String(err.mock.calls.at(-1)?.[0])).toMatch(/refusing to overwrite \(pass --force\):.*billing\.test\.ts/);
    expect(readFileSync(testFile, 'utf8')).toBe('hand edits');
  });

  it('--force (and -f) overwrites', () => {
    quiet();
    const testFile = join(out, 'tests/acceptance/billing.test.ts');
    expect(main([spec, '--out', out])).toBe(0);
    writeFileSync(testFile, 'hand edits');
    expect(main([spec, '--out', out, '--force'])).toBe(0);
    expect(readFileSync(testFile, 'utf8')).toContain('it.todo(');
    writeFileSync(testFile, 'again');
    expect(main([spec, '--out', out, '-f'])).toBe(0);
    expect(readFileSync(testFile, 'utf8')).not.toBe('again');
  });

  it('the generated test imports the stubs file it wrote', () => {
    quiet();
    main([spec, '--out', out]);
    const testFile = join(out, 'tests/acceptance/billing.test.ts');
    const m = readFileSync(testFile, 'utf8').match(/import \{ ([^}]+) \} from '([^']+stubs[^']*)'/);
    expect(m?.[1]).toBe('chargeCard, Billing');
    const target = resolve(dirname(testFile), m![2].replace(/\.js$/, '.ts'));
    expect(target).toBe(join(out, 'src/billing.stubs.ts'));
    const stubs = readFileSync(target, 'utf8');
    expect(stubs).toContain('export function chargeCard(');
    expect(stubs).toContain('export class Billing');
  });

  it('exits 2 with usage on bad arguments or a missing spec', () => {
    const err = quiet();
    expect(main([])).toBe(2);
    expect(main(['a.md', 'b.md'])).toBe(2);
    expect(main([spec, '--nope'])).toBe(2);
    expect(String(err.mock.calls[0]?.[0])).toContain('usage: spec-to-tests');
    expect(main([join(dir, 'missing.md')])).toBe(2);
  });

  it('--help prints usage and exits 0', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(main(['--help'])).toBe(0);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('usage: spec-to-tests'));
  });
});

describe('isEntry', () => {
  const self = fileURLToPath(new URL('./cli.ts', import.meta.url));
  it('is false when imported (as here) and true for the file itself or a symlink to it', () => {
    expect(isEntry()).toBe(false);
    expect(isEntry(undefined, self)).toBe(false);
    expect(isEntry(self, self)).toBe(true);
    const link = join(dir, 'spec-to-tests');
    let linked = true;
    try {
      symlinkSync(self, link);
    } catch (e) {
      // Windows without Developer Mode or admin cannot create symlinks.
      if ((e as NodeJS.ErrnoException).code !== 'EPERM') throw e;
      linked = false;
    }
    if (linked) expect(isEntry(link, self)).toBe(true);
    expect(isEntry(join(dir, 'nope'), self)).toBe(false);
  });
});
