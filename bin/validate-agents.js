#!/usr/bin/env node

/**
 * Valida que todos os agentes referenciados no AGENTS.md
 * possuem arquivo correspondente em .aios-core/development/agents/
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(ROOT, '.aios-core/development/agents');
const AGENTS_MD = path.join(ROOT, 'AGENTS.md');

const content = fs.readFileSync(AGENTS_MD, 'utf-8');

// Extrai nomes de agentes do AGENTS.md
const agentPattern = /`@(\w[\w-]*)`,/g;
const referenced = new Set();
let match;
while ((match = agentPattern.exec(content)) !== null) {
  referenced.add(match[1]);
}

let errors = 0;
let ok = 0;

for (const agent of referenced) {
  const file = path.join(AGENTS_DIR, `${agent}.md`);
  if (fs.existsSync(file)) {
    console.log(`  OK  @${agent} -> ${agent}.md`);
    ok++;
  } else {
    console.error(`  FAIL  @${agent} -> ${agent}.md (arquivo nao encontrado)`);
    errors++;
  }
}

// Verifica agentes existentes nao referenciados
const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
for (const file of files) {
  const name = file.replace('.md', '');
  if (!referenced.has(name)) {
    console.warn(`  WARN  ${file} existe mas nao esta referenciado no AGENTS.md`);
  }
}

console.log(`\n${ok} passed, ${errors} failed`);

if (errors > 0) {
  process.exit(1);
}

console.log('\nTodos os agentes validos!');
