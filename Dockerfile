FROM node:20-alpine AS base

WORKDIR /app

# Força instalar todas as deps (incluindo devDeps) durante o build
ENV NODE_ENV=development

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/core/package.json packages/core/
COPY packages/bonus-engine/package.json packages/bonus-engine/
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/

RUN npm install

COPY . .

# Build tudo (shared, core, bonus-engine, api, web)
RUN npm run build

# Verifica que o web dist foi criado
RUN ls -la packages/web/dist/index.html

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/package.json ./
COPY --from=base /app/package-lock.json* ./

# Copia package.json de cada workspace para npm install --omit=dev
COPY --from=base /app/packages/shared/package.json packages/shared/
COPY --from=base /app/packages/core/package.json packages/core/
COPY --from=base /app/packages/bonus-engine/package.json packages/bonus-engine/
COPY --from=base /app/packages/api/package.json packages/api/
COPY --from=base /app/packages/web/package.json packages/web/

RUN npm install --omit=dev

# Copia o código buildado
COPY --from=base /app/packages/shared/dist packages/shared/dist
COPY --from=base /app/packages/core/dist packages/core/dist
COPY --from=base /app/packages/bonus-engine/dist packages/bonus-engine/dist
COPY --from=base /app/packages/api/dist packages/api/dist
COPY --from=base /app/packages/web/dist packages/web/dist

# Copia package.json dos packages (necessário para imports)
COPY --from=base /app/packages/shared/package.json packages/shared/
COPY --from=base /app/packages/core/package.json packages/core/
COPY --from=base /app/packages/bonus-engine/package.json packages/bonus-engine/
COPY --from=base /app/packages/api/package.json packages/api/

EXPOSE 3000

CMD ["node", "packages/api/dist/server.js"]
