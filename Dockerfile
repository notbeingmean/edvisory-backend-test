FROM node:alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./
COPY .env ./
COPY tsconfig.json ./

RUN pnpm install

COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
