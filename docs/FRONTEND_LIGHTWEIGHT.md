# 軽量フロントエンドアーキテクチャ設計

## 概要

アイドレスモジュールの軽量フロントエンドは、ユーザーがテキスト形式のアイドレスデータを作成、編集、検証、管理するためのウェブインターフェースを提供します。このドキュメントでは、より軽量なフロントエンドの設計方針、技術選定、アーキテクチャについて説明します。

## 要件

フロントエンドの主な要件は以下の通りです：

1. テキスト形式とYAML形式の相互変換と表示
2. アイドレスデータの作成・編集機能
3. データの検証と自動修正機能
4. 保存されたアイドレスデータの検索・一覧表示
5. レスポンシブデザイン（モバイル対応）

## 技術選定

### アプローチ1: Preact + HTM + Signals

バックエンドと同様に軽量なアプローチとして、Preact + HTM + Signalsの組み合わせを推奨します：

- **Preact**: Reactの軽量版（約3KB）で、同じAPIとコンポーネントモデルを提供
- **HTM**: JSXのビルドステップを省略できるタグ付きテンプレートリテラル
- **Signals**: 軽量で高性能な状態管理ライブラリ

```javascript
// HTMを使用したPreactコンポーネントの例
import { html } from 'htm/preact';
import { signal } from '@preact/signals';

const count = signal(0);

function Counter() {
  return html`
    <div>
      <p>Count: ${count.value}</p>
      <button onClick=${() => count.value++}>Increment</button>
    </div>
  `;
}
```

### アプローチ2: Alpine.js

さらに軽量なアプローチとして、Alpine.jsも検討できます：

- **Alpine.js**: 宣言的なHTMLベースのアプローチで、小さなインタラクティブなUIを構築（約14KB）
- ビルドステップが不要で、CDNから直接読み込み可能
- シンプルなディレクティブベースのAPI

```html
<!-- Alpine.jsを使用した例 -->
<div x-data="{ text: '', yaml: '' }">
  <textarea x-model="text" @input="convertToYaml()"></textarea>
  <pre x-text="yaml"></pre>
  
  <script>
    function convertToYaml() {
      // テキストからYAMLへの変換ロジック
      this.yaml = apiCall('/convert', this.text);
    }
  </script>
</div>
```

### アプローチ3: Vanilla JS + Web Components

最も軽量なアプローチとして、フレームワークを使用せずにVanilla JSとWeb Componentsを使用する方法も検討できます：

- **Web Components**: 標準のWeb APIを使用してカスタム要素を定義
- **Fetch API**: APIとの通信に使用
- **ES Modules**: コードの分割とモジュール化

```javascript
// Web Componentsを使用した例
class IdressEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }
  
  async convertText(text) {
    const response = await fetch('/api/convert', {
      method: 'POST',
      body: text
    });
    return response.json();
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        textarea { width: 100%; min-height: 200px; }
      </style>
      <textarea id="editor"></textarea>
      <pre id="yaml"></pre>
    `;
    
    const editor = this.shadowRoot.getElementById('editor');
    const yaml = this.shadowRoot.getElementById('yaml');
    
    editor.addEventListener('input', async () => {
      try {
        const data = await this.convertText(editor.value);
        yaml.textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        yaml.textContent = `Error: ${error.message}`;
      }
    });
  }
}

customElements.define('idress-editor', IdressEditor);
```

## 推奨アプローチ: Preact + HTM + Signals

小規模プロジェクトでありながら、複雑なUIコンポーネントと状態管理が必要なことを考慮すると、**Preact + HTM + Signals**の組み合わせが最適です：

- **軽量**: 合計で約10KB程度（gzip圧縮後）
- **開発効率**: Reactに似たAPIで開発効率が高い
- **型安全**: TypeScriptとの相性が良い
- **柔軟性**: 必要に応じて機能を追加可能

## アーキテクチャ

### 全体構成

フロントエンドは以下の層に分けて設計します：

1. **UIコンポーネント**: Preactコンポーネント
2. **状態管理**: Signals
3. **APIクライアント**: Fetch APIを使用したシンプルなクライアント

```
src/
├── components/       # UIコンポーネント
├── hooks/            # カスタムフック
├── services/         # APIサービス
├── store/            # 状態管理（Signals）
├── types/            # 型定義
├── utils/            # ユーティリティ関数
└── index.js          # エントリーポイント
```

### コンポーネント設計

コンポーネントは以下の原則に従って設計します：

1. **単一責任の原則**: 各コンポーネントは1つの責任を持つ
2. **コンポジション**: 小さなコンポーネントを組み合わせて大きなコンポーネントを作成

```
components/
├── Editor/           # エディタコンポーネント
│   ├── TextEditor.js
│   ├── YamlViewer.js
│   └── index.js
├── Validator/        # 検証コンポーネント
│   ├── ValidationResult.js
│   └── index.js
└── common/           # 共通コンポーネント
    ├── Button.js
    ├── Input.js
    └── ...
