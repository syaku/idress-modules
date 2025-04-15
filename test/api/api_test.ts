import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * 変換APIをテストする関数
 * @param textData テキスト形式のデータ
 */
async function testConvertApi(textData: string): Promise<any> {
  try {
    console.log('変換APIにリクエストを送信中...');
    
    // APIにPOSTリクエストを送信
    const response = await axios.post('http://localhost:8787/convert', textData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    // レスポンスのステータスコードを確認
    if (response.status !== 200) {
      throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
    }
    
    // レスポンスデータを取得
    const data = response.data;
    
    // 結果を表示
    console.log('変換結果:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('変換APIテスト中にエラーが発生しました:', error);
    throw error;
  }
}

/**
 * 検証APIをテストする関数
 * @param textData テキスト形式のデータ
 */
async function testValidateApi(textData: string): Promise<any> {
  try {
    console.log('\n検証APIにリクエストを送信中...');
    
    // APIにPOSTリクエストを送信
    const response = await axios.post('http://localhost:8787/validate', textData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    // レスポンスのステータスコードを確認
    if (response.status !== 200) {
      throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
    }
    
    // レスポンスデータを取得
    const data = response.data;
    
    // 結果を表示
    console.log('検証結果:');
    console.log(`有効: ${data.isValid}`);
    console.log('検証詳細:');
    console.log(data.resultText);
    
    // 検証項目の表示
    if (data.items && data.items.length > 0) {
      console.log('\n検証項目:');
      data.items.forEach((item: any) => {
        console.log(`- ${item.field}: ${item.message} (${item.severity})`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('検証APIテスト中にエラーが発生しました:', error);
    throw error;
  }
}

/**
 * 無効なデータで検証APIをテストする関数
 */
async function testValidateWithInvalidData(): Promise<any> {
  try {
    console.log('\n無効なデータで検証APIをテスト中...');
    
    // 無効なデータを作成
    const invalidData = `知識：３：名前：テスト
オーナー：
タイプ：無効なタイプ
スケール：abc
攻撃：―：スキル１：`;
    
    // APIにPOSTリクエストを送信
    const response = await axios.post('http://localhost:8787/validate', invalidData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    // レスポンスのステータスコードを確認
    if (response.status !== 200) {
      throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
    }
    
    // レスポンスデータを取得
    const data = response.data;
    
    // 結果を表示
    console.log('無効なデータの検証結果:');
    console.log(`有効: ${data.isValid}`);
    console.log('検証詳細:');
    console.log(data.resultText);
    
    return data;
  } catch (error) {
    console.error('無効なデータでの検証APIテスト中にエラーが発生しました:', error);
    throw error;
  }
}

/**
 * 保存APIをテストする関数
 * @param textData テキスト形式のデータ
 */
async function testStoreApi(textData: string): Promise<any> {
  try {
    console.log('\n保存APIにリクエストを送信中...');
    
    // APIにPOSTリクエストを送信
    const response = await axios.post('http://localhost:8787/store', textData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    // レスポンスのステータスコードを確認
    if (response.status !== 200) {
      throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
    }
    
    // レスポンスデータを取得
    const data = response.data;
    
    // 結果を表示
    console.log('保存結果:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('保存APIテスト中にエラーが発生しました:', error);
    throw error;
  }
}

/**
 * 取得APIをテストする関数
 * @param name 取得するデータの名前
 */
async function testGetApi(name: string): Promise<any> {
  try {
    console.log(`\n取得API: 名前「${name}」のデータを取得中...`);
    
    // APIにGETリクエストを送信
    const response = await axios.get(`http://localhost:8787/get/${encodeURIComponent(name)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    // レスポンスのステータスコードを確認
    if (response.status !== 200) {
      throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
    }
    
    // レスポンスデータを取得
    const data = response.data;
    
    // 結果を表示
    console.log('取得結果:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('取得APIテスト中にエラーが発生しました:', error);
    throw error;
  }
}

/**
 * リストAPIをテストする関数
 * @param names 取得するデータの名前リスト
 */
async function testListApi(names: string[]): Promise<any> {
  try {
    console.log('\nリストAPIにリクエストを送信中...');
    console.log(`取得する名前リスト: ${JSON.stringify(names)}`);
    
    // APIにPOSTリクエストを送信
    const response = await axios.post('http://localhost:8787/list', { names }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // レスポンスのステータスコードを確認
    if (response.status !== 200) {
      throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
    }
    
    // レスポンスデータを取得
    const data = response.data;
    
    // 結果を表示
    console.log('リスト取得結果:');
    console.log(`メッセージ: ${data.message}`);
    console.log(`取得データ数: ${data.data ? data.data.length : 0}`);
    if (data.data && data.data.length > 0) {
      console.log('取得したデータの名前:');
      data.data.forEach((item: any) => {
        // データオブジェクトから名前を取得
        const nameData = item.データ?.find((d: any) => d.名前 === '名前');
        const name = nameData ? nameData.説明 : '名前なし';
        console.log(`- ${name}`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('リストAPIテスト中にエラーが発生しました:', error);
    throw error;
  }
}

/**
 * テスト用のサンプルデータを生成する関数
 * @param baseName 基本名前
 * @param index インデックス
 */
function generateSampleData(baseName: string, index: number): string {
  return `知識：３：名前：${baseName}${index}
オーナー：00-00702-01 テストユーザー：https://example.com
タイプ：キャラクター
スケール：2
作業：５：種族：人間
知識：２：職業１：テスト職業${index}
――：―：職業２：
――：―：職業３：
知識：６：スキル１：テストスキル${index}：テスト説明
先手：４：スキル２：適応力：柔軟に対応する
――：―：スキル３：
知識：７：アイテム１：テストアイテム${index}：テスト説明
作業：０：アイテム２：手帳：記録用
HP：0
設定：テストキャラクター${index}の設定です。
特殊：
次のアイドレス：＜テスト＞＜サンプル＞
適用勲章１：テスト勲章${index}：スキル＋１：テスト`;
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  try {
    // テキストファイルを読み込む
    const textData = fs.readFileSync(path.join(__dirname, '../オブジェクトサンプル.txt'), 'utf-8');
    
    // 変換APIをテスト
    await testConvertApi(textData);
    
    // 検証APIをテスト
    await testValidateApi(textData);
    
    // 無効なデータで検証APIをテスト
    await testValidateWithInvalidData();
    
    // テスト用のサンプルデータを生成して保存
    console.log('\n複数のテストデータを生成して保存します...');
    const baseName = `テストキャラクター_${uuidv4().substring(0, 8)}`;
    const sampleNames: string[] = [];
    
    // 3つのサンプルデータを生成して保存
    for (let i = 1; i <= 3; i++) {
      const sampleData = generateSampleData(baseName, i);
      try {
        const result = await testStoreApi(sampleData);
        if (result && result.success) {
          sampleNames.push(`${baseName}${i}`);
        }
      } catch (error) {
        console.error(`サンプルデータ${i}の保存に失敗しました:`, error);
      }
    }
    
    // 個別のデータ取得をテスト
    if (sampleNames.length > 0) {
      await testGetApi(sampleNames[0]);
      
      // リストAPIをテスト
      await testListApi(sampleNames);
      
      // 一部の名前だけで取得
      if (sampleNames.length >= 2) {
        await testListApi(sampleNames.slice(0, 2));
      }
    }
    
    // 無効な名前リストでテスト
    await testListApi(['存在しない名前1', '存在しない名前2']);
    
    console.log('\nAPIテスト完了');
  } catch (error) {
    console.error('エラー:', error);
  }
}

// プログラム実行
main().catch(error => {
  console.error('テスト実行中にエラーが発生しました:', error);
});
