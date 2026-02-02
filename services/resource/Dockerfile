FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --loglevel=error

COPY . .
RUN npm run build

RUN mkdir -p /data/uploads

EXPOSE 8084

CMD ["node", "dist/index.js"]
