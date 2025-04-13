import * as yaml from 'js-yaml';

// 共通のインターフェースと型定義
export interface DataItem {
    マーク: string;
    ナンバー: number | null;
    名前: string;
    説明: string;
}

export interface Medal {
    名前: string;
    適用効果: string;
    根拠: string;
}

export interface IdressData {
    オーナー: string;
    根拠?: string;
    タイプ?: string;
    オブジェクトタイプ?: 'オブジェクト' | 'ストラクチャー';  // 新しいプロパティ
    スケール?: number | null;
    データ?: DataItem[];
    HP?: string;
    設定?: string;
    次のアイドレス?: string;
    適用勲章?: Medal[];
    特殊?: string;
    [key: string]: any;
}

/**
 * 半角数字を全角数字に変換する関数
 * @param str 変換する文字列
 * @returns 全角数字に変換された文字列
 */
export function toFullWidthNumber(str: string): string {
    return str.replace(/[0-9]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
    });
}

/**
 * 全角数字を半角数字に変換する関数
 * @param str 変換する文字列
 * @returns 半角数字に変換された文字列
 */
export function toHalfWidthNumber(str: string): string {
    return str.replace(/[１２３４５６７８９０]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
}

/**
 * テキスト形式の文字列をIdressDataオブジェクトに変換する
 * @param text テキスト形式の文字列
 * @returns IdressDataオブジェクト
 */
export function textToObject(text: string): IdressData {
    const lines = text.split('\n');
    
    // 結果を格納するオブジェクト
    const result: IdressData = {
        オーナー: '',
        特殊: '',
        オブジェクトタイプ: 'オブジェクト' // デフォルト値
    };
    
    // データセクションのアイテムを格納する配列
    const dataItems: DataItem[] = [];
    
    // 適用勲章を格納する配列
    const medals: Medal[] = [];
    
    // 各行を解析
    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line) {
            i++;
            continue;
        }
        
        // 全角コロンと半角コロンの両方に対応
        const normalizedLine = line.replace(/:/g, '：');
        const parts = normalizedLine.split('：');
        if (parts.length < 2) {
            i++;
            continue;
        }
        
        const key = parts[0];
        
        // 最初の行（マーク、ナンバー、名前）の処理
        if (i === 0 && parts.length >= 4 && parts[2] === '名前') {
            // マーク、ナンバー、名前をデータ配列の最初の要素として追加
            const mark = parts[0];
            
            // 全角数字を半角に変換してから数値に変換
            const numStr = parts[1].trim();
            const number = numStr === '' || numStr === '―' ? 
                null : 
                Number(toHalfWidthNumber(numStr));
            
            // 「名前：ルウシィ・紅葉」の形式から正しく名前を抽出
            const name = parts[3]; // 「ルウシィ・紅葉」が正しい名前
            
            // データ配列に追加
            dataItems.push({
                マーク: mark,
                ナンバー: number,
                名前: '名前',
                説明: name
            });
            
            i++;
            continue;
        }
        
        // オーナーと根拠URL
        if (key === 'オーナー') {
            result.オーナー = parts[1];
            
            // URLの抽出
            if (line.includes('http')) {
                const urlMatch = line.match(/(https?:\/\/\S+)/);
                if (urlMatch) {
                    result.根拠 = urlMatch[1];
                }
            }
            i++;
        }
        // 特殊フィールドの処理
        else if (key === '特殊') {
            result.特殊 = parts.length > 1 ? parts[1] : '';
            i++;
        }
        // タイプまたはストラクチャータイプの処理
        else if (key === 'タイプ' || key === 'ストラクチャータイプ') {
            result.タイプ = parts[1];
            
            // keyがストラクチャータイプの場合、オブジェクトタイプをストラクチャーに設定
            if (key === 'ストラクチャータイプ') {
                result.オブジェクトタイプ = 'ストラクチャー';
            }
            
            i++;
        }
        // スケールは数値として処理
        else if (key === 'スケール') {
            const scaleStr = parts[1].trim();
            result[key] = scaleStr === '' || scaleStr === '―' ? 
                null : 
                Number(toHalfWidthNumber(scaleStr));
            i++;
        }
        // HP情報
        else if (key === 'HP') {
            result.HP = parts[1];
            i++;
        }
        // 設定情報
        else if (key === '設定') {
            result.設定 = parts.slice(1).join('：');
            i++;
        }
        // 次のアイドレス
        else if (key === '次のアイドレス') {
            result.次のアイドレス = parts.slice(1).join('：');
            i++;
        }
        // 適用勲章
        else if (key.startsWith('適用勲章')) {
            if (parts.length >= 2) {
                const medalName = parts[1];
                let medalEffect = "";
                let medalUrl = "";
                
                // 効果と根拠URLの抽出
                if (parts.length >= 3) {
                    medalEffect = parts[2];
                }
                
                // URLの抽出
                const urlMatch = line.match(/(https?:\/\/\S+)/);
                if (urlMatch) {
                    medalUrl = urlMatch[1];
                }
                
                const medal: Medal = {
                    名前: medalName,
                    適用効果: medalEffect,
                    根拠: medalUrl
                };
                medals.push(medal);
            }
            i++;
        }
        // データセクションの項目（スキルや能力の説明を含む行）
        else if (parts.length >= 3) {
            // 元の行を使用して半角コロンの位置を特定
            const originalLine = line;
            const colonIndex = originalLine.indexOf(':');
            
            // マーク、ナンバー、スキル名、説明の形式
            const numStr = parts[1].trim();
            let skillName = parts[2].trim();
            let description = '';
            
            // 半角コロンがある場合、スキル名と説明を分離
            if (colonIndex !== -1 && parts.length >= 3) {
                // 元の行から説明部分を抽出
                description = originalLine.substring(colonIndex + 1).trim();
                
                // スキル名から余分な部分を削除（半角コロン以降）
                const skillColonIndex = skillName.indexOf(':');
                if (skillColonIndex !== -1) {
                    skillName = skillName.substring(0, skillColonIndex).trim();
                }
            } else if (parts.length >= 4) {
                // 全角コロンで区切られている場合
                skillName = parts[2];
                description = parts[3];
            }
            
            const item: DataItem = {
                マーク: parts[0] !== '――' ? parts[0] : '',
                ナンバー: numStr === '―' || numStr === '' ? 
                    null : 
                    Number(toHalfWidthNumber(numStr)),
                名前: skillName,
                説明: description
            };
            dataItems.push(item);
            i++;
        }
        else {
            // その他の情報
            result[key] = parts.length > 1 ? parts[1] : "";
            i++;
        }
    }
    
    // データセクションを追加
    if (dataItems.length > 0) {
        result.データ = dataItems;
    }
    
    // 適用勲章セクションを追加
    if (medals.length > 0) {
        result.適用勲章 = medals;
    } else {
        result.適用勲章 = [];
    }
    
    return result;
}

