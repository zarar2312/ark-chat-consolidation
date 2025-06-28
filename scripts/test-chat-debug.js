const Rcon = require('rcon');
const config = require('./config.json');

console.log('Chat Debug Test Başlatılıyor...');

// İlk sunucuyu test et
const serverConfig = config.servers[0];
console.log(`Test sunucusu: ${serverConfig.name} (${serverConfig.host}:${serverConfig.port})`);

const rcon = new Rcon(serverConfig.host, serverConfig.port, serverConfig.password);

rcon.on('auth', () => {
    console.log('✓ RCON bağlantısı başarılı');
    
    // Farklı chat komutlarını test et
    const commands = [
        'GetChat',
        'ServerChat',
        'getchat',
        'serverchat',
        'ListPlayers'
    ];
    
    let commandIndex = 0;
    
    const testNextCommand = () => {
        if (commandIndex < commands.length) {
            const command = commands[commandIndex];
            console.log(`\n--- ${command} komutu gönderiliyor ---`);
            rcon.send(command);
            commandIndex++;
            setTimeout(testNextCommand, 3000);
        } else {
            console.log('\n--- Tüm komutlar test edildi ---');
            rcon.disconnect();
        }
    };
    
    setTimeout(testNextCommand, 2000);
});

rcon.on('response', (str) => {
    console.log(`RESPONSE: "${str}"`);
    console.log(`LENGTH: ${str.length}`);
    console.log(`INCLUDES ":": ${str.includes(':')}`);
    
    // Chat pattern testleri
    const patterns = [
        { name: 'Format 1', regex: /\[(\d{2}:\d{2}:\d{2})\] (.+?): (.+)/ },
        { name: 'Format 2', regex: /^(.+?): (.+)$/m },
        { name: 'Format 3', regex: /<(.+?)> (.+)/ },
        { name: 'Format 4', regex: /\((.+?)\) (.+?): (.+)/ },
        { name: 'Format 5', regex: /Chat: (.+?): (.+)/ },
        { name: 'Format 6', regex: /ServerChat (.+?): (.+)/ },
        { name: 'Format 7', regex: /^([A-Za-z0-9_]+)\s+(.+)$/m },
        { name: 'Format 8', regex: /Global\s+(.+?)\s*:\s*(.+)/i },
        { name: 'Format 9', regex: /Tribe\s+(.+?)\s*:\s*(.+)/i }
    ];
    
    patterns.forEach(pattern => {
        const match = str.match(pattern.regex);
        if (match) {
            console.log(`✓ ${pattern.name} MATCH:`, match);
        }
    });
    
    console.log('---');
});

rcon.on('error', (err) => {
    console.error('RCON Hatası:', err.message);
});

rcon.on('end', () => {
    console.log('RCON bağlantısı kapandı');
    process.exit(0);
});

rcon.connect();

// 30 saniye sonra otomatik kapat
setTimeout(() => {
    console.log('\nTest tamamlandı, bağlantı kapatılıyor...');
    rcon.disconnect();
}, 30000);
