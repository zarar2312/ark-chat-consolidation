const Rcon = require('rcon');

// Chat test scripti
const testChatCommands = async (host, port, password) => {
    console.log(`🔧 Testing chat commands on ${host}:${port}`);
    
    const rcon = new Rcon(host, port, password);
    
    const commands = [
        'GetChat',
        'getchat', 
        'ServerChat',
        'Chat',
        'ListPlayers',
        'GetGameLog',
        'GetChatBuffer'
    ];
    
    rcon.on('auth', async () => {
        console.log('✅ RCON Authentication SUCCESS!');
        
        // Test each command
        for (const cmd of commands) {
            console.log(`\n🧪 Testing command: ${cmd}`);
            try {
                rcon.send(cmd);
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.log(`❌ Error with ${cmd}:`, error.message);
            }
        }
        
        // Send a test message
        console.log('\n📤 Sending test admin message...');
        rcon.send('ServerChat [TEST] Bu bir test mesajıdır!');
        
        setTimeout(() => {
            rcon.disconnect();
        }, 5000);
    });
    
    rcon.on('response', (str) => {
        console.log('📦 Response:', str);
    });
    
    rcon.on('error', (err) => {
        console.log('❌ RCON Error:', err.message);
    });
    
    rcon.on('end', () => {
        console.log('🔌 Connection ended');
    });
    
    try {
        rcon.connect();
    } catch (error) {
        console.log('💥 Connection failed:', error.message);
    }
};

// Test parametreleri - Kendi sunucu bilgilerinizi girin
const HOST = 'YOUR_SERVER_IP';        // Örnek: '192.168.1.100'
const PORT = YOUR_RCON_PORT;          // Örnek: 27020
const PASSWORD = 'YOUR_RCON_PASSWORD'; // Örnek: 'your_password'

if (HOST === 'YOUR_SERVER_IP' || PASSWORD === 'YOUR_RCON_PASSWORD') {
    console.log('⚠️  Test scriptini çalıştırmak için:');
    console.log('1. HOST, PORT ve PASSWORD değişkenlerini güncelleyin');
    console.log('2. Kendi sunucu bilgilerinizi girin');
    console.log('3. Scripti tekrar çalıştırın');
    console.log('\n💡 Örnek değerler:');
    console.log('   HOST = "192.168.1.100"');
    console.log('   PORT = 27020');
    console.log('   PASSWORD = "your_rcon_password"');
    process.exit(1);
}

testChatCommands(HOST, PORT, PASSWORD);
