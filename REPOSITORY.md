# IdressRepository ドキュメント

## 概要

IdressRepositoryは、アイドレスデータの永続化と取得を抽象化するインターフェースです。このリポジトリパターンを採用することで、データの保存先（メモリ、データベースなど）に依存しないコードを記述できます。

## 重要な設計思想

- **名前のユニーク性**: アイドレスの名前は全体でユニークです。そのため、findByName、update、deleteなどの操作は名前のみで実行できます。
- **リポジトリパターン**: データアクセスロジックをビジネスロジックから分離し、交換可能な実装を提供します。
- **ファクトリパターン**: リポジトリのインスタンス生成を抽象化し、適切な実装を選択できるようにします。

## インターフェース

### IdressRepository

```typescript
interface IdressRepository {
    create(data: IdressData): Promise<IdressData>;
    findByName(name: string): Promise<IdressData | null>;
    find(filter?: IdressFilter): Promise<IdressData[]>;
    update(name: string, data: Partial<IdressData>): Promise<IdressData | null>;
    delete(name: string): Promise<boolean>;
}
```

#### メソッド

- **create(data: IdressData)**: 新しいアイドレスデータを保存します。
  - 同じ名前のデータが既に存在する場合はエラーをスローします。
  - 成功時は保存されたデータを返します。

- **findByName(name: string)**: 指定された名前のアイドレスデータを取得します。
  - 名前は大文字小文字を区別せず、空白も無視して比較されます。
  - 見つかった場合はデータを返し、見つからない場合はnullを返します。

- **find(filter?: IdressFilter)**: 条件に一致するアイドレスデータを検索します。
  - フィルタが指定されていない場合は、すべてのデータを返します。
  - フィルタ条件に一致するデータの配列を返します。

- **update(name: string, data: Partial<IdressData>)**: 指定された名前のアイドレスデータを更新します。
  - 部分的な更新が可能で、指定されたフィールドのみが更新されます。
  - 成功時は更新されたデータを返し、データが見つからない場合はnullを返します。

- **delete(name: string)**: 指定された名前のアイドレスデータを削除します。
  - 成功時はtrueを返し、データが見つからない場合はfalseを返します。

### IdressFilter

```typescript
interface IdressFilter {
    オーナー?: string;
    タイプ?: string;
    オブジェクトタイプ?: 'オブジェクト' | 'ストラクチャー';
    名前?: string;
    マーク?: string[];
    スケール?: {
        min?: number;
        max?: number;
    };
    [key: string]: any;
}
```

- フィルタリング条件を指定するためのインターフェースです。
- 複数の条件を組み合わせることができ、すべての条件に一致するデータが返されます。
- `マーク`プロパティは文字列の配列で、指定されたマークのいずれかを持つデータがマッチします。
- `[key: string]: any`により、任意のフィールドでのフィルタリングが可能です。

### IdressRepositoryFactory

```typescript
interface IdressRepositoryFactory {
    createRepository(options?: any): IdressRepository;
}
```

- リポジトリのインスタンスを作成するためのファクトリインターフェースです。
- 異なる実装のリポジトリを統一的に作成できます。

## 実装クラス

### MemoryRepository

メモリ上にデータを保持するリポジトリ実装です。主にテスト用途や一時的なデータ保存に適しています。

```typescript
const memoryFactory = new MemoryRepositoryFactory();
const memoryRepo = memoryFactory.createRepository();
```

#### 特徴

- データはプロセスのメモリ内に保持されるため、アプリケーションの終了と共に消失します。
- 高速なアクセスが可能です。
- テスト用の追加メソッド（clear、count）を提供します。

## 使用例

### 基本的な使用方法

```typescript
// リポジトリの作成
const factory = new MemoryRepositoryFactory();
const repo = factory.createRepository();

// データの作成
const data = {
  オーナー: 'サンプルオーナー',
  タイプ: 'キャラクター',
  データ: [{ 名前: '名前', 説明: 'サンプルキャラクター' }]
};
await repo.create(data);

// 名前による検索
const foundData = await repo.findByName('サンプルキャラクター');

// データの更新
const updatedData = await repo.update('サンプルキャラクター', { スケール: 5 });

// データの削除
const deleteResult = await repo.delete('サンプルキャラクター');
```

### フィルタリング

```typescript
// タイプによるフィルタリング
const characters = await repo.find({ タイプ: 'キャラクター' });

// マークによるフィルタリング
const attackSkills = await repo.find({ マーク: ['攻撃'] });

// 複数のマークによるフィルタリング
const combatSkills = await repo.find({ マーク: ['攻撃', '防御'] });

// 複合条件によるフィルタリング
const filteredData = await repo.find({
  タイプ: 'キャラクター',
  オーナー: 'サンプルオーナー',
  マーク: ['知識', '情報', '調査'],
  スケール: { min: 3, max: 5 }
});

// 名前の部分一致検索
const searchResults = await repo.find({ 名前: 'サンプル' });
```

## 注意点

1. **名前の抽出**: アイドレスデータから名前を抽出するには、`データ`配列内の`名前`という名前を持つアイテムの`説明`フィールドを参照します。

2. **名前のユニーク性**: アイドレスの名前は全体でユニークであるため、同じ名前のアイドレスを作成しようとするとエラーが発生します。

3. **非同期処理**: すべてのリポジトリメソッドはPromiseを返すため、`async/await`または`.then()`を使用して結果を処理する必要があります。

4. **エラーハンドリング**: リポジトリ操作中に発生する可能性のあるエラーを適切に処理するために、try-catchブロックの使用を検討してください。

## 拡張

新しいリポジトリ実装を追加するには、以下の手順に従います：

1. `IdressRepository`インターフェースを実装するクラスを作成します。
2. `IdressRepositoryFactory`インターフェースを実装するファクトリクラスを作成します。
3. 必要に応じて、実装固有の設定オプションを定義します。

例えば、データベースを使用するリポジトリを実装する場合：

```typescript
class DatabaseRepository implements IdressRepository {
  // IdressRepositoryインターフェースのメソッドを実装
}

class DatabaseRepositoryFactory implements IdressRepositoryFactory {
  createRepository(options?: { connectionString: string }): IdressRepository {
    // データベース接続の設定
    return new DatabaseRepository(/* ... */);
  }
}
