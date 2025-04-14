# Vanilla JS + Web Components によるフロントエンド実装

## 概要

このドキュメントでは、フレームワークを一切使用せず、標準のWeb APIのみを使用した最も軽量なフロントエンド実装アプローチについて説明します。Web ComponentsとVanilla JSを使用することで、外部依存関係なしで高速で軽量なUIを構築できます。

## メリット

1. **超軽量**: 外部ライブラリやフレームワークに依存しないため、バンドルサイズが最小限
2. **高速**: 余分なレイヤーがないため、読み込みと実行が高速
3. **将来性**: 標準のWeb APIを使用するため、ブラウザの進化に合わせて自動的に改善される
4. **ビルドステップ不要**: 複雑なビルド設定が不要で、直接ブラウザで実行可能
5. **学習コスト低**: 特定のフレームワークの知識が不要で、標準のJavaScriptとDOM APIの知識のみで開発可能

## 基本構造

```
public/
├── index.html        # メインHTML
├── styles/           # スタイルシート
│   ├── main.css
│   └── components/
├── js/               # JavaScriptモジュール
│   ├── components/   # Web Components
│   │   ├── idress-editor.js
│   │   ├── idress-validator.js
│   │   └── idress-list.js
│   ├── services/     # APIサービス
│   │   └── api.js
│   ├── utils/        # ユーティリティ関数
│   │   └── converter.js
│   └── app.js        # メインアプリケーション
└── favicon.ico
```

## Web Componentsの実装例

### アイドレスエディタコンポーネント

