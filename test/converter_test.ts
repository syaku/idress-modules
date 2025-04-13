import * as converter from '../src/idress_converter';
import * as fs from 'fs';

/**
 * テスト結果を表示する関数
 * @param testName テスト名
 * @param result テスト結果
 */
function reportTest(testName: string, result: boolean): void {
    console.log(`[${result ? 'OK' : 'NG'}] ${testName}`);
}

/**
 * テキスト→オブジェクト→YAML変換のテスト
 */
function testTextToObjectToYaml(): void {
    console.log('\n=== テキスト→オブジェクト→YAML変換のテスト ===');
    
    try {
        // テキスト→オブジェクト変換
        const textContent = fs.readFileSync('ストラクチャーサンプル.txt', 'utf-8');
        const obj = converter.textToObject(textContent);
        
        // オブジェクトの検証
        reportTest('オブジェクトのオーナー', obj.オーナー === '紅葉国');
        reportTest('オブジェクトのタイプ', obj.タイプ === '種族');
        reportTest('オブジェクトのスケール', obj.スケール === 0);
        reportTest('オブジェクトタイプの設定', obj.オブジェクトタイプ === 'ストラクチャー');
        reportTest('データ配列の存在', Array.isArray(obj.データ));
        
        if (obj.データ) {
            reportTest('データ項目数', obj.データ.length === 11);
            
            // 最初のデータ項目の検証
            const firstItem = obj.データ.find(item => item.名前 === '名前');
            if (firstItem) {
                reportTest('最初のデータ項目のマーク', firstItem.マーク === '生産');
                reportTest('最初のデータ項目のナンバー', firstItem.ナンバー === 5);
                reportTest('最初のデータ項目の説明', firstItem.説明 === '水乙女');
            }
            
            // スキルの検証
            const skill = obj.データ.find(item => item.名前 === '水中適応');
            if (skill) {
                reportTest('スキルのマーク', skill.マーク === '移動');
                reportTest('スキルのナンバー', skill.ナンバー === 0);
                reportTest('スキルの説明', skill.説明.includes('長時間の潜水と高速泳ぎの能力'));
            }
        }
        
        // オブジェクト→YAML変換
        const yamlContent = converter.objectToYaml(obj);
        reportTest('YAMLの生成', yamlContent.length > 0);
        
        // 一時ファイルに保存して検証
        fs.writeFileSync('test_output.yml', yamlContent, 'utf-8');
        reportTest('YAMLファイルの保存', fs.existsSync('test_output.yml'));
        
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
        const yamlContent = fs.readFileSync('ストラクチャーサンプル.yml', 'utf-8');
        const obj = converter.yamlToObject(yamlContent);
        
        // オブジェクトの検証
        reportTest('オブジェクトのオーナー', obj.オーナー === '紅葉国');
        reportTest('オブジェクトのタイプ', obj.タイプ === '種族');
        reportTest('オブジェクトのスケール', obj.スケール === 0);
        reportTest('オブジェクトタイプの設定', obj.オブジェクトタイプ === 'オブジェクト' || obj.オブジェクトタイプ === 'ストラクチャー');
        reportTest('データ配列の存在', Array.isArray(obj.データ));
        
        if (obj.データ) {
            reportTest('データ項目数', obj.データ.length >= 11);
            
            // スキルの検証
            const skill = obj.データ.find(item => item.名前 === '水中適応');
            if (skill) {
                reportTest('スキルのマーク', skill.マーク === '移動');
                reportTest('スキルのナンバー', skill.ナンバー === 0);
                reportTest('スキルの説明', skill.説明.includes('長時間の潜水と高速泳ぎの能力'));
            }
        }
        
        // オブジェクト→テキスト変換
        const textContent = converter.objectToText(obj);
        reportTest('テキストの生成', textContent.length > 0);
        
        // 一時ファイルに保存して検証
        fs.writeFileSync('test_output.txt', textContent, 'utf-8');
        reportTest('テキストファイルの保存', fs.existsSync('test_output.txt'));
        
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
        const yamlContent = fs.readFileSync('test/ストラクチャーサンプル.yml', 'utf-8');
        const obj = converter.yamlToObject(yamlContent);
        
        // スキル追加のテスト
        const objWithNewSkill = converter.addSkill(obj, 'テスト', 99, 'テストスキル', 'テスト用のスキルです。');
        reportTest('スキル追加', objWithNewSkill.データ?.some(item => item.名前 === 'テストスキル') || false);
        
        // スキル更新のテスト
        const objWithUpdatedSkill = converter.updateSkill(objWithNewSkill, 'テストスキル', {
            説明: '更新されたテスト用のスキルです。'
        });
        const updatedSkill = objWithUpdatedSkill.データ?.find(item => item.名前 === 'テストスキル');
        reportTest('スキル更新', updatedSkill?.説明 === '更新されたテスト用のスキルです。');
        
        // スキル削除のテスト
        const objWithRemovedSkill = converter.removeSkill(objWithUpdatedSkill, 'テストスキル');
        reportTest('スキル削除', !objWithRemovedSkill.データ?.some(item => item.名前 === 'テストスキル'));
        
        console.log('オブジェクト操作テスト完了');
    } catch (error) {
        console.error('テスト中にエラーが発生しました:', error);
    }
}

