# アイドレスデータの永続化ストレージ検討

## 現状分析

現在のアイドレスAPIでは、`MemoryRepository`クラスを使用してデータを保存しています。このリポジトリはインメモリで動作し、以下の特徴があります：

- **メリット**：高速なデータアクセス
- **デメリット**：サーバー再起動時にデータが消失する
- **用途**：主にテスト用途や一時的なデータ保存

現在の実装では、`IdressRepository`インターフェースを通じてデータアクセスを抽象化しており、異なるストレージ実装に切り替えやすい設計になっています。

## 要件

永続化ストレージを選定するにあたり、以下の要件を考慮する必要があります：

1. **データの永続性**：サーバー再起動後もデータが保持されること
2. **データ構造との互換性**：`IdressData`インターフェースに対応できること
3. **パフォーマンス**：データの読み書きが効率的に行えること
4. **スケーラビリティ**：データ量の増加に対応できること
5. **デプロイ環境との互換性**：Cloudflare Workersで利用可能であること
6. **マークによる検索**：`データ`配列内の各アイテムの`マーク`フィールドで効率的に検索できること（ゲームの処理上、非常に重要な要件）

## ストレージオプションの比較

### 1. Cloudflare KV (Key-Value Store)

**概要**：
Cloudflare Workersに組み込まれたグローバル分散Key-Valueストア

**メリット**：
- Cloudflare Workersとのネイティブ統合
- グローバルに分散され、低レイテンシーでアクセス可能
- 実装が比較的簡単
- 追加のインフラ管理が不要

**デメリット**：
- 複雑なクエリや検索機能が限られている
- 1回のリクエストで取得できるデータサイズに制限がある（最大25MB）
- 更新の伝播に時間がかかる場合がある（最終的整合性）
- **マークによる検索には追加の実装が必要**：すべてのデータを取得してメモリ上でフィルタリングするか、マークごとにセカンダリインデックスを作成する必要がある

**適合性**：
- 名前をキーとした単純な検索には適している
- マークによる検索は実装が複雑になり、効率が低下する可能性がある

### 2. Cloudflare D1 (SQLiteベースのデータベース)

**概要**：
Cloudflare Workersのためのサーバーレスリレーショナルデータベース

**メリット**：
- SQLクエリによる柔軟な検索が可能
- Cloudflare Workersとのネイティブ統合
- トランザクションのサポート
- 複雑なデータ関係の管理が容易
- **マークによる検索のためのインデックスを作成可能**

**デメリット**：
- 比較的新しいサービスで、機能が限定的な可能性がある
- 大規模データセットでのパフォーマンスは未検証
- **ネストされたJSONデータの検索には追加の実装が必要**

**適合性**：
- 複雑なフィルタリング検索に適している
- マークによる検索のために、データ構造の正規化または追加のインデックステーブルが必要

### 3. Cloudflare Durable Objects

**概要**：
Cloudflare Workersのためのグローバルに一貫性のあるオブジェクトストレージ

**メリット**：
- 強い一貫性を持つストレージ
- オブジェクト指向のアプローチ
- トランザクションのサポート
- WebSocketなどのステートフルな接続をサポート
- **カスタムインデックスの実装が可能**

**デメリット**：
- 実装が複雑
- 学習曲線が高い
- 使用コストが他のオプションより高い可能性がある

**適合性**：
- リアルタイム性が求められる場合に適している
- マークによる検索のためのカスタムインデックスを実装できる

### 4. 外部データベース (MongoDB Atlas, Firebase Firestore など)

**概要**：
クラウドホスティングされた外部データベースサービス

**メリット**：
- 豊富な機能と柔軟性
- スケーラビリティが高い
- 専用の管理ツールとモニタリング
- **ネストされたデータ構造内のフィールドに対するインデックスと検索をネイティブサポート**

**デメリット**：
- Cloudflare Workersからのアクセスに追加のレイテンシーが発生
- 外部サービスへの依存性
- 追加のコスト

**適合性**：
- 大規模なデータセットや複雑なクエリに適している
- マークによる検索が非常に効率的に実装可能

## 推奨ストレージソリューション

マークによる検索の重要性を考慮し、以下のストレージソリューションを推奨します：

### 主要推奨：MongoDB Atlas

**理由**：
1. ネストされたデータ構造内のフィールド（マーク）に対する効率的な検索をネイティブサポート
2. 配列内の要素に対するクエリ演算子（`$elemMatch`など）が豊富
3. スケーラビリティが高く、データ量の増加に対応可能
4. フレキシブルなスキーマで`IdressData`の構造をそのまま保存可能
5. マークによる検索のためのインデックスを簡単に作成可能

