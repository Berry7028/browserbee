# BrowserBee 🐝
*ブラウザ内のAIアシスタント。自然言語でウェブを操作します。*

[![Join our Discord](https://img.shields.io/badge/Discord-Join%20Chat-7289da?logo=discord&logoColor=white&style=for-the-badge)](https://discord.gg/RUaq9bfESj)

https://github.com/user-attachments/assets/209c7042-6d54-4fce-92a7-ddf8519156c6

BrowserBeeは、プライバシーを重視したオープンソースのChrome拡張機能で、自然言語を使用してブラウザを操作できます。命令の解析と計画のためのLLMの力と、最新のウェブサイトとウェブアプリとの堅牢なブラウザ自動化のためのPlaywrightを組み合わせてタスクを実行します。

BrowserBeeは完全にブラウザ内で動作するため（LLMを除く）、ソーシャルメディアアカウントやメールなどのログイン済みウェブサイトと安全にやり取りでき、セキュリティを損なうことなく、バックエンドインフラストラクチャも不要です。これにより、他の「ブラウザ使用」タイプの製品よりも個人使用に便利です。

## 🎲 機能

- **Anthropic**、**OpenAI**、**Gemini**、**Ollama**などの主要なLLMプロバイダーをサポート（さらに追加予定）
- **トークン使用量**と**価格**を追跡し、各タスクにかかるコストを把握できます
- ブラウザの状態とのやり取りや理解のための幅広い**🕹️ ブラウザツール**（以下にリスト）にアクセス可能
- バックグラウンドで**Playwright**を使用し、堅牢なブラウザ自動化ツールを提供
- **メモリ**機能は、有用なツール使用シーケンスをキャプチャしてローカルに保存し、将来の使用をより効率的にします
- エージェントは、購入やソーシャルメディアへの投稿更新など、ユーザーの**承認**を求めるタイミングを認識します

## 🕹️ サポートされているツール

<details>
<summary><b>ナビゲーションツール</b></summary>

- **browser_navigate**
  - ブラウザを特定のURLに移動します。入力は完全なURLである必要があります（例：https://example.com）

- **browser_wait_for_navigation**
  - ネットワークがアイドル状態になるまで待機します（Playwright）。

- **browser_navigate_back**
  - 前のページに戻ります（history.back()）。入力なし。

- **browser_navigate_forward**
  - 次のページに進みます（history.forward()）。入力なし。
</details>

<details>
<summary><b>タブコンテキストツール</b></summary>

- **browser_get_active_tab**
  - 現在アクティブなタブのインデックス、URL、タイトルを含む情報を返します。

- **browser_navigate_tab**
  - 特定のタブをURLに移動します。入力形式：'tabIndex|url'（例：'1|https://example.com'）

- **browser_screenshot_tab**
  - インデックスで特定のタブのスクリーンショットを撮ります。入力形式：'tabIndex[,flags]'（例：'1,full'）
</details>

<details>
<summary><b>インタラクションツール</b></summary>

- **browser_click**
  - 要素をクリックします。入力はCSSセレクターまたはページ上で一致するリテラルテキストです。

- **browser_type**
  - テキストを入力します。形式：selector|text（例：input[name="q"]|hello）

- **browser_handle_dialog**
  - 最新のアラート/確認/プロンプトダイアログを受け入れるか却下します。入力 `accept` または `dismiss`。プロンプトダイアログの場合、応答テキストを提供するために `|text` を追加できます。
</details>

<details>
<summary><b>観察ツール</b></summary>

- **browser_get_title**
  - 現在のページタイトルを返します。

- **browser_snapshot_dom**
  - セレクター、クリーン、構造、制限のオプションを使用して現在のページのDOMスナップショットをキャプチャします。

- **browser_query**
  - 指定されたCSSセレクターに対して最大10個のouterHTMLスニペットを返します。

- **browser_accessible_tree**
  - AXアクセシビリティツリーJSONを返します（デフォルト：興味深いもののみ）。完全なツリーをダンプするには 'all' を入力します。

- **browser_read_text**
  - ページ上のすべての表示テキストをDOM順に連結して返します。

- **browser_screenshot**
  - フルページキャプチャのオプションを使用して現在のページのスクリーンショットを撮ります。
</details>

<details>
<summary><b>マウスツール</b></summary>

- **browser_move_mouse**
  - マウスカーソルを絶対画面座標に移動します。入力形式：`x|y`（例：`250|380`）

- **browser_click_xy**
  - 絶対座標で左クリックします。入力形式：`x|y`（例：`250|380`）

- **browser_drag**
  - 左ボタンでドラッグアンドドロップします。入力形式：`startX|startY|endX|endY`（例：`100|200|300|400`）
</details>

<details>
<summary><b>キーボードツール</b></summary>

- **browser_press_key**
  - 単一のキーを押します。入力はキー名です（例：`Enter`、`ArrowLeft`、`a`）。

- **browser_keyboard_type**
  - 現在のフォーカス位置に任意のテキストを入力します。入力はタイプするリテラルテキストです。新しい行には `\n` を使用します。
</details>

<details>
<summary><b>タブツール</b></summary>

- **browser_tab_list**
  - インデックスとURLを含む開いているタブのリストを返します。

- **browser_tab_new**
  - 新しいタブを開きます。オプションの入力 = 移動先のURL（それ以外は空のタブ）。

- **browser_tab_select**
  - インデックスでタブにフォーカスを切り替えます。入力 = browser_tab_listからの整数インデックス。

- **browser_tab_close**
  - タブを閉じます。入力 = 閉じるインデックス（空の場合は現在のタブがデフォルト）。
</details>

<details>
<summary><b>メモリツール</b></summary>

- **save_memory**
  - ウェブサイト上で特定のタスクを達成する方法のメモリを保存します。将来の参照のために有用なアクションシーケンスを記憶したい場合に使用します。

- **lookup_memories**
  - 特定のウェブサイトドメインに保存されたメモリを検索します。再利用できる保存されたパターンがあるかどうかを確認するために、ウェブサイトでタスクを開始する際の最初のステップとして使用します。

- **get_all_memories**
  - すべてのドメインに保存されたすべてのメモリを取得します。利用可能なすべてのメモリを表示したい場合に使用します。

- **delete_memory**
  - IDで特定のメモリを削除します。メモリが役に立たなくなったり、不正確になったりした場合に使用します。

- **clear_all_memories**
  - 保存されたすべてのメモリをクリアします。すべてのドメインにわたってすべてのメモリを削除するため、注意して使用してください。
</details>

## ✅ ユースケース

- **ソーシャルメディア執事**：ソーシャルメディアアカウントをチェックし、通知とメッセージを要約し、応答を支援します。
- **ニュースキュレーター**：お気に入りのニュースソースとブログから最新の見出しを収集して要約し、迅速でパーソナライズされたブリーフィングを提供します。
- **パーソナルアシスタント**：メールやメッセージの読み取りと送信、フライトの予約、製品の検索など、日常的なタスクを支援します。
- **リサーチアシスタント**：企業、求人情報、市場動向、学術出版物などのトピックに関する深い調査を支援し、情報を収集して整理します。
- **ナレッジブックマークと要約**：記事を素早く要約し、重要な情報を抽出し、後で参照するために有用な洞察を保存します。
- **あらゆるウェブサイトとのチャット**：質問、要約の生成、フォームの記入など。

## 🛫 ロードマップ

BrowserBeeに追加することを目指している機能の最新リストについては、[ROADMAP.ja.md](ROADMAP.ja.md)を参照してください。

- セッションの保存と再生（マクロ）のサポート
- 必要に応じて重要な情報を記憶する機能（[IndexedDB](https://developer.chrome.com/docs/devtools/storage/indexeddb)を使用してローカルのChromeインスタンスに）
- スケジュールされたタスクの実行（例：毎朝ニュースとソーシャルメディアをチェック）

これらの機能の構築やBrowserBeeの改善に貢献することに興味がある場合は、[CONTRIBUTING.md](CONTRIBUTING.md)をご覧ください。テストインフラストラクチャとCI/CDパイプラインについては、[.github/WORKFLOWS.md](.github/WORKFLOWS.md)を参照してください。

## ▶️ インストール

BrowserBeeをインストールするには3つのオプションがあります：

### オプション1：最新リリースをダウンロード（推奨）

1. [GitHubリリース](https://github.com/parsaghaffari/browserbee/releases/tag/v0.2.0-beta)から最新リリースをダウンロード
2. ダウンロードしたファイルを解凍
3. Chromeに拡張機能をロード：
   - `chrome://extensions/`に移動
   - 「デベロッパーモード」を有効にする（右上のトグル）
   - 「パッケージ化されていない拡張機能を読み込む」をクリックし、解凍したディレクトリを選択
   - ポップアップするオプションページでAnthropic、OpenAI、GeminiのLLM APIキーを設定するか、Ollamaを設定

### オプション2：ソースからビルド

1. このリポジトリをクローン
2. `npm install` または `pnpm install` で依存関係をインストール（約3分かかります）
3. `npm run build` または `pnpm build` で拡張機能をビルド
4. Chromeに拡張機能をロード：
   - `chrome://extensions/`に移動
   - 「デベロッパーモード」を有効にする
   - 「パッケージ化されていない拡張機能を読み込む」をクリックし、`dist`ディレクトリを選択
   - ポップアップするオプションページでAnthropic、OpenAI、GeminiのLLM APIキーを設定するか、Ollamaを設定

### オプション3：Chrome Web Store

BrowserBeeは[Chrome Web Store](https://chromewebstore.google.com/detail/browserbee-%F0%9F%90%9D/ilkklnfjpfoibgokaobmjhmdamogjcfj)で入手可能です 🎉

## 🏃‍♂️ 使い方

1. Chromeツールバーのブラウザービーアイコンをクリックするか、*Alt+Shift+B*を押してサイドパネルを開きます
2. 指示を入力します（例：*「Googleに行き、Ciceroを検索し、最初の結果をクリック」*）
3. Enterを押してBrowserBeeが動作するのを見ます 🐝

**注意：**
1. BrowserBeeはChrome DevTools Protocol（CDP）を使用してタブにアタッチするため、セッション中開いたままにするベースタブにアタッチしたままにするのが最適です（必要に応じてBrowserBeeは新しいタブを開くことができます）。アタッチされたタブを閉じた場合は、![再アタッチボタン](<reattach-button.png>)ボタンを使用して新しいタブに再アタッチします。
2. Chromeウィンドウごとに1つのBrowserBeeインスタンスを実行でき、インスタンスは互いに独立して動作します。
3. BrowserBeeは、URLのないタブ（例：新しいタブ）、または'chrome://'または'chrome-extension://'で始まるURLのタブにはアタッチできません。

## 🫂 コミュニティ

BrowserBeeのユーザーと開発者とつながるために、Discordコミュニティに参加してください：

[![Join our Discord](https://img.shields.io/badge/Discord-Join%20Chat-7289da?logo=discord&logoColor=white&style=for-the-badge)](https://discord.gg/RUaq9bfESj)

## 🫂 謝辞

BrowserBeeは、これらの素晴らしいオープンソースプロジェクトを使用して構築されています：

- [Cline](https://github.com/cline/cline) BrowserBeeの最初のバージョンをvibe-codeで作成することを可能にし、「ウェブ用のCline」を構築するインスピレーションを与えてくれました
- [@ruifigueira](https://github.com/ruifigueira)による[playwright-crx](https://github.com/ruifigueira/playwright-crx) ブラウザ内でのPlaywrightの使用のため
- [playwright-mcp](https://github.com/microsoft/playwright-mcp) ブラウザツールの実装のため
- [daisyUI](https://daisyui.com/) 🌼 ~~花粉と蜜~~UIコンポーネントのため :)

## 💡 学びと盗む価値のあるもの

1. **ブラウザ内でPlaywrightを実行する。** Playwrightは、最新のウェブサイトとウェブアプリとやり取りするためのLLMに堅牢で標準的なインターフェースを提供します。[Browser Use](https://github.com/browser-use)や[Playwright MCP](https://github.com/microsoft/playwright-mcp)のような私が出会った「ブラウザ使用」アプローチのほとんどは、主にバックエンドサービス-ブラウザ方式でリモートでブラウザを制御するように設計されており、エンタープライズ自動化には強力ですが、[@ruifigueira](https://github.com/ruifigueira)は、Playwrightをブラウザ拡張機能でうまくラップし、エンドユーザーのユースケースの複雑さを軽減できることを示しました。
2. **「振り返って学ぶ」メモリパターン。** 特定のセットアップは、AIエージェントにとってフィードバックが豊富です。これはその1つで、エージェントは環境とやり取りするための幅広いツールが利用できるだけでなく、環境に対するアクションの影響を理解するための強力な観察能力も備えています。たとえば、エージェントが製品購入を完了するタスクを課された場合、さまざまなツール（マウスやキーボードの操作など）を使用して最終目標に強引に到達できる可能性が高く、通常、定期的にスクリーンショットを撮ることで、タスクが成功したかどうかを判断できます。ここにはエージェントにとって貴重な学習シグナルがあり、エージェントにこれらの学習をエンコードして記憶させることで、将来のパフォーマンスを向上させ、類似のタスク、特に小規模で能力の低いモデルでの効率を高めることができます。私の限られたテストでは、最適なツールシーケンスを記憶すると、タスクに必要なトークン数（したがってコスト）を5倍以上削減できる場合があります。
3. **ウェブページとのやり取りは、LLM駆動のエージェントにとって依然として困難なタスクです。** DOMとスクリーンショットは、LLMが処理するのに遅く、高価で、困難な複雑で情報密度の低いモダリティです。たとえば、ウェブページをコードと比較してください：コードの各トークンは、HTMLページのトークンやスクリーンショットのピクセルよりも平均してはるかに多くの情報を運びます。したがって、このタイプの製品を完全に実現可能にするには、巧妙に簡略化された表現と、より安価/高速なモデルの組み合わせが必要です。
4. **なぜLLMをまったく使用するのか？** このコンテキストでLLMエージェントが提供できる中核的な価値は、タスクを達成するためのパスまたはアクションのシーケンスを_発見_することであり、その後、ツール呼び出しのセット、または実際にはプレーンなJavaScript（[Playwright Codegen](https://playwright.dev/docs/codegen)を参照）としてエンコードできます。シーケンスがすでに知られている場合、それに従うことは簡単です - LLMは不要です。
5. **プライバシー第一の個人AIツールが進むべき道です。** 私たちのほとんどが将来的に何らかの形の常時オンのAIサーバントを持つことは間違いなく、私たちが安全にそこに到達できる唯一の方法は、データとLLMと透明にやり取りするオープンソースソフトウェアを通じてだと思います。このタイプのソフトウェアを構築し、それをサポートするビジネスモデル（例：ホストされたバージョンを提供する）には多くの余地があるので、より堅牢なオープンソースAIアシスタントをもっと見て使用できることを本当に願っています。

## 📜 ライセンス

[Apache 2.0](LICENSE)
