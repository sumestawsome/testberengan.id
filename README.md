# Patungan Akun - Clickable Interactive Prototype

Prototipe web sistem informasi patungan akun aplikasi premium berbasis **Single Page Application (SPA) Statis** tanpa backend server. Seluruh persistensi data pesanan, slot kuota grup patungan, saldo dompet, dan autentikasi pengguna disimulasikan menggunakan **Vanilla JavaScript & `localStorage`**.

---

## 🛠️ Tech Stack & Arsitektur
- **HTML5 & Semantic Elements**
- **Tailwind CSS (CDN)** dengan tema khusus
- **Google Font: Sora** (Tipografi modern & rapi)
- **Lucide Icons (CDN)** untuk icon visual yang tajam
- **Vanilla JavaScript (ES6+)** tanpa framework external (Clean Separation of Concerns)
- **Desain UI:**
  - Modern Neo-Fintech / Clean Minimalist
  - Sudut siku tajam (`rounded-none` pada seluruh elemen kartu, tombol, badge, input, modal)
  - Latar belakang bersih `#f8fafc` dengan kontras aksen hitam slate `#0f172a`, biru langit, dan status badge berwarna jelas
  - Responsif optimal untuk tampilan Mobile (HP) dan Desktop/Laptop

---

## 📁 Struktur Berkas
```
barengan prototive/
├── index.html   # Shell HTML, navigasi, modal container, AI chatbot widget
├── data.js      # Data dummy awal & StateManager (sinkronisasi localStorage)
├── app.js       # SPA router, UI renderer, event handlers, & logika chatbot
└── README.md    # Panduan penggunaan & skenario testing
```

---

## 🚀 Cara Menjalankan Prototipe
Prototipe ini **100% Client-Side Statis**. Tidak memerlukan instalasi npm, node backend, ataupun database:

1. **Cara Langsung:**
   - Cukup buka file `index.html` dengan klik ganda di browser Anda (Google Chrome, Microsoft Edge, Mozilla Firefox, atau Safari).
2. **Cara Live Server / HTTP Server (Opsional):**
   - Jika menggunakan VS Code: Klik kanan `index.html` > *Open with Live Server*.
   - Atau via terminal: `npx serve .` atau `python -m http.server 8000`.

---

## 🎯 Panduan Skenario Pengujian (Testing Scenarios)

### Skenario Utama (User Flow)
1. **Skenario 1: Peserta Terakhir Langsung Mengaktifkan Akun (4/5 ➔ 5/5)**
   - Buka katalog > pilih **Netflix Premium Ultra HD**.
   - Klik **"Gabung Grup Ini"** pada **Grup #05** (saat ini 4/5 slot).
   - Bayar pakai saldo (atau top up dahulu). Pesanan langsung berstatus **`Aktif`**. Klik **"Lihat Detail Akun"** untuk melihat kredensial akun, password, dan PIN profil.
2. **Skenario 2: Uji Saldo Kurang vs Cukup**
   - Buka katalog > pilih **ChatGPT Plus (Rp 55.000)** dengan saldo Budi (Rp 25.000). Muncul peringatan merah saldo kurang.
   - Klik tombol **Top Up Saldo Tester** (+Rp 50.000), peringatan langsung berubah hijau dan tombol bayar aktif.
3. **Skenario 3: Transfer Manual & Approval Admin**
   - Pilih produk > pilih metode **Transfer Manual (BCA / Mandiri / QRIS)** > upload file.
   - Status menjadi `Menunggu Verifikasi`. Masuk ke **Mode Admin (Tester)** lalu klik **Approve** pada pesanan tersebut.
4. **Skenario 4: Rejection Pesanan oleh Admin**
   - Buat pesanan transfer manual > masuk ke Mode Admin > klik **Reject** dan masukkan alasan penolakan.
   - Di menu Pesanan, status menjadi `Ditolak` dan user dapat melihat alasannya.
5. **Skenario 5: Simulasi Waktu Habis & Refund 100% Saldo Dompet**
   - Di Mode Admin, klik tombol **"Simulasikan Waktu Habis (Expired & Refund)"** pada salah satu grup OPEN.
   - Seluruh pesanan di grup tersebut berubah status menjadi `Refund` dan 100% dana langsung kembali ke saldo dompet peserta.
6. **Skenario 6: Widget Asisten AI Chatbot**
   - Klik tombol **Tanya Asisten AI** di pojok kanan bawah. Coba *quick prompts* seperti *"Paket di bawah 25rb?"* atau tanyakan seputar refund.

---

### Skenario Pengujian Edge Case (Lengkap)

#### Skenario 7: Produk Tanpa Grup Terbuka (Case 2B - Spotify)
1. Buka halaman Katalog. Perhatikan kartu **Spotify Premium Family**:
   - Kartu menampilkan badge khusus: **`Belum Ada Grup Terbuka`**.
2. Klik tombol **"Pilih Paket & Grup"** pada Spotify:
   - Halaman detail menampilkan *empty state* rapi: *"Belum Ada Grup Patungan Terbuka"*.
3. Klik tombol **"Request Buka Grup Baru"**:
   - Notifikasi toast muncul mengonfirmasi bahwa permintaan telah dikirimkan ke admin.
4. Klik tombol **"Buka via Mode Admin"**:
   - Anda langsung diarahkan ke Mode Admin bagian **"3. Buka Grup Patungan Baru"** untuk membuat grup Spotify secara langsung.

