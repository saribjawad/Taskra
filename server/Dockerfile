FROM node:24 AS base

WORKDIR /app

COPY package*.json ./

EXPOSE 3000

RUN npm install

COPY . .

RUN npm run build

CMD ["node", "dist/server.js"]
