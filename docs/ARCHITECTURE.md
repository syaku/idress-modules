# アイドレスモジュール アーキテクチャ構成図

## 概要

アイドレスモジュールは、テキスト形式のアイドレスデータをYAML形式に変換し、TypeScriptオブジェクトとして操作・検証するライブラリと、Cloudflare Workersを使用したAPIサービスを提供するプロジェクトです。

このドキュメントでは、プロジェクト全体のアーキテクチャ構成を説明します。

## システム全体構成

```mermaid
graph TB
    Client[クライアント] -->|API呼び出し| CloudflareWorkers[Cloudflare Workers]
    CloudflareWorkers -->|データ保存/取得| CloudflareKV[Cloudflare KV]
    
    subgraph "Cloudflare Workers"
        API[API Layer] -->|変換| Converter[Converter Module]
        API -->|検証| Validator[Validator Module]
        API -->|永続化| Repository[Repository Module]
    end
    
    subgraph "クライアント"
        Frontend[フロントエンド] -->|テキスト入力| Editor[エディタ]
        Frontend -->|データ表示| Viewer[ビューア]
    end
```

## コアモジュール構成

アイドレスモジュールは以下の3つの主要モジュールで構成されています：

```mermaid
graph LR
    Converter[idress_converter] -->|データ提供| Validator[idress_validator]
    Converter -->|データ提供| Repository[idress_repository]
    
    subgraph "コアモジュール"
        Converter
        Validator
        Repository
    end
    
    Repository -->|実装| MemoryRepo[memory_repository]
    Repository -->|実装| CloudflareRepo[cloudflare_kv_repository]
    
    API[api.ts] -->|利用| Converter
    API -->|利用| Validator
    API -->|利用| CloudflareRepo
```

### 1. idress_converter モジュール

テキスト形式とYAML形式の相互変換、およびデータ操作機能を提供します。

```mermaid
classDiagram
    class IdressData {
        +string オーナー
        +string? 根拠
        +string? タイプ
        +string? オブジェクトタイプ
        +number? スケール
        +DataItem[]? データ
        +string? HP
        +string? 設定
        +string? 次のアイドレス
        +Medal[]? 適用勲章
        +string? 特殊
    }
    
    class DataItem {
        +string マーク
        +number|null ナンバー
        +string 名前
        +string 説明
    }
    
    class Medal {
        +string 名前
        +string 適用効果
        +string 根拠
    }
    
    class ConverterFunctions {
        +textToObject(text: string): IdressData
        +objectToYaml(data: IdressData): string
        +yamlToObject(yamlStr: string): IdressData
        +objectToText(data: IdressData): string
        +addSkill(data: IdressData, mark: string, number: number|null, name: string, description: string): IdressData
        +removeSkill(data: IdressData, skillName: string): IdressData
        +updateSkill(data: IdressData, skillName: string, updates: Partial<DataItem>): IdressData
    }
    
    IdressData "1" *-- "many" DataItem
    IdressData "1" *-- "many" Medal
    ConverterFunctions -- IdressData : 操作
```

### 2. idress_validator モジュール

アイドレスデータの検証と自動修正機能を提供します。

```mermaid
classDiagram
    class ValidationSeverity {
        <<enumeration>>
        ERROR
        WARNING
        INFO
    }
    
    class ValidationItem {
        +string field
        +string message
        +ValidationSeverity severity
        +any? value
    }
    
    class ValidationResult {
        +boolean isValid
        +ValidationItem[] items
        +IdressData data
    }
    
    class ValidationRule {
        +string? field
        +function validate(data: IdressData): ValidationItem|null
    }
    
    class ValidatorFunctions {
        +validateIdressData(data: IdressData): ValidationResult
        +validateWithCustomRules(data: IdressData, rules: ValidationRule[]): ValidationResult
        +displayValidationResult(result: ValidationResult): void
        +getValidationResultText(result: ValidationResult): string
        +createValidationRule(field: string, validator: function, message: string, severity: ValidationSeverity): ValidationRule
        +requiredField(field: string, message: string, severity: ValidationSeverity): ValidationRule
        +numberRangeRule(field: string, min: number, max: number, message: string, severity: ValidationSeverity): ValidationRule
        +patternRule(field: string, pattern: RegExp, message: string, severity: ValidationSeverity): ValidationRule
    }
    
    ValidationResult "1" *-- "many" ValidationItem
    ValidationItem --> ValidationSeverity
    ValidatorFunctions -- ValidationResult : 生成
    ValidatorFunctions -- ValidationRule : 使用
```

