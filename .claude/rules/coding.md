# コーディング規約

## 共通原則

- コメントは「なぜ（WHY）」を書く。「何をしているか（WHAT）」はコードで表現する
- 変数名・関数名は意図が明確になるよう命名する
- 1関数の責務は1つに限定する
- 早期リターンを活用して深いネストを避ける

## PHP / Laravel

- PSR-12 コーディング標準に準拠する
- 型宣言を必ず付与する（引数・戻り値）
- `strict_types=1` を宣言する
- Eloquentのスコープを活用してクエリを整理する
- N+1問題を避けるため、Eagerロードを使用する

```php
<?php

declare(strict_types=1);

namespace App\Services;

class ExampleService
{
    public function execute(int $id): string
    {
        // 実装
    }
}
```

## TypeScript / フロントエンド

- `any` 型の使用を禁止する
- インターフェースで型を明示的に定義する
- コンポーネントはSingle Responsibility Principleに従う

## テスト

- 新機能には必ずテストを追加する
- テストはAAAパターン（Arrange, Act, Assert）で記述する
- モックは外部サービスとの境界でのみ使用する
- テストデータはFactoryを使用する

## セキュリティ

- SQLインジェクション対策: クエリにはEloquentまたはバインディングを使用する
- XSS対策: テンプレートでは必ずエスケープする
- ユーザー入力はバリデーションを必ず行う
- 機密情報はコードに直接書かない（`.env` を使用する）
