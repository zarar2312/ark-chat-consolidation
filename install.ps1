# Ark Cross-Server Chat Kurulum Scripti (Windows PowerShell)

Write-Host "🎮 Ark Cross-Server Chat Kurulum Scripti" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Node.js kontrolü
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion bulundu" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js bulunamadı. Lütfen Node.js 16+ sürümünü yükleyin." -ForegroundColor Red
    Write-Host "   İndirme linki: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# npm kontrolü
try {
    $npmVersion = npm --version
    Write-Host "✅ npm v$npmVersion bulundu" -ForegroundColor Green
} catch {
    Write-Host "❌ npm bulunamadı. Node.js ile birlikte yüklü olmalıdır." -ForegroundColor Red
    exit 1
}

# Bağımlılıkları yükle
Write-Host ""
Write-Host "📦 Bağımlılıklar yükleniyor..." -ForegroundColor Cyan
try {
    npm install
    Write-Host "✅ Bağımlılıklar başarıyla yüklendi" -ForegroundColor Green
} catch {
    Write-Host "❌ Bağımlılık yükleme başarısız!" -ForegroundColor Red
    exit 1
}

# Yapılandırma dosyalarını oluştur
Write-Host ""
Write-Host "⚙️  Yapılandırma dosyaları hazırlanıyor..." -ForegroundColor Cyan

if (-not (Test-Path "config.json")) {
    Copy-Item "config.example.json" "config.json"
    Write-Host "✅ config.json oluşturuldu" -ForegroundColor Green
} else {
    Write-Host "ℹ️  config.json zaten mevcut" -ForegroundColor Yellow
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env oluşturuldu" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env zaten mevcut" -ForegroundColor Yellow
}

# Gerekli dizinleri oluştur
Write-Host ""
Write-Host "📁 Dizinler oluşturuluyor..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType Directory -Force -Path "data" | Out-Null
Write-Host "✅ Dizinler oluşturuldu" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Kurulum tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Yapılandırma:" -ForegroundColor Yellow
Write-Host "   1. config.json dosyasını düzenleyin"
Write-Host "   2. Ark sunucularınızın RCON bilgilerini girin"
Write-Host "   3. .env dosyasında admin bilgilerini ayarlayın"
Write-Host ""
Write-Host "🚀 Başlatma:" -ForegroundColor Yellow
Write-Host "   npm start          - Üretim modunda çalıştır"
Write-Host "   npm run dev        - Geliştirme modunda çalıştır"
Write-Host ""
Write-Host "🌐 Web Arayüzü:" -ForegroundColor Yellow
Write-Host "   Ana sayfa: http://localhost:3000"
Write-Host "   Admin panel: http://localhost:3000/admin"
Write-Host ""

# Ark sunucu yapılandırma önerileri göster
Write-Host "🎮 Ark Sunucu Yapılandırması:" -ForegroundColor Cyan
Write-Host "   GameUserSettings.ini dosyasına ekleyin:"
Write-Host "   [ServerSettings]"
Write-Host "   RCONEnabled=True"
Write-Host "   RCONPort=27020"
Write-Host "   ServerAdminPassword=your_admin_password"
Write-Host ""

Write-Host "✨ Kurulum başarıyla tamamlandı!" -ForegroundColor Green

# Kullanıcıya başlatma seçeneği sun
$response = Read-Host "Sistemi şimdi başlatmak ister misiniz? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "🚀 Sistem başlatılıyor..." -ForegroundColor Green
    npm start
}
