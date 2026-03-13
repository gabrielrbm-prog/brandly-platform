FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/core/package.json packages/core/
COPY packages/bonus-engine/package.json packages/bonus-engine/
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/

RUN npm install

COPY . .

RUN npm run build

# Confirma que web dist existe
RUN ls packages/web/dist/index.html && echo "Web dist OK"

# Remove devDependencies para reduzir tamanho
RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "packages/api/dist/server.js"]
