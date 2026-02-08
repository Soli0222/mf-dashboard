# セットアップ

## 必須要件

- [MoneyForward Me](https://moneyforward.com/) アカウント（ワンタイムパスワード設定済み）
- Docker / Docker Compose
- Kubernetes クラスター + Helm 3（本番デプロイ時）
- Node.js 22+ / pnpm 10+（開発時）

---

## 1. リポジトリのクローン

```sh
git clone https://github.com/<your-org>/mf-dashboard.git
cd mf-dashboard
pnpm install
```

---

## 2. MoneyForward Me の TOTP 設定

MoneyForward Me でワンタイムパスワードの設定を行います（[参考](https://support.me.moneyforward.com/hc/ja/articles/7359917171481-%E4%BA%8C%E6%AE%B5%E9%9A%8E%E8%AA%8D%E8%A8%BC%E3%81%AE%E8%A8%AD%E5%AE%9A%E6%96%B9%E6%B3%95)）。

設定時に表示される **TOTP シークレットキー**（`otpauth://` URI 内の `secret=` パラメータ）を控えておきます。これが `MF_TOTP_SECRET` 環境変数の値になります。

---

## 3. 環境変数の準備

### ローカル開発（Docker Compose）

`.config/` ディレクトリに以下の 2 ファイルを作成します。

```sh
mkdir -p .config
```

**`.config/postgres.env`:**

```env
POSTGRES_USER=mf
POSTGRES_PASSWORD=<your-password>
POSTGRES_DB=mf_dashboard
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

**`.config/apps.env`:**

```env
MF_USERNAME=<MoneyForward ログインメールアドレス>
MF_PASSWORD=<MoneyForward ログインパスワード>
MF_TOTP_SECRET=<TOTP シークレットキー>

# On-demand ISR（オプション）
REVALIDATION_URL=http://web:3000/api/revalidate
REVALIDATION_TOKEN=<任意のトークン文字列>

# Slack 通知（オプション）
SLACK_BOT_TOKEN=xoxb-xxxx
SLACK_CHANNEL_ID=C0XXXXXXX
DASHBOARD_URL=https://your-dashboard-url.example.com
```

---

## 4. ローカル開発

### Docker Compose で起動

```sh
# PostgreSQL + Web + Crawler をすべて起動
docker compose up -d

# Web のみ起動（DB + Web）
docker compose up -d db web

# クローラーを単発実行
docker compose up crawler
```

Web は http://localhost:3050 でアクセスできます。

### ネイティブ開発サーバー（ホットリロード）

```sh
# PostgreSQL だけ Docker で起動
docker compose up -d db

# .config/postgres.env のホストを localhost に変更して .env に設定
echo "POSTGRES_HOST=localhost" >> .env

# 開発サーバー起動
pnpm dev
```

---

## 5. Kubernetes デプロイ

### 前提

- Kubernetes クラスター
- Helm 3
- コンテナレジストリ（イメージをビルド & プッシュ済み）

### Secret の作成

```sh
kubectl create secret generic mf-dashboard-credentials \
  --from-literal=MF_USERNAME='<email>' \
  --from-literal=MF_PASSWORD='<password>' \
  --from-literal=MF_TOTP_SECRET='<totp-secret>' \
  --from-literal=REVALIDATION_TOKEN='<token>' \
  --from-literal=SLACK_BOT_TOKEN='<token>' \
  --from-literal=SLACK_CHANNEL_ID='<channel-id>'
```

### Helm Chart のインストール

```sh
helm install mf-dashboard charts/mf-dashboard \
  --set database.host=<postgres-host> \
  --set database.user=<user> \
  --set database.password=<password> \
  --set database.name=<db-name> \
  --set credentials.existingSecret=mf-dashboard-credentials
```

### values.yaml の主要設定

| キー                         | 説明                              | デフォルト      |
| ---------------------------- | --------------------------------- | --------------- |
| `crawler.image.repository`   | Crawler イメージ                  |                 |
| `web.image.repository`       | Web イメージ                      |                 |
| `cronjob.schedules`          | CronJob スケジュール（UTC）       | JST 6:50, 15:20 |
| `database.host`              | PostgreSQL ホスト                 |                 |
| `database.port`              | PostgreSQL ポート                 | `5432`          |
| `credentials.existingSecret` | 認証情報の既存 Secret 名          |                 |
| `slack.enabled`              | Slack 通知を有効化                | `false`         |
| `ingress.enabled`            | Ingress を有効化                  | `true`          |
| `crawler.initOnInstall`      | helm install 時に初回クロール実行 | `false`         |

---

## 6. Slack 通知（オプション）

更新結果を Slack に通知したい場合:

1. [Slack API](https://api.slack.com/apps) から Bot を作成
2. `chat:write` 権限を付与（OAuth & Permissions > Scopes）
3. Install App からトークン（`xoxb-` 開始）を取得
4. 投稿先チャンネルに Bot を招待

環境変数に `SLACK_BOT_TOKEN` と `SLACK_CHANNEL_ID` を設定します。
