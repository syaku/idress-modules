import { IdressData, textToObject } from '../../src/idress_converter';
import { IdressRepository, IdressFilter } from '../../src/idress_repository';
import { MemoryRepositoryFactory, MemoryRepository } from '../../src/memory_repository';

/**
 * リポジトリのテスト
 */
async function testRepository() {
    console.log('===== IdressRepository テスト =====');
    
    // サンプルデータの作成
    const sampleText = `知識：１：名前：ルウシィ・紅葉
オーナー：サンプルオーナー
タイプ：キャラクター
スケール：３
攻撃：１：ファイアボール：炎の球を放つ
防御：２：マジックバリア：魔法の障壁を展開
移動：３：テレポート：短距離の瞬間移動
HP：10/10
設定：魔法使いの少女。炎と風の魔法を得意とする。
次のアイドレス：未定
適用勲章１：勇気の勲章：攻撃力+1：https://example.com/medal1`;
    
    const sampleData: IdressData = textToObject(sampleText);
    
    // インメモリリポジトリの使用例
    console.log('\n----- インメモリリポジトリ -----');
    const memoryFactory = new MemoryRepositoryFactory();
    const memoryRepo = memoryFactory.createRepository();
    
    await testMemoryRepository(memoryRepo, sampleData);
}

/**
 * インメモリリポジトリのテスト
 * @param repo リポジトリインスタンス
 * @param sampleData サンプルデータ
 */
async function testMemoryRepository(repo: IdressRepository, sampleData: IdressData) {
    try {
        // 1. データの作成
        console.log('1. データの作成');
        const createdData = await repo.create(sampleData);
        console.log(`  データが作成されました: ${extractName(createdData)}`);
        
        // 2. 名前による検索
        console.log('\n2. 名前による検索');
        console.log(`  検索する名前: 'ルウシィ・紅葉'`);
        
        // データストアの内容を表示（デバッグ用）
        if (repo instanceof MemoryRepository) {
            console.log('  データストアの内容:');
            const allData = await repo.find();
            for (const data of allData) {
                console.log(`    - キー: ${extractName(data)}, オーナー: ${data.オーナー}`);
            }
            console.log(`  データストア内のアイテム数: ${await (repo as any).count()}`);
        }
        
        const foundData = await repo.findByName('ルウシィ・紅葉');
        if (foundData) {
            console.log(`  データが見つかりました: ${extractName(foundData)}`);
            console.log(`  タイプ: ${foundData.タイプ}`);
            console.log(`  オーナー: ${foundData.オーナー}`);
        } else {
            console.log('  データが見つかりませんでした');
        }
        
        // 3. フィルタによる検索
        console.log('\n3. フィルタによる検索');
        const filter: IdressFilter = {
            タイプ: 'キャラクター',
            スケール: { min: 2 },
            マーク: ['攻撃', '防御', '移動']
        };
        const filteredData = await repo.find(filter);
        console.log(`  ${filteredData.length}件のデータが見つかりました`);
        for (const data of filteredData) {
            console.log(`  - ${extractName(data)} (スケール: ${data.スケール})`);
        }
        
        // 4. データの更新
        console.log('\n4. データの更新');
        const updateData: Partial<IdressData> = {
            スケール: 4,
            HP: '15/15'
        };
        const updatedData = await repo.update('ルウシィ・紅葉', updateData);
        if (updatedData) {
            console.log(`  データが更新されました: ${extractName(updatedData)}`);
            console.log(`  新しいスケール: ${updatedData.スケール}`);
            console.log(`  新しいHP: ${updatedData.HP}`);
        } else {
            console.log('  更新するデータが見つかりませんでした');
        }
        
        // 5. データの削除
        console.log('\n5. データの削除');
        const deleteResult = await repo.delete('ルウシィ・紅葉');
        console.log(`  削除結果: ${deleteResult ? '成功' : '失敗'}`);
        
        // 削除の確認
        const checkData = await repo.findByName('ルウシィ・紅葉');
        console.log(`  削除後の検索結果: ${checkData ? '存在する' : '存在しない'}`);
        
    } catch (error) {
        console.error('エラーが発生しました:', error);
    }
}

