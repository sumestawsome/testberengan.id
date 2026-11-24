/**
 * testing.js - Mode Panduan Pengujian Interaktif (Guided Usability Testing ala Duolingo)
 * & Form Evaluasi Tester (JSON Storage + Export)
 * 
 * Sistem pelacak 7 tahap pengujian yang otomatis mendeteksi aksi tester,
 * membuka tahap secara sekuensial, dan mengumpulkan evaluasi terstruktur dalam format JSON.
 */

// Konfigurasi Webhook Pengumpulan Evaluasi (Opsional)
// Isi dengan endpoint URL webhook (cth: Formspree, Google Apps Script, Make, dll) jika ingin kirim otomatis
const FEEDBACK_ENDPOINT = '';

const TEST_PROGRESS_KEY = 'patungan_guided_test_progress_v1';
const FEEDBACK_STORAGE_KEY = 'patungan_feedback_json';

// Definisi 7 Tahap Pengujian Terstruktur
const STAGES_CONFIG = [
  {
    stage: 1,
    title: 'Tahap 1: Eksplorasi & Pencarian Produk',
    subtitle: 'Temukan aplikasi premium impianmu',
    icon: 'search',
    description: 'Di tahap ini, kamu diajak mencoba fitur penemuan produk di halaman katalog baik secara mandiri maupun dibantu oleh Asisten AI cerdas.',
    cases: [
      {
        id: '1A',
        title: 'Case 1A (Cari Mandiri)',
        instruction: 'Ketik nama aplikasi di kolom search katalog (misal: "netflix" atau "canva") ATAU klik salah satu tab kategori (Streaming, Desain, dll).',
        hint: 'Coba ketik kata kunci di kolom pencarian pada bagian atas katalog.'
      },
      {
        id: '1B',
        title: 'Case 1B (Bantuan AI Chatbot)',
        instruction: 'Buka widget "Tanya Asisten AI" di pojok kanan bawah, lalu kirim minimal 1 pertanyaan atau klik salah satu tombol prompt cepat (misal: "Paket di bawah 25rb?").',
        hint: 'Klik tombol mengambang hitam bertuliskan "Tanya Asisten AI".'
      }
    ]
  },
  {
    stage: 2,
    title: 'Tahap 2: Memilih Paket & Cek Ketersediaan Grup',
    subtitle: 'Pantau ketersediaan slot grup & kondisi edge case',
    icon: 'layers',
    description: 'Pelajari transparansi slot kuota grup patungan, perbedaan durasi 1 vs 3 bulan, serta penanganan produk tanpa grup dan grup kadaluwarsa.',
    cases: [
      {
        id: '2A',
        title: 'Case 2A (Cek Grup OPEN & Durasi)',
        instruction: 'Buka detail produk yang memiliki grup OPEN (misal Canva Pro atau Netflix), lalu coba ganti pilihan durasi paket (1 Bulan / 3 Bulan).',
        hint: 'Klik "Pilih Paket & Grup" pada Canva Pro atau Netflix, lalu klik tombol durasi paket.'
      },
      {
        id: '2B',
        title: 'Case 2B (Cek Produk Tanpa Grup / Expired)',
        instruction: 'Buka detail produk Spotify Premium Family (0 grup) lalu klik "Request Buka Grup Baru", ATAU periksa Canva Grup #11 yang berstatus EXPIRED.',
        hint: 'Buka produk Spotify di katalog dan klik "Request Buka Grup Baru".'
      }
    ]
  },
  {
    stage: 3,
    title: 'Tahap 3: Pengecekan Status Login (Guest Mode)',
    subtitle: 'Uji alur pencegatan login otomatis',
    icon: 'user-check',
    description: 'Pastikan pengguna yang belum login dicegat dengan baik saat ingin ikut patungan, dan langsung dialihkan ke checkout setelah login berhasil.',
    cases: [
      {
        id: '3B',
        title: 'Case 3B (Cegat Login & Auto-Redirect)',
        instruction: 'Klik tombol Logout di profil navbar untuk masuk ke "Mode Tamu", lalu klik tombol "Gabung Grup Ini" pada salah satu produk hingga muncul Modal Login, kemudian masuk kembali (misal pilih akun Budi Santoso).',
        hint: 'Logout dulu dari navbar, lalu coba klik "Gabung Grup Ini". Setelah modal login muncul, pilih Budi Santoso.'
      }
    ]
  },
  {
    stage: 4,
    title: 'Tahap 4: Checkout & Proses Pembayaran',
    subtitle: 'Simulasikan berbagai metode bayar & race condition',
    icon: 'credit-card',
    description: 'Uji coba pembayaran instan via saldo dompet, metode transfer manual dengan bukti bayar, serta simulasi slot diserobot orang lain.',
    cases: [
      {
        id: '4A',
        title: 'Case 4A (Transfer Manual + Upload Bukti)',
        instruction: 'Lakukan checkout pada salah satu grup dengan memilih metode "Transfer Manual (BCA/Mandiri/QRIS)", unggah file bukti transfer, lalu klik Konfirmasi & Bayar.',
        hint: 'Di checkout, pilih Transfer Manual dan upload bukti transfer.'
      },
      {
        id: '4B',
        title: 'Case 4B (Bayar Pakai Saldo Dompet)',
        instruction: 'Lakukan checkout dengan metode "Bayar Pakai Saldo Dompet". Jika saldo kurang, lakukan Top Up Saldo terlebih dahulu.',
        hint: 'Pilih metode Bayar Pakai Saldo lalu selesaikan pembayaran.'
      },
      {
        id: '4C',
        title: 'Case 4C (Simulasi Slot Diserobot)',
        instruction: 'Di halaman Checkout, klik tombol kuning "Simulasikan Slot Diserobot Orang Lain (Penuh)", lalu klik "Konfirmasi & Bayar" untuk memverifikasi penolakan bersahabat.',
        hint: 'Gunakan kotak kuning "Simulator Edge Case" di halaman Checkout.'
      }
    ]
  },
  {
    stage: 5,
    title: 'Tahap 5: Verifikasi Pembayaran (Mode Admin)',
    subtitle: 'Simulasikan persetujuan & penolakan transfer',
    icon: 'shield-alert',
    description: 'Rasakan peran admin yang memverifikasi transaksi transfer manual, menyetujui kuota, dan memberikan alasan penolakan jika bukti tidak sesuai.',
    cases: [
      {
        id: '5A',
        title: 'Case 5A (Approve Pesanan Pending)',
        instruction: 'Buka menu "Mode Admin (Tester)" di navbar, lalu klik tombol "Approve" pada salah satu pesanan berstatus Menunggu Verifikasi.',
        hint: 'Klik tombol Mode Admin (Tester) berwarna kuning di navbar, lalu Approve pesanan pending.'
      },
      {
        id: '5B',
        title: 'Case 5B (Reject & Upload Ulang Bukti)',
        instruction: 'Di Mode Admin, klik "Reject" pada pesanan transfer, lalu buka menu "Pesanan & Dompet" dan klik tombol "Upload Ulang Bukti" pada pesanan yang ditolak tersebut.',
        hint: 'Tolak salah satu pesanan di Mode Admin, lalu buka Pesanan Saya dan unggah bukti baru.'
      }
    ]
  },
  {
    stage: 6,
    title: 'Tahap 6: Masa Tunggu Kuota & Garansi Refund',
    subtitle: 'Uji coba aktivasi kuota penuh vs gagal kuota',
    icon: 'clock',
    description: 'Uji kepastian garansi: akun aktif jika kuota genap terpenuhi, atau dana 100% kembali otomatis ke dompet saldo jika waktu habis.',
    cases: [
      {
        id: '6AB',
        title: 'Case 6A/B (Grup Penuh ➔ Akun Aktif)',
        instruction: 'Buat salah satu grup menjadi penuh dan AKTIF (bisa dengan bergabung slot ke-5 Netflix Grup #05, atau klik "Simulasikan Penuh" pada grup OPEN di Mode Admin).',
        hint: 'Gunakan tombol "Simulasikan Penuh (Aktifkan)" di Mode Admin.'
      },
      {
        id: '6C',
        title: 'Case 6C (Simulasi Waktu Habis & Auto-Refund)',
        instruction: 'Di Mode Admin, klik tombol merah "Simulasikan Waktu Habis (Expired & Refund)" pada salah satu grup OPEN, lalu periksa saldo bertambah di halaman Pesanan & Dompet.',
        hint: 'Klik tombol "Simulasikan Waktu Habis" di Mode Admin untuk menguji pengembalian dana 100%.'
      }
    ]
  },
  {
    stage: 7,
    title: 'Tahap 7: Riwayat Pesanan & Kredensial Akun',
    subtitle: 'Akses akun premium yang telah aktif & verifikasi kredensial',
    icon: 'key',
    description: 'Buktikan bahwa akun yang berstatus Aktif dapat diakses kredensialnya dengan aman, lengkap dengan informasi profil, password, dan PIN.',
    cases: [
      {
        id: '7',
        title: 'Case 7 (Akses Kredensial Akun Aktif)',
        instruction: 'Buka menu "Pesanan & Dompet", klik tombol hijau "Lihat Detail Akun" pada pesanan yang berstatus Aktif, lalu klik toggle "Lihat Password" atau tombol "Salin".',
        hint: 'Pada pesanan berstatus Aktif, klik "Lihat Detail Akun" dan coba salin password atau email.'
      }
    ]
  }
];

