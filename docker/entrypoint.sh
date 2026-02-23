#!/bin/bash
set -e

# .envが存在しない場合は.env.exampleからコピー
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env file created from .env.example"
fi

# Composer依存関係のインストール
if [ ! -d vendor ] || [ ! -f vendor/autoload.php ]; then
    composer install --no-interaction --prefer-dist
fi

# アプリケーションキーが未設定の場合は生成
if [ -z "$(grep '^APP_KEY=base64:' .env)" ]; then
    php artisan key:generate --force
    echo "Application key generated"
fi

# MySQLの起動を待つ
echo "Waiting for MySQL..."
while ! php -r "try { new PDO('mysql:host=${DB_HOST};port=${DB_PORT}', '${DB_USERNAME}', '${DB_PASSWORD}'); echo 'ok'; } catch (Exception \$e) { exit(1); }" 2>/dev/null; do
    sleep 2
done
echo "MySQL is ready"

# マイグレーション実行
php artisan migrate --force

# キャッシュクリア
php artisan config:clear
php artisan cache:clear

exec "$@"
