const Rcon = require('rcon');

// Gelişmiş RCON test scripti
const testRconCommands = async (host, port, password) => {
    console.log(`🎮 RCON Komut Testi Başlıyor...`);
    console.log(`Host: ${host}:${port}`);
    console.log('=====================================\n');
    
    const rcon = new Rcon(host, port, password);
    
    const commands = [
        'ListPlayers',
        'GetGameLog',
        'GetServerInfo',
        'SaveWorld'
    ];
    
    let commandIndex = 0;
    
    rcon.on('auth', () => {
        console.log('✅ RCON Authentication SUCCESS!\n');
        
        // Komutları sırayla gönder
        const sendNextCommand = () => {
            if (commandIndex < commands.length) {
                const cmd = commands[commandIndex];
                console.log(`📤 Komut gönderiliyor: ${cmd}`);
                rcon.send(cmd);
                commandIndex++;
                
                // 2 saniye sonra sonraki komutu gönder
                setTimeout(sendNextCommand, 2000);
            } else {
                // Tüm komutlar gönderildi, bağlantıyı kapat
                setTimeout(() => {
                    console.log('\n🔌 Test tamamlandı, bağlantı kapatılıyor...');
                    rcon.disconnect();
                }, 2000);
            }
        };
        
        sendNextCommand();
    });
    
    rcon.on('response', (str) => {
        console.log('📦 Sunucu Yanıtı:');
        console.log('─'.repeat(40));
        console.log(str || 'Boş yanıt');
        console.log('─'.repeat(40) + '\n');
    });
    
    rcon.on('error', (err) => {
        console.log('❌ RCON Hatası:', err.message);
    });
    
    rcon.on('end', () => {
        console.log('🏁 Test tamamlandı!');
        process.exit(0);
    });
    
    try {
        rcon.connect();
    } catch (error) {
        console.log('💥 Bağlantı hatası:', error.message);
        process.exit(1);
    }
};

// Test başlat - Kendi sunucu bilgilerinizi girin
// testRconCommands('YOUR_SERVER_IP', YOUR_RCON_PORT, 'YOUR_RCON_PASSWORD');

// Örnek kullanım:
// testRconCommands('192.168.1.100', 27020, 'your_password');

console.log('⚠️  Bu test scriptini çalıştırmak için:');
console.log('1. Yukarıdaki satırları uncomment edin');
console.log('2. YOUR_SERVER_IP, YOUR_RCON_PORT ve YOUR_RCON_PASSWORD değerlerini güncelleyin');
console.log('3. Scripti tekrar çalıştırın');
console.log('\n💡 Örnek: testRconCommands("192.168.1.100", 27020, "your_password");');
