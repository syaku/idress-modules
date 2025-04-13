# Idress ライブラリ

アイドレスのテキストデータとYAMLデータを相互変換し、TypeScriptオブジェクトとして操作・検証するライブラリに加え、Cloudflare Workersを使用したAPIサービスを提供します。

## 概要

このライブラリは以下の機能を提供します：

- テキスト形式 ⇔ TypeScriptオブジェクト ⇔ YAML形式の相互変換
- アイドレスデータの操作（スキルの追加・更新・削除など）
- アイドレスデータの検証（必須項目、値の範囲、タイプ、マークなど）

## モジュール

このライブラリは以下の3つの主要モジュールで構成されています：

- [**idress_converter**](./docs/CONVERTER.md) - テキスト形式とYAML形式の相互変換、データ操作
- [**idress_validator**](./docs/VALIDATOR.md) - データの検証と自動修正
- [**idress_repository**](./docs/REPOSITORY.md) - アイドレスデータの永続化と取得

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/idress.git
cd idress

# 依存パッケージをインストール
npm install
```

## 基本的な使い方

### リポジトリの使用

```typescript
import { MemoryRepositoryFactory } from './memory_repository';
import { textToObject } from './idress_converter';

// リポジトリの作成
const factory = new MemoryRepositoryFactory();
const repo = factory.createRepository();

// テキストからオブジェクトに変換してデータを作成
const text = `A：１：名前：サンプルキャラクター
オーナー：サンプルオーナー
タイプ：キャラクター
スケール：３`;
const data = textToObject(text);
await repo.create(data);

// 名前による検索
const foundData = await repo.findByName('サンプルキャラクター');

// データの更新
await repo.update('サンプルキャラクター', { スケール: 5 });

// データの削除
await repo.delete('サンプルキャラクター');
```

### 変換と操作

```typescript
import * as converter from './idress_converter';

// テキスト形式からオブジェクトに変換
const text = `A：１：名前：サンプルキャラクター
オーナー：サンプルオーナー
タイプ：キャラクター
スケール：３`;
const data = converter.textToObject(text);

// オブジェクトの操作
const updatedData = converter.addSkill(data, '特殊', 10, '海の祝福', '海の生物から特別な力を得る能力。');

// オブジェクトをYAML形式に変換
const yamlContent = converter.objectToYaml(updatedData);
console.log(yamlContent);
```

### 検証と修正

```typescript
import { validateIdressData, displayValidationResult } from './idress_validator';

// データの検証
const result = validateIdressData(data);

// 検証結果の表示
displayValidationResult(result);
```

## デモプログラム

### converter_demo.ts

基本的な変換処理のデモプログラムです。

```bash
npm run build && node dist/converter_demo.js
```

### validator_demo.ts

データ検証と自動修正のデモプログラムです。

```bash
npm run build && node dist/validator_demo.js ストラクチャーサンプル.yml --fix
```

### API サーバー

APIサーバーを使用して、テキスト形式のデータをJSON形式に変換するサービスを提供します。

```bash
# APIサーバーの起動
npm run api:start
```

詳細は [API_README.md](./docs/API_README.md) を参照してください。

## 詳細ドキュメント

- [idress_converter モジュール](./docs/CONVERTER.md)
- [idress_validator モジュール](./docs/VALIDATOR.md)
- [idress_repository モジュール](./docs/REPOSITORY.md)
- [API サービス](./docs/API_README.md)

## 開発者向け情報

### ビルド

```bash
npm run build
```

### テスト

```bash
# コンバーターのテスト
npm run build && node dist/converter_test.js

# バリデーターのテスト
npm run build && node dist/validator_test.js
```

### ファイル構成

- `idress_converter.ts`: 変換・操作モジュール
- `idress_validator.ts`: 検証・修正モジュール
- `idress_repository.ts`: リポジトリインターフェース
- `memory_repository.ts`: インメモリリポジトリ実装
- `converter_demo.ts`: 基本的な変換処理のデモ
- `validator_demo.ts`: 検証・修正のデモ
- `repository_demo.ts`: リポジトリ操作のデモ
- `converter_test.ts`: コンバーターのテスト
- `validator_test.ts`: バリデーターのテスト
- `api.ts`: APIサーバー
- `test_api.ts`: APIテスト
