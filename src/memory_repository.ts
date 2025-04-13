import { IdressData } from './idress_converter';
import { IdressRepository, IdressFilter, IdressRepositoryFactory } from './idress_repository';

/**
 * インメモリで動作するIdressRepositoryの実装
 * 主にテスト用途や一時的なデータ保存に使用します
 */
export class MemoryRepository implements IdressRepository {
    private dataStore: Map<string, IdressData> = new Map();

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
        return name.toLowerCase().trim();
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
        if (this.dataStore.has(key)) {
            throw new Error(`既に同じ名前のデータが存在します: ${name}`);
        }
        
        // データを保存
        this.dataStore.set(key, { ...data });
        
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
        
        // 名前だけで検索する（オーナー情報は無視）
        const normalizedSearchName = name.toLowerCase().trim();
        
        // すべてのデータを検索
        for (const [key, data] of this.dataStore.entries()) {
            const dataName = this.extractName(data);
            const normalizedDataName = dataName.toLowerCase().trim();
            
            if (normalizedDataName === normalizedSearchName) {
                return { ...data };
            }
        }
        
        return null;
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
        const results: IdressData[] = [];
        
        // すべてのデータをチェック
        for (const data of this.dataStore.values()) {
            // フィルタが指定されていない場合、またはフィルタ条件に一致する場合
            if (!filter || this.matchesFilter(data, filter)) {
                results.push({ ...data });
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
        
        // 名前だけで検索する（オーナー情報は無視）
        const normalizedSearchName = name.toLowerCase().trim();
        let foundKey: string | null = null;
        
        // すべてのデータを検索
        for (const [key, data] of this.dataStore.entries()) {
            const dataName = this.extractName(data);
            const normalizedDataName = dataName.toLowerCase().trim();
            
            if (normalizedDataName === normalizedSearchName) {
                foundKey = key;
                break;
            }
        }
        
        if (!foundKey) {
            return false;
        }
        
        return this.dataStore.delete(foundKey);
    }

    /**
     * すべてのデータをクリアする（テスト用）
     */
    async clear(): Promise<void> {
        this.dataStore.clear();
    }

    /**
     * 現在のデータ数を取得する（テスト用）
     * @returns データ数
     */
    async count(): Promise<number> {
        return this.dataStore.size;
    }
}

/**
 * インメモリリポジトリのファクトリ
 */
export class MemoryRepositoryFactory implements IdressRepositoryFactory {
    /**
     * インメモリリポジトリを作成する
     * @returns MemoryRepositoryインスタンス
     */
    createRepository(): IdressRepository {
        return new MemoryRepository();
    }
}
