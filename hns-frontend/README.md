# Frontend

Node.js 22系（22.12以降）を使用します。依存関係は `npm ci` でインストールしてください。

- `npm start`: Vite開発サーバー（http://localhost:3000）。`PORT`で変更できます。
- `npm run build`: TypeScript検証後、既存の配信先 `build/` へ本番ビルド。
- `npm test -- --watchAll=false`: Jestで既存テストを実行。監視は `npm test -- --watch`。
- `npm run test:toolchain`: 環境変数の公開範囲、SPAルート、静的アセット、APIプロキシの検証。
- `npm run lint`: ESLint検証。
- `npm run typecheck`: TypeScript検証。VercelのNative Deployment Checksでも使用します。
- `npm audit --audit-level=moderate`: 開発依存関係を含む脆弱性監査。

React Scripts 5由来の脆弱な依存関係を除くため、Viteと独立したJestへ移行しました。
既存の `REACT_APP_API_URL` と `REACT_APP_GOOGLE_MAPS_API_KEY` は引き続き利用できます。
`.env`、`.env.local`、モード別のenvファイルとシェル環境変数に対応し、シェル側を優先します。
`REACT_APP_` で始まる変数はブラウザに埋め込まれる公開情報です。秘密情報を設定しないでください。

開発時の `/api` は `REACT_APP_API_URL` の末尾の `/api` を除いたサーバーへ転送し、
未指定時は `http://localhost:8000` を使用します。`PUBLIC_URL` は配信時のベースパスに使えます。
既存のbrowserslist設定をViteのビルド対象へ変換し、対応ブラウザを維持します。

## Vercelでの計測と公開前チェック

`src/index.tsx` にReact用のWeb AnalyticsとSpeed Insightsを組み込んでいます。
Vercelのプロジェクトで両機能を有効にしたうえで、新しいコードをデプロイしてください。
Next.js用の `/next` ではなく `/react` を使用します。
ローカル開発ではSDKの開発モードが使われ、本番のアクセスとして送信されません。

Deployment ChecksはSettings > Build and Deployment > Deployment Checksで、
Vercelを提供元としてLintとTypecheckを追加し、本番への昇格を成功まで待機させます。
両チェックは `hns-frontend/package.json` の `lint` と `typecheck` を実行します。
GitHubのCIでは既存のテストとビルドも実行します。

公開後はサイトにアクセスし、ページ遷移や操作を行ってからAnalytics / Speed Insightsを確認します。
広告ブロッカーなどで計測スクリプトが遮断される場合はデータが届きません。

`npm warn deprecated` は依存パッケージの保守状況の警告で、ビルド失敗とは別です。
脆弱性の確認には `npm audit` を使用します。未確認の強制更新やインストールスクリプトの
一括許可を行わず、依存元ごとの更新・互換性確認を行ってください。
