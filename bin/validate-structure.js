#!/usr/bin/env node

/**
 * Valida a estrutura do projeto AIOS Brandly.
 * Verifica se todos os diretorios e arquivos obrigatorios existem.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const REQUIRED_PATHS = [
  '.aios-core/constitution.md',
  '.aios-core/development/agents/architect.md',
  '.aios-core/development/agents/dev.md',
  '.aios-core/development/agents/qa.md',
  '.aios-core/development/agents/pm.md',
  '.aios-core/development/agents/po.md',
  '.aios-core/development/agents/sm.md',
  '.aios-core/development/agents/analyst.md',
  '.aios-core/development/agents/devops.md',
  '.aios-core/development/agents/data-engineer.md',
  '.aios-core/development/agents/ux-design-expert.md',
  '.aios-core/development/agents/squad-creator.md',
  '.aios-core/development/agents/aios-master.md',
  'packages/shared/package.json',
  'packages/shared/src/index.ts',
  'packages/core/package.json',
  'packages/core/src/index.ts',
  'packages/bonus-engine/package.json',
  'packages/bonus-engine/src/index.ts',
  'packages/api/package.json',
  'packages/api/src/server.ts',
  'docs/stories',
  'tests',
  'AGENTS.md',
  'CLAUDE.md',
  'package.json',
  'tsconfig.json',
  'turbo.json',
];

let errors = 0;
let ok = 0;

for (const p of REQUIRED_PATHS) {
  const full = path.join(ROOT, p);
  if (fs.existsSync(full)) {
    console.log(`  OK  ${p}`);
    ok++;
  } else {
    console.error(`  FAIL  ${p}`);
    errors++;
  }
}

console.log(`\n${ok} passed, ${errors} failed`);

if (errors > 0) {
  process.exit(1);
}

console.log('\nEstrutura AIOS valida!');
