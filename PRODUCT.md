# 地球全体でかくれんぼ (Hide and Seek with the Earth)

![地球全体でかくれんぼ](https://user-images.githubusercontent.com/12345/67890.png) 「地球全体でかくれんぼ」は、全世界のマップを舞台に、隠されたオリジナルキャラクターを探し出す、新感覚の探索ソーシャルゲームです。

## ✨ 主な機能 (Features)

本プロジェクトで実装を目指す主な機能です。

-   **グローバルマップ:** 全世界のマップが探索の舞台となります。
-   **キャラクター探索:** マップの様々な場所に隠された、ユニークなオリジナルキャラクターを探し出します。
-   **オンライン対戦モード (実装予定):**
    -   **タイムアタックモード:** 誰が一番早くキャラクターを見つけられるかを競います。
    -   **協力モード:** 仲間と協力して、一体のキャラクターを探し出します。
-   **コレクション機能 (実装予定):** 見つけたキャラクターを図鑑に登録し、コレクションする楽しみを提供します。

## 🛠️ 使用技術 (Technology Stack)

本プロジェクトは、モダンな技術スタックを採用し、フロントエンドとバックエンドを分離したSPA（シングルページアプリケーション）構成で開発されています。

### バックエンド (Backend)
-   **言語:** PHP 8.2+
-   **フレームワーク:** Laravel 11.x
-   **データベース:** MySQL
-   **環境:** Docker, Laravel Sail

### フロントエンド (Frontend)
-   **言語:** TypeScript
-   **フレームワーク:** React
-   **主要ライブラリ:**
    -   React Leaflet (地図描画)
    -   Axios (API通信)
    -   ESLint / Prettier (コーディング規約)

## 🚀 環境構築と起動方法 (Installation and Setup)

開発を始めるために、以下の手順に従ってローカル環境を構築してください。

### 前提条件
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/) がインストールされていること。
-   [Node.js](https://nodejs.org/) (v18.x 以上) と npm がインストールされていること。

### 1. リポジトリのクローン
```bash
git clone [https://github.com/daisuke106/hide-and-seek-earth.git](https://github.com/daisuke106/hide-and-seek-earth.git)
cd hide-and-seek-earth

2. バックエンド (Laravel) のセットアップ
本プロジェクトはLaravel Sailを利用してDocker環境を構築します。

# .envファイルの作成
cp .env.example .env

# Dockerコンテナを起動します（初回はビルドのため時間がかかります）
./vendor/bin/sail up -d

# Composerで依存パッケージをインストールします
./vendor/bin/sail composer install

# アプリケーションキーを生成します
./vendor/bin/sail artisan key:generate

# データベースのマイグレーションを実行します
./vendor/bin/sail artisan migrate

Note:
 ./vendor/bin/sail を sail だけで実行できるように、ターミナルにエイリアスを設定すると便利です。<br>
alias sail='[ -f sail ] && bash sail || bash vendor/bin/sail'

3. フロントエンド (React) のセットアップ
別のターミナルを開き、フロントエンドの依存関係をインストールして起動します。

# フロントエンドのディレクトリに移動
cd hns-frontend

# 依存パッケージをインストール
npm install

# 開発サーバーを起動
npm start

4. アプリケーションへのアクセス
上記の手順が完了すると、以下のURLでアプリケーションにアクセスできます。

フロントエンド: http://localhost:3000

バックエンドAPI: http://localhost/api

🧪 テストの実行方法 (Running Tests)
品質を保証するため、自動テストを導入しています。

バックエンド (PHPUnit)
# Laravelプロジェクトのルートで実行
./vendor/bin/sail artisan test

フロントエンド (React Testing Library)
# hns-frontend ディレクトリで実行
npm test

🤝 コントリビュート (Contributing)
本プロジェクトに興味がある方は、IssueやPull Requestをお待ちしております。開発に参加する際は、以下の点にご協力ください。

mainブランチから自身の作業ブランチを作成してください。

コーディング規約（ESLint, Prettier, PSR-12）に従って実装してください。

実装した機能に対応するテストコードを追加してください。

📜 ライセンス (License)
本プロジェクトは MIT License の下で公開されています。