```

### 状態管理

状態は以下のように管理します：

1. **ローカル状態**: コンポーネント内のuseState（Preact）
2. **グローバル状態**: Signals

```javascript
// store/idressStore.js
import { signal, computed } from '@preact/signals';
import { textToObject, objectToYaml } from '../services/converter';

export const textContent = signal('');
export const idressData = computed(() => {
  try {
    return textToObject(textContent.value);
  } catch (error) {
    return null;
  }
});
export const yamlContent = computed(() => {
  if (!idressData.value) return '';
  return objectToYaml(idressData.value);
});

export const validationResult = signal(null);

export async function validateText() {
  try {
    const response = await fetch('/api/validate', {
      method: 'POST',
      body: textContent.value
    });
    validationResult.value = await response.json();
  } catch (error) {
    validationResult.value = { error: error.message };
  }
}
```

### APIクライアント

APIクライアントは以下の方針で実装します：

1. **シンプル**: 必要最小限の機能に絞る
2. **型安全**: TypeScriptの型を活用
3. **エラーハンドリング**: 一貫したエラー処理

```typescript
// services/api.ts
import { IdressData } from '../types';

export async function convertText(text: string): Promise<IdressData> {
  const response = await fetch('/api/convert', {
    method: 'POST',
    body: text
  });
  
  if (!response.ok) {
    throw new Error('変換に失敗しました');
  }
  
  return response.json();
}

export async function validateText(text: string): Promise<any> {
  const response = await fetch('/api/validate', {
    method: 'POST',
    body: text
  });
  
  if (!response.ok) {
    throw new Error('検証に失敗しました');
  }
  
  return response.json();
}

export async function storeData(text: string): Promise<any> {
  const response = await fetch('/api/store', {
    method: 'POST',
    body: text
  });
  
  if (!response.ok) {
    throw new Error('保存に失敗しました');
  }
  
  return response.json();
}

export async function getData(name: string): Promise<IdressData> {
  const response = await fetch(`/api/get/${encodeURIComponent(name)}`);
  
  if (!response.ok) {
    throw new Error('データの取得に失敗しました');
  }
  
  return response.json();
}

export async function listData(names: string[]): Promise<any> {
  const response = await fetch('/api/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ names })
  });
  
  if (!response.ok) {
    throw new Error('データの一覧取得に失敗しました');
  }
  
  return response.json();
}
```

## 画面設計

### 主要画面

1. **エディタ画面**: テキスト形式とYAML形式の相互変換と編集
2. **検証画面**: データの検証と自動修正
3. **一覧画面**: 保存されたアイドレスデータの一覧と検索

### エディタ画面

エディタ画面は以下の機能を提供します：

1. テキスト入力エリア
2. YAML表示エリア
3. 検証結果表示
4. 保存ボタン

```html
<div class="editor-container">
  <div class="tabs">
    <button class="tab active">テキスト</button>
    <button class="tab">YAML</button>
  </div>
  
  <div class="editor-content">
    <textarea id="text-editor"></textarea>
    <pre id="yaml-viewer" style="display: none;"></pre>
  </div>
  
  <div class="validation-result"></div>
  
  <div class="actions">
    <button id="validate-btn">検証</button>
    <button id="save-btn">保存</button>
  </div>
</div>
```

## スタイリング

軽量なアプローチとして、以下のスタイリング方法を推奨します：

1. **CSS Variables**: テーマカラーなどの共通値を定義
2. **Minimal CSS**: 必要最小限のCSSを記述
3. **CSS Modules**: コンポーネントごとにスコープされたCSS

```css
/* styles/variables.css */
:root {
  --primary-color: #4a56e2;
  --secondary-color: #6c757d;
  --background-color: #f8f9fa;
  --text-color: #212529;
  --border-color: #dee2e6;
  --border-radius: 4px;
  --spacing-unit: 8px;
}

