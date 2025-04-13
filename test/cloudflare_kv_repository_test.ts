/**
 * Cloudflare KV Repositoryのテスト
 * 
 * このファイルはCloudflare KV Repositoryの動作をテストするためのものです。
 * 実際のKV Namespaceを使用するため、Cloudflare Workersの環境で実行する必要があります。
 */

import { IdressData } from '../src/idress_converter';
import { CloudflareKVRepositoryFactory } from '../src/cloudflare_kv_repository';

// KV Namespaceの型定義（テスト用）
declare const IDRESS_KV: KVNamespace;

/**
 * テストデータを作成する
 * @returns テスト用のIdressDataオブジェクト
 */
function createTestData(name: string): IdressData {
    return {
        オーナー: 'テストオーナー',
        タイプ: 'キャラクター',
        オブジェクトタイプ: 'オブジェクト',
        スケール: 3,
        データ: [
            {
                マーク: '情報',
                ナンバー: 1,
                名前: '名前',
                説明: name
            },
            {
                マーク: '攻撃',
                ナンバー: 2,
                名前: 'テストスキル',
                説明: 'これはテスト用のスキルです'
            }
        ]
    };
}

/**
 * Cloudflare KV Repositoryのテスト
 */
async function testCloudflareKVRepository() {
    console.log('=== Cloudflare KV Repositoryテスト開始 ===');
    
    // リポジトリの作成
    const factory = new CloudflareKVRepositoryFactory();
    const repo = factory.createRepository({ namespace: IDRESS_KV });
    
    try {
        // テスト前にクリア（テスト用メソッド）
        if ('clear' in repo) {
            await (repo as any).clear();
        }
        
        // 1. データの作成
        console.log('\n--- テスト1: データの作成 ---');
        const testData1 = createTestData('テストキャラクター1');
        const testData2 = createTestData('テストキャラクター2');
        
        console.log('データ1を作成します...');
        await repo.create(testData1);
        console.log('データ2を作成します...');
        await repo.create(testData2);
        
        // データ数の確認（テスト用メソッド）
        if ('count' in repo) {
            const count = await (repo as any).count();
            console.log(`データ数: ${count}`);
        }
        
        // 2. 名前による検索
        console.log('\n--- テスト2: 名前による検索 ---');
        const foundData1 = await repo.findByName('テストキャラクター1');
        console.log('テストキャラクター1の検索結果:', foundData1 ? '見つかりました' : '見つかりませんでした');
        
        const notFoundData = await repo.findByName('存在しないキャラクター');
        console.log('存在しないキャラクターの検索結果:', notFoundData ? '見つかりました' : '見つかりませんでした');
        
        // 3. 複数の名前による検索
        console.log('\n--- テスト3: 複数の名前による検索 ---');
        const foundDataList = await repo.findByNames(['テストキャラクター1', 'テストキャラクター2', '存在しないキャラクター']);
        console.log(`検索結果数: ${foundDataList.length}`);
        
        // 4. フィルタリング
        console.log('\n--- テスト4: フィルタリング ---');
        
        // タイプによるフィルタリング
        const filteredByType = await repo.find({ タイプ: 'キャラクター' });
        console.log(`タイプ='キャラクター'の検索結果数: ${filteredByType.length}`);
        
        // マークによるフィルタリング
        const filteredByMark = await repo.find({ マーク: ['攻撃'] });
        console.log(`マーク='攻撃'の検索結果数: ${filteredByMark.length}`);
        
        // 複合条件によるフィルタリング
        const filteredByComplex = await repo.find({
            タイプ: 'キャラクター',
            オーナー: 'テストオーナー',
            スケール: { min: 2, max: 4 }
        });
        console.log(`複合条件の検索結果数: ${filteredByComplex.length}`);
        
        // 5. データの更新
        console.log('\n--- テスト5: データの更新 ---');
        const updateResult = await repo.update('テストキャラクター1', { スケール: 5 });
        console.log('更新結果:', updateResult ? '成功' : '失敗');
        
        // 更新されたデータの確認
        const updatedData = await repo.findByName('テストキャラクター1');
        console.log(`更新後のスケール: ${updatedData?.スケール}`);
        
        // 6. データの削除
        console.log('\n--- テスト6: データの削除 ---');
        const deleteResult1 = await repo.delete('テストキャラクター1');
        console.log('テストキャラクター1の削除結果:', deleteResult1 ? '成功' : '失敗');
        
        const deleteResult2 = await repo.delete('存在しないキャラクター');
        console.log('存在しないキャラクターの削除結果:', deleteResult2 ? '成功' : '失敗');
        
        // 削除後のデータ数の確認（テスト用メソッド）
        if ('count' in repo) {
            const count = await (repo as any).count();
            console.log(`削除後のデータ数: ${count}`);
        }
        
        console.log('\nすべてのテストが完了しました！');
    } catch (error) {
        console.error('テスト中にエラーが発生しました:', error);
    } finally {
        // テスト後のクリーンアップ（テスト用メソッド）
        if ('clear' in repo) {
            await (repo as any).clear();
            console.log('\nテストデータをクリアしました');
        }
    }
    
    console.log('=== Cloudflare KV Repositoryテスト終了 ===');
}

// Cloudflare Workersの環境で実行する場合
export default {
    async fetch(request: Request, env: any): Promise<Response> {
        try {
            // テストの実行
            await testCloudflareKVRepository();
            
            return new Response('Cloudflare KV Repositoryのテストが完了しました。コンソールログを確認してください。', {
                headers: { 'Content-Type': 'text/plain' }
            });
        } catch (error) {
            return new Response(`テスト中にエラーが発生しました: ${error}`, {
                status: 500,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    }
};
