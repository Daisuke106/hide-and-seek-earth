FROM node:22-alpine

WORKDIR /app

# 依存関係のキャッシュ用に先にpackage.jsonをコピー
COPY hns-frontend/package.json hns-frontend/package-lock.json* ./

RUN npm ci

COPY hns-frontend/ .

EXPOSE 3000

CMD ["npm", "start"]
