import {
    IdressData,
    textToObject,
    objectToYaml,
    yamlToObject,
    objectToText,
    addSkill,
    updateSkill,
    removeSkill,
    toFullWidthNumber,
    toHalfWidthNumber,
    displayIdressObject
} from '../../src/idress_converter';

// CommonJSスタイルでfsとpathをインポート
const fs = require('fs');
const path = require('path');

/**
 * テスト結果を表示する関数
 * @param testName テスト名
 * @param result テスト結果
 */
function reportTest(testName: string, result: boolean): void {
    console.log(`[${result ? 'OK' : 'NG'}] ${testName}`);
}

// ===== テスト関数 =====

/**
 * テキスト→オブジェクト→YAML変換のテスト
 */
function testTextToObjectToYaml(): void {
    console.log('\n=== テキスト→オブジェクト→YAML変換のテスト ===');
    
    try {
        // テキスト→オブジェクト変換
        const textContent = fs.readFileSync(path.join(__dirname, '../sample/オブジェクトサンプル.txt'), 'utf-8');
        const obj = textToObject(textContent);
        
        // オブジェクトの検証
        // 実際のサンプルファイルの内容に合わせて期待値を修正
        reportTest('オブジェクトのオーナー', obj.オーナー.includes('紅葉ルウシィ'));
        reportTest('オブジェクトのタイプ', obj.タイプ === 'キャラクター');
        reportTest('オブジェクトのスケール', obj.スケール === 2);
        reportTest('オブジェクトタイプの設定', obj.オブジェクトタイプ === 'オブジェクト');
        reportTest('データ配列の存在', Array.isArray(obj.データ));
        
        if (obj.データ) {
            reportTest('データ項目数', obj.データ.length >= 1);
            
            // 最初のデータ項目の検証
            const firstItem = obj.データ.find(item => item.名前 === '名前');
            if (firstItem) {
                reportTest('最初のデータ項目のマーク', firstItem.マーク !== undefined);
                reportTest('最初のデータ項目のナンバー', firstItem.ナンバー !== undefined);
                reportTest('最初のデータ項目の説明', firstItem.説明 !== undefined);
            }
        }
        
        // オブジェクト→YAML変換
        const yamlContent = objectToYaml(obj);
        reportTest('YAMLの生成', yamlContent.length > 0);
        
        // 一時ファイルに保存して検証
        const outputPath = path.join(__dirname, '../test_output.yml');
        fs.writeFileSync(outputPath, yamlContent, 'utf-8');
        reportTest('YAMLファイルの保存', fs.existsSync(outputPath));
        
        console.log('テキスト→オブジェクト→YAML変換テスト完了');
    } catch (error) {
        console.error('テスト中にエラーが発生しました:', error);
    }
}

/**
 * YAML→オブジェクト→テキスト変換のテスト
 */
function testYamlToObjectToText(): void {
    console.log('\n=== YAML→オブジェクト→テキスト変換のテスト ===');
    
    try {
        // YAML→オブジェクト変換
        const yamlContent = fs.readFileSync(path.join(__dirname, '../sample/オブジェクトサンプル.yml'), 'utf-8');
        const obj = yamlToObject(yamlContent);
        
        // オブジェクトの検証
        reportTest('オブジェクトのオーナー', obj.オーナー !== undefined);
        reportTest('オブジェクトのタイプ', obj.タイプ !== undefined);
        reportTest('オブジェクトのスケール', obj.スケール !== undefined);
        reportTest('オブジェクトタイプの設定', obj.オブジェクトタイプ === 'オブジェクト' || obj.オブジェクトタイプ === 'ストラクチャー');
        reportTest('データ配列の存在', Array.isArray(obj.データ));
        
        if (obj.データ) {
            reportTest('データ項目数', obj.データ.length >= 1);
        }
        
        // オブジェクト→テキスト変換
        const textContent = objectToText(obj);
        reportTest('テキストの生成', textContent.length > 0);
        
        // 一時ファイルに保存して検証
        const outputPath = path.join(__dirname, '../test_output.txt');
        fs.writeFileSync(outputPath, textContent, 'utf-8');
        reportTest('テキストファイルの保存', fs.existsSync(outputPath));
        
        console.log('YAML→オブジェクト→テキスト変換テスト完了');
    } catch (error) {
        console.error('テスト中にエラーが発生しました:', error);
    }
}

/**
 * オブジェクト操作のテスト
 */
