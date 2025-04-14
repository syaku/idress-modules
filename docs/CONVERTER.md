# idress_converter モジュール

idress_converterモジュールは、アイドレスのテキストデータとYAMLデータを相互変換し、TypeScriptオブジェクトとして操作するための機能を提供します。

## 目次

- [データ型](#データ型)
- [変換関数](#変換関数)
- [オブジェクト操作関数](#オブジェクト操作関数)
- [ユーティリティ関数](#ユーティリティ関数)
- [使用例](#使用例)

## データ型

### IdressData

アイドレスのデータを表すインターフェース。

```typescript
interface IdressData {
    オーナー: string;
    根拠?: string;
    タイプ?: string;
    オブジェクトタイプ?: 'オブジェクト' | 'ストラクチャー';
    スケール?: number | null;
    データ?: DataItem[];
    HP?: string;
    設定?: string;
    次のアイドレス?: string;
    適用勲章?: Medal[];
    特殊?: string;
    [key: string]: any;
}
```

### DataItem

アイドレスのスキルや能力を表すインターフェース。

```typescript
interface DataItem {
    マーク: string;
    ナンバー: number | null;
    名前: string;
    説明: string;
}
```

### Medal

アイドレスの適用勲章を表すインターフェース。

```typescript
interface Medal {
    名前: string;
    適用効果: string;
    根拠: string;
}
```

## 変換関数

### textToObject(text: string): IdressData

テキスト形式の文字列をIdressDataオブジェクトに変換します。

**パラメータ:**
- `text`: テキスト形式のアイドレスデータ

**戻り値:**
- 変換されたIdressDataオブジェクト

**例:**
```typescript
const text = `生産：１：名前：紅葉ルウシィ（藩王）
オーナー：24-00453-01	紅葉ルウシィ：コンバート、https://sleepy-sunspot-28a.notion.site/09e6687c1767454995ef94a116f1e999
タイプ：キャラクター
スケール：２
生産：５：種族：南国人（紅葉国）
政治：４：職業：藩王（紅葉国）
政治：１：スキル１：人材育成: 優秀な人材を発掘し、育成することで国の将来を担うリーダーを育てる。
防御：０：スキル２：軍事指揮: 国防に関わる決定を下し、軍隊を指揮する能力。
――：―：アイテム１：
――：―：アイテム２：
――：―：装備１：
――：―：装備２：
HP：0
設定：
特殊：
次のアイドレス：未開示`;

const data = textToObject(text);
console.log(data);
```

### objectToYaml(data: IdressData): string

IdressDataオブジェクトをYAML形式の文字列に変換します。

**パラメータ:**
- `data`: 変換対象のIdressDataオブジェクト

**戻り値:**
- YAML形式の文字列

**例:**
```typescript
const yamlString = objectToYaml(data);
console.log(yamlString);
```

### yamlToObject(yamlStr: string): IdressData

YAML形式の文字列をIdressDataオブジェクトに変換します。

**パラメータ:**
- `yamlStr`: YAML形式の文字列

**戻り値:**
- 変換されたIdressDataオブジェクト

**例:**
```typescript
const yamlString = `
オーナー: "24-00453-01\t紅葉ルウシィ"
特殊: ''
オブジェクトタイプ: オブジェクト
根拠: https://sleepy-sunspot-28a.notion.site/09e6687c1767454995ef94a116f1e999
タイプ: キャラクター
スケール: 2
HP: '0'
設定: ''
次のアイドレス: 未開示
データ:
    -
        マーク: 生産
        ナンバー: 1
        名前: 名前
        説明: 紅葉ルウシィ（藩王）
    -
        マーク: 生産
        ナンバー: 5
        名前: 種族
        説明: 南国人（紅葉国）
    -
        マーク: 政治
        ナンバー: 4
        名前: 職業
        説明: 藩王（紅葉国）
    -
        マーク: 政治
        ナンバー: 1
        名前: スキル１
        説明: 優秀な人材を発掘し、育成することで国の将来を担うリーダーを育てる。
    -
        マーク: 防御
        ナンバー: 0
        名前: スキル２
        説明: 国防に関わる決定を下し、軍隊を指揮する能力。
    -
        マーク: ''
        ナンバー: null
        名前: アイテム１
        説明: ''
    -
        マーク: ''
        ナンバー: null
        名前: アイテム２
        説明: ''
    -
        マーク: ''
        ナンバー: null
        名前: 装備１
        説明: ''
    -
        マーク: ''
        ナンバー: null
        名前: 装備２
        説明: ''
適用勲章: []
`;

const data = yamlToObject(yamlString);
console.log(data);
```

### objectToText(data: IdressData): string

IdressDataオブジェクトをテキスト形式の文字列に変換します。

**パラメータ:**
- `data`: 変換対象のIdressDataオブジェクト

**戻り値:**
- テキスト形式の文字列

**例:**
```typescript
const textString = objectToText(data);
console.log(textString);
```


## オブジェクト操作関数

### parseContent(content: string, contentType: 'text' | 'yaml'): IdressData

文字列の内容（テキストまたはYAML）からIdressDataオブジェクトを取得します。

**パラメータ:**
- `content`: 文字列の内容（テキストまたはYAML）
- `contentType`: コンテンツタイプ（'text'または'yaml'）

**戻り値:**
- IdressDataオブジェクト

**例:**
```typescript
const textContent = fs.readFileSync('オブジェクトサンプル.txt', 'utf-8');
const textData = parseContent(textContent, 'text');

const yamlContent = fs.readFileSync('オブジェクトサンプル.yml', 'utf-8');
const yamlData = parseContent(yamlContent, 'yaml');
```

### displayIdressObject(data: IdressData): void

IdressDataオブジェクトの内容をコンソールに表示します。

**パラメータ:**
- `data`: 表示するIdressDataオブジェクト

**例:**
```typescript
const yamlContent = fs.readFileSync('オブジェクトサンプル.yml', 'utf-8');
const data = yamlToObject(yamlContent);
displayIdressObject(data);
```

### addSkill(data: IdressData, mark: string, number: number | null, name: string, description: string): IdressData

IdressDataオブジェクトにスキルを追加します。

**パラメータ:**
- `data`: 対象のIdressDataオブジェクト
- `mark`: マーク
- `number`: ナンバー（nullも可）
- `name`: スキル名
- `description`: スキルの説明

**戻り値:**
- 更新されたIdressDataオブジェクト

**例:**
```typescript
const yamlContent = fs.readFileSync('オブジェクトサンプル.yml', 'utf-8');
const data = yamlToObject(yamlContent);
// キャラクタータイプでは「情報」マークが使用可能
const updatedData = addSkill(data, '情報', 8, 'スキル３', '情報収集と分析を得意とする能力');
const yamlOutput = objectToYaml(updatedData);
fs.writeFileSync('オブジェクトサンプル_編集済み.yml', yamlOutput, 'utf-8');
```

### removeSkill(data: IdressData, skillName: string): IdressData

IdressDataオブジェクトから指定したスキルを削除します。

**パラメータ:**
- `data`: 対象のIdressDataオブジェクト
- `skillName`: 削除するスキル名

**戻り値:**
- 更新されたIdressDataオブジェクト

**例:**
```typescript
const yamlContent = fs.readFileSync('オブジェクトサンプル.yml', 'utf-8');
const data = yamlToObject(yamlContent);
const updatedData = removeSkill(data, 'スキル２');
const yamlOutput = objectToYaml(updatedData);
fs.writeFileSync('オブジェクトサンプル_編集済み.yml', yamlOutput, 'utf-8');
```

### updateSkill(data: IdressData, skillName: string, updates: Partial<DataItem>): IdressData

IdressDataオブジェクトのスキルを更新します。

**パラメータ:**
- `data`: 対象のIdressDataオブジェクト
- `skillName`: 更新するスキル名
- `updates`: 更新内容（マーク、ナンバー、名前、説明のいずれか）

**戻り値:**
- 更新されたIdressDataオブジェクト

**例:**
```typescript
const yamlContent = fs.readFileSync('オブジェクトサンプル.yml', 'utf-8');
const data = yamlToObject(yamlContent);
const updatedData = updateSkill(data, 'スキル１', {
  説明: '希少な神話や伝承を見逃さず記録し、分析する高度な才能'
});
const yamlOutput = objectToYaml(updatedData);
fs.writeFileSync('オブジェクトサンプル_編集済み.yml', yamlOutput, 'utf-8');
```

## ユーティリティ関数

### toFullWidthNumber(str: string): string

半角数字を全角数字に変換します。

**パラメータ:**
- `str`: 変換する文字列

**戻り値:**
- 全角数字に変換された文字列

**例:**
```typescript
const fullWidth = toFullWidthNumber('123');
console.log(fullWidth); // '１２３'
```

### toHalfWidthNumber(str: string): string

全角数字を半角数字に変換します。

**パラメータ:**
- `str`: 変換する文字列

**戻り値:**
- 半角数字に変換された文字列

**例:**
```typescript
const halfWidth = toHalfWidthNumber('１２３');
console.log(halfWidth); // '123'
```

## 使用例

### 基本的な変換

```typescript
import * as converter from './idress_converter';

// テキスト形式からオブジェクトに変換
const text = `A：１：名前：サンプルキャラクター
オーナー：サンプルオーナー
タイプ：キャラクター
スケール：３`;
const data = converter.textToObject(text);
console.log(data);

// オブジェクトからYAML形式に変換
const yamlContent = converter.objectToYaml(data);
console.log(yamlContent);

// YAML形式からオブジェクトに変換
const yamlString = `
オーナー: サンプルオーナー
タイプ: キャラクター
オブジェクトタイプ: オブジェクト
スケール: 3
データ:
  - マーク: A
    ナンバー: 1
    名前: 名前
    説明: サンプルキャラクター
`;
const dataFromYaml = converter.yamlToObject(yamlString);
console.log(dataFromYaml);

// オブジェクトからテキスト形式に変換
const textContent = converter.objectToText(dataFromYaml);
console.log(textContent);
```

### オブジェクトの取得と表示

```typescript
import * as converter from './idress_converter';

// テキスト形式からオブジェクトに変換
const text = `A：１：名前：サンプルキャラクター
オーナー：サンプルオーナー
タイプ：キャラクター
スケール：３`;
const data = converter.textToObject(text);

// オブジェクトの内容を表示
converter.displayIdressObject(data);
```

### スキルの追加・更新・削除

```typescript
import * as converter from './idress_converter';

// テキスト形式からオブジェクトに変換
const text = `A：１：名前：サンプルキャラクター
オーナー：サンプルオーナー
タイプ：キャラクター
スケール：３`;
const data = converter.textToObject(text);

// スキルを追加（キャラクタータイプでは「情報」マークが使用可能）
const dataWithNewSkill = converter.addSkill(data, '情報', 8, 'スキル３', '情報収集と分析を得意とする能力');

// スキルを更新
const dataWithUpdatedSkill = converter.updateSkill(dataWithNewSkill, 'スキル３', {
  説明: '情報収集と分析を得意とする能力。特に歴史的資料の解読に長けている。'
});

// スキルを削除
const dataWithRemovedSkill = converter.removeSkill(dataWithUpdatedSkill, 'スキル３');

// 結果をYAML形式で表示
const yamlOutput = converter.objectToYaml(dataWithRemovedSkill);
console.log(yamlOutput);

// 結果をテキスト形式で表示
const textOutput = converter.objectToText(dataWithRemovedSkill);
console.log(textOutput);
