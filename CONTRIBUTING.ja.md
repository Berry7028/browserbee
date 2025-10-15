# BrowserBeeへの貢献

BrowserBeeへの貢献に興味を持っていただきありがとうございます！このドキュメントは、このプロジェクトへの貢献のためのガイドラインと手順を提供します。

## 行動規範

このプロジェクトに貢献する際は、他者を尊重し、配慮してください。私たちは包括的で歓迎的なコミュニティを育成することを目指しています。

## はじめに

1. リポジトリをフォーク
2. フォークをクローン：`git clone https://github.com/yourusername/browserbee.git`
3. 依存関係をインストール：`npm install`
4. 開発環境をセットアップ：詳細なセットアップ手順については[DEVELOPMENT.ja.md](DEVELOPMENT.ja.md)を参照
5. 変更用のブランチを作成：`git checkout -b feature/your-feature-name`

## 開発セットアップ

ホットリロードと拡張機能のロード手順を含む詳細な開発セットアップについては、[DEVELOPMENT.ja.md](DEVELOPMENT.ja.md)を参照してください。

### クイック開発ワークフロー

1. **開発環境をセットアップ**：初期セットアップについては[DEVELOPMENT.ja.md](DEVELOPMENT.ja.md)に従う
2. **変更を加える**：`src/`ディレクトリ内のファイルを編集
3. **自動テスト**：ファイルを保存すると、拡張機能が自動的に再ビルドされます
4. **テストを実行**：`npm test`（以下のテストセクションを参照）
5. **コード品質をチェック**：`npm run lint`
6. **拡張機能を更新**：Chromeの拡張機能管理ページで更新アイコンをクリック

## プロジェクト構造

プロジェクトはいくつかのモジュールに整理されています：

- **agent**：コアエージェント実装とブラウザ自動化ツール
- **background**：Chrome拡張機能のバックグラウンドスクリプト
- **sidepanel**：サイドパネルのUI
- **options**：オプションページのUI

## プルリクエストプロセス

1. コードがプロジェクトのコーディングスタイルに従っていることを確認
2. 必要に応じてドキュメントを更新
3. 変更を徹底的にテスト
4. 変更の明確な説明を含むプルリクエストを提出

## コーディングガイドライン

- すべての新しいコードにTypeScriptを使用
- 既存のコードスタイルに従う
- 新しい関数とクラスにJSDocコメントを追加
- 意味のある変数名と関数名を使用
- 関数を小さく保ち、単一の責任に焦点を当てる

## テストと品質保証

BrowserBeeは、コード品質と信頼性を確保するために、**18のテストスイート**にわたる**548のテスト**を含む包括的なテストインフラストラクチャを備えています。

### テストの実行

```bash
# すべてのテストを実行
npm test

# ウォッチモードでテストを実行（開発用）
npm run test:watch

# カバレッジレポート付きでテストを実行
npm run test:coverage

# 特定のテストファイルを実行
npm test -- PageContextManager.test.ts
npm test -- --testPathPattern="agent/tools"
```

### テスト構造

テストスイートは以下をカバーしています：

- **エージェントコアコンポーネント**（275以上のテスト）
  - AgentCore、ExecutionEngine、MemoryManager
  - PageContextManager、PromptManager、TokenManager
  - ToolManager、ErrorHandler、approvalManager

- **エージェントツール**（260以上のテスト）
  - ブラウザインタラクションツール（クリック、タイプ、ナビゲート）
  - 観察ツール（スクリーンショット、コンテンツ抽出）
  - メモリとタブ管理ツール

- **インフラストラクチャ**（13以上のテスト）
  - 設定管理
  - LLMプロバイダーファクトリー

### テストの記述

新機能を追加する場合は、以下を行ってください：

1. **既存のパターンに従う** - 例として`tests/unit/`をチェック
2. **提供されたモックを使用** - `tests/mocks/`からインポート
3. **テストデータを追加** - 再利用可能なデータには`tests/fixtures/`を使用
4. **エラーシナリオをテスト** - エッジケースとエラー処理を含める
5. **カバレッジを維持** - 新しいコードがテストされていることを確認

#### テストファイル構造
```typescript
import { jest } from '@jest/globals';
import { createMockPage } from '../../mocks/playwright';

describe('YourComponent', () => {
  let mockPage: any;

  beforeEach(() => {
    mockPage = createMockPage();
    jest.clearAllMocks();
  });

  it('should handle normal operation', async () => {
    // テスト実装
  });

  it('should handle error scenarios', async () => {
    // エラーテスト
  });
});
```

### コード品質チェック

PRを提出する前に、以下を確認してください：

```bash
# TypeScriptコンパイルをチェック
npx tsc --noEmit

# ESLintを実行
npm run lint

# 自動修正可能なESLint問題を修正
npm run lint:fix

# すべての品質チェックを実行
npm test && npm run lint && npx tsc --noEmit
```

## CI/CDパイプライン

BrowserBeeは、自動テストと品質保証のために**GitHub Actions**を使用しています。

### 自動チェック

すべてのプッシュとプルリクエストがトリガーします：

- ✅ **ESLint** - コードスタイルと品質チェック
- ✅ **TypeScript** - コンパイル検証
- ✅ **Jestテスト** - すべての548のテストが合格する必要があります
- ✅ **ビルド検証** - 拡張機能が正常にビルドされる必要があります
- ✅ **マルチノードテスト** - Node.js 18と20でテスト

### CI/CDワークフロー

1. **プッシュ/PR作成** → GitHub Actionsがトリガーされる
2. **品質ゲート** → すべてのチェックが合格する必要があります
3. **ビルドアーティファクト** → 拡張機能のビルドが保存されます（7日間）
4. **ステータスチェック** → 緑✅ = マージ準備完了

### ブランチ保護

- マージ前にすべてのCIチェックが合格する必要があります
- プルリクエストにはレビューが必要です
- メインブランチへの直接プッシュは保護されています

### CI結果の表示

- GitHubの**Actions**タブをチェック
- 失敗の詳細なログを表示
- ダウンロード可能なビルドアーティファクト

### ローカルCIシミュレーション

ローカルで同じチェックを実行するには：

```bash
# 完全なCIシミュレーション
npm ci                    # クリーンインストール
npm run lint             # ESLintチェック
npx tsc --noEmit        # TypeScriptコンパイル
npm test                # すべてのテスト
npm run build           # ビルド検証
```

### CIの失敗のトラブルシューティング

一般的な問題と解決策：

- **ESLintの失敗**：`npm run lint:fix`を実行
- **TypeScriptエラー**：`npx tsc --noEmit`の出力をチェック
- **テストの失敗**：ローカルで`npm test`を実行してデバッグ
- **ビルドの失敗**：`npm run build`がローカルで動作することを確認

詳細なテストドキュメントについては、[`tests/README.md`](tests/README.md)を参照してください。

## ドキュメント

- 新機能を追加する場合は、README.mdを更新してください
- コードにJSDocコメントを追加してください
- 明白でない動作を文書化してください

## ライセンス

このプロジェクトに貢献することにより、あなたの貢献がプロジェクトの[Apache 2.0ライセンス](LICENSE)の下でライセンスされることに同意したことになります。
