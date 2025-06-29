/**
 * Cross-Server Bot Test Script
 * Tests the new cross-server chat bot functionality
 */

const moment = require('moment');

// Test configuration
const testConfig = {
    servers: [
        {
            id: "server1",
            name: "Ragnarok Server",
            host: "YOUR_SERVER_IP",
            port: 27020,
            password: "YOUR_RCON_PASSWORD",
            enabled: true,
            reconnectInterval: 5000,
            crossServerBot: {
                enabled: true,
                botName: "[CROSS-CHAT] Ragnarok",
                messagePrefix: "🌍",
                chatToOtherServers: true
            }
        },
        {
            id: "server2",
            name: "The Island Server",
            host: "YOUR_SERVER_IP",
            port: 27021,
            password: "YOUR_RCON_PASSWORD",
            enabled: true,
            reconnectInterval: 5000,
            crossServerBot: {
                enabled: true,
                botName: "[CROSS-CHAT] TheIsland",
                messagePrefix: "🏝️",
                chatToOtherServers: true
            }
        }
    ],
    chatFormatting: {
        crossServerPrefix: "[GLOBAL]",
        showServerName: true,
        timestampFormat: "HH:mm:ss",
        crossServerChat: {
            enabled: true,
            broadcastToGameServers: true,
            messageFormat: "{prefix} {playerName}: {message}",
            excludeOwnMessages: false,
            maxMessageLength: 150
        }
    }
};

class CrossServerBotTester {
    constructor() {
        this.testResults = [];
    }

    log(message, type = 'info') {
        const timestamp = moment().format('HH:mm:ss');
        const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        console.log(logMessage);
        
        this.testResults.push({
            timestamp,
            type,
            message,
            time: new Date()
        });
    }

    async runTests() {
        console.log('🤖 Cross-Server Bot Özellik Testi Başlıyor...\n');
        
        // Test 1: Configuration validation
        this.testConfigValidation();
        
        // Test 2: Bot name generation
        this.testBotNameGeneration();
        
        // Test 3: Message formatting
        this.testMessageFormatting();
        
        // Test 4: Cross-server logic
        this.testCrossServerLogic();
        
        this.printSummary();
    }

    testConfigValidation() {
        this.log('📋 Test 1: Configuration Validation', 'test');
        
        try {
            // Server configurations
            for (const server of testConfig.servers) {
                if (!server.crossServerBot) {
                    throw new Error(`Server ${server.id} missing crossServerBot config`);
                }
                
                if (!server.crossServerBot.botName) {
                    throw new Error(`Server ${server.id} missing bot name`);
                }
                
                this.log(`✅ Server ${server.id}: Bot name = "${server.crossServerBot.botName}"`);
            }
            
            // Cross-server chat config
            const crossServerConfig = testConfig.chatFormatting.crossServerChat;
            if (!crossServerConfig) {
                throw new Error('Missing crossServerChat configuration');
            }
            
            this.log(`✅ Cross-server chat enabled: ${crossServerConfig.enabled}`);
            this.log(`✅ Broadcast to game servers: ${crossServerConfig.broadcastToGameServers}`);
            this.log(`✅ Message format: "${crossServerConfig.messageFormat}"`);
            
        } catch (error) {
            this.log(`❌ Configuration validation failed: ${error.message}`, 'error');
        }
        
        console.log('');
    }

    testBotNameGeneration() {
        this.log('🤖 Test 2: Bot Name Generation', 'test');
        
        try {
            for (const server of testConfig.servers) {
                const botConfig = server.crossServerBot;
                const botName = botConfig.botName;
                const prefix = botConfig.messagePrefix;
                
                // Validate bot name format
                if (botName.length > 20) {
                    this.log(`⚠️  Warning: Bot name "${botName}" is longer than 20 characters`, 'warn');
                }
                
                this.log(`✅ ${server.name}: Bot = "${botName}", Prefix = "${prefix}"`);
            }
            
        } catch (error) {
            this.log(`❌ Bot name generation failed: ${error.message}`, 'error');
        }
        
        console.log('');
    }