/**
 * IdressDataオブジェクトをYAML形式の文字列に変換する
 * @param data IdressDataオブジェクト
 * @returns YAML形式の文字列
 */
export function objectToYaml(data: IdressData): string {
    return yaml.dump(data, { 
        indent: 4, 
        lineWidth: -1, 
        sortKeys: false,
        noRefs: true,
        noCompatMode: true
    });
}

/**
 * YAML形式の文字列をIdressDataオブジェクトに変換する
 * @param yamlStr YAML形式の文字列
 * @returns IdressDataオブジェクト
 */
export function yamlToObject(yamlStr: string): IdressData {
    const data = yaml.load(yamlStr) as IdressData;
    
    // オブジェクトタイプが設定されていない場合、デフォルト値を設定
    if (!data.オブジェクトタイプ) {
        data.オブジェクトタイプ = 'オブジェクト';
    }
    
    return data;
}

/**
 * IdressDataオブジェクトをテキスト形式の文字列に変換する
 * @param data IdressDataオブジェクト
 * @returns テキスト形式の文字列
 */
export function objectToText(data: IdressData): string {
    const lines: string[] = [];
    
    // データ配列から最初の要素（マーク、ナンバー、名前）を取得
    let firstItem: DataItem | undefined;
    if (data.データ && data.データ.length > 0) {
        firstItem = data.データ.find(item => item.名前 === '名前');
        if (firstItem) {
            const mark = firstItem.マーク || '';
            const numberStr = firstItem.ナンバー !== null ? 
                toFullWidthNumber(firstItem.ナンバー.toString()) : 
                '―';
            const name = firstItem.説明 || '';
            lines.push(`${mark}：${numberStr}：名前：${name}`);
        }
    }
    
    // オーナーと根拠URL
    if (data.オーナー) {
        let ownerLine = `オーナー：${data.オーナー}`;
        if (data.根拠) {
            ownerLine += `：${data.根拠}`;
        }
        lines.push(ownerLine);
    }
    
    // 特殊フィールド
    if (data.特殊 !== undefined) {
        lines.push(`特殊：${data.特殊}`);
    }
    
    // タイプ
    if (data.タイプ) {
        // オブジェクトタイプに応じてタイプフィールドを出力
        if (data.オブジェクトタイプ === 'ストラクチャー') {
            lines.push(`ストラクチャータイプ：${data.タイプ}`);
        } else {
            lines.push(`タイプ：${data.タイプ}`);
        }
    }
    
    // スケール
    if (data.スケール !== undefined) {
        const scaleStr = data.スケール !== null ? 
            toFullWidthNumber(data.スケール.toString()) : 
            '―';
        lines.push(`スケール：${scaleStr}`);
    }
    
    // データセクション（最初の要素を除く）
    if (data.データ && data.データ.length > 0) {
        for (const item of data.データ) {
            // 最初の要素（名前）は既に出力済みなのでスキップ
            if (firstItem && item === firstItem) {
                continue;
            }
            
            const mark = item.マーク || '――';
            const numStr = item.ナンバー !== null ? 
                toFullWidthNumber(item.ナンバー.toString()) : 
                '―';
            const name = item.名前 || '';
            const desc = item.説明 || '';
            lines.push(`${mark}：${numStr}：${name}：${desc}`);
        }
    }
    
    // HP
    if (data.HP) {
        lines.push(`HP：${data.HP}`);
    }
    
    // 設定
    if (data.設定) {
        lines.push(`設定：${data.設定}`);
    }
    
    // 次のアイドレス
    if (data.次のアイドレス) {
        lines.push(`次のアイドレス：${data.次のアイドレス}`);
    }
    
    // 適用勲章
    if (data.適用勲章 && data.適用勲章.length > 0) {
        for (let i = 0; i < data.適用勲章.length; i++) {
            const medal = data.適用勲章[i];
            let medalLine = `適用勲章${toFullWidthNumber((i + 1).toString())}：${medal.名前}`;
            if (medal.適用効果) {
                medalLine += `：${medal.適用効果}`;
            }
            if (medal.根拠) {
                medalLine += `：${medal.根拠}`;
            }
            lines.push(medalLine);
        }
    }
    
    return lines.join('\n');
}


