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
mainへのpushはstaging（Vercel Preview）、手動実行はstaging/productionを選択できます。
デプロイはmainのみ許可し、監査・フロントエンドテストが成功した後に実行します。
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
6. 各EnvironmentのSecretsに `VERCEL_TOKEN` を登録します。VercelのAccount Settings → Tokensで、対象チームに権限のあるトークンを発行します。チャットやリポジトリには貼り付けません。
7. PreviewがDeployment Protectionで保護されている場合は、VercelのProtection Bypass for Automationを設定し、その値をGitHubの同じEnvironmentのSecret `VERCEL_AUTOMATION_BYPASS_SECRET` に登録します。未登録の保護ページは疎通確認に失敗します。閲覧する人にもVercel側のアクセス権が必要です。
8. mainへマージ後、GitHub Actions → Deploy to Vercel → Run workflow → main / stagingを選択します。

VercelからのGit自動デプロイは `git.deploymentEnabled: false` で停止し、GitHub Actionsの検証後に公開します。初回Importで設定前のデプロイが作られても、以降の公開はActionsを利用します。
IDはリポジトリのルートで `vercel link` を実行した場合の `.vercel/project.json` でも確認できます。このディレクトリはGit管理対象外です。

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
URLを表示するだけではなく、トップページと `/leaderboard` がHTMLを返すことまで確認します。
ゲーム操作、Google Mapsの表示、Laravel API接続の総合テストは含みません。

Laravel側は、フロントエンドの公開OriginをCORSで許可してください。本番とstagingでDB・認証情報を分離します。
API未公開の段階では完全なゲーム動作は確認できません。Actionsは未設定・localhost・HTTPのAPI URLを拒否します。
React Routerの直接アクセスは `vercel.json` のSPA rewriteで処理します。`/api` はLaravelへ中継しないため、APIは設定した別Originを利用します。

## 公式ドキュメント

- https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel
- https://vercel.com/docs/frameworks/frontend/vite
- https://vercel.com/docs/project-configuration/git-configuration
- https://vercel.com/docs/monorepos#add-a-monorepo-through-vercel-cli
