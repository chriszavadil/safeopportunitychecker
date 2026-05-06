FROM node:24-slim

ENV NODE_ENV=production
WORKDIR /app

COPY . .

EXPOSE 3000
CMD ["node", "apps/api/src/server.js"]
