# Vercelへのフロントエンド公開

## 現在の公開先

- 公開アプリ: https://hide-and-seek-earth.vercel.app （GitHubリポジトリのWebsite登録先）
- 管理画面: https://vercel.com/daichaaaan-pj/hide-and-seek-earth （管理権限が必要）
- Vercelチーム: `daichaaaan-pj`
- プロジェクト名: `hide-and-seek-earth`

2026年10月24日、プロジェクト管理者より初回デプロイと実行成功の報告を受けています。
この確認はGitHub Actions経由のstaging/production公開や、Laravel API・DBを含む総合テストの完了を示すものではありません。

## デプロイ構成

React/ViteをVercelに配置します。LaravelとDBは配置しません。
push・マージ・タグ作成・Actionsの手動実行では公開しません。マージ済みPRへの新規コメントでのみ要求できます。
デプロイは現在のmain先端と一致するマージコミットだけを許可し、CI・セキュリティ監査・設定・API・公開候補の検証後に実行します。
認証情報がない場合は失敗し、公開したような成功表示はしません。

## 初回設定

1. Vercelにログインしてプロジェクトを作成します。GitHubからこのリポジトリをImportする場合、Root Directoryは必ず `hns-frontend` にします。
2. Framework PresetはVite、Node.jsは22.xにします。`vercel.json` によりインストールは `npm ci`、ビルドは `npm run build`、出力先は `build` になります。
3. VercelのEnvironment Variablesに、PreviewとProductionそれぞれの値を設定します。
   - `REACT_APP_API_URL`: 公開済みLaravel APIのHTTPS URL。末尾に `/api` を含め、末尾の `/` は付けません。
   - `REACT_APP_GOOGLE_MAPS_API_KEY`: ブラウザ用Google Maps APIキー。実際の公開ドメインにHTTPリファラー制限とAPI制限を設定します。
   - ブラウザに埋め込まれる `REACT_APP_*` にDBパスワードや秘密トークンを設定しないでください。
4. GitHubのSettings → Environmentsに `staging` と `production` を作成します。productionには必要に応じてRequired reviewersを設定してください。
5. 各EnvironmentのVariablesに次を設定します。
   - `VERCEL_ORG_ID`: VercelのTeam ID（個人アカウントも対象チームのID）。
   - `VERCEL_PROJECT_ID`: Project Settingsに表示されるProject ID。
   - `DEPLOY_API_URL`: この環境で承認した公開Laravel API URL。Vercelの `REACT_APP_API_URL` と完全一致させ、末尾を `/api` にします。
   - `DEPLOY_APP_ORIGIN`: この環境で確認するフロントエンドのHTTPS Origin（パスなし）。productionは `https://hide-and-seek-earth.vercel.app`、stagingは検証用Originを指定します。
6. 各EnvironmentのSecretsに `VERCEL_TOKEN` を登録します。VercelのAccount Settings → Tokensで、対象チームに権限のあるトークンを発行します。チャットやリポジトリには貼り付けません。
7. PreviewがDeployment Protectionで保護されている場合は、VercelのProtection Bypass for Automationを設定し、その値をGitHubの同じEnvironmentのSecret `VERCEL_AUTOMATION_BYPASS_SECRET` に登録します。未登録の保護ページは疎通確認に失敗します。閲覧する人にもVercel側のアクセス権が必要です。
8. 以下の確認項目を完了し、mainへのマージ後にPRコメントから要求します。

VercelからのGit自動デプロイは `git.deploymentEnabled: false` で停止し、GitHub Actionsの検証後に公開します。初回Importで設定前のデプロイが作られても、以降の公開はActionsを利用します。
IDはリポジトリのルートで `vercel link` を実行した場合の `.vercel/project.json` でも確認できます。このディレクトリはGit管理対象外です。

## 確認してからコマンドで公開する

コマンドの `--verified` は、実行者が次を確認したことを表します。単にコマンドへ付ければ自動で証明されるものではありません。

- Vercelのプロジェクト・チーム・環境が正しく、APIキーのHTTPリファラー制限、利用可能API、利用上限をGoogle Cloud側で確認した。
- 本番とstagingのAPI・DB・認証情報を適切に分離し、バックエンドの本番デバッグが無効で、アクセス制御・バックアップ・復旧方法を確認した。
- VercelのGit自動デプロイを無効化し、Deploy Hooksを削除した。他の公開用トークンや手動操作の権限も管理している。
- 本番要求時は、同じSHAのstagingで地図表示、ゲーム開始、キャラクター発見、結果保存、ランキングを確認した。API・Mapsキー・CORS等の本番固有設定も確認した。

1. PRをmainへマージします。この時点では公開されません。
2. そのマージコミットの40桁SHAを取得します（PRのブランチ先端SHAとは異なる場合があります）。mainに対する3つのCIワークフロー完了を待ちます。
3. リポジトリのwrite/maintain/admin権限を持つ人が、**マージ済みPRの通常コメント**へ次の1行を新規投稿します。`<40桁のSHA>` を実際の値に置き換えます。

   ```text
   /deploy staging <40桁のSHA> --verified
   ```

