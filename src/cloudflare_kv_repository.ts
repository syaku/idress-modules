import { IdressData } from './idress_converter';
import { IdressRepository, IdressFilter, IdressRepositoryFactory } from './idress_repository';

/**
 * Cloudflare KVを使用したIdressRepositoryの実装
 */
export class CloudflareKVRepository implements IdressRepository {
    private namespace: KVNamespace;
    private cacheKey: string = 'idress_index';
    private indexCache: string[] | null = null;

    /**
     * コンストラクタ
     * @param namespace Cloudflare KV Namespace
     */
    constructor(namespace: KVNamespace) {
        this.namespace = namespace;
    }

    /**
     * データから名前を抽出する
     * @param data IdressData
     * @returns 名前（見つからない場合は空文字列）
     */
    private extractName(data: IdressData): string {
        if (data.データ && data.データ.length > 0) {
            const nameItem = data.データ.find(item => item.名前 === '名前');
            if (nameItem && nameItem.説明) {
                return nameItem.説明;
            }
        }
        return '';
    }

    /**
     * 名前からキーを生成する
     * @param name 名前
     * @returns ストアのキー
     */
    private generateKey(name: string): string {
        // 大文字小文字を区別せず、空白も無視して一貫したキーを生成
        return `idress:${name.toLowerCase().trim()}`;
    }

    /**
     * インデックスを取得する
     * @returns 保存されているすべてのキーの配列
     */
    private async getIndex(): Promise<string[]> {
        // キャッシュがあればそれを使用
        if (this.indexCache !== null) {
            return this.indexCache;
        }

        // インデックスを取得
        const indexJson = await this.namespace.get(this.cacheKey);
        if (indexJson) {
            try {
                const parsedIndex = JSON.parse(indexJson) as string[];
                this.indexCache = parsedIndex;
                return parsedIndex;
            } catch (error) {
                console.error('インデックスのパースに失敗しました:', error);
            }
        }

        // インデックスがない場合は空の配列を返す
        const emptyIndex: string[] = [];
        this.indexCache = emptyIndex;
        return emptyIndex;
    }

    /**
     * インデックスを更新する
     * @param keys 保存するキーの配列
     */
    private async updateIndex(keys: string[]): Promise<void> {
        this.indexCache = keys;
        await this.namespace.put(this.cacheKey, JSON.stringify(keys));
    }

    /**
     * インデックスにキーを追加する
     * @param key 追加するキー
     */
    private async addToIndex(key: string): Promise<void> {
        const index = await this.getIndex();
        if (!index.includes(key)) {
            index.push(key);
            await this.updateIndex(index);
        }
    }

    /**
     * インデックスからキーを削除する
     * @param key 削除するキー
     */
    private async removeFromIndex(key: string): Promise<void> {
        const index = await this.getIndex();
        const newIndex = index.filter(k => k !== key);
        if (newIndex.length !== index.length) {
            await this.updateIndex(newIndex);
        }
    }

    /**
     * 新しいIdressDataを保存する
     * @param data 保存するIdressData
     * @returns 保存されたIdressData
     */
    async create(data: IdressData): Promise<IdressData> {
        const name = this.extractName(data);
        if (!name) {
            throw new Error('IdressDataに名前が設定されていません');
        }
        
        const key = this.generateKey(name);
        
        // 既に同じ名前のデータが存在するかチェック
        const existingData = await this.namespace.get(key);
        if (existingData) {
            throw new Error(`既に同じ名前のデータが存在します: ${name}`);
        }
        
        // データを保存
        await this.namespace.put(key, JSON.stringify(data));
        
        // インデックスに追加
        await this.addToIndex(key);
        
        return data;
    }

    /**
     * 指定された名前のIdressDataを取得する
     * @param name 取得するIdressDataの名前
     * @returns 取得したIdressData、存在しない場合はnull
     */
    async findByName(name: string): Promise<IdressData | null> {
        // デバッグ情報
        console.log(`findByName: 検索名='${name}'`);
        
        const key = this.generateKey(name);
        const data = await this.namespace.get(key);
        
        if (!data) {
            return null;
        }
        
        try {
            return JSON.parse(data) as IdressData;
        } catch (error) {
            console.error(`データのパースに失敗しました: ${error}`);
            return null;
        }
    }

    /**
     * 指定された複数の名前のIdressDataを取得する
     * @param names 取得するIdressDataの名前の配列
     * @returns 取得したIdressDataの配列（存在しない名前は結果に含まれない）
     */
    async findByNames(names: string[]): Promise<IdressData[]> {
        // デバッグ情報
        console.log(`findByNames: 検索名リスト=[${names.join(', ')}]`);
        
        const results: IdressData[] = [];
        
        // 各名前について検索
        for (const name of names) {
            const data = await this.findByName(name);
            if (data) {
                results.push(data);
            }
        }
        
        return results;
    }

    /**
     * 条件に一致するIdressDataを検索する
     * @param filter 検索条件
     * @returns 条件に一致するIdressDataの配列
     */
    async find(filter?: IdressFilter): Promise<IdressData[]> {
        // インデックスからすべてのキーを取得
        const keys = await this.getIndex();
        const results: IdressData[] = [];
        
        // すべてのデータを取得してフィルタリング
        for (const key of keys) {
            const dataJson = await this.namespace.get(key);
            if (!dataJson) continue;
            
            try {
                const data = JSON.parse(dataJson) as IdressData;
                
                // フィルタが指定されていない場合、またはフィルタ条件に一致する場合
                if (!filter || this.matchesFilter(data, filter)) {
                    results.push(data);
                }
            } catch (error) {
                console.error(`データのパースに失敗しました (${key}): ${error}`);
            }
        }
        
        return results;
    }

