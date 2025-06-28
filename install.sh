#!/bin/bash

echo "🎮 Ark Cross-Server Chat Kurulum Scripti"
echo "========================================"

# Node.js kontrolü
if ! command -v node &> /dev/null; then
    echo "❌ Node.js bulunamadı. Lütfen Node.js 16+ sürümünü yükleyin."
    echo "   İndirme linki: https://nodejs.org/"
    exit 1
fi

# npm kontrolü
if ! command -v npm &> /dev/null; then
    echo "❌ npm bulunamadı. Node.js ile birlikte yüklü olmalıdır."
    exit 1
fi

echo "✅ Node.js $(node --version) bulundu"
echo "✅ npm $(npm --version) bulundu"

# Bağımlılıkları yükle
echo ""
echo "📦 Bağımlılıklar yükleniyor..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Bağımlılık yükleme başarısız!"
    exit 1
fi

echo "✅ Bağımlılıklar başarıyla yüklendi"

# Yapılandırma dosyalarını oluştur
echo ""
echo "⚙️  Yapılandırma dosyaları hazırlanıyor..."

if [ ! -f config.json ]; then
    cp config.example.json config.json
    echo "✅ config.json oluşturuldu"
else
    echo "ℹ️  config.json zaten mevcut"
fi

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ .env oluşturuldu"
else
    echo "ℹ️  .env zaten mevcut"
fi

# Gerekli dizinleri oluştur
echo ""
echo "📁 Dizinler oluşturuluyor..."
mkdir -p logs
mkdir -p data
echo "✅ Dizinler oluşturuldu"

echo ""
echo "🎉 Kurulum tamamlandı!"
echo ""
echo "🔧 Yapılandırma:"
echo "   1. config.json dosyasını düzenleyin"
echo "   2. Ark sunucularınızın RCON bilgilerini girin"
echo "   3. .env dosyasında admin bilgilerini ayarlayın"
echo ""
echo "🚀 Başlatma:"
echo "   npm start          - Üretim modunda çalıştır"
echo "   npm run dev        - Geliştirme modunda çalıştır"
echo ""
echo "🌐 Web Arayüzü:"
echo "   Ana sayfa: http://localhost:3000"
echo "   Admin panel: http://localhost:3000/admin"
echo ""

# Ark sunucu yapılandırma önerileri göster
echo "🎮 Ark Sunucu Yapılandırması:"
echo "   GameUserSettings.ini dosyasına ekleyin:"
echo "   [ServerSettings]"
echo "   RCONEnabled=True"
echo "   RCONPort=27020"
echo "   ServerAdminPassword=your_admin_password"
echo ""

echo "✨ Kurulum başarıyla tamamlandı!"
