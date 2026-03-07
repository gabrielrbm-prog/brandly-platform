#!/bin/bash
set -e

echo "=== Brandly Platform Setup ==="
echo ""

# 1. Verificar .env
if [ ! -f .env ]; then
  echo "Criando .env a partir de .env.example..."
  cp .env.example .env
  echo "  IMPORTANTE: Edite .env com sua DATABASE_URL antes de continuar!"
  echo "  Exemplo Neon: postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/brandly?sslmode=require"
  echo ""
  read -p "Pressione ENTER quando tiver configurado o .env..."
fi

# 2. Instalar dependencias
echo ""
echo "Instalando dependencias..."
npm install

# 3. Gerar migrations
echo ""
echo "Gerando migrations do banco..."
cd packages/core
npx drizzle-kit generate
echo "  Migrations geradas em packages/core/drizzle/"

# 4. Rodar migrations
echo ""
echo "Aplicando migrations no banco..."
npx drizzle-kit migrate
echo "  Banco de dados atualizado!"

# 5. Seed
echo ""
echo "Populando banco com dados iniciais..."
npx tsx src/db/seed.ts

cd ../..

# 6. Validar estrutura
echo ""
echo "Validando estrutura AIOS..."
node bin/validate-structure.js
node bin/validate-agents.js

echo ""
echo "=== Setup concluido! ==="
echo ""
echo "Para iniciar a API:"
echo "  cd packages/api && npx tsx src/server.ts"
echo ""
echo "Endpoints disponiveis em http://localhost:3000/api"
echo "  POST /api/auth/register"
echo "  POST /api/auth/login"
echo "  GET  /api/health"