/**
 * 複数データの操作テスト
 */
async function testMultipleDataOperations() {
    console.log('\n===== 複数データの操作テスト =====');
    
    // リポジトリの作成
    const factory = new MemoryRepositoryFactory();
    const repo = factory.createRepository();
    
    try {
        // 複数のサンプルデータを作成
        const sampleData1 = createSampleData('テストキャラクター1', 'テストユーザー1');
        const sampleData2 = createSampleData('テストキャラクター2', 'テストユーザー2');
        const sampleData3 = createSampleData('テストキャラクター3', 'テストユーザー1');
        
        // データの保存
        console.log('1. 複数データの保存');
        await repo.create(sampleData1);
        await repo.create(sampleData2);
        await repo.create(sampleData3);
        
        // データストアの内容を表示
        if (repo instanceof MemoryRepository) {
            console.log(`  データストア内のアイテム数: ${await (repo as any).count()}`);
        }
        
        // 複数の名前による検索
        console.log('\n2. 複数の名前による検索');
        const names = ['テストキャラクター1', 'テストキャラクター3', '存在しない名前'];
        console.log(`  検索する名前: ${names.join(', ')}`);
        
        const foundDataList = await repo.findByNames(names);
        console.log(`  ${foundDataList.length}件のデータが見つかりました`);
        for (const data of foundDataList) {
            console.log(`  - ${extractName(data)} (オーナー: ${data.オーナー})`);
        }
        
        // オーナーによるフィルタリング
        console.log('\n3. オーナーによるフィルタリング');
        const ownerFilter: IdressFilter = {
            オーナー: 'テストユーザー1'
        };
        const ownerFilteredData = await repo.find(ownerFilter);
        console.log(`  オーナー「テストユーザー1」のデータ: ${ownerFilteredData.length}件`);
        for (const data of ownerFilteredData) {
            console.log(`  - ${extractName(data)}`);
        }
        
        // 複合条件によるフィルタリング
        console.log('\n4. 複合条件によるフィルタリング');
        const complexFilter: IdressFilter = {
            オーナー: 'テストユーザー1',
            タイプ: 'キャラクター',
            スケール: { min: 2, max: 5 }
        };
        const complexFilteredData = await repo.find(complexFilter);
        console.log(`  複合条件に一致するデータ: ${complexFilteredData.length}件`);
        for (const data of complexFilteredData) {
            console.log(`  - ${extractName(data)} (スケール: ${data.スケール})`);
        }
        
        // リポジトリのクリア
        if (repo instanceof MemoryRepository) {
            await (repo as any).clear();
            console.log('\nリポジトリをクリアしました');
            console.log(`  クリア後のアイテム数: ${await (repo as any).count()}`);
        }
        
    } catch (error) {
        console.error('テスト中にエラーが発生しました:', error);
    }
}

/**
 * サンプルデータを作成する
 * @param name 名前
 * @param owner オーナー
 * @returns サンプルデータ
 */
function createSampleData(name: string, owner: string): IdressData {
    return {
        オーナー: owner,
        タイプ: 'キャラクター',
        オブジェクトタイプ: 'オブジェクト',
        スケール: 3,
        データ: [
            {
                マーク: '知識',
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
 * データから名前を抽出するヘルパー関数
 * @param data IdressData
 * @returns 名前（見つからない場合は空文字列）
 */
function extractName(data: IdressData): string {
    if (data.データ && data.データ.length > 0) {
        const nameItem = data.データ.find(item => item.名前 === '名前');
        if (nameItem && nameItem.説明) {
            return nameItem.説明;
        }
    }
    return '';
}

/**
 * メイン関数
 */
async function main() {
    try {
        // 基本的なリポジトリテスト
        await testRepository();
        
        // 複数データの操作テスト
        await testMultipleDataOperations();
        
        console.log('\n===== テスト完了 =====');
    } catch (error) {
        console.error('テスト実行中にエラーが発生しました:', error);
    }
}

// テスト実行
main().catch(error => {
    console.error('テストの実行中にエラーが発生しました:', error);
});
