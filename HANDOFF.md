# GEO Monitor — セッション引き継ぎ指示書

## プロジェクト概要
AI検索時代における企業のブランド可視性を分析するSaaS「GEO Monitor」。
場所: `/Users/kimuratakezou/stock value/geo-monitor/`

## アーキテクチャ
```
Next.js (Vercel) ←→ 44 REST API (/api/v1/) ←→ FastAPI (Python) ←→ Supabase (PostgreSQL)
```
- **フロント**: Next.js App Router + Tailwind + Recharts（20ページ）
- **API**: Next.js Route Handlers (CRUD) + FastAPI (重い処理)
- **DB**: Supabase（16テーブル + RLS）
- **AI**: 6プラットフォーム対応（ChatGPT/Gemini/Claude/Perplexity/Grok/DeepSeek）
- **デプロイ**: Vercel https://geo-monitor-web.vercel.app/
- **GitHub**: https://github.com/tkimurabusiness-debug/geo-monitor

## 完了済み（Step 1-11 + セットアップ）
- ✅ 全20ページUI（モックデータ付き）
- ✅ 44 REST APIエンドポイント（デュアル認証: session + API key）
- ✅ FastAPI 12内部エンドポイント（診断/モニタリング/SEO/競合/アラート/施策/コンテンツ/レポート）
- ✅ Supabase接続済み（16テーブル + テストデータ投入済み）
- ✅ Vercelデプロイ済み
- ✅ ChatGPT/Gemini Playwrightスクレイパー（APIキー優先、なければスクレイパー）
- ✅ useFetch/useMutationフック（mock/real自動切替）
- ✅ ダッシュボード + サイト管理ページを実データAPI接続済み

## Supabase テストデータ
```
URL: https://fzvropzggykofndzqrqv.supabase.co
User: 92007ec0-8e64-4ddb-8de1-9b85bb90efbd (geomonitor.test@gmail.com / testpass123)
Org:  4d31aad2-9a15-4c86-8dc3-476772bfcae0 (Stock Value テスト, plan: pro)
Site: f8bb8e46-0158-4bdf-93f9-4eeebffd7229 (stock-value.pages.dev)
Diagnosis: readiness 62.2/100, 50KW抽出済み
Keywords: 2件登録済み (note運用代行, GEO対策)
```

## 環境変数
- `apps/web/.env.local` — Supabase URL/キー設定済み、NEXT_PUBLIC_USE_MOCK=true
- `api/.env` — Supabase URL/キー設定済み、AIのAPIキーは未設定

## 起動方法
```bash
# Next.js
cd apps/web && npm run dev

# FastAPI
cd api && source .venv/bin/activate && uvicorn app.main:app --port 8000 --reload

# FastAPI Swagger: http://localhost:8000/docs
```

## スクレイパーのログイン
```bash
cd api && source .venv/bin/activate
python scripts/save_browser_session.py chatgpt   # ブラウザでログイン→Enter
python scripts/save_browser_session.py gemini     # 同上
# セッションは api/sessions/ に保存される
```

## 次にやるべきこと（優先順）

### 1. AIプラットフォームのAPIキー取得
スクレイピングはCloudflareのボット検出でブロックされるため、APIキーが必要。

**Gemini（最優先・無料）**: https://aistudio.google.com/apikey → APIキー取得（クレカ不要、30秒）
→ `api/.env` の `GOOGLE_AI_API_KEY=` に設定

**ChatGPT（任意）**: https://platform.openai.com/api-keys → APIキー取得（初回$5無料クレジット）
→ `api/.env` の `OPENAI_API_KEY=` に設定

※スクレイパーコードは骨格として保持。Cloudflare回避が解決すれば使える。

### 2. 残りのフロントページを実データ接続
現状: dashboard, sites のみ接続済み。残り:
- `/diagnosis` — `useFetch('/sites/{siteId}/diagnosis', mockDiagnosis)` に変更
- `/onboarding` — `api.post('/sites')` → `api.post('/sites/{id}/diagnosis/run')` → 結果表示
- `/keywords` — `useFetch('/sites/{siteId}/keywords', mockKeywords)` に変更
- `/monitoring` — `useFetch('/sites/{siteId}/monitoring/matrix', mockMatrix)` に変更

パターン: 各ページの `mockXxx` import を `useFetch(path, mockXxx)` に置き換え。
mock=true時は従来のモックデータ、false時はAPIから取得。

### 3. mock=false での統合テスト
`.env.local` の `NEXT_PUBLIC_USE_MOCK=false` にして:
1. `/login` → Supabase Auth ログイン
2. `/dashboard` → 実データKPI
3. `/sites` → 実サイト一覧
4. `/diagnosis` → 実診断結果

### 4. Railway にFastAPIデプロイ
ローカルテスト完了後、`api/` を Railway にDockerデプロイ。
Vercelの `FASTAPI_URL` 環境変数をRailwayのURLに変更。

## 重要なファイル
| ファイル | 役割 |
|---------|------|
| `apps/web/src/hooks/use-fetch.ts` | データフェッチフック（mock/real切替） |
| `apps/web/src/lib/api-client/client.ts` | REST APIクライアント |
| `apps/web/src/app/api/v1/_lib/auth.ts` | デュアル認証（session + API key） |
| `apps/web/src/app/api/v1/_lib/response.ts` | 統一JSONレスポンス |
| `apps/web/src/app/api/v1/_lib/fastapi-proxy.ts` | Next.js→FastAPIプロキシ |
| `api/app/main.py` | FastAPIエントリ + Provider登録 |
| `api/app/services/providers/base.py` | AIProvider ABC + Registry |
| `api/app/services/providers/chatgpt_scraper.py` | ChatGPTスクレイパー |
| `api/app/services/providers/gemini_scraper.py` | Geminiスクレイパー |
| `api/app/services/diagnosis/service.py` | 診断オーケストレーション |
| `supabase/migrations/001_initial_schema.sql` | DBスキーマ（16テーブル） |

## デザイン決定事項
- ライトモード基調（白ベース管理画面）
- AI色: ChatGPT=緑, Gemini=青, Claude=オレンジ, 残り=グレー
- 並び順固定: ChatGPT → Gemini → Claude → Perplexity → Grok → DeepSeek
- 文字サイズ大きめ（globals.cssでtext-xs:13px, text-sm:15px等にオーバーライド済み）
- ダッシュボード上部にAIプラットフォーム選択チェックボックス（デフォルト: GPT/Gemini/Claude ON）
- 全ページURL直アクセス可能（認証ブロックなし、開発時）
