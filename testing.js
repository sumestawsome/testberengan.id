/**
 * testing.js - Mode Panduan Pengujian Interaktif (Strict Sequential Mode ala Duolingo)
 * & Form Evaluasi Tester (Google Sheets Apps Script Integration)
 * 
 * Sistem pengujian ketat per sub-tahap dengan tombol mulai, auto-minimize drawer,
 * blinking spotlight clue otomatis saat idle/salah klik, dan mini-evaluasi di setiap sub-tahap.
 */

// Konfigurasi Webhook Pengumpulan Evaluasi (Google Sheets Apps Script)
const FEEDBACK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbykaOSYXww74FwrN4NoMvxWEu4kLzryNe2H-OB-mr1_S9j2U1-4Gdunjt3inVyZWGdU/exec';

const TEST_PROGRESS_KEY = 'patungan_guided_test_progress_v2';
const FEEDBACK_STORAGE_KEY = 'patungan_feedback_json';

// Definisi 7 Tahap & 13 Sub-Misi Pengujian Terstruktur
const STAGES_CONFIG = window.STAGES_CONFIG = [
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
        expectedAction: ['SEARCH_CATALOG', 'FILTER_CATEGORY'],
        instruction: 'Ketik nama aplikasi di kolom search katalog (misal: "netflix" atau "canva") ATAU klik salah satu tab kategori (Streaming, Desain, dll).',
        hint: 'Coba ketik kata kunci di kolom pencarian pada bagian atas katalog.',
        clueText: 'Ketik kata kunci di kolom pencarian atau klik salah satu tab kategori di bagian atas katalog.',
        targetSelector: '#catalog-search, button[onclick*="setCategoryFilter"]',
        viewRequired: 'home'
      },
      {
        id: '1B',
        title: 'Case 1B (Bantuan AI Chatbot)',
        expectedAction: ['CHATBOT_SENT'],
        instruction: 'Buka widget "Tanya Asisten AI" di pojok kanan bawah, lalu klik quick prompt "Paket di bawah 25rb?" atau tanyakan paket hemat/murah di bawah 25rb.',
        hint: 'Klik tombol mengambang hitam bertuliskan "Tanya Asisten AI".',
        clueText: 'Buka widget Asisten AI lalu klik tombol quick prompt "Paket di bawah 25rb?" atau ketik pertanyaan tentang paket di bawah 25rb.',
        targetSelector: '#ai-chat-trigger, #ai-chat-window button[onclick*="Paket di bawah 25rb"], #ai-chat-input',
        viewRequired: 'any'
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
        expectedAction: ['VIEW_PRODUCT_DETAIL_OPEN_GROUP'],
        instruction: 'Buka detail produk Canva Pro dari katalog, lalu ganti pilihan durasi paket langganan dari 1 Bulan ke 3 Bulan.',
        hint: 'Klik "Pilih Paket & Grup" pada Canva Pro di katalog, lalu klik tombol durasi "3 Bulan".',
        clueText: 'Buka Canva Pro dari katalog, lalu klik tombol durasi paket "3 Bulan".',
        targetSelector: '#card-btn-prod_canva, #plan-btn-3_month, button[onclick*="\'3_month\'"]',
        viewRequired: 'product-detail'
      },
      {
        id: '2B',
        title: 'Case 2B (Cek Produk Tanpa Grup / Expired)',
        expectedAction: ['REQUEST_NEW_GROUP'],
        instruction: 'Buka detail produk Spotify Premium Family (0 grup tersedia) di katalog, lalu klik tombol "Request Buka Grup Baru".',
        hint: 'Buka produk Spotify di katalog dan klik "Request Buka Grup Baru".',
        clueText: 'Buka produk Spotify di katalog, lalu klik tombol hijau "Request Buka Grup Baru".',
        targetSelector: '#card-btn-prod_spotify, #btn-request-new-group, button[onclick*="requestNewGroup"]',
        viewRequired: 'product-detail'
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
        expectedAction: ['GUEST_INTERCEPT_AND_LOGIN'],
        instruction: 'Klik tombol Logout di profil navbar untuk masuk ke "Mode Tamu", lalu klik tombol "Gabung Grup Ini" pada salah satu produk hingga muncul Modal Login, kemudian masuk kembali (misal pilih akun Budi Santoso).',
        hint: 'Logout dulu dari navbar, lalu coba klik "Gabung Grup Ini". Setelah modal login muncul, pilih Budi Santoso.',
        clueText: 'Klik tombol logout di navbar untuk masuk ke Mode Tamu, lalu klik tombol "Gabung Grup Ini" dan pilih akun Budi Santoso.',
        targetSelector: '#nav-user-pill button[onclick*="logoutUser"], #nav-user-pill, button[onclick*="handleJoinGroup"], #login-preset-users div:first-child',
        viewRequired: 'any'
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
        expectedAction: ['CHECKOUT_TRANSFER_MANUAL'],
        instruction: 'Lakukan checkout pada salah satu grup dengan memilih metode "Transfer Manual (BCA/Mandiri/QRIS)", unggah file bukti transfer, lalu klik Konfirmasi & Bayar.',
        hint: 'Di checkout, pilih Transfer Manual dan upload bukti transfer.',
        clueText: 'Di halaman Checkout, pilih metode Transfer Manual lalu klik "Konfirmasi & Bayar".',
        targetSelector: 'button[onclick*="handleJoinGroup"], button[onclick*="TRANSFER_MANUAL"], button[onclick*="submitCheckout"]',
        viewRequired: 'checkout'
      },
      {
        id: '4B',
        title: 'Case 4B (Bayar Pakai Saldo Dompet)',
        expectedAction: ['CHECKOUT_SALDO'],
        instruction: 'Lakukan checkout dengan metode "Bayar Pakai Saldo Dompet". Jika saldo kurang, lakukan Top Up Saldo terlebih dahulu.',
        hint: 'Pilih metode Bayar Pakai Saldo lalu selesaikan pembayaran.',
        clueText: 'Lakukan checkout grup lain dengan metode "Bayar Pakai Saldo Dompet" dan selesaikan pembayaran.',
        targetSelector: 'button[onclick*="handleJoinGroup"], button[onclick*="SALDO"], button[onclick*="submitCheckout"]',
        viewRequired: 'checkout'
      },
      {
        id: '4C',
        title: 'Case 4C (Simulasi Slot Diserobot)',
        expectedAction: ['RACE_CONDITION_TRIGGERED'],
        instruction: 'Di halaman Checkout, klik simulator kuning "Simulasikan Slot Diserobot Orang Lain (Penuh)", lalu klik tombol "Konfirmasi & Bayar" untuk menguji penolakan ramah saat slot habis.',
        hint: 'Gunakan kotak kuning "Simulator Edge Case" di halaman Checkout, lalu klik Konfirmasi & Bayar.',
        clueText: 'Klik tombol simulator kuning "Simulasikan Slot Diserobot Orang Lain", lalu klik tombol "Konfirmasi & Bayar".',
        targetSelector: '#btn-simulate-race, #btn-submit-checkout, button[onclick*="submitCheckout"]',
        viewRequired: 'checkout'
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
        expectedAction: ['ADMIN_APPROVE_ORDER'],
        instruction: 'Buka menu "Mode Admin (Tester)" di navbar, lalu klik tombol "Approve" pada salah satu pesanan berstatus Menunggu Verifikasi.',
        hint: 'Klik tombol Mode Admin (Tester) berwarna kuning di navbar, lalu Approve pesanan pending.',
        clueText: 'Buka menu Mode Admin (Tester) di navbar, lalu klik tombol Approve pada pesanan pending.',
        targetSelector: '#nav-btn-admin, button[onclick*="adminApproveOrder"]',
        viewRequired: 'admin'
      },
      {
        id: '5B',
        title: 'Case 5B (Reject & Upload Ulang Bukti)',
        expectedAction: ['REUPLOAD_PROOF_SUBMITTED'],
        instruction: 'Di Mode Admin, klik "Reject" pada pesanan transfer, lalu buka menu "Pesanan & Dompet" dan klik tombol "Upload Ulang Bukti" pada pesanan yang ditolak tersebut.',
        hint: 'Tolak salah satu pesanan di Mode Admin, lalu buka Pesanan Saya dan unggah bukti baru.',
        clueText: 'Tolak pesanan di Mode Admin, lalu ke Pesanan & Dompet dan klik "Upload Ulang Bukti".',
        targetSelector: 'button[onclick*="adminRejectPrompt"], #nav-btn-orders, button[onclick*="showReuploadProofModal"], button[onclick*="submitReuploadProof"]',
        viewRequired: 'admin'
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
        title: 'Case 6A/B (Grup Penuh - Akun Aktif)',
        expectedAction: ['GROUP_ACTIVATED'],
        instruction: 'Buat salah satu grup menjadi penuh dan AKTIF (bisa dengan bergabung slot ke-5 Netflix Grup #05, atau klik "Simulasikan Penuh" pada grup OPEN di Mode Admin).',
        hint: 'Gunakan tombol "Simulasikan Penuh (Aktifkan)" di Mode Admin.',
        clueText: 'Buka Mode Admin lalu klik tombol hijau "Simulasikan Penuh (Aktifkan)" pada salah satu grup OPEN.',
        targetSelector: '#nav-btn-admin, button[onclick*="adminSimulateFillGroup"]',
        viewRequired: 'admin'
      },
      {
        id: '6C',
        title: 'Case 6C (Simulasi Waktu Habis & Auto-Refund)',
        expectedAction: ['SIMULATE_EXPIRE_REFUND'],
        instruction: 'Di Mode Admin, klik tombol merah "Simulasikan Waktu Habis (Expired & Refund)" pada salah satu grup OPEN, lalu periksa saldo bertambah di halaman Pesanan & Dompet.',
        hint: 'Klik tombol "Simulasikan Waktu Habis" di Mode Admin untuk menguji pengembalian dana 100%.',
        clueText: 'Buka Mode Admin lalu klik tombol merah "Simulasikan Waktu Habis (Expired & Refund)".',
        targetSelector: '#nav-btn-admin, button[onclick*="adminSimulateExpireGroup"]',
        viewRequired: 'admin'
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
        expectedAction: ['VIEW_CREDENTIALS_AND_INTERACT'],
        instruction: 'Buka menu "Pesanan & Dompet", klik "Lihat Detail Akun" pada pesanan Aktif, lalu klik tombol intip password atau tombol salin kredensial.',
        hint: 'Pada pesanan berstatus Aktif, klik "Lihat Detail Akun" dan coba salin password atau email.',
        clueText: 'Buka Pesanan & Dompet, klik "Lihat Detail Akun" pada pesanan Aktif, lalu coba salin atau intip password.',
        targetSelector: '#nav-btn-orders, button[onclick*="showCredentialsModal"], button[onclick*="togglePasswordVisibility"], button[onclick*="copyToClipboard"]',
        viewRequired: 'my-orders'
      }
    ]
  }
];

class GuidedTestingManager {
  constructor() {
    this.isOpen = false;
    this.isMinimized = false;
    this.clueActive = false;
    this.clueLevel = 0;
    this.clarifiedClueText = '';
    this.idleTimerL1 = null;
    this.idleTimerL2 = null;
    this.ghostTypeInterval = null;
    this.selectedStepExperience = '';
    this.selectedWorkflowRating = 0;
    this.selectedUiuxRating = 0;
    this.init();
  }

