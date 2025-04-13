import { IdressData } from '../src/idress_converter';
import {
    validateIdressData,
    displayValidationResult,
    ValidationSeverity,
    createValidationRule,
    requiredField,
    numberRangeRule,
    patternRule,
    validateWithCustomRules
} from '../src/idress_validator';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

/**
 * サンプルデータを検証するテスト
 */
function testValidateIdressData(): void {
    console.log('=== サンプルデータの検証テスト ===');
    
    try {
        // サンプルデータの読み込み
        const yamlContent = fs.readFileSync('./オブジェクトサンプル.yml', 'utf-8');
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
                マーク: '◆',
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
                マーク: '★',
                ナンバー: 15, // 0から9の範囲外（エラー）
                名前: 'スキル1',
                説明: 'テスト説明'
            },
            {
                マーク: '◇', // マークが設定されているがナンバーがnull（エラー）
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
        const yamlContent = fs.readFileSync('./オブジェクトサンプル.yml', 'utf-8');
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
        タイプ: 'テストストラクチャー',
        スケール: 5,
        データ: [
            {
                マーク: '◆',
                ナンバー: 1,
                名前: '名前',
                説明: 'テストキャラクター'
            },
            {
                マーク: '★',
                ナンバー: 2,
                名前: 'スキルA',
                説明: 'テスト説明A'
            },
            {
                マーク: '◇',
                ナンバー: 2, // 重複するナンバー（エラー）
                名前: 'スキルB',
                説明: 'テスト説明B'
            },
            {
                マーク: '○',
                ナンバー: 3,
                名前: 'スキルC',
                説明: 'テスト説明C'
            },
            {
                マーク: '□',
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
                    マーク: '',
                    ナンバー: null,
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
                マーク: '',
                ナンバー: null,
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
    
    // ストラクチャーの有効なタイプのテスト
    const validStructureTypes = ['種族', '職業', '種別', '用途', '仕様', '主要産業', '保有組織', '付属施設', '備品', '装備／アイテム'];
    
    console.log('\n【ストラクチャーの有効なタイプのテスト】');
    for (const validType of validStructureTypes) {
        const data: IdressData = {
            オーナー: 'テストユーザー',
            オブジェクトタイプ: 'ストラクチャー',
            タイプ: validType,
            スケール: 5,
            データ: [
                {
                    マーク: '',
                    ナンバー: null,
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
    
    // ストラクチャーの無効なタイプのテスト
    console.log('\n【ストラクチャーの無効なタイプのテスト】');
    const invalidStructureType = '無効なタイプ';
    const invalidStructureData: IdressData = {
        オーナー: 'テストユーザー',
        オブジェクトタイプ: 'ストラクチャー',
        タイプ: invalidStructureType,
        スケール: 5,
        データ: [
            {
                マーク: '',
                ナンバー: null,
                名前: '名前',
                説明: 'テスト'
            }
        ]
    };
    
    const invalidStructureResult = validateIdressData(invalidStructureData);
    console.log(`タイプ「${invalidStructureType}」: ${invalidStructureResult.isValid ? '有効' : '無効'}`);
    
    // タイプに関するエラーを表示
    const structureTypeErrors = invalidStructureResult.items.filter(item => 
        item.field === 'タイプ' && 
        item.severity === ValidationSeverity.ERROR
    );
    
    if (structureTypeErrors.length > 0) {
        console.log(`  エラー: ${structureTypeErrors.map(e => e.message).join(', ')}`);
    }
}

/**
 * タイプごとに使用できるマークの検証テスト
 */
function testTypeAllowedMarks(): void {
    console.log('\n=== タイプごとに使用できるマークの検証テスト ===');
    
    // オブジェクトタイプが「オブジェクト」で無効なマークのテスト
    console.log('【オブジェクトの無効なマークのテスト】');
    const objectTypes = ['キャラクター', '建築物', 'メカ', '組織', '国'];
    
    for (const objectType of objectTypes) {
        const invalidMark = '無効なマーク';
        const data: IdressData = {
            オーナー: 'テストユーザー',
            オブジェクトタイプ: 'オブジェクト',
            タイプ: objectType,
            スケール: 5,
            データ: [
                {
                    マーク: '',
                    ナンバー: null,
                    名前: '名前',
                    説明: 'テスト'
                },
                {
                    マーク: invalidMark,
                    ナンバー: 1,
                    名前: 'スキル',
                    説明: 'テスト説明'
                }
            ]
        };
        
        const result = validateIdressData(data);
        console.log(`タイプ「${objectType}」で無効なマーク「${invalidMark}」: ${result.isValid ? '有効' : '無効'}`);
        
        // マークに関するエラーを表示
        const markErrors = result.items.filter(item => 
            item.field.includes('マーク') && 
            item.severity === ValidationSeverity.ERROR
        );
        
        if (markErrors.length > 0) {
            console.log(`  エラー: ${markErrors.map(e => e.message).join(', ')}`);
        }
    }
    
    // ストラクチャーの無効なマークのテスト
    console.log('\n【ストラクチャーの無効なマークのテスト】');
    const structureTypes = ['種族', '職業', '種別', '用途', '仕様', '主要産業', '保有組織', '付属施設', '備品', '装備／アイテム'];
    
    for (const structureType of structureTypes) {
        const invalidMark = '無効なマーク';
        const data: IdressData = {
            オーナー: 'テストユーザー',
            オブジェクトタイプ: 'ストラクチャー',
            タイプ: structureType,
            スケール: 5,
            データ: [
                {
                    マーク: '',
                    ナンバー: null,
                    名前: '名前',
                    説明: 'テスト'
                },
                {
                    マーク: invalidMark,
                    ナンバー: 1,
                    名前: 'スキル',
                    説明: 'テスト説明'
                }
            ]
        };
        
        const result = validateIdressData(data);
        console.log(`タイプ「${structureType}」で無効なマーク「${invalidMark}」: ${result.isValid ? '有効' : '無効'}`);
        
        // マークに関する警告を表示
        const markWarnings = result.items.filter(item => 
            item.field.includes('マーク') && 
            item.severity === ValidationSeverity.WARNING
        );
        
        if (markWarnings.length > 0) {
            console.log(`  警告: ${markWarnings.map(e => e.message).join(', ')}`);
        }
    }
    
    // 有効なマークのテスト
    console.log('\n【有効なマークのテスト】');
    const validMarks = {
        'キャラクター': '攻撃',
        '建築物': '防御',
        'メカ': '移動',
        '組織': '索敵',
        '国': '調査',
        '種族': '事務',
        '職業': '作業',
        '種別': '知識',
        '用途': '交渉',
        '仕様': '土木',
        '主要産業': '情報',
        '保有組織': '情報', // 先手は保有組織に含まれていないので情報に変更
        '付属施設': '政治',
        '備品': '生産',
        '装備／アイテム': '攻撃'
    };
    
    for (const [type, mark] of Object.entries(validMarks)) {
        const objectType = ['キャラクター', '建築物', 'メカ', '組織', '国'].includes(type) ? 'オブジェクト' : 'ストラクチャー';
        
        const data: IdressData = {
            オーナー: 'テストユーザー',
            オブジェクトタイプ: objectType as 'オブジェクト' | 'ストラクチャー',
            タイプ: type,
            スケール: 5,
            データ: [
                {
                    マーク: '',
                    ナンバー: null,
                    名前: '名前',
                    説明: 'テスト'
                },
                {
                    マーク: mark,
                    ナンバー: 1,
                    名前: 'スキル',
                    説明: 'テスト説明'
                }
            ]
        };
        
        const result = validateIdressData(data);
        console.log(`タイプ「${type}」で有効なマーク「${mark}」: ${result.isValid ? '有効' : '無効'}`);
        
        // マークに関するエラーや警告がないことを確認
        const markIssues = result.items.filter(item => 
            item.field.includes('マーク') && 
            (item.severity === ValidationSeverity.ERROR || item.severity === ValidationSeverity.WARNING)
        );
        
        if (markIssues.length > 0) {
            console.log(`  問題: ${markIssues.map(e => e.message).join(', ')}`);
        }
    }
}

/**
 * メイン関数
 */
function main(): void {
    // 標準検証テスト
    testValidateIdressData();
    
    // 無効なデータの検証テスト
    testValidateInvalidData();
    
    // ストラクチャー内のナンバー重複テスト
    testDuplicateNumbersInStructure();
    
    // カスタム検証ルールのテスト
    testCustomValidationRules();
    
    // オブジェクトタイプに応じたタイプの値の検証テスト
    testObjectTypeValidation();
    
    // タイプごとに使用できるマークの検証テスト
    testTypeAllowedMarks();
}

// テストの実行
main();
