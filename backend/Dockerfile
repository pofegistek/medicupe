FROM node:20-bookworm-slim AS base
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json tsconfig.json ./
COPY prisma ./prisma
RUN npm install

COPY src ./src
RUN npm run build
RUN npm run prisma:generate

EXPOSE 8080
CMD ["npm", "run", "start"]
