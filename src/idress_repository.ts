import { IdressData } from './idress_converter';

/**
 * IdressRepositoryインターフェース
 * データの保存先（ファイルシステム、データベース、APIなど）に依存しない
 * CRUDインターフェースを定義します。
 */
export interface IdressRepository {
    /**
     * 新しいIdressDataを保存する
     * @param data 保存するIdressData
     * @returns 保存されたIdressData
     */
    create(data: IdressData): Promise<IdressData>;

    /**
     * 指定された名前のIdressDataを取得する
     * @param name 取得するIdressDataの名前
     * @returns 取得したIdressData、存在しない場合はnull
     */
    findByName(name: string): Promise<IdressData | null>;

    /**
     * 指定された複数の名前のIdressDataを取得する
     * @param names 取得するIdressDataの名前の配列
     * @returns 取得したIdressDataの配列（存在しない名前は結果に含まれない）
     */
    findByNames(names: string[]): Promise<IdressData[]>;

    /**
     * 条件に一致するIdressDataを検索する
     * @param filter 検索条件
     * @returns 条件に一致するIdressDataの配列
     */
    find(filter?: IdressFilter): Promise<IdressData[]>;

    /**
     * 指定された名前のIdressDataを更新する
     * @param name 更新するIdressDataの名前
     * @param data 更新データ
     * @returns 更新されたIdressData、存在しない場合はnull
     */
    update(name: string, data: Partial<IdressData>): Promise<IdressData | null>;

    /**
     * 指定された名前のIdressDataを削除する
     * @param name 削除するIdressDataの名前
     * @returns 削除に成功した場合はtrue、存在しない場合はfalse
     */
    delete(name: string): Promise<boolean>;
}

/**
 * IdressDataの検索条件インターフェース
 */
export interface IdressFilter {
    /**
     * オーナーによるフィルタリング
     */
    オーナー?: string;

    /**
     * タイプによるフィルタリング
     */
    タイプ?: string;

    /**
     * オブジェクトタイプによるフィルタリング
     */
    オブジェクトタイプ?: 'オブジェクト' | 'ストラクチャー';

    /**
     * 名前による部分一致検索
     */
    名前?: string;

    /**
     * 複数の名前による完全一致検索
     * 指定された名前のいずれかに一致するデータがマッチします
     */
    名前リスト?: string[];

    /**
     * マークによるフィルタリング（複数指定可能）
     * 指定されたマークのいずれかを持つデータがマッチします
     */
    マーク?: string[];

    /**
     * スケールの範囲によるフィルタリング
     */
    スケール?: {
        min?: number;
        max?: number;
    };

    /**
     * 任意のフィールドによるフィルタリング
     */
    [key: string]: any;
}

/**
 * リポジトリファクトリインターフェース
 * 異なる実装のリポジトリを作成するためのファクトリ
 */
export interface IdressRepositoryFactory {
    /**
     * リポジトリインスタンスを作成する
     * @param options リポジトリの設定オプション
     * @returns IdressRepositoryインスタンス
     */
    createRepository(options?: any): IdressRepository;
}
