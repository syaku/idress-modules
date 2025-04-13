import * as fs from 'fs';
import {
    IdressData,
    textToObject,
    objectToYaml,
    yamlToObject,
    objectToText,
    displayIdressObject
} from '../src/idress_converter';

/**
 * テキスト→オブジェクト→YAMLの変換デモ
 */
function demoTextToYaml(): void {
    console.log('=== テキスト→オブジェクト→YAML変換デモ ===');
    
    // テキストファイルを読み込み、オブジェクトに変換
    console.log('テキストファイルを読み込み中...');
    const textContent = fs.readFileSync('test/オブジェクトサンプル.txt', 'utf-8');
    const data = textToObject(textContent);
    
    // オブジェクトの内容を表示
    console.log('\nオブジェクトの内容:');
    
    // 古い形式（マーク、ナンバー、名前がルートレベルにある）と新しい形式（データ配列の最初の要素にある）の両方に対応
    if ('マーク' in data && 'ナンバー' in data && '名前' in data) {
        // 古い形式
        console.log(`マーク: ${data.マーク}`);
        console.log(`ナンバー: ${data.ナンバー}`);
        console.log(`名前: ${data.名前}`);
    } else {
        // 新しい形式
        const firstItem = data.データ?.find(item => item.名前 === '名前');
        if (firstItem) {
            console.log(`マーク: ${firstItem.マーク}`);
            console.log(`ナンバー: ${firstItem.ナンバー}`);
            console.log(`名前: ${firstItem.説明}`);
        } else {
            console.log('マーク: undefined');
            console.log('ナンバー: undefined');
            console.log('名前: undefined');
        }
    }
    
    console.log(`データ項目数: ${data.データ?.length || 0}`);
    console.log(`適用勲章数: ${data.適用勲章?.length || 0}`);
    
    // オブジェクトをYAMLに変換して保存
    console.log('\nオブジェクトをYAMLに変換して保存中...');
    const yamlContent = objectToYaml(data);
    fs.writeFileSync('test/デモ_テキスト変換.yml', yamlContent, 'utf-8');
    
    console.log('デモ_テキスト変換.ymlに保存しました。');
}

/**
 * YAML→オブジェクト→テキストの変換デモ
 */
function demoYamlToText(): void {
    console.log('\n=== YAML→オブジェクト→テキスト変換デモ ===');
    
    // YAMLファイルを読み込み、オブジェクトに変換
    console.log('YAMLファイルを読み込み中...');
    const yamlContent = fs.readFileSync('test/デモ_テキスト変換.yml', 'utf-8');
    const data = yamlToObject(yamlContent);
    
    // オブジェクトの内容を表示
    console.log('\nオブジェクトの内容:');
    
    // 古い形式（マーク、ナンバー、名前がルートレベルにある）と新しい形式（データ配列の最初の要素にある）の両方に対応
    if ('マーク' in data && 'ナンバー' in data && '名前' in data) {
        // 古い形式
        console.log(`マーク: ${data.マーク}`);
        console.log(`ナンバー: ${data.ナンバー}`);
        console.log(`名前: ${data.名前}`);
    } else {
        // 新しい形式
        const firstItem = data.データ?.find(item => item.名前 === '名前');
        if (firstItem) {
            console.log(`マーク: ${firstItem.マーク}`);
            console.log(`ナンバー: ${firstItem.ナンバー}`);
            console.log(`名前: ${firstItem.説明}`);
        } else {
            console.log('マーク: undefined');
            console.log('ナンバー: undefined');
            console.log('名前: undefined');
        }
    }
    
    console.log(`データ項目数: ${data.データ?.length || 0}`);
    console.log(`適用勲章数: ${data.適用勲章?.length || 0}`);
    
    // オブジェクトをテキストに変換して保存
    console.log('\nオブジェクトをテキストに変換して保存中...');
    const textContent = objectToText(data);
    fs.writeFileSync('test/デモ_YAML変換.txt', textContent, 'utf-8');
    
    console.log('デモ_YAML変換.txtに保存しました。');
}

/**
 * 文字列変換デモ
 */
function demoStringConversion(): void {
    console.log('\n=== 文字列変換デモ ===');
    
    // サンプルテキスト
    const sampleText = `政治：１：名前：サンプル
オーナー：テスト：http://example.com
タイプ：キャラクター
スケール：３
生産：５：種族：人間
政治：４：職業１：王様
HP：２（赤）
設定：サンプル設定です。
適用勲章１：テスト勲章：効果テスト：http://example.com/medal`;
    
    console.log('元のテキスト:');
    console.log(sampleText);
    
    // テキスト→オブジェクト変換
    console.log('\nテキスト→オブジェクト変換中...');
    const data = textToObject(sampleText);
    
    // オブジェクトの内容を表示
    console.log('\nオブジェクトの内容:');
    console.log(data);
    
    // オブジェクト→YAML変換
    console.log('\nオブジェクト→YAML変換中...');
    const yamlStr = objectToYaml(data);
    
    console.log('\n変換後のYAML:');
    console.log(yamlStr);
    
    // YAML→オブジェクト変換
    console.log('\nYAML→オブジェクト変換中...');
    const dataFromYaml = yamlToObject(yamlStr);
    
    // オブジェクト→テキスト変換
    console.log('\nオブジェクト→テキスト変換中...');
    const textStr = objectToText(dataFromYaml);
    
    console.log('\n変換後のテキスト:');
    console.log(textStr);
}

/**
 * ファイル変換デモ
 */
function demoFileConversion(): void {
    console.log('\n=== ファイル変換デモ ===');
    
    // テキスト→YAML変換
    console.log('\nテキスト→YAML変換中...');
    const textContent = fs.readFileSync('test/オブジェクトサンプル.txt', 'utf-8');
    const data1 = textToObject(textContent);
    const yamlContent = objectToYaml(data1);
    fs.writeFileSync('test/デモ_ファイル変換.yml', yamlContent, 'utf-8');
    console.log(`オブジェクトサンプル.txtをデモ_ファイル変換.ymlに変換しました。`);
    
    // YAML→テキスト変換
    console.log('\nYAML→テキスト変換中...');
    const yamlContent2 = fs.readFileSync('test/デモ_ファイル変換.yml', 'utf-8');
    const data2 = yamlToObject(yamlContent2);
    const textContent2 = objectToText(data2);
    fs.writeFileSync('test/デモ_ファイル変換.txt', textContent2, 'utf-8');
    console.log(`デモ_ファイル変換.ymlをデモ_ファイル変換.txtに変換しました。`);
}

// メイン処理
function main(): void {
    console.log('IdressConverter デモプログラム');
    console.log('----------------------------');
    
    // 各デモを実行
    demoTextToYaml();
    demoYamlToText();
    demoStringConversion();
    demoFileConversion();
    
    console.log('\nデモ完了');
}

// プログラム実行
main();
