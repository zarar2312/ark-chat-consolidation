const Rcon = require('rcon');

// RCON bağlantısı test scripti
const testRcon = async (host, port, password) => {
    console.log(`Testing RCON connection to ${host}:${port}`);
    
    const rcon = new Rcon(host, port, password);
    
    rcon.on('auth', () => {
        console.log('✅ RCON Authentication SUCCESS!');
        rcon.send('ListPlayers');
    });
    
    rcon.on('response', (str) => {
        console.log('📦 Server Response:', str);
    });
    
    rcon.on('error', (err) => {
        console.log('❌ RCON Error:', err.message);
    });
    
    rcon.on('end', () => {
        console.log('🔌 Connection ended');
    });
    
    try {
        rcon.connect();
        
        // 10 saniye sonra kapat
        setTimeout(() => {
            rcon.disconnect();
        }, 10000);
        
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

console.log('🔧 RCON Connection Test Starting...');
console.log(`Host: ${HOST}`);
console.log(`Port: ${PORT}`);
console.log(`Password: ${PASSWORD}`);
console.log('-----------------------------------');

testRcon(HOST, PORT, PASSWORD);
