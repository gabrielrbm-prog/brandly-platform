FROM node:20-alpine AS base

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

FROM node:20-alpine AS production

WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/package.json ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "packages/api/dist/server.js"]
