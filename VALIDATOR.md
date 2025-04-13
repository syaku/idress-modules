# idress_validator モジュール

idress_validatorモジュールは、アイドレスのデータを検証し、問題点を検出・修正するための機能を提供します。

## 目次

- [検証結果の型](#検証結果の型)
- [検証関数](#検証関数)
- [検証結果の表示関数](#検証結果の表示関数)
- [カスタム検証ルール関数](#カスタム検証ルール関数)
- [使用例](#使用例)

## 検証結果の型

### ValidationSeverity

検証結果の重要度レベルを表す列挙型。

```typescript
enum ValidationSeverity {
    ERROR = 'error',       // 重大な問題（必須項目の欠落など）
    WARNING = 'warning',   // 警告（推奨項目の欠落など）
    INFO = 'info'          // 情報（提案など）
}
```

### ValidationItem

検証結果の項目を表すインターフェース。

```typescript
interface ValidationItem {
    field: string;             // 問題のあるフィールド名
    message: string;           // エラーメッセージ
    severity: ValidationSeverity;  // 重要度
    value?: any;               // 問題のある値（オプション）
}
```

### ValidationResult

検証結果全体を表すインターフェース。

```typescript
interface ValidationResult {
    isValid: boolean;              // 全体の検証結果（エラーがなければtrue）
    items: ValidationItem[];       // 検証結果の詳細項目
    data: IdressData;              // 検証対象のデータ
}
```

### ValidationRule

カスタム検証ルールを表すインターフェース。

```typescript
interface ValidationRule {
    field?: string;                                // 対象フィールド名（オプション）
    validate: (data: IdressData) => ValidationItem | null;  // 検証関数
}
```

## 検証関数

### validateIdressData(data: IdressData): ValidationResult

IdressDataオブジェクトを検証します。

**パラメータ:**
- `data`: 検証対象のIdressDataオブジェクト

**戻り値:**
- 検証結果

**検証内容:**
- オーナーが必須項目であることを確認
- オブジェクトタイプが「オブジェクト」または「ストラクチャー」であることを確認
- タイプの値がオブジェクトタイプに応じた適切な値であることを確認
  - オブジェクトの場合: 「キャラクター」「建築物」「メカ」「組織」「国」のいずれか
  - ストラクチャーの場合: 「種族」「職業」「種別」「用途」「仕様」「主要産業」「保有組織」「付属施設」「備品」「装備／アイテム」のいずれか
- スケールが数値またはnullであることを確認
- データ項目の検証
  - 名前が必須項目であることを確認
  - ナンバーが数値またはnullであることを確認
  - ナンバーが0から9の範囲内であることを確認
  - マークが設定されている場合、ナンバーも設定されていることを確認
  - マークがタイプに応じた適切な値であることを確認
  - 名前項目の説明（キャラクター名）が必須であることを確認
- ストラクチャーの場合、ナンバーの重複がないことを確認
- 適用勲章の検証
  - 勲章名が必須項目であることを確認
  - 適用効果が指定されていることを確認
  - 根拠URLの形式が正しいことを確認

**例:**
```typescript
import { readYamlFile } from './idress_converter';
import { validateIdressData } from './idress_validator';

const data = readYamlFile('オブジェクトサンプル.yml');
const result = validateIdressData(data);

console.log(`検証結果: ${result.isValid ? '有効' : '無効'}`);
console.log(`検出された問題: ${result.items.length}件`);
```

### validateWithCustomRules(data: IdressData, rules: ValidationRule[]): ValidationResult

カスタム検証ルールを適用してIdressDataオブジェクトを検証します。

**パラメータ:**
- `data`: 検証対象のIdressDataオブジェクト
- `rules`: 適用するカスタム検証ルールの配列

**戻り値:**
- 検証結果

**例:**
```typescript
import { readYamlFile } from './idress_converter';
import { validateWithCustomRules, createValidationRule, ValidationSeverity } from './idress_validator';

const data = readYamlFile('オブジェクトサンプル.yml');

// カスタム検証ルールの定義
const customRules = [
    // スケールが1から10の範囲内であることを確認
    createValidationRule(
        'スケール',
        (data) => data.スケール === null || (typeof data.スケール === 'number' && data.スケール >= 1 && data.スケール <= 10),
        'スケールは1から10の範囲内である必要があります',
        ValidationSeverity.WARNING
    ),
    
    // 設定が100文字以上あることを確認
    createValidationRule(
        '設定',
        (data) => data.設定 && data.設定.length >= 100,
        '設定は100文字以上の詳細な説明を推奨します',
        ValidationSeverity.INFO
    )
];

const result = validateWithCustomRules(data, customRules);
console.log(`検証結果: ${result.isValid ? '有効' : '無効'}`);
```

## 検証結果の表示関数

### displayValidationResult(result: ValidationResult): void

検証結果をコンソールに表示します。

**パラメータ:**
- `result`: 表示する検証結果

**例:**
```typescript
import { readYamlFile } from './idress_converter';
import { validateIdressData, displayValidationResult } from './idress_validator';

const data = readYamlFile('オブジェクトサンプル.yml');
const result = validateIdressData(data);

displayValidationResult(result);
```

### getValidationResultText(result: ValidationResult): string

検証結果を文字列として取得します。

**パラメータ:**
- `result`: 文字列化する検証結果

**戻り値:**
- 検証結果の文字列表現

**例:**
```typescript
import { readYamlFile } from './idress_converter';
import { validateIdressData, getValidationResultText } from './idress_validator';
import * as fs from 'fs';

const data = readYamlFile('オブジェクトサンプル.yml');
const result = validateIdressData(data);
const resultText = getValidationResultText(result);

fs.writeFileSync('検証結果.txt', resultText, 'utf-8');
```

## カスタム検証ルール関数

### createValidationRule(field: string, validator: (data: IdressData) => boolean, message: string, severity: ValidationSeverity = ValidationSeverity.ERROR): ValidationRule

カスタム検証ルールを作成します。

**パラメータ:**
- `field`: 対象フィールド名
- `validator`: 検証関数（trueを返すと検証成功、falseを返すと検証失敗）
- `message`: エラーメッセージ
- `severity`: 重要度（デフォルトはERROR）

**戻り値:**
- 作成された検証ルール

**例:**
```typescript
import { createValidationRule, ValidationSeverity } from './idress_validator';

// スケールが1から10の範囲内であることを確認するルール
const scaleRangeRule = createValidationRule(
    'スケール',
    (data) => data.スケール === null || (typeof data.スケール === 'number' && data.スケール >= 1 && data.スケール <= 10),
    'スケールは1から10の範囲内である必要があります',
    ValidationSeverity.WARNING
);
```

### requiredField(field: string, message?: string, severity?: ValidationSeverity): ValidationRule

フィールドが存在することを確認するルールを作成します。

**パラメータ:**
- `field`: 対象フィールド名
- `message`: エラーメッセージ（省略時は「{field}は必須項目です」）
- `severity`: 重要度（デフォルトはERROR）

**戻り値:**
- 作成された検証ルール

**例:**
```typescript
import { requiredField, ValidationSeverity } from './idress_validator';

// 設定フィールドが存在することを確認するルール
const settingRequiredRule = requiredField('設定', '設定フィールドの入力を推奨します', ValidationSeverity.INFO);
```

### numberRangeRule(field: string, min: number, max: number, message?: string, severity?: ValidationSeverity): ValidationRule

数値が指定された範囲内であることを確認するルールを作成します。

**パラメータ:**
- `field`: 対象フィールド名
- `min`: 最小値
- `max`: 最大値
- `message`: エラーメッセージ（省略時は「{field}は{min}から{max}の範囲内である必要があります」）
- `severity`: 重要度（デフォルトはERROR）

**戻り値:**
- 作成された検証ルール

**例:**
```typescript
import { numberRangeRule, ValidationSeverity } from './idress_validator';

// スケールが1から10の範囲内であることを確認するルール
const scaleRangeRule = numberRangeRule('スケール', 1, 10, 'スケールは1から10の範囲内である必要があります', ValidationSeverity.WARNING);
```

### patternRule(field: string, pattern: RegExp, message?: string, severity?: ValidationSeverity): ValidationRule

文字列が指定されたパターンに一致することを確認するルールを作成します。

**パラメータ:**
- `field`: 対象フィールド名
- `pattern`: 正規表現パターン
- `message`: エラーメッセージ（省略時は「{field}は指定されたパターンに一致する必要があります」）
- `severity`: 重要度（デフォルトはERROR）

**戻り値:**
- 作成された検証ルール

**例:**
```typescript
import { patternRule, ValidationSeverity } from './idress_validator';

// オーナー名が「ID 名前」の形式であることを確認するルール
const ownerPatternRule = patternRule(
    'オーナー',
    /^[^\s]+\s[^\s]+$/,
    'オーナー名は「ID 名前」の形式が推奨されます',
    ValidationSeverity.INFO
);
```

## 使用例

### 基本的な検証

```typescript
import { readYamlFile } from './idress_converter';
import { validateIdressData, displayValidationResult } from './idress_validator';

// YAMLファイルを読み込み
const data = readYamlFile('オブジェクトサンプル.yml');

// データの検証
const result = validateIdressData(data);

// 検証結果の表示
displayValidationResult(result);

// 検証結果に基づく処理
if (result.isValid) {
    console.log('データは有効です。処理を続行します。');
} else {
    console.log('データに問題があります。修正してください。');
}
```

### カスタム検証ルールの適用

```typescript
import { readYamlFile } from './idress_converter';
import { 
    validateWithCustomRules, 
    displayValidationResult, 
    createValidationRule, 
    requiredField, 
    numberRangeRule, 
    patternRule, 
    ValidationSeverity 
} from './idress_validator';

// YAMLファイルを読み込み
const data = readYamlFile('オブジェクトサンプル.yml');

// カスタム検証ルールの定義
const customRules = [
    // スケールが1から10の範囲内であることを確認
    numberRangeRule('スケール', 1, 10, 'スケールは1から10の範囲内である必要があります', ValidationSeverity.WARNING),
    
    // オーナー名が「ID 名前」の形式であることを確認
    patternRule(
        'オーナー',
        /^[^\s]+\s[^\s]+$/,
        'オーナー名は「ID 名前」の形式が推奨されます',
        ValidationSeverity.INFO
    ),
    
    // 設定フィールドが存在することを確認
    requiredField('設定', '設定フィールドの入力を推奨します', ValidationSeverity.INFO),
    
    // データ項目が5つ以上あることを確認
    createValidationRule(
        'データ',
        (data) => data.データ && data.データ.length >= 5,
        'データ項目は5つ以上あることを推奨します',
        ValidationSeverity.INFO
    )
];

// カスタムルールを適用した検証の実行
const result = validateWithCustomRules(data, customRules);

// 検証結果の表示
displayValidationResult(result);
```

### ファイルの検証と修正

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { readYamlFile, writeYamlFile, IdressData } from './idress_converter';
import { validateIdressData, displayValidationResult } from './idress_validator';

/**
 * ファイルを検証し、問題があれば修正する
 * @param filePath ファイルパス
 * @param autoFix 自動修正を行うかどうか
 */
function validateAndFixFile(filePath: string, autoFix: boolean = false): void {
    console.log(`\n=== ${path.basename(filePath)} の検証と修正 ===`);
    
    // ファイルの読み込み
    const data = readYamlFile(filePath);
    
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
        writeYamlFile(fixedData, fixedFilePath);
        
        console.log(`修正済みデータを ${fixedFilePath} に保存しました。`);
        
        // 修正後のデータを再検証
        console.log('\n修正後のデータを再検証します...');
        const fixedResult = validateIdressData(fixedData);
        displayValidationResult(fixedResult);
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
        
        // タイプが無効または未設定の場合
        if (field === 'タイプ') {
            if (fixedData.オブジェクトタイプ === 'オブジェクト') {
                fixedData.タイプ = 'キャラクター';
            } else if (fixedData.オブジェクトタイプ === 'ストラクチャー') {
                fixedData.タイプ = '種族';
            }
        }
        
        // スケールが数値でない場合
        if (field === 'スケール' && fixedData.スケール !== null && isNaN(Number(fixedData.スケール))) {
            fixedData.スケール = 1; // デフォルト値として1を設定
        }
    }
    
    return fixedData;
}

// 使用例
validateAndFixFile('オブジェクトサンプル.yml', true);
