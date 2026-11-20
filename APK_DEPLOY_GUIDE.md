# Panduan Deploy Game Menjadi Android APK

Game **Zombie Survival: Last Stand 3D RPG** sudah dilengkapi **PWA Manifest + Service Worker Offline + Ikon Android Adaptif (192px & 512px)**, **Konfigurasi Capacitor (`capacitor.config.json`)**, serta **GitHub Actions Cloud APK Builder**.

Pilih salah satu dari **3 cara termudah** di bawah ini sesuai kebutuhan Anda:

---

## Cara 1 — Paling Cepat (2 Menit, Tanpa Android Studio): PWABuilder (TWA APK)

Cocok jika Anda ingin langsung mendapatkan file `.apk` dari URL aplikasi yang sudah dideploy (termasuk mode Multiplayer Co-op yang langsung aktif!):

1. Klik tombol **Share / Deploy** di pojok kanan atas AI Studio untuk mendapatkan URL publik aplikasi Anda (format `https://...run.app`).
2. Buka situs **[https://www.pwabuilder.com](https://www.pwabuilder.com)**.
3. Tempel URL publik game Anda lalu klik **Start**.
4. PWABuilder akan otomatis mendeteksi Web App Manifest, Service Worker, dan Ikon 192×192 / 512×512 (termasuk ikon *maskable* Android).
5. Klik **Package for Stores** → pilih **Android** → **Generate Package** → **Download Package**.
6. Ekstrak file ZIP hasil unduhan: di dalamnya sudah tersedia file **`.apk`** (siap langsung diinstal di HP Android) dan **`.aab`** (siap unggah ke Google Play Store).

---

## Cara 2 — APK Offline Mandiri Otomatis via GitHub Actions (Gratis, Tanpa Android Studio)

Cocok jika Anda ingin file `.apk` yang **100% menyimpan semua aset game di dalam APK** (bisa dimainkan Solo tanpa internet sama sekali):

1. Export / push proyek ini ke repositori **GitHub** Anda.
2. Buka repositori Anda di GitHub → klik tab **Actions**.
3. Pilih workflow **Build Android APK** → klik **Run workflow** (atau otomatis berjalan setiap ada push ke `main`).
4. Tunggu ±3–4 menit hingga build selesai (centang hijau).
5. Klik hasil run tersebut → gulir ke bagian **Artifacts** → unduh **`ZombieSurvival-LastStand-APK`**.
6. Ekstrak ZIP tersebut untuk mendapatkan `app-debug.apk`, kirim ke HP Android Anda, lalu instal!

---

## Cara 3 — Build Lokal di Laptop (Android Studio / Gradle)

Proyek native Android (`android/`) sudah otomatis dibuat, dilengkapi ikon HD, layar penuh (*immersive fullscreen*), orientasi lanskap, dan akselerasi GPU WebGL.

```bash
# 1. Instal dependensi & sinkronkan aset terbaru ke proyek Android
npm install
npm run android:sync

# 2a. Langsung compile APK via terminal (membutuhkan JDK 21 + Android SDK)
cd android && ./gradlew assembleDebug
# Output APK: android/app/build/outputs/apk/debug/app-debug.apk

# 2b. Atau buka langsung di Android Studio untuk Build APK / Signed Release APK
npm run android:open
```

Di Android Studio: pilih menu **Build → Build Bundle(s) / APK(s) → Build APK(s)** (atau **Generate Signed Bundle / APK** untuk rilis Play Store).
