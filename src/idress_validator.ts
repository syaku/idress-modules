import { IdressData, DataItem, Medal } from './idress_converter';

/**
 * 検証結果の重要度レベル
 */
export enum ValidationSeverity {
    ERROR = 'error',       // 重大な問題（必須項目の欠落など）
    WARNING = 'warning',   // 警告（推奨項目の欠落など）
    INFO = 'info'          // 情報（提案など）
}

/**
 * 検証結果の項目
 */
export interface ValidationItem {
    field: string;             // 問題のあるフィールド名
    message: string;           // エラーメッセージ
    severity: ValidationSeverity;  // 重要度
    value?: any;               // 問題のある値（オプション）
}

/**
 * 検証結果
 */
export interface ValidationResult {
    isValid: boolean;              // 全体の検証結果（エラーがなければtrue）
    items: ValidationItem[];       // 検証結果の詳細項目
    data: IdressData;              // 検証対象のデータ
}

/**
 * IdressDataオブジェクトを検証する
 * @param data 検証対象のIdressDataオブジェクト
 * @returns 検証結果
 */
export function validateIdressData(data: IdressData): ValidationResult {
    const validationItems: ValidationItem[] = [];
    
    // オーナーの検証（必須項目）
    if (!data.オーナー || data.オーナー.trim() === '') {
        validationItems.push({
            field: 'オーナー',
            message: 'オーナーは必須項目です',
            severity: ValidationSeverity.ERROR,
            value: data.オーナー
        });
    }
    
    // オブジェクトタイプの検証
    if (!data.オブジェクトタイプ) {
        validationItems.push({
            field: 'オブジェクトタイプ',
            message: 'オブジェクトタイプが指定されていません',
            severity: ValidationSeverity.WARNING,
            value: data.オブジェクトタイプ
        });
    } else if (data.オブジェクトタイプ !== 'オブジェクト' && data.オブジェクトタイプ !== 'ストラクチャー') {
        validationItems.push({
            field: 'オブジェクトタイプ',
            message: 'オブジェクトタイプは「オブジェクト」または「ストラクチャー」である必要があります',
            severity: ValidationSeverity.ERROR,
            value: data.オブジェクトタイプ
        });
    }
    
    // タイプの検証
    if (!data.タイプ || data.タイプ.trim() === '') {
        validationItems.push({
            field: 'タイプ',
            message: 'タイプは必須項目です',
            severity: ValidationSeverity.WARNING,
            value: data.タイプ
        });
    } else {
        // オブジェクトタイプに応じたタイプの値の検証
        if (data.オブジェクトタイプ === 'オブジェクト') {
            const validObjectTypes = ['キャラクター', '建築物', 'メカ', '組織', '国'];
            if (!validObjectTypes.includes(data.タイプ)) {
                validationItems.push({
                    field: 'タイプ',
                    message: `オブジェクトの場合、タイプは ${validObjectTypes.join('、')} のいずれかである必要があります`,
                    severity: ValidationSeverity.ERROR,
                    value: data.タイプ
                });
            }
        } else if (data.オブジェクトタイプ === 'ストラクチャー') {
            const validStructureTypes = ['種族', '職業', '種別', '用途', '仕様', '主要産業', '保有組織', '付属施設', '備品', '装備／アイテム'];
            if (!validStructureTypes.includes(data.タイプ)) {
                validationItems.push({
                    field: 'タイプ',
                    message: `ストラクチャーの場合、タイプは ${validStructureTypes.join('、')} のいずれかである必要があります`,
                    severity: ValidationSeverity.ERROR,
                    value: data.タイプ
                });
            }
        }
    }
    
    // スケールの検証
    if (data.スケール === undefined) {
        validationItems.push({
            field: 'スケール',
            message: 'スケールが指定されていません',
            severity: ValidationSeverity.WARNING,
            value: data.スケール
        });
    } else if (data.スケール !== null && isNaN(Number(data.スケール))) {
        validationItems.push({
            field: 'スケール',
            message: 'スケールは数値または null である必要があります',
            severity: ValidationSeverity.ERROR,
            value: data.スケール
        });
    }
    
    // データ配列の検証
    if (!data.データ || data.データ.length === 0) {
        validationItems.push({
            field: 'データ',
            message: 'データ項目が存在しません',
            severity: ValidationSeverity.WARNING
        });
    } else {
        // 各データ項目の検証
        data.データ.forEach((item, index) => {
            validateDataItem(item, index, validationItems, data);
        });
        
        // 名前項目の存在確認
        const nameItem = data.データ.find(item => item.名前 === '名前');
        if (!nameItem) {
            validationItems.push({
                field: 'データ',
                message: '「名前」項目が見つかりません',
                severity: ValidationSeverity.WARNING
            });
        }
        
        // オブジェクトタイプがストラクチャーの場合、ナンバーの重複をチェック
        if (data.オブジェクトタイプ === 'ストラクチャー') {
            const numberMap = new Map<number, DataItem[]>();
            
            // ナンバーごとにアイテムをグループ化
            data.データ.forEach(item => {
                if (item.ナンバー !== null) {
                    if (!numberMap.has(item.ナンバー)) {
                        numberMap.set(item.ナンバー, []);
                    }
                    numberMap.get(item.ナンバー)?.push(item);
                }
            });
            
            // 重複するナンバーを検出
            numberMap.forEach((items, number) => {
                if (items.length > 1) {
                    const duplicateNames = items.map(item => item.名前).join('、');
                    validationItems.push({
                        field: 'データ',
                        message: `ストラクチャー内でナンバー ${number} が重複しています（${duplicateNames}）`,
                        severity: ValidationSeverity.ERROR,
                        value: number
                    });
                }
            });
        }
    }
    
    // 適用勲章の検証
    if (data.適用勲章 && data.適用勲章.length > 0) {
        data.適用勲章.forEach((medal, index) => {
            validateMedal(medal, index, validationItems);
        });
    }
    
    // 根拠の検証（URLのように見える場合のみ）
    if (data.根拠 && looksLikeUrl(data.根拠)) {
        validateUrl(data.根拠, '根拠', validationItems);
    }
    
    // 検証結果の作成
    const hasErrors = validationItems.some(item => item.severity === ValidationSeverity.ERROR);
    
    return {
        isValid: !hasErrors,
        items: validationItems,
        data: data
    };
}

