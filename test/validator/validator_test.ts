import * as fs from 'fs';
import * as path from 'path';
import { IdressData } from '../../src/idress_converter';
import {
    validateIdressData,
    displayValidationResult,
    getValidationResultText,
    ValidationSeverity,
    createValidationRule,
    requiredField,
    numberRangeRule,
    patternRule,
    validateWithCustomRules
} from '../../src/idress_validator';
import * as yaml from 'js-yaml';

/**
 * サンプルデータを検証するテスト
 */
function testValidateIdressData(): void {
    console.log('=== サンプルデータの検証テスト ===');
    
    try {
        // サンプルデータの読み込み
        const yamlContent = fs.readFileSync(path.join(__dirname, '../オブジェクトサンプル.yml'), 'utf-8');
        const data = yaml.load(yamlContent) as IdressData;
        
        // 検証の実行
        const result = validateIdressData(data);
        
        // 結果の表示
        displayValidationResult(result);
    } catch (error) {
        console.error('テスト実行中にエラーが発生しました:', error);
    }
}

/**
 * 無効なデータを検証するテスト
 */
function testValidateInvalidData(): void {
    console.log('\n=== 無効なデータの検証テスト ===');
    
    // 無効なデータの作成
    const invalidData: IdressData = {
        オーナー: '', // 空のオーナー（エラー）
        オブジェクトタイプ: '不明' as any, // 無効なオブジェクトタイプ（エラー）
        スケール: 'abc' as any, // 数値でないスケール（エラー）
        データ: [
            {
                マーク: '攻撃',
                ナンバー: 'xyz' as any, // 数値でないナンバー（エラー）
                名前: '名前',
                説明: '' // 名前項目の説明が空（エラー）
            },
            {
                マーク: '',
                ナンバー: null,
                名前: '', // 空の名前（エラー）
                説明: 'テスト'
            },
            {
                マーク: '防御',
                ナンバー: 15, // 0から9の範囲外（エラー）
                名前: 'スキル1',
                説明: 'テスト説明'
            },
            {
                マーク: '移動', // マークが設定されているがナンバーがnull（エラー）
                ナンバー: null,
                名前: 'スキル2',
                説明: 'テスト説明'
            }
        ],
        適用勲章: [
            {
                名前: '', // 空の勲章名（エラー）
                適用効果: '',
                根拠: 'http://invalid url' // 無効なURL（警告）
            }
        ]
    };
    
    // 検証の実行
    const result = validateIdressData(invalidData);
    
    // 結果の表示
    displayValidationResult(result);
}

/**
 * カスタム検証ルールのテスト
 */
function testCustomValidationRules(): void {
    console.log('\n=== カスタム検証ルールのテスト ===');
    
    try {
        // サンプルデータの読み込み
        const yamlContent = fs.readFileSync(path.join(__dirname, '../オブジェクトサンプル.yml'), 'utf-8');
        const data = yaml.load(yamlContent) as IdressData;
        
        // カスタム検証ルールの定義
        const customRules = [
            // タイプが特定の値のいずれかであることを確認
            createValidationRule(
                'タイプ',
                (data) => {
                    const validTypes = ['キャラクター', 'ヒューマノイド', 'アイテム', 'ストラクチャー'];
                    return validTypes.includes(data.タイプ || '');
                },
                'タイプは「キャラクター」「ヒューマノイド」「アイテム」「ストラクチャー」のいずれかである必要があります',
                ValidationSeverity.WARNING
            ),
            
            // スケールが1から10の範囲内であることを確認
            numberRangeRule('スケール', 1, 10, 'スケールは1から10の範囲内である必要があります', ValidationSeverity.INFO),
            
            // オーナー名が特定のパターンに一致することを確認
            patternRule(
                'オーナー',
                /^[^\s]+\s[^\s]+$/,
                'オーナー名は「ID 名前」の形式が推奨されます',
                ValidationSeverity.INFO
            ),
            
            // 設定フィールドが存在することを確認
            requiredField('設定', '設定フィールドの入力を推奨します', ValidationSeverity.INFO)
        ];
        
        // カスタムルールを適用した検証の実行
        const result = validateWithCustomRules(data, customRules);
        
        // 結果の表示
        displayValidationResult(result);
    } catch (error) {
        console.error('テスト実行中にエラーが発生しました:', error);
    }
}

/**
 * ストラクチャー内のナンバー重複をテストする
 */
function testDuplicateNumbersInStructure(): void {
    console.log('\n=== ストラクチャー内のナンバー重複テスト ===');
    
    // ナンバーが重複するストラクチャーデータの作成
    const structureData: IdressData = {
        オーナー: 'テストユーザー',
        オブジェクトタイプ: 'ストラクチャー',
        タイプ: '種族',
        スケール: 5,
        データ: [
            {
                マーク: '知識',
                ナンバー: 1,
                名前: '名前',
                説明: 'テストキャラクター'
            },
            {
                マーク: '攻撃',
                ナンバー: 2,
                名前: 'スキルA',
                説明: 'テスト説明A'
            },
            {
                マーク: '防御',
                ナンバー: 2, // 重複するナンバー（エラー）
                名前: 'スキルB',
                説明: 'テスト説明B'
            },
            {
                マーク: '移動',
                ナンバー: 3,
                名前: 'スキルC',
                説明: 'テスト説明C'
            },
            {
                マーク: '索敵',
                ナンバー: 3, // 重複するナンバー（エラー）
                名前: 'スキルD',
                説明: 'テスト説明D'
            }
        ]
    };
    
    // 検証の実行
    const result = validateIdressData(structureData);
    
    // 結果の表示
    displayValidationResult(result);
}

