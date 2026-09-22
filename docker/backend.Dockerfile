FROM node:22.23.2-alpine AS build-stage

USER node

WORKDIR /home/node/app

# The backend package refers to validation through ../../validation.
COPY --chown=node:node user-office-core/validation ./user-office-core/validation
COPY --chown=node:node user-office-core/apps/backend/package*.json ./user-office-core/apps/backend/
COPY --chown=node:node user-office-core/apps/backend/openapi.yaml ./user-office-core/apps/backend/openapi.yaml

WORKDIR /home/node/app/user-office-core/apps/backend

RUN npm ci --loglevel error --no-fund
RUN npm run generate:uows

COPY --chown=node:node user-office-core/apps/backend/ ./

WORKDIR /home/node/app
COPY --chown=node:node package.json package-lock.json tsconfig.json ./
COPY --chown=node:node src ./src

WORKDIR /home/node/app/user-office-core/apps/backend
RUN npm run build

FROM node:22.23.2-alpine

USER node

WORKDIR /home/node/app

# This proof-of-concept image keeps ts-node available so the external DLS
# configuration can be loaded at runtime. A production image should compile
# the integration into the application build and omit development tooling.
COPY --from=build-stage --chown=node:node /home/node/app/user-office-core/validation ./user-office-core/validation
COPY --from=build-stage --chown=node:node /home/node/app/user-office-core/apps/backend ./user-office-core/apps/backend
COPY --from=build-stage --chown=node:node /home/node/app/src ./src
COPY --from=build-stage --chown=node:node /home/node/app/tsconfig.json ./tsconfig.json

WORKDIR /home/node/app/user-office-core/apps/backend

ENV NODE_ENV=production
ENV TS_NODE_PROJECT=/home/node/app/tsconfig.json
ENV DEPENDENCY_CONFIG=/home/node/app/src/config/dependencyConfig.ts

EXPOSE 4000

CMD ["node", "-r", "ts-node/register", "-r", "tsconfig-paths/register", "./build/index.js"]