    /**
     * データがフィルタ条件に一致するかチェックする
     * @param data チェックするデータ
     * @param filter フィルタ条件
     * @returns 一致する場合はtrue、そうでない場合はfalse
     */
    private matchesFilter(data: IdressData, filter: IdressFilter): boolean {
        // オーナーによるフィルタリング
        if (filter.オーナー && data.オーナー !== filter.オーナー) {
            return false;
        }
        
        // タイプによるフィルタリング
        if (filter.タイプ && data.タイプ !== filter.タイプ) {
            return false;
        }
        
        // オブジェクトタイプによるフィルタリング
        if (filter.オブジェクトタイプ && data.オブジェクトタイプ !== filter.オブジェクトタイプ) {
            return false;
        }
        
        // 名前による部分一致検索
        if (filter.名前 && data.データ) {
            const nameItem = data.データ.find(item => item.名前 === '名前');
            if (!nameItem || !nameItem.説明 || !nameItem.説明.includes(filter.名前)) {
                return false;
            }
        }
        
        // 複数の名前による完全一致検索
        if (filter.名前リスト && filter.名前リスト.length > 0 && data.データ) {
            const nameItem = data.データ.find(item => item.名前 === '名前');
            if (!nameItem || !nameItem.説明) {
                return false;
            }
            
            const normalizedDataName = nameItem.説明.toLowerCase().trim();
            const matchesAnyName = filter.名前リスト.some(name => 
                name.toLowerCase().trim() === normalizedDataName
            );
            
            if (!matchesAnyName) {
                return false;
            }
        }
        
        // マークによるフィルタリング（複数指定可能）
        if (filter.マーク && filter.マーク.length > 0 && data.データ) {
            // データ内に指定されたマークのいずれかが存在するかチェック
            const hasAnyMark = data.データ.some(item => 
                item.マーク && filter.マーク!.includes(item.マーク)
            );
            
            if (!hasAnyMark) {
                return false;
            }
        }
        
        // スケールの範囲によるフィルタリング
        if (filter.スケール) {
            if (filter.スケール.min !== undefined && (data.スケール === undefined || data.スケール === null || data.スケール < filter.スケール.min)) {
                return false;
            }
            if (filter.スケール.max !== undefined && (data.スケール === undefined || data.スケール === null || data.スケール > filter.スケール.max)) {
                return false;
            }
        }
        
        // その他のフィールドによるフィルタリング
        for (const key in filter) {
            if (key !== 'オーナー' && key !== 'タイプ' && key !== 'オブジェクトタイプ' && key !== '名前' && key !== '名前リスト' && key !== 'マーク' && key !== 'スケール') {
                if (filter[key] !== undefined && data[key] !== filter[key]) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * 指定された名前のIdressDataを更新する
     * @param name 更新するIdressDataの名前
     * @param data 更新データ
     * @returns 更新されたIdressData、存在しない場合はnull
     */
    async update(name: string, data: Partial<IdressData>): Promise<IdressData | null> {
        // 名前だけで検索する
        const foundData = await this.findByName(name);
        if (!foundData) {
            return null;
        }
        
        // データを更新
        const updatedData = {
            ...foundData,
            ...data
        };
        
        // 古いデータを削除
        await this.delete(name);
        
        // 新しいデータを保存
        await this.create(updatedData);
        
        return updatedData;
    }

    /**
     * 指定された名前のIdressDataを削除する
     * @param name 削除するIdressDataの名前
     * @returns 削除に成功した場合はtrue、存在しない場合はfalse
     */
    async delete(name: string): Promise<boolean> {
        // デバッグ情報
        console.log(`delete: 削除名='${name}'`);
        
        const key = this.generateKey(name);
        
        // データが存在するか確認
        const exists = await this.namespace.get(key);
        if (!exists) {
            return false;
        }
        
        // データを削除
        await this.namespace.delete(key);
        
        // インデックスから削除
        await this.removeFromIndex(key);
        
        return true;
    }

    /**
     * すべてのデータをクリアする（テスト用）
     */
    async clear(): Promise<void> {
        const keys = await this.getIndex();
        
        // すべてのデータを削除
        for (const key of keys) {
            await this.namespace.delete(key);
        }
        
        // インデックスをクリア
        await this.updateIndex([]);
    }

    /**
     * 現在のデータ数を取得する（テスト用）
     * @returns データ数
     */
    async count(): Promise<number> {
        const keys = await this.getIndex();
        return keys.length;
    }
}

/**
 * Cloudflare KVリポジトリのファクトリ
 */
export class CloudflareKVRepositoryFactory implements IdressRepositoryFactory {
    /**
     * Cloudflare KVリポジトリを作成する
     * @param options KV Namespaceを含むオプション
     * @returns CloudflareKVRepositoryインスタンス
     */
    createRepository(options: { namespace: KVNamespace }): IdressRepository {
        if (!options || !options.namespace) {
            throw new Error('KV Namespaceが指定されていません');
        }
        return new CloudflareKVRepository(options.namespace);
    }
}
