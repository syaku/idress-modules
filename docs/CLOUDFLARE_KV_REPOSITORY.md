# Cloudflare KV Repository

Cloudflare KV Repositoryは、Cloudflare Workers KV（Key-Value）ストレージを使用してIdressDataを永続化するためのリポジトリ実装です。

## 概要

Cloudflare KV Repositoryは、`IdressRepository`インターフェースを実装し、Cloudflare Workers KVを使用してデータを保存します。このリポジトリを使用することで、Cloudflare Workersの環境でIdressDataを効率的に保存、取得、更新、削除することができます。

## 特徴

- **永続的なストレージ**: データはCloudflare KVに保存され、アプリケーションの再起動後も保持されます。
- **グローバル分散**: Cloudflare KVはグローバルに分散されたストレージで、低レイテンシーでのアクセスが可能です。
- **スケーラブル**: 大量のデータを扱うことができます。
- **インデックス管理**: 効率的な検索のために、保存されたキーのインデックスを自動的に管理します。

## セットアップ

### 1. Cloudflare KV Namespaceの作成

Cloudflare Dashboardで新しいKV Namespaceを作成します：

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログインします。
2. 対象のアカウントとWorkers & Pagesを選択します。
3. KV（Key-Value）セクションに移動します。
4. 「Create namespace」をクリックします。
5. Namespaceの名前（例：`idress-data`）を入力し、作成します。
6. 作成されたNamespaceのIDをメモします。

### 2. wrangler.tomlの設定

プロジェクトの`wrangler.toml`ファイルにKV Namespaceの設定を追加します：

```toml
name = "idress-api"
main = "src/api.ts"
compatibility_date = "2023-01-01"

# その他の設定...

# Cloudflare KV Namespaceの設定
kv_namespaces = [
  { binding = "IDRESS_KV", id = "your-kv-id-here", preview_id = "your-preview-kv-id-here" }
]
```

`your-kv-id-here`と`your-preview-kv-id-here`を、実際のNamespace IDとPreview Namespace IDに置き換えてください。

### 3. リポジトリの使用

アプリケーションコードでCloudflare KV Repositoryを使用します：

```typescript
import { CloudflareKVRepositoryFactory } from './cloudflare_kv_repository';

// Cloudflare Workersのハンドラー
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // リポジトリの作成
    const factory = new CloudflareKVRepositoryFactory();
    const repo = factory.createRepository({ namespace: env.IDRESS_KV });
    
    // リポジトリの使用
    // ...
    
    return new Response('OK');
  }
};
```

## 使用例

### データの作成

```typescript
// 新しいIdressDataを作成
const data = {
  オーナー: 'サンプルオーナー',
  タイプ: 'キャラクター',
  データ: [
    {
      マーク: '情報',
      ナンバー: 1,
      名前: '名前',
      説明: 'サンプルキャラクター'
    }
  ]
};

try {
  const createdData = await repo.create(data);
  console.log('データが作成されました:', createdData);
} catch (error) {
  console.error('データの作成に失敗しました:', error);
}
```

### データの取得

```typescript
// 名前によるデータの取得
const data = await repo.findByName('サンプルキャラクター');
if (data) {
  console.log('データが見つかりました:', data);
} else {
  console.log('データが見つかりませんでした');
}

// 複数の名前によるデータの取得
const dataList = await repo.findByNames(['キャラクター1', 'キャラクター2']);
console.log(`${dataList.length}件のデータが見つかりました`);

// フィルタリングによるデータの取得
const filteredData = await repo.find({
  タイプ: 'キャラクター',
  オーナー: 'サンプルオーナー',
  マーク: ['攻撃', '防御']
});
console.log(`${filteredData.length}件のデータが条件に一致しました`);
```

### データの更新

```typescript
// データの更新
const updatedData = await repo.update('サンプルキャラクター', {
  スケール: 5,
  タイプ: '更新されたタイプ'
});

if (updatedData) {
  console.log('データが更新されました:', updatedData);
} else {
  console.log('更新するデータが見つかりませんでした');
}
```

### データの削除

```typescript
// データの削除
const deleteResult = await repo.delete('サンプルキャラクター');
if (deleteResult) {
  console.log('データが削除されました');
} else {
  console.log('削除するデータが見つかりませんでした');
}
```

## 実装の詳細

### インデックス管理

Cloudflare KV Repositoryは、保存されたすべてのキーのインデックスを管理します。このインデックスは、`idress_index`というキーでKVに保存され、フィルタリング操作を効率的に行うために使用されます。

### キーの生成

データの名前から一貫したキーを生成するために、`generateKey`メソッドが使用されます。このメソッドは、名前を小文字に変換し、空白を削除して、`idress:`プレフィックスを追加します。

### フィルタリング

Cloudflare KVはネイティブのフィルタリング機能を提供していないため、フィルタリングはクライアント側で行われます。`find`メソッドは、すべてのデータを取得し、指定されたフィルタ条件に基づいてメモリ内でフィルタリングします。

### パフォーマンスの考慮事項

- **大量のデータ**: データ量が多い場合、`find`メソッドのパフォーマンスが低下する可能性があります。これは、すべてのデータを取得してからフィルタリングするためです。
- **キャッシング**: インデックスはメモリにキャッシュされ、パフォーマンスを向上させます。
- **バッチ操作**: 多数のデータを一度に操作する場合は、バッチ処理を検討してください。

## テスト

リポジトリの動作をテストするために、`test/cloudflare_kv_repository_test.ts`ファイルが提供されています。このテストは、Cloudflare Workersの環境で実行する必要があります。

```bash
# テストの実行
wrangler dev test/cloudflare_kv_repository_test.ts
```

## 注意点

1. **KV制限**: Cloudflare KVには、キーあたりの最大サイズ（25MB）やリクエスト数の制限があります。詳細は[Cloudflareのドキュメント](https://developers.cloudflare.com/workers/platform/limits/#kv-limits)を参照してください。

2. **コスト**: Cloudflare KVの使用には、無料枠を超えた場合にコストが発生する可能性があります。料金については[Cloudflareの料金ページ](https://developers.cloudflare.com/workers/platform/pricing/)を確認してください。

3. **整合性**: Cloudflare KVは結果整合性モデルを採用しているため、書き込み後すぐに読み取りを行うと、最新のデータが反映されていない場合があります。

4. **エラーハンドリング**: 本番環境では、適切なエラーハンドリングを実装することをお勧めします。

## トラブルシューティング

### データが見つからない

- キーの生成方法が一貫していることを確認してください。
- Cloudflare Dashboardで直接KVの内容を確認してください。

### パフォーマンスの問題

- データ量が多い場合は、フィルタリング条件を最適化してください。
- 頻繁にアクセスするデータには、追加のキャッシング層の導入を検討してください。

### デプロイの問題

- `wrangler.toml`の設定が正しいことを確認してください。
- `wrangler publish`コマンドのログを確認してください。

## まとめ

Cloudflare KV Repositoryは、Cloudflare Workersの環境でIdressDataを効率的に管理するための強力なソリューションです。適切に設定し使用することで、グローバルに分散された永続的なストレージを活用できます。