class GuidedTestingManager {
  constructor() {
    this.isOpen = false;
    this.selectedWorkflowRating = 0;
    this.selectedUiuxRating = 0;
    this.init();
  }

  init() {
    this.loadProgress();
    this.bindEventListeners();
    this.renderWidget();

    // Tampilkan Intro Study Case otomatis untuk tester baru
    if (!this.progress.introSeen) {
      setTimeout(() => this.showIntroModal(), 600);
    }
  }

  loadProgress() {
    const raw = localStorage.getItem(TEST_PROGRESS_KEY);
    if (!raw) {
      this.progress = this.getDefaultProgress();
      this.saveProgress();
    } else {
      try {
        this.progress = JSON.parse(raw);
        // Fallback jika ada data yang corrupt
        if (!this.progress.stages) {
          this.progress = this.getDefaultProgress();
          this.saveProgress();
        }
      } catch (e) {
        this.progress = this.getDefaultProgress();
        this.saveProgress();
      }
    }
  }

  getDefaultProgress() {
    const stagesData = {};
    STAGES_CONFIG.forEach(s => {
      stagesData[s.stage] = {
        completed: false,
        cases: {}
      };
      s.cases.forEach(c => {
        stagesData[s.stage].cases[c.id] = false;
      });
    });

    return {
      introSeen: false,
      currentStage: 1,
      stages: stagesData
    };
  }

