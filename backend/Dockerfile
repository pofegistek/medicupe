FROM node:20-bookworm-slim AS base
WORKDIR /app

COPY package.json tsconfig.json ./
COPY prisma ./prisma
RUN npm install

COPY src ./src
RUN npm run build
RUN npm run prisma:generate

EXPOSE 8080
CMD ["npm", "run", "start"]
