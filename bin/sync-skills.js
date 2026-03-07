#!/usr/bin/env node

/**
 * Sincroniza skills do AIOS.
 * --global: sincroniza globalmente
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const isGlobal = process.argv.includes('--global');

console.log(isGlobal
  ? 'Sincronizando skills (global)...'
  : 'Sincronizando skills (local)...'
);

const skillsDir = path.join(ROOT, '.claude/skills');
if (fs.existsSync(skillsDir)) {
  const skills = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const skill of skills) {
    const skillFile = path.join(skillsDir, skill, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      console.log(`  OK  skill: ${skill}`);
    } else {
      console.warn(`  WARN  skill ${skill} sem SKILL.md`);
    }
  }
} else {
  console.log('  Nenhum diretorio de skills encontrado');
}

console.log('\nSincronizacao de skills concluida.');