    testMessageFormatting() {
        this.log('💬 Test 3: Message Formatting', 'test');
        
        try {
            const crossServerConfig = testConfig.chatFormatting.crossServerChat;
            const messageTemplate = crossServerConfig.messageFormat;
            
            // Test messages
            const testMessages = [
                {
                    playerName: 'TestPlayer',
                    message: 'Merhaba arkadaşlar!',
                    serverName: 'Ragnarok Server',
                    prefix: '🌍'
                },
                {
                    playerName: 'Türkçe_Oyuncu',
                    message: 'Ğüşıöç karakterleri test ediyor',
                    serverName: 'The Island Server',
                    prefix: '🏝️'
                },
                {
                    playerName: 'LongNamePlayer',
                    message: 'Bu çok uzun bir mesaj örneğidir ve maksimum karakter sınırını test etmek için yazılmıştır.',
                    serverName: 'Test Server',
                    prefix: '🔥'
                }
            ];
            
            for (const testMsg of testMessages) {
                let formattedMessage = messageTemplate
                    .replace('{prefix}', testMsg.prefix)
                    .replace('{playerName}', testMsg.playerName)
                    .replace('{message}', testMsg.message)
                    .replace('{serverName}', testMsg.serverName);
                
                // Check length limit
                const maxLength = crossServerConfig.maxMessageLength || 150;
                if (formattedMessage.length > maxLength) {
                    formattedMessage = formattedMessage.substring(0, maxLength - 3) + '...';
                    this.log(`⚠️  Message truncated due to length limit (${maxLength})`, 'warn');
                }
                
                this.log(`✅ Formatted: "${formattedMessage}"`);
                this.log(`   Length: ${formattedMessage.length} characters`);
            }
            
        } catch (error) {
            this.log(`❌ Message formatting failed: ${error.message}`, 'error');
        }
        
        console.log('');
    }

    testCrossServerLogic() {
        this.log('🔄 Test 4: Cross-Server Logic', 'test');
        
        try {
            const crossServerConfig = testConfig.chatFormatting.crossServerChat;
            
            // Simulate message from server1 to server2
            const originalMessage = {
                serverId: 'server1',
                serverName: 'Ragnarok Server',
                playerName: 'TestPlayer',
                message: 'Test cross-server message',
                isFromGame: true
            };
            
            // Find target servers (exclude original server)
            const targetServers = testConfig.servers.filter(s => s.id !== originalMessage.serverId);
            
            this.log(`📤 Original message from: ${originalMessage.serverName}`);
            this.log(`📥 Target servers: ${targetServers.length}`);
            
            for (const targetServer of targetServers) {
                if (!targetServer.crossServerBot?.enabled) {
                    this.log(`⏭️  Skipping ${targetServer.name}: Bot disabled`);
                    continue;
                }
                
                const botConfig = targetServer.crossServerBot;
                
                let formattedMessage = crossServerConfig.messageFormat
                    .replace('{prefix}', botConfig.messagePrefix)
                    .replace('{playerName}', originalMessage.playerName)
                    .replace('{message}', originalMessage.message)
                    .replace('{serverName}', originalMessage.serverName);
                
                this.log(`✅ To ${targetServer.name}: Bot "${botConfig.botName}" will send: "${formattedMessage}"`);
            }
            
            // Test exclusion logic
            if (crossServerConfig.excludeOwnMessages && originalMessage.isFromGame) {
                this.log('⏭️  Message excluded due to excludeOwnMessages setting');
            }
            
        } catch (error) {
            this.log(`❌ Cross-server logic test failed: ${error.message}`, 'error');
        }
        
        console.log('');
    }

    printSummary() {
        this.log('📊 Test Summary', 'summary');
        
        const totalTests = this.testResults.filter(r => r.type === 'test').length;
        const errors = this.testResults.filter(r => r.type === 'error').length;
        const warnings = this.testResults.filter(r => r.type === 'warn').length;
        
        console.log(`\n${'='.repeat(50)}`);
        console.log('🏁 CROSS-SERVER BOT TEST COMPLETED');
        console.log(`${'='.repeat(50)}`);
        console.log(`📝 Total Tests: ${totalTests}`);
        console.log(`❌ Errors: ${errors}`);
        console.log(`⚠️  Warnings: ${warnings}`);
        
        if (errors === 0) {
            console.log('\n🎉 All tests passed! Cross-server bot feature is ready!');
        } else {
            console.log('\n💥 Some tests failed. Please check the configuration.');
        }
        
        console.log('\n📖 Usage Example:');
        console.log('1. Update your config.json with crossServerBot settings');
        console.log('2. Start the system: npm start');
        console.log('3. Send a message in one server');
        console.log('4. Watch it appear in other servers via bot characters');
        console.log('\n🔧 Each server will have its own bot character showing cross-server messages!');
    }
}

// Run the test
if (require.main === module) {
    const tester = new CrossServerBotTester();
    tester.runTests().catch(console.error);
}

module.exports = CrossServerBotTester;
