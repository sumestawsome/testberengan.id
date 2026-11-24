/**
 * data.js - Data Dummy & State Manager untuk "Patungan Akun"
 * Menggunakan localStorage untuk persistensi data secara offline/client-side.
 */

const DATA_VERSION = 'v2';
const STORAGE_KEY = 'patungan_akun_v1_state';

// Data default awal yang realistis dan komprehensif
const DEFAULT_DATA = {
  version: DATA_VERSION,
  currentUser: {
    id: 'usr_budi',
    name: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    phone: '081234567890',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    balance: 25000 // Sesuai spesifikasi: saldo awal Rp 25.000
  },
  availableUsers: [
    {
      id: 'usr_budi',
      name: 'Budi Santoso (Default)',
      email: 'budi.santoso@gmail.com',
      balance: 25000
    },
    {
      id: 'usr_siti',
      name: 'Siti Rahmawati (Saldo Melimpah)',
      email: 'siti.rahma@gmail.com',
      balance: 150000
    },
    {
      id: 'usr_tester_nol',
      name: 'Rian Pratama (Saldo Rp 0)',
      email: 'rian.pratama@gmail.com',
      balance: 0
    },
    {
      id: 'guest',
      name: 'Mode Tamu (Belum Login)',
      email: 'tamu@patungan.pro',
      balance: 0,
      isGuest: true
    }
  ],
  categories: [
    { id: 'all', name: 'Semua Kategori', icon: 'layout-grid' },
    { id: 'streaming', name: 'Streaming', icon: 'tv' },
    { id: 'desain', name: 'Desain', icon: 'palette' },
    { id: 'editing', name: 'Editing', icon: 'scissors' },
    { id: 'ai', name: 'AI Tools', icon: 'sparkles' }
  ],
  products: [
    {
      id: 'prod_netflix',
      name: 'Netflix Premium Ultra HD',
      category: 'streaming',
      tag: 'Paling Populer',
      badgeColor: 'bg-red-600',
      logo: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=300&q=80',
      icon: 'film',
      color: 'red',
      description: 'Nikmati jutaan film, drama series, dan tayangan original Netflix dalam resolusi 4K Ultra HD + HDR tanpa jeda iklan. 1 User = 1 Profile Resmi terpisah.',
      features: [
        'Kualitas 4K Ultra HD + Audio Spasial',
        '1 Profil khusus dengan PIN keamanan pribadi',
        'Bisa download tontonan untuk offline',
        'Tersedia di Smart TV, Laptop, Tablet, dan HP'
      ],
      rules: [
        'Hanya login pada 1 perangkat aktif dalam satu waktu.',
        'Hanya gunakan Profile yang sudah ditentukan untuk Anda.',
        'Dilarang mengubah Email, Password, atau Pengaturan Akun induk.',
        'Garansi perlindungan akun penuh selama periode langganan aktif.'
      ],
      plans: {
        '1_month': { name: '1 Bulan', price: 38000, durationDays: 30 },
        '3_month': { name: '3 Bulan', price: 105000, durationDays: 90, discount: 'Hemat 9%' }
      },
      maxSlots: 5
    },
    {
      id: 'prod_canva',
      name: 'Canva Pro Team',
      category: 'desain',
      tag: 'Best Value',
      badgeColor: 'bg-cyan-600',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
      icon: 'palette',
      color: 'cyan',
      description: 'Bebaskan kreativitas tanpa batas! Akses lebih dari 100+ juta template premium, foto stock, ilustrasi, font pro, serta fitur Magic Studio AI.',
      features: [
        'Akses 100+ juta stok foto, video, audio & grafik premium',
        'Background Remover instan sekali klik & Magic Eraser AI',
        'Cloud storage lega 1TB untuk seluruh aset tim',
        'Resize desain otomatis ke format sosmed apapun'
      ],
      rules: [
        'Diundang via email ke Canva Team resmi (privasi karya tetap aman).',
        'Desain Anda bersifat privat dan tidak dapat dilihat oleh anggota tim lain.',
        'Dilarang menghapus atau mengubah keanggotaan member lain.',
        'Dukungan penggantian grup cepat jika terjadi error invite.'
      ],
      plans: {
        '1_month': { name: '1 Bulan', price: 18000, durationDays: 30 },
        '3_month': { name: '3 Bulan', price: 49000, durationDays: 90, discount: 'Hemat 10%' }
      },
      maxSlots: 5
    },
    {
      id: 'prod_capcut',
      name: 'CapCut Pro',
      category: 'editing',
      tag: 'Viral Creator',
      badgeColor: 'bg-slate-900',
      logo: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=300&q=80',
      icon: 'scissors',
      color: 'slate',
      description: 'Software editing video andalan content creator TikTok & Reels. Unlock semua efek eksklusif, auto-caption cerdas, dan cloud storage 100GB.',
      features: [
        'Unlock ribuan efek, filter visual & transisi Pro eksklusif',
        'Auto Caption otomatis super akurat dalam Bahasa Indonesia',
        'AI Portrait, Chroma Key halus, dan AI Body Effects',
        'Export video 4K 60fps tanpa watermark CapCut'
      ],
      rules: [
        'Gunakan akun untuk 1 perangkat (Mobile atau PC).',
        'Dilarang melakukan logout manual terhadap device anggota lain.',
        'Simpan draft video penting pada penyimpanan internal perangkat.',
        'Hubungi admin jika memerlukan verifikasi kode login ulang.'
      ],
      plans: {
        '1_month': { name: '1 Bulan', price: 24000, durationDays: 30 },
        '3_month': { name: '3 Bulan', price: 68000, durationDays: 90, discount: 'Hemat 6%' }
      },
      maxSlots: 4
    },
    {
      id: 'prod_chatgpt',
      name: 'ChatGPT Plus (GPT-4o)',
      category: 'ai',
      tag: 'AI Terbaik',
      badgeColor: 'bg-emerald-600',
      logo: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=300&q=80',
      icon: 'sparkles',
      color: 'emerald',
      description: 'Akses kecerdasan model GPT-4o tercanggih dari OpenAI, pembuatan gambar DALL-E 3 kualitas studio, Advanced Data Analysis, dan Custom GPTs.',
      features: [
        'Akses penuh ke model unggulan GPT-4o & GPT-4',
        'DALL-E 3 image generation tanpa batasan tambahan',
        'Kemampuan analisis dokumen PDF, Excel, dan coding script',
        'Prioritas akses cepat saat jam sibuk dunia'
      ],
      rules: [
        'Gunakan session secara wajar (fair use) agar tidak kena limit per 3 jam.',
        'Dilarang menghapus riwayat chat atau instruksi kustom milik rekan sekelompok.',
        'Dilarang mendistribusikan kredensial akun kepada pihak ketiga.',
        'Dilarang memproses prompt terlarang yang melanggar ketentuan OpenAI.'
      ],
      plans: {
        '1_month': { name: '1 Bulan', price: 55000, durationDays: 30 },
        '3_month': { name: '3 Bulan', price: 155000, durationDays: 90, discount: 'Hemat 7%' }
      },
      maxSlots: 4
    },
    {
      id: 'prod_spotify',
      name: 'Spotify Premium Family',
      category: 'streaming',
      tag: 'Audio Musik',
      badgeColor: 'bg-green-600',
      logo: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=300&q=80',
      icon: 'headphones',
      color: 'green',
      description: 'Nikmati jutaan lagu bebas iklan, kualitas suara master 320kbps, dan download offline tak terbatas langsung di akun Spotify pribadi Anda.',
      features: [
        'Bebas iklan audio & visual tanpa batas skip',
        'Kualitas audio Master HiFi 320kbps',
        'Download lagu sepuasnya untuk mode offline',
        'Gunakan akun Spotify pribadi milik Anda sendiri'
      ],
      rules: [
        'Bergabung via link invite resmi Spotify Family yang dikirimkan.',
        'Wajib memasukkan alamat keluarga resmi yang tertera di sistem.',
        'Sesuai ketentuan Spotify, akun hanya dapat berganti Family setahun sekali.',
        'Garansi penuh selama masa aktif patungan berjalan.'
      ],
      plans: {
        '1_month': { name: '1 Bulan', price: 22000, durationDays: 30 },
        '3_month': { name: '3 Bulan', price: 62000, durationDays: 90, discount: 'Hemat 6%' }
      },
      maxSlots: 5
    }
  ],
  // Data grup patungan awal dengan kondisi testing yang spesifik sesuai requirement
  subscriptionGroups: [
    {
      id: 'grp_canva_11_expired',
      productId: 'prod_canva',
      groupNumber: '#11',
      planKey: '1_month',
      price: 18000,
      currentSlots: 2,
      maxSlots: 5,
      status: 'EXPIRED', // EXPIRED: 2/5 slot, waktu sudah habis (Edge Case 2B)
      expiresAt: Date.now() - (6 * 3600 * 1000), // 6 jam yang lalu
      members: ['usr_guest1', 'usr_guest2'],
      credentials: {
        type: 'team_invite',
        email: 'canva.expired11@patungan.pro',
        password: 'CanvaExpired2026!',
        pin: 'Grup ini dibatalkan otomatis karena kuota tidak terpenuhi tepat waktu',
        period: 'Waktu Habis / Kadaluwarsa',
        rules: 'Seluruh dana peserta grup ini telah dikembalikan 100% ke saldo dompet.'
      }
    },
    {
      id: 'grp_canva_12',
      productId: 'prod_canva',
      groupNumber: '#12',
      planKey: '1_month',
      price: 18000,
      currentSlots: 3,
      maxSlots: 5,
      status: 'OPEN', // OPEN: 3/5 slot, countdown sisa 1 hari 12 jam
      expiresAt: Date.now() + (36 * 3600 * 1000), // 36 jam (1 hari 12 jam)
      members: ['usr_dian', 'usr_fajar', 'usr_gina'],
      credentials: {
        type: 'team_invite',
        email: 'canva.vip12@patungan.pro',
        password: 'CanvaShare#2026!',
        pin: 'Undangan Tim: "Patungan Pro Squad 12"',
        period: '30 Hari sejak grup aktif',
        rules: 'Buka Canva > Ganti tim ke "Patungan Pro Squad 12" pada pojok kiri atas profil.'
      }
    },
    {
      id: 'grp_netflix_05',
      productId: 'prod_netflix',
      groupNumber: '#05',
      planKey: '1_month',
      price: 38000,
      currentSlots: 4,
      maxSlots: 5,
      status: 'OPEN', // OPEN HAMPIR PENUH: 4/5 slot (Cocok ngetes jadi orang terakhir langsung aktif!)
      expiresAt: Date.now() + (18 * 3600 * 1000), // 18 jam
      members: ['usr_rudi', 'usr_melisa', 'usr_angga', 'usr_hendra'],
      credentials: {
        type: 'profile_pin',
        email: 'netflix.patungan05@mailbox.id',
        password: 'Netfl1xPass#8892!',
        pin: 'Profil 5 (Nama: Member 5) - PIN: 7741',
        period: '30 Hari sejak kuota penuh',
        rules: 'Wajib masuk ke Profil 5 dan masukkan PIN 7741. Dilarang login profil lain!'
      }
    },
    {
      id: 'grp_netflix_06',
      productId: 'prod_netflix',
      groupNumber: '#06',
      planKey: '1_month',
      price: 38000,
      currentSlots: 5,
      maxSlots: 5,
      status: 'FULL', // FULL: 5/5 slot (tombol gabung harus disabled)
      expiresAt: Date.now() - (2 * 3600 * 1000),
      members: ['usr_t1', 'usr_t2', 'usr_t3', 'usr_t4', 'usr_t5'],
      credentials: {
        type: 'profile_pin',
        email: 'netflix.full06@mailbox.id',
        password: 'Netfl1xFull#2026',
        pin: 'Profil 1 s/d 5 (Sesuai Slot Member)',
        period: 'Aktif sampai 20 Des 2026',
        rules: 'Grup ini sudah penuh kuota dan sedang aktif berjalan.'
      }
    },
    {
      id: 'grp_capcut_03',
      productId: 'prod_capcut',
      groupNumber: '#03',
      planKey: '1_month',
      price: 24000,
      currentSlots: 2,
      maxSlots: 4,
      status: 'OPEN', // OPEN: 2/4 slot
      expiresAt: Date.now() + (52 * 3600 * 1000), // 2 hari 4 jam
      members: ['usr_c1', 'usr_c2'],
      credentials: {
        type: 'shared_account',
        email: 'capcut.pro03@patungan.pro',
        password: 'CapCutEdit2026!',
        pin: 'Login via Email/Password atau Scan QR dari HP',
        period: '30 Hari sejak kuota penuh',
        rules: 'Maksimal 1 device aktif per peserta. Dilarang klik "Logout All Devices".'
      }
    },
    {
      id: 'grp_chatgpt_08',
      productId: 'prod_chatgpt',
      groupNumber: '#08',
      planKey: '1_month',
      price: 55000,
      currentSlots: 1,
      maxSlots: 4,
      status: 'OPEN', // OPEN: 1/4 slot
      expiresAt: Date.now() + (72 * 3600 * 1000), // 3 hari
      members: ['usr_ai_user'],
      credentials: {
        type: 'shared_account',
        email: 'chatgpt.shared08@patungan.pro',
        password: 'OpenAI2026GPT4o!',
        pin: 'Simpan instruksi kustom pribadi tanpa hapus setting rekan',
        period: '30 Hari sejak kuota penuh',
        rules: 'Gunakan dengan santai agar tidak terkena limit OpenAI per 3 jam.'
      }
    },
    {
      id: 'grp_netflix_04_active',
      productId: 'prod_netflix',
      groupNumber: '#04',
      planKey: '1_month',
      price: 38000,
      currentSlots: 5,
      maxSlots: 5,
      status: 'ACTIVE', // Grup aktif bawaan agar tester langsung punya akun aktif untuk dilihat detailnya!
      expiresAt: Date.now() + (22 * 86400 * 1000),
      members: ['usr_budi', 'usr_userA', 'usr_userB', 'usr_userC', 'usr_userD'],
      credentials: {
        type: 'profile_pin',
        email: 'netflix.patungan04@mailbox.id',
        password: 'N3tfl!xSecure#991',
        pin: 'Profil 1 (Budi) - PIN: 8080',
        period: 'Aktif s/d 24 Des 2026 (Sisa 22 Hari)',
        rules: 'Hanya tonton di Profil 1 (Budi). Dilarang ubah password atau intip profil nomor lain.'
      }
    }
  ],
  // Pesanan awal milik user dummy (Budi Santoso) untuk mengilustrasikan berbagai status
  orders: [
    {
      id: 'ORD-98210',
      userId: 'usr_budi',
      groupId: 'grp_netflix_04_active',
      productId: 'prod_netflix',
      productName: 'Netflix Premium Ultra HD',
      planKey: '1_month',
      planName: '1 Bulan',
      amount: 38000,
      paymentMethod: 'SALDO',
      status: 'Aktif', // Pesanan Aktif untuk ngetes tombol "Lihat Detail Akun"
      proofFile: null,
      rejectReason: null,
      createdAt: new Date(Date.now() - (8 * 86400 * 1000)).toISOString(),
      activatedAt: new Date(Date.now() - (8 * 86400 * 1000)).toISOString()
    },
    {
      id: 'ORD-77125',
      userId: 'usr_budi',
      groupId: 'grp_canva_12',
      productId: 'prod_canva',
      productName: 'Canva Pro Team',
      planKey: '1_month',
      planName: '1 Bulan',
      amount: 18000,
      paymentMethod: 'SALDO',
      status: 'Menunggu Kuota', // Menunggu kuota grup #12 (saat ini 3/5)
      proofFile: null,
      rejectReason: null,
      createdAt: new Date(Date.now() - (2 * 3600 * 1000)).toISOString(),
      activatedAt: null
    },
    {
      id: 'ORD-55410',
      userId: 'usr_budi',
      groupId: 'grp_capcut_03',
      productId: 'prod_capcut',
      productName: 'CapCut Pro',
      planKey: '1_month',
      planName: '1 Bulan',
      amount: 24000,
      paymentMethod: 'TRANSFER_MANUAL',
      status: 'Menunggu Verifikasi', // Menunggu verifikasi admin (untuk dicoba di Mode Admin!)
      proofFile: 'bukti_transfer_bca_24000_budi.jpg',
      rejectReason: null,
      createdAt: new Date(Date.now() - (15 * 60 * 1000)).toISOString(),
      activatedAt: null
    }
  ],
  // Mutasi saldo awal milik Budi Santoso
  mutations: [
    {
      id: 'MUT-1001',
      userId: 'usr_budi',
      type: 'CREDIT',
      amount: 81000,
      title: 'Top Up Awal Akun Tester',
      date: new Date(Date.now() - (9 * 86400 * 1000)).toISOString()
    },
    {
      id: 'MUT-1002',
      userId: 'usr_budi',
      type: 'DEBIT',
      amount: 38000,
      title: 'Pembayaran Netflix Ultra HD (ORD-98210)',
      date: new Date(Date.now() - (8 * 86400 * 1000)).toISOString()
    },
    {
      id: 'MUT-1003',
      userId: 'usr_budi',
      type: 'DEBIT',
      amount: 18000,
      title: 'Pembayaran Canva Pro Team (ORD-77125)',
      date: new Date(Date.now() - (2 * 3600 * 1000)).toISOString()
    }
    // Saldo akhir: 81.000 - 38.000 - 18.000 = Rp 25.000 (Sesuai saldo awal Budi Santoso)
  ]
};

