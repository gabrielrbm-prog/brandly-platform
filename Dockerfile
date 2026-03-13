FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/core/package.json packages/core/
COPY packages/bonus-engine/package.json packages/bonus-engine/
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/
COPY packages/mobile/package.json packages/mobile/

RUN npm install --ignore-scripts

COPY . .

RUN npx turbo run build --filter=@brandly/api --filter=@brandly/web

# Confirma que web dist existe
RUN ls -la packages/web/dist/index.html && echo "✅ Web dist OK"
RUN ls -la packages/api/dist/server.js && echo "✅ API dist OK"

# Remove devDependencies
RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "packages/api/dist/server.js"]
