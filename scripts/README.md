# Test Scripts

Bu klasör, Ark Cross-Server Chat uygulamasının geliştirilmesi sırasında kullanılan test scriptlerini içerir.

## 📋 Script Açıklamaları

### `test-rcon.js`
- Temel RCON bağlantı testi
- Sunucu durumu kontrolü
- Basit komut gönderme testi

### `test-rcon-advanced.js`
- Gelişmiş RCON test senaryoları
- Çoklu sunucu bağlantı testi
- Hata yakalama ve reconnection testleri

### `test-chat.js`
- Chat mesajı gönderme/alma testi
- Mesaj formatı kontrolü
- Cross-server mesaj broadcast testi

### `test-chat-debug.js`
- Debug modunda chat testleri
- Ayrıntılı log çıktıları
- Sorun giderme için detaylı bilgiler

### `test-manual-chat.js`
- Manuel chat mesajı gönderme
- Gerçek sunucu ortamında test
- Oyuncu etkileşim simülasyonu

### `test-turkish-chars.js`
- Türkçe karakter desteği testi
- Encoding/decoding kontrolü
- Özel karakter uyumluluğu

## 🚀 Kullanım

Bu scriptler geliştirme aşamasında test amaçlı kullanılmıştır. Production ortamında çalıştırılması önerilmez.

### ⚙️ Konfigürasyon

Scriptleri çalıştırmadan önce:

1. **config.json tabanlı scriptler için:**
   ```bash
   cp config.example.json config.json
   # config.json'u kendi sunucu bilgilerinizle güncelleyin
   ```

2. **Standalone scriptler için:**
   - Script dosyasını açın
   - `YOUR_SERVER_IP`, `YOUR_RCON_PORT`, `YOUR_RCON_PASSWORD` değerlerini güncelleyin

### 📋 Test Komutları

```bash
# Temel RCON testi (konfigürasyon gerekli)
node scripts/test-rcon.js

# Chat sistemi testi (konfigürasyon gerekli)
node scripts/test-chat.js

# Türkçe karakter testi (config.json gerekli)
node scripts/test-turkish-chars.js

# Gelişmiş RCON testi (konfigürasyon gerekli)
node scripts/test-rcon-advanced.js

# Debug chat testi (config.json gerekli)
node scripts/test-chat-debug.js

# Manuel chat testi (config.json gerekli)
node scripts/test-manual-chat.js
```

## ⚠️ Uyarı

Bu scriptler development ortamında test amaçlı kullanılmak üzere tasarlanmıştır. Production sunucularında dikkatli kullanın.
