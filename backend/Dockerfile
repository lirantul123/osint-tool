FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm install typescript ts-node --save-dev && npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]
