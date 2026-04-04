const https = require('https');
const fs = require('fs');
const path = require('path');

async function searchUnsplash(query) {
  return new Promise((resolve, reject) => {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&client_id=m_efCi_rizU_zBoeR_0pjXdLZ_5TjT7ltbVcDUlnEx8`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.results || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const fileStream = fs.createWriteStream(filepath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔍 Ищу фотографии ванных комнат...\n');
  
  const queries = [
    'soviet bathroom vintage',
    'modern bathroom minimalist',
    'bathroom renovation comparison'
  ];
  
  for (let i = 0; i < queries.length; i++) {
    try {
      const results = await searchUnsplash(queries[i]);
      if (results.length > 0) {
        const photo = results[0];
        const filename = `bathroom-${i + 1}.jpg`;
        const filepath = path.join(__dirname, 'images', filename);
        
        console.log(`📥 Скачиваю: ${photo.description || queries[i]}`);
        console.log(`   Автор: ${photo.user.name}`);
        
        await downloadImage(photo.urls.regular, filepath);
        
        console.log(`✅ Сохранено: ${filename}\n`);
        
        // Сохраняем информацию об авторе для атрибуции
        fs.appendFileSync(
          path.join(__dirname, 'images', 'credits.txt'),
          `${filename}: Photo by ${photo.user.name} on Unsplash (${photo.user.links.html})\n`
        );
      }
    } catch (error) {
      console.log(`⚠️ Ошибка при поиске "${queries[i]}": ${error.message}\n`);
    }
    
    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ Все изображения загружены!');
}

main();
