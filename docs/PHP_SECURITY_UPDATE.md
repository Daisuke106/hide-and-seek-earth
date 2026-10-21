# PHP 8.5.12 セキュリティ更新

2026年10月21日（日本時間23時のリリース予定）に公開されたPHP 8.5.12を適用します。
公式情報: https://www.php.net/archive/2026.php
セキュリティ情報: https://www.php.net/

対象はCVE-2026-109618、CVE-2026-109619（認証不要のリモートコード実行）です。
DockerのPHP-FPM、CI、成果物のビルド環境を8.5.12に固定し、Composerでも8.5.12未満を拒否します。

## Docker環境への適用と確認

```bash
docker compose build --pull app
docker compose run --rm --no-deps app php -r 'exit(PHP_VERSION === "8.5.12" ? 0 : 1);'
docker compose run --rm --no-deps app composer install --no-interaction --prefer-dist
docker compose run --rm --no-deps app composer check-platform-reqs
docker compose run --rm --no-deps app php artisan test
docker compose up -d --no-deps --force-recreate app
docker compose exec app php -v
docker compose exec app php-fpm -v
```

テストは隔離した検証環境で実施してください。本番用の依存関係は `composer install --no-dev --optimize-autoloader` で導入します。
更新後は既存のPHP-FPMワーカーおよび常駐PHPプロセスをすべて再起動し、HTTP経由のヘルスチェックも実施します。

Docker以外の本番環境は、その環境のパッケージまたはPHPビルドを8.5.12へ更新する必要があります。
`.github/workflows/deploy.yml` のサーバー配備処理はプレースホルダーであり、この変更だけでは実サーバーのPHPは更新されません。

CIの必須チェックを設定している場合は、`Backend Tests (PHP 8.5.12)` に変更してください（`docs/BRANCH_PROTECTION.md`参照）。

## この作業環境での検証

- `composer validate --strict`: 成功。PHP本体の更新時は依存パッケージのバージョンを維持し、その後の依存ライブラリ修正で更新しています。
- `composer prohibits php 8.5.12 --locked`: PHPのバージョン制約による阻害なし。
- `DB_CONNECTION=sqlite DB_DATABASE=:memory: vendor/bin/phpunit`: 33テスト・188アサーション成功（PHP 8.2.31）。
- DockerとPHP 8.5.12が作業環境にないため、対象バージョンでのビルド・テスト・本番適用は未実施。
- 依存ライブラリ修正で、検出された6パッケージと関連依存2パッケージを同じメジャーバージョン内で更新しました。
- 更新後の `composer audit --locked` と `composer audit --locked --no-dev` はともに脆弱性検出0件。
- 更新後の既存テストも33テスト・188アサーション成功（PHP 8.2.31、PHPUnit 11.5.55）。PHP 8.5.12での確認はPR #167のCIで実施します。