// タイプごとに使用できるマークのマッピング
const typeToAllowedMarks: Record<string, string[]> = {
    // オブジェクト
    'キャラクター': ['攻撃', '防御', '移動', '索敵', '調査', '事務', '作業', '知識', '交渉', '土木', '情報', '先手', '政治', '生産'],
    '建築物': ['攻撃', '防御', '索敵', '事務', '作業', '土木', '情報', '政治', '生産'],
    'メカ': ['攻撃', '防御', '移動', '索敵', '作業', '土木', '情報', '先手'],
    '組織': ['攻撃', '防御', '移動', '索敵', '調査', '事務', '作業', '知識', '交渉', '土木', '情報', '生産'],
    '国': ['調査', '事務', '作業', '土木', '情報', '先手', '政治', '生産'],
    
    // ストラクチャー
    '種族': ['攻撃', '防御', '移動', '索敵', '調査', '事務', '作業', '知識', '交渉', '土木', '情報', '先手', '政治', '生産'],
    '職業': ['攻撃', '防御', '移動', '索敵', '調査', '事務', '作業', '知識', '交渉', '土木', '情報', '先手', '政治', '生産'],
    '種別': ['攻撃', '防御', '索敵', '事務', '作業', '土木', '情報', '政治', '生産', '移動', '先手', '調査', '知識', '交渉'],
    '用途': ['攻撃', '防御', '移動', '索敵', '調査', '事務', '作業', '知識', '交渉', '土木', '情報', '政治', '生産'],
    '仕様': ['攻撃', '防御', '移動', '索敵', '作業', '土木', '情報', '先手'],
    '主要産業': ['調査', '事務', '作業', '土木', '情報', '先手', '政治', '生産'],
    '保有組織': ['攻撃', '防御', '移動', '索敵', '調査', '事務', '作業', '知識', '交渉', '土木', '情報', '生産'],
    '付属施設': ['攻撃', '防御', '索敵', '事務', '作業', '土木', '情報', '政治', '生産'],
    '備品': ['攻撃', '防御', '索敵', '事務', '作業', '土木', '情報', '政治', '生産'],
    '装備／アイテム': ['攻撃', '防御', '移動', '索敵', '調査', '事務', '作業', '知識', '土木', '情報']
};