/**
 * ファイル変換のテスト
 */
function testFileConversion(): void {
    console.log('\n=== ファイル変換のテスト ===');
    
    try {
        // テキスト→YAML変換
        const textContent = fs.readFileSync('test/ストラクチャーサンプル.txt', 'utf-8');
        const obj1 = converter.textToObject(textContent);
        const yamlContent = converter.objectToYaml(obj1);
        fs.writeFileSync('test/test_conversion.yml', yamlContent, 'utf-8');
        reportTest('テキスト→YAML変換', fs.existsSync('test/test_conversion.yml'));
        
        // YAML→テキスト変換
        const yamlContent2 = fs.readFileSync('test/test_conversion.yml', 'utf-8');
        const obj2 = converter.yamlToObject(yamlContent2);
        const textContent2 = converter.objectToText(obj2);
        fs.writeFileSync('test/test_conversion.txt', textContent2, 'utf-8');
        reportTest('YAML→テキスト変換', fs.existsSync('test/test_conversion.txt'));
        
        console.log('ファイル変換テスト完了');
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
        const fullWidth = converter.toFullWidthNumber(halfWidth);
        reportTest('半角→全角変換', fullWidth === '０１２３４５６７８９');
        
        // 全角→半角変換
        const fullWidth2 = '０１２３４５６７８９';
        const halfWidth2 = converter.toHalfWidthNumber(fullWidth2);
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
        const structureObj: converter.IdressData = {
            オーナー: 'テスト',
            タイプ: '種族',
            オブジェクトタイプ: 'ストラクチャー',
            データ: []
        };
        
        const structureText = converter.objectToText(structureObj);
        reportTest('ストラクチャータイプの出力', structureText.includes('ストラクチャータイプ：種族'));
        
        // オブジェクトタイプがオブジェクトの場合のテスト
        const characterObj: converter.IdressData = {
            オーナー: 'テスト',
            タイプ: 'キャラクター',
            オブジェクトタイプ: 'オブジェクト',
            データ: []
        };
        
        const characterText = converter.objectToText(characterObj);
        reportTest('オブジェクトタイプの出力', characterText.includes('タイプ：キャラクター'));
        
        console.log('オブジェクトタイプ変換テスト完了');
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
    testFileConversion();
    testNumberConversion();
    testObjectTypeConversion();
    
    console.log('\n=== テスト完了 ===');
    
    // テスト用の一時ファイルを削除
    try {
        if (fs.existsSync('test_output.yml')) fs.unlinkSync('test_output.yml');
        if (fs.existsSync('test_output.txt')) fs.unlinkSync('test_output.txt');
        if (fs.existsSync('test_conversion.yml')) fs.unlinkSync('test_conversion.yml');
        if (fs.existsSync('test_conversion.txt')) fs.unlinkSync('test_conversion.txt');
    } catch (error) {
        console.error('一時ファイルの削除中にエラーが発生しました:', error);
    }
}

// テスト実行
runAllTests();