/**
 * オブジェクトタイプに応じたタイプの値の検証テスト
 */
function testObjectTypeValidation(): void {
    console.log('\n=== オブジェクトタイプに応じたタイプの値の検証テスト ===');
    
    // オブジェクトタイプが「オブジェクト」で有効なタイプのテスト
    const validObjectTypes = ['キャラクター', '建築物', 'メカ', '組織', '国'];
    
    console.log('【オブジェクトの有効なタイプのテスト】');
    for (const validType of validObjectTypes) {
        const data: IdressData = {
            オーナー: 'テストユーザー',
            オブジェクトタイプ: 'オブジェクト',
            タイプ: validType,
            スケール: 5,
            データ: [
                {
                    マーク: '知識',
                    ナンバー: 1,
                    名前: '名前',
                    説明: 'テスト'
                }
            ]
        };
        
        const result = validateIdressData(data);
        console.log(`タイプ「${validType}」: ${result.isValid ? '有効' : '無効'}`);
        
        // タイプに関するエラーがないことを確認
        const typeErrors = result.items.filter(item => 
            item.field === 'タイプ' && 
            item.severity === ValidationSeverity.ERROR
        );
        
        if (typeErrors.length > 0) {
            console.log(`  エラー: ${typeErrors.map(e => e.message).join(', ')}`);
        }
    }
    
    // オブジェクトタイプが「オブジェクト」で無効なタイプのテスト
    console.log('\n【オブジェクトの無効なタイプのテスト】');
    const invalidObjectType = '無効なタイプ';
    const invalidObjectData: IdressData = {
        オーナー: 'テストユーザー',
        オブジェクトタイプ: 'オブジェクト',
        タイプ: invalidObjectType,
        スケール: 5,
        データ: [
            {
                マーク: '知識',
                ナンバー: 1,
                名前: '名前',
                説明: 'テスト'
            }
        ]
    };
    
    const invalidObjectResult = validateIdressData(invalidObjectData);
    console.log(`タイプ「${invalidObjectType}」: ${invalidObjectResult.isValid ? '有効' : '無効'}`);
    
    // タイプに関するエラーを表示
    const objectTypeErrors = invalidObjectResult.items.filter(item => 
        item.field === 'タイプ' && 
        item.severity === ValidationSeverity.ERROR
    );
    
    if (objectTypeErrors.length > 0) {
        console.log(`  エラー: ${objectTypeErrors.map(e => e.message).join(', ')}`);
    }
}

/**
 * ファイル検証と修正のデモ
 */
function demoValidateAndFixFile(): void {
    console.log('\n=== ファイル検証と修正のデモ ===');
    
    try {
        // サンプルデータの読み込み
        const yamlContent = fs.readFileSync(path.join(__dirname, '../オブジェクトサンプル.yml'), 'utf-8');
        const data = yaml.load(yamlContent) as IdressData;
        
        // 問題を含むデータに変更
        const problematicData: IdressData = {
            ...data,
            オーナー: '', // 空のオーナー（エラー）
            スケール: 'abc' as any, // 数値でないスケール（エラー）
        };
        
        // 問題を含むデータをファイルに保存
        const problematicPath = path.join(__dirname, '../デモ_問題あり.yml');
        fs.writeFileSync(problematicPath, yaml.dump(problematicData), 'utf-8');
        console.log('問題を含むデータをデモ_問題あり.ymlに保存しました。');
        
        // データを検証
        console.log('\n問題を含むデータの検証:');
        const validationResult = validateIdressData(problematicData);
        displayValidationResult(validationResult);
        
        // 問題を修正
        console.log('\n問題を修正します...');
        const fixedData: IdressData = {
            ...problematicData,
            オーナー: 'ID-00000 未設定のオーナー', // オーナーを修正
            スケール: 1, // スケールを修正
        };
        
        // 修正したデータをファイルに保存
        const fixedPath = path.join(__dirname, '../デモ_修正済み.yml');
        fs.writeFileSync(fixedPath, yaml.dump(fixedData), 'utf-8');
        console.log('修正したデータをデモ_修正済み.ymlに保存しました。');
        
        // 修正後のデータを再検証
        console.log('\n修正後のデータの検証:');
        const fixedResult = validateIdressData(fixedData);
        displayValidationResult(fixedResult);
        
    } catch (error) {
        console.error('デモ実行中にエラーが発生しました:', error);
    }
}

/**
 * 全てのテストを実行
 */
function runAllTests(): void {
    console.log('=== IdressValidator テスト開始 ===');
    
    // 各テストを実行
    testValidateIdressData();
    testValidateInvalidData();
    testCustomValidationRules();
    testDuplicateNumbersInStructure();
    testObjectTypeValidation();
    
    console.log('\n=== テスト完了 ===');
}

/**
 * デモを実行
 */
function runDemo(): void {
    console.log('\n=== IdressValidator デモ開始 ===');
    
    // デモを実行
    demoValidateAndFixFile();
    
    console.log('\n=== デモ完了 ===');
    
    // デモ用の一時ファイルを削除
    try {
        const demoFiles = [
            path.join(__dirname, '../デモ_問題あり.yml'),
            path.join(__dirname, '../デモ_修正済み.yml')
        ];
        
        for (const file of demoFiles) {
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
    
    // デモ実行（コメントアウトして必要に応じて実行）
    // runDemo();
}

// プログラム実行
main();
