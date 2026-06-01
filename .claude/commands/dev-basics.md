# dev-basics

開発環境のセットアップと基本操作を確認するためのコマンドです。

## 使い方

```
/dev-basics
```

## 処理内容

1. 必要な環境変数が設定されているか確認する
2. Dockerコンテナの起動状態を確認する
3. データベース接続を確認する
4. フロントエンドのビルド状態を確認する

## 開発サーバー起動手順

```bash
# Dockerコンテナ起動
docker-compose up -d

# バックエンド依存パッケージインストール
composer install

# フロントエンド依存パッケージインストール
npm install

# フロントエンド開発サーバー起動
npm run dev
```

## よく使うコマンド

| コマンド | 説明 |
|---|---|
| `php artisan migrate` | マイグレーション実行 |
| `php artisan test` | テスト実行 |
| `npm run build` | フロントエンドビルド |
| `docker-compose logs -f` | ログ確認 |