4. 実行Summaryに表示されるstaging URLで上記の操作を確認します。
5. staging実行が成功した後、本番の設定・操作確認を終えてから、新しいコメントで要求します。

   ```text
   /deploy production <同じ40桁のSHA> --verified
   ```

コマンドはコメント全体をこの1行にします。レビュー本文・通常Issue・Bot投稿・編集済みコメント・24時間以上経過した要求は利用できません。CI未完了なら拒否されるため、完了後に新しいコメントを投稿してください。権限・コメント・main・CIはEnvironment承認待ちやビルド後にも再確認します。途中でmainが進んだ場合は停止し、最新mainのPR・SHAを改めて確認してください。古いコミットの公開や自動マージは行いません。

GitHubのEnvironmentに設定したRequired reviewers等の保護ルールも適用されます。このワークフローはmainへのマージ後に初めてコメントを受け付けます。トークンやAPIキーをコメントへ貼り付けないでください。

## 自動検証と本番切り替え

- 最新main SHAで `ci.yml` / `ci-simple.yml` / `security.yml` のpush実行と必須ジョブがすべて成功していることを確認します。古い成功、実行中、必須ジョブのスキップは許可しません。
- npm監査（moderate以上を拒否）、フロントエンドテスト、ツールチェーン検証とデプロイ制御のテストを再実行します。
- Vercel APIでチーム・プロジェクトID、Root Directory、Vite、Node 22.xとDeploy Hooksの有無を確認します。
- API URLの承認値との一致、Mapsキーの形式、未知のブラウザ公開変数、デバッグ設定を検証します。環境変数や主要プロジェクト設定がビルド中に変わった場合は停止します。
- APIのhealth・characters・leaderboardのJSON応答とPOST用CORS preflightを確認します。DBに読み取りを行うcharacters等も確認し、healthの固定文字列だけでDB正常と判定しません。検証中にデータを書き換えません。
- 公開候補のトップ・game・leaderboard、JavaScriptの配信、セキュリティヘッダー、候補URLからAPIへのCORSを確認します。
- 本番も最初は `--prod --skip-domain` で候補だけ作成し、上記検証と最終確認に成功してから `vercel promote` で本番ドメインへ切り替えます。候補の検証に失敗した場合、本番ドメインは切り替えません。

Vercelの管理者による直接公開や別トークンからの操作まで、このGitHubワークフローで禁止することはできません。Vercel側のアクセス権・自動公開経路の管理も必要です。Google Cloudのキー制限、実ブラウザでのゲーム操作、バックアップ復旧は人の確認項目です。既存CIで失敗を無視する静的解析等は、この変更だけでは完全な安全性の証明にはなりません。

## CLIの実行場所と生成ファイル

VercelのRoot Directoryは `hns-frontend` のままにし、`vercel link` / `pull` / `build` / `deploy --prebuilt` はすべてリポジトリのルートから実行します。`cd hns-frontend` して実行すると、設定されたRoot Directoryが再び適用され、`hns-frontend/hns-frontend` を参照して失敗します。

- CLIの接続情報: `<リポジトリ>/.vercel/project.json`
- `vercel pull` の環境ファイル: `<リポジトリ>/.vercel/.env.preview.local` または `.env.production.local`
- `vercel build` の公開成果物: `<リポジトリ>/.vercel/output/`
- アプリの設定: `<リポジトリ>/hns-frontend/vercel.json`

ActionsのAPI設定検証もルートの `.vercel/` を読み、`deploy --prebuilt` は同じ場所の成果物を利用します。npmテストだけは `hns-frontend` で実行します。
アップロード除外設定 `.vercelignore` もCLIの実行場所であるリポジトリのルートに配置しています。

## 公開URLと確認範囲

公開URLはGitHub Actionsの実行SummaryとEnvironmentに表示されます。
stagingは毎回発行されるPreview URLです。固定の独自ドメインが必要な場合は、Vercelで所有ドメインを設定し、Previewへのalias管理を別途追加してください。
公開候補の自動検証範囲は上記のとおりです。ブラウザ操作とGoogle Mapsの実表示確認は、本番コマンドを投稿する前に人が行います。

Laravel側は、`DEPLOY_APP_ORIGIN` と実際の候補URLのOriginをCORSで明示的に許可してください（`*` は検証で拒否します）。Preview URLが毎回変わるため、管理するプロジェクトの候補Originだけを返すCORS設定が必要です。本番とstagingでDB・認証情報を分離します。
API未公開の段階では完全なゲーム動作は確認できません。Actionsは未設定・localhost・HTTPのAPI URLを拒否します。
React Routerの直接アクセスは `vercel.json` のSPA rewriteで処理します。`/api` はLaravelへ中継しないため、APIは設定した別Originを利用します。

## 公式ドキュメント

- https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel
- https://vercel.com/docs/frameworks/frontend/vite
- https://vercel.com/docs/project-configuration/git-configuration
- https://vercel.com/docs/monorepos#add-a-monorepo-through-vercel-cli
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issue_comment
- https://vercel.com/docs/cli/deploy#skip-domain
- https://vercel.com/docs/cli/promote