/* components/Editor/Editor.module.css */
.editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-unit);
  padding: calc(var(--spacing-unit) * 2);
  background-color: var(--background-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.textarea {
  width: 100%;
  min-height: 200px;
  padding: var(--spacing-unit);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-family: monospace;
}
```

## デプロイメント戦略

フロントエンドのデプロイメントには以下の戦略を推奨します：

1. **Cloudflare Pages**: バックエンドがCloudflare Workersなので、同じプラットフォームを使用することで連携が容易になります。
2. **GitHub Actions**: CI/CDパイプラインを構築し、自動デプロイを実現します。

## パフォーマンス最適化

パフォーマンスを最適化するために以下の施策を実施します：

1. **軽量ライブラリ**: 必要最小限のライブラリのみを使用
2. **コード分割**: 必要なコードのみを読み込む
3. **遅延読み込み**: 必要になったときにコンポーネントを読み込む
4. **キャッシュ**: APIレスポンスをキャッシュする

## オプション機能: オフライン対応

優先度は高くありませんが、必要に応じて以下のオフライン対応機能を追加できます：

1. **Service Worker**: 基本的なアセットのキャッシュ
2. **LocalStorage**: 編集中のデータの一時保存

```javascript
// 簡易的なオフライン対応
function saveToLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadFromLocalStorage(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

// 自動保存機能
function setupAutoSave() {
  const editor = document.getElementById('text-editor');
  editor.addEventListener('input', () => {
    saveToLocalStorage('idress-draft', editor.value);
  });
  
  // 初期ロード時に保存データがあれば復元
  const savedData = loadFromLocalStorage('idress-draft');
  if (savedData) {
    editor.value = savedData;
  }
}
```

## 推奨実装アプローチ

### 段階的実装

フロントエンドの実装は以下の段階で進めることを推奨します：

1. **フェーズ1**: 基本的なエディタ機能と検証機能
2. **フェーズ2**: データの保存と一覧表示
3. **フェーズ3**: UIの改善とレスポンシブ対応
4. **フェーズ4**: オプション機能（オフライン対応など）

### 具体的な技術スタック

以下の技術スタックを推奨します：

- **フレームワーク**: Preact + HTM
- **状態管理**: Preact Signals
- **ビルドツール**: Vite（必要に応じて）
- **スタイリング**: CSS Variables + CSS Modules
- **APIクライアント**: Fetch API
- **テスト**: Jest + Testing Library
- **デプロイ**: Cloudflare Pages

## サンプル実装

### エディタコンポーネント

```javascript
// components/Editor/index.js
import { html } from 'htm/preact';
import { useEffect } from 'preact/hooks';
import { textContent, yamlContent, validateText, validationResult } from '../../store/idressStore';
import { storeData } from '../../services/api';
import './Editor.css';

export function Editor() {
  useEffect(() => {
    // 初期データの読み込みなど
    const savedDraft = localStorage.getItem('idress-draft');
    if (savedDraft) {
      textContent.value = savedDraft;
    }
  }, []);

  const handleTextChange = (e) => {
    textContent.value = e.target.value;
    // 下書き保存
    localStorage.setItem('idress-draft', e.target.value);
  };

  const handleValidate = () => {
    validateText();
  };

  const handleSave = async () => {
    try {
      const result = await storeData(textContent.value);
      alert('保存しました');
    } catch (error) {
      alert(`保存に失敗しました: ${error.message}`);
    }
  };

  return html`
    <div class="editor">
      <div class="tabs">
        <button class="tab active">テキスト</button>
        <button class="tab">YAML</button>
      </div>
      
      <div class="editor-content">
        <textarea 
          class="textarea"
          value=${textContent.value}
          onInput=${handleTextChange}
          placeholder="アイドレスのテキストを入力してください"
        ></textarea>
        
        <pre class="yaml-preview">${yamlContent}</pre>
      </div>
      
      ${validationResult.value && html`
        <div class="validation-result">
          <h3>検証結果</h3>
          <p>有効: ${validationResult.value.isValid ? '✅' : '❌'}</p>
          <ul>
            ${validationResult.value.items?.map(item => html`
              <li class=${item.severity}>
                ${item.field}: ${item.message}
              </li>
            `)}
          </ul>
        </div>
      `}
      
      <div class="actions">
        <button onClick=${handleValidate}>検証</button>
        <button onClick=${handleSave}>保存</button>
      </div>
    </div>
  `;
}
```

### メインアプリケーション

```javascript
// index.js
import { html, render } from 'htm/preact';
import { Editor } from './components/Editor';
import './styles/global.css';

function App() {
  return html`
    <div class="app">
      <header class="header">
        <h1>アイドレスエディタ</h1>
      </header>
      
      <main class="main">
        <${Editor} />
      </main>
      
      <footer class="footer">
        <p>© 2025 アイドレスモジュール</p>
      </footer>
    </div>
  `;
}

render(html`<${App} />`, document.getElementById('app'));
```

## まとめ

アイドレスモジュールの軽量フロントエンドは、Preact + HTM + Signalsを基盤とし、最小限のライブラリと標準Web APIを活用して、ユーザーフレンドリーなインターフェースを提供します。

このアプローチにより、以下のメリットが得られます：

1. **軽量**: 合計で約10KB程度（gzip圧縮後）のJavaScriptバンドル
2. **高速**: 最小限のオーバーヘッドで高速な読み込みと実行
3. **シンプル**: 複雑な設定やビルドプロセスが不要
4. **拡張性**: 必要に応じて機能を追加可能

バックエンドAPIとの連携を考慮した設計により、シームレスなユーザー体験を実現し、アイドレスデータの作成・編集・管理を効率化します。
