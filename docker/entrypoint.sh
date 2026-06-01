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
if ! grep -q '^APP_KEY=base64:' .env; then
    php artisan key:generate --force
    echo "Application key generated"
fi

# MySQLの起動を待つ（最大60秒）
echo "Waiting for MySQL..."
RETRY=0
MAX_RETRY=30
until php -r "try { new PDO('mysql:host=${DB_HOST};port=${DB_PORT}', '${DB_USERNAME}', '${DB_PASSWORD}'); } catch (Exception \$e) { exit(1); }" 2>/dev/null; do
    RETRY=$((RETRY + 1))
    if [ "$RETRY" -ge "$MAX_RETRY" ]; then
        echo "ERROR: MySQL did not become ready after $((MAX_RETRY * 2)) seconds." >&2
        exit 1
    fi
    sleep 2
done
echo "MySQL is ready"

# マイグレーション実行
php artisan migrate --force

# キャッシュクリア
php artisan config:clear
php artisan cache:clear

exec "$@"