/**
 * TypeScriptのオブジェクトを返す処理
 * Cloudflare Workers環境用に修正
 * @param content ファイルの内容（テキストまたはYAML）
 * @param contentType コンテンツタイプ（'text'または'yaml'）
 * @returns IdressDataオブジェクト
 */
export function parseContent(content: string, contentType: 'text' | 'yaml'): IdressData {
    try {
        if (contentType === 'text') {
            return textToObject(content);
        } else {
            return yamlToObject(content);
        }
    } catch (error) {
        console.error(`コンテンツ解析中にエラーが発生しました: ${error}`);
        throw error;
    }
}

/**
 * オブジェクトの内容を表示する
 * @param data IdressDataオブジェクト
 */
export function displayIdressObject(data: IdressData): void {
    console.log('\n=== IdressDataオブジェクトの内容 ===');
    
    // オーナー情報
    console.log(`オーナー: ${data.オーナー}`);
    if (data.根拠) {
        console.log(`根拠: ${data.根拠}`);
    }
    
    // オブジェクトタイプとタイプ
    if (data.オブジェクトタイプ) {
        console.log(`オブジェクトタイプ: ${data.オブジェクトタイプ}`);
    }
    if (data.タイプ) {
        console.log(`タイプ: ${data.タイプ}`);
    }
    if (data.スケール !== undefined) {
        console.log(`スケール: ${data.スケール}`);
    }
    
    // データ項目
    if (data.データ && data.データ.length > 0) {
        console.log('\nデータ項目:');
        for (const item of data.データ) {
            console.log(`- ${item.マーク || ''}：${item.ナンバー !== null ? item.ナンバー : '―'}：${item.名前}：${item.説明 || ''}`);
        }
    }
    
    // その他の情報
    if (data.HP) {
        console.log(`\nHP: ${data.HP}`);
    }
    if (data.設定) {
        console.log(`\n設定: ${data.設定}`);
    }
    if (data.次のアイドレス) {
        console.log(`\n次のアイドレス: ${data.次のアイドレス}`);
    }
    
    // 適用勲章
    if (data.適用勲章 && data.適用勲章.length > 0) {
        console.log('\n適用勲章:');
        for (const medal of data.適用勲章) {
            console.log(`- ${medal.名前}：${medal.適用効果}：${medal.根拠 || ''}`);
        }
    }
}

/**
 * IdressDataオブジェクトにスキルを追加する
 * @param data IdressDataオブジェクト
 * @param mark マーク
 * @param number ナンバー
 * @param name スキル名
 * @param description スキルの説明
 * @returns 更新されたIdressDataオブジェクト
 */
export function addSkill(data: IdressData, mark: string, number: number | null, name: string, description: string): IdressData {
    if (!data.データ) {
        data.データ = [];
    }
    
    data.データ.push({
        マーク: mark,
        ナンバー: number,
        名前: name,
        説明: description
    });
    
    return data;
}

/**
 * IdressDataオブジェクトから指定したスキルを削除する
 * @param data IdressDataオブジェクト
 * @param skillName 削除するスキル名
 * @returns 更新されたIdressDataオブジェクト
 */
export function removeSkill(data: IdressData, skillName: string): IdressData {
    if (data.データ && data.データ.length > 0) {
        data.データ = data.データ.filter(item => item.名前 !== skillName);
    }
    
    return data;
}

/**
 * IdressDataオブジェクトのスキルを更新する
 * @param data IdressDataオブジェクト
 * @param skillName 更新するスキル名
 * @param updates 更新内容（マーク、ナンバー、名前、説明のいずれか）
 * @returns 更新されたIdressDataオブジェクト
 */
export function updateSkill(data: IdressData, skillName: string, updates: Partial<DataItem>): IdressData {
    if (data.データ && data.データ.length > 0) {
        data.データ = data.データ.map(item => {
            if (item.名前 === skillName) {
                return { ...item, ...updates };
            }
            return item;
        });
    }
    
    return data;
}
