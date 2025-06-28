const Rcon = require('rcon');
const config = require('./config.json');

console.log('Türkçe Karakter Test Başlatılıyor...');

const serverConfig = config.servers[1]; // Omega sunucusu (2. sunucu)
console.log(`Test sunucusu: ${serverConfig.name} (${serverConfig.host}:${serverConfig.port})`);

const rcon = new Rcon(serverConfig.host, serverConfig.port, serverConfig.password);

rcon.on('auth', () => {
    console.log('✓ RCON bağlantısı başarılı');
    
    console.log('\n--- Test Türkçe mesajı gönderiliyor ---');
    // Türkçe karakterler içeren test mesajı
    rcon.send('ServerChat TESTUSER: Türkçe çşğüöı karakterli mesaj');
    
    setTimeout(() => {
        console.log('\n--- GetChat ile mesajları alıyoruz ---');
        rcon.send('GetChat');
    }, 2000);
    
    setTimeout(() => {
        console.log('\n--- Tekrar GetChat ---');
        rcon.send('GetChat');
    }, 5000);
    
    setTimeout(() => {
        rcon.disconnect();
    }, 8000);
});

rcon.on('response', (str) => {
    console.log(`\nORIGINAL RESPONSE: "${str}"`);
    
    // Encoding testleri
    const iconv = require('iconv-lite');
    
    if (str.includes('??') || str.includes('?')) {
        console.log('--- Encoding denemesi ---');
        
        try {
            const buffer = Buffer.from(str, 'latin1');
            const decoded1 = iconv.decode(buffer, 'windows-1254');
            console.log(`Windows-1254: "${decoded1}"`);
            
            const decoded2 = iconv.decode(buffer, 'iso-8859-9');
            console.log(`ISO-8859-9: "${decoded2}"`);
            
            const buffer2 = Buffer.from(str, 'binary');
            const decoded3 = iconv.decode(buffer2, 'cp1254');
            console.log(`CP1254: "${decoded3}"`);
        } catch (e) {
            console.log('Encoding hatası:', e.message);
        }
    }
});

rcon.on('error', (err) => {
    console.error('RCON Hatası:', err.message);
});

rcon.on('end', () => {
    console.log('Test tamamlandı');
    process.exit(0);
});

rcon.connect();
