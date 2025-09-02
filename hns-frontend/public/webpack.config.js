// 開発時のwebpack-dev-serverセキュリティ設定
// このファイルはCreate React Appでは通常使用されませんが、
// セキュリティ警告の緩和策として設定を記録します

module.exports = {
  devServer: {
    // 外部アクセスを無効化
    allowedHosts: 'auto',
    // ローカルホスト以外からのアクセスを拒否
    host: '127.0.0.1',
    // 予測可能でないポートを使用
    port: 'auto',
    // HTTPSを使用（オプション）
    // https: true,
  },
};