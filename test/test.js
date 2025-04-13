const fs = require('fs');
const axios = require('axios');

/**
 * 検証APIをテストする関数
 */
async function testValidateApi() {
  try {
    console.log('オブジェクトサンプル.txtを使用してテスト中...');
    const textData = fs.readFileSync('オブジェクトサンプル.txt', 'utf-8');
    
    const response = await axios.post('http://localhost:3000/validate', textData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    console.log('検証結果:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('エラー:', error.message);
    if (error.response) {
      console.error('レスポンスステータス:', error.response.status);
      console.error('レスポンスデータ:', error.response.data);
    }
  }
}

/**
 * 簡易テストデータを使用して検証APIをテストする関数
 */
async function testWithSimpleData() {
  try {
    console.log('\n簡易テストデータを使用してテスト中...');
    
    // 有効なデータ
    const validData = `知識：３：名前：テスト
オーナー：00-00000 テスト
オブジェクトタイプ：オブジェクト
タイプ：キャラクター
スケール：2`;
    
    const response = await axios.post('http://localhost:3000/validate', validData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    console.log('簡易テストデータの検証結果:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('エラー:', error.message);
    if (error.response) {
      console.error('レスポンスステータス:', error.response.status);
      console.error('レスポンスデータ:', error.response.data);
    }
  }
}

/**
 * 無効なデータを使用して検証APIをテストする関数
 */
async function testWithInvalidData() {
  try {
    console.log('\n無効なデータを使用してテスト中...');
    
    // 無効なデータ
    const invalidData = `知識：３：名前：テスト
オーナー：
タイプ：無効なタイプ
スケール：abc`;
    
    const response = await axios.post('http://localhost:3000/validate', invalidData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    console.log('無効なデータの検証結果:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('エラー:', error.message);
    if (error.response) {
      console.error('レスポンスステータス:', error.response.status);
      console.error('レスポンスデータ:', error.response.data);
    }
  }
}

/**
 * 変換APIをテストする関数
 */
async function testConvertApi() {
  try {
    console.log('\n変換APIをテスト中...');
    const textData = fs.readFileSync('オブジェクトサンプル.txt', 'utf-8');
    
    const response = await axios.post('http://localhost:3000/convert', textData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    console.log('変換結果:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('エラー:', error.message);
    if (error.response) {
      console.error('レスポンスステータス:', error.response.status);
      console.error('レスポンスデータ:', error.response.data);
    }
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('APIテストを開始します...');
  console.log('サーバーが http://localhost:3000 で起動していることを確認してください。');
  
  try {
    // サーバーが起動しているか確認
    await axios.get('http://localhost:3000');
    console.log('サーバーに接続できました。テストを実行します。\n');
    
    // 各テストを実行
    await testValidateApi();
    await testWithSimpleData();
    await testWithInvalidData();
    await testConvertApi();
    
    console.log('\nすべてのテストが完了しました。');
  } catch (error) {
    console.error('\nサーバーに接続できませんでした。サーバーが起動しているか確認してください。');
    console.error('エラー:', error.message);
  }
}

// プログラム実行
main();
