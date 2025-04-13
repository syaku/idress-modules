import {
    textToObject,
    yamlToObject,
    objectToText,
    objectToYaml,
    IdressData
} from '../src/idress_converter';

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
} from '../src/idress_validator';

import * as fs from 'fs';
import * as path from 'path';

/**
 * ファイルを検証し、結果を表示する
 * @param filePath ファイルパス
 * @param fileType ファイルタイプ（'text'または'yaml'）
 * @returns 検証結果、またはエラー時はnull
 */
function validateFile(filePath: string, fileType: 'text' | 'yaml'): any {
    try {
        console.log(`\n=== ${path.basename(filePath)} の検証 ===`);
        
        // ファイルの読み込み
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // コンテンツをオブジェクトに変換
        let data: IdressData;
        if (fileType === 'text') {
            data = textToObject(fileContent);
        } else {
            data = yamlToObject(fileContent);
        }
        
        // 検証の実行
        const result = validateIdressData(data);
        
        // 結果の表示
        displayValidationResult(result);
        
        // 検証結果をファイルに保存
        const resultFilePath = `${path.basename(filePath, path.extname(filePath))}_validation_result.txt`;
        fs.writeFileSync(resultFilePath, getValidationResultText(result), 'utf-8');
        console.log(`検証結果を ${resultFilePath} に保存しました。`);
        
        return result;
    } catch (error) {
        console.error(`ファイル検証中にエラーが発生しました: ${error}`);
        return null;
    }
}

/**
 * ファイルを検証し、問題があれば修正する
 * @param filePath ファイルパス
 * @param fileType ファイルタイプ（'text'または'yaml'）
 * @param autoFix 自動修正を行うかどうか
 */
function validateAndFixFile(filePath: string, fileType: 'text' | 'yaml', autoFix: boolean = false): void {
    try {
        console.log(`\n=== ${path.basename(filePath)} の検証と修正 ===`);
        
        // ファイルの読み込み
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // コンテンツをオブジェクトに変換
        let data: IdressData;
        if (fileType === 'text') {
            data = textToObject(fileContent);
        } else {
            data = yamlToObject(fileContent);
        }
        
        // 検証の実行
        const result = validateIdressData(data);
        
        // 結果の表示
        displayValidationResult(result);
        
        // 自動修正が有効な場合
        if (autoFix && !result.isValid) {
            console.log('\n自動修正を実行します...');
            
            // データの修正
            const fixedData = fixData(data, result);
            
            // 修正後のデータを保存
            const fixedFilePath = `${path.basename(filePath, path.extname(filePath))}_fixed${path.extname(filePath)}`;
            let outputContent: string;
            
            if (fileType === 'text') {
                outputContent = objectToText(fixedData);
            } else {
                outputContent = objectToYaml(fixedData);
            }
            
            fs.writeFileSync(fixedFilePath, outputContent, 'utf-8');
            
            console.log(`修正済みデータを ${fixedFilePath} に保存しました。`);
            
            // 修正後のデータを再検証
            console.log('\n修正後のデータを再検証します...');
            const fixedResult = validateIdressData(fixedData);
            displayValidationResult(fixedResult);
        }
    } catch (error) {
        console.error(`ファイル検証・修正中にエラーが発生しました: ${error}`);
    }
}

/**
 * データを自動修正する
 * @param data 修正対象のデータ
 * @param validationResult 検証結果
 * @returns 修正後のデータ
 */
function fixData(data: IdressData, validationResult: any): IdressData {
    // データのコピーを作成
    const fixedData: IdressData = JSON.parse(JSON.stringify(data));
    
    // 各エラー・警告に対して修正を適用
    for (const item of validationResult.items) {
        const field = item.field;
        
        // オーナーが空の場合
        if (field === 'オーナー' && (!fixedData.オーナー || fixedData.オーナー.trim() === '')) {
            fixedData.オーナー = 'ID-00000 未設定のオーナー';
        }
        
        // オブジェクトタイプが無効または未設定の場合
        if (field === 'オブジェクトタイプ') {
            fixedData.オブジェクトタイプ = 'オブジェクト';
        }
        
        // スケールが数値でない場合
        if (field === 'スケール' && fixedData.スケール !== null && isNaN(Number(fixedData.スケール))) {
            fixedData.スケール = 1; // デフォルト値として1を設定
        }
        
        // タイプが未設定の場合
        if (field === 'タイプ' && (!fixedData.タイプ || fixedData.タイプ.trim() === '')) {
            fixedData.タイプ = 'キャラクター';
        }
        
        // データ項目の修正
        if (field.startsWith('データ[') && fixedData.データ) {
            const match = field.match(/データ\[(\d+)\]\.(.+)/);
            if (match) {
                const index = parseInt(match[1]);
                const subField = match[2];
                
                if (index >= 0 && index < fixedData.データ.length) {
                    const item = fixedData.データ[index];
                    
                    // 名前が空の場合
                    if (subField === '名前' && (!item.名前 || item.名前.trim() === '')) {
                        item.名前 = `項目${index + 1}`;
                    }
                    
                    // ナンバーが数値でない場合
                    if (subField === 'ナンバー' && item.ナンバー !== null && isNaN(Number(item.ナンバー))) {
                        item.ナンバー = null;
                    }
                    
                    // 名前項目の説明が空の場合
                    if (subField === '説明' && item.名前 === '名前' && (!item.説明 || item.説明.trim() === '')) {
                        item.説明 = '名前未設定';
                    }
                }
            }
        }
        
        // 適用勲章の修正
        if (field.startsWith('適用勲章[') && fixedData.適用勲章) {
            const match = field.match(/適用勲章\[(\d+)\]\.(.+)/);
            if (match) {
                const index = parseInt(match[1]);
                const subField = match[2];
                
                if (index >= 0 && index < fixedData.適用勲章.length) {
                    const medal = fixedData.適用勲章[index];
                    
                    // 勲章名が空の場合
                    if (subField === '名前' && (!medal.名前 || medal.名前.trim() === '')) {
                        medal.名前 = `勲章${index + 1}`;
                    }
                    
                    // 適用効果が空の場合
                    if (subField === '適用効果' && (!medal.適用効果 || medal.適用効果.trim() === '')) {
                        medal.適用効果 = '効果未設定';
                    }
                    
                    // 根拠URLが無効な場合
                    if (subField === '根拠' && medal.根拠 && medal.根拠.includes(' ')) {
                        medal.根拠 = medal.根拠.replace(/\s+/g, '');
                    }
                }
            }
        }
    }
    
    return fixedData;
}

/**
 * メイン関数
 */
function main(): void {
    // コマンドライン引数の解析
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log('使用方法: npx ts-node validator_demo.ts <ファイルパス> [--yaml|--text] [--fix]');
        console.log('  --yaml: YAMLファイルとして処理します（デフォルト）');
        console.log('  --text: テキストファイルとして処理します');
        console.log('  --fix: 問題を自動修正します');
        return;
    }
    
    const filePath = args[0];
    const isYaml = args.includes('--yaml') || (!args.includes('--text') && path.extname(filePath).toLowerCase() === '.yml');
    const autoFix = args.includes('--fix');
    
    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
        console.error(`エラー: ファイル ${filePath} が見つかりません。`);
        return;
    }
    
    // ファイルの検証と修正
    validateAndFixFile(filePath, isYaml ? 'yaml' : 'text', autoFix);
}

// スクリプトが直接実行された場合のみメイン関数を実行
if (require.main === module) {
    main();
}

// モジュールとしてエクスポート
export {
    validateFile,
    validateAndFixFile
};
