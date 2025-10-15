# BrowserBeeへの貢献

BrowserBeeへの貢献に興味を持っていただきありがとうございます！このドキュメントでは、このプロジェクトへの貢献に関するガイドラインと手順を提供します。

## 行動規範

このプロジェクトに貢献する際は、他の人を尊重し、配慮してください。私たちは包括的で歓迎されるコミュニティを育成することを目指しています。

## はじめに

1. リポジトリをフォーク
2. フォークをクローン: `git clone https://github.com/yourusername/browserbee.git`
3. 依存関係をインストール: `npm install`
4. 開発環境をセットアップ: 詳細なセットアップ手順については[DEVELOPMENT.md](DEVELOPMENT.md)を参照
5. 変更用のブランチを作成: `git checkout -b feature/your-feature-name`

## 開発セットアップ

ホットリローディングと拡張機能読み込みの手順を含む詳細な開発セットアップについては、[DEVELOPMENT.md](DEVELOPMENT.md)を参照してください。

### クイック開発ワークフロー

1. **開発環境をセットアップ**: 初期セットアップについては[DEVELOPMENT.md](DEVELOPMENT.md)に従う
2. **変更を行う**: `src/` ディレクトリのファイルを編集
3. **自動テスト**: ファイルを保存すると拡張機能が自動的にリビルド
4. **テストを実行**: `npm test`（以下のテストセクションを参照）
5. **コード品質を確認**: `npm run lint`
6. **拡張機能を更新**: Chromeの拡張機能管理ページで更新アイコンをクリック

## プロジェクト構造

プロジェクトはいくつかのモジュールに整理されています：

- **agent**: コアエージェント実装とブラウザ自動化ツール
- **background**: Chrome拡張機能のバックグラウンドスクリプト
- **sidepanel**: サイドパネルのUI
- **options**: オプションページのUI

## プルリクエストプロセス

1. コードがプロジェクトのコーディングスタイルに従っていることを確認
2. 必要に応じてドキュメントを更新
3. 変更を徹底的にテスト
4. 変更の明確な説明とともにプルリクエストを送信

## コーディングガイドライン

- 新しいコードにはすべてTypeScriptを使用
- 既存のコードスタイルに従う
- 新しい関数とクラスにはJSDocコメントを追加
- 意味のある変数名と関数名を使用
- 関数を小さく、単一の責任に集中させる

## テストと品質保証

BrowserBeeには、コード品質と信頼性を確保するための**18のテストスイートにわたる548のテスト**からなる包括的なテストインフラがあります。

### テストの実行

```bash
# すべてのテストを実行
npm test

# 開発用の監視モードでテストを実行
npm run test:watch

# カバレッジレポート付きでテストを実行
npm run test:coverage

# 特定のテストファイルを実行
npm test -- PageContextManager.test.ts
npm test -- --testPathPattern="agent/tools"
```

### テスト構造

テストスイートは以下をカバー：

- **エージェントコアコンポーネント**（275以上のテスト）
  - AgentCore、ExecutionEngine、MemoryManager
  - PageContextManager、PromptManager、TokenManager
  - ToolManager、ErrorHandler、approvalManager

- **エージェントツール**（260以上のテスト）
  - ブラウザインタラクションツール（クリック、入力、ナビゲート）
  - 観測ツール（スクリーンショット、コンテンツ抽出）
  - メモリとタブ管理ツール

- **インフラ**（13以上のテスト）
  - 設定管理
  - LLMプロバイダーファクトリー

### テストの作成

新しい機能を追加する際は：

1. **既存のパターンに従う** - `tests/unit/` の例を確認
2. **提供されたモックを使用** - `tests/mocks/` からインポート
3. **テストデータを追加** - 再利用可能なデータには `tests/fixtures/` を使用
4. **エラーシナリオをテスト** - エッジケースとエラー処理を含む
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
    // Test implementation
  });

  it('should handle error scenarios', async () => {
    // Error testing
  });
});
```

### コード品質チェック

PRを送信する前に、以下を確認：

```bash
# TypeScriptコンパイルを確認
npx tsc --noEmit

# ESLintを実行
npm run lint

# 自動修正可能なESLintの問題を修正
npm run lint:fix

# すべての品質チェックを実行
npm test && npm run lint && npx tsc --noEmit
```

## CI/CDパイプライン

BrowserBeeは自動テストと品質保証のために**GitHub Actions**を使用します。

### 自動チェック

すべてのプッシュとプルリクエストでトリガー：

- ✅ **ESLint** - コードスタイルと品質チェック
- ✅ **TypeScript** - コンパイル検証
- ✅ **Jestテスト** - すべての548テストが合格する必要あり
- ✅ **ビルド検証** - 拡張機能が正常にビルドされること
- ✅ **マルチノードテスト** - Node.js 18と20でのテスト

### CI/CDワークフロー

1. **プッシュ/PR作成** → GitHub Actionsがトリガー
2. **品質ゲート** → すべてのチェックが合格する必要あり
3. **ビルドアーティファクト** → 拡張機能ビルドが保存（7日間）
4. **ステータスチェック** → 緑 ✅ = マージ準備完了

### ブランチ保護

- マージ前にすべてのCIチェックが合格する必要あり
- プルリクエストにはレビューが必要
- mainブランチへの直接プッシュは保護されている

### CI結果の表示

- GitHubの**Actions**タブを確認
- 失敗の詳細ログを表示
- ビルドアーティファクトをダウンロード可能

### ローカルCIシミュレーション

同じチェックをローカルで実行するには：

```bash
# 完全なCIシミュレーション
npm ci                    # クリーンインストール
npm run lint             # ESLintチェック
npx tsc --noEmit        # TypeScriptコンパイル
npm test                # すべてのテスト
npm run build           # ビルド検証
```

### CI失敗のトラブルシューティング

一般的な問題と解決策：

- **ESLint失敗**: `npm run lint:fix` を実行
- **TypeScriptエラー**: `npx tsc --noEmit` の出力を確認
- **テスト失敗**: ローカルで `npm test` を実行してデバッグ
- **ビルド失敗**: `npm run build` がローカルで動作することを確認

詳細なテストドキュメントについては、[`tests/README.md`](tests/README.md)を参照してください。

## ドキュメント

- 新しい機能を追加した場合はREADME.mdを更新
- コードにJSDocコメントを追加
- 明白でない動作を文書化

## ライセンス

このプロジェクトに貢献することで、あなたの貢献がプロジェクトの[Apache 2.0 License](LICENSE)の下でライセンスされることに同意したことになります。