### 3. idress_repository モジュール

アイドレスデータの永続化と取得機能を提供します。

```mermaid
classDiagram
    class IdressRepository {
        <<interface>>
        +create(data: IdressData): Promise<IdressData>
        +findByName(name: string): Promise<IdressData|null>
        +findByNames(names: string[]): Promise<IdressData[]>
        +find(filter?: IdressFilter): Promise<IdressData[]>
        +update(name: string, data: Partial<IdressData>): Promise<IdressData|null>
        +delete(name: string): Promise<boolean>
    }
    
    class IdressFilter {
        +string? オーナー
        +string? タイプ
        +string? オブジェクトタイプ
        +string? 名前
        +string[]? 名前リスト
        +string[]? マーク
        +object? スケール
    }
    
    class IdressRepositoryFactory {
        <<interface>>
        +createRepository(options?: any): IdressRepository
    }
    
    class MemoryRepository {
        -Map<string, IdressData> dataStore
        -extractName(data: IdressData): string
        -generateKey(name: string): string
        -matchesFilter(data: IdressData, filter: IdressFilter): boolean
        +create(data: IdressData): Promise<IdressData>
        +findByName(name: string): Promise<IdressData|null>
        +findByNames(names: string[]): Promise<IdressData[]>
        +find(filter?: IdressFilter): Promise<IdressData[]>
        +update(name: string, data: Partial<IdressData>): Promise<IdressData|null>
        +delete(name: string): Promise<boolean>
        +clear(): Promise<void>
        +count(): Promise<number>
    }
    
    class MemoryRepositoryFactory {
        +createRepository(): IdressRepository
    }
    
    class CloudflareKVRepository {
        -KVNamespace namespace
        -string cacheKey
        -string[]|null indexCache
        -extractName(data: IdressData): string
        -generateKey(name: string): string
        -getIndex(): Promise<string[]>
        -updateIndex(keys: string[]): Promise<void>
        -addToIndex(key: string): Promise<void>
        -removeFromIndex(key: string): Promise<void>
        -matchesFilter(data: IdressData, filter: IdressFilter): boolean
        +create(data: IdressData): Promise<IdressData>
        +findByName(name: string): Promise<IdressData|null>
        +findByNames(names: string[]): Promise<IdressData[]>
        +find(filter?: IdressFilter): Promise<IdressData[]>
        +update(name: string, data: Partial<IdressData>): Promise<IdressData|null>
        +delete(name: string): Promise<boolean>
        +clear(): Promise<void>
        +count(): Promise<number>
    }
    
    class CloudflareKVRepositoryFactory {
        +createRepository(options: {namespace: KVNamespace}): IdressRepository
    }
    
    IdressRepository <|.. MemoryRepository : 実装
    IdressRepository <|.. CloudflareKVRepository : 実装
    IdressRepositoryFactory <|.. MemoryRepositoryFactory : 実装
    IdressRepositoryFactory <|.. CloudflareKVRepositoryFactory : 実装
    MemoryRepositoryFactory --> MemoryRepository : 生成
    CloudflareKVRepositoryFactory --> CloudflareKVRepository : 生成
    IdressRepository -- IdressFilter : 使用
```

## API サービス構成

Cloudflare Workersを使用したAPIサービスの構成です。

```mermaid
graph TD
    Client[クライアント] -->|HTTP リクエスト| API[API Layer]
    
    subgraph "API Layer (api.ts)"
        Router[Hono Router] -->|/convert| ConvertEndpoint[変換エンドポイント]
        Router -->|/validate| ValidateEndpoint[検証エンドポイント]
        Router -->|/store| StoreEndpoint[保存エンドポイント]
        Router -->|/get/:name| GetEndpoint[取得エンドポイント]
        Router -->|/list| ListEndpoint[一覧エンドポイント]
    end
    
    ConvertEndpoint -->|textToObject| Converter[idress_converter]
    ValidateEndpoint -->|textToObject| Converter
    ValidateEndpoint -->|validateIdressData| Validator[idress_validator]
    StoreEndpoint -->|textToObject| Converter
    StoreEndpoint -->|validateIdressData| Validator
    StoreEndpoint -->|create| Repository[CloudflareKVRepository]
    GetEndpoint -->|findByName| Repository
    ListEndpoint -->|findByNames| Repository
    
    Repository -->|データ保存/取得| CloudflareKV[Cloudflare KV]
```

## フロントエンド構成

フロントエンドの推奨アーキテクチャ構成です。