function testObjectOperations(): void {
    console.log('\n=== オブジェクト操作のテスト ===');
    
    try {
        // オブジェクトの取得
        const yamlContent = fs.readFileSync(path.join(__dirname, '../sample/オブジェクトサンプル.yml'), 'utf-8');
        const obj = yamlToObject(yamlContent);
        
        // スキル追加のテスト
        const objWithNewSkill = addSkill(obj, 'テスト', 99, 'テストスキル', 'テスト用のスキルです。');
        reportTest('スキル追加', objWithNewSkill.データ?.some(item => item.名前 === 'テストスキル') || false);
        
        // スキル更新のテスト
        const objWithUpdatedSkill = updateSkill(objWithNewSkill, 'テストスキル', {
            説明: '更新されたテスト用のスキルです。'
        });
        const updatedSkill = objWithUpdatedSkill.データ?.find(item => item.名前 === 'テストスキル');
        reportTest('スキル更新', updatedSkill?.説明 === '更新されたテスト用のスキルです。');
        
        // スキル削除のテスト
        const objWithRemovedSkill = removeSkill(objWithUpdatedSkill, 'テストスキル');
        reportTest('スキル削除', !objWithRemovedSkill.データ?.some(item => item.名前 === 'テストスキル'));
        
        console.log('オブジェクト操作テスト完了');
    } catch (error) {
        console.error('テスト中にエラーが発生しました:', error);
    }
}

/**
 * 全角/半角変換のテスト
 */
function testNumberConversion(): void {
    console.log('\n=== 全角/半角変換のテスト ===');
    
    try {
        // 半角→全角変換
        const halfWidth = '0123456789';
        const fullWidth = toFullWidthNumber(halfWidth);
        reportTest('半角→全角変換', fullWidth === '０１２３４５６７８９');
        
        // 全角→半角変換
        const fullWidth2 = '０１２３４５６７８９';
        const halfWidth2 = toHalfWidthNumber(fullWidth2);
        reportTest('全角→半角変換', halfWidth2 === '0123456789');
        
        console.log('全角/半角変換テスト完了');
    } catch (error) {
        console.error('テスト中にエラーが発生しました:', error);
    }
}

/**
 * オブジェクトタイプ変換のテスト
 */
function testObjectTypeConversion(): void {
    console.log('\n=== オブジェクトタイプ変換のテスト ===');
    
    try {
        // オブジェクトタイプがストラクチャーの場合のテスト
        const structureObj: IdressData = {
            オーナー: 'テスト',
            タイプ: '種族',
            オブジェクトタイプ: 'ストラクチャー',
            データ: []
        };
        
        const structureText = objectToText(structureObj);
        reportTest('ストラクチャータイプの出力', structureText.includes('ストラクチャータイプ：種族'));
        
        // オブジェクトタイプがオブジェクトの場合のテスト
        const characterObj: IdressData = {
            オーナー: 'テスト',
            タイプ: 'キャラクター',
            オブジェクトタイプ: 'オブジェクト',
            データ: []
        };
        
        const characterText = objectToText(characterObj);
        reportTest('オブジェクトタイプの出力', characterText.includes('タイプ：キャラクター'));
        
        console.log('オブジェクトタイプ変換テスト完了');
    } catch (error) {
        console.error('テスト中にエラーが発生しました:', error);
    }
}

/**
 * ストラクチャーサンプルをYAMLに変換するテスト
 */
function testStructureTextToYaml(): void {
    console.log('\n=== ストラクチャーサンプルをYAMLに変換するテスト ===');
    
    try {
        // テキストファイルを読み込み
        const filePath = path.join(__dirname, '../sample/ストラクチャーサンプル.txt');
        const textContent = fs.readFileSync(filePath, 'utf-8');
        
        // テキストをオブジェクトに変換
        const data = textToObject(textContent);
        
        // 変換されたオブジェクトの検証
        reportTest('オブジェクトタイプの設定', data.オブジェクトタイプ === 'オブジェクト' || data.オブジェクトタイプ === 'ストラクチャー');
        reportTest('データ配列の存在', Array.isArray(data.データ));
        
        // オブジェクトをYAMLに変換
        const yamlContent = objectToYaml(data);
        reportTest('YAMLの生成', yamlContent.length > 0);
        
        // YAMLファイルに保存
        const outputPath = path.join(__dirname, '../ストラクチャーサンプル_テスト.yml');
        fs.writeFileSync(outputPath, yamlContent, 'utf-8');
        reportTest('YAMLファイルの保存', fs.existsSync(outputPath));
        
        console.log('ストラクチャーサンプルのYAML変換テスト完了');
    } catch (error) {
        console.error('テスト中にエラーが発生しました:', error);
    }
}

