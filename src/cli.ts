#!/usr/bin/env node
// spec-to-tests <spec.md> [--out dir] [--llm] [--force]
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

process.exitCode = main(process.argv.slice(2));
