#!/usr/bin/env node
// spec-to-tests <spec.md> [--out dir] [--llm] [--force]
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { FileExistsError, generate } from './generate.js';

const USAGE = 'usage: spec-to-tests <spec.md> [--out dir] [--llm] [--force]';

export function main(argv: string[]): number {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        out: { type: 'string', short: 'o' },
        llm: { type: 'boolean' },
        force: { type: 'boolean', short: 'f' },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (e) {
    console.error(`spec-to-tests: ${(e as Error).message}\n${USAGE}`);
    return 2;
  }
  const { values, positionals } = parsed;
  if (values.help) { console.log(USAGE); return 0; }
  if (positionals.length !== 1) { console.error(USAGE); return 2; }
  try {
    generate(positionals[0], { out: values.out, llm: values.llm, force: values.force });
    return 0;
  } catch (e) {
    if (e instanceof FileExistsError) { console.error(`spec-to-tests: ${e.message}`); return 1; }
    console.error(`spec-to-tests: ${(e as Error).message}`);
    return 2;
  }
}

/** True when run as the CLI (also through npm's bin symlink), false when imported. */
export function isEntry(argv1 = process.argv[1], self = fileURLToPath(import.meta.url)): boolean {
  try {
    return !!argv1 && realpathSync(argv1) === realpathSync(self);
  } catch {
    return false;
  }
}

if (isEntry()) process.exitCode = main(process.argv.slice(2));
