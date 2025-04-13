# curlによるAPIテスト方法

APIサーバーが起動している状態で、以下のコマンドを使用してテストできます。

## APIサーバーの起動方法

```bash
# 開発サーバーを起動（デフォルトでは8787ポートで起動）
npm run dev

# または特定のポートを指定して起動する場合（例）
npx wrangler dev src/api.ts --port 8787
```

## 利用可能なエンドポイント

- `/convert` - テキスト形式をJSONに変換
- `/validate` - テキスト形式のデータを検証
- `/store` - テキスト形式のデータをリポジトリに保存
- `/get/:name` - 名前を指定してデータを取得
- `/list` - 複数の名前を指定してデータを一括取得

## 基本的なテスト方法

### 方法1: ファイルの内容を送信（推奨）

```bash
# Windows CMD
curl -X POST -H "Content-Type: text/plain" --data-binary @オブジェクトサンプル.txt http://localhost:8787/validate

# Windows PowerShell
curl -X POST -H "Content-Type: text/plain" --data-binary "@オブジェクトサンプル.txt" http://localhost:8787/validate

# または
(Get-Content -Raw オブジェクトサンプル.txt) | curl -X POST -H "Content-Type: text/plain" -d "@-" http://localhost:8787/validate
```

### 方法2: 直接テキストを送信（シンプルなテスト用）

```bash
# Windows CMD
curl -X POST -H "Content-Type: text/plain" -d "知識：３：名前：テスト" http://localhost:8787/validate

# Windows PowerShell
curl -X POST -H "Content-Type: text/plain" -d "知識：３：名前：テスト" http://localhost:8787/validate
```

### 方法3: 一時ファイルを使用

```bash
# テキストを一時ファイルに保存
echo 知識：３：名前：テスト > temp.txt

# 一時ファイルを送信
curl -X POST -H "Content-Type: text/plain" --data-binary @temp.txt http://localhost:8787/validate

# 一時ファイルを削除
del temp.txt
```

## トラブルシューティング

### 問題: 文字化けが発生する場合

```bash
# UTF-8エンコーディングを明示的に指定
curl -X POST -H "Content-Type: text/plain; charset=UTF-8" --data-binary @オブジェクトサンプル.txt http://localhost:8787/validate
```

### 問題: ファイルが見つからない場合

ファイルパスが正しいことを確認してください。相対パスではなく絶対パスを使用すると確実です。

```bash
# 絶対パスを使用
curl -X POST -H "Content-Type: text/plain" --data-binary @"C:\Users\syaku\workspace\github.com\syaku\idress\オブジェクトサンプル.txt" http://localhost:8787/validate
```

### 問題: 改行が正しく処理されない場合

```bash
# Windows PowerShellの場合
$content = [System.IO.File]::ReadAllText("オブジェクトサンプル.txt")
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
Invoke-WebRequest -Uri "http://localhost:8787/validate" -Method Post -Body $bytes -ContentType "text/plain"
```

## 簡易テストデータ

以下の簡易テストデータを使用して、APIが正しく動作しているか確認できます。

### 変換エンドポイント（/convert）のテスト

```bash
# 有効なデータを変換
curl -X POST -H "Content-Type: text/plain" -d "知識：３：名前：テスト
オーナー：00-00000 テスト
オブジェクトタイプ：オブジェクト
タイプ：キャラクター
スケール：2" http://localhost:8787/convert
```

### 検証エンドポイント（/validate）のテスト

```bash
# 有効なデータを検証
curl -X POST -H "Content-Type: text/plain" -d "知識：３：名前：テスト
オーナー：00-00000 テスト
オブジェクトタイプ：オブジェクト
タイプ：キャラクター
スケール：2" http://localhost:8787/validate

# 無効なデータを検証
curl -X POST -H "Content-Type: text/plain" -d "知識：３：名前：テスト
オーナー：
タイプ：無効なタイプ
スケール：abc" http://localhost:8787/validate
```

### 保存エンドポイント（/store）のテスト

```bash
# 有効なデータをリポジトリに保存
curl -X POST -H "Content-Type: text/plain" -d "知識：３：名前：テスト
オーナー：00-00000 テスト
オブジェクトタイプ：オブジェクト
タイプ：キャラクター
スケール：2" http://localhost:8787/store

# ファイルからデータを読み込んで保存
curl -X POST -H "Content-Type: text/plain" --data-binary @test/オブジェクトサンプル.txt http://localhost:8787/store
```

### 取得エンドポイント（/get/:name）のテスト

```bash
# 名前を指定してデータを取得（URLエンコードが必要）
curl -X GET "http://localhost:8787/get/%E3%83%86%E3%82%B9%E3%83%88%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC"

# Windows PowerShellの場合
$name = "テストキャラクター"
$encodedName = [System.Web.HttpUtility]::UrlEncode($name)
curl -X GET "http://localhost:8787/get/$encodedName"
```

### 複数データ取得エンドポイント（/list）のテスト

```bash
# 複数の名前を指定してデータを取得
curl -X POST -H "Content-Type: application/json" -d "{\"names\": [\"テストキャラクター\", \"テストキャラクター2\"]}" http://localhost:8787/list

# Windows PowerShellの場合
$body = @{
  names = @("テストキャラクター", "テストキャラクター2")
} | ConvertTo-Json

curl -X POST -H "Content-Type: application/json" -d $body http://localhost:8787/list
```

> **注意**: ポート番号はAPIサーバーの起動方法によって異なる場合があります。デフォルトでは8787ポートですが、起動時に指定した場合は、そのポート番号を使用してください。

## Node.jsを使用したテスト

curlがうまく動作しない場合は、Node.jsスクリプトを使用してテストすることもできます。

### 検証エンドポイントのテスト

```javascript
// test_validate.js
const fs = require('fs');
const axios = require('axios');

async function testValidateApi() {
  try {
    const textData = fs.readFileSync('test/オブジェクトサンプル.txt', 'utf-8');
    
    const response = await axios.post('http://localhost:8787/validate', textData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    console.log('検証結果:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('エラー:', error);
  }
}

testValidateApi();
```

### 保存エンドポイントのテスト

```javascript
// test_store.js
const fs = require('fs');
const axios = require('axios');

async function testStoreApi() {
  try {
    const textData = fs.readFileSync('test/オブジェクトサンプル.txt', 'utf-8');
    
    const response = await axios.post('http://localhost:8787/store', textData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    console.log('保存結果:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('エラー:', error.response ? error.response.data : error.message);
  }
}

testStoreApi();
```

### 取得エンドポイントのテスト

```javascript
// test_get.js
const axios = require('axios');

async function testGetApi() {
  try {
    // テスト用の名前
    const name = 'テストキャラクター';
    
    console.log(`名前「${name}」のデータを取得します...`);
    
    const response = await axios.get(`http://localhost:8787/get/${encodeURIComponent(name)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('\n取得結果:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('エラー:', error.response ? error.response.data : error.message);
  }
}

testGetApi();
```

### 複数データ取得エンドポイントのテスト

```javascript
// test_list.js
const axios = require('axios');

async function testListApi() {
  try {
    // テスト用の名前リスト
    const names = ['テストキャラクター', 'テストキャラクター2'];
    
    console.log(`名前リスト「${names.join(', ')}」のデータを取得します...`);
    
    const response = await axios.post('http://localhost:8787/list', {
      names: names
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log('\n取得結果:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('エラー:', error.response ? error.response.data : error.message);
  }
}

testListApi();
```

実行方法:

```bash
node test_validate.js
node test_store.js
node test_get.js
node test_list.js
```
