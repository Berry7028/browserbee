# 実装計画

## ゴール

- `playwright-crx`に依存した仮想ページ制御を廃止し、アクティブタブへ常駐するコンテンツスクリプト経由で同等以上の操作を提供する。
- バックグラウンド(service worker)とコンテンツスクリプト間のRPCレイヤーを整備し、既存のエージェント／ツール呼び出しフローを破壊せずに差し替える。
- マウス・キーボード・DOM操作を最低限の品質で提供しつつ、リスクの高い操作は段階的に導入できる設計にする。

## 参照ドキュメント

- Context7 MCP経由で確認: Chrome Extensions Scripting API `chrome.scripting.executeScript`（Promiseベースの挿入・実行仕様、[developer.chrome.com/docs/extensions/reference/api/scripting](https://developer.chrome.com/docs/extensions/reference/api/scripting)）

## 現状分析

- Playwright依存モジュール: `src/agent/AgentCore.ts`、`ToolManager.ts`、`PageContextManager.ts`、`agent/tools/**`、`background/tabManager.ts`、`background/agentController.ts`、`tracking/screenshotManager.ts`が`Page`オブジェクトに直接依存。
- ツール群はPlaywrightの`page.*` APIを全面使用（クリック/キーボード/スクリーンショット/AXツリー等）。Tab操作系もPlaywrightコンテキストからタブ一覧を取得している。
- テスト基盤は`tests/mocks/playwright.ts`や各種ツールテストがPlaywrightモックを前提に構築されている。
- ビルド構成(`vite.config.ts`)はPlaywright排他設定を含み、`manifest.json`には`debugger`権限が残っている。`package.json`でも依存が宣言されている。

## 方針の概要

- 新しい「タブ操作ブリッジ」抽象を定義し、既存の`ToolManager`/ツール層はこの抽象にのみ依存する構造へ変更する。
- コンテンツスクリプトはタブごとに常駐させ、`chrome.runtime.connect`等の永続ポートで背景スレッドと通信する。DOM操作・イベント観測はコンテンツ側、Chrome APIを必要とする操作（タブ制御、スクリーンショット）は背景側で処理する。
- 既存UI/LLMフローは変えず、適応層のみ差し替えられるように段階的に切り替える（必要ならPlaywrightパスをフラグで残す）。

## 実装ステップ

1. [x] **Playwright依存の棚卸しとインターフェース定義**
   - 依存箇所を列挙し、各関数で必要な機能（DOM選択、入力、ナビゲーション、スクリーンショット、AX取得等）を整理。
   - 新しい`TabBridge`(仮称)インターフェースで提供すべきメソッドセットと戻り値/例外モデルを定義。
   - `BrowserTool`と`ToolManager`が直接Playwright型に触れないよう型を差し替える準備を行う。
2. [x] **エージェント層の抽象刷新**
   - `AgentCore`/`ToolManager`/`PageContextManager`を`TabBridge`ベースに改修し、現在の`withActivePage`ヘルパーを新しいセッション管理に置き換える。
   - `AgentCore.createBrowserAgent`でPlaywrightページを受け取らず、ウィンドウID/タブIDベースで初期化できるようにする。
3. [x] **コンテンツスクリプト実装**
   - `src/contentScript/index.ts`（新規エントリ）を作成し、Viteビルドに追加する。
   - メッセージプロトコル（request/response ID、エラー、ストリーム通知）と型を`types/bridge.ts`等に定義。
   - DOM操作API（要素検索、テキスト抽出、属性取得、PointerEvent送出等）を実装。iframe対応やフォールバックのルールを決める。
   - ナビゲーション検知、URL変化、ダイアログ検知などイベントを背景側へpushする仕組みを整備。
4. [x] **バックグラウンド側のルーティング改修**
   - `tabManager`を`Playwright`不要な実装へ書き換え、タブへのコンテンツスクリプト注入・再注入・ポート再接続を管理する。
   - `agentController`/`messageHandler`でツール実行要求を`TabBridge`経由で送出する処理に差し替える。
   - `chrome.tabs.*`/`chrome.scripting.executeScript`を利用した補助関数を追加し、Playwright関連のリソース初期化/リセット処理を削除。
5. [x] **ツール実装の移植**
   - **操作系**（click/type/keyboard/mouse）: コンテンツスクリプト側のDOM/Pointer APIを呼び出すRPCに張り替え。
   - **ナビゲーション系**: `chrome.tabs.update`・`history`操作・`chrome.tabs.onUpdated`を組み合わせて実装。`browser_wait_for_navigation`はイベント待ち＋タイムアウト制御で代替。
   - **観測系**: DOMスナップショット/テキスト抽出はコンテンツスクリプトで実行。`browser_accessible_tree`はPlaywright同等 API が無いため、`Role/Name`推定の簡易実装とし、完全互換は非目標と明記。
   - **タブ管理系**: Playwrightページ列挙の代わりに`chrome.tabs.*`で実装し、背景側管理情報と同期。
   - **メモリツール**は既存ロジック流用可能だが、新インターフェースに合わせて軽微修正。
6. [x] **補助機能とデータパイプラインの調整**
   - `ScreenshotManager`を`chrome.tabs.captureVisibleTab`ベースに変更し、必要に応じてコンテンツ側で`getBoundingClientRect`を取得して切り抜き情報を返す。
   - ハイライト/要素座標返却、スクロール操作など継続操作のためのユーティリティを整備。
   - 失敗時リトライ/フォールバック（例: 直接`element.click()`とPointerEvent併用）を盛り込む。
7. [x] **ビルド・テスト・ロールアウト**
   - `manifest.json`から`debugger`権限を外し、`scripting`権限を明示。ビルド設定に新しいエントリを追加し、`package.json`から`playwright-crx`を削除。
   - テスト: 既存Playwrightモックを`TabBridge`モックへ移行し、ツール単体テストをRPC想定に合わせて書き換える。統合テストでRPC経路のハッピーパス/エラーを検証。
   - 段階的リリース用にフラグを設け、必要であればPlaywright経路を暫定的に残す。

## 実装したい機能の具体的な内容

- DOM要素の検索・読み取り、属性取得、テキスト抽出（コンテンツスクリプトで実行し、サイズ制限付きで返却）。
- クリック/フォーカス/入力/スクロール/ナビゲーション等の基本操作をRPC経由で提供。
- スクリーンショット・要素位置・ビューポート情報を取得し、`ScreenshotManager`でハンドル化してLLM出力に利用。
- `browser_accessible_tree`は完全なAXツリーの代替として、role/name/labelの推定値とDOM階層の簡略表現を返却する暫定仕様とする。
- ツール結果/エラーは既存のメッセージフォーマットに合わせて整形し、LLMログへ統合。

## コンテンツスクリプトを挿入するサイトの要件

- `manifest.json`の`host_permissions: <all_urls>`を活用し、`http/https`タブで`chrome.scripting.executeScript`による注入を行う（Context7で仕様確認済み）。
- タブがアクティブであることを前提としつつ、バックグラウンド側で再注入ロジックを持ち、リロード/ナビゲーションでも自動復活させる。
- iframe/Shadow DOMはトップフレーム優先で処理し、必要に応じて対象フレームへRPC経由で指示を転送できるよう段階的に対応する。

## ブラウザ操作の具体的な内容

- DOMセレクタ指定操作（クリック・入力・スクロール・フォーカス）をコンテンツスクリプトで実行。失敗時は明示的な診断メッセージを返す。
- ビューポート基準スクリーンショットと要素ハイライト情報は、背景側キャプチャ＋コンテンツ側計測値で合成する。
- URL/ロード状態/モーダル検知をイベントベースで背景側へ通知し、`browser_wait_for_navigation`やUI更新に活用する。
- 将来的な操作ログ保存に備え、RPCリクエスト/レスポンスのフォーマットを永続化しやすい形にする。

## マウス操作の実装の可否

- PointerEvent合成＋`getBoundingClientRect()`で座標を解決し、`element.click()`フォールバックも併用して互換性を確保する。
- ドラッグ&ドロップは`pointerdown`→`pointermove`→`pointerup`シーケンスをコンテンツスクリプトから送出する形で試験実装。信頼性が低い場合はドキュメント化した上でベータ扱いにする。
- マウスホイール/スクロールは`element.scrollIntoView`や`window.scrollBy`で代替し、必要な場合のみPointerイベントにフォールバック。

## リスクとフォローアップ

- AXツリースナップショットの完全互換が難しい点を受け、LLMプロンプト側の期待値調整およびドキュメント更新が必要。
- マルチフレーム/Shadow DOMでのセレクタ解決やイベント伝播は継続的な検証が必要。必要に応じてユーザー向け警告を追加する。
- RPCレイヤーのエラー/タイムアウト処理を厳密にしないと、エージェントがハングする可能性がある。タイムアウト・再試行戦略を設計する。
- スクリーンショット取得はタブの可視性に依存するため、ユーザー操作によるタブ切替がリスク。必要ならUIで注意喚起し、失敗時は再実行手順を案内。
- 大規模リファクタリングのため、段階的ロールアウト（フラグ・ベータチャンネル）と十分な回帰テストを行い、Playwright版との比較検証を実施する。
