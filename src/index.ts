// spec-to-tests: public library entry point.
export const VERSION = '0.1.0';
export { extractCriteria, type Criterion, type ExtractResult } from './extract.js';
export { isVague, vagueWords } from './vague.js';
export { findSymbols, renderStubs, type StubSymbol } from './stubs.js';
export { renderChecklist, renderTestFile } from './render.js';
export { generate, plan, FileExistsError } from './generate.js';
