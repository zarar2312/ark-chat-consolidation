const Rcon = require('rcon');
const config = require('./config.json');

console.log('Manual Chat Test Başlatılıyor...');

const serverConfig = config.servers[0];
console.log(`Test sunucusu: ${serverConfig.name} (${serverConfig.host}:${serverConfig.port})`);

const rcon = new Rcon(serverConfig.host, serverConfig.port, serverConfig.password);

rcon.on('auth', () => {
    console.log('✓ RCON bağlantısı başarılı');
    
    console.log('\n--- Test chat mesajı gönderiliyor ---');
    // Global chat mesajı gönder
    rcon.send('ServerChat TEST: Bu bir test mesajıdır');
    
    setTimeout(() => {
        console.log('\n--- GetChat komutu ile mesajları alıyoruz ---');
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
    console.log(`\nRESPONSE: "${str}"`);
    
    // Chat pattern testleri
    const patterns = [
        { name: 'Format 1', regex: /\[(\d{2}:\d{2}:\d{2})\] (.+?): (.+)/ },
        { name: 'Format 2', regex: /^(.+?): (.+)$/m },
        { name: 'Format 3', regex: /<(.+?)> (.+)/ },
        { name: 'Format 4', regex: /\((.+?)\) (.+?): (.+)/ },
        { name: 'Format 5', regex: /Chat: (.+?): (.+)/ },
        { name: 'Format 6', regex: /ServerChat (.+?): (.+)/ }
    ];
    
    patterns.forEach(pattern => {
        const match = str.match(pattern.regex);
        if (match) {
            console.log(`✓ ${pattern.name} MATCH:`, match);
        }
    });
});

rcon.on('error', (err) => {
    console.error('RCON Hatası:', err.message);
});

rcon.on('end', () => {
    console.log('Test tamamlandı');
    process.exit(0);
});

rcon.connect();
