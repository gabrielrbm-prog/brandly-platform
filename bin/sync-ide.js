#!/usr/bin/env node

/**
 * Sincroniza configuracoes IDE com o projeto AIOS.
 * --check: apenas verifica sem modificar
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const checkOnly = process.argv.includes('--check');

console.log(checkOnly
  ? 'Verificando sincronizacao IDE...'
  : 'Sincronizando configuracoes IDE...'
);

// Verifica se .vscode/settings.json existe
const vscodeDir = path.join(ROOT, '.vscode');
const settingsPath = path.join(vscodeDir, 'settings.json');

if (!fs.existsSync(settingsPath)) {
  if (checkOnly) {
    console.log('  WARN  .vscode/settings.json nao encontrado');
  } else {
    fs.mkdirSync(vscodeDir, { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify({
      "typescript.tsdk": "node_modules/typescript/lib",
      "editor.formatOnSave": true,
      "editor.defaultFormatter": "esbenp.prettier-vscode"
    }, null, 2));
    console.log('  OK  .vscode/settings.json criado');
  }
} else {
  console.log('  OK  .vscode/settings.json existe');
}

console.log('\nSincronizacao IDE concluida.');
