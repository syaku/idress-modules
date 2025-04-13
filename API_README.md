# idress API

このAPIは、idress_converterモジュールとidress_validatorモジュールを使用して、テキスト形式のデータをJSON形式に変換したり、データの検証を行うサービスを提供します。

## 技術スタック

- [Hono](https://hono.dev/) - 軽量で高速なWebフレームワーク
- [TypeScript](https://www.typescriptlang.org/) - 型安全なJavaScript
- [idress_converter](./idress_converter.ts) - テキスト形式とJSONの相互変換モジュール
- [idress_validator](./idress_validator.ts) - データの検証と問題点の検出モジュール

## インストール

```bash
# 依存関係のインストール
npm install
```

## 使用方法

### サーバーの起動

```bash
# 開発サーバーの起動（Wrangler使用）
npm run dev

# または、TypeScriptのコンパイル後に起動
npm run api:build
npm run api:start
```

サーバーはデフォルトで http://localhost:8787 で起動します（Cloudflare Workersのローカル開発環境）。

### APIエンドポイント

#### テキスト形式をJSONに変換

- **URL**: `/convert`
- **メソッド**: `POST`
- **コンテンツタイプ**: `text/plain`
- **リクエストボディ**: テキスト形式のデータ
- **レスポンス**: JSON形式のデータ

#### テキスト形式のデータを検証

- **URL**: `/validate`
- **メソッド**: `POST`
- **コンテンツタイプ**: `text/plain`
- **リクエストボディ**: テキスト形式のデータ
- **レスポンス**: 検証結果のJSON（isValid, items, resultText）

#### テキスト形式のデータをリポジトリに保存

- **URL**: `/store`
- **メソッド**: `POST`
- **コンテンツタイプ**: `text/plain`
- **リクエストボディ**: テキスト形式のデータ
- **レスポンス**: 保存結果のJSON（success, message, data）
- **エラーレスポンス**: 
  - データが無効な場合: 400 Bad Request（error, validationResult）
  - 同名のデータが既に存在する場合: 400 Bad Request（error, message）

#### 名前を指定してデータを取得

- **URL**: `/get/:name`
- **メソッド**: `GET`
- **パラメータ**: `name` - 取得するデータの名前
- **レスポンス**: 指定された名前のデータをJSON形式で返す
- **エラーレスポンス**:
  - データが見つからない場合: 404 Not Found（error, message）
  - 名前が指定されていない場合: 400 Bad Request（error）

### 使用例

#### 変換エンドポイントの使用例（curl）

```bash
curl -X POST -H "Content-Type: text/plain" --data "A：１：名前：サンプルキャラクター
オーナー：サンプルオーナー
タイプ：キャラクター
スケール：３" http://localhost:8787/convert
```

#### 検証エンドポイントの使用例（curl）

```bash
curl -X POST -H "Content-Type: text/plain" --data "A：１：名前：サンプルキャラクター
オーナー：サンプルオーナー
タイプ：キャラクター
スケール：３" http://localhost:8787/validate
```

#### 保存エンドポイントの使用例（curl）

```bash
curl -X POST -H "Content-Type: text/plain" --data "A：１：名前：サンプルキャラクター
オーナー：サンプルオーナー
タイプ：キャラクター
スケール：３" http://localhost:8787/store
```

#### 取得エンドポイントの使用例（curl）

```bash
# URLエンコードされた名前を使用
curl -X GET "http://localhost:8787/get/%E3%83%86%E3%82%B9%E3%83%88%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC"

# または、Node.jsスクリプトを使用
node test/test_get.js
```

#### JavaScriptを使用した例

```javascript
// axios を使用した例
const axios = require('axios');

async function processText() {
  // テキストデータを直接指定
  const textData = `A：１：名前：サンプルキャラクター
オーナー：サンプルオーナー
タイプ：キャラクター
スケール：３`;
  
  try {
    // 変換リクエスト
    const convertResponse = await axios.post('http://localhost:8787/convert', textData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    console.log('変換結果:', convertResponse.data);
    
    // 検証リクエスト
    const validateResponse = await axios.post('http://localhost:8787/validate', textData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    console.log('検証結果:', validateResponse.data.isValid ? '有効' : '無効');
    console.log('検証詳細:', validateResponse.data.resultText);
    
    // 保存リクエスト
    if (validateResponse.data.isValid) {
      const storeResponse = await axios.post('http://localhost:8787/store', textData, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      
      console.log('保存結果:', storeResponse.data.success ? '成功' : '失敗');
      console.log('保存メッセージ:', storeResponse.data.message);
    }
  } catch (error) {
    console.error('エラー:', error.response ? error.response.data : error.message);
  }
}

processText();
```

## テスト

テスト用のスクリプトが用意されています。

```bash
# TypeScriptのコンパイル
npm run api:build

# テストの実行
node dist/test_api.js
```

## エラーハンドリング

APIは以下のエラーレスポンスを返す場合があります：

- **400 Bad Request**: 
  - テキストが空の場合
  - データが無効な場合（/store）
  - 同名のデータが既に存在する場合（/store）
  - 名前が指定されていない場合（/get/:name）
- **404 Not Found**:
  - 指定された名前のデータが見つからない場合（/get/:name）
- **500 Internal Server Error**: 変換、検証、保存、または取得中にエラーが発生した場合

## レスポンス例

### /convert エンドポイントのレスポンス例

```json
{
  "オーナー": "00-00702-01 鷺坂祐介",
  "根拠": "https://sleepy-sunspot-28a.notion.site/8c4bf546c94945e3b46d4d11dea639ea",
  "タイプ": "キャラクター",
  "オブジェクトタイプ": "オブジェクト",
  "スケール": 2,
  "データ": [
    {
      "マーク": "知識",
      "ナンバー": 3,
      "名前": "名前",
      "説明": "鷺坂縁"
    },
    ...
  ],
  ...
}
```

### /validate エンドポイントのレスポンス例

```json
{
  "isValid": true,
  "items": [
    {
      "field": "オブジェクトタイプ",
      "message": "オブジェクトタイプが指定されていません",
      "severity": "warning"
    }
  ],
  "resultText": "検証結果: 有効\n\n【警告】\n- オブジェクトタイプ: オブジェクトタイプが指定されていません\n"
}
```

### /store エンドポイントのレスポンス例

#### 成功時

```json
{
  "success": true,
  "message": "データが正常に保存されました",
  "data": {
    "オーナー": "00-00702-01 鷺坂祐介",
    "根拠": "https://sleepy-sunspot-28a.notion.site/8c4bf546c94945e3b46d4d11dea639ea",
    "タイプ": "キャラクター",
    "オブジェクトタイプ": "オブジェクト",
    "スケール": 2,
    "データ": [
      {
        "マーク": "知識",
        "ナンバー": 3,
        "名前": "名前",
        "説明": "鷺坂縁"
      },
      ...
    ],
    ...
  }
}
```

### /get/:name エンドポイントのレスポンス例

#### 成功時

```json
{
  "オーナー": "00-00000 テストユーザー",
  "根拠": "https://example.com",
  "タイプ": "キャラクター",
  "オブジェクトタイプ": "オブジェクト",
  "スケール": 2,
  "データ": [
    {
      "マーク": "知識",
      "ナンバー": 3,
      "名前": "名前",
      "説明": "テストキャラクター"
    },
    {
      "マーク": "作業",
      "ナンバー": 5,
      "名前": "種族",
      "説明": "人間"
    },
    ...
  ],
  "HP": "10",
  "設定": "これはテスト用のキャラクターです。",
  "特殊": "",
  "次のアイドレス": "＜テスト＞"
}
```

#### データが見つからない場合

```json
{
  "error": "名前「存在しない名前」のデータが見つかりません"
}
```

#### 検証エラー時

```json
{
  "error": "無効なデータです",
  "validationResult": {
    "isValid": false,
    "items": [
      {
        "field": "オーナー",
        "message": "オーナーが指定されていません",
        "severity": "error"
      }
    ],
    "resultText": "検証結果: 無効\n\n【エラー】\n- オーナー: オーナーが指定されていません\n"
  }
}
```

#### 既存データエラー時

```json
{
  "error": "データの保存中にエラーが発生しました",
  "message": "既に同じ名前のデータが存在します: 鷺坂縁"
}
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