```javascript
// js/components/idress-editor.js
class IdressEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // 状態の初期化
    this.state = {
      text: '',
      yaml: '',
      validationResult: null
    };
    
    this.render();
    this.setupEventListeners();
    this.loadDraft();
  }
  
  // コンポーネントがDOMに追加されたときに呼ばれる
  connectedCallback() {
    // 必要に応じて初期化処理
  }
  
  // 状態を更新する
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }
  
  // ローカルストレージから下書きを読み込む
  loadDraft() {
    const savedDraft = localStorage.getItem('idress-draft');
    if (savedDraft) {
      this.setState({ text: savedDraft });
    }
  }
  
  // 下書きを保存する
  saveDraft(text) {
    localStorage.setItem('idress-draft', text);
  }
  
  // テキストを変換する
  async convertText(text) {
    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: text
      });
      
      if (!response.ok) {
        throw new Error('変換に失敗しました');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('変換エラー:', error);
      return null;
    }
  }
  
  // テキストを検証する
  async validateText(text) {
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        body: text
      });
      
      if (!response.ok) {
        throw new Error('検証に失敗しました');
      }
      
      const result = await response.json();
      this.setState({ validationResult: result });
    } catch (error) {
      console.error('検証エラー:', error);
      this.setState({ 
        validationResult: { 
          isValid: false, 
          items: [{ field: 'error', message: error.message, severity: 'error' }] 
        } 
      });
    }
  }
  
  // データを保存する
  async saveData(text) {
    try {
      const response = await fetch('/api/store', {
        method: 'POST',
        body: text
      });
      
      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }
      
      const result = await response.json();
      alert('保存しました');
      return result;
    } catch (error) {
      console.error('保存エラー:', error);
      alert(`保存に失敗しました: ${error.message}`);
      return null;
    }
  }
  
  // イベントリスナーを設定する
  setupEventListeners() {
    // テキスト入力時の処理
    this.shadowRoot.getElementById('text-editor').addEventListener('input', async (e) => {
      const text = e.target.value;
      this.setState({ text });
      this.saveDraft(text);
      
      // テキストが変更されたら自動的に変換
      if (text) {
        const data = await this.convertText(text);
        if (data) {
          this.setState({ yaml: JSON.stringify(data, null, 2) });
        }
      } else {
        this.setState({ yaml: '' });
      }
    });
    
    // 検証ボタンクリック時の処理
    this.shadowRoot.getElementById('validate-btn').addEventListener('click', () => {
      this.validateText(this.state.text);
    });
    
    // 保存ボタンクリック時の処理
    this.shadowRoot.getElementById('save-btn').addEventListener('click', () => {
      this.saveData(this.state.text);
    });
    
    // タブ切り替え
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    const contents = this.shadowRoot.querySelectorAll('.editor-panel');
    
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        // アクティブなタブを切り替え
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // コンテンツを切り替え
        contents.forEach(c => c.style.display = 'none');
        contents[index].style.display = 'block';
      });
    });
  }
  
  // コンポーネントをレンダリングする
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: sans-serif;
        }
        
        .editor {
          border: 1px solid #ccc;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .tabs {
          display: flex;
          background-color: #f5f5f5;
          border-bottom: 1px solid #ccc;
        }
        
        .tab {
          padding: 8px 16px;
          cursor: pointer;
          border: none;
          background: none;
        }
        
        .tab.active {
          background-color: #fff;
          border-bottom: 2px solid #4a56e2;
        }
        
        .editor-content {
          padding: 16px;
        }
        
        .editor-panel {
          width: 100%;
        }
        
        textarea {
          width: 100%;
          min-height: 300px;
          padding: 8px;
          font-family: monospace;
          border: 1px solid #ccc;
          border-radius: 4px;
          resize: vertical;
        }
        
        pre {
          width: 100%;
          min-height: 300px;
          padding: 8px;
          font-family: monospace;
          background-color: #f8f9fa;
          border: 1px solid #ccc;
          border-radius: 4px;
          overflow: auto;
          white-space: pre-wrap;
        }
        
        .validation-result {
          margin-top: 16px;
          padding: 16px;
          background-color: #f8f9fa;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .validation-result h3 {
          margin-top: 0;
        }
        
        .validation-result ul {
          padding-left: 20px;
        }
        
        .error {
          color: #dc3545;
        }
        
        .warning {
          color: #ffc107;
        }
        
        .info {
          color: #17a2b8;
        }
        
        .actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
        
        button {
          padding: 8px 16px;
          background-color: #4a56e2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:hover {
          background-color: #3a46c2;
        }
      </style>
      
      <div class="editor">
        <div class="tabs">
          <button class="tab active">テキスト</button>
          <button class="tab">YAML</button>
        </div>
        
        <div class="editor-content">
          <div class="editor-panel" style="display: block;">
            <textarea id="text-editor" placeholder="アイドレスのテキストを入力してください">${this.state.text}</textarea>
          </div>
          
          <div class="editor-panel" style="display: none;">
            <pre id="yaml-viewer">${this.state.yaml}</pre>
          </div>
        </div>
        
        ${this.renderValidationResult()}
        
        <div class="actions">
          <button id="validate-btn">検証</button>
          <button id="save-btn">保存</button>
        </div>
      </div>
    `;
  }
  
  // 検証結果をレンダリングする
  renderValidationResult() {
    if (!this.state.validationResult) {
      return '';
    }
    
    const { isValid, items } = this.state.validationResult;
    
    let itemsHtml = '';
    if (items && items.length > 0) {
      itemsHtml = `
        <ul>
          ${items.map(item => `
            <li class="${item.severity}">
              ${item.field}: ${item.message}
            </li>
          `).join('')}
        </ul>
      `;
    }
    
    return `
      <div class="validation-result">
        <h3>検証結果</h3>
        <p>有効: ${isValid ? '✅' : '❌'}</p>
        ${itemsHtml}
      </div>
    `;
  }
}

