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
const text = `知識：３：名前：鷺坂縁
オーナー：00-00702-01 鷺坂祐介：https://sleepy-sunspot-28a.notion.site/8c4bf546c94945e3b46d4d11dea639ea
オブジェクトタイプ：オブジェクト
タイプ：キャラクター
スケール：2
作業：５：種族：人間（鷺坂版）
知識：２：職業１：学生
――：―：職業２：
――：―：職業３：
知識：６：スキル１：神話収集：希少な神話や伝承を見逃さず記録する才能
先手：４：スキル２：適応力：周囲のおせっかいや環境に柔軟に対応する
――：―：スキル３：
知識：７：アイテム１：神話の書：貴族の学校でも目立たず、知識を深めるための一冊
作業：０：アイテム２：手帳：日々の観察や思索を記録するための必需品
防御：２：装備１：貴族風制服：目立たずに品位を保つための上品な装い
調査：９：装備２：学者の眼鏡：知性を引き立て、情報収集を補助する道具
HP：0
設定：鷺坂祐介の養女なのだが、お兄さんと呼んでいる。たまに世話を焼かれているくらいの距離感で過ごしているが本人はこれくらいがちょうどいいとのこと。すぐにおせっかいをかく自由民が微妙に苦手な学生で貴族の学校で目立たないように生きている。趣味は神話の収集と記録。学者になりたいらしいが、お兄さんの手伝いもしたいらしくて軍に行くか迷っている。
特殊：
次のアイドレス：＜養女＞＜学生＞＜ディレッタント＞＜ミスカトニック大学への留学＞＜軍警察へ行く＞＜貴族の目に留まる＞
適用勲章１：はじめての特殊任務：スキル＋１：エースゲーム
適用勲章２：七つ星の敵：職業＋１：エースゲーム
適用勲章３：銀剣突撃勲章：職業＋１：https://discord.com/channels/780527861299544106/797070086220414976/1357003063164014793`;

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
オーナー: 00-00702-01 鷺坂祐介
根拠: https://sleepy-sunspot-28a.notion.site/8c4bf546c94945e3b46d4d11dea639ea
オブジェクトタイプ: オブジェクト
タイプ: キャラクター
スケール: 2
データ:
  - マーク: 知識
    ナンバー: 3
    名前: 名前
    説明: 鷺坂縁
  - マーク: 作業
    ナンバー: 5
    名前: 種族
    説明: 人間（鷺坂版）
  - マーク: 知識
    ナンバー: 2
    名前: 職業１
    説明: 学生
  - マーク: ""
    ナンバー: null
    名前: 職業２
    説明: ""
  - マーク: ""
    ナンバー: null
    名前: 職業３
    説明: ""
  - マーク: 知識
    ナンバー: 6
    名前: スキル１
    説明: 希少な神話や伝承を見逃さず記録する才能
  - マーク: 先手
    ナンバー: 4
    名前: スキル２
    説明: 周囲のおせっかいや環境に柔軟に対応する
  - マーク: ""
    ナンバー: null
    名前: スキル３
    説明: ""
  - マーク: 知識
    ナンバー: 7
    名前: アイテム１
    説明: 神話の書：貴族の学校でも目立たず、知識を深めるための一冊
  - マーク: 作業
    ナンバー: 0
    名前: アイテム２
    説明: 手帳：日々の観察や思索を記録するための必需品
  - マーク: 防御
    ナンバー: 2
    名前: 装備１
    説明: 貴族風制服：目立たずに品位を保つための上品な装い
  - マーク: 調査
    ナンバー: 9
    名前: 装備２
    説明: 学者の眼鏡：知性を引き立て、情報収集を補助する道具
HP: "0"
設定: 鷺坂祐介の養女なのだが、お兄さんと呼んでいる。たまに世話を焼かれているくらいの距離感で過ごしているが本人はこれくらいがちょうどいいとのこと。すぐにおせっかいをかく自由民が微妙に苦手な学生で貴族の学校で目立たないように生きている。趣味は神話の収集と記録。学者になりたいらしいが、お兄さんの手伝いもしたいらしくて軍に行くか迷っている。
特殊: ""
次のアイドレス: ＜養女＞＜学生＞＜ディレッタント＞＜ミスカトニック大学への留学＞＜軍警察へ行く＞＜貴族の目に留まる＞
適用勲章:
  - 名前: はじめての特殊任務
    適用効果: スキル＋１
    根拠: エースゲーム
  - 名前: 七つ星の敵
    適用効果: 職業＋１
    根拠: エースゲーム
  - 名前: 銀剣突撃勲章
    適用効果: 職業＋１
    根拠: https://discord.com/channels/780527861299544106/797070086220414976/1357003063164014793
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
import * as fs from 'fs';
import * as converter from './idress_converter';

// テキストファイルをYAMLファイルに変換
const textContent = fs.readFileSync('オブジェクトサンプル.txt', 'utf-8');
const data = converter.textToObject(textContent);
const yamlContent = converter.objectToYaml(data);
fs.writeFileSync('オブジェクトサンプル.yml', yamlContent, 'utf-8');
console.log(`テキストファイルをYAMLファイルに変換しました。`);

// YAMLファイルをテキストファイルに変換
const yamlContent2 = fs.readFileSync('オブジェクトサンプル.yml', 'utf-8');
const data2 = converter.yamlToObject(yamlContent2);
const textContent2 = converter.objectToText(data2);
fs.writeFileSync('オブジェクトサンプル_変換結果.txt', textContent2, 'utf-8');
console.log(`YAMLファイルをテキストファイルに変換しました。`);
```

### オブジェクトの取得と表示

```typescript
import * as fs from 'fs';
import * as converter from './idress_converter';

// テキストファイルからオブジェクトを取得
const textContent = fs.readFileSync('オブジェクトサンプル.txt', 'utf-8');
const textData = converter.textToObject(textContent);

// YAMLファイルからオブジェクトを取得
const yamlContent = fs.readFileSync('オブジェクトサンプル.yml', 'utf-8');
const yamlData = converter.yamlToObject(yamlContent);

// オブジェクトの内容を表示
converter.displayIdressObject(yamlData);
```

### スキルの追加・更新・削除

```typescript
import * as fs from 'fs';
import * as converter from './idress_converter';

// YAMLファイルからオブジェクトを取得
const yamlContent = fs.readFileSync('オブジェクトサンプル.yml', 'utf-8');
const data = converter.yamlToObject(yamlContent);

// スキルを追加（キャラクタータイプでは「情報」マークが使用可能）
const dataWithNewSkill = converter.addSkill(data, '情報', 8, 'スキル３', '情報収集と分析を得意とする能力');

// スキルを更新
const dataWithUpdatedSkill = converter.updateSkill(dataWithNewSkill, 'スキル３', {
  説明: '情報収集と分析を得意とする能力。特に歴史的資料の解読に長けている。'
});

// スキルを削除
const dataWithRemovedSkill = converter.removeSkill(dataWithUpdatedSkill, 'スキル２');

// YAMLファイルに保存
const yamlOutput = converter.objectToYaml(dataWithRemovedSkill);
fs.writeFileSync('オブジェクトサンプル_編集済み.yml', yamlOutput, 'utf-8');

// テキストファイルに保存
const textOutput = converter.objectToText(dataWithRemovedSkill);
fs.writeFileSync('オブジェクトサンプル_編集済み.txt', textOutput, 'utf-8');