/**
 * データ項目を検証する
 * @param item 検証対象のデータ項目
 * @param index 配列内のインデックス
 * @param validationItems 検証結果を格納する配列
 * @param data 親のIdressDataオブジェクト
 */
function validateDataItem(item: DataItem, index: number, validationItems: ValidationItem[], data: IdressData): void {
    const fieldPrefix = `データ[${index}]`;
    
    // 名前の検証
    if (!item.名前 || item.名前.trim() === '') {
        validationItems.push({
            field: `${fieldPrefix}.名前`,
            message: '名前は必須項目です',
            severity: ValidationSeverity.ERROR,
            value: item.名前
        });
    }
    
    // ナンバーの検証（nullは許容）
    if (item.ナンバー !== null && isNaN(Number(item.ナンバー))) {
        validationItems.push({
            field: `${fieldPrefix}.ナンバー`,
            message: 'ナンバーは数値または null である必要があります',
            severity: ValidationSeverity.ERROR,
            value: item.ナンバー
        });
    }
    
    // ナンバーが0から9の範囲内であることを確認
    if (item.ナンバー !== null && (item.ナンバー < 0 || item.ナンバー > 9)) {
        validationItems.push({
            field: `${fieldPrefix}.ナンバー`,
            message: 'ナンバーは0から9の範囲内である必要があります',
            severity: ValidationSeverity.ERROR,
            value: item.ナンバー
        });
    }
    
    // マークが設定されている場合、ナンバーも設定されている必要がある
    if (item.マーク && item.マーク.trim() !== '' && item.ナンバー === null) {
        validationItems.push({
            field: `${fieldPrefix}.ナンバー`,
            message: 'マークが設定されている場合、ナンバーも設定されている必要があります',
            severity: ValidationSeverity.ERROR,
            value: item.ナンバー
        });
    }
    
    // マークの検証（タイプごとに使用できるマークが異なる）
    if (item.マーク && item.マーク.trim() !== '' && data.タイプ) {
        const allowedMarks = typeToAllowedMarks[data.タイプ];
        
        if (allowedMarks && !allowedMarks.includes(item.マーク)) {
            // オブジェクトタイプに応じて重要度を変える
            const severity = data.オブジェクトタイプ === 'オブジェクト' ? 
                ValidationSeverity.ERROR : 
                ValidationSeverity.WARNING;
            
            validationItems.push({
                field: `${fieldPrefix}.マーク`,
                message: `タイプ「${data.タイプ}」では「${item.マーク}」マークは使用できません。使用可能なマーク: ${allowedMarks.join(', ')}`,
                severity: severity,
                value: item.マーク
            });
        }
    }
    
    // 説明の検証（名前が「名前」の場合は必須）
    if (item.名前 === '名前' && (!item.説明 || item.説明.trim() === '')) {
        validationItems.push({
            field: `${fieldPrefix}.説明`,
            message: '名前項目の説明（キャラクター名）は必須です',
            severity: ValidationSeverity.ERROR,
            value: item.説明
        });
    }
}

/**
 * 勲章を検証する
 * @param medal 検証対象の勲章
 * @param index 配列内のインデックス
 * @param validationItems 検証結果を格納する配列
 */
