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

# Build em ordem de dependencia (sem turbo)
RUN npm run build -w packages/shared && \
    npm run build -w packages/bonus-engine && \
    npm run build -w packages/core && \
    npm run build -w packages/api && \
    npm run build -w packages/web

# Confirma que dist existe
RUN ls packages/web/dist/index.html && echo "Web OK" && \
    ls packages/api/dist/server.js && echo "API OK"

# Remove devDeps
RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "packages/api/dist/server.js"]
