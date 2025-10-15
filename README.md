# BrowserBee 🐝

*ブラウザ内AIアシスタント。自然言語でウェブをコントロール。*

[![Join our Discord](https://img.shields.io/badge/Discord-Join%20Chat-7289da?logo=discord&logoColor=white&style=for-the-badge)](https://discord.gg/RUaq9bfESj)

`https://github.com/user-attachments/assets/209c7042-6d54-4fce-92a7-ddf8519156c6`

BrowserBeeは、プライバシー重視のオープンソースChrome拡張機能で、自然言語を使ってブラウザをコントロールできます。LLMの力を活用して指示を解析・計画し、Playwrightを使って堅牢なブラウザ自動化を実現します。

BrowserBeeは完全にブラウザ内で動作するため（LLMを除く）、ソーシャルメディアアカウントやメールなどのログイン済みウェブサイトと安全に連携できます。これにより、セキュリティを損なうことなくバックエンドインフラを必要とせずに個人利用が可能になります。他の「ブラウザ使用」製品よりも便利です。

## 🎲 機能

- **Anthropic**、**OpenAI**、**Gemini**、**Ollama**などの主要LLMプロバイダーをサポート（今後さらに追加予定）
- 各タスクの**トークン使用量**と**料金**を追跡
- ブラウザの状態を操作・理解するための幅広い**🕹️ ブラウザツール**（以下にリスト）にアクセス
- 堅牢なブラウザ自動化ツールである**Playwright**をバックエンドで使用
- **メモリ**機能で便利なツール使用シーケンスをキャプチャし、ローカルに保存して将来の効率を向上
- エージェントはユーザーの**承認**を求めるタイミングを知っている（例: 購入やソーシャルメディアへの投稿時）

## 🕹️ サポートされているツール

<details>
<summary><b>ナビゲーションツール</b></summary>

- **browser_navigate**
  - ブラウザを特定のURLに移動。入力は完全なURLである必要があります（例: `https://example.com`）

- **browser_wait_for_navigation**
  - ネットワークがアイドルになるまで待機（Playwright）。

- **browser_navigate_back**
  - 前のページに戻る（history.back()）。入力なし。

- **browser_navigate_forward**
  - 次のページに進む（history.forward()）。入力なし。

</details>

<details>
<summary><b>タブコンテキストツール</b></summary>

- **browser_get_active_tab**
  - 現在アクティブなタブの情報（インデックス、URL、タイトルを含む）を返します。

- **browser_navigate_tab**
  - 特定のタブをURLに移動。入力形式: 'tabIndex|url'（例: '1|`https://example.com`'）

- **browser_screenshot_tab**
  - インデックスで指定したタブのスクリーンショットを撮影。入力形式: 'tabIndex[,flags]'（例: '1,full'）

</details>

<details>
<summary><b>インタラクションツール</b></summary>

- **browser_click**
  - 要素をクリック。入力はCSSセレクタまたはページ上の一致するリテラルテキスト。

- **browser_type**
  - テキストを入力。形式: selector|text（例: input[name="q"]|hello）

- **browser_handle_dialog**
  - 最新のアラート/確認/プロンプトダイアログを受け入れるか拒否。入力 `accept` または `dismiss`。プロンプトダイアログの場合は `|text` を追加して応答テキストを提供可能。

</details>

<details>
<summary><b>観測ツール</b></summary>

- **browser_get_title**
  - 現在のページタイトルを返します。

- **browser_snapshot_dom**
  - 現在のページのDOMスナップショットをキャプチャ（selector、clean、structure、limitのオプション付き）。

- **browser_query**
  - 指定したCSSセレクタに対して最大10個のouterHTMLスニペットを返します。

- **browser_accessible_tree**
  - AXアクセシビリティツリーJSONを返します（デフォルト: interesting‑only）。'all' を入力すると完全なツリーをダンプ。

- **browser_read_text**
  - ページ上のすべての可視テキストをDOM順に連結して返します。

- **browser_screenshot**
  - 現在のページのスクリーンショットを撮影（フルページキャプチャのオプション付き）。

</details>

<details>
<summary><b>マウスツール</b></summary>

- **browser_move_mouse**
  - マウスカーソルを絶対画面座標に移動。入力形式: `x|y`（例: `250|380`）

- **browser_click_xy**
  - 絶対座標で左クリック。入力形式: `x|y`（例: `250|380`）

- **browser_drag**
  - 左ボタンでドラッグ＆ドロップ。入力形式: `startX|startY|endX|endY`（例: `100|200|300|400`）

</details>

<details>
<summary><b>キーボードツール</b></summary>

- **browser_press_key**
  - 単一のキーを押す。入力はキー名（例: `Enter`、`ArrowLeft`、`a`）。

- **browser_keyboard_type**
  - 現在のフォーカス位置に任意のテキストを入力。入力は入力するリテラルテキスト。改行には `\n` を使用。

</details>

<details>
<summary><b>タブツール</b></summary>

- **browser_tab_list**
  - 開いているタブのリストをインデックスとURL付きで返します。

- **browser_tab_new**
  - 新しいタブを開く。オプション入力 = 移動するURL（指定しない場合は空白タブ）。

- **browser_tab_select**
  - browser_tab_listのインデックスでタブにフォーカスを切り替える。入力 = 整数インデックス。

- **browser_tab_close**
  - タブを閉じる。入力 = 閉じるインデックス（空白の場合は現在のタブをデフォルト）。

</details>

<details>
<summary><b>メモリツール</b></summary>

- **save_memory**
  - ウェブサイトでの特定のタスク達成方法のメモリを保存。今後参照したい便利なアクションシーケンスがある場合に使用。

- **lookup_memories**
  - 特定のウェブサイトドメインの保存されたメモリを検索。ウェブサイトでタスクを開始する際の**最初のステップ**として、再利用可能な保存パターンを確認するために使用。

- **get_all_memories**
  - すべてのドメインの保存されたメモリをすべて取得。利用可能なすべてのメモリを確認したい場合に使用。

- **delete_memory**
  - IDで特定のメモリを削除。メモリが不要になったり正確でなくなったりした場合に使用。

- **clear_all_memories**
  - すべての保存されたメモリをクリア。注意して使用してください。すべてのドメインのすべてのメモリが削除されます。

## ✅ ユースケース
</details>

## ✅ ユースケース

- **ソーシャルメディア執事**: ソーシャルメディアアカウントを確認し、通知とメッセージを要約し、返信を支援。
- **ニュースキュレーター**: 好みのニュースソースやブログから最新のヘッドラインを集め、要約してパーソナライズされた簡単なブリーフィングを提供。
- **パーソナルアシスタント**: メールやメッセージの読み書き、フライト予約、製品検索などの日常タスクを支援。
- **リサーチアシスタント**: 企業、求人、市場トレンド、学術出版物などのトピックを深く掘り下げ、情報を収集・整理。
- **知識ブックマーク＆要約**: 記事を素早く要約し、重要な情報を抽出し、後で参照できるように有用な洞察を保存。
- **ウェブサイトとのチャット**: 質問したり、要約を生成したり、フォームに入力したりなど。

## 🛫 ロードマップ

BrowserBeeに追加予定の機能の最新リストについては[ROADMAP.md](ROADMAP.md)を参照してください。

- セッションの保存と再生のサポート（マクロ）
- 必要に応じて重要な情報を記憶する機能（ローカルのChromeインスタンスで[IndexedDB](https://developer.chrome.com/docs/devtools/storage/indexeddb)を使用）
- スケジュールされたタスク実行（例: 毎朝ニュースとソーシャルメディアを確認）

これらの機能を構築したり、BrowserBeeを改善したりすることに興味がある場合は、[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。テストインフラとCI/CDパイプラインについては[.github/WORKFLOWS.md](.github/WORKFLOWS.md)を参照してください。

## ▶️ インストール

BrowserBeeをインストールするには3つのオプションがあります：

### オプション1: 最新リリースをダウンロード（推奨）

1. [GitHub Releases](https://github.com/parsaghaffari/browserbee/releases/tag/v0.2.0-beta)から最新リリースをダウンロード
2. ダウンロードしたファイルを解凍
3. Chromeで拡張機能を読み込む：
   - `chrome://extensions/` にアクセス
   - 「デベロッパーモード」を有効化（右上のトグル）
   - 「パッケージ化されていない拡張機能を読み込む」をクリックし、解凍したディレクトリを選択
   - 表示されるオプション画面でAnthropic、OpenAI、GeminiのLLM APIキー設定、またはOllamaの設定を行う

### オプション2: ソースからビルド

1. このリポジトリをクローン
2. `npm install` または `pnpm install` で依存関係をインストール（約3分かかります）
3. `npm run build` または `pnpm build` で拡張機能をビルド
4. Chromeで拡張機能を読み込む：
   - `chrome://extensions/` にアクセス
   - 「デベロッパーモード」を有効化
   - 「パッケージ化されていない拡張機能を読み込む」をクリックし、`dist` ディレクトリを選択
   - 表示されるオプション画面でAnthropic、OpenAI、GeminiのLLM APIキー設定、またはOllamaの設定を行う

### オプション3: Chrome Web Store

BrowserBeeは[Chrome Web Store](https://chromewebstore.google.com/detail/browserbee-%F0%9F%90%9D/ilkklnfjpfoibgokaobmjhmdamogjcfj)で利用可能です 🎉

## 🏃‍♂️ 使用方法

1. ChromeツールバーでBrowserBeeアイコンをクリックするか、*Alt+Shift+B* を押してサイドパネルを開く
2. 指示を入力（例: *"Googleにアクセスし、Ciceroを検索して最初の結果をクリック"*）
3. Enterキーを押すと、BrowserBeeが動作を開始 🐝

**Note:**

1. BrowserBeeはChrome DevTools Protocol (CDP)を使ってタブに接続するため、セッション全体で開いたままにするベースタブに接続するのが最適（BrowserBeeは必要に応じて新しいタブを開けます）。接続されたタブを閉じた場合は、![reattach button](<reattach-button.png>) ボタンを使って新しいタブに再接続してください。
2. Chromeウィンドウごとに1つのBrowserBeeインスタンスを実行でき、インスタンスは互いに独立して動作します。
3. BrowserBeeはURLのないタブ（例: 新しいタブ）や'chrome://'または'chrome-extension://'で始まるURLのタブには接続できません。

## 🫂 コミュニティ

BrowserBeeユーザーと開発者に接続するためにDiscordコミュニティに参加してください：

[![Join our Discord](https://img.shields.io/badge/Discord-Join%20Chat-7289da?logo=discord&logoColor=white&style=for-the-badge)](https://discord.gg/RUaq9bfESj)

## 🫂 謝辞

BrowserBeeは以下の素晴らしいオープンソースプロジェクトを使用して構築されています：

- [Cline](https://github.com/cline/cline) - BrowserBeeの最初のバージョンをvibe-codeで作成し、「ウェブ版Cline」を構築するインスピレーションを与えてくれました
- [@ruifigueira](https://github.com/ruifigueira)による[playwright-crx](https://github.com/ruifigueira/playwright-crx) - ブラウザ内でのPlaywright使用
- [playwright-mcp](https://github.com/microsoft/playwright-mcp) - ブラウザツールの実装
- [daisyUI](https://daisyui.com/) 🌼 - ~~花粉と蜜~~ UIコンポーネント :)

## 💡 学びと盗む価値のあるもの

1. **ブラウザでのPlaywright実行。** Playwrightは、LLMが現代のウェブサイトやウェブアプリと対話するための堅牢で標準的なインターフェースを提供します。[Browser Use](https://github.com/browser-use)や[Playwright MCP](https://github.com/microsoft/playwright-mcp)などのほとんどの「ブラウザ使用」アプローチは、主にバックエンドサービス-ブラウザ方式でブラウザをリモート制御するように設計されており、エンタープライズ自動化には強力ですが、[@ruifigueira](https://github.com/ruifigueira)が示したように、ブラウザ拡張機能でPlaywrightをうまくラップすることで、エンドユーザー向けユースケースの複雑さを軽減できます。
2. **「反省と学習」メモリパターン。** 特定のセットアップはAIエージェントにとってフィードバックが豊富です。このセットアップはその一つで、エージェントは環境と対話するための幅広いツールだけでなく、環境へのアクションの影響を理解するための強力な観測能力も持っています。例えば、エージェントが製品購入を完了するタスクを割り当てられ、マウスやキーボードのインタラクションなどの異なるツールを使ってゴールに到達する可能性が高い場合、定期的にスクリーンショットを撮影することでタスクの成功を判断できます。ここにはエージェントにとって価値ある学習シグナルがあり、これらの学習をエンコードして記憶することで将来のパフォーマンスを向上させ、特に小さな非力なモデルで同様のタスクの効率を高めることができます。私の限定的なテストでは、最適なツールシーケンスを記憶することで、タスクに必要なトークン数（したがってコスト）を5倍以上削減できる場合があります。
3. **LLM駆動エージェントにとって、ウェブページとの対話は依然として難しいタスク。** DOMやスクリーンショットは複雑で情報密度の低いモダリティで、LLMにとって処理が遅く高価で困難です。ウェブページをコードと比較してみてください：コードの各トークンは平均的にHTMLページやスクリーンショットのピクセルよりもはるかに多くの情報を運びます。そのため、このタイプの製品を完全に実現可能にするには、巧みに簡略化された表現と、より安価/高速なモデルの組み合わせが必要です。
4. **なぜLLMを使うのか？** この文脈でLLMエージェントが提供できるコアバリューは、タスクを達成するためのパスやアクションシーケンスを_発見_することにあり、それをツール呼び出しのセット、または実際にはプレーンなJavaScript（[Playwright Codegen](https://playwright.dev/docs/codegen)を参照）としてエンコードできます。一度シーケンスが既知になれば、それに従うのは簡単です - LLMは必要ありません。
5. **プライバシー重視のパーソナルAIツールが正しい道。** 私たちの多くが将来何らかの常時稼働AIサーヴァントを持つことは疑いの余地がなく、安全にそこに到達する唯一の方法は、私たちのデータやLLMと透明に連携するオープンソースソフトウェアを通じてだと思います。このタイプのソフトウェアを構築する余地は大きく、それをサポートするビジネスモデルもあります（例: ホスト版の提供）、そのため、より堅牢なオープンソースAIアシスタントをたくさん見て使いたいと思います。

## 📜 ライセンス

[Apache 2.0](LICENSE)
