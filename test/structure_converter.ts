import * as fs from 'fs';
import * as path from 'path';
import * as converter from '../src/idress_converter';

/**
 * ストラクチャーサンプル.txtをYAMLに変換するデモ
 */
function demoTextToYaml(): void {
    console.log('=== ストラクチャーサンプル.txtをYAMLに変換 ===');
    
    try {
        // 方法1: 手動で各ステップを実行
        console.log('方法1: 手動で各ステップを実行');
        
        // テキストファイルを読み込み
        const filePath = path.join(__dirname, 'ストラクチャーサンプル.txt');
        const textContent = fs.readFileSync(filePath, 'utf-8');
        
        // テキストをオブジェクトに変換
        const data = converter.textToObject(textContent);
        
        // 変換されたオブジェクトの内容を表示
        console.log('\n変換されたオブジェクトの内容:');
        
        // データ項目の確認
        const firstItem = data.データ?.find(item => item.名前 === '名前');
        if (firstItem) {
            console.log(`マーク: ${firstItem.マーク}`);
            console.log(`ナンバー: ${firstItem.ナンバー}`);
            console.log(`名前: ${firstItem.説明}`);
        }
        
        console.log(`データ項目数: ${data.データ?.length || 0}`);
        console.log(`タイプ: ${data.タイプ || 'ストラクチャータイプ' in data ? data['ストラクチャータイプ'] : '未定義'}`);
        
        // オブジェクトをYAMLに変換
        const yamlContent = converter.objectToYaml(data);
        
        // YAMLファイルに保存
        const outputPath = path.join(__dirname, 'ストラクチャーサンプル_手動変換.yml');
        fs.writeFileSync(outputPath, yamlContent, 'utf-8');
        console.log('変換完了: ストラクチャーサンプル_手動変換.yml が作成されました');
        
    } catch (error) {
        console.error('変換中にエラーが発生しました:', error);
    }
}

/**
 * ストラクチャーサンプル.ymlをテキストに変換するデモ
 */
function demoYamlToText(): void {
    console.log('\n=== ストラクチャーサンプル.ymlをテキストに変換 ===');
    
    try {
        // 方法1: 手動で各ステップを実行
        console.log('方法1: 手動で各ステップを実行');
        
        // YAMLファイルを読み込み
        const filePath = path.join(__dirname, 'ストラクチャーサンプル.yml');
        const yamlContent = fs.readFileSync(filePath, 'utf-8');
        
        // YAMLをオブジェクトに変換
        const data = converter.yamlToObject(yamlContent);
        
        // 変換されたオブジェクトの内容を表示
        console.log('\n変換されたオブジェクトの内容:');
        
        // データ項目の確認
        const firstItem = data.データ?.find(item => item.名前 === '名前');
        if (firstItem) {
            console.log(`マーク: ${firstItem.マーク}`);
            console.log(`ナンバー: ${firstItem.ナンバー}`);
            console.log(`名前: ${firstItem.説明}`);
        }
        
        console.log(`データ項目数: ${data.データ?.length || 0}`);
        console.log(`タイプ: ${data.タイプ}`);
        
        // オブジェクトをテキストに変換
        const textContent = converter.objectToText(data);
        
        // テキストファイルに保存
        const outputPath = path.join(__dirname, 'ストラクチャーサンプル_手動変換結果.txt');
        fs.writeFileSync(outputPath, textContent, 'utf-8');
        console.log('変換完了: ストラクチャーサンプル_手動変換結果.txt が作成されました');
        
    } catch (error) {
        console.error('変換中にエラーが発生しました:', error);
    }
}

/**
 * オブジェクト操作のデモ
 */
function demoObjectOperations(): void {
    console.log('\n=== オブジェクト操作のデモ ===');
    
    try {
        // テキストファイルからオブジェクトを取得
        console.log('\nテキストファイルからオブジェクトを取得:');
        const textFilePath = path.join(__dirname, 'ストラクチャーサンプル.txt');
        const textContent = fs.readFileSync(textFilePath, 'utf-8');
        const textData = converter.textToObject(textContent);
        
        // オブジェクトの内容を表示
        converter.displayIdressObject(textData);
        
        // YAMLファイルからオブジェクトを取得
        console.log('\nYAMLファイルからオブジェクトを取得:');
        const yamlFilePath = path.join(__dirname, 'ストラクチャーサンプル.yml');
        const yamlContent = fs.readFileSync(yamlFilePath, 'utf-8');
        const yamlData = converter.yamlToObject(yamlContent);
        
        // オブジェクトの内容を表示
        converter.displayIdressObject(yamlData);
        
        // オブジェクトの操作例
        console.log('\nオブジェクトの操作例:');
        
        // 新しいスキルを追加
        const updatedData = converter.addSkill(yamlData, '特殊', 10, '海の祝福', '海の生物から特別な力を得る能力。');
        console.log('新しいスキル「海の祝福」を追加しました。');
        
        // 変更したオブジェクトをYAMLに保存
        const yamlOutput = converter.objectToYaml(updatedData);
        const outputPath = path.join(__dirname, 'ストラクチャーサンプル_編集済み.yml');
        fs.writeFileSync(outputPath, yamlOutput, 'utf-8');
        console.log('変更をストラクチャーサンプル_編集済み.yml に保存しました。');
        
    } catch (error) {
        console.error('デモ実行中にエラーが発生しました:', error);
    }
}

/**
 * スキル操作のデモ
 */
function demoSkillOperations(): void {
    console.log('\n=== スキル操作のデモ ===');
    
    try {
        // YAMLファイルからオブジェクトを取得
        const yamlFilePath = path.join(__dirname, 'ストラクチャーサンプル.yml');
        const yamlContent = fs.readFileSync(yamlFilePath, 'utf-8');
        const data = converter.yamlToObject(yamlContent);
        
        // スキルを追加
        const dataWithNewSkill = converter.addSkill(data, '特殊', 10, '海の祝福', '海の生物から特別な力を得る能力。');
        console.log('スキル「海の祝福」を追加しました。');
        
        // スキルを更新
        const dataWithUpdatedSkill = converter.updateSkill(dataWithNewSkill, '海の祝福', {
            説明: '海の生物から特別な力を得る能力。水中での戦闘力が大幅に向上する。'
        });
        console.log('スキル「海の祝福」の説明を更新しました。');
        
        // スキルを削除
        const dataWithRemovedSkill = converter.removeSkill(dataWithUpdatedSkill, '魅了術');
        console.log('スキル「魅了術」を削除しました。');
        
        // 変更したオブジェクトをYAMLに保存
        const yamlOutput = converter.objectToYaml(dataWithRemovedSkill);
        const outputPath = path.join(__dirname, 'ストラクチャーサンプル_スキル操作.yml');
        fs.writeFileSync(outputPath, yamlOutput, 'utf-8');
        console.log('変更をストラクチャーサンプル_スキル操作.yml に保存しました。');
        
    } catch (error) {
        console.error('デモ実行中にエラーが発生しました:', error);
    }
}

// スクリプト実行
function main(): void {
    console.log('IdressConverter デモプログラム');
    console.log('----------------------------');
    
    // テキスト→YAML変換デモ
    demoTextToYaml();
    
    // YAML→テキスト変換デモ
    demoYamlToText();
    
    // オブジェクト操作のデモ
    demoObjectOperations();
    
    // スキル操作のデモ
    demoSkillOperations();
    
    console.log('\n全ての処理が完了しました。');
}

// プログラム実行
main();
