FROM node:20-alpine

RUN apk add --no-cache jq

WORKDIR /app

# 依存関係のキャッシュ用に先にpackage.jsonをコピー
COPY hns-frontend/package.json hns-frontend/package-lock.json* ./

# react-scripts 5.0.1はwebpack-dev-server v4 APIを使用するため、
# overridesのwebpack-dev-server>=5指定を除去してインストール
RUN jq 'del(.overrides["webpack-dev-server"]) | del(.resolutions["webpack-dev-server"])' package.json > package.tmp.json \
    && mv package.tmp.json package.json \
    && npm install

COPY hns-frontend/ .

EXPOSE 3000

CMD ["npm", "start"]