// State Manager Class
class StateManager {
  constructor() {
    this.init();
  }

  init() {
    // 1. Cek apakah URL mengandung query parameter ?reset=1
    let urlHasReset = false;
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        urlHasReset = window.location.search.includes('reset=1');
      }
    } catch (e) {}

    if (urlHasReset) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        // Hapus parameter ?reset=1 dari URL tanpa reload halaman
        if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
          const cleanUrl = window.location.pathname + (window.location.hash || '');
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (e) {}
      this.resetAll();
      return;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.resetAll();
    } else {
      try {
        this.state = JSON.parse(raw);

        // 2. Cek apakah data tersimpan memiliki version === DATA_VERSION
        if (!this.state || this.state.version !== DATA_VERSION) {
          console.info(`[Patungan Akun] Stored data version (${this.state ? this.state.version : 'none'}) is outdated. Resetting to ${DATA_VERSION}...`);
          this.resetAll();
          return;
        }

        // Pastikan fallback jika ada field yang kurang
        if (!this.state.currentUser && this.state.currentUser !== null) this.state.currentUser = DEFAULT_DATA.currentUser;
        if (!this.state.mutations) this.state.mutations = DEFAULT_DATA.mutations;
        if (!this.state.orders) this.state.orders = DEFAULT_DATA.orders;
        if (!this.state.subscriptionGroups) this.state.subscriptionGroups = DEFAULT_DATA.subscriptionGroups;
      } catch (e) {
        console.error('Error parsing stored state, resetting to default:', e);
        this.resetAll();
      }
    }
  }

  save() {
    if (this.state) {
      this.state.version = DATA_VERSION;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    window.dispatchEvent(new CustomEvent('patungan_state_updated', { detail: this.state }));
  }

  resetAll() {
    // Reset kembali ke data dummy murni
    const freshData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    freshData.version = DATA_VERSION;
    // Perbarui timestamp expiresAt agar selalu baru saat di-reset
    freshData.subscriptionGroups.forEach(g => {
      if (g.id === 'grp_canva_12') g.expiresAt = Date.now() + (36 * 3600 * 1000);
      if (g.id === 'grp_netflix_05') g.expiresAt = Date.now() + (18 * 3600 * 1000);
      if (g.id === 'grp_capcut_03') g.expiresAt = Date.now() + (52 * 3600 * 1000);
      if (g.id === 'grp_chatgpt_08') g.expiresAt = Date.now() + (72 * 3600 * 1000);
      if (g.id === 'grp_canva_11_expired') g.expiresAt = Date.now() - (6 * 3600 * 1000);
    });
    freshData.groupRequests = [];
    this.state = freshData;
    this.save();
    return this.state;
  }

  // --- User Operations ---
  getCurrentUser() {
    return this.state.currentUser;
  }

  isGuest() {
    return !this.state.currentUser || this.state.currentUser.isGuest || this.state.currentUser.id === 'guest';
  }

  getAvailableUsers() {
    return this.state.availableUsers || DEFAULT_DATA.availableUsers;
  }

  logout() {
    this.state.currentUser = null;
    this.save();
  }

  switchUser(userId) {
    if (userId === 'guest') {
      this.state.currentUser = null;
      this.save();
      return;
    }
    const found = this.state.availableUsers.find(u => u.id === userId);
    if (found) {
      this.state.currentUser = {
        ...found,
        name: found.name.split(' (')[0]
      };
      this.save();
    }
  }

  login(userId) {
    this.switchUser(userId);
  }

  registerUser(name, email) {
    const cleanName = (name || 'Pengguna Baru').trim();
    const cleanEmail = (email || 'user@patungan.pro').trim();
    const newUser = {
      id: 'usr_' + Math.floor(1000 + Math.random() * 9000),
      name: cleanName,
      email: cleanEmail,
      balance: 25000
    };
    if (!this.state.availableUsers) this.state.availableUsers = [...DEFAULT_DATA.availableUsers];
    this.state.availableUsers.unshift({
      ...newUser,
      name: `${cleanName} (Baru)`
    });
    this.state.currentUser = newUser;
    this.state.mutations.unshift({
      id: 'MUT-' + Math.floor(1000 + Math.random() * 9000),
      userId: newUser.id,
      type: 'CREDIT',
      amount: 25000,
      title: 'Bonus Pendaftaran Akun Baru',
      date: new Date().toISOString()
    });
    this.save();
    return newUser;
  }

  topUpBalance(amount, note = 'Top Up Saldo Mandiri') {
    if (this.isGuest()) return false;
    amount = Number(amount);
    if (isNaN(amount) || amount <= 0) return false;
    
    this.state.currentUser.balance += amount;
    
    // Tambah mutasi
    const mutation = {
      id: 'MUT-' + Math.floor(1000 + Math.random() * 9000),
      userId: this.state.currentUser.id,
      type: 'CREDIT',
      amount: amount,
      title: note,
      date: new Date().toISOString()
    };
    this.state.mutations.unshift(mutation);
    this.save();
    return true;
  }

  // --- Catalog & Group Operations ---
  getCategories() {
    return this.state.categories;
  }

  getProducts(categoryId = null) {
    if (!categoryId || categoryId === 'all') {
      return this.state.products;
    }
    return this.state.products.filter(p => p.category === categoryId);
  }

  getProductById(id) {
    return this.state.products.find(p => p.id === id);
  }

  getGroupsByProduct(productId) {
    return this.state.subscriptionGroups.filter(g => g.productId === productId);
  }

  getAllGroups() {
    return this.state.subscriptionGroups;
  }

  getGroupById(id) {
    return this.state.subscriptionGroups.find(g => g.id === id);
  }

  // --- Orders & Checkout ---
  getUserOrders() {
    if (this.isGuest()) return [];
    const uid = this.state.currentUser.id;
    return this.state.orders.filter(o => o.userId === uid);
  }

  getAllOrders() {
    return this.state.orders;
  }

  getOrderById(id) {
    return this.state.orders.find(o => o.id === id);
  }

  getUserMutations() {
    if (this.isGuest()) return [];
    const uid = this.state.currentUser.id;
    return this.state.mutations.filter(m => m.userId === uid);
  }

  /**
   * Proses pembuatan pesanan baru (Checkout)
   * @param {Object} param0 
   * { groupId, planKey, paymentMethod: 'SALDO' | 'TRANSFER_MANUAL', proofFile }
   */
  createOrder({ groupId, planKey = '1_month', paymentMethod, proofFile = null }) {
    if (this.isGuest()) {
      throw new Error('AUTH_REQUIRED');
    }

    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Grup patungan tidak ditemukan.');
    
    // Cek race condition / slot penuh
    if (group.status !== 'OPEN' || group.currentSlots >= group.maxSlots) {
      throw new Error('SLOT_FULL_RACE_CONDITION');
    }

    const product = this.getProductById(group.productId);
    const plan = product.plans[planKey] || Object.values(product.plans)[0];
    const amount = plan.price;
    const user = this.state.currentUser;

    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    let orderStatus = 'Menunggu Kuota';

    if (paymentMethod === 'SALDO') {
      // Cek apakah saldo mencukupi
      if (user.balance < amount) {
        throw new Error(`Saldo tidak mencukupi (Saldo Anda: Rp ${user.balance.toLocaleString('id-ID')}, Dibutuhkan: Rp ${amount.toLocaleString('id-ID')}). Silakan top up atau gunakan Transfer Manual.`);
      }

      // Potong saldo user
      user.balance -= amount;

      // Catat mutasi DEBIT
      this.state.mutations.unshift({
        id: 'MUT-' + Math.floor(1000 + Math.random() * 9000),
        userId: user.id,
        type: 'DEBIT',
        amount: amount,
        title: `Pembayaran ${product.name} ${group.groupNumber} (${orderId})`,
        date: new Date().toISOString()
      });

      // Tambahkan slot grup langsung +1
      group.currentSlots += 1;
      if (!group.members.includes(user.id)) {
        group.members.push(user.id);
      }

      // Cek apakah dengan penambahan ini grup menjadi PENUH (5/5 atau maxSlots)
      if (group.currentSlots >= group.maxSlots) {
        group.status = 'ACTIVE';
        group.activatedAt = new Date().toISOString();
        orderStatus = 'Aktif';

        // Aktifkan juga seluruh pesanan lain yang ada di dalam grup ini
        this.state.orders.forEach(o => {
          if (o.groupId === group.id && (o.status === 'Menunggu Kuota' || o.status === 'Menunggu Verifikasi')) {
            o.status = 'Aktif';
            o.activatedAt = new Date().toISOString();
          }
        });
      } else {
        orderStatus = 'Menunggu Kuota';
      }

    } else if (paymentMethod === 'TRANSFER_MANUAL') {
      // Untuk transfer manual, status Menunggu Verifikasi admin
      orderStatus = 'Menunggu Verifikasi';
      // Slot belum dinaikkan sampai admin menekan tombol Approve
    } else {
      throw new Error('Metode pembayaran tidak valid.');
    }

    const newOrder = {
      id: orderId,
      userId: user.id,
      groupId: group.id,
      productId: product.id,
      productName: product.name,
      planKey: planKey,
      planName: plan.name,
      amount: amount,
      paymentMethod: paymentMethod,
      status: orderStatus,
      proofFile: proofFile,
      rejectReason: null,
      createdAt: new Date().toISOString(),
      activatedAt: orderStatus === 'Aktif' ? new Date().toISOString() : null
    };

    this.state.orders.unshift(newOrder);
    this.save();
    return { order: newOrder, group: group };
  }

  // --- Admin Simulator Operations ---

  /**
   * Approve pesanan transfer manual oleh admin
   */
  approveOrder(orderId) {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Pesanan tidak ditemukan.');
    if (order.status !== 'Menunggu Verifikasi') throw new Error('Hanya pesanan Menunggu Verifikasi yang dapat di-approve.');

    const group = this.getGroupById(order.groupId);
    if (!group) throw new Error('Grup terkait tidak ditemukan.');

    // Tambah slot grup +1
    group.currentSlots += 1;
    if (!group.members.includes(order.userId)) {
      group.members.push(order.userId);
    }

    // Jika slot menjadi penuh
    if (group.currentSlots >= group.maxSlots) {
      group.status = 'ACTIVE';
      group.activatedAt = new Date().toISOString();
      order.status = 'Aktif';
      order.activatedAt = new Date().toISOString();

      // Aktifkan semua pesanan di grup ini
      this.state.orders.forEach(o => {
        if (o.groupId === group.id && (o.status === 'Menunggu Kuota' || o.status === 'Menunggu Verifikasi')) {
          o.status = 'Aktif';
          o.activatedAt = new Date().toISOString();
        }
      });
    } else {
      order.status = 'Menunggu Kuota';
    }

    this.save();
    return { order, group };
  }

  /**
   * Reject pesanan transfer manual oleh admin
   */
  rejectOrder(orderId, reason = 'Bukti transfer tidak valid atau nominal tidak sesuai') {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Pesanan tidak ditemukan.');
    if (order.status !== 'Menunggu Verifikasi') throw new Error('Hanya pesanan Menunggu Verifikasi yang dapat ditolak.');

    order.status = 'Ditolak';
    order.rejectReason = reason;

    this.save();
    return order;
  }

  /**
   * Simulator: Mengisi grup hingga penuh dan langsung mengaktifkannya
   */
  simulateFillGroup(groupId) {
    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Grup tidak ditemukan.');

    group.currentSlots = group.maxSlots;
    group.status = 'ACTIVE';
    group.activatedAt = new Date().toISOString();

    // Aktifkan semua pesanan di dalam grup ini
    let activatedCount = 0;
    this.state.orders.forEach(o => {
      if (o.groupId === group.id && (o.status === 'Menunggu Kuota' || o.status === 'Menunggu Verifikasi')) {
        o.status = 'Aktif';
        o.activatedAt = new Date().toISOString();
        activatedCount++;
      }
    });

    this.save();
    return { group, activatedOrders: activatedCount };
  }

  /**
   * Simulator: Waktu habis (Expired), grup dibatalkan dan 100% dana direfund ke saldo user
   */
  simulateExpireGroup(groupId) {
    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Grup tidak ditemukan.');

    group.status = 'EXPIRED';
    const product = this.getProductById(group.productId);

    let refundedCount = 0;
    let totalRefundedAmount = 0;

    // Cari semua pesanan di grup ini yang belum kadaluwarsa/refund/ditolak
    this.state.orders.forEach(o => {
      if (o.groupId === group.id && (o.status === 'Menunggu Kuota' || o.status === 'Menunggu Verifikasi' || o.status === 'Aktif')) {
        o.status = 'Refund';
        refundedCount++;
        totalRefundedAmount += o.amount;

        // Jika user yang punya pesanan adalah currentUser (atau user terkait), kembalikan dana ke saldo
        if (o.userId === this.state.currentUser.id) {
          this.state.currentUser.balance += o.amount;
        }

        // Catat mutasi CREDIT pengembalian dana
        this.state.mutations.unshift({
          id: 'MUT-' + Math.floor(1000 + Math.random() * 9000),
          userId: o.userId,
          type: 'CREDIT',
          amount: o.amount,
          title: `Refund Otomatis: Kuota ${product.name} ${group.groupNumber} Expired (${o.id})`,
          date: new Date().toISOString()
        });
      }
    });

    this.save();
    return { group, refundedCount, totalRefundedAmount };
  }

  /**
   * Simulator: Menyerobot slot grup sehingga menjadi penuh (Simulasi Race Condition)
   */
  simulateSlotRaceCondition(groupId) {
    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Grup tidak ditemukan.');
    group.currentSlots = group.maxSlots;
    group.status = 'FULL';
    this.save();
    return group;
  }

  /**
   * Upload ulang bukti transfer untuk pesanan yang ditolak
   */
  reuploadProof(orderId, newProofFile) {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Pesanan tidak ditemukan.');
    order.status = 'Menunggu Verifikasi';
    order.proofFile = newProofFile || 'bukti_transfer_reupload.jpg';
    order.rejectReason = null;
    order.updatedAt = new Date().toISOString();
    this.save();
    return order;
  }

  /**
   * Request pembukaan grup baru oleh user untuk produk yang belum ada grup
   */
  requestGroup(productId) {
    if (!this.state.groupRequests) this.state.groupRequests = [];
    if (!this.state.groupRequests.includes(productId)) {
      this.state.groupRequests.push(productId);
    }
    this.save();
    return true;
  }

  getGroupRequests() {
    return this.state.groupRequests || [];
  }

  /**
   * Mode Admin: Membuat grup patungan baru secara manual
   */
  createGroup({ productId, planKey = '1_month', durationDays = 3 }) {
    const product = this.getProductById(productId);
    if (!product) throw new Error('Produk tidak ditemukan.');

    const existingGroups = this.getGroupsByProduct(productId);
    const nextNum = existingGroups.length + 1;
    const groupNumber = '#' + nextNum.toString().padStart(2, '0');
    const plan = product.plans[planKey] || Object.values(product.plans)[0];

    const newGroup = {
      id: `grp_${productId.replace('prod_', '')}_${Date.now().toString().slice(-4)}`,
      productId: product.id,
      groupNumber: groupNumber,
      planKey: planKey,
      price: plan.price,
      currentSlots: 0,
      maxSlots: product.maxSlots,
      status: 'OPEN',
      expiresAt: Date.now() + (durationDays * 24 * 3600 * 1000),
      members: [],
      credentials: {
        type: 'standard',
        email: `${productId.replace('prod_', '')}.patungan${nextNum}@mailbox.id`,
        password: `Patungan${productId.replace('prod_', '')}2026!`,
        pin: `Slot Profil 1 s/d ${product.maxSlots}`,
        period: `${plan.durationDays} Hari sejak kuota penuh`,
        rules: product.rules.join(' ')
      }
    };

    this.state.subscriptionGroups.unshift(newGroup);

    // Hapus dari requested products jika ada
    if (this.state.groupRequests) {
      this.state.groupRequests = this.state.groupRequests.filter(id => id !== productId);
    }

    this.save();
    return newGroup;
  }
}

// Inisialisasi global instance StateManager
window.patunganState = new StateManager();