  saveProgress() {
    localStorage.setItem(TEST_PROGRESS_KEY, JSON.stringify(this.progress));
    this.updateWidgetUI();
  }

  resetProgress() {
    this.progress = this.getDefaultProgress();
    this.progress.introSeen = true;
    this.saveProgress();
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('Progres panduan tes berhasil direset ke Tahap 1.', 'info');
    }
    this.renderWidget();
  }

  resetCurrentStage() {
    const cur = this.progress.currentStage;
    if (this.progress.stages[cur]) {
      this.progress.stages[cur].completed = false;
      Object.keys(this.progress.stages[cur].cases).forEach(k => {
        this.progress.stages[cur].cases[k] = false;
      });
      this.saveProgress();
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`Sub-misi Tahap ${cur} telah direset. Silakan ulangi pengujian.`, 'info');
      }
      this.renderWidget();
    }
  }

  // --- EVENT LISTENERS DARI APLIKASI UTAMA ---
  bindEventListeners() {
    window.addEventListener('patungan_test_event', (e) => {
      this.handleTestEvent(e.detail);
    });
  }

  handleTestEvent(detail) {
    if (!detail || !detail.action) return;
    const action = detail.action;
    let progressChanged = false;

    // TAHAP 1
    if (action === 'SEARCH_CATALOG' || action === 'FILTER_CATEGORY') {
      progressChanged = this.markCaseDone(1, '1A') || progressChanged;
    }
    if (action === 'CHATBOT_SENT') {
      progressChanged = this.markCaseDone(1, '1B') || progressChanged;
    }

    // TAHAP 2
    if (action === 'VIEW_PRODUCT_DETAIL_OPEN_GROUP') {
      progressChanged = this.markCaseDone(2, '2A') || progressChanged;
    }
    if (action === 'REQUEST_NEW_GROUP' || action === 'VIEW_EXPIRED_OR_FULL_GROUP') {
      progressChanged = this.markCaseDone(2, '2B') || progressChanged;
    }

    // TAHAP 3
    if (action === 'GUEST_INTERCEPT_AND_LOGIN') {
      progressChanged = this.markCaseDone(3, '3B') || progressChanged;
    }

    // TAHAP 4
    if (action === 'CHECKOUT_TRANSFER_MANUAL') {
      progressChanged = this.markCaseDone(4, '4A') || progressChanged;
    }
    if (action === 'CHECKOUT_SALDO') {
      progressChanged = this.markCaseDone(4, '4B') || progressChanged;
    }
    if (action === 'RACE_CONDITION_TRIGGERED') {
      progressChanged = this.markCaseDone(4, '4C') || progressChanged;
    }

    // TAHAP 5
    if (action === 'ADMIN_APPROVE_ORDER') {
      progressChanged = this.markCaseDone(5, '5A') || progressChanged;
    }
    if (action === 'REUPLOAD_PROOF_SUBMITTED') {
      progressChanged = this.markCaseDone(5, '5B') || progressChanged;
    }

    // TAHAP 6
    if (action === 'GROUP_ACTIVATED') {
      progressChanged = this.markCaseDone(6, '6AB') || progressChanged;
    }
    if (action === 'SIMULATE_EXPIRE_REFUND') {
      progressChanged = this.markCaseDone(6, '6C') || progressChanged;
    }

    // TAHAP 7
    if (action === 'VIEW_CREDENTIALS_AND_INTERACT') {
      progressChanged = this.markCaseDone(7, '7') || progressChanged;
    }

    if (progressChanged) {
      this.checkStageCompletion();
      this.saveProgress();
      this.renderWidget();
    }
  }

  markCaseDone(stageNum, caseId) {
    if (!this.progress.stages[stageNum]) return false;
    if (!this.progress.stages[stageNum].cases[caseId]) {
      this.progress.stages[stageNum].cases[caseId] = true;
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`🎯 Sub-misi ${caseId} Berhasil Diselesaikan!`, 'success');
      }
      return true;
    }
    return false;
  }

  checkStageCompletion() {
    const cur = this.progress.currentStage;
    if (cur > 7) return;

    const stageObj = this.progress.stages[cur];
    if (!stageObj) return;

    // Cek apakah seluruh cases di tahap aktif sudah true
    const allDone = Object.values(stageObj.cases).every(v => v === true);
    if (allDone && !stageObj.completed) {
      stageObj.completed = true;

      if (cur < 7) {
        this.progress.currentStage = cur + 1;
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`🎉 Tahap ${cur} Selesai! Membuka Tahap ${cur + 1}.`, 'success');
        }
      } else {
        // Tahap 7 Selesai -> Seluruh pengujian komplit!
        this.progress.currentStage = 8;
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('🏆 Luar biasa! Seluruh 7 tahap pengujian telah selesai. Silakan isi form evaluasi.', 'success');
        }
        setTimeout(() => this.showEvaluationModal(), 800);
      }
    }
  }

  getCompletedStagesCount() {
    let count = 0;
    for (let i = 1; i <= 7; i++) {
      if (this.progress.stages[i] && this.progress.stages[i].completed) {
        count++;
      }
    }
    return count;
  }

  // --- RENDER WIDGET PANEL ---
  renderWidget() {
    let container = document.getElementById('guided-test-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'guided-test-container';
      document.body.appendChild(container);
    }

    const completedCount = this.getCompletedStagesCount();
    const percent = Math.round((completedCount / 7) * 100);

    container.innerHTML = `
      <!-- FLOATING TRIGGER BUTTON (Pojok Kiri Bawah) -->
      <div class="fixed bottom-5 left-5 z-50">
        <button onclick="guidedTesting.togglePanel()" 
                class="group bg-slate-900 hover:bg-emerald-600 text-white px-4 py-3 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2.5">
          <div class="relative">
            <i data-lucide="compass" class="w-5 h-5 text-emerald-400 group-hover:text-white"></i>
            <span class="absolute -top-1 -right-1 w-2 h-2 bg-amber-400"></span>
          </div>
          <div class="text-left">
            <span class="block font-black text-xs uppercase tracking-wider">Panduan Tes (${completedCount}/7)</span>
            <span class="block text-[10px] text-slate-300 font-mono">${percent}% Selesai</span>
          </div>
        </button>

        <!-- COLLAPSIBLE MISSION DRAWER / CARD -->
        <div id="guided-test-panel" class="${this.isOpen ? '' : 'hidden'} absolute bottom-16 left-0 w-[92vw] sm:w-[420px] max-h-[80vh] h-[600px] bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col z-50">
          
          <!-- Header -->
          <div class="bg-slate-900 text-white p-4 border-b-2 border-slate-900 flex items-center justify-between shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-1.5 py-0.5 bg-emerald-400 text-slate-900 font-black text-[9px] uppercase">Duolingo Mode</span>
                <span class="text-xs font-bold text-slate-200">Usability Testing</span>
              </div>
              <h3 class="font-extrabold text-sm mt-0.5">7 Tahap Pengujian Sistem</h3>
            </div>
            <button onclick="guidedTesting.togglePanel()" class="p-1 text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Progress Bar & Quick Controls -->
          <div class="bg-slate-100 p-3 border-b-2 border-slate-900 shrink-0">
            <div class="flex justify-between items-center text-xs font-bold mb-1.5">
              <span class="text-slate-800">Progres Keseluruhan:</span>
              <span class="font-mono text-emerald-700 font-black">${completedCount} dari 7 Selesai (${percent}%)</span>
            </div>
            <div class="w-full bg-slate-300 h-2.5 border border-slate-900 flex p-0.5">
              <div class="bg-emerald-600 h-full transition-all duration-300" style="width: ${percent}%;"></div>
            </div>
            
            <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-[11px]">
              <button onclick="guidedTesting.resetCurrentStage()" class="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1">
                <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Ulangi Tahap Ini
              </button>
              <button onclick="guidedTesting.confirmResetAll()" class="text-red-600 hover:text-red-700 font-bold flex items-center gap-1">
                <i data-lucide="trash-2" class="w-3 h-3"></i> Reset Progres
              </button>
            </div>
          </div>

          <!-- Stages List (Scrollable Area) -->
          <div class="flex-grow overflow-y-auto p-4 space-y-3.5 bg-slate-50 text-xs">
            ${completedCount === 7 ? `
              <!-- CELEBRATORY COMPLETION CARD -->
              <div class="p-4 bg-emerald-100 border-2 border-emerald-700 text-emerald-950 text-center space-y-3 shadow-[3px_3px_0px_0px_rgba(4,120,87,1)]">
                <div class="w-12 h-12 bg-emerald-600 text-white flex items-center justify-center mx-auto border-2 border-slate-900">
                  <i data-lucide="award" class="w-6 h-6"></i>
                </div>
                <h4 class="font-black text-sm">Selamat! Seluruh Misi Selesai</h4>
                <p class="text-xs text-emerald-900 leading-relaxed">
                  Terima kasih banyak telah mencoba seluruh 7 tahap alur prototipe. Masukan dan penilaian Anda sangat berharga bagi pengembangan sistem ini.
                </p>
                <button onclick="guidedTesting.showEvaluationModal()" 
                        class="w-full py-2.5 bg-slate-900 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2">
                  <i data-lucide="edit-3" class="w-4 h-4 text-emerald-400"></i>
                  <span>Isi Form Evaluasi Tester</span>
                </button>
              </div>
            ` : ''}

            ${STAGES_CONFIG.map(s => this.renderStageItem(s)).join('')}
          </div>

          <!-- Bottom Footer Action -->
          <div class="p-3 bg-white border-t-2 border-slate-900 shrink-0 flex items-center justify-between text-xs">
            <button onclick="guidedTesting.showIntroModal()" class="text-slate-600 hover:text-blue-600 font-bold flex items-center gap-1">
              <i data-lucide="help-circle" class="w-3.5 h-3.5"></i> Info Study Case
            </button>
            <button onclick="guidedTesting.showEvaluationModal()" 
                    class="px-3 py-1.5 ${completedCount === 7 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-800'} font-bold border border-slate-900 flex items-center gap-1">
              <i data-lucide="clipboard-check" class="w-3.5 h-3.5"></i> Form Evaluasi
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  renderStageItem(stageConf) {
    const sNum = stageConf.stage;
    const stageState = this.progress.stages[sNum] || { completed: false, cases: {} };
    const isCompleted = stageState.completed;
    const isCurrent = this.progress.currentStage === sNum;
    const isLocked = !isCompleted && !isCurrent && sNum > this.progress.currentStage;

    if (isCompleted) {
      // Completed Stage (Green Header, Collapsible or compact)
      return `
        <div class="border-2 border-slate-900 bg-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <div class="p-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
              </div>
              <div>
                <span class="font-extrabold text-xs text-slate-900">${stageConf.title}</span>
                <span class="block text-[10px] text-emerald-800 font-semibold font-mono">Tahap Selesai (100%)</span>
              </div>
            </div>
            <span class="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-200 text-emerald-900">Lulus</span>
          </div>
        </div>
      `;
    }

    if (isCurrent) {
      // Active Current Stage (Highlight, Open with step-by-step checklist)
      return `
        <div class="border-2 border-slate-900 bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          
          <!-- Active Stage Header -->
          <div class="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-xs border border-slate-900">
                <i data-lucide="${stageConf.icon}" class="w-4 h-4"></i>
              </div>
              <div>
                <span class="font-extrabold text-xs block text-white">${stageConf.title}</span>
                <span class="text-[10px] text-amber-300 font-mono">Sedang Berlangsung</span>
              </div>
            </div>
            <span class="px-2 py-0.5 bg-amber-400 text-slate-900 font-black text-[9px] uppercase">Tahap Aktif</span>
          </div>

          <div class="p-3.5 space-y-3">
            <p class="text-xs text-slate-600 leading-relaxed">${stageConf.description}</p>
            
            <!-- Sub-missions (Cases) Checklist -->
            <div class="space-y-2">
              ${stageConf.cases.map(c => {
                const isCaseDone = stageState.cases[c.id] === true;
                return `
                  <div class="p-2.5 border-2 ${isCaseDone ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-slate-50'} flex items-start gap-2.5 transition-all">
                    <div class="w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center font-bold text-xs ${
                      isCaseDone ? 'bg-emerald-600 text-white' : 'border-2 border-slate-400 bg-white text-transparent'
                    }">
                      <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    </div>
                    <div class="flex-grow">
                      <div class="flex items-center justify-between">
                        <span class="font-extrabold text-xs ${isCaseDone ? 'text-emerald-950 line-through' : 'text-slate-900'}">${c.title}</span>
                        ${isCaseDone ? `
                          <span class="text-[9px] font-bold text-emerald-700 bg-emerald-200 px-1 py-0.2">Selesai</span>
                        ` : `
                          <span class="text-[9px] font-bold text-slate-500 font-mono">Belum</span>
                        `}
                      </div>
                      <p class="text-[11px] ${isCaseDone ? 'text-emerald-800' : 'text-slate-600'} mt-0.5 leading-snug">${c.instruction}</p>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

          </div>

        </div>
      `;
    }

    // Locked Stage (Padlock)
    return `
      <div class="border-2 border-slate-300 bg-slate-100 p-3 opacity-60 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-6 h-6 bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-xs">
            <i data-lucide="lock" class="w-3.5 h-3.5"></i>
          </div>
          <div>
            <span class="font-bold text-xs text-slate-700">${stageConf.title}</span>
            <span class="block text-[10px] text-slate-500 font-mono">${stageConf.subtitle}</span>
          </div>
        </div>
        <span class="text-[10px] text-slate-400 font-mono">Terkunci</span>
      </div>
    `;
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
    this.renderWidget();
  }

  updateWidgetUI() {
    this.renderWidget();
  }

  confirmResetAll() {
    if (confirm('Apakah Anda yakin ingin mereset seluruh progres panduan tes? Semua centang tahap akan dikembalikan ke Tahap 1.')) {
      this.resetProgress();
    }
  }

  // --- MODAL INTRO STUDY CASE ---
  showIntroModal() {
    let modal = document.getElementById('modal-intro-study-case');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-intro-study-case';
      modal.className = 'fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-slate-900 text-white p-5 border-b-2 border-slate-900 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 bg-emerald-500 text-slate-900 flex items-center justify-center font-black">
              <i data-lucide="compass" class="w-5 h-5"></i>
            </div>
            <div>
              <span class="px-2 py-0.5 bg-amber-400 text-slate-900 font-black text-[9px] uppercase tracking-wider">Usability Testing</span>
              <h3 class="font-extrabold text-base leading-tight">Panduan Uji Coba Patungan Akun</h3>
            </div>
          </div>
          <button onclick="guidedTesting.closeIntroModal()" class="text-slate-400 hover:text-white">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="p-6 space-y-4 text-xs leading-relaxed text-slate-700">
          <div class="p-3 bg-blue-50 border border-blue-300 text-blue-950 font-medium">
            Selamat datang! Prototipe ini dirancang untuk mensimulasikan sistem informasi patungan akun premium secara menyeluruh. Anda diundang untuk mencoba <b>7 Tahap Alur Pengujian</b> (bergaya interaktif ala Duolingo).
          </div>

          <h4 class="font-black uppercase tracking-wider text-slate-900 text-xs">Alur Pengujian yang Akan Anda Jalani:</h4>
          <ol class="space-y-2 list-decimal list-inside text-slate-800">
            <li><b>Eksplorasi & Pencarian:</b> Cari mandiri di katalog dan tanya Asisten AI.</li>
            <li><b>Cek Ketersediaan Grup:</b> Lihat grup OPEN, durasi paket, dan kondisi produk tanpa grup / expired.</li>
            <li><b>Pengecekan Status Login:</b> Uji pencegatan otomatis saat belum login (*Guest Mode*).</li>
            <li><b>Checkout Pembayaran:</b> Bayar via saldo, transfer manual, dan uji error race condition.</li>
            <li><b>Verifikasi Admin:</b> Uji persetujuan (Approve) dan penolakan (Reject + Upload Ulang).</li>
            <li><b>Masa Tunggu & Garansi Refund:</b> Uji grup kuota penuh vs simulasi refund waktu habis.</li>
            <li><b>Akses Kredensial Akun:</b> Ambil email, password, dan PIN akun yang telah aktif.</li>
          </ol>

          <p class="text-[11px] text-slate-500">
            Setiap aksi yang Anda lakukan akan <b>otomatis terdeteksi</b> oleh sistem panduan di pojok kiri bawah. Di akhir pengujian, mohon luangkan 1 menit untuk mengisi form evaluasi singkat.
          </p>
        </div>

        <div class="p-4 bg-slate-100 border-t-2 border-slate-900 flex flex-col sm:flex-row justify-end gap-2">
          <button onclick="guidedTesting.closeIntroModal()" class="px-4 py-2 border border-slate-900 bg-white font-bold text-xs hover:bg-slate-50">
            Jelajah Bebas
          </button>
          <button onclick="guidedTesting.startStage1()" class="px-5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-1.5">
            <span>Mulai Misi Tahap 1</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  closeIntroModal() {
    const modal = document.getElementById('modal-intro-study-case');
    if (modal) modal.classList.add('hidden');
    this.progress.introSeen = true;
    this.saveProgress();
  }

  startStage1() {
    this.closeIntroModal();
    this.isOpen = true;
    this.progress.currentStage = 1;
    this.saveProgress();
    this.renderWidget();
    if (window.app && typeof window.app.navigate === 'function') {
      window.app.navigate('home');
    }
  }

  // --- FORM EVALUASI TESTER (MODAL) ---
  showEvaluationModal() {
    let modal = document.getElementById('modal-evaluation-form');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-evaluation-form';
      modal.className = 'fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    const completedCount = this.getCompletedStagesCount();
    const currentUser = (window.patunganState && window.patunganState.getCurrentUser()) || {};
    const defaultName = (currentUser && !currentUser.isGuest) ? currentUser.name : '';

    modal.innerHTML = `
      <div class="bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] max-w-xl w-full max-h-[92vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="bg-slate-900 text-white p-5 border-b-2 border-slate-900 flex items-center justify-between sticky top-0 z-10">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 bg-blue-600 text-white flex items-center justify-center font-bold">
              <i data-lucide="clipboard-check" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="font-black text-sm uppercase tracking-wide">Form Evaluasi Pengujian Tester</h3>
              <span class="text-[10px] text-slate-300 font-mono">Progres Misi Anda: ${completedCount}/7 Tahap Selesai</span>
            </div>
          </div>
          <button onclick="guidedTesting.closeEvaluationModal()" class="text-slate-400 hover:text-white">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div id="evaluation-form-container" class="p-6">
          <form onsubmit="guidedTesting.handleEvaluationSubmit(event)" class="space-y-4 text-xs">
            
            <p class="text-slate-600 leading-relaxed">
              Seluruh masukan Anda disimpan secara terstruktur (JSON) untuk keperluan riset antarmuka dan pengembangan sistem informasi. Semua pertanyaan di bawah ini <b>wajib diisi</b>.
            </p>

            <!-- 1. Nama Tester -->
            <div>
              <label class="block font-bold text-slate-800 uppercase mb-1">
                1. Nama Lengkap / Panggilan Tester <span class="text-red-500">*</span>
              </label>
              <input type="text" id="eval-name" required value="${defaultName}" placeholder="cth: Budi Santoso / Rian" 
                     class="w-full px-3 py-2 border-2 border-slate-900 font-medium focus:outline-none focus:bg-blue-50" />
            </div>

            <!-- 2. Rating Workflow -->
            <div>
              <label class="block font-bold text-slate-800 uppercase mb-1">
                2. Penilaian Kemudahan Alur Kerja (Workflow) <span class="text-red-500">*</span>
              </label>
              <div class="grid grid-cols-5 gap-2 text-center" id="rating-workflow-group">
                ${[1, 2, 3, 4, 5].map(val => `
                  <button type="button" onclick="guidedTesting.setWorkflowRating(${val})" 
                          id="btn-wf-${val}"
                          class="py-2 border-2 border-slate-300 hover:border-slate-900 font-black text-xs transition-all">
                    ★ ${val}
                    <span class="block text-[9px] font-normal text-slate-500">${val === 1 ? 'Sulit' : val === 5 ? 'Sangat Mudah' : ''}</span>
                  </button>
                `).join('')}
              </div>
              <input type="hidden" id="eval-rating-wf" required value="" />
            </div>

            <!-- 3. Rating UI/UX -->
            <div>
              <label class="block font-bold text-slate-800 uppercase mb-1">
                3. Penilaian Tampilan & Kenyamanan (UI/UX) <span class="text-red-500">*</span>
              </label>
              <div class="grid grid-cols-5 gap-2 text-center" id="rating-uiux-group">
                ${[1, 2, 3, 4, 5].map(val => `
                  <button type="button" onclick="guidedTesting.setUiuxRating(${val})" 
                          id="btn-ui-${val}"
                          class="py-2 border-2 border-slate-300 hover:border-slate-900 font-black text-xs transition-all">
                    ★ ${val}
                    <span class="block text-[9px] font-normal text-slate-500">${val === 1 ? 'Kaku' : val === 5 ? 'Sangat Nyaman' : ''}</span>
                  </button>
                `).join('')}
              </div>
              <input type="hidden" id="eval-rating-ui" required value="" />
            </div>

            <!-- 4. Kekurangan Alur / Workflow -->
            <div>
              <label class="block font-bold text-slate-800 uppercase mb-1">
                4. Apa yang kurang atau membingungkan dari alur (workflow) user? <span class="text-red-500">*</span>
              </label>
              <textarea id="eval-workflow-critique" required rows="2" placeholder="cth: Alur verifikasi transfer manual butuh konfirmasi WhatsApp, dll..." 
                        class="w-full px-3 py-2 border-2 border-slate-900 font-medium focus:outline-none focus:bg-blue-50"></textarea>
            </div>

            <!-- 5. Kekurangan UI/UX -->
            <div>
              <label class="block font-bold text-slate-800 uppercase mb-1">
                5. Apa yang kurang dari segi tampilan UI/UX atau kenyamanan visual? <span class="text-red-500">*</span>
              </label>
              <textarea id="eval-uiux-critique" required rows="2" placeholder="cth: Kontras warna di badge status kurang mencolok, tombol salin perlu ikon feedback, dll..." 
                        class="w-full px-3 py-2 border-2 border-slate-900 font-medium focus:outline-none focus:bg-blue-50"></textarea>
            </div>

            <!-- 6. Saran Pengembangan -->
            <div>
              <label class="block font-bold text-slate-800 uppercase mb-1">
                6. Saran pengembangan atau ide fitur tambahan? <span class="text-red-500">*</span>
              </label>
              <textarea id="eval-suggestions" required rows="2" placeholder="cth: Tambahkan fitur pengingat perpanjangan masa aktif via SMS/Email..." 
                        class="w-full px-3 py-2 border-2 border-slate-900 font-medium focus:outline-none focus:bg-blue-50"></textarea>
            </div>

            <!-- Submit Button -->
            <div class="pt-3 border-t-2 border-slate-900 flex justify-end gap-2">
              <button type="button" onclick="guidedTesting.closeEvaluationModal()" class="px-4 py-2 border border-slate-900 bg-white font-bold text-xs">
                Batal
              </button>
              <button type="submit" 
                      class="px-6 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 transition-all">
                <i data-lucide="send" class="w-4 h-4"></i>
                <span>Simpan & Kirim Evaluasi</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  setWorkflowRating(val) {
    this.selectedWorkflowRating = val;
    const input = document.getElementById('eval-rating-wf');
    if (input) input.value = val;

    for (let i = 1; i <= 5; i++) {
      const btn = document.getElementById(`btn-wf-${i}`);
      if (btn) {
        if (i === val) {
          btn.className = 'py-2 border-2 border-slate-900 bg-slate-900 text-white font-black text-xs shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]';
        } else {
          btn.className = 'py-2 border-2 border-slate-300 hover:border-slate-800 text-slate-800 font-bold text-xs';
        }
      }
    }
  }

  setUiuxRating(val) {
    this.selectedUiuxRating = val;
    const input = document.getElementById('eval-rating-ui');
    if (input) input.value = val;

    for (let i = 1; i <= 5; i++) {
      const btn = document.getElementById(`btn-ui-${i}`);
      if (btn) {
        if (i === val) {
          btn.className = 'py-2 border-2 border-slate-900 bg-slate-900 text-white font-black text-xs shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]';
        } else {
          btn.className = 'py-2 border-2 border-slate-300 hover:border-slate-800 text-slate-800 font-bold text-xs';
        }
      }
    }
  }

  handleEvaluationSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('eval-name').value.trim();
    const wfRating = this.selectedWorkflowRating;
    const uiRating = this.selectedUiuxRating;
    const wfCritique = document.getElementById('eval-workflow-critique').value.trim();
    const uiCritique = document.getElementById('eval-uiux-critique').value.trim();
    const suggestions = document.getElementById('eval-suggestions').value.trim();

    if (!wfRating || !uiRating) {
      alert('Mohon berikan penilaian bintang (1-5) untuk Kemudahan Alur dan Tampilan UI/UX.');
      return;
    }

    const completedStages = this.getCompletedStagesCount();

    const feedbackData = {
      id: 'FB-' + Date.now().toString().slice(-6),
      submittedAt: new Date().toISOString(),
      testerName: name,
      workflowRating: wfRating,
      uiuxRating: uiRating,
      workflowFeedback: wfCritique,
      uiuxFeedback: uiCritique,
      futureSuggestions: suggestions,
      stagesCompleted: `${completedStages}/7`,
      environment: {
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
      }
    };

    // 1. Simpan ke localStorage (array feedback)
    let storedList = [];
    try {
      const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (raw) storedList = JSON.parse(raw);
    } catch (e) {
      storedList = [];
    }
    storedList.unshift(feedbackData);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(storedList));

    // 2. Kirim otomatis via fetch jika FEEDBACK_ENDPOINT disetel
    if (FEEDBACK_ENDPOINT && FEEDBACK_ENDPOINT.trim() !== '') {
      fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      }).catch(err => console.warn('Gagal POST webhook feedback:', err));
    }

    // 3. Tampilkan layar sukses & export actions
    this.renderEvaluationSuccess(feedbackData);
  }

  renderEvaluationSuccess(data) {
    const container = document.getElementById('evaluation-form-container');
    if (!container) return;

    const waText = encodeURIComponent(
      `*EVALUASI TESTER - PROTOTIPE PATUNGAN AKUN*\n` +
      `--------------------------------------\n` +
      `👤 Nama: ${data.testerName}\n` +
      `📅 Waktu: ${new Date(data.submittedAt).toLocaleString('id-ID')}\n` +
      `🎯 Progres Misi: ${data.stagesCompleted} Tahap\n` +
      `⭐ Rating Workflow: ${data.workflowRating}/5\n` +
      `🎨 Rating UI/UX: ${data.uiuxRating}/5\n\n` +
      `*Masukan Alur (Workflow):*\n${data.workflowFeedback}\n\n` +
      `*Masukan Tampilan (UI/UX):*\n${data.uiuxFeedback}\n\n` +
      `*Saran Fitur Baru:*\n${data.futureSuggestions}`
    );

    const jsonString = JSON.stringify(data, null, 2);

    container.innerHTML = `
      <div class="space-y-4 text-center py-2">
        <div class="w-12 h-12 bg-emerald-600 text-white flex items-center justify-center mx-auto border-2 border-slate-900">
          <i data-lucide="check-circle" class="w-6 h-6"></i>
        </div>
        <h4 class="font-black text-base text-slate-900">Evaluasi Anda Berhasil Disimpan!</h4>
        <p class="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
          Data evaluasi telah tersimpan rapi dalam format JSON di database lokal browser. Silakan pilih cara pengiriman atau unduh file evaluasi di bawah ini:
        </p>

        <!-- Action Buttons -->
        <div class="space-y-2 pt-2">
          
          <!-- WhatsApp Share -->
          <a href="https://wa.me/?text=${waText}" target="_blank" 
             class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2">
            <i data-lucide="message-circle" class="w-4 h-4"></i>
            <span>Kirim Hasil via WhatsApp</span>
          </a>

          <!-- Download JSON -->
          <button onclick="guidedTesting.downloadJSON('${data.id}')" 
                  class="w-full py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>Download File JSON (feedback-tester.json)</span>
          </button>

          <!-- Copy JSON -->
          <button onclick="guidedTesting.copyRawJSON('${data.id}')" 
                  class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-900 flex items-center justify-center gap-2">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            <span>Salin Format JSON ke Clipboard</span>
          </button>

        </div>

        <div class="pt-4 border-t border-slate-200">
          <button onclick="guidedTesting.closeEvaluationModal()" class="text-xs text-slate-500 hover:text-slate-900 font-bold underline">
            Selesai & Tutup Jendela
          </button>
        </div>

      </div>
    `;

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  downloadJSON(feedbackId) {
    const list = this.getAllFeedbacks();
    const item = list.find(f => f.id === feedbackId) || list[0];
    if (!item) return;

    const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${item.testerName.replace(/\s+/g, '_')}-${item.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadAllFeedbacksJSON() {
    const list = this.getAllFeedbacks();
    if (list.length === 0) {
      alert('Belum ada data evaluasi tester yang tersimpan.');
      return;
    }

    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `semua-feedback-tester-${Date.now().toString().slice(-4)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  copyRawJSON(feedbackId) {
    const list = this.getAllFeedbacks();
    const item = list.find(f => f.id === feedbackId) || list[0];
    if (!item) return;

    navigator.clipboard.writeText(JSON.stringify(item, null, 2)).then(() => {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Data JSON berhasil disalin ke clipboard!', 'success');
      } else {
        alert('Data JSON berhasil disalin!');
      }
    });
  }

  getAllFeedbacks() {
    try {
      const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  closeEvaluationModal() {
    const modal = document.getElementById('modal-evaluation-form');
    if (modal) modal.classList.add('hidden');
  }
}

// Inisialisasi global instance GuidedTestingManager
window.guidedTesting = new GuidedTestingManager();
