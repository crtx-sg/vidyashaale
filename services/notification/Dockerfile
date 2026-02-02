FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --loglevel=error

COPY . .
RUN npm run build

EXPOSE 8085

CMD ["node", "dist/index.js"]