function validateMedal(medal: Medal, index: number, validationItems: ValidationItem[]): void {
    const fieldPrefix = `適用勲章[${index}]`;
    
    // 名前の検証
    if (!medal.名前 || medal.名前.trim() === '') {
        validationItems.push({
            field: `${fieldPrefix}.名前`,
            message: '勲章名は必須項目です',
            severity: ValidationSeverity.ERROR,
            value: medal.名前
        });
    }
    
    // 適用効果の検証
    if (!medal.適用効果 || medal.適用効果.trim() === '') {
        validationItems.push({
            field: `${fieldPrefix}.適用効果`,
            message: '適用効果が指定されていません',
            severity: ValidationSeverity.WARNING,
            value: medal.適用効果
        });
    }
    
    // 根拠の検証（URLのように見える場合のみ）
    if (medal.根拠 && looksLikeUrl(medal.根拠)) {
        validateUrl(medal.根拠, `${fieldPrefix}.根拠`, validationItems);
    }
}

/**
 * 文字列がURLのように見えるかどうかを判定する
 * @param str 判定する文字列
 * @returns URLのように見える場合はtrue
 */
function looksLikeUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
}

/**
 * URLを検証する
 * @param url 検証対象のURL
 * @param fieldName フィールド名
 * @param validationItems 検証結果を格納する配列
 */
function validateUrl(url: string, fieldName: string, validationItems: ValidationItem[]): void {
    try {
        new URL(url);
    } catch (error) {
        validationItems.push({
            field: fieldName,
            message: 'URLの形式が正しくありません',
            severity: ValidationSeverity.WARNING,
            value: url
        });
    }
}

/**
 * 検証結果をコンソールに表示する
 * @param result 検証結果
 */
export function displayValidationResult(result: ValidationResult): void {
    console.log('\n=== 検証結果 ===');
    console.log(`検証結果: ${result.isValid ? '有効' : '無効'}`);
    
    if (result.items.length === 0) {
        console.log('問題は見つかりませんでした。');
        return;
    }
    
    // 重要度ごとにグループ化
    const errors = result.items.filter(item => item.severity === ValidationSeverity.ERROR);
    const warnings = result.items.filter(item => item.severity === ValidationSeverity.WARNING);
    const infos = result.items.filter(item => item.severity === ValidationSeverity.INFO);
    
    // エラーの表示
    if (errors.length > 0) {
        console.log('\n【エラー】');
        errors.forEach(item => {
            console.log(`- ${item.field}: ${item.message}`);
        });
    }
    
    // 警告の表示
    if (warnings.length > 0) {
        console.log('\n【警告】');
        warnings.forEach(item => {
            console.log(`- ${item.field}: ${item.message}`);
        });
    }
    
    // 情報の表示
    if (infos.length > 0) {
        console.log('\n【情報】');
        infos.forEach(item => {
            console.log(`- ${item.field}: ${item.message}`);
        });
    }
}

/**
 * 検証結果を文字列として取得する
 * @param result 検証結果
 * @returns 検証結果の文字列表現
 */
export function getValidationResultText(result: ValidationResult): string {
    let output = `検証結果: ${result.isValid ? '有効' : '無効'}\n`;
    
    if (result.items.length === 0) {
        output += '問題は見つかりませんでした。';
        return output;
    }
    
    // 重要度ごとにグループ化
    const errors = result.items.filter(item => item.severity === ValidationSeverity.ERROR);
    const warnings = result.items.filter(item => item.severity === ValidationSeverity.WARNING);
    const infos = result.items.filter(item => item.severity === ValidationSeverity.INFO);
    
    // エラーの表示
    if (errors.length > 0) {
        output += '\n【エラー】\n';
        errors.forEach(item => {
            output += `- ${item.field}: ${item.message}\n`;
        });
    }
    
    // 警告の表示
    if (warnings.length > 0) {
        output += '\n【警告】\n';
        warnings.forEach(item => {
            output += `- ${item.field}: ${item.message}\n`;
        });
    }
    
    // 情報の表示
    if (infos.length > 0) {
        output += '\n【情報】\n';
        infos.forEach(item => {
            output += `- ${item.field}: ${item.message}\n`;
        });
    }
    
    return output;
}