// カスタム要素を登録
customElements.define('idress-editor', IdressEditor);
```

### アイドレス一覧コンポーネント

```javascript
// js/components/idress-list.js
class IdressList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // 状態の初期化
    this.state = {
      items: [],
      loading: false,
      error: null
    };
    
    this.render();
  }
  
  // コンポーネントがDOMに追加されたときに呼ばれる
  connectedCallback() {
    this.loadItems();
  }
  
  // 状態を更新する
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }
  
  // アイテムを読み込む
  async loadItems() {
    this.setState({ loading: true, error: null });
    
    try {
      // 保存されたアイテムの名前リストを取得（実際の実装ではAPIから取得）
      const names = ['サンプルキャラクター1', 'サンプルキャラクター2'];
      
      const response = await fetch('/api/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ names })
      });
      
      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }
      
      const result = await response.json();
      this.setState({ items: result.data || [], loading: false });
    } catch (error) {
      console.error('データ取得エラー:', error);
      this.setState({ error: error.message, loading: false });
    }
  }
  
  // アイテムを読み込む
  async loadItem(name) {
    try {
      const response = await fetch(`/api/get/${encodeURIComponent(name)}`);
      
      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }
      
      const data = await response.json();
      
      // カスタムイベントを発火してエディタにデータを渡す
      const event = new CustomEvent('idress-item-selected', {
        bubbles: true,
        composed: true,
        detail: { data }
      });
      
      this.dispatchEvent(event);
    } catch (error) {
      console.error('データ取得エラー:', error);
      alert(`データの取得に失敗しました: ${error.message}`);
    }
  }
  
  // コンポーネントをレンダリングする
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: sans-serif;
        }
        
        .list-container {
          border: 1px solid #ccc;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .list-header {
          padding: 16px;
          background-color: #f5f5f5;
          border-bottom: 1px solid #ccc;
        }
        
        .list-content {
          padding: 16px;
        }
        
        .list-item {
          padding: 8px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
        }
        
        .list-item:hover {
          background-color: #f8f9fa;
        }
        
        .loading {
          padding: 16px;
          text-align: center;
          color: #6c757d;
        }
        
        .error {
          padding: 16px;
          color: #dc3545;
        }
        
        .empty {
          padding: 16px;
          text-align: center;
          color: #6c757d;
        }
      </style>
      
      <div class="list-container">
        <div class="list-header">
          <h2>保存されたアイドレス</h2>
        </div>
        
        <div class="list-content">
          ${this.renderContent()}
        </div>
      </div>
    `;
    
    // アイテムクリック時のイベントリスナーを設定
    const items = this.shadowRoot.querySelectorAll('.list-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const name = item.getAttribute('data-name');
        this.loadItem(name);
      });
    });
  }
  
  // コンテンツをレンダリングする
  renderContent() {
    if (this.state.loading) {
      return `<div class="loading">読み込み中...</div>`;
    }
    
    if (this.state.error) {
      return `<div class="error">エラー: ${this.state.error}</div>`;
    }
    
    if (this.state.items.length === 0) {
      return `<div class="empty">保存されたアイドレスはありません</div>`;
    }
    
    return `
      <div class="list-items">
        ${this.state.items.map(item => `
          <div class="list-item" data-name="${item.データ?.[0]?.説明 || '不明'}">
            <div class="item-name">${item.データ?.[0]?.説明 || '不明'}</div>
            <div class="item-type">タイプ: ${item.タイプ || '不明'}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// カスタム要素を登録
customElements.define('idress-list', IdressList);
```

## メインアプリケーション

```javascript
// js/app.js
document.addEventListener('DOMContentLoaded', () => {
  // アプリケーションの初期化
  const app = document.getElementById('app');
  
  // アイドレスエディタとリストを表示
  app.innerHTML = `
    <header class="header">
      <h1>アイドレスエディタ</h1>
    </header>
    
    <main class="main">
      <div class="container">
        <div class="row">
          <div class="col-8">
            <idress-editor></idress-editor>
          </div>
          <div class="col-4">
            <idress-list></idress-list>
          </div>
        </div>
      </div>
    </main>
    
    <footer class="footer">
      <div class="container">
        <p>© 2025 アイドレスモジュール</p>
      </div>
    </footer>
  `;
  
  // アイテム選択イベントのリスナーを設定
  document.addEventListener('idress-item-selected', (event) => {
    const editor = document.querySelector('idress-editor');
    const data = event.detail.data;
    
    // データをテキスト形式に変換（実際の実装ではAPIを使用）
    const text = `A：１：名前：${data.データ?.[0]?.説明 || ''}
オーナー：${data.オーナー || ''}
タイプ：${data.タイプ || ''}
スケール：${data.スケール || ''}`;
    
    // エディタにテキストを設定
    editor.setState({ text });
  });
});
```

## HTML

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>アイドレスエディタ</title>
  <link rel="stylesheet" href="styles/main.css">
  <!-- Web Componentsのポリフィル（必要に応じて） -->
  <script src="https://unpkg.com/@webcomponents/webcomponentsjs@2.5.0/webcomponents-bundle.js"></script>
</head>
<body>
  <div id="app">
    <!-- アプリケーションがここに表示される -->
    <div class="loading">読み込み中...</div>
  </div>
  
  <!-- Web Componentsを読み込む -->
  <script type="module" src="js/components/idress-editor.js"></script>
  <script type="module" src="js/components/idress-list.js"></script>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

## CSS

```css
/* styles/main.css */
:root {
  --primary-color: #4a56e2;
  --secondary-color: #6c757d;
  --background-color: #f8f9fa;
  --text-color: #212529;
  --border-color: #dee2e6;
  --border-radius: 4px;
  --spacing-unit: 8px;
}

* {
  box-sizing: border-box;
}

body {
  font-family: sans-serif;
  margin: 0;
  padding: 0;
  color: var(--text-color);
  background-color: var(--background-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -15px;
}

.col-8 {
  flex: 0 0 66.666667%;
  max-width: 66.666667%;
  padding: 0 15px;
}

.col-4 {
  flex: 0 0 33.333333%;
  max-width: 33.333333%;
  padding: 0 15px;
}

.header {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 0;
}

.header h1 {
  margin: 0;
}

.main {
  padding: 2rem 0;
}

.footer {
  background-color: #f5f5f5;
  padding: 1rem 0;
  margin-top: 2rem;
  text-align: center;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: var(--secondary-color);
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .col-8, .col-4 {
    flex: 0 0 100%;
    max-width: 100%;
  }
  
  .col-4 {
    margin-top: 2rem;
  }
}
```

## 実装のポイント

1. **Web Components**: カスタム要素を使用して再利用可能なコンポーネントを作成
2. **Shadow DOM**: コンポーネントのスタイルとマークアップをカプセル化
3. **ES Modules**: モジュール化されたJavaScriptを使用してコードを整理
4. **Fetch API**: 標準のFetch APIを使用してAPIと通信
5. **カスタムイベント**: コンポーネント間の通信にカスタムイベントを使用
6. **LocalStorage**: 下書きデータの保存にLocalStorageを使用

## デプロイメント

このアプローチでは、ビルドステップが不要なため、静的ファイルをそのままCloudflare Pagesなどにデプロイできます。

```
# デプロイ手順
1. publicディレクトリ内のファイルをCloudflare Pagesにアップロード
2. 必要に応じてリダイレクトルールを設定
```

## まとめ

Vanilla JS + Web Componentsアプローチは、外部依存関係なしで軽量かつ高速なフロントエンドを構築できます。標準のWeb APIを使用するため、ブラウザの進化に合わせて自動的に改善され、特定のフレームワークの知識が不要です。

小規模なプロジェクトや、パフォーマンスが最も重要な場合に特に適しています。ただし、大規模なアプリケーションでは、コンポーネントの再利用性や状態管理の面で少し手間がかかる可能性があります。

このアプローチは、Preact + HTM + Signalsアプローチと比較して、さらに軽量でシンプルですが、開発効率の面では少し劣る可能性があります。プロジェクトの要件と優先事項に応じて、適切なアプローチを選択してください。