#### Skenario 8: Tampilan Grup Kadaluwarsa / Expired (Case 2B - Canva #11)
1. Buka katalog > klik **Canva Pro Team**.
2. Perhatikan daftar grup: **Grup #11** berstatus `EXPIRED` (terisi 2/5).
3. Perhatikan tombol aksi pada grup tersebut:
   - Tombol disabled bertuliskan **"Waktu Habis"** (berbeda jelas dengan grup penuh yang bertuliskan *"Slot Sudah Penuh"*).
   - Terdapat catatan: *"Grup ini telah dibatalkan otomatis dan seluruh dana peserta telah dikembalikan 100%."*

#### Skenario 9: Mode Tamu (Belum Login) & Intersepsi Otomatis (Case 3B)
1. Klik avatar profil di navbar > klik ikon **Logout** (atau buka menu Ganti Profil dan pilih **"Mode Tamu (Belum Login)"**).
2. Perhatikan navbar: Saldo dompet digantikan oleh tombol biru **"Masuk / Login"**.
3. Buka salah satu produk (misal Netflix) lalu klik tombol **"Gabung Grup Ini"**:
   - Sistem langsung mencegat aksi dan membuka **Modal Login Cepat**.
4. Di modal login, Anda bisa:
   - Memilih salah satu akun tester (misal Budi Santoso), ATAU
   - Mendaftar cepat dengan mengetik nama & email baru (otomatis mendapat bonus saldo Rp 25.000).
5. **Hasil:** Setelah login/register berhasil, sistem **secara otomatis langsung mengarahkan Anda ke halaman Checkout** grup yang tadi Anda klik tanpa harus memilih ulang.

#### Skenario 10: Race Condition - Slot Mendadak Penuh Saat Checkout (Case 4C)
1. Pilih salah satu grup yang masih buka (misal Canva Grup #12) dan masuk ke halaman **Checkout**.
2. Di halaman Checkout, perhatikan kotak kuning di bagian atas bertuliskan **"Simulator Edge Case (Tester)"**.
3. Klik tombol: **"Simulasikan Slot Diserobot Orang Lain (Penuh)"**.
   - Sistem secara diam-diam mengisi slot grup menjadi 5/5 (FULL) di background.
4. Klik tombol **"Konfirmasi & Bayar"** di bagian rincian tagihan:
   - Checkout langsung digagalkan.
   - Muncul **Banner Merah Peringatan Jelas**: *"Maaf, slot grup ini baru saja penuh oleh pengguna lain!"*.
   - Saldo Anda dipastikan tidak terpotong.
   - Tersedia tombol merah **"Pilih Grup Lain"** yang mengembalikan Anda ke halaman Detail Produk.

#### Skenario 11: Upload Ulang Bukti Transfer yang Ditolak (Case 5B)
1. Buka halaman **Pesanan & Dompet**.
2. Temukan pesanan yang berstatus **`Ditolak`** (atau simulasikan penolakan di Mode Admin).
3. Pada kartu pesanan ditolak, klik tombol **"Upload Ulang Bukti"**:
   - Terbuka modal pengunggahan bukti baru lengkap dengan riwayat alasan penolakan sebelumnya.
4. Pilih file baru atau gunakan file simulasi, lalu klik **"Kirim Bukti Baru ke Admin"**.
5. **Hasil:** Status pesanan langsung berubah kembali menjadi **`Menunggu Verifikasi`** dan muncul kembali di antrean Mode Admin untuk diverifikasi ulang.

#### Skenario 12: Admin Membuka Grup Patungan Baru (Case 5)
1. Masuk ke **Mode Admin (Tester)**.
2. Gulir ke bagian **"3. Buka Grup Patungan Baru"**.
3. Pilih produk (misal: **Spotify Premium Family** yang tadinya 0 grup).
4. Pilih durasi paket lalu klik **"Buat Grup Baru"**.
5. **Hasil:** Grup baru (misal Spotify Grup #01, 0/5 slot, waktu 3 hari) langsung tercipta dan dapat langsung dilihat di halaman Katalog maupun Detail Produk.

---

### 🔄 Manajemen Reset & Base Data
Kapan saja Anda ingin mengulang pengujian dari nol, Anda dapat mereset data menggunakan 3 cara mudah:
1. **Tombol "Reset Demo" di Top Notice Bar:** Klik tombol teks rose *"Reset Demo"* pada bar gelap paling atas (atau dari menu mobile dropdown di HP).
2. **Tombol di Mode Admin:** Buka menu **Mode Admin (Tester)** lalu klik tombol merah **"Reset Semua Data Dummy"**.
3. **URL Parameter `?reset=1`:** Buka aplikasi dengan menambahkan parameter `?reset=1` pada URL browser (misal `index.html?reset=1`), sistem akan otomatis membersihkan `localStorage`, memuat data awal versi terbaru (`v2`), dan membersihkan parameter URL tanpa reload.

Saat di-reset, seluruh data dikembalikan ke kondisi base data:
- Akun Budi Santoso dengan saldo awal Rp 25.000
- Canva Grup #12 kembali ke 3/5 slot (OPEN)
- Netflix Grup #05 kembali ke 4/5 slot (OPEN hampir penuh)
- Canva Grup #11 kembali ke status EXPIRED
- Spotify Premium Family kembali ke 0 grup terbuka