/**
 * ストラクチャーサンプルのYAMLをテキストに変換するテスト
 */
function testStructureYamlToText(): void {
    console.log('\n=== ストラクチャーサンプルのYAMLをテキストに変換するテスト ===');
    
    try {
        // YAMLファイルを読み込み
        const filePath = path.join(__dirname, '../ストラクチャーサンプル_テスト.yml');
        const yamlContent = fs.readFileSync(filePath, 'utf-8');
        
        // YAMLをオブジェクトに変換
        const data = yamlToObject(yamlContent);
        
        // 変換されたオブジェクトの検証
        reportTest('オブジェクトタイプの設定', data.オブジェクトタイプ === 'オブジェクト' || data.オブジェクトタイプ === 'ストラクチャー');
        reportTest('データ配列の存在', Array.isArray(data.データ));
        
        // オブジェクトをテキストに変換
        const textContent = objectToText(data);
        reportTest('テキストの生成', textContent.length > 0);
        
        // テキストファイルに保存
        const outputPath = path.join(__dirname, '../ストラクチャーサンプル_テスト.txt');
        fs.writeFileSync(outputPath, textContent, 'utf-8');
        reportTest('テキストファイルの保存', fs.existsSync(outputPath));
        
        console.log('ストラクチャーサンプルのテキスト変換テスト完了');
    } catch (error) {
        console.error('テスト中にエラーが発生しました:', error);
    }
}

/**
 * スキル操作のテスト
 */
function testSkillOperations(): void {
    console.log('\n=== スキル操作のテスト ===');
    
    try {
        // YAMLファイルからオブジェクトを取得
        const yamlFilePath = path.join(__dirname, '../ストラクチャーサンプル_テスト.yml');
        const yamlContent = fs.readFileSync(yamlFilePath, 'utf-8');
        const data = yamlToObject(yamlContent);
        
        // スキルを追加
        const dataWithNewSkill = addSkill(data, '特殊', 10, '海の祝福', '海の生物から特別な力を得る能力。');
        reportTest('スキル追加', dataWithNewSkill.データ?.some(item => item.名前 === '海の祝福') || false);
        
        // スキルを更新
        const dataWithUpdatedSkill = updateSkill(dataWithNewSkill, '海の祝福', {
            説明: '海の生物から特別な力を得る能力。水中での戦闘力が大幅に向上する。'
        });
        const updatedSkill = dataWithUpdatedSkill.データ?.find(item => item.名前 === '海の祝福');
        reportTest('スキル更新', updatedSkill?.説明 === '海の生物から特別な力を得る能力。水中での戦闘力が大幅に向上する。');
        
        // スキルを削除
        const dataWithRemovedSkill = removeSkill(dataWithUpdatedSkill, '海の祝福');
        reportTest('スキル削除', !dataWithRemovedSkill.データ?.some(item => item.名前 === '海の祝福'));
        
        console.log('スキル操作テスト完了');
    } catch (error) {
        console.error('テスト中にエラーが発生しました:', error);
    }
}

/**
 * 全てのテストを実行
 */
function runAllTests(): void {
    console.log('=== IdressConverter テスト開始 ===');
    
    // 各テストを実行
    testTextToObjectToYaml();
    testYamlToObjectToText();
    testObjectOperations();
    testNumberConversion();
    testObjectTypeConversion();
    testStructureTextToYaml();
    testStructureYamlToText();
    testSkillOperations();
    
    console.log('\n=== テスト完了 ===');
    
    // テスト用の一時ファイルを削除
    try {
        const testFiles = [
            path.join(__dirname, '../test_output.yml'),
            path.join(__dirname, '../test_output.txt'),
            path.join(__dirname, '../ストラクチャーサンプル_テスト.yml'),
            path.join(__dirname, '../ストラクチャーサンプル_テスト.txt')
        ];
        
        for (const file of testFiles) {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        }
    } catch (error) {
        console.error('一時ファイルの削除中にエラーが発生しました:', error);
    }
}

// メイン処理
function main(): void {
    // テスト実行
    runAllTests();
}

// プログラム実行
main();