/**
 * カスタム検証ルールを適用する
 * @param data 検証対象のIdressDataオブジェクト
 * @param rules カスタム検証ルール
 * @returns 検証結果
 */
export function validateWithCustomRules(data: IdressData, rules: ValidationRule[]): ValidationResult {
    const validationItems: ValidationItem[] = [];
    
    // 各ルールを適用
    for (const rule of rules) {
        try {
            const ruleResult = rule.validate(data);
            if (ruleResult) {
                validationItems.push(ruleResult);
            }
        } catch (error) {
            // ルール適用中のエラーを処理
            validationItems.push({
                field: rule.field || 'unknown',
                message: `検証ルール適用中にエラーが発生しました: ${error}`,
                severity: ValidationSeverity.ERROR
            });
        }
    }
    
    // 標準の検証も実行
    const standardResult = validateIdressData(data);
    
    // 結果をマージ
    const mergedItems = [...validationItems, ...standardResult.items];
    
    // 検証結果の作成
    const hasErrors = mergedItems.some(item => item.severity === ValidationSeverity.ERROR);
    
    return {
        isValid: !hasErrors,
        items: mergedItems,
        data: data
    };
}

/**
 * カスタム検証ルールのインターフェース
 */
export interface ValidationRule {
    field?: string;                                // 対象フィールド名（オプション）
    validate: (data: IdressData) => ValidationItem | null;  // 検証関数
}

/**
 * カスタム検証ルールを作成するヘルパー関数
 * @param field 対象フィールド名
 * @param validator 検証関数
 * @param message エラーメッセージ
 * @param severity 重要度
 * @returns 検証ルール
 */
export function createValidationRule(
    field: string,
    validator: (data: IdressData) => boolean,
    message: string,
    severity: ValidationSeverity = ValidationSeverity.ERROR
): ValidationRule {
    return {
        field,
        validate: (data: IdressData) => {
            if (!validator(data)) {
                return {
                    field,
                    message,
                    severity,
                    value: field.split('.').reduce((obj, key) => obj && obj[key], data as any)
                };
            }
            return null;
        }
    };
}

/**
 * 一般的なフィールド存在チェックルールを作成する
 * @param field フィールド名
 * @param message エラーメッセージ
 * @param severity 重要度
 * @returns 検証ルール
 */
export function requiredField(
    field: string,
    message: string = `${field}は必須項目です`,
    severity: ValidationSeverity = ValidationSeverity.ERROR
): ValidationRule {
    return createValidationRule(
        field,
        (data) => {
            const value = field.split('.').reduce((obj, key) => obj && obj[key], data as any);
            return value !== undefined && value !== null && value !== '';
        },
        message,
        severity
    );
}

/**
 * 数値範囲チェックルールを作成する
 * @param field フィールド名
 * @param min 最小値
 * @param max 最大値
 * @param message エラーメッセージ
 * @param severity 重要度
 * @returns 検証ルール
 */
export function numberRangeRule(
    field: string,
    min: number,
    max: number,
    message: string = `${field}は${min}から${max}の範囲内である必要があります`,
    severity: ValidationSeverity = ValidationSeverity.ERROR
): ValidationRule {
    return createValidationRule(
        field,
        (data) => {
            const value = field.split('.').reduce((obj, key) => obj && obj[key], data as any);
            return value === null || (typeof value === 'number' && value >= min && value <= max);
        },
        message,
        severity
    );
}

/**
 * 文字列パターンチェックルールを作成する
 * @param field フィールド名
 * @param pattern 正規表現パターン
 * @param message エラーメッセージ
 * @param severity 重要度
 * @returns 検証ルール
 */
export function patternRule(
    field: string,
    pattern: RegExp,
    message: string = `${field}は指定されたパターンに一致する必要があります`,
    severity: ValidationSeverity = ValidationSeverity.ERROR
): ValidationRule {
    return createValidationRule(
        field,
        (data) => {
            const value = field.split('.').reduce((obj, key) => obj && obj[key], data as any);
            return value === undefined || value === null || value === '' || pattern.test(value);
        },
        message,
        severity
    );
}
