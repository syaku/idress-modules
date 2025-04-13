import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { textToObject } from './idress_converter';
import { validateIdressData, getValidationResultText } from './idress_validator';
import { CloudflareKVRepositoryFactory } from './cloudflare_kv_repository';
import { IdressData } from './idress_converter';

// Honoアプリケーションの作成
const app = new Hono();

// CORSの設定
app.use('/*', cors());

// リポジトリの初期化（Cloudflare Workers KVを使用）
// 注: このコードはCloudflare Workers環境で実行されることを前提としています
// env.IDRESS_KVはwrangler.tomlで設定されたKV Namespaceのバインディングです
let repository: any;

// Honoアプリケーションのハンドラー関数
export default {
  fetch(request: Request, env: any, ctx: any) {
    // リポジトリの初期化
    if (!repository) {
      const factory = new CloudflareKVRepositoryFactory();
      repository = factory.createRepository({ namespace: env.IDRESS_KV });
    }
    
    return app.fetch(request, env, ctx);
  }
};

// ルートエンドポイント
app.get('/', (c) => {
  return c.text('idress API サーバー - /convert, /validate, /store, /get/:name, /list エンドポイントが利用可能です');
});

// テキスト形式をJSONに変換するエンドポイント
app.post('/convert', async (c) => {
  try {
    // リクエストボディからテキストを取得
    const text = await c.req.text();
    
    // テキストが空の場合はエラーを返す
    if (!text) {
      return c.json({ error: 'テキストが空です' }, 400);
    }
    
    // テキスト形式をJSONに変換
    const data = textToObject(text);
    
    // 変換結果をJSONとして返す
    return c.json(data);
  } catch (error: unknown) {
    console.error('変換エラー:', error);
    return c.json({ 
      error: '変換中にエラーが発生しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    }, 500);
  }
});

// テキスト形式のデータを検証するエンドポイント
app.post('/validate', async (c) => {
  try {
    // リクエストボディからテキストを取得
    const text = await c.req.text();
    
    // テキストが空の場合はエラーを返す
    if (!text) {
      return c.json({ error: 'テキストが空です' }, 400);
    }
    
    // テキスト形式をJSONに変換
    const data = textToObject(text);
    
    // データを検証
    const validationResult = validateIdressData(data);
    
    // 検証結果をJSONとして返す
    return c.json({
      isValid: validationResult.isValid,
      items: validationResult.items,
      resultText: getValidationResultText(validationResult)
    });
  } catch (error: unknown) {
    console.error('検証エラー:', error);
    return c.json({ 
      error: '検証中にエラーが発生しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    }, 500);
  }
});

// 名前を指定してデータを取得するエンドポイント
app.get('/get/:name', async (c) => {
  try {
    // URLパラメータから名前を取得
    const name = c.req.param('name');
    
    // 名前が空の場合はエラーを返す
    if (!name) {
      return c.json({ error: '名前が指定されていません' }, 400);
    }
    
    // リポジトリから指定された名前のデータを取得
    const data = await repository.findByName(name);
    
    // データが見つからない場合は404エラーを返す
    if (!data) {
      return c.json({ error: `名前「${name}」のデータが見つかりません` }, 404);
    }
    
    // 取得したデータをJSONとして返す
    return c.json(data);
  } catch (error: unknown) {
    console.error('データ取得エラー:', error);
    return c.json({ 
      error: 'データの取得中にエラーが発生しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    }, 500);
  }
});

// 複数の名前を指定してデータを取得するエンドポイント
app.post('/list', async (c) => {
  try {
    // リクエストボディからJSONを取得
    const body = await c.req.json();
    
    // 名前リストが指定されていない場合はエラーを返す
    if (!body.names || !Array.isArray(body.names)) {
      return c.json({ 
        error: '名前リストが正しく指定されていません。リクエストボディに {"names": ["名前1", "名前2", ...]} の形式で指定してください。' 
      }, 400);
    }
    
    // 名前リストを取得
    const names = body.names.map((name: any) => String(name).trim()).filter((name: string) => name.length > 0);
    
    // 名前リストが空の場合はエラーを返す
    if (names.length === 0) {
      return c.json({ error: '有効な名前が指定されていません' }, 400);
    }
    
    // リポジトリから指定された名前のデータを取得
    const dataList = await repository.findByNames(names);
    
    // データが見つからない場合は空の配列を返す
    if (dataList.length === 0) {
      return c.json({ 
        message: '指定された名前のデータが見つかりませんでした',
        data: []
      });
    }
    
    // 取得したデータをJSONとして返す
    return c.json({
      message: `${dataList.length}件のデータが見つかりました`,
      data: dataList
    });
  } catch (error: unknown) {
    console.error('複数データ取得エラー:', error);
    return c.json({ 
      error: 'データの取得中にエラーが発生しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    }, 500);
  }
});

// テキスト形式のデータをリポジトリに保存するエンドポイント
app.post('/store', async (c) => {
  try {
    // リクエストボディからテキストを取得
    const text = await c.req.text();
    
    // テキストが空の場合はエラーを返す
    if (!text) {
      return c.json({ error: 'テキストが空です' }, 400);
    }
    
    // テキスト形式をJSONに変換
    const data = textToObject(text);
    
    // データを検証
    const validationResult = validateIdressData(data);
    
    // 検証に失敗した場合はエラーを返す
    if (!validationResult.isValid) {
      return c.json({
        error: '無効なデータです',
        validationResult: {
          isValid: validationResult.isValid,
          items: validationResult.items,
          resultText: getValidationResultText(validationResult)
        }
      }, 400);
    }
    
    try {
      // リポジトリにデータを保存
      const savedData = await repository.create(data);
      
      // 保存結果をJSONとして返す
      return c.json({
        success: true,
        message: 'データが正常に保存されました',
        data: savedData
      });
    } catch (repoError: unknown) {
      // リポジトリエラーの処理
      console.error('リポジトリエラー:', repoError);
      return c.json({ 
        error: 'データの保存中にエラーが発生しました', 
        message: repoError instanceof Error ? repoError.message : '不明なエラー' 
      }, 400);
    }
  } catch (error: unknown) {
    console.error('保存エラー:', error);
    return c.json({ 
      error: 'データの保存中にエラーが発生しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    }, 500);
  }
});

// 注: Cloudflare Workersのエクスポートは上部で定義されています
