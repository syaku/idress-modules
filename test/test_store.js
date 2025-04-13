const fs = require('fs');
const axios = require('axios');

async function testStoreApi() {
  try {
    const textData = fs.readFileSync('test/オブジェクトサンプル.txt', 'utf-8');
    
    console.log('リポジトリに保存するデータ:');
    console.log(textData.substring(0, 100) + '...');
    
    const response = await axios.post('http://localhost:8787/store', textData, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    console.log('\n保存結果:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('エラー:', error.response ? error.response.data : error.message);
  }
}

testStoreApi();