  init() {
    this.injectSpotlightStyles();
    this.loadProgress();
    this.bindEventListeners();
    this.renderWidget();

    // Tampilkan Intro Study Case otomatis untuk tester baru
    if (!this.progress.introSeen) {
      setTimeout(() => this.showIntroModal(), 600);
    }
  }

  injectSpotlightStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('guided-spotlight-styles')) return;

    const style = document.createElement('style');
    style.id = 'guided-spotlight-styles';
    style.textContent = `
      .guided-spotlight-active {
        outline: 3px solid #f59e0b !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.3), 0 0 16px rgba(245, 158, 11, 0.7) !important;
        animation: guided-spotlight-pulse 1.2s infinite ease-in-out !important;
        position: relative !important;
      }
      @keyframes guided-spotlight-pulse {
        0%, 100% {
          outline-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25), 0 0 12px rgba(245, 158, 11, 0.5);
        }
        50% {
          outline-color: #fbbf24;
          box-shadow: 0 0 0 6px rgba(251, 191, 36, 0.45), 0 0 22px rgba(251, 191, 36, 0.85);
        }
      }
      .spotlight-badge {
        animation: guided-badge-bounce 0.9s infinite alternate ease-in-out;
      }
      @keyframes guided-badge-bounce {
        0% { transform: translateY(0); }
        100% { transform: translateY(-4px); }
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
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
        // Validasi struktur state v2
        if (typeof this.progress.currentStageIndex === 'undefined' || !this.progress.completedCases) {
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
    return {
      introSeen: false,
      currentStageIndex: 0,
      currentSubCaseIndex: 0,
      isSubCaseRunning: false,
      completedCases: {},
      stepReviews: [],
      isFinished: false
    };
  }

  saveProgress() {
    localStorage.setItem(TEST_PROGRESS_KEY, JSON.stringify(this.progress));
  }

  resetProgress() {
    this.clearClueSpotlight();
    this.progress = this.getDefaultProgress();
    this.progress.introSeen = true;
    this.isMinimized = false;
    this.isOpen = true;
    this.saveProgress();
    this.sanitizeWorkspaceForCase('1A');
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('Progres panduan tes berhasil direset ke Tahap 1.', 'info');
    }
    this.renderWidget();
  }

  resetCurrentStage() {
    this.clearClueSpotlight();
    const curStage = STAGES_CONFIG[this.progress.currentStageIndex];
    if (curStage) {
      curStage.cases.forEach(c => {
        if (this.progress.completedCases) delete this.progress.completedCases[c.id];
      });
      this.progress.currentSubCaseIndex = 0;
      this.progress.isSubCaseRunning = false;
      this.saveProgress();
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`Sub-misi Tahap ${curStage.stage} telah direset. Silakan mulai kembali.`, 'info');
      }
      this.renderWidget();
    }
  }

  confirmResetAll() {
    if (confirm('Apakah Anda yakin ingin mereset seluruh progres panduan tes? Semua centang tahap akan dikembalikan ke Tahap 1.')) {
      this.resetProgress();
    }
  }

  // --- EVENT LISTENERS DARI APLIKASI UTAMA ---
  bindEventListeners() {
    window.addEventListener('patungan_test_event', (e) => {
      this.handleTestEvent(e.detail);
    });

    const handleSync = () => {
      if (this.progress && this.progress.isSubCaseRunning) {
        this.renderWidget();
        if (this.clueActive) {
          setTimeout(() => this.reapplySpotlight(), 50);
        }
      }
    };

    window.addEventListener('patungan_ui_changed', handleSync);

    window.addEventListener('hashchange', () => {
      this.removeExampleBalloon();
      handleSync();
    });

    window.addEventListener('patungan_state_updated', handleSync);
  }

  // --- VALIDASI KETAT PER SUB-TAHAP ---
  handleTestEvent(detail) {
    if (!detail || !detail.action) return;
    if (this.progress.isFinished) return;

    const currentStage = STAGES_CONFIG[this.progress.currentStageIndex];
    if (!currentStage) return;

    const currentSubCase = currentStage.cases[this.progress.currentSubCaseIndex];
    if (!currentSubCase) return;

    // 1. Cek apakah sub-kasus ini sedang berstatus "RUNNING"
    if (!this.progress.isSubCaseRunning) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`Klik "Mulai Sub-Tes Ini" pada panduan misi sebelum menjalankan aksi.`, 'info');
      }
      return;
    }

    // 2. Cek apakah aksi cocok dengan sub-kasus yang aktif
    const matchesAction = currentSubCase.expectedAction.includes(detail.action);

    if (!matchesAction) {
      // Tester melakukan aksi yang tidak sesuai dengan sub-kasus aktif
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`Misi aktif saat ini: ${currentSubCase.title}. Selesaikan misi ini terlebih dahulu.`, 'info');
      }
      // Langsung picu clue dan kedip-kedip spotlight karena aksi salah
      this.activateClueSpotlight();
      return;
    }

    // 3. Validasi Konten Spesifik Tambahan per Sub-Kasus
    if (currentSubCase.id === '1B' && detail.action === 'CHATBOT_SENT') {
      const text = (detail.text || '').toLowerCase();
      const hasBudgetKeyword = text.includes('25') || text.includes('murah') || text.includes('hemat') || text.includes('dibawah');
      if (!hasBudgetKeyword) {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast("Coba klik quick prompt 'Paket < 25rb?' atau ketik pertanyaan tentang paket di bawah 25rb.", 'info');
        }
        this.activateClueSpotlight();
        return;
      }
    }

    if (currentSubCase.id === '2A' && detail.action === 'VIEW_PRODUCT_DETAIL_OPEN_GROUP') {
      if (detail.planKey !== '3_month') {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast("Silakan ganti pilihan durasi paket ke 3 Bulan.", 'info');
        }
        this.activateClueSpotlight();
        return;
      }
    }

    // 4. Aksi Cocok & Tepat! Selesaikan sub-kasus ini
    this.handleSubCaseSuccess(currentStage, currentSubCase);
  }

  handleSubCaseSuccess(stage, subCase) {
    this.clearClueSpotlight();
    this.progress.isSubCaseRunning = false;
    this.progress.completedCases[subCase.id] = true;
    this.saveProgress();
    this.sanitizeWorkspaceForCase(subCase.id);

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`Sub-misi ${subCase.id} selesai. Silakan isi ulasan langkah ini.`, 'success');
    }

    this.renderWidget();
    this.showStepMicroReviewModal(stage, subCase);
  }

  // --- CLUE & SPOTLIGHT BLINKING (ESKALASI 2 LEVEL) ---
  startIdleClueTimer() {
    this.clearClueTimers();
    // Detik ke-10: Clue Level 1 (Blinking Spotlight)
    this.idleTimerL1 = setTimeout(() => {
      if (this.progress && this.progress.isSubCaseRunning) {
        this.activateClueLevel1();
      }
    }, 10000);

    // Detik ke-15: Clue Level 2 (Interactive Input Example / Clarified Button Instruction)
    this.idleTimerL2 = setTimeout(() => {
      if (this.progress && this.progress.isSubCaseRunning) {
        this.activateClueLevel2();
      }
    }, 15000);
  }

  clearClueTimers() {
    if (this.idleTimerL1) clearTimeout(this.idleTimerL1);
    if (this.idleTimerL2) clearTimeout(this.idleTimerL2);
    if (this.ghostTypeInterval) clearInterval(this.ghostTypeInterval);
    this.idleTimerL1 = null;
    this.idleTimerL2 = null;
    this.ghostTypeInterval = null;
  }

  activateClueSpotlight() {
    this.activateClueLevel1();
    if (this.idleTimerL2) clearTimeout(this.idleTimerL2);
    this.idleTimerL2 = setTimeout(() => {
      if (this.progress && this.progress.isSubCaseRunning) {
        this.activateClueLevel2();
      }
    }, 5000);
  }

  activateClueLevel1() {
    this.clueActive = true;
    this.clueLevel = 1;
    this.reapplySpotlight();
    this.renderWidget();
  }

  activateClueLevel2() {
    this.clueActive = true;
    this.clueLevel = 2;
    const curStage = STAGES_CONFIG[this.progress.currentStageIndex];
    if (!curStage) return;
    const curCase = curStage.cases[this.progress.currentSubCaseIndex];
    if (!curCase) return;

    const targetEl = this.findSmartTargetElement(curCase);
    if (targetEl && targetEl.tagName === 'INPUT') {
      this.showInteractiveInputBalloon(targetEl, curCase);
    } else if (targetEl) {
      this.clarifyButtonClueText(targetEl, curCase);
    }
    this.renderWidget();
  }

  showInteractiveInputBalloon(inputEl, curCase) {
    this.removeExampleBalloon();
    if (typeof document === 'undefined') return;

    const balloon = document.createElement('div');
    balloon.id = 'guided-example-balloon';
    balloon.className = 'fixed z-[60] bg-slate-900 text-white p-3 border-2 border-amber-400 shadow-xl max-w-xs text-xs';
    
    const exampleVal = curCase.id === '1A' ? 'canva' : 'paket di bawah 25rb';
    
    balloon.innerHTML = `
      <div class="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-700">
        <span class="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
          <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Contoh Ketikan Bantuan:
        </span>
        <button onclick="guidedTesting.removeExampleBalloon()" class="text-slate-400 hover:text-white p-0.5">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
      <div class="mb-2 text-[11px] text-slate-200 leading-snug">
        Ketik misalnya: <b class="font-mono text-amber-300" id="ghost-typing-slot"></b><span class="animate-pulse font-mono text-amber-400">|</span>
      </div>
      <div class="flex justify-end">
        <button onclick="guidedTesting.applyExampleInput('${exampleVal}')" 
                class="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-colors">
          <i data-lucide="check" class="w-3 h-3"></i>
          <span>Pakai Contoh Ini</span>
        </button>
      </div>
    `;

    document.body.appendChild(balloon);

    if (typeof inputEl.getBoundingClientRect === 'function') {
      const rect = inputEl.getBoundingClientRect();
      const topPos = Math.max(10, rect.top - 85);
      const leftPos = Math.max(10, Math.min(window.innerWidth - 300, rect.left));
      balloon.style.position = 'fixed';
      balloon.style.top = `${topPos}px`;
      balloon.style.left = `${leftPos}px`;
    }

    let charIndex = 0;
    const ghostEl = document.getElementById('ghost-typing-slot');
    if (this.ghostTypeInterval) clearInterval(this.ghostTypeInterval);
    this.ghostTypeInterval = setInterval(() => {
      if (!ghostEl) return;
      charIndex = (charIndex + 1) % (exampleVal.length + 8);
      if (charIndex <= exampleVal.length) {
        ghostEl.innerText = exampleVal.slice(0, charIndex);
      } else {
        ghostEl.innerText = exampleVal;
      }
    }, 140);

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  applyExampleInput(val) {
    this.removeExampleBalloon();
    const curStage = STAGES_CONFIG[this.progress.currentStageIndex];
    const curCase = curStage?.cases[this.progress.currentSubCaseIndex];

    if (curCase && curCase.id === '1A') {
      const searchInput = document.getElementById('catalog-search');
      if (searchInput) {
        searchInput.value = val;
        searchInput.focus();
        if (window.app && typeof window.app.handleSearchInput === 'function') {
          window.app.handleSearchInput(val);
        }
      }
    } else if (curCase && curCase.id === '1B') {
      const chatInput = document.getElementById('ai-chat-input');
      if (chatInput) {
        chatInput.value = val;
        chatInput.focus();
        if (window.app && typeof window.app.sendChatMessage === 'function') {
          window.app.sendChatMessage(val);
        }
      }
    }
  }

  removeExampleBalloon() {
    if (this.ghostTypeInterval) clearInterval(this.ghostTypeInterval);
    this.ghostTypeInterval = null;
    if (typeof document !== 'undefined') {
      const b = document.getElementById('guided-example-balloon');
      if (b) b.remove();
    }
  }

  clarifyButtonClueText(targetEl, curCase) {
    if (!targetEl) return;
    let label = (targetEl.innerText || targetEl.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
    if (label.length > 30) label = label.slice(0, 30) + '...';

    if (targetEl.id === 'nav-btn-home' || targetEl.getAttribute('onclick')?.includes("'home'")) {
      this.clarifiedClueText = 'Klik menu "Katalog Produk" di atas yang sedang berkedip kuning untuk kembali ke halaman utama.';
    } else if (targetEl.id === 'nav-btn-orders' || targetEl.getAttribute('onclick')?.includes("'my-orders'")) {
      this.clarifiedClueText = 'Klik menu "Pesanan & Dompet" di atas yang sedang berkedip kuning.';
    } else if (targetEl.id === 'nav-btn-admin' || targetEl.getAttribute('onclick')?.includes("'admin'")) {
      this.clarifiedClueText = 'Klik tombol "Mode Admin (Tester)" di atas yang sedang berkedip kuning.';
    } else if (targetEl.id === 'plan-btn-3_month' || targetEl.getAttribute('onclick')?.includes('3_month')) {
      this.clarifiedClueText = 'Klik tombol durasi "3 Bulan" yang sedang berkedip kuning.';
    } else if (targetEl.id === 'btn-request-new-group' || targetEl.getAttribute('onclick')?.includes('requestNewGroup')) {
      this.clarifiedClueText = 'Klik tombol hijau "Request Buka Grup Baru" yang sedang berkedip.';
    } else if (targetEl.id === 'btn-simulate-race' || targetEl.getAttribute('onclick')?.includes('simulateRaceCondition')) {
      this.clarifiedClueText = 'Klik tombol simulator kuning "Simulasikan Slot Diserobot Orang Lain (Penuh)".';
    } else if (targetEl.id === 'btn-submit-checkout' || targetEl.getAttribute('onclick')?.includes('submitCheckout')) {
      this.clarifiedClueText = 'Klik tombol "Konfirmasi & Bayar" yang sedang berkedip.';
    } else if (targetEl.id === 'payment-method-manual' || targetEl.getAttribute('onclick')?.includes('TRANSFER_MANUAL')) {
      this.clarifiedClueText = 'Klik opsi "Transfer Manual (BCA/Mandiri/QRIS)" yang sedang berkedip.';
    } else if (targetEl.id === 'payment-method-saldo' || targetEl.getAttribute('onclick')?.includes('SALDO')) {
      this.clarifiedClueText = 'Klik opsi "Bayar Pakai Saldo Dompet" yang sedang berkedip.';
    } else if (targetEl.getAttribute('onclick')?.includes('adminApproveOrder')) {
      this.clarifiedClueText = 'Klik tombol hijau "Approve" pada pesanan yang menunggu verifikasi.';
    } else if (targetEl.getAttribute('onclick')?.includes('adminRejectPrompt')) {
      this.clarifiedClueText = 'Klik tombol merah "Reject" pada pesanan transfer.';
    } else if (targetEl.getAttribute('onclick')?.includes('showReuploadProofModal')) {
      this.clarifiedClueText = 'Klik tombol "Upload Ulang Bukti" pada pesanan yang ditolak.';
    } else if (targetEl.getAttribute('onclick')?.includes('submitReuploadProof')) {
      this.clarifiedClueText = 'Klik tombol "Kirim Bukti Baru ke Admin" di dalam jendela modal.';
    } else if (targetEl.getAttribute('onclick')?.includes('togglePasswordVisibility') || targetEl.getAttribute('onclick')?.includes('copyToClipboard')) {
      this.clarifiedClueText = 'Klik ikon mata untuk intip password atau tombol "Salin" kredensial.';
    } else if (label) {
      this.clarifiedClueText = `Klik tombol "${label}" yang sedang berkedip kuning.`;
    }
  }

  reapplySpotlight() {
    if (typeof document === 'undefined') return;
    this.clearSpotlightDomOnly();

    const curStage = STAGES_CONFIG[this.progress.currentStageIndex];
    if (!curStage) return;
    const curCase = curStage.cases[this.progress.currentSubCaseIndex];
    if (!curCase) return;

    const targetEl = this.findSmartTargetElement(curCase);
    if (targetEl) {
      targetEl.classList.add('guided-spotlight-active');

      if (!targetEl.querySelector('.spotlight-badge')) {
        const isInput = targetEl.tagName === 'INPUT';
        const badge = document.createElement('span');
        badge.className = 'spotlight-badge absolute -top-3 left-2 z-50 bg-amber-400 text-slate-900 text-[10px] font-black uppercase px-2 py-0.5 border border-slate-900 shadow-sm pointer-events-none flex items-center gap-1';
        badge.innerHTML = `<i data-lucide="${isInput ? 'edit-2' : 'arrow-down'}" class="w-3 h-3"></i><span>${isInput ? 'Ketik di sini' : 'Klik di sini'}</span>`;
        if (window.getComputedStyle(targetEl).position === 'static') {
          targetEl.style.position = 'relative';
        }
        targetEl.appendChild(badge);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
      }

      if (typeof targetEl.scrollIntoView === 'function') {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      if (this.clueLevel === 2) {
        if (targetEl.tagName === 'INPUT') {
          this.showInteractiveInputBalloon(targetEl, curCase);
        } else {
          this.clarifyButtonClueText(targetEl, curCase);
        }
      }
    }
  }

  getDynamicStepInfo(curCase) {
    const app = window.app || {};
    const currentView = app.currentView || 'home';
    const viewParams = app.viewParams || {};
    const patState = window.patunganState;

    switch (curCase.id) {
      case '1A': {
        if (currentView !== 'home') {
          return {
            stepLabel: 'Langkah 1/2',
            instruction: 'Klik "Katalog Produk" di menu atas untuk membuka katalog.',
            targetSelector: '#nav-btn-home, button[onclick*="\'home\'"]'
          };
        }
        return {
          stepLabel: 'Langkah 2/2',
          instruction: 'Ketik minimal 3 huruf (misal "canva") di kolom pencarian katalog atau klik tab kategori.',
          targetSelector: '#catalog-search, button[onclick*="setCategoryFilter"]'
        };
      }

      case '1B': {
        const chatWindow = document.getElementById('ai-chat-window');
        const isChatOpen = chatWindow && !chatWindow.classList.contains('hidden') && this.isElementVisible(chatWindow);
        if (!isChatOpen) {
          return {
            stepLabel: 'Langkah 1/2',
            instruction: 'Klik tombol "Tanya Asisten AI" di pojok kanan bawah.',
            targetSelector: '#ai-chat-trigger'
          };
        } else {
          return {
            stepLabel: 'Langkah 2/2',
            instruction: 'Klik quick prompt "Paket < 25rb?" di atas chat (atau ketik pertanyaan paket murah).',
            targetSelector: '#ai-chat-window button[onclick*="Paket di bawah 25rb"], #ai-chat-window button[onclick*="25rb"], #ai-chat-input'
          };
        }
      }

      case '2A': {
        if (currentView === 'product-detail' && viewParams.productId === 'prod_canva') {
          return {
            stepLabel: 'Langkah 2/2',
            instruction: 'Klik pilihan durasi "3 Bulan" pada paket Canva Pro Team.',
            targetSelector: '#plan-btn-3_month, button[onclick*="\'3_month\'"]'
          };
        } else if (currentView === 'home') {
          return {
            stepLabel: 'Langkah 1/2',
            instruction: 'Klik "Pilih Paket & Grup" pada kartu Canva Pro Team.',
            targetSelector: '#card-btn-prod_canva, button[onclick*="prod_canva"]'
          };
        } else {
          return {
            stepLabel: 'Langkah 1/3',
            instruction: 'Klik "Katalog Produk" di menu atas untuk kembali ke katalog.',
            targetSelector: '#nav-btn-home, button[onclick*="\'home\'"]'
          };
        }
      }

      case '2B': {
        if (currentView === 'product-detail' && viewParams.productId === 'prod_spotify') {
          return {
            stepLabel: 'Langkah 3/3',
            instruction: 'Klik tombol "Request Buka Grup Baru" pada detail Spotify.',
            targetSelector: '#btn-request-new-group, button[onclick*="requestNewGroup"]'
          };
        } else if (currentView === 'home') {
          return {
            stepLabel: 'Langkah 2/3',
            instruction: 'Klik "Pilih Paket & Grup" pada kartu Spotify Premium Family.',
            targetSelector: '#card-btn-prod_spotify, button[onclick*="prod_spotify"]'
          };
        } else {
          return {
            stepLabel: 'Langkah 1/3',
            instruction: 'Klik "Katalog Produk" di menu atas untuk kembali ke halaman utama sebelum mencari Spotify.',
            targetSelector: '#nav-btn-home, button[onclick*="\'home\'"]'
          };
        }
      }

      case '3B': {
        const isGuest = patState && typeof patState.isGuest === 'function' ? patState.isGuest() : false;
        const modalLogin = document.getElementById('modal-login');
        const isLoginModalOpen = modalLogin && !modalLogin.classList.contains('hidden');

        if (isLoginModalOpen) {
          return {
            stepLabel: 'Langkah 3/3',
            instruction: 'Pilih akun Budi Santoso di dalam modal login.',
            targetSelector: '#login-preset-users div:first-child, #login-preset-users'
          };
        } else if (!isGuest) {
          return {
            stepLabel: 'Langkah 1/3',
            instruction: 'Klik ikon Logout di profil pojok kanan atas untuk masuk ke Mode Tamu.',
            targetSelector: '#nav-user-pill button[onclick*="logoutUser"], #nav-user-pill'
          };
        } else {
          if (currentView === 'product-detail') {
            const hasJoinBtn = document.querySelector('button[onclick*="handleJoinGroup"]');
            if (hasJoinBtn && this.isElementVisible(hasJoinBtn)) {
              return {
                stepLabel: 'Langkah 2/3',
                instruction: 'Klik tombol "Gabung Grup Ini" untuk memicu pencegatan login.',
                targetSelector: 'button[onclick*="handleJoinGroup"]'
              };
            }
          }
          if (currentView === 'home') {
            return {
              stepLabel: 'Langkah 2/3',
              instruction: 'Buka produk dengan grup tersedia, misal klik "Pilih Paket & Grup" pada Netflix atau Canva.',
              targetSelector: '#card-btn-prod_netflix, #card-btn-prod_canva'
            };
          }
          return {
            stepLabel: 'Langkah 2/3',
            instruction: 'Klik "Katalog Produk" di menu atas lalu pilih produk dengan grup terbuka (Netflix/Canva).',
            targetSelector: '#nav-btn-home, button[onclick*="\'home\'"]'
          };
        }
      }

      case '4A': {
        if (currentView === 'checkout') {
          if (app.selectedPaymentMethod !== 'TRANSFER_MANUAL') {
            return {
              stepLabel: 'Langkah 2/2',
              instruction: 'Pilih kotak metode "Transfer Manual (BCA/Mandiri/QRIS)".',
              targetSelector: '#payment-method-manual, div[onclick*="setPaymentMethod(\'TRANSFER_MANUAL\')"]'
            };
          } else {
            return {
              stepLabel: 'Langkah 2/2',
              instruction: 'Unggah bukti transfer (atau gunakan simulasi) lalu klik "Konfirmasi & Bayar".',
              targetSelector: '#btn-submit-checkout, button[onclick*="submitCheckout"]'
            };
          }
        } else if (currentView === 'product-detail') {
          const hasJoinBtn = document.querySelector('button[onclick*="handleJoinGroup"]');
          if (hasJoinBtn && this.isElementVisible(hasJoinBtn)) {
            return {
              stepLabel: 'Langkah 1/2',
              instruction: 'Klik tombol "Gabung Grup Ini" untuk masuk ke halaman checkout.',
              targetSelector: 'button[onclick*="handleJoinGroup"]'
            };
          }
        }
        if (currentView === 'home') {
          return {
            stepLabel: 'Langkah 1/2',
            instruction: 'Pilih produk dengan grup terbuka, misal Canva Pro Team.',
            targetSelector: '#card-btn-prod_canva, button[onclick*="prod_canva"]'
          };
        }
        return {
          stepLabel: 'Langkah 1/3',
          instruction: 'Klik "Katalog Produk" di menu atas untuk memilih produk yang ingin di-checkout.',
          targetSelector: '#nav-btn-home, button[onclick*="\'home\'"]'
        };
      }

      case '4B': {
        if (currentView === 'checkout') {
          const curUser = patState && typeof patState.getCurrentUser === 'function' ? patState.getCurrentUser() : { balance: 0 };
          const curGroup = patState && typeof patState.getGroupById === 'function' && viewParams.groupId ? patState.getGroupById(viewParams.groupId) : null;
          const curProduct = curGroup ? (patState.getProductById ? patState.getProductById(curGroup.productId) : null) : null;
          const planKey = viewParams.planKey || (curGroup ? curGroup.planKey : '1_month');
          const plan = curProduct && curProduct.plans ? curProduct.plans[planKey] : null;
          const planPrice = plan ? plan.price : (curGroup ? curGroup.price : 0);
          const hasEnoughBalance = curUser.balance >= planPrice;

          if (app.selectedPaymentMethod !== 'SALDO') {
            return {
              stepLabel: 'Langkah 2/3',
              instruction: 'Pilih kotak metode "Bayar Pakai Saldo Dompet".',
              targetSelector: '#payment-method-saldo, div[onclick*="setPaymentMethod(\'SALDO\')"]'
            };
          } else if (!hasEnoughBalance) {
            const modalTopup = document.getElementById('modal-topup');
            const isTopupOpen = modalTopup && !modalTopup.classList.contains('hidden');
            if (isTopupOpen) {
              return {
                stepLabel: 'Langkah 2/3',
                instruction: 'Pilih nominal top up (misal + Rp 50.000) untuk menambah saldo.',
                targetSelector: '#modal-topup button[onclick*="processTopUp"], #modal-topup button:has-text("50.000")'
              };
            }
            return {
              stepLabel: 'Langkah 2/3',
              instruction: 'Saldo tidak cukup. Klik tombol "Top Up Saldo Sekarang" untuk menambah saldo simulator.',
              targetSelector: 'button[onclick*="showTopUpModal"], #modal-topup-trigger'
            };
          } else {
            return {
              stepLabel: 'Langkah 3/3',
              instruction: 'Klik tombol "Konfirmasi & Bayar" untuk menyelesaikan pesanan via saldo.',
              targetSelector: '#btn-submit-checkout, button[onclick*="submitCheckout"]'
            };
          }
        } else if (currentView === 'product-detail') {
          const hasJoinBtn = document.querySelector('button[onclick*="handleJoinGroup"]');
          if (hasJoinBtn && this.isElementVisible(hasJoinBtn)) {
            return {
              stepLabel: 'Langkah 1/2',
              instruction: 'Klik tombol "Gabung Grup Ini" untuk melanjutkan ke pembayaran.',
              targetSelector: 'button[onclick*="handleJoinGroup"]'
            };
          }
        }
        if (currentView === 'home') {
          return {
            stepLabel: 'Langkah 1/2',
            instruction: 'Pilih produk dengan grup terbuka, misal Netflix Premium.',
            targetSelector: '#card-btn-prod_netflix, #card-btn-prod_canva'
          };
        }
        return {
          stepLabel: 'Langkah 1/3',
          instruction: 'Klik "Katalog Produk" di menu atas untuk memilih produk patungan.',
          targetSelector: '#nav-btn-home, button[onclick*="\'home\'"]'
        };
      }

      case '4C': {
        if (currentView === 'checkout') {
          const curGroup = patState && typeof patState.getGroupById === 'function' && viewParams.groupId 
                         ? patState.getGroupById(viewParams.groupId) : null;
          const isFull = curGroup && (curGroup.status === 'FULL' || curGroup.currentSlots >= curGroup.maxSlots || app.checkoutRaceConditionError);

          if (!isFull) {
            return {
              stepLabel: 'Langkah 2/3',
              instruction: 'Klik tombol kuning "Simulasikan Slot Diserobot Orang Lain" (atau tunggu spotlight untuk bantuan).',
              targetSelector: '#btn-simulate-race, button[onclick*="simulateRaceCondition"]'
            };
          } else {
            return {
              stepLabel: 'Langkah 3/3',
              instruction: 'Klik "Konfirmasi & Bayar" untuk memunculkan peringatan slot penuh.',
              targetSelector: '#btn-submit-checkout, button[onclick*="submitCheckout"]'
            };
          }
        } else if (currentView === 'product-detail') {
          const hasJoinBtn = document.querySelector('button[onclick*="handleJoinGroup"]');
          if (hasJoinBtn && this.isElementVisible(hasJoinBtn)) {
            return {
              stepLabel: 'Langkah 1/2',
              instruction: 'Klik "Gabung Grup Ini" untuk masuk ke halaman checkout.',
              targetSelector: 'button[onclick*="handleJoinGroup"]'
            };
          }
        }
        if (currentView === 'home') {
          return {
            stepLabel: 'Langkah 1/2',
            instruction: 'Pilih produk dengan grup terbuka (misal Canva Pro Team).',
            targetSelector: '#card-btn-prod_canva, button[onclick*="prod_canva"]'
          };
        }
        return {
          stepLabel: 'Langkah 1/3',
          instruction: 'Klik "Katalog Produk" di menu atas untuk membuka produk yang ingin di-checkout.',
          targetSelector: '#nav-btn-home, button[onclick*="\'home\'"]'
        };
      }

      case '5A': {
        if (currentView !== 'admin') {
          return {
            stepLabel: 'Langkah 1/2',
            instruction: 'Klik tombol "Mode Admin (Tester)" di menu atas.',
            targetSelector: '#nav-btn-admin, button[onclick*="\'admin\'"]'
          };
        } else {
          return {
            stepLabel: 'Langkah 2/2',
            instruction: 'Klik tombol "Approve" pada salah satu pesanan pending (Menunggu Verifikasi).',
            targetSelector: 'button[onclick*="adminApproveOrder"]'
          };
        }
      }

      case '5B': {
        const allOrders = patState && typeof patState.getAllOrders === 'function' ? patState.getAllOrders() : (patState.state ? patState.state.orders : []);
        const hasRejected = allOrders.some(o => o.status === 'Ditolak');

        if (!hasRejected) {
          if (currentView !== 'admin') {
            return {
              stepLabel: 'Langkah 1/3',
              instruction: 'Klik "Mode Admin (Tester)" di menu atas untuk menolak salah satu pesanan.',
              targetSelector: '#nav-btn-admin, button[onclick*="\'admin\'"]'
            };
          } else {
            return {
              stepLabel: 'Langkah 1/2',
              instruction: 'Di Mode Admin, klik tombol merah "Reject" pada salah satu pesanan pending.',
              targetSelector: 'button[onclick*="adminRejectPrompt"]'
            };
          }
        } else {
          if (currentView !== 'my-orders') {
            return {
              stepLabel: 'Langkah 2/3',
              instruction: 'Buka menu "Pesanan & Dompet" di navbar untuk melihat pesanan yang ditolak.',
              targetSelector: '#nav-btn-orders, button[onclick*="\'my-orders\'"]'
            };
          } else {
            const modalReupload = document.getElementById('modal-reupload-proof');
            const isModalOpen = modalReupload && !modalReupload.classList.contains('hidden');
            if (isModalOpen) {
              return {
                stepLabel: 'Langkah 3/3',
                instruction: 'Klik "Kirim Bukti Baru ke Admin" di dalam modal upload ulang.',
                targetSelector: '#modal-reupload-proof button[onclick*="submitReuploadProof"], button[onclick*="submitReuploadProof"]'
              };
            } else {
              return {
                stepLabel: 'Langkah 3/3',
                instruction: 'Klik tombol "Upload Ulang Bukti" pada pesanan yang berstatus Ditolak.',
                targetSelector: 'button[onclick*="showReuploadProofModal"]'
              };
            }
          }
        }
      }

      case '6AB': {
        if (currentView !== 'admin') {
          return {
            stepLabel: 'Langkah 1/2',
            instruction: 'Buka "Mode Admin (Tester)" di menu atas.',
            targetSelector: '#nav-btn-admin, button[onclick*="\'admin\'"]'
          };
        } else {
          return {
            stepLabel: 'Langkah 2/2',
            instruction: 'Klik tombol hijau "Simulasikan Penuh (Aktifkan)" pada salah satu grup OPEN.',
            targetSelector: 'button[onclick*="adminSimulateFillGroup"]'
          };
        }
      }

      case '6C': {
        if (currentView !== 'admin') {
          return {
            stepLabel: 'Langkah 1/2',
            instruction: 'Buka "Mode Admin (Tester)" di menu atas.',
            targetSelector: '#nav-btn-admin, button[onclick*="\'admin\'"]'
          };
        } else {
          return {
            stepLabel: 'Langkah 2/2',
            instruction: 'Klik tombol merah "Simulasikan Waktu Habis (Expired & Refund)" pada salah satu grup OPEN.',
            targetSelector: 'button[onclick*="adminSimulateExpireGroup"]'
          };
        }
      }

      case '7': {
        if (currentView !== 'my-orders') {
          return {
            stepLabel: 'Langkah 1/3',
            instruction: 'Buka menu "Pesanan & Dompet" di menu atas.',
            targetSelector: '#nav-btn-orders, button[onclick*="\'my-orders\'"]'
          };
        } else {
          const credModal = document.getElementById('modal-credentials');
          const isCredModalOpen = credModal && !credModal.classList.contains('hidden');
          if (isCredModalOpen) {
            return {
              stepLabel: 'Langkah 3/3',
              instruction: 'Klik ikon Mata (Lihat Password) atau tombol "Salin" pada detail kredensial.',
              targetSelector: '#credentials-content button[onclick*="togglePasswordVisibility"], #credentials-content button[onclick*="copyToClipboard"]'
            };
          } else {
            return {
              stepLabel: 'Langkah 2/3',
              instruction: 'Klik tombol hijau "Lihat Detail Akun" pada pesanan berstatus Aktif.',
              targetSelector: 'button[onclick*="showCredentialsModal"]'
            };
          }
        }
      }

      default: {
        return {
          stepLabel: 'Langkah 1/1',
          instruction: curCase.instruction,
          targetSelector: curCase.targetSelector
        };
      }
    }
  }

  findSmartTargetElement(curCase) {
    if (typeof document === 'undefined') return null;
    const stepInfo = this.getDynamicStepInfo(curCase);
    if (!stepInfo || !stepInfo.targetSelector) return null;

    const selectors = stepInfo.targetSelector.split(',').map(s => s.trim());
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && this.isElementVisible(el)) return el;
    }

    if (curCase.targetSelector) {
      const fallbacks = curCase.targetSelector.split(',').map(s => s.trim());
      for (const sel of fallbacks) {
        const el = document.querySelector(sel);
        if (el && this.isElementVisible(el)) return el;
      }
    }
    return null;
  }

  // --- AUTO-SANITIZE WORKSPACE ANTAR-TAHAP ---
  sanitizeWorkspaceForCase(caseId) {
    if (typeof window === 'undefined') return;
    const app = window.app;
    const patState = window.patunganState;
    if (!app || !patState) return;

    // 1. Reset Pencarian & Filter Katalog jika bukan Case 1A
    if (caseId !== '1A') {
      let needsRerender = false;
      if (app.searchQuery && app.searchQuery !== '') {
        app.searchQuery = '';
        needsRerender = true;
      }
      if (app.categoryFilter && app.categoryFilter !== 'all') {
        app.categoryFilter = 'all';
        needsRerender = true;
      }
      if (needsRerender && app.currentView === 'home') {
        app.renderCurrentView();
      }
    }

    // 2. Tutup Jendela AI Chatbot jika bukan Case 1B
    if (caseId !== '1B') {
      const chatWin = document.getElementById('ai-chat-window');
      if (chatWin && !chatWin.classList.contains('hidden')) {
        chatWin.classList.add('hidden');
      }
    }

    // 3. Tutup Semua Modal Terbuka
    const modalIds = [
      'modal-credentials',
      'modal-reject-reason',
      'modal-topup',
      'modal-user-switch',
      'modal-login',
      'modal-reupload-proof'
    ];
    modalIds.forEach(id => {
      const m = document.getElementById(id);
      if (m && !m.classList.contains('hidden')) {
        m.classList.add('hidden');
      }
    });

    // 4. Pastikan Kondisi Login: Semua sub-tahap KECUALI 3B, jika Mode Tamu kembalikan ke usr_budi
    if (caseId !== '3B') {
      if (typeof patState.isGuest === 'function' && patState.isGuest()) {
        patState.switchUser('usr_budi');
        if (typeof app.updateNavbarBadges === 'function') app.updateNavbarBadges();
        if (typeof app.renderCurrentView === 'function') app.renderCurrentView();
      }
    }

    // 5. Data Prasyarat per Sub-Tahap:
    // a. Sebelum 4A atau 4B: reset checkout race condition error
    if (caseId === '4A' || caseId === '4B') {
      app.checkoutRaceConditionError = false;
    }

    // b. Sebelum 5A atau 5B: Cek apakah ada pesanan 'Menunggu Verifikasi'
    if (caseId === '5A' || caseId === '5B') {
      const allOrders = typeof patState.getAllOrders === 'function' ? patState.getAllOrders() : (patState.state ? patState.state.orders : []);
      const hasPending = allOrders.some(o => o.status === 'Menunggu Verifikasi');
      if (!hasPending && patState.state && patState.state.orders) {
        const dummyPending = {
          id: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
          userId: 'usr_budi',
          groupId: 'grp_canva_12',
          productId: 'prod_canva',
          productName: 'Canva Pro Team',
          planKey: '1_month',
          planName: '1 Bulan',
          amount: 25000,
          paymentMethod: 'TRANSFER_MANUAL',
          status: 'Menunggu Verifikasi',
          proofFile: 'bukti_transfer_dummy_5ab.jpg',
          rejectReason: null,
          createdAt: new Date().toISOString(),
          activatedAt: null
        };
        patState.state.orders.unshift(dummyPending);
        if (typeof patState.save === 'function') patState.save();
        if (app.currentView === 'admin' || app.currentView === 'my-orders') {
          app.renderCurrentView();
        }
      }
    }

    // c. Sebelum 6AB atau 6C: Pastikan minimal ada 1 grup berstatus 'OPEN'
    if (caseId === '6AB' || caseId === '6C') {
      const allGroups = typeof patState.getAllGroups === 'function' ? patState.getAllGroups() : (patState.state ? patState.state.subscriptionGroups : []);
      let openGroup = allGroups.find(g => g.status === 'OPEN' && g.currentSlots < g.maxSlots);
      if (!openGroup && allGroups.length > 0) {
        openGroup = allGroups.find(g => g.id === 'grp_canva_12') || allGroups[0];
        if (openGroup) {
          openGroup.status = 'OPEN';
          openGroup.currentSlots = Math.min(3, openGroup.maxSlots - 1);
          if (typeof patState.save === 'function') patState.save();
        }
      }
      // Khusus 6C: pastikan currentUser memiliki pesanan di grup OPEN tersebut agar efek refund ke saldo langsung terlihat
      if (caseId === '6C' && patState.state && patState.state.orders) {
        const curUser = typeof patState.getCurrentUser === 'function' ? patState.getCurrentUser() : null;
        if (curUser && openGroup) {
          const userOrders = typeof patState.getUserOrders === 'function' ? patState.getUserOrders() : patState.state.orders.filter(o => o.userId === curUser.id);
          const hasOrderInOpen = userOrders.some(o => o.groupId === openGroup.id && (o.status === 'Menunggu Kuota' || o.status === 'Menunggu Verifikasi'));
          if (!hasOrderInOpen) {
            const refundOrder = {
              id: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
              userId: curUser.id,
              groupId: openGroup.id,
              productId: openGroup.productId,
              productName: openGroup.productId === 'prod_canva' ? 'Canva Pro Team' : 'Paket Patungan',
              planKey: '1_month',
              planName: '1 Bulan',
              amount: 25000,
              paymentMethod: 'SALDO',
              status: 'Menunggu Kuota',
              proofFile: null,
              rejectReason: null,
              createdAt: new Date().toISOString(),
              activatedAt: null
            };
            patState.state.orders.unshift(refundOrder);
            if (!openGroup.members.includes(curUser.id)) {
              openGroup.members.push(curUser.id);
            }
            if (typeof patState.save === 'function') patState.save();
          }
        }
      }
      if (app.currentView === 'admin' || app.currentView === 'my-orders') {
        app.renderCurrentView();
      }
    }

    // d. Sebelum 7: Pastikan currentUser memiliki minimal 1 pesanan berstatus 'Aktif'
    if (caseId === '7' && patState.state && patState.state.orders) {
      const curUser = typeof patState.getCurrentUser === 'function' ? patState.getCurrentUser() : null;
      if (curUser) {
        const userOrders = typeof patState.getUserOrders === 'function' ? patState.getUserOrders() : patState.state.orders.filter(o => o.userId === curUser.id);
        const hasActive = userOrders.some(o => o.status === 'Aktif');
        if (!hasActive) {
          const activeOrder = {
            id: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
            userId: curUser.id,
            groupId: 'grp_netflix_04',
            productId: 'prod_netflix',
            productName: 'Netflix Premium 4K UHD',
            planKey: '1_month',
            planName: '1 Bulan',
            amount: 38000,
            paymentMethod: 'SALDO',
            status: 'Aktif',
            proofFile: null,
            rejectReason: null,
            createdAt: new Date().toISOString(),
            activatedAt: new Date().toISOString()
          };
          patState.state.orders.unshift(activeOrder);
          if (typeof patState.save === 'function') patState.save();
          if (app.currentView === 'my-orders') {
            app.renderCurrentView();
          }
        }
      }
    }
  }

  isElementVisible(el) {
    if (!el) return false;
    if (typeof window === 'undefined') return true;
    try {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      return el.offsetWidth > 0 || el.offsetHeight > 0 || (el.getClientRects && el.getClientRects().length > 0);
    } catch (e) {
      return true;
    }
  }

  clearSpotlightDomOnly() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('.guided-spotlight-active').forEach(el => {
      el.classList.remove('guided-spotlight-active');
    });
    document.querySelectorAll('.spotlight-badge').forEach(b => b.remove());
  }

  clearClueSpotlight() {
    this.clearClueTimers();
    this.removeExampleBalloon();
    this.clearSpotlightDomOnly();
    this.clueActive = false;
    this.clueLevel = 0;
    this.clarifiedClueText = '';
  }

  toggleClueSpotlight() {
    if (this.clueActive) {
      this.clearClueSpotlight();
    } else {
      this.activateClueSpotlight();
    }
    this.renderWidget();
  }

  // --- KONTROL SUB-TES ---
  startActiveSubCase() {
    const curStage = STAGES_CONFIG[this.progress.currentStageIndex];
    const curCase = curStage.cases[this.progress.currentSubCaseIndex];
    this.sanitizeWorkspaceForCase(curCase.id);

    this.progress.isSubCaseRunning = true;
    this.isMinimized = true;
    this.clueActive = false;
    this.clueLevel = 0;
    this.clarifiedClueText = '';
    this.clearClueSpotlight();
    this.saveProgress();
    this.renderWidget();
    this.startIdleClueTimer();

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`Mulai sub-tes: ${curCase.title}. Panel diperkecil agar layar leluasa.`, 'info');
    }
  }

  pauseActiveSubCase() {
    this.progress.isSubCaseRunning = false;
    this.clearClueSpotlight();
    this.saveProgress();
    this.renderWidget();
    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('Sub-tes dijeda.', 'info');
    }
  }

  minimizePanel() {
    this.isMinimized = true;
    this.renderWidget();
  }

  unminimizePanel() {
    this.isMinimized = false;
    this.isOpen = true;
    this.renderWidget();
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
    this.isMinimized = false;
    this.renderWidget();
  }

  getCompletedCasesCount() {
    if (!this.progress.completedCases) return 0;
    return Object.values(this.progress.completedCases).filter(v => v === true).length;
  }

  getCompletedStagesCount() {
    let count = 0;
    STAGES_CONFIG.forEach(s => {
      const allDone = s.cases.every(c => this.progress.completedCases && this.progress.completedCases[c.id]);
      if (allDone) count++;
    });
    return count;
  }

  // --- RENDER WIDGET PANEL & MINIBAR ---
  renderWidget() {
    let container = document.getElementById('guided-test-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'guided-test-container';
      document.body.appendChild(container);
    }

    const completedCases = this.getCompletedCasesCount();
    const totalCases = 13;
    const completedStages = this.getCompletedStagesCount();
    const percent = Math.round((completedCases / totalCases) * 100);

    const curStage = STAGES_CONFIG[this.progress.currentStageIndex] || STAGES_CONFIG[6];
    const curCase = curStage.cases[this.progress.currentSubCaseIndex] || curStage.cases[0];
    const stepInfo = this.getDynamicStepInfo(curCase);

    // 1. JIKA MINIMIZED (BAR KOMPAK DI POJOK KIRI BAWAH)
    if (this.isMinimized && this.progress.isSubCaseRunning) {
      container.innerHTML = `
        <div class="fixed bottom-5 left-5 z-50">
          <div id="guided-test-minibar" class="bg-white border border-slate-800 shadow-lg px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-[94vw] w-[94vw] sm:w-[500px]">
            <div class="flex items-start sm:items-center gap-2.5 min-w-0 flex-grow">
              <div class="w-8 h-8 bg-slate-900 text-white flex items-center justify-center shrink-0 border border-slate-900 mt-0.5 sm:mt-0">
                <i data-lucide="${curStage.icon}" class="w-4 h-4 text-emerald-400"></i>
              </div>
              <div class="min-w-0 flex-grow">
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase flex-wrap">
                  <span>Tahap ${curStage.stage}</span>
                  <span>•</span>
                  <span class="px-1.5 py-0.2 bg-slate-100 text-slate-800 border border-slate-300 font-bold">${stepInfo.stepLabel}</span>
                  <span>•</span>
                  <span class="text-emerald-700 flex items-center gap-1 font-mono">
                    <span class="w-2 h-2 bg-emerald-500 rounded-full animate-ping inline-block"></span> Misi Berjalan
                  </span>
                </div>
                <div class="font-extrabold text-xs text-slate-900 truncate">${curCase.title}</div>
                <div class="text-[11px] text-slate-600 font-medium mt-0.5 whitespace-normal leading-snug">${stepInfo.instruction}</div>
              </div>
            </div>

            ${this.clueActive ? `
              <div class="w-full sm:hidden p-2 bg-amber-50 border border-amber-300 text-amber-950 text-[11px] leading-snug whitespace-normal">
                <b>Panduan Target:</b> ${this.clarifiedClueText || stepInfo.instruction}
              </div>
            ` : ''}

            <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <button onclick="guidedTesting.toggleClueSpotlight()" 
                      class="px-2.5 py-1.5 text-xs font-bold border border-slate-300 hover:border-slate-800 bg-slate-50 flex items-center gap-1 transition-colors">
                <i data-lucide="help-circle" class="w-3.5 h-3.5 text-amber-600"></i>
                <span class="hidden sm:inline">${this.clueActive ? 'Tutup Clue' : 'Lihat Clue'}</span>
                <span class="sm:hidden">Clue</span>
              </button>
              <button onclick="guidedTesting.unminimizePanel()" 
                      class="px-2.5 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1 transition-colors">
                <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>
                <span>Perbesar</span>
              </button>
            </div>
          </div>
          
          ${this.clueActive ? `
            <div class="hidden sm:block mt-1 p-2 bg-amber-50 border border-amber-300 text-amber-950 text-[11px] leading-snug max-w-[94vw] w-[94vw] sm:w-[500px] shadow-md whitespace-normal">
              <b>Panduan Target:</b> ${this.clarifiedClueText || stepInfo.instruction}
            </div>
          ` : ''}
        </div>
      `;

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
      return;
    }

    // 2. JIKA NORMAL PANEL (DRAWER STANDAR DENGAN SHADOW HALUS & NO EMOJI)
    container.innerHTML = `
      <!-- FLOATING TRIGGER BUTTON (Pojok Kiri Bawah) -->
      <div class="fixed bottom-5 left-5 z-50">
        <button onclick="guidedTesting.togglePanel()" 
                class="group bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 border border-slate-800 shadow-md flex items-center gap-2.5 transition-all">
          <div class="relative">
            <i data-lucide="compass" class="w-5 h-5 text-emerald-400"></i>
            <span class="absolute -top-1 -right-1 w-2 h-2 bg-amber-400"></span>
          </div>
          <div class="text-left">
            <span class="block font-bold text-xs uppercase tracking-wider">Panduan Tes (${completedStages}/7)</span>
            <span class="block text-[10px] text-slate-300 font-mono">${completedCases}/13 Sub-Misi (${percent}%)</span>
          </div>
        </button>

        <!-- MISSION DRAWER CARD -->
        <div id="guided-test-panel" class="${this.isOpen ? '' : 'hidden'} absolute bottom-14 left-0 w-[92vw] sm:w-[440px] max-h-[82vh] h-[620px] bg-white border border-slate-300 shadow-xl flex flex-col z-50">
          
          <!-- Header -->
          <div class="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-1.5 py-0.5 bg-emerald-500 text-slate-900 font-bold text-[9px] uppercase tracking-wide">Mode Terstruktur</span>
                <span class="text-xs text-slate-300">Usability Testing</span>
              </div>
              <h3 class="font-extrabold text-sm mt-0.5">7 Tahap Pengujian Sistem</h3>
            </div>
            <button onclick="guidedTesting.togglePanel()" class="p-1 text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Progress Bar & Controls -->
          <div class="bg-slate-50 p-3 border-b border-slate-200 shrink-0">
            <div class="flex justify-between items-center text-xs font-bold mb-1.5">
              <span class="text-slate-800">Progres Keseluruhan:</span>
              <span class="font-mono text-emerald-700 font-bold">${completedStages}/7 Tahap (${percent}%)</span>
            </div>
            <div class="w-full bg-slate-200 h-2 border border-slate-300 flex">
              <div class="bg-emerald-600 h-full transition-all duration-300" style="width: ${percent}%;"></div>
            </div>
            
            <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-[11px]">
              <button onclick="guidedTesting.resetCurrentStage()" class="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1">
                <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Ulangi Tahap Ini
              </button>
              <button onclick="guidedTesting.confirmResetAll()" class="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1">
                <i data-lucide="trash-2" class="w-3 h-3"></i> Reset Progres
              </button>
            </div>
          </div>

          <!-- Stages List (Scrollable) -->
          <div class="flex-grow overflow-y-auto p-3.5 space-y-3 bg-slate-50 text-xs">
            ${completedStages === 7 ? `
              <!-- COMPLETION SUMMARY CARD -->
              <div class="p-4 bg-emerald-50 border border-emerald-500 text-emerald-950 text-center space-y-2.5 shadow-sm">
                <div class="w-10 h-10 bg-emerald-600 text-white flex items-center justify-center mx-auto">
                  <i data-lucide="award" class="w-5 h-5"></i>
                </div>
                <h4 class="font-bold text-sm">Seluruh Misi Berhasil Diselesaikan</h4>
                <p class="text-xs text-emerald-900 leading-relaxed">
                  Terima kasih banyak telah mencoba seluruh tahap alur prototipe. Masukan dan penilaian Anda sangat berharga bagi riset sistem ini.
                </p>
                <button onclick="guidedTesting.showEvaluationModal()" 
                        class="w-full py-2 bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5 text-emerald-400"></i>
                  <span>Buka Form Evaluasi Akhir</span>
                </button>
              </div>
            ` : ''}

            ${STAGES_CONFIG.map((s, idx) => this.renderStageItem(s, idx)).join('')}
          </div>

          <!-- Footer Action -->
          <div class="p-3 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between text-xs">
            <button onclick="guidedTesting.showIntroModal()" class="text-slate-600 hover:text-blue-600 font-semibold flex items-center gap-1">
              <i data-lucide="help-circle" class="w-3.5 h-3.5"></i> Info Study Case
            </button>
            <button onclick="guidedTesting.showEvaluationModal()" 
                    class="px-3 py-1.5 ${completedStages === 7 ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'} font-bold border border-slate-300 flex items-center gap-1">
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

  renderStageItem(stageConf, sIdx) {
    const isCurrent = this.progress.currentStageIndex === sIdx;
    const isPast = sIdx < this.progress.currentStageIndex || (sIdx === 6 && this.progress.isFinished);
    const isFuture = sIdx > this.progress.currentStageIndex;

    // 1. PAST STAGE (COMPLETED)
    if (isPast) {
      return `
        <div class="border border-emerald-300 bg-white shadow-sm">
          <div class="p-3 bg-emerald-50 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
              </div>
              <div>
                <span class="font-bold text-xs text-slate-900">${stageConf.title}</span>
                <span class="block text-[10px] text-emerald-800 font-mono">Tahap Selesai</span>
              </div>
            </div>
            <span class="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-200 text-emerald-900">Lulus</span>
          </div>
        </div>
      `;
    }

    // 2. CURRENT STAGE (ACTIVE)
    if (isCurrent && !this.progress.isFinished) {
      return `
        <div class="border-2 border-slate-900 bg-white shadow-md">
          
          <!-- Stage Header -->
          <div class="p-3 bg-slate-900 text-white flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-xs">
                <i data-lucide="${stageConf.icon}" class="w-3.5 h-3.5"></i>
              </div>
              <div>
                <span class="font-bold text-xs block text-white">${stageConf.title}</span>
                <span class="text-[10px] text-amber-300 font-mono">Tahap Aktif</span>
              </div>
            </div>
            <span class="px-1.5 py-0.5 bg-amber-400 text-slate-900 font-bold text-[9px] uppercase">Berlangsung</span>
          </div>

          <div class="p-3 space-y-3">
            <p class="text-xs text-slate-600 leading-relaxed">${stageConf.description}</p>
            
            <!-- Sub-cases List -->
            <div class="space-y-2">
              ${stageConf.cases.map((c, cIdx) => {
                const isCaseCompleted = this.progress.completedCases && this.progress.completedCases[c.id];
                const isCaseActive = cIdx === this.progress.currentSubCaseIndex && !isCaseCompleted;
                const isCaseLocked = cIdx > this.progress.currentSubCaseIndex && !isCaseCompleted;

                // Sub-case Selesai
                if (isCaseCompleted) {
                  const review = (this.progress.stepReviews || []).find(r => r.caseId === c.id);
                  return `
                    <div class="p-2.5 border border-emerald-400 bg-emerald-50 flex items-start gap-2.5">
                      <div class="w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center bg-emerald-600 text-white font-bold text-xs">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                      </div>
                      <div class="flex-grow">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-xs text-emerald-950">${c.title}</span>
                          <span class="text-[9px] font-bold text-emerald-700 bg-emerald-200 px-1 py-0.2">Selesai</span>
                        </div>
                        <p class="text-[11px] text-emerald-800 mt-0.5">${c.instruction}</p>
                        ${review ? `
                          <div class="mt-1.5 text-[10px] font-medium text-emerald-900 bg-white p-1.5 border border-emerald-200">
                            <b>Respon Tester:</b> "${review.experience}" ${review.note ? `• ${review.note}` : ''}
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }

                // Sub-case Sedang Aktif
                if (isCaseActive) {
                  const stepInfo = this.getDynamicStepInfo(c);
                  return `
                    <div class="p-3 border-2 border-slate-900 bg-white shadow-sm space-y-2.5">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="font-extrabold text-xs text-slate-900">${c.title}</span>
                          <span class="px-1.5 py-0.2 bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-bold">${stepInfo.stepLabel}</span>
                        </div>
                        ${this.progress.isSubCaseRunning ? `
                          <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-400 px-1.5 py-0.5 flex items-center gap-1 font-mono">
                            <span class="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping"></span> Berjalan
                          </span>
                        ` : `
                          <span class="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5">
                            Siap Dimulai
                          </span>
                        `}
                      </div>

                      <p class="text-xs text-slate-700 leading-snug font-medium">${stepInfo.instruction}</p>

                      <!-- Tombol Aksi Sub-case -->
                      ${!this.progress.isSubCaseRunning ? `
                        <button onclick="guidedTesting.startActiveSubCase()" 
                                class="w-full py-2 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                          <i data-lucide="play" class="w-3.5 h-3.5 text-emerald-400"></i>
                          <span>Mulai Sub-Tes Ini</span>
                        </button>
                      ` : `
                        <div class="space-y-1.5 pt-1">
                          <div class="flex items-center gap-2">
                            <button onclick="guidedTesting.minimizePanel()" 
                                    class="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors">
                              <i data-lucide="minimize-2" class="w-3 h-3"></i>
                              <span>Perkecil & Cari</span>
                            </button>
                            <button onclick="guidedTesting.toggleClueSpotlight()" 
                                    class="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors">
                              <i data-lucide="help-circle" class="w-3 h-3 text-amber-600"></i>
                              <span>${this.clueActive ? 'Tutup Clue' : 'Lihat Clue'}</span>
                            </button>
                            <button onclick="guidedTesting.pauseActiveSubCase()" 
                                    class="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[11px]">
                              Jeda
                            </button>
                          </div>

                          ${this.clueActive ? `
                            <div class="p-2 bg-amber-50 border border-amber-300 text-amber-950 text-[11px] leading-snug">
                              <b>Panduan Target:</b> ${this.clarifiedClueText || stepInfo.instruction}
                            </div>
                          ` : ''}
                        </div>
                      `}
                    </div>
                  `;
                }

                // Sub-case Terkunci (Menunggu giliran)
                return `
                  <div class="p-2.5 border border-slate-200 bg-slate-100 opacity-60 flex items-start gap-2.5">
                    <div class="w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center bg-slate-200 text-slate-500 font-bold text-xs">
                      <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                    </div>
                    <div class="flex-grow">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-xs text-slate-600">${c.title}</span>
                        <span class="text-[9px] font-mono text-slate-400">Terkunci</span>
                      </div>
                      <p class="text-[11px] text-slate-500 mt-0.5 line-clamp-1">${c.instruction}</p>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

          </div>

        </div>
      `;
    }

    // 3. FUTURE STAGE (LOCKED)
    return `
      <div class="border border-slate-200 bg-slate-100 p-3 opacity-60 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
            <i data-lucide="lock" class="w-3.5 h-3.5"></i>
          </div>
          <div>
            <span class="font-bold text-xs text-slate-600">${stageConf.title}</span>
            <span class="block text-[10px] text-slate-400 font-mono">${stageConf.subtitle}</span>
          </div>
        </div>
        <span class="text-[10px] text-slate-400 font-mono">Terkunci</span>
      </div>
    `;
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
      <div class="bg-white border border-slate-800 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 bg-emerald-500 text-slate-900 flex items-center justify-center font-bold">
              <i data-lucide="compass" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="px-1.5 py-0.5 bg-amber-400 text-slate-900 font-bold text-[9px] uppercase tracking-wider">Usability Testing</span>
              <h3 class="font-extrabold text-sm leading-tight">Panduan Uji Coba Patungan Akun</h3>
            </div>
          </div>
          <button onclick="guidedTesting.closeIntroModal()" class="text-slate-400 hover:text-white">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="p-5 space-y-3.5 text-xs leading-relaxed text-slate-700">
          <div class="p-3 bg-blue-50 border border-blue-200 text-blue-950 font-medium">
            Selamat datang! Prototipe ini dirancang untuk menguji kemudahan sistem informasi patungan akun premium. Anda diajak menyelesaikan <b>7 Tahap Pengujian Ketat</b> secara berurutan.
          </div>

          <h4 class="font-bold uppercase tracking-wider text-slate-900 text-xs">Aturan Pengujian:</h4>
          <ul class="space-y-1.5 list-disc list-inside text-slate-800">
            <li><b>Kunci Sub-Tahap:</b> Klik tombol <b>"Mulai Sub-Tes Ini"</b> pada panduan sebelum melakukan aksi.</li>
            <li><b>Auto-Minimize & Clue:</b> Saat misi dimulai, panel otomatis mengecil. Jika diam 10 detik, elemen target akan berkedip kuning.</li>
            <li><b>Ulasan Cepat:</b> Di setiap selesai 1 sub-misi, berikan evaluasi cepat (Aman, Bingung, atau Bug).</li>
          </ul>
        </div>

        <div class="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-2">
          <button onclick="guidedTesting.closeIntroModal()" class="px-4 py-2 border border-slate-300 bg-white font-bold text-xs hover:bg-slate-100">
            Jelajah Bebas
          </button>
          <button onclick="guidedTesting.startStage1()" class="px-4 py-2 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors">
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
    this.progress.currentStageIndex = 0;
    this.progress.currentSubCaseIndex = 0;
    this.progress.isSubCaseRunning = false;
    this.isMinimized = false;
    this.isOpen = true;
    this.saveProgress();
    this.sanitizeWorkspaceForCase('1A');
    this.renderWidget();
    if (window.app && typeof window.app.navigate === 'function') {
      window.app.navigate('home');
    }
  }

  // --- MODAL MINI-EVALUASI SUB-TAHAP (STEP MICRO-REVIEW) ---
  showStepMicroReviewModal(stage, subCase) {
    let modal = document.getElementById('modal-step-micro-review');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-step-micro-review';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm';
      document.body.appendChild(modal);
    }

    this.selectedStepExperience = '';
    const isLastOverall = this.progress.currentStageIndex === 6 && this.progress.currentSubCaseIndex === stage.cases.length - 1;

    modal.innerHTML = `
      <div class="bg-white border border-slate-800 shadow-xl max-w-md w-full p-0">
        
        <!-- Header -->
        <div class="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 bg-emerald-500 text-slate-900 flex items-center justify-center font-bold">
              <i data-lucide="check" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Sub-Tes Berhasil Diselesaikan</span>
              <h3 class="font-extrabold text-sm leading-tight">${subCase.title}</h3>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form onsubmit="guidedTesting.handleStepReviewSubmit(event)" class="p-5 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-900 mb-2">
              Bagaimana pengalamanmu di langkah ini? <span class="text-red-500">*</span>
            </label>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button type="button" onclick="guidedTesting.selectStepExperience('Aman & Jelas')"
                      id="btn-exp-aman"
                      class="p-2.5 border text-center transition-all flex flex-col items-center gap-1 border-slate-300 hover:border-slate-800 bg-white text-slate-800">
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
                <span class="font-bold text-xs">Aman & Jelas</span>
              </button>

              <button type="button" onclick="guidedTesting.selectStepExperience('Agak Bingung')"
                      id="btn-exp-bingung"
                      class="p-2.5 border text-center transition-all flex flex-col items-center gap-1 border-slate-300 hover:border-slate-800 bg-white text-slate-800">
                <i data-lucide="help-circle" class="w-4 h-4 text-amber-600"></i>
                <span class="font-bold text-xs">Agak Bingung</span>
              </button>

              <button type="button" onclick="guidedTesting.selectStepExperience('Terasa Aneh / Ada Bug')"
                      id="btn-exp-bug"
                      class="p-2.5 border text-center transition-all flex flex-col items-center gap-1 border-slate-300 hover:border-slate-800 bg-white text-slate-800">
                <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-600"></i>
                <span class="font-bold text-xs">Aneh / Bug</span>
              </button>
            </div>
            <input type="hidden" id="step-review-exp" value="" required />
          </div>

          <div>
            <label class="block font-bold text-slate-900 mb-1" id="step-note-label">
              Catatan singkat:
            </label>
            <textarea id="step-review-note" rows="2" 
                      placeholder="Bagian mana yang terasa aneh atau tidak perlu? (Opsional jika Aman & Jelas)"
                      class="w-full p-2.5 border border-slate-300 focus:border-slate-900 font-medium focus:outline-none"></textarea>
          </div>

          <div class="pt-2 flex justify-end">
            <button type="submit" 
                    class="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm">
              <span>${isLastOverall ? 'Simpan & Lanjut ke Form Evaluasi Akhir' : 'Simpan & Lanjut ke Sub-Tes Berikutnya'}</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          </div>
        </form>

      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  selectStepExperience(val) {
    this.selectedStepExperience = val;
    const input = document.getElementById('step-review-exp');
    if (input) input.value = val;

    const btnAman = document.getElementById('btn-exp-aman');
    const btnBingung = document.getElementById('btn-exp-bingung');
    const btnBug = document.getElementById('btn-exp-bug');
    const noteLabel = document.getElementById('step-note-label');
    const noteTextarea = document.getElementById('step-review-note');

    [btnAman, btnBingung, btnBug].forEach(b => {
      if (b) b.className = 'p-2.5 border text-center transition-all flex flex-col items-center gap-1 border-slate-300 hover:border-slate-800 bg-white text-slate-800';
    });

    if (val === 'Aman & Jelas' && btnAman) {
      btnAman.className = 'p-2.5 border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-bold text-center flex flex-col items-center gap-1';
      if (noteLabel) noteLabel.innerHTML = 'Catatan singkat <span class="text-slate-400 font-normal">(opsional):</span>';
      if (noteTextarea) noteTextarea.required = false;
    } else if (val === 'Agak Bingung' && btnBingung) {
      btnBingung.className = 'p-2.5 border-2 border-amber-500 bg-amber-50 text-amber-950 font-bold text-center flex flex-col items-center gap-1';
      if (noteLabel) noteLabel.innerHTML = 'Catatan singkat kendala / kebingungan <span class="text-red-500">*</span>:';
      if (noteTextarea) noteTextarea.required = true;
    } else if (val === 'Terasa Aneh / Ada Bug' && btnBug) {
      btnBug.className = 'p-2.5 border-2 border-rose-600 bg-rose-50 text-rose-950 font-bold text-center flex flex-col items-center gap-1';
      if (noteLabel) noteLabel.innerHTML = 'Catatan singkat keanehan / bug yang dialami <span class="text-red-500">*</span>:';
      if (noteTextarea) noteTextarea.required = true;
    }
  }

  handleStepReviewSubmit(event) {
    event.preventDefault();
    const exp = this.selectedStepExperience;
    const note = (document.getElementById('step-review-note').value || '').trim();

    if (!exp) {
      alert('Mohon pilih salah satu respon pengalaman (Aman & Jelas, Agak Bingung, atau Aneh/Bug).');
      return;
    }

    if ((exp === 'Agak Bingung' || exp === 'Terasa Aneh / Ada Bug') && !note) {
      alert('Mohon tuliskan catatan singkat mengenai kebingungan atau keanehan yang dialami.');
      return;
    }

    const curStage = STAGES_CONFIG[this.progress.currentStageIndex];
    const curCase = curStage.cases[this.progress.currentSubCaseIndex];

    if (!this.progress.stepReviews) this.progress.stepReviews = [];
    this.progress.stepReviews.push({
      caseId: curCase.id,
      stageNum: curStage.stage,
      caseTitle: curCase.title,
      experience: exp,
      note: note,
      timestamp: new Date().toISOString()
    });

    const modal = document.getElementById('modal-step-micro-review');
    if (modal) modal.classList.add('hidden');

    if (curCase.id === '1B') {
      const chatWin = document.getElementById('ai-chat-window');
      if (chatWin && !chatWin.classList.contains('hidden')) {
        chatWin.classList.add('hidden');
      }
    }

    // Berpindah ke sub-kasus berikutnya atau tahap berikutnya
    if (this.progress.currentSubCaseIndex + 1 < curStage.cases.length) {
      this.progress.currentSubCaseIndex++;
    } else if (this.progress.currentStageIndex + 1 < STAGES_CONFIG.length) {
      this.progress.currentStageIndex++;
      this.progress.currentSubCaseIndex = 0;
    } else {
      this.progress.isFinished = true;
    }

    // Setiap sub-kasus baru dimulai dalam status isSubCaseRunning = false
    this.progress.isSubCaseRunning = false;
    this.isMinimized = false;
    this.isOpen = true;
    this.saveProgress();
    this.renderWidget();

    if (this.progress.isFinished) {
      const credModal = document.getElementById('modal-credentials');
      if (credModal) credModal.classList.add('hidden');
      setTimeout(() => {
        this.showEvaluationModal();
      }, 500);
    }
  }

  // --- FORM EVALUASI TESTER AKHIR (MODAL) ---
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
      <div class="bg-white border border-slate-800 shadow-xl max-w-xl w-full max-h-[92vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-blue-600 text-white flex items-center justify-center font-bold">
              <i data-lucide="clipboard-check" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="font-bold text-sm uppercase tracking-wide">Form Evaluasi Pengujian Tester</h3>
              <span class="text-[10px] text-slate-300 font-mono">Progres: ${completedCount}/7 Tahap Selesai</span>
            </div>
          </div>
          <button onclick="guidedTesting.closeEvaluationModal()" class="text-slate-400 hover:text-white">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div id="evaluation-form-container" class="p-5">
          <form onsubmit="guidedTesting.handleEvaluationSubmit(event)" class="space-y-4 text-xs">
            
            <p class="text-slate-600 leading-relaxed">
              Seluruh masukan Anda disimpan secara terstruktur untuk keperluan riset antarmuka dan pengembangan sistem informasi. Semua pertanyaan di bawah ini <b>wajib diisi</b>.
            </p>

            <!-- 1. Nama Tester -->
            <div>
              <label class="block font-bold text-slate-800 uppercase mb-1">
                1. Nama Lengkap / Panggilan Tester <span class="text-red-500">*</span>
              </label>
              <input type="text" id="eval-name" required value="${defaultName}" placeholder="cth: Budi Santoso / Rian" 
                     class="w-full px-3 py-2 border border-slate-400 font-medium focus:outline-none focus:border-slate-900" />
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
                          class="py-2 border border-slate-300 hover:border-slate-800 font-bold text-xs transition-all flex flex-col items-center justify-center">
                    <span class="flex items-center gap-1 font-bold"><i data-lucide="star" class="w-3.5 h-3.5 text-amber-500"></i> ${val}</span>
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
                          class="py-2 border border-slate-300 hover:border-slate-800 font-bold text-xs transition-all flex flex-col items-center justify-center">
                    <span class="flex items-center gap-1 font-bold"><i data-lucide="star" class="w-3.5 h-3.5 text-amber-500"></i> ${val}</span>
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
                        class="w-full px-3 py-2 border border-slate-400 font-medium focus:outline-none focus:border-slate-900"></textarea>
            </div>

            <!-- 5. Kekurangan UI/UX -->
            <div>
              <label class="block font-bold text-slate-800 uppercase mb-1">
                5. Apa yang kurang dari segi tampilan UI/UX atau kenyamanan visual? <span class="text-red-500">*</span>
              </label>
              <textarea id="eval-uiux-critique" required rows="2" placeholder="cth: Kontras warna di badge status kurang mencolok, tombol salin perlu ikon feedback, dll..." 
                        class="w-full px-3 py-2 border border-slate-400 font-medium focus:outline-none focus:border-slate-900"></textarea>
            </div>

            <!-- 6. Saran Pengembangan -->
            <div>
              <label class="block font-bold text-slate-800 uppercase mb-1">
                6. Saran pengembangan atau ide fitur tambahan? <span class="text-red-500">*</span>
              </label>
              <textarea id="eval-suggestions" required rows="2" placeholder="cth: Tambahkan fitur pengingat perpanjangan masa aktif via SMS/Email..." 
                        class="w-full px-3 py-2 border border-slate-400 font-medium focus:outline-none focus:border-slate-900"></textarea>
            </div>

            <!-- Submit Button -->
            <div class="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" onclick="guidedTesting.closeEvaluationModal()" class="px-4 py-2 border border-slate-300 bg-white font-bold text-xs">
                Batal
              </button>
              <button type="submit" id="eval-submit-btn" 
                      class="px-5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm">
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
          btn.className = 'py-2 border-2 border-slate-900 bg-slate-900 text-white font-bold text-xs';
        } else {
          btn.className = 'py-2 border border-slate-300 hover:border-slate-800 text-slate-800 font-bold text-xs';
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
          btn.className = 'py-2 border-2 border-slate-900 bg-slate-900 text-white font-bold text-xs';
        } else {
          btn.className = 'py-2 border border-slate-300 hover:border-slate-800 text-slate-800 font-bold text-xs';
        }
      }
    }
  }

  async handleEvaluationSubmit(event) {
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

    // 1. Tampilkan status loading pada tombol submit & disable
    const submitBtn = document.getElementById('eval-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <div class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin mr-1"></div>
        <span>Mengirim evaluasi...</span>
      `;
      submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
    }

    const completedStages = this.getCompletedStagesCount();
    const now = new Date();

    // 2. Gabungkan ringkasan ulasan per sub-tahap ke workflowFeedback
    let stepReviewsSummary = '';
    if (this.progress.stepReviews && this.progress.stepReviews.length > 0) {
      stepReviewsSummary = '\n\n[Rekap Ulasan per Sub-Tahap]:\n' +
        this.progress.stepReviews.map(r => 
          `• ${r.caseId} (${r.experience}): ${r.note ? r.note : '-'}`
        ).join('\n');
    }

    const payload = {
      timestamp: now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      isoTimestamp: now.toISOString(),
      id: 'FB-' + Date.now().toString().slice(-6),
      name: name,
      testerName: name, // alias
      workflowRating: Number(wfRating),
      uiuxRating: Number(uiRating),
      workflowFeedback: wfCritique + stepReviewsSummary,
      uiuxFeedback: uiCritique,
      suggestions: suggestions,
      futureSuggestions: suggestions, // alias
      completedStages: `${completedStages}/7`,
      stagesCompleted: `${completedStages}/7`, // alias
      stepReviews: this.progress.stepReviews || [],
      environment: {
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
      }
    };

    // 3. Simpan cadangan ke localStorage
    let storedList = [];
    try {
      const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (raw) storedList = JSON.parse(raw);
    } catch (e) {
      storedList = [];
    }
    storedList.unshift(payload);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(storedList));

    // 4. Kirim data ke Google Apps Script (Anti-CORS preflight: text/plain)
    let sendSuccess = false;
    let sendError = null;

    if (FEEDBACK_ENDPOINT && FEEDBACK_ENDPOINT.trim() !== '') {
      try {
        const response = await fetch(FEEDBACK_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        if (response.ok || response.status < 400 || response.type === 'opaque') {
          sendSuccess = true;
        } else {
          sendError = `HTTP ${response.status}`;
        }
      } catch (err) {
        console.warn('Gagal POST feedback ke Google Apps Script:', err);
        sendError = err.message || 'Koneksi gagal';
      }
    }

    // 5. Notifikasi Toast
    if (window.app && typeof window.app.showToast === 'function') {
      if (sendSuccess) {
        window.app.showToast('Evaluasi berhasil terkirim ke database Google Sheets.', 'success');
      } else {
        window.app.showToast('Evaluasi tersimpan lokal. Silakan gunakan opsi WhatsApp atau unduh JSON jika perlu.', 'info');
      }
    }

    // 6. Tampilkan layar sukses & export actions
    this.renderEvaluationSuccess(payload, sendSuccess, sendError);
  }

  renderEvaluationSuccess(data, sendSuccess = false, sendError = null) {
    const container = document.getElementById('evaluation-form-container');
    if (!container) return;

    const displayName = data.name || data.testerName || 'Tester';
    const displayTime = data.timestamp || new Date(data.submittedAt || data.isoTimestamp).toLocaleString('id-ID');
    const displayStages = data.completedStages || data.stagesCompleted || '7/7';
    const displaySuggestions = data.suggestions || data.futureSuggestions || '-';

    const waText = encodeURIComponent(
      `*EVALUASI TESTER - PROTOTIPE PATUNGAN AKUN*\n` +
      `--------------------------------------\n` +
      `Nama: ${displayName}\n` +
      `Waktu: ${displayTime}\n` +
      `Progres Misi: ${displayStages} Tahap\n` +
      `Rating Workflow: ${data.workflowRating}/5\n` +
      `Rating UI/UX: ${data.uiuxRating}/5\n\n` +
      `*Masukan Alur (Workflow):*\n${data.workflowFeedback}\n\n` +
      `*Masukan Tampilan (UI/UX):*\n${data.uiuxFeedback}\n\n` +
      `*Saran Fitur Baru:*\n${displaySuggestions}`
    );

    container.innerHTML = `
      <div class="space-y-4 text-center py-2">
        <div class="w-12 h-12 bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
          <i data-lucide="check-circle" class="w-6 h-6"></i>
        </div>
        <div>
          <h4 class="font-bold text-base text-slate-900">Evaluasi Anda Berhasil Disimpan</h4>
          <span class="text-[11px] font-mono text-slate-500">ID Tiket: ${data.id}</span>
        </div>

        <!-- STATUS PENGIRIMAN KE GOOGLE SHEETS -->
        ${sendSuccess ? `
          <div class="p-3 bg-emerald-50 border border-emerald-400 text-emerald-950 text-left shadow-sm">
            <div class="flex items-start gap-2.5">
              <div class="w-5 h-5 bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <i data-lucide="database" class="w-3.5 h-3.5"></i>
              </div>
              <div>
                <span class="font-bold text-xs uppercase block text-emerald-900">Terkirim Otomatis ke Database Google Sheets</span>
                <p class="text-[11px] text-emerald-800 leading-snug mt-0.5">
                  Data masukan Anda telah otomatis dicatat ke spreadsheet rekap riset tim pengembang. <b>Anda tidak wajib mengirim manual lagi.</b> Opsi tombol di bawah ini bersifat opsional untuk arsip pribadi Anda.
                </p>
              </div>
            </div>
          </div>
        ` : `
          <div class="p-3 bg-amber-50 border border-amber-300 text-amber-950 text-left shadow-sm">
            <div class="flex items-start gap-2.5">
              <div class="w-5 h-5 bg-amber-400 text-slate-900 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i>
              </div>
              <div>
                <span class="font-bold text-xs uppercase block text-amber-900">Data Tersimpan Aman di Penyimpanan Lokal</span>
                <p class="text-[11px] text-amber-800 leading-snug mt-0.5">
                  Pengiriman langsung ke Google Sheets sedang offline atau terkendala jaringan (${sendError || 'koneksi offline'}). Data Anda tetap aman tersimpan di browser. Silakan gunakan tombol cadangan <b>Kirim via WhatsApp</b> atau <b>Download JSON</b> di bawah ini agar masukan Anda tetap tersampaikan.
                </p>
              </div>
            </div>
          </div>
        `}

        <!-- Action Buttons -->
        <div class="space-y-2 pt-1 text-left">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block text-center">
            ${sendSuccess ? 'Opsi Arsip Pribadi / Cadangan (Opsional):' : 'Pilihan Pengiriman Cadangan:'}
          </span>
          
          <!-- WhatsApp Share -->
          <a href="https://wa.me/?text=${waText}" target="_blank" 
             class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
            <i data-lucide="message-circle" class="w-4 h-4"></i>
            <span>${sendSuccess ? 'Kirim Cadangan via WhatsApp (Opsional)' : 'Kirim Masukan via WhatsApp'}</span>
          </a>

          <!-- Download JSON -->
          <button onclick="guidedTesting.downloadJSON('${data.id}')" 
                  class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>Download File JSON (feedback-tester.json)</span>
          </button>

          <!-- Copy JSON -->
          <button onclick="guidedTesting.copyRawJSON('${data.id}')" 
                  class="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 flex items-center justify-center gap-2 transition-colors">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            <span>Salin Format JSON ke Clipboard</span>
          </button>
        </div>

        <div class="pt-2 border-t border-slate-200">
          <button onclick="guidedTesting.closeEvaluationModal()" class="text-xs text-slate-600 hover:text-slate-900 font-bold underline">
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

    const safeName = (item.name || item.testerName || 'tester').replace(/\s+/g, '_');
    const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${safeName}-${item.id}.json`;
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
        window.app.showToast('Data JSON berhasil disalin ke clipboard.', 'success');
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