**実装アプローチ**：
1. `MongoDBRepository`クラスを作成し、`IdressRepository`インターフェースを実装
2. マークによる検索のためのインデックスを作成：
   ```javascript
   db.idressData.createIndex({ "データ.マーク": 1 });
   ```

3. マークによるフィルタリング検索の実装例：
   ```typescript
   async find(filter?: IdressFilter): Promise<IdressData[]> {
     const query: any = {};
     
     if (filter?.オーナー) {
       query.オーナー = filter.オーナー;
     }
     
     if (filter?.タイプ) {
       query.タイプ = filter.タイプ;
     }
     
     if (filter?.オブジェクトタイプ) {
       query.オブジェクトタイプ = filter.オブジェクトタイプ;
     }
     
     if (filter?.マーク && filter.マーク.length > 0) {
       // マークによる検索 - 配列内の要素に対するクエリ
       query["データ.マーク"] = { $in: filter.マーク };
     }
     
     // 他のフィルタ条件も同様に実装
     
     return this.collection.find(query).toArray();
   }
   ```

### 代替案：Cloudflare D1 + 正規化テーブル

マークによる検索を効率的に行うために、データ構造を正規化する方法も考えられます。

**実装アプローチ**：
1. `D1Repository`クラスを作成し、`IdressRepository`インターフェースを実装
2. テーブル設計：
   ```sql
   -- メインテーブル
   CREATE TABLE idress_data (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     owner TEXT,
     type TEXT,
     object_type TEXT,
     scale INTEGER,
     data_json TEXT,
     hp TEXT,
     settings TEXT,
     next_idress TEXT,
     special TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- マーク用の正規化テーブル
   CREATE TABLE idress_marks (
     idress_id TEXT,
     mark TEXT,
     FOREIGN KEY (idress_id) REFERENCES idress_data(id),
     PRIMARY KEY (idress_id, mark)
   );

   -- インデックス
   CREATE INDEX idx_idress_name ON idress_data(name);
   CREATE INDEX idx_idress_owner ON idress_data(owner);
   CREATE INDEX idx_idress_type ON idress_data(type);
   CREATE INDEX idx_idress_object_type ON idress_data(object_type);
   CREATE INDEX idx_idress_marks_mark ON idress_marks(mark);
   ```

3. データ保存時に、`データ`配列内の各アイテムの`マーク`を抽出して`idress_marks`テーブルに保存
4. マークによるフィルタリング検索の実装例：
   ```typescript
   async find(filter?: IdressFilter): Promise<IdressData[]> {
     let query = 'SELECT d.* FROM idress_data d';
     const params: any[] = [];
     
     if (filter?.マーク && filter.マーク.length > 0) {
       // マークによる検索 - 正規化テーブルを結合
       query += ' JOIN idress_marks m ON d.id = m.idress_id WHERE m.mark IN (';
       query += filter.マーク.map(() => '?').join(',');
       query += ')';
       params.push(...filter.マーク);
     } else {
       query += ' WHERE 1=1';
     }
     
     if (filter?.オーナー) {
       query += ' AND d.owner = ?';
       params.push(filter.オーナー);
     }
     
     // 他のフィルタ条件も同様に実装
     
     const result = await this.db.prepare(query).bind(...params).all();
     return result.results.map(row => this.rowToIdressData(row));
   }
   ```

## 移行戦略

現在の`MemoryRepository`から新しいストレージソリューションへの移行は、以下のステップで行うことを推奨します：

1. 新しいリポジトリ実装（`MongoDBRepository`または`D1Repository`）を開発
2. テスト環境で動作確認（特にマークによる検索のパフォーマンスを検証）
3. 既存データの移行スクリプトを作成
4. 段階的にトラフィックを新しいリポジトリに移行
5. 完全に移行後、古いリポジトリを廃止

## 結論

アイドレスデータの永続化には、マークによる検索の重要性を考慮すると、**MongoDB Atlas**が最も適したソリューションと考えられます。ネストされたデータ構造内のフィールドに対する効率的な検索をネイティブサポートしており、`IdressData`の構造をそのまま保存できるため、実装も比較的容易です。

Cloudflare Workersとの統合を優先する場合は、**Cloudflare D1**と正規化テーブルを組み合わせたアプローチも有効ですが、実装の複雑さとパフォーマンスのトレードオフを考慮する必要があります。

どちらの選択肢も、現在の`IdressRepository`インターフェースを維持したまま実装できるため、アプリケーションコードへの影響を最小限に抑えることができます。
