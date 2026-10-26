// Ties extraction and rendering together and writes the files without clobbering any.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { extractCriteria } from './extract.js';
import { renderChecklist, renderTestFile } from './render.js';
import { findSymbols, renderStubs } from './stubs.js';

export interface GenerateOptions {
  out?: string;
  force?: boolean;
  llm?: boolean;
  log?: (msg: string) => void;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export class FileExistsError extends Error {}

export function plan(specPath: string, markdown: string, outDir = '.'): GeneratedFile[] {
  const name = basename(specPath, extname(specPath));
  const { title, criteria } = extractCriteria(markdown, name);
  const symbols = findSymbols(markdown);
  const testDir = join(outDir, 'tests', 'acceptance');
  const testPath = join(testDir, `${name}.test.ts`);
  const stubsPath = join(outDir, 'src', `${name}.stubs.ts`);
  const posix = (p: string) => p.split('\\').join('/');
  const stubsImport = symbols.length ? posix(relative(testDir, stubsPath)).replace(/\.ts$/, '') : undefined;
  const input = { title, specPath: posix(specPath), criteria, symbols, stubsImport };
  const files: GeneratedFile[] = [
    { path: testPath, content: renderTestFile(input) },
    { path: join(testDir, `${name}.checklist.md`), content: renderChecklist({ ...input, testFile: `${name}.test.ts` }) },
  ];
  if (symbols.length) files.push({ path: stubsPath, content: renderStubs(symbols, posix(specPath)) });
  return files;
}

export function generate(specPath: string, opts: GenerateOptions = {}): GeneratedFile[] {
  const log = opts.log ?? console.log;
  if (opts.llm) log('LLM mode (local Ollama) not implemented yet; falling back to rule-based extraction.');
  const files = plan(specPath, readFileSync(specPath, 'utf8'), opts.out ?? '.');
  const clash = files.filter((f) => existsSync(f.path));
  if (clash.length && !opts.force) {
    throw new FileExistsError(`refusing to overwrite (pass --force): ${clash.map((f) => f.path).join(', ')}`);
  }
  for (const f of files) {
    mkdirSync(dirname(f.path), { recursive: true });
    writeFileSync(f.path, f.content);
    log(`wrote ${f.path}`);
  }
  return files;
}
