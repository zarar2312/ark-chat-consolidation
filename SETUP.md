# Ark Cross-Server Chat - Kurulum Rehberi

## 🎯 Genel Bakış

Bu sistem, birden fazla Ark Survival Evolved sunucusunun chatlarını ortak hale getirir. Oyuncular farklı sunucularda olsalar bile birbirleriyle sohbet edebilirler.

## 📋 Gereksinimler

- **Node.js 16+** (Önerilen: 18+)
- **Ark Survival Evolved** sunucularında RCON aktif olmalı
- **Windows/Linux/macOS** işletim sistemi

## 🚀 Hızlı Kurulum

### Windows PowerShell ile:
```powershell
# PowerShell'i yönetici olarak açın
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\install.ps1
```

### Linux/macOS ile:
```bash
chmod +x install.sh
./install.sh
```

### Manuel Kurulum:
```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Yapılandırma dosyalarını oluştur
cp config.example.json config.json
cp .env.example .env

# 3. Sistemi başlat
npm start
```

## ⚙️ Yapılandırma

### 1. Ark Sunucularınızı Yapılandırın

Her Ark sunucusunun `GameUserSettings.ini` dosyasında:

```ini
[ServerSettings]
RCONEnabled=True
RCONPort=27020
ServerAdminPassword=güçlü_admin_şifresi
```

### 2. Chat Sistemi Yapılandırması

`config.json` dosyasını düzenleyin:

```json
{
  "port": 3000,
  "servers": [
    {
      "id": "island",
      "name": "The Island",
      "host": "192.168.1.100",
      "port": 27020,
      "password": "güçlü_admin_şifresi",
      "enabled": true
    },
    {
      "id": "ragnarok",
      "name": "Ragnarok",
      "host": "192.168.1.101", 
      "port": 27020,
      "password": "güçlü_admin_şifresi",
      "enabled": true
    }
  ]
}
```

### 3. Güvenlik Ayarları

`.env` dosyasında admin bilgilerini güncelleyin:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=güvenli_şifre_123
LOG_LEVEL=info
```

## 🎮 Kullanım

### Ana Arayüz
- **URL:** http://localhost:3000
- **Özellikler:** Canlı chat, sunucu durumu, istatistikler

### Admin Panel
- **URL:** http://localhost:3000/admin
- **Özellikler:** Mesaj gönderme, komut çalıştırma, sunucu yönetimi

### Kullanılabilir Komutlar
```bash
npm start          # Üretim modunda başlat
npm run dev        # Geliştirme modunda başlat (nodemon)
npm test           # Testleri çalıştır
```

## 🐋 Docker ile Kurulum

### Docker Compose (Önerilen):
```bash
# Docker Compose ile başlat
docker-compose up -d

# Logları görüntüle
docker-compose logs -f
```

### Manuel Docker:
```bash
# Image oluştur
docker build -t ark-chat .

# Container çalıştır
docker run -d -p 3000:3000 \
  -v $(pwd)/config.json:/app/config.json \
  -v $(pwd)/logs:/app/logs \
  ark-chat
```

## 🔧 Sorun Giderme

### Yaygın Problemler

**1. RCON Bağlantı Hatası**
```
Çözüm:
- Ark sunucusunda RCON aktif mi kontrol edin
- IP adresi ve port doğru mu kontrol edin
- Firewall kurallarını kontrol edin
- Admin şifresinin doğru olduğundan emin olun
```

**2. Port Zaten Kullanılıyor**
```bash
# Farklı port kullanın
PORT=3001 npm start

# Veya config.json'da port değiştirin
"port": 3001
```

**3. Node.js Sürüm Uyumsuzluğu**
```bash
# Node.js sürümünü kontrol edin
node --version

# 16+ sürümü gerekli
```

### Log Dosyaları

Loglar `logs/` klasöründe saklanır:
- `app-YYYY-MM-DD.log` - Genel sistem logları
- Terminal çıktısı - Gerçek zamanlı loglar

### Debug Modu

Detaylı loglar için:
```bash
LOG_LEVEL=debug npm start
```

## 📊 Performans

### Sistem Gereksinimleri
- **RAM:** 256MB minimum, 512MB önerilen
- **CPU:** 1 core yeterli
- **Disk:** 100MB (loglar hariç)
- **Network:** Ark sunucularına erişim

### Optimizasyon
```json
{
  "chatHistory": {
    "maxMessages": 1000,
    "saveToFile": true
  },
  "servers": [
    {
      "reconnectInterval": 5000
    }
  ]
}
```

## 🔐 Güvenlik

### Önerilen Güvenlik Ayarları

1. **Güçlü Şifreler Kullanın**
2. **Firewall Kuralları**
   - Sadece gerekli portları açın
   - Ark sunucularından gelen trafiği allow edin
3. **HTTPS Kullanın** (Reverse proxy ile)
4. **Logları Düzenli Kontrol Edin**

## 🌐 Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📚 API Dokümantasyonu

### REST Endpoints

```bash
GET  /api/stats           # Sistem istatistikleri
GET  /api/chat/history    # Chat geçmişi
POST /api/admin/message   # Admin mesajı gönder
POST /api/admin/command   # Komut çalıştır
```

### WebSocket Events

```javascript
// İstemci -> Sunucu
socket.emit('adminCommand', { type, payload });

// Sunucu -> İstemci
socket.on('newChatMessage', callback);
socket.on('serverStatusChange', callback);
socket.on('statsUpdate', callback);
```

## 📞 Destek

### GitHub Issues
[GitHub Repository Issues](https://github.com/your-repo/ark-cross-server-chat/issues)

### Discord
Discord sunucumuz: [Link]

### Dokümantasyon
Detaylı dokümantasyon: [Wiki Link]

---

## 📄 Lisans

MIT License - Detaylar için LICENSE dosyasını inceleyin.

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 🙏 Teşekkürler

- **rcon** paketi geliştiricilerine
- **Socket.IO** ekibine
- **Express.js** topluluğuna
- **Ark Survival Evolved** topluluğuna
