const axios = require('axios');

async function testGetApi() {
  try {
    // テスト用の名前
    const name = 'テストキャラクター';
    
    console.log(`名前「${name}」のデータを取得します...`);
    
    const response = await axios.get(`http://localhost:8787/get/${encodeURIComponent(name)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('\n取得結果:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('エラー:', error.response ? error.response.data : error.message);
  }
}

testGetApi();