```mermaid
graph TD
    User[ユーザー] -->|操作| UI[UIレイヤー]
    
    subgraph "フロントエンド"
        UI -->|イベント| State[状態管理レイヤー]
        State -->|API呼び出し| API[APIクライアントレイヤー]
        API -->|HTTP リクエスト| Backend[バックエンドAPI]
    end
    
    subgraph "UIレイヤー"
        Pages[ページコンポーネント] -->|使用| Components[UIコンポーネント]
        Components -->|使用| Common[共通コンポーネント]
    end
    
    subgraph "状態管理レイヤー"
        Context[React Context] -->|状態更新| Reducers[Reducers]
        Hooks[カスタムフック] -->|状態アクセス| Context
    end
    
    subgraph "APIクライアントレイヤー"
        ApiClient[APIクライアント] -->|HTTP| Endpoints[APIエンドポイント]
    end
```

## データフロー

アイドレスデータの変換と処理のフローです。

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Frontend as フロントエンド
    participant API as APIサービス
    participant Converter as idress_converter
    participant Validator as idress_validator
    participant Repository as idress_repository
    participant KV as Cloudflare KV
    
    User->>Frontend: テキスト入力
    Frontend->>API: /convert リクエスト
    API->>Converter: textToObject()
    Converter-->>API: IdressData
    API-->>Frontend: IdressData (JSON)
    Frontend->>Frontend: データ表示
    
    User->>Frontend: 検証リクエスト
    Frontend->>API: /validate リクエスト
    API->>Converter: textToObject()
    Converter-->>API: IdressData
    API->>Validator: validateIdressData()
    Validator-->>API: ValidationResult
    API-->>Frontend: 検証結果
    Frontend->>Frontend: 検証結果表示
    
    User->>Frontend: 保存リクエスト
    Frontend->>API: /store リクエスト
    API->>Converter: textToObject()
    Converter-->>API: IdressData
    API->>Validator: validateIdressData()
    Validator-->>API: ValidationResult
    alt 検証成功
        API->>Repository: create()
        Repository->>KV: put()
        KV-->>Repository: 成功
        Repository-->>API: 保存されたデータ
        API-->>Frontend: 成功レスポンス
    else 検証失敗
        API-->>Frontend: エラーレスポンス
    end
    
    User->>Frontend: データ取得リクエスト
    Frontend->>API: /get/:name リクエスト
    API->>Repository: findByName()
    Repository->>KV: get()
    KV-->>Repository: データ
    Repository-->>API: IdressData
    API-->>Frontend: IdressData (JSON)
    Frontend->>Frontend: データ表示
```

## デプロイメント構成

```mermaid
graph TD
    subgraph "開発環境"
        DevCode[ソースコード] -->|ビルド| DevBuild[開発ビルド]
        DevBuild -->|デプロイ| DevWorker[開発Worker]
        DevWorker -->|使用| DevKV[開発KV]
    end
    
    subgraph "本番環境"
        ProdCode[ソースコード] -->|ビルド| ProdBuild[本番ビルド]
        ProdBuild -->|デプロイ| ProdWorker[本番Worker]
        ProdWorker -->|使用| ProdKV[本番KV]
    end
    
    GitHub[GitHub] -->|CI/CD| Actions[GitHub Actions]
    Actions -->|自動デプロイ| ProdWorker
```

## 技術スタック

- **バックエンド**
  - TypeScript
  - Cloudflare Workers
  - Cloudflare KV
  - Hono (Webフレームワーク)
  - js-yaml (YAMLパーサー/ジェネレーター)

- **フロントエンド (推奨)**
  - React + TypeScript
  - Vite (ビルドツール)
  - Chakra UI / Material UI (UIライブラリ)
  - Redux Toolkit + RTK Query / React Context API (状態管理)
  - React Router (ルーティング)

- **開発ツール**
  - npm (パッケージマネージャー)
  - wrangler (Cloudflare Workers CLI)
  - TypeScript Compiler
  - ESLint + Prettier (コード品質)
  - Jest (テスト)

## まとめ

アイドレスモジュールは、テキスト形式とYAML形式の相互変換、データの検証、永続化を提供する3つの主要モジュールで構成されています。これらのモジュールはCloudflare Workersを使用したAPIサービスとして提供され、フロントエンドからアクセスすることができます。

モジュール間の明確な責任分担と、インターフェースを通じた疎結合な設計により、拡張性と保守性の高いアーキテクチャを実現しています。また、Cloudflare WorkersとKVを活用することで、スケーラブルで高パフォーマンスなサービスを提供しています。
