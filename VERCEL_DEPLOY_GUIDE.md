# Panduan Lengkap Deploy Vercel & Konfigurasi Firebase Auth

Aplikasi **BigMA - Account Management** sudah 100% siap untuk dideploy di **Vercel**.

---

## 1. Penyebab Error `auth/operation-not-allowed` saat Login
Error `auth/operation-not-allowed` terjadi karena **Provider Sign-in (Email/Password & Google)** belum diaktifkan di dalam **Firebase Console** proyek Firebase Anda.

### Cara Mengaktifkannya (Hanya 1x Langkah Mudah):
1. Buka [Firebase Console](https://console.firebase.google.com).
2. Pilih proyek Firebase Anda: **api3-445216** (atau sesuai ID proyek Anda).
3. Di menu sebelah kiri, klik **Build** -> **Authentication**.
4. Buka tab **Sign-in method**.
5. Klik **Email/Password**:
   - Aktifkan toggle **Enable / Aktifkan**.
   - Klik **Save / Simpan**.
6. Klik **Google**:
   - Aktifkan toggle **Enable / Aktifkan**.
   - Pilih Email Dukungan Proyek (*Project support email*).
   - Klik **Save / Simpan**.

---

## 2. Menambahkan Domain Vercel ke Firebase Authorized Domains
Agar login Google dan Auth bekerja tanpa hambatan di domain Vercel Anda (`https://nama-aplikasi-anda.vercel.app`):

1. Di Firebase Console, buka **Authentication** -> **Settings** -> **Authorized domains**.
2. Klik tombol **Add domain**.
3. Masukkan domain Vercel Anda, contoh: `bigma-app.vercel.app` (tanpa `https://`).
4. Klik **Add**.

---

## 3. Langkah Deploy ke Vercel

1. **Upload / Push Kode ke GitHub**:
   - Push repository project ini ke akun GitHub Anda.

2. **Import Proyek di Vercel**:
   - Buka [Vercel Dashboard](https://vercel.com/dashboard) -> klik **Add New** -> **Project**.
   - Pilih repository GitHub proyek BigMA ini.

3. **Konfigurasi Build (Otomatis)**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Variabel Lingkungan / Environment Variables (Opsional)**:
   Proyek ini sudah dilengkapi file config bawaan, namun untuk keamanan terbaik Anda bisa menambahkan Environment Variables berikut di Vercel -> *Settings* -> *Environment Variables*:
   - `VITE_FIREBASE_API_KEY`: `AIzaSyAfEYg-9hzE0pk4zV8eu_quVP28PiqDhFo`
   - `VITE_FIREBASE_AUTH_DOMAIN`: `api3-445216.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID`: `api3-445216`
   - `VITE_FIREBASE_STORAGE_BUCKET`: `api3-445216.firebasestorage.app`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: `240552183381`
   - `VITE_FIREBASE_APP_ID`: `1:240552183381:web:f28ec685ebed5ecb0e76dc`
   - `VITE_FIREBASE_FIRESTORE_DATABASE_ID`: `ai-studio-bigmastudiomanaj-5d04e664-21c3-4e3f-80a0-84016de086ae`

5. Klik **Deploy**!
