const Rcon = require('rcon');
const moment = require('moment');
const EventEmitter = require('events');
const iconv = require('iconv-lite'); // Encoding dönüştürücü

class ArkServer extends EventEmitter {
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger;
        this.rcon = null;
        this.connected = false;
        this.reconnectTimer = null;
        this.lastMessageTime = Date.now();
        this.playerList = [];
        this.recentMessages = new Set(); // Son mesajları takip et (spam önlemi)
        this.stats = {
            messagesReceived: 0,
            messagesSent: 0,
            connectionAttempts: 0,
            lastConnected: null,
            uptime: 0
        };
    }

    async connect() {
        try {
            this.stats.connectionAttempts++;
            this.logger.info(`${this.config.name} sunucusuna bağlanılıyor... (${this.config.host}:${this.config.port})`);
            
            this.rcon = new Rcon(this.config.host, this.config.port, this.config.password);
            
            this.rcon.on('auth', () => {
                this.connected = true;
                this.stats.lastConnected = new Date();
                this.logger.success(`${this.config.name} sunucusuna başarıyla bağlanıldı`);
                this.emit('connected', this.config.id);
                this.startMessagePolling();
                
                // İlk oyuncu listesini hemen çek
                setTimeout(() => {
                    if (this.connected) {
                        this.rcon.send('ListPlayers');
                    }
                }, 2000);
            });

            this.rcon.on('response', (str) => {
                this.handleResponse(str);
            });

            this.rcon.on('error', (err) => {
                this.logger.error(`${this.config.name} RCON hatası:`, err.message);
                this.handleDisconnection();
            });

            this.rcon.on('end', () => {
                this.logger.warn(`${this.config.name} bağlantısı kesildi`);
                this.handleDisconnection();
            });

            // Bağlantı eventi ekle
            this.rcon.on('connect', () => {
                this.logger.info(`${this.config.name} - TCP bağlantısı kuruldu`);
            });

            this.rcon.connect();

            // Timeout ekle - eğer 10 saniye içinde auth gelmezse manuel olarak ayarla
            setTimeout(() => {
                if (!this.connected && this.rcon) {
                    this.logger.warn(`${this.config.name} - Auth timeout, manuel bağlantı ayarlanıyor`);
                    this.connected = true;
                    this.stats.lastConnected = new Date();
                    this.emit('connected', this.config.id);
                    this.startMessagePolling();
                }
            }, 10000);

        } catch (error) {
            this.logger.error(`${this.config.name} bağlantı hatası:`, error.message);
            this.handleDisconnection();
        }
    }

    handleResponse(response) {
        if (!response || response.trim() === '') return;
        
        // Encoding düzeltmesi - birden fazla yöntem dene
        let originalResponse = response;
        try {
            // Eğer response'da ? karakteri varsa encoding sorunu olabilir
            if (response.includes('??') || response.includes('?')) {
                // Yöntem 1: Windows-1254 (Türkçe) encoding
                try {
                    const buffer = Buffer.from(response, 'latin1');
                    const decoded = iconv.decode(buffer, 'windows-1254');
                    if (!decoded.includes('??')) {
                        response = decoded;
                        this.logger.debug(`${this.config.name} - Encoding düzeltildi (windows-1254): "${originalResponse}" -> "${response}"`);
                    }
                } catch (e) {}
                
                // Yöntem 2: ISO-8859-9 (Türkçe)
                if (response.includes('??')) {
                    try {
                        const buffer = Buffer.from(originalResponse, 'latin1');
                        const decoded = iconv.decode(buffer, 'iso-8859-9');
                        if (!decoded.includes('??')) {
                            response = decoded;
                            this.logger.debug(`${this.config.name} - Encoding düzeltildi (iso-8859-9): "${originalResponse}" -> "${response}"`);
                        }
                    } catch (e) {}
                }
                
                // Yöntem 3: CP1254 (Türkçe Windows)
                if (response.includes('??')) {
                    try {
                        const buffer = Buffer.from(originalResponse, 'binary');
                        const decoded = iconv.decode(buffer, 'cp1254');
                        if (!decoded.includes('??')) {
                            response = decoded;
                            this.logger.debug(`${this.config.name} - Encoding düzeltildi (cp1254): "${originalResponse}" -> "${response}"`);
                        }
                    } catch (e) {}
                }
            }
        } catch (error) {
            this.logger.debug(`${this.config.name} - Encoding düzeltme hatası:`, error.message);
        }
        
        // Gereksiz yanıtları filtrele
        const filteredResponses = [
            'Server received, But no response!!',
            'Bad or missing property',
            'ServerChat',
            'GetChat'
        ];
        
        // Kendi gönderdiğimiz ServerChat mesajlarını filtrele (spam önlemi)
        if (response.includes('ServerChat [GLOBAL]') || response.includes('ServerChat ADMIN')) {
            return;
        }
        
        if (filteredResponses.some(filter => response.includes(filter))) {
            // Filtered response logunu kaldırdık - spam yapıyor
            return;
        }
        
        // Sadece önemli RCON response'ları logla
        if (response.includes(':') || response.includes('Players') || response.length < 100) {
            this.logger.debug(`${this.config.name} - RCON Response: ${response}`);
        }

        // Chat mesajları için pattern matching - birden fazla format dene
        let chatMessage = null;
        
        // Format 1: [HH:MM:SS] PlayerName: Message
        const chatPattern1 = /\[(\d{2}:\d{2}:\d{2})\] (.+?): (.+)/;
        const match1 = response.match(chatPattern1);
        
        // Format 2: PlayerName: Message (zaman damgası yok)
        const chatPattern2 = /^(.+?): (.+)$/m;
        const match2 = response.match(chatPattern2);
        
        // Format 3: <PlayerName> Message
        const chatPattern3 = /<(.+?)> (.+)/;
        const match3 = response.match(chatPattern3);
        
        // Format 4: (Tribe Name) PlayerName: Message
        const chatPattern4 = /\((.+?)\) (.+?): (.+)/;
        const match4 = response.match(chatPattern4);
        
        // Format 5: Chat mesajları için gelen response'larda "Chat:" prefix'i olabilir
        const chatPattern5 = /Chat: (.+?): (.+)/;
        const match5 = response.match(chatPattern5);
        
        // Format 6: ServerChat komutundan gelen mesajlar
        const chatPattern6 = /ServerChat (.+?): (.+)/;
        const match6 = response.match(chatPattern6);
        
        // Format 7: Basit format - sadece isim ve mesaj
        const chatPattern7 = /^([A-Za-z0-9_]+)\s+(.+)$/m;
        const match7 = response.match(chatPattern7);
        
        // Format 8: Global chat formatı
        const chatPattern8 = /Global\s+(.+?)\s*:\s*(.+)/i;
        const match8 = response.match(chatPattern8);
        
        // Format 9: Tribe chat formatı
        const chatPattern9 = /Tribe\s+(.+?)\s*:\s*(.+)/i;
        const match9 = response.match(chatPattern9);

        // Debug: Hangi pattern'ların match ettiğini göster (sadece chat mesajı varsa)
        if (response.includes(':') && response.length < 200) {
            this.logger.debug(`${this.config.name} - Pattern matches: 1:${!!match1} 2:${!!match2} 3:${!!match3} 4:${!!match4} 5:${!!match5} 6:${!!match6} 7:${!!match7} 8:${!!match8} 9:${!!match9}`);
        }

        if (match1) {
            const [, time, playerName, message] = match1;
            const cleanedPlayerName = this.cleanPlayerName(playerName);
            this.logger.info(`${this.config.name} - Chat Format 1: [${time}] ${cleanedPlayerName}: ${message}`);
            chatMessage = {
                id: `${this.config.id}_${Date.now()}_${Math.random()}`,
                serverId: this.config.id,
                serverName: this.config.name,
                playerName: cleanedPlayerName,
                message: message,
                timestamp: new Date(),
                time: time,
                isFromGame: true // Oyun içinden gelen mesaj işareti
            };
        } else if (match2 && !response.includes('Server received') && !response.includes('No Players')) {
            const [, playerName, message] = match2;
            const cleanedPlayerName = this.cleanPlayerName(playerName);
            this.logger.info(`${this.config.name} - Chat Format 2: ${cleanedPlayerName}: ${message}`);
            chatMessage = {
                id: `${this.config.id}_${Date.now()}_${Math.random()}`,
                serverId: this.config.id,
                serverName: this.config.name,
                playerName: cleanedPlayerName,
                message: message,
                timestamp: new Date(),
                time: new Date().toTimeString().substring(0, 8),
                isFromGame: true // Oyun içinden gelen mesaj işareti
            };
        } else if (match3) {
            const [, playerName, message] = match3;
            const cleanedPlayerName = this.cleanPlayerName(playerName);
            this.logger.info(`${this.config.name} - Chat Format 3: <${cleanedPlayerName}> ${message}`);
            chatMessage = {
                id: `${this.config.id}_${Date.now()}_${Math.random()}`,
                serverId: this.config.id,
                serverName: this.config.name,
                playerName: cleanedPlayerName,
                message: message,
                timestamp: new Date(),
                time: new Date().toTimeString().substring(0, 8),
                isFromGame: true // Oyun içinden gelen mesaj işareti
            };
        } else if (match4) {
            const [, tribeName, playerName, message] = match4;
            const cleanedPlayerName = this.cleanPlayerName(playerName);
            const cleanedTribeName = this.cleanPlayerName(tribeName);
            this.logger.info(`${this.config.name} - Chat Format 4: (${cleanedTribeName}) ${cleanedPlayerName}: ${message}`);
            chatMessage = {
                id: `${this.config.id}_${Date.now()}_${Math.random()}`,
                serverId: this.config.id,
                serverName: this.config.name,
                playerName: `${cleanedPlayerName} (${cleanedTribeName})`,
                message: message,
                timestamp: new Date(),
                time: new Date().toTimeString().substring(0, 8),
                isFromGame: true // Oyun içinden gelen mesaj işareti
            };
        } else if (match5) {
            const [, playerName, message] = match5;
            const cleanedPlayerName = this.cleanPlayerName(playerName);
            this.logger.info(`${this.config.name} - Chat Format 5: Chat: ${cleanedPlayerName}: ${message}`);
            chatMessage = {
                id: `${this.config.id}_${Date.now()}_${Math.random()}`,
                serverId: this.config.id,
                serverName: this.config.name,
                playerName: cleanedPlayerName,
                message: message,
                timestamp: new Date(),
                time: new Date().toTimeString().substring(0, 8),
                isFromGame: true // Oyun içinden gelen mesaj işareti
            };
        } else if (match6) {
            const [, playerName, message] = match6;
            
            // Eğer mesajda [GLOBAL] veya sunucu adı geçiyorsa, bizim broadcast ettiğimiz mesajdır
            if (playerName.includes('[GLOBAL]') || 
                playerName.includes('[') ||
                playerName === 'ADMIN' ||
                message.includes('[GLOBAL]')) {
                
                this.logger.debug(`${this.config.name} - Filtered broadcast message: ${playerName}: ${message}`);
                return; // Bu mesajı işleme, bizim broadcast ettiğimiz
            }
            
            const cleanedPlayerName = this.cleanPlayerName(playerName);
            this.logger.info(`${this.config.name} - Chat Format 6: ServerChat ${cleanedPlayerName}: ${message}`);
            chatMessage = {
                id: `${this.config.id}_${Date.now()}_${Math.random()}`,
                serverId: this.config.id,
                serverName: this.config.name,
                playerName: cleanedPlayerName,
                message: message,
                timestamp: new Date(),
                time: new Date().toTimeString().substring(0, 8),
                isFromGame: true // Oyun içinden gelen mesaj işareti
            };
        } else if (match7 && !response.includes('Server received') && !response.includes('No Players') && !response.includes('Players in server') && response.length < 200) {
            const [, playerName, message] = match7;
            const cleanedPlayerName = this.cleanPlayerName(playerName);
            this.logger.info(`${this.config.name} - Chat Format 7: ${cleanedPlayerName} ${message}`);
            chatMessage = {
                id: `${this.config.id}_${Date.now()}_${Math.random()}`,
                serverId: this.config.id,
                serverName: this.config.name,
                playerName: cleanedPlayerName,
                message: message,
                timestamp: new Date(),
                time: new Date().toTimeString().substring(0, 8),
                isFromGame: true // Oyun içinden gelen mesaj işareti
            };
        } else if (match8) {
            const [, playerName, message] = match8;
            const cleanedPlayerName = this.cleanPlayerName(playerName);
            this.logger.info(`${this.config.name} - Chat Format 8: Global ${cleanedPlayerName}: ${message}`);
            chatMessage = {
                id: `${this.config.id}_${Date.now()}_${Math.random()}`,
                serverId: this.config.id,
                serverName: this.config.name,
                playerName: cleanedPlayerName,
                message: message,
                timestamp: new Date(),
                time: new Date().toTimeString().substring(0, 8),
                isFromGame: true // Oyun içinden gelen mesaj işareti
            };
        } else if (match9) {
            const [, playerName, message] = match9;
            const cleanedPlayerName = this.cleanPlayerName(playerName);
            this.logger.info(`${this.config.name} - Chat Format 9: Tribe ${cleanedPlayerName}: ${message}`);
            chatMessage = {
                id: `${this.config.id}_${Date.now()}_${Math.random()}`,
                serverId: this.config.id,
                serverName: this.config.name,
                playerName: cleanedPlayerName,
                message: message,
                timestamp: new Date(),
                time: new Date().toTimeString().substring(0, 8),
                isFromGame: true // Oyun içinden gelen mesaj işareti
            };
        }

        // Eğer hiçbir pattern match etmezse ve response chat mesajı gibi görünüyorsa log at
        if (!chatMessage && response.length > 5 && response.length < 500 && 
            !response.includes('Server received') && 
            !response.includes('No Players') && 
            !response.includes('Players in server') &&
            !response.includes('ListPlayers') &&
            response.includes(':')) {
            this.logger.warn(`${this.config.name} - Unmatched potential chat: "${response}"`);
        }

        if (chatMessage) {
            // Spam önlemi: Aynı mesajın tekrar işlenmesini engelle
            const messageSignature = `${chatMessage.playerName}:${chatMessage.message}:${Math.floor(Date.now() / 5000)}`; // 5 saniye window
            
            if (this.recentMessages.has(messageSignature)) {
                this.logger.debug(`${this.config.name} - Duplicate message filtered: ${messageSignature}`);
                return;
            }
            
            this.recentMessages.add(messageSignature);
            
            // Set'i temiz tut (max 50 mesaj)
            if (this.recentMessages.size > 50) {
                const oldMessages = Array.from(this.recentMessages).slice(0, 10);
                oldMessages.forEach(msg => this.recentMessages.delete(msg));
            }
            
            this.stats.messagesReceived++;
            this.lastMessageTime = Date.now();
            this.emit('chatMessage', chatMessage);
        }

        // Oyuncu listesi için kontrol - farklı formatları destekle
        if (response.includes('Players in server:') || 
            response.includes('No Players Connected') || 
            response.includes('. ')) { // Basit kontrol: "0. " içeriyorsa oyuncu listesidir
            this.parsePlayerList(response);
        }
    }

    parsePlayerList(response) {
        // Oyuncu listesini parse et
        // Debug logunu kaldırdık - spam yapıyor
        
        // Eğer hiç oyuncu yoksa
        if (response.includes('No Players Connected')) {
            this.playerList = [];
            this.logger.debug(`${this.config.name} - No players connected`);
            this.emit('playerListUpdated', this.config.id, this.playerList);
            return;
        }
        
        const lines = response.split('\n');
        this.playerList = [];
        
        for (const line of lines) {
            // Farklı format desteği: "0. PlayerName, SteamID" veya "0. PlayerName, steamid=SteamID"
            const playerMatch = line.match(/(\d+)\. (.+), (steamid=)?(\d+)/);
            if (playerMatch) {
                const rawPlayerName = playerMatch[2].trim();
                const cleanedPlayerName = this.cleanPlayerName(rawPlayerName);
                const player = {
                    name: cleanedPlayerName,
                    steamId: playerMatch[4]
                };
                this.playerList.push(player);
                // Debug logunu kaldırdık - spam yapıyor
            }
        }
        
        // Sadece oyuncu sayısı değiştiğinde logla
        this.logger.debug(`${this.config.name} - ${this.playerList.length} oyuncu bulundu`);
        this.emit('playerListUpdated', this.config.id, this.playerList);
    }

    // Oyuncu adını temizle ve düzelt
    cleanPlayerName(playerName) {
        if (!playerName) return 'Unknown';
        
        // Yaygın karakter değişimlerini düzelt - Regex güvenli şekilde
        const charMap = {
            'Ã§': 'ç', 'Ã¶': 'ö', 'Ã¼': 'ü', 'ÄŸ': 'ğ', 'Å': 'ş', 'Ä±': 'ı',
            'Ç': 'Ç', 'Ö': 'Ö', 'Ü': 'Ü', 'Ğ': 'Ğ', 'Ş': 'Ş', 'İ': 'İ'
        };
        
        let cleaned = playerName;
        
        // Güvenli karakter değişimi - regex escape gerektirmeyen karakterler
        for (const [wrong, correct] of Object.entries(charMap)) {
            cleaned = cleaned.split(wrong).join(correct);
        }
        
        // ?? ve ? karakterlerini temizle (regex kullanmadan)
        cleaned = cleaned.split('??').join('');
        cleaned = cleaned.split('?').join('');
        
        // Başında/sonunda boşluk temizle
        cleaned = cleaned.trim();
        
        // Eğer hala sorunlu karakterler varsa, ASCII olmayan karakterleri temizle
        if (cleaned.match(/[^\x20-\x7E\u00C0-\u017F]/)) {
            // Türkçe karakterleri koru, diğerlerini temizle
            cleaned = cleaned.replace(/[^\w\sçğıöşüÇĞIÖŞÜ\(\)\[\]\-\.]/g, '');
        }
        
        return cleaned || 'Unknown';
    }

    async sendChatMessage(message, playerName = 'GLOBAL') {
        if (!this.connected || !this.rcon) {
            this.logger.warn(`${this.config.name} - Mesaj gönderilemedi: Bağlantı yok`);
            return false;
        }

        try {
            const formattedMessage = `ServerChat [GLOBAL] ${playerName}: ${message}`;
            this.rcon.send(formattedMessage);
            this.stats.messagesSent++;
            // Debug logunu kaldırdık - spam yapıyor
            return true;
        } catch (error) {
            this.logger.error(`${this.config.name} - Mesaj gönderme hatası:`, error.message);
            return false;
        }
    }

    async sendCommand(command) {
        if (!this.connected || !this.rcon) {
            throw new Error('Sunucuya bağlı değil');
        }

        try {
            this.rcon.send(command);
            // Debug logunu kaldırdık - spam yapıyor
            return 'Komut gönderildi';
        } catch (error) {
            this.logger.error(`${this.config.name} - Komut hatası:`, error.message);
            throw error;
        }
    }

    async getPlayerList() {
        try {
            this.rcon.send('ListPlayers');
            return this.playerList;
        } catch (error) {
            this.logger.error(`${this.config.name} - Oyuncu listesi alınamadı:`, error.message);
            return [];
        }
    }

    startMessagePolling() {
        // Chat mesajlarını dinlemek için periyodik olarak GetChat komutunu gönder
        this.pollInterval = setInterval(async () => {
            if (this.connected) {
                try {
                    this.rcon.send('GetChat');
                    // Debug logunu kaldırdık - çok spam yapıyor
                } catch (error) {
                    this.logger.error(`${this.config.name} - Polling hatası:`, error.message);
                }
            }
        }, 2000); // 2 saniyede bir chat kontrol et

        // Oyuncu listesini periyodik olarak güncelle
        this.playerPollInterval = setInterval(async () => {
            if (this.connected) {
                try {
                    this.rcon.send('ListPlayers');
                } catch (error) {
                    // Sessizce devam et
                }
            }
        }, 30000); // 30 saniyede bir oyuncu listesini güncelle
    }

    stopMessagePolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        
        if (this.playerPollInterval) {
            clearInterval(this.playerPollInterval);
            this.playerPollInterval = null;
        }
    }

    handleDisconnection() {
        this.connected = false;
        this.stopMessagePolling();
        this.emit('disconnected', this.config.id);
        
        if (this.config.enabled) {
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        const delay = this.config.reconnectInterval || 5000;
        this.logger.info(`${this.config.name} - ${delay}ms sonra yeniden bağlanılacak`);
        
        this.reconnectTimer = setTimeout(() => {
            if (this.config.enabled) {
                this.connect();
            }
        }, delay);
    }

    async disconnect() {
        this.config.enabled = false;
        this.stopMessagePolling();
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.rcon) {
            try {
                this.rcon.disconnect();
            } catch (error) {
                // Sessizce kapat
            }
            this.rcon = null;
        }
        
        this.connected = false;
        this.logger.info(`${this.config.name} bağlantısı kapatıldı`);
    }

    getStats() {
        return {
            ...this.stats,
            connected: this.connected,
            playerCount: this.playerList.length,
            uptime: this.stats.lastConnected ? Date.now() - this.stats.lastConnected.getTime() : 0
        };
    }

    isConnected() {
        return this.connected;
    }
}

module.exports = ArkServer;
