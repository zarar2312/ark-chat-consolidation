/**
 * Manual Test Message Sender
 * Web interface'den mesaj göndermeyi test eder
 */

const io = require('socket.io-client');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class WebMessageTester {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    async connect() {
        console.log('🔌 Socket.IO sunucusuna bağlanıyor...');
        
        this.socket = io('http://localhost:3000');
        
        this.socket.on('connect', () => {
            console.log('✅ Socket.IO bağlantısı kuruldu!');
            console.log(`📡 Socket ID: ${this.socket.id}`);
            this.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Socket.IO bağlantısı kesildi');
            this.connected = false;
        });

        this.socket.on('newChatMessage', (message) => {
            console.log('\n📨 Yeni mesaj alındı:');
            console.log(`   🏷️  Server: ${message.serverName}`);
            console.log(`   👤 Player: ${message.playerName}`);
            console.log(`   💬 Message: ${message.message}`);
            console.log(`   ⏰ Time: ${message.time}`);
            console.log(`   🌐 From Game: ${message.isFromGame ? 'Yes' : 'No'}`);
        });

        this.socket.on('messageError', (data) => {
            console.log(`❌ Mesaj hatası: ${data.error}`);
        });

        // Bağlantı kurulmasını bekle
        await new Promise((resolve) => {
            this.socket.on('connect', resolve);
        });
    }

    async sendTestMessage(message, playerName = 'Test User') {
        if (!this.connected) {
            console.log('❌ Socket bağlantısı yok!');
            return;
        }

        console.log(`\n📤 Mesaj gönderiliyor...`);
        console.log(`   👤 Player: ${playerName}`);
        console.log(`   💬 Message: ${message}`);
        
        this.socket.emit('sendMessage', {
            message: message,
            playerName: playerName
        });
    }

    async runInteractiveTest() {
        console.log('\n🎮 Interaktif Test Modu');
        console.log('💡 Komutlar:');
        console.log('   - /name <isim>     : Oyuncu adını değiştir');
        console.log('   - /quit           : Çıkış');
        console.log('   - Diğer mesajlar  : Chat mesajı olarak gönderilir');
        console.log('');

        let currentPlayerName = 'Test User';

        const askQuestion = () => {
            rl.question(`[${currentPlayerName}] Mesaj: `, async (input) => {
                if (input.startsWith('/name ')) {
                    currentPlayerName = input.substring(6).trim() || 'Test User';
                    console.log(`✅ Oyuncu adı değiştirildi: ${currentPlayerName}`);
                } else if (input === '/quit') {
                    console.log('👋 Test sonlandırılıyor...');
                    this.socket.disconnect();
                    rl.close();
                    return;
                } else if (input.trim()) {
                    await this.sendTestMessage(input.trim(), currentPlayerName);
                }
                
                setTimeout(askQuestion, 100);
            });
        };

        askQuestion();
    }
}

async function main() {
    const tester = new WebMessageTester();
    
    try {
        await tester.connect();
        
        // Otomatik test mesajları
        console.log('\n🧪 Otomatik test mesajları gönderiliyor...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await tester.sendTestMessage('Merhaba Cross-Server Chat!', 'TestBot');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        await tester.sendTestMessage('Türkçe karakter testi: ğüşıöç ĞÜŞIÖÇ', 'TürkçeTest');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        await tester.sendTestMessage('Cross-server bot sistemi çalışıyor mu?', 'SystemTester');
        
        console.log('\n✅ Otomatik testler tamamlandı!');
        console.log('📊 Şimdi web arayüzünü kontrol edin: http://localhost:3000');
        
        // Interaktif mod
        await tester.runInteractiveTest();
        
    } catch (error) {
        console.error('❌ Test sırasında hata:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = WebMessageTester;
