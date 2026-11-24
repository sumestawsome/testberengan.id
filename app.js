/**
 * app.js - Controller, UI Renderer, and Interaction Logic
 * SPA Controller untuk "Patungan Akun" Clickable Prototype.
 */

class AppController {
  constructor() {
    this.currentView = 'home';
    this.viewParams = {};
    this.timerInterval = null;
    this.selectedPlanDuration = '1_month';
    this.selectedPaymentMethod = 'SALDO';
    this.uploadedProofFile = null;
    this.categoryFilter = 'all';
    this.searchQuery = '';
    this.pendingCheckout = null; // Menyimpan data grup yang ingin diikuti saat dicegat login
    this.checkoutRaceConditionError = false; // Flag error jika slot penuh saat checkout
    this.reuploadOrderId = null; // Menyimpan orderId yang sedang diunggah ulang buktinya
    this.reuploadFileName = null;
    
    // Chatbot memory
    this.chatMessages = [
      {
        sender: 'ai',
        text: 'Halo! Saya Asisten AI Patungan Akun. Butuh rekomendasi paket hemat atau ingin tahu sistem patungan & garansi refund? Silakan tanya apa saja ya!'
      }
    ];

    this.init();
  }

  init() {
    // Listen to hash changes for SPA routing
    window.addEventListener('hashchange', () => this.handleHashChange());
    
    // Listen to state changes from data.js
    window.addEventListener('patungan_state_updated', () => {
      this.updateNavbarBadges();
      this.renderCurrentView();
    });

    // Start live countdown ticker (1 sec interval)
    this.startCountdownTicker();

    // Initial route handling
    this.handleHashChange();
    this.updateNavbarBadges();
    this.renderChatMessages();

    // Backdrop click listener to close modals
    document.addEventListener('click', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('modal-backdrop')) {
        e.target.classList.add('hidden');
      }
    });

    // Re-initialize Lucide icons safely
    this.safeRenderIcons();
  }

  safeRenderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Alias for footer links
  filterCategory(catId) {
    this.navigate('home');
    this.setCategoryFilter(catId);
  }

  // --- SPA ROUTING ---
  handleHashChange() {
    const hash = window.location.hash || '#/';
    const [path, queryString] = hash.split('?');
    const queryParams = new URLSearchParams(queryString || '');
    
    if (path === '#/' || path === '') {
      this.currentView = 'home';
      this.viewParams = {};
    } else if (path.startsWith('#/product/')) {
      this.currentView = 'product-detail';
      this.viewParams = {
        productId: path.replace('#/product/', ''),
        planKey: queryParams.get('plan') || this.selectedPlanDuration || '1_month'
      };
      this.selectedPlanDuration = this.viewParams.planKey;
    } else if (path.startsWith('#/checkout/')) {
      this.currentView = 'checkout';
      this.checkoutRaceConditionError = false;
      this.viewParams = {
        groupId: path.replace('#/checkout/', ''),
        planKey: queryParams.get('plan') || '1_month'
      };
    } else if (path === '#/my-orders') {
      this.currentView = 'my-orders';
      this.viewParams = {
        tab: queryParams.get('tab') || 'all'
      };
    } else if (path === '#/admin') {
      this.currentView = 'admin';
      this.viewParams = {};
    } else {
      this.currentView = 'home';
      this.viewParams = {};
    }

    this.updateActiveNavUI();
    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigate(view, params = {}) {
    let hash = '#/';
    if (view === 'home') {
      hash = '#/';
    } else if (view === 'product-detail') {
      hash = `#/product/${params.productId || ''}${params.planKey ? '?plan=' + params.planKey : ''}`;
    } else if (view === 'checkout') {
      hash = `#/checkout/${params.groupId || ''}${params.planKey ? '?plan=' + params.planKey : ''}`;
    } else if (view === 'my-orders') {
      hash = `#/my-orders${params.tab ? '?tab=' + params.tab : ''}`;
    } else if (view === 'admin') {
      hash = '#/admin';
    }
    window.location.hash = hash;
  }

  updateActiveNavUI() {
    const navHome = document.getElementById('nav-btn-home');
    const navOrders = document.getElementById('nav-btn-orders');
    const navAdmin = document.getElementById('nav-btn-admin');

    const defaultClass = "px-4 py-2 text-sm font-bold border-2 border-transparent hover:border-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2";
    const activeClass = "px-4 py-2 text-sm font-bold border-2 border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2";

    if (navHome) navHome.className = (this.currentView === 'home' || this.currentView === 'product-detail') ? activeClass : defaultClass;
    if (navOrders) navOrders.className = (this.currentView === 'my-orders' || this.currentView === 'checkout') ? activeClass : defaultClass;
    
    if (navAdmin) {
      if (this.currentView === 'admin') {
        navAdmin.className = "px-3 py-1.5 text-xs font-bold bg-slate-900 text-amber-400 border-2 border-amber-400 shadow-[2px_2px_0px_0px_rgba(245,158,11,1)] flex items-center gap-1.5 transition-all";
      } else {
        navAdmin.className = "px-3 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 transition-all";
      }
    }
  }

  updateNavbarBadges() {
    const isGuest = patunganState.isGuest();
    const user = patunganState.getCurrentUser();
    const orders = patunganState.getUserOrders();
    const allOrders = patunganState.getAllOrders();

    const userPill = document.getElementById('nav-user-pill');
    const guestBtn = document.getElementById('nav-guest-login-btn');
    const userNameEl = document.getElementById('nav-user-name');
    const userBalanceEl = document.getElementById('nav-user-balance');

    if (isGuest) {
      if (userPill) userPill.classList.add('hidden');
      if (guestBtn) guestBtn.classList.remove('hidden');
    } else {
      if (userPill) userPill.classList.remove('hidden');
      if (guestBtn) guestBtn.classList.add('hidden');
      if (userNameEl && user) userNameEl.innerText = user.name;
      if (userBalanceEl && user) userBalanceEl.innerText = `Rp ${user.balance.toLocaleString('id-ID')}`;
    }

    // Orders badge
    const activeCount = orders.filter(o => o.status === 'Aktif' || o.status === 'Menunggu Kuota').length;
    const ordersBadgeEl = document.getElementById('nav-orders-badge');
    if (ordersBadgeEl) {
      if (!isGuest && activeCount > 0) {
        ordersBadgeEl.innerText = activeCount;
        ordersBadgeEl.classList.remove('hidden');
      } else {
        ordersBadgeEl.classList.add('hidden');
      }
    }

    // Admin pending badge
    const pendingCount = allOrders.filter(o => o.status === 'Menunggu Verifikasi').length;
    const pendingBadgeEl = document.getElementById('nav-pending-badge');
    if (pendingBadgeEl) {
      if (pendingCount > 0) {
        pendingBadgeEl.innerText = pendingCount;
        pendingBadgeEl.classList.remove('hidden');
      } else {
        pendingBadgeEl.classList.add('hidden');
      }
    }
  }

  // --- RENDER ROUTER DISPATCHER ---
  renderCurrentView() {
    const container = document.getElementById('app-view');
    if (!container) return;

    if (this.currentView === 'home') {
      container.innerHTML = this.renderHomeView();
    } else if (this.currentView === 'product-detail') {
      container.innerHTML = this.renderProductDetailView(this.viewParams.productId);
    } else if (this.currentView === 'checkout') {
      container.innerHTML = this.renderCheckoutView(this.viewParams.groupId);
    } else if (this.currentView === 'my-orders') {
      container.innerHTML = this.renderMyOrdersView();
    } else if (this.currentView === 'admin') {
      container.innerHTML = this.renderAdminView();
    }

    // Refresh icons
    this.safeRenderIcons();
    // Update live countdowns immediately
    this.updateCountdownElements();
  }

  // ========================================================
  // VIEW 1: HOME (KATALOG PRODUK)
  // ========================================================
  renderHomeView() {
    const categories = patunganState.getCategories();
    let products = patunganState.getProducts(this.categoryFilter);

    // Apply Search Filter
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    const allGroups = patunganState.getAllGroups();

    return `
      <!-- HERO BANNER -->
      <section class="bg-slate-900 text-white border-2 border-slate-900 p-6 sm:p-10 mb-8 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden">
        <div class="max-w-3xl relative z-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-900 font-extrabold text-xs mb-4 uppercase tracking-wider">
            <i data-lucide="zap" class="w-3.5 h-3.5"></i> Patungan Resmi • Hemat Hingga 75%
          </div>
          <h1 class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
            Akses Akun Premium Favoritmu Bersama-sama.
          </h1>
          <p class="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
            Bagi biaya langganan Netflix, Canva Pro, CapCut, dan ChatGPT Plus secara adil. Sistem grup otomatis, masa aktif terhitung setelah kuota penuh, dan saldo bergaransi refund 100%.
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <button onclick="document.getElementById('catalog-search').focus()" 
                    class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] flex items-center gap-2">
              <i data-lucide="search" class="w-4 h-4"></i> Mulai Cari Akun
            </button>
            <button onclick="app.openChatWithPrompt('Gimana sistem patungan & refund?')" 
                    class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border-2 border-slate-700 flex items-center gap-2">
              <i data-lucide="help-circle" class="w-4 h-4"></i> Cara Kerja & Refund
            </button>
          </div>
        </div>
      </section>

      <!-- VALUE PROPOSITIONS -->
      <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="p-4 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-start gap-3">
          <div class="w-9 h-9 bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 border border-slate-900">
            <i data-lucide="shield-check" class="w-5 h-5"></i>
          </div>
          <div>
            <h4 class="font-extrabold text-xs uppercase tracking-wider text-slate-900">Garansi Penuh 100%</h4>
            <p class="text-xs text-slate-600 mt-1 leading-snug">Jika kuota grup belum terpenuhi saat waktu habis, dana otomatis refund ke dompet.</p>
          </div>
        </div>
        <div class="p-4 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-start gap-3">
          <div class="w-9 h-9 bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0 border border-slate-900">
            <i data-lucide="users" class="w-5 h-5"></i>
          </div>
          <div>
            <h4 class="font-extrabold text-xs uppercase tracking-wider text-slate-900">Grup Transparan</h4>
            <p class="text-xs text-slate-600 mt-1 leading-snug">Pantau slot grup patungan secara real-time. Langsung aktif ketika kuota tercapai.</p>
          </div>
        </div>
        <div class="p-4 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-start gap-3">
          <div class="w-9 h-9 bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0 border border-slate-900">
            <i data-lucide="clock" class="w-5 h-5"></i>
          </div>
          <div>
            <h4 class="font-extrabold text-xs uppercase tracking-wider text-slate-900">Masa Aktif Fair</h4>
            <p class="text-xs text-slate-600 mt-1 leading-snug">Durasi langganan baru mulai dihitung saat grup full 5/5, tidak ada hari yang terbuang.</p>
          </div>
        </div>
      </section>

      <!-- SEARCH & FILTER BAR -->
      <section class="mb-6 space-y-4">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          <!-- Category Tabs -->
          <div class="flex flex-wrap gap-1.5">
            ${categories.map(cat => {
              const isActive = this.categoryFilter === cat.id;
              const btnClass = isActive 
                ? 'bg-slate-900 text-white border-2 border-slate-900 font-bold shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 font-semibold';
              return `
                <button onclick="app.setCategoryFilter('${cat.id}')" 
                        class="px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all ${btnClass}">
                  <i data-lucide="${cat.icon}" class="w-3.5 h-3.5"></i> ${cat.name}
                </button>
              `;
            }).join('')}
          </div>

          <!-- Search Input -->
          <div class="relative sm:w-72">
            <input type="text" id="catalog-search" value="${this.searchQuery}" 
                   oninput="app.handleSearchInput(this.value)"
                   placeholder="Cari aplikasi atau fitur..." 
                   class="w-full pl-9 pr-3 py-2 text-xs border-2 border-slate-900 bg-white focus:outline-none focus:bg-blue-50 font-medium" />
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
            ${this.searchQuery ? `
              <button onclick="app.clearSearch()" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-800">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
          </div>

        </div>
      </section>

      <!-- PRODUCT CARDS GRID -->
      <section>
        ${products.length === 0 ? `
          <div class="bg-white border-2 border-slate-900 p-12 text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <i data-lucide="package-search" class="w-12 h-12 mx-auto text-slate-400 mb-3"></i>
            <h3 class="font-bold text-base text-slate-800">Produk Tidak Ditemukan</h3>
            <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Tidak ada aplikasi yang cocok dengan pencarian "${this.searchQuery}". Silakan coba kata kunci lain atau reset filter.</p>
            <button onclick="app.resetFilter()" class="mt-4 px-4 py-2 bg-slate-900 text-white font-bold text-xs">
              Reset Pencarian
            </button>
          </div>
        ` : `
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${products.map(product => {
              const openGroups = allGroups.filter(g => g.productId === product.id && g.status === 'OPEN');
              const minPrice = product.plans['1_month'].price;
              
              // Cek apakah ada grup yang hampir penuh (misal slot 4/5)
              const almostFullGroup = openGroups.find(g => g.currentSlots === g.maxSlots - 1);

              return `
                <div class="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1 transition-all flex flex-col justify-between">
                  
                  <!-- Card Header -->
                  <div>
                    <div class="p-4 border-b-2 border-slate-900 bg-slate-50 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 ${product.badgeColor} text-white flex items-center justify-center font-bold border border-slate-900">
                          <i data-lucide="${product.icon}" class="w-4 h-4"></i>
                        </div>
                        <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">${product.category}</span>
                      </div>
                      <span class="px-2 py-0.5 text-[10px] font-bold bg-amber-300 text-slate-900 border border-slate-900">
                        ${product.tag}
                      </span>
                    </div>

                    <!-- Card Body -->
                    <div class="p-4">
                      <h3 class="font-extrabold text-base text-slate-900 mb-1 leading-tight">${product.name}</h3>
                      <p class="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">${product.description}</p>
                      
                      <!-- Open groups availability badge -->
                      <div class="mb-4">
                        ${openGroups.length === 0 ? `
                          <div class="bg-slate-100 border border-slate-300 text-slate-500 p-2 text-[11px] font-bold flex items-center justify-between">
                            <span>Status Grup:</span>
                            <span class="text-slate-600 font-mono">Belum Ada Grup Terbuka</span>
                          </div>
                        ` : almostFullGroup ? `
                          <div class="bg-amber-50 border border-amber-300 text-amber-900 p-2 text-[11px] font-bold flex items-center gap-1.5">
                            <span class="w-2 h-2 bg-amber-500 pulse-live"></span>
                            <span>Grup ${almostFullGroup.groupNumber} Sisa 1 Slot! (Langsung Aktif)</span>
                          </div>
                        ` : `
                          <div class="bg-slate-100 border border-slate-300 text-slate-700 p-2 text-[11px] font-semibold flex items-center justify-between">
                            <span>Grup Patungan Aktif:</span>
                            <span class="font-bold font-mono text-blue-600">${openGroups.length} Grup Siap</span>
                          </div>
                        `}
                      </div>

                      <!-- Key Features -->
                      <ul class="space-y-1.5 mb-4 text-[11px] text-slate-700">
                        ${product.features.slice(0, 2).map(f => `
                          <li class="flex items-start gap-1.5">
                            <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"></i>
                            <span class="line-clamp-1">${f}</span>
                          </li>
                        `).join('')}
                      </ul>
                    </div>
                  </div>

                  <!-- Card Footer & Pricing CTA -->
                  <div class="p-4 bg-slate-50 border-t-2 border-slate-900">
                    <div class="mb-3">
                      <span class="text-[10px] uppercase font-bold text-slate-500 block">Mulai dari</span>
                      <div class="flex items-baseline gap-1">
                        <span class="text-lg font-black font-mono text-slate-900">Rp ${minPrice.toLocaleString('id-ID')}</span>
                        <span class="text-[10px] text-slate-500 font-medium">/ bulan</span>
                      </div>
                    </div>

                    <button onclick="app.navigate('product-detail', { productId: '${product.id}' })" 
                            class="w-full py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider border-2 border-slate-900 flex items-center justify-center gap-1.5 transition-colors">
                      <span>Pilih Paket & Grup</span>
                      <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        `}
      </section>
    `;
  }

  setCategoryFilter(catId) {
    this.categoryFilter = catId;
    this.renderCurrentView();
  }

  handleSearchInput(val) {
    this.searchQuery = val;
    this.renderCurrentView();
  }

  clearSearch() {
    this.searchQuery = '';
    this.renderCurrentView();
  }

  resetFilter() {
    this.searchQuery = '';
    this.categoryFilter = 'all';
    this.renderCurrentView();
  }

  // ========================================================
  // VIEW 2: PRODUCT DETAIL & GRUP PATUNGAN
  // ========================================================
  renderProductDetailView(productId) {
    const product = patunganState.getProductById(productId);
    if (!product) {
      return `
        <div class="bg-white border-2 border-slate-900 p-8 text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <h3 class="font-bold text-lg text-red-600">Produk tidak ditemukan</h3>
          <p class="text-xs text-slate-600 mt-2">Produk ID "${productId}" tidak terdaftar dalam database.</p>
          <button onclick="app.navigate('home')" class="mt-4 px-4 py-2 bg-slate-900 text-white font-bold text-xs">
            Kembali ke Katalog
          </button>
        </div>
      `;
    }

    const currentPlanKey = this.selectedPlanDuration || '1_month';
    const plan = product.plans[currentPlanKey] || product.plans['1_month'];
    const groups = patunganState.getGroupsByProduct(product.id);

    return `
      <!-- BREADCRUMB -->
      <nav class="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
        <button onclick="app.navigate('home')" class="hover:text-blue-600">Beranda</button>
        <span>/</span>
        <span class="uppercase tracking-wider font-mono">${product.category}</span>
        <span>/</span>
        <span class="text-slate-900 font-bold">${product.name}</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        
        <!-- LEFT COLUMN: PRODUCT INFO & RULES -->
        <div class="lg:col-span-1 space-y-6">
          
          <!-- Product Main Card -->
          <div class="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 ${product.badgeColor} text-white flex items-center justify-center font-bold border-2 border-slate-900">
                <i data-lucide="${product.icon}" class="w-6 h-6"></i>
              </div>
              <div>
                <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">${product.category}</span>
                <h1 class="font-black text-xl text-slate-900 leading-tight">${product.name}</h1>
              </div>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed mb-6">${product.description}</p>

            <!-- Plan Duration Selector -->
            <div class="mb-6">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">Pilih Durasi Langganan:</label>
              <div class="grid grid-cols-2 gap-2">
                ${Object.entries(product.plans).map(([key, p]) => {
                  const isSelected = key === currentPlanKey;
                  return `
                    <button onclick="app.selectProductPlan('${product.id}', '${key}')" 
                            class="p-2.5 text-left border-2 transition-all ${
                              isSelected 
                                ? 'border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]' 
                                : 'border-slate-300 bg-white hover:border-slate-800 text-slate-800'
                            }">
                      <div class="text-xs font-bold flex items-center justify-between">
                        <span>${p.name}</span>
                        ${p.discount ? `<span class="text-[9px] px-1 bg-amber-400 text-slate-900 font-black">${p.discount}</span>` : ''}
                      </div>
                      <div class="text-sm font-mono font-extrabold mt-1">Rp ${p.price.toLocaleString('id-ID')}</div>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Features Checklist -->
            <div class="border-t-2 border-slate-100 pt-4">
              <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-3">Keuntungan Paket:</h4>
              <ul class="space-y-2 text-xs text-slate-700">
                ${product.features.map(f => `
                  <li class="flex items-start gap-2">
                    <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
                    <span>${f}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <!-- Rules Card -->
          <div class="bg-amber-50 border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <div class="flex items-center gap-2 mb-3 text-amber-900">
              <i data-lucide="alert-octagon" class="w-4 h-4"></i>
              <h4 class="font-black text-xs uppercase tracking-wider">Aturan Penting Patungan:</h4>
            </div>
            <ul class="space-y-2 text-xs text-amber-950">
              ${product.rules.map(r => `
                <li class="flex items-start gap-1.5 leading-snug">
                  <span class="font-bold">•</span>
                  <span>${r}</span>
                </li>
              `).join('')}
            </ul>
          </div>

        </div>

        <!-- RIGHT COLUMN: SUBSCRIPTION GROUPS -->
        <div class="lg:col-span-2 space-y-4">
          
          <div class="bg-white border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 class="font-black text-lg text-slate-900">Daftar Grup Patungan Tersedia</h2>
              <p class="text-xs text-slate-600">Pilih grup yang ingin Anda ikuti. Akun langsung aktif begitu kuota grup penuh!</p>
            </div>
            <div class="flex items-center gap-2 text-xs font-mono font-bold bg-slate-100 px-3 py-1.5 border border-slate-300">
              <span class="w-2.5 h-2.5 bg-emerald-500"></span>
              <span>Kapasitas: ${product.maxSlots} Orang / Akun</span>
            </div>
          </div>

          <!-- Groups List -->
          <div class="space-y-4">
            ${groups.length === 0 ? `
              <div class="bg-white border-2 border-slate-900 p-8 text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <div class="w-12 h-12 bg-slate-100 border-2 border-slate-900 text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <i data-lucide="package-search" class="w-6 h-6"></i>
                </div>
                <h3 class="font-extrabold text-base text-slate-900">Belum Ada Grup Patungan Terbuka</h3>
                <p class="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                  Saat ini belum ada grup patungan yang dibuka untuk layanan ini. Anda dapat mengajukan pembukaan grup baru atau langsung membukanya di Mode Admin.
                </p>
                <div class="mt-5 flex flex-wrap justify-center gap-3">
                  <button onclick="app.requestNewGroup('${product.id}')" 
                          class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 transition-all">
                    <i data-lucide="bell-ring" class="w-4 h-4"></i>
                    <span>Request Buka Grup Baru</span>
                  </button>
                  <button onclick="app.navigate('admin')" 
                          class="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 transition-all">
                    <i data-lucide="shield" class="w-4 h-4"></i>
                    <span>Buka via Mode Admin</span>
                  </button>
                </div>
              </div>
            ` : groups.map(group => {
              const isExpired = group.status === 'EXPIRED';
              const isFull = group.currentSlots >= group.maxSlots || group.status === 'FULL';
              const isActive = group.status === 'ACTIVE';
              const isAlmostFull = group.status === 'OPEN' && group.currentSlots === group.maxSlots - 1;
              const slotPercent = Math.min(100, Math.round((group.currentSlots / group.maxSlots) * 100));

              return `
                <div class="bg-white border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] transition-all">
                  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-slate-900 text-white font-mono font-black flex items-center justify-center text-sm border-2 border-slate-900">
                        ${group.groupNumber}
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <h3 class="font-extrabold text-sm text-slate-900">Grup ${group.groupNumber} (${product.name})</h3>
                          
                          <!-- Status Badge -->
                          ${isActive ? `
                            <span class="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-600 flex items-center gap-1">
                              <i data-lucide="check-circle" class="w-3 h-3"></i> Sedang Aktif
                            </span>
                          ` : isExpired ? `
                            <span class="px-2 py-0.5 text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-500 flex items-center gap-1">
                              <i data-lucide="clock" class="w-3 h-3"></i> Waktu Habis / Expired
                            </span>
                          ` : isFull ? `
                            <span class="px-2 py-0.5 text-[10px] font-extrabold bg-slate-200 text-slate-700 border border-slate-400">
                              Kuota Penuh
                            </span>
                          ` : isAlmostFull ? `
                            <span class="px-2 py-0.5 text-[10px] font-extrabold bg-amber-300 text-slate-900 border border-slate-900 flex items-center gap-1">
                              <span class="w-1.5 h-1.5 bg-red-600 pulse-live"></span> 1 Slot Tersisa!
                            </span>
                          ` : `
                            <span class="px-2 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-600">
                              Membuka Slot
                            </span>
                          `}
                        </div>
                        <div class="text-xs text-slate-500 font-mono mt-0.5">Paket ${plan.name} • Rp ${plan.price.toLocaleString('id-ID')} / orang</div>
                      </div>
                    </div>

                    <!-- Countdown Timer -->
                    ${group.status === 'OPEN' ? `
                      <div class="bg-slate-100 px-3 py-1.5 border border-slate-300 text-right">
                        <span class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sisa Waktu Tunggu:</span>
                        <span class="font-mono font-extrabold text-xs text-slate-900 countdown-timer" data-expires-at="${group.expiresAt}">
                          Menghitung...
                        </span>
                      </div>
                    ` : ''}

                  </div>

                  <!-- Slot Progress Bar -->
                  <div class="mb-5">
                    <div class="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span class="text-slate-700">Slot Terisi:</span>
                      <span class="font-mono ${isAlmostFull ? 'text-amber-700 font-black' : 'text-slate-900'}">
                        ${group.currentSlots} dari ${group.maxSlots} Orang
                      </span>
                    </div>
                    
                    <!-- Progress bar segments -->
                    <div class="w-full bg-slate-200 h-3 border border-slate-900 flex p-0.5 gap-1">
                      ${Array.from({ length: group.maxSlots }).map((_, idx) => {
                        const filled = idx < group.currentSlots;
                        let barColor = filled ? 'bg-blue-600' : 'bg-transparent';
                        if (filled && isAlmostFull) barColor = 'bg-amber-500';
                        if (filled && (isFull || isActive)) barColor = 'bg-emerald-600';
                        if (isExpired && filled) barColor = 'bg-rose-500';
                        return `<div class="flex-1 h-full ${barColor} border border-slate-400"></div>`;
                      }).join('')}
                    </div>
                    
                    <div class="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1">
                      <span>${isExpired ? 'Grup ditutup otomatis' : group.maxSlots - group.currentSlots > 0 ? `Kurang ${group.maxSlots - group.currentSlots} peserta lagi` : 'Grup sudah lengkap'}</span>
                      <span>${slotPercent}%</span>
                    </div>
                  </div>

                  <!-- Join CTA Button -->
                  <div class="flex items-center justify-between pt-3 border-t border-slate-200">
                    <div class="text-xs text-slate-600">
                      ${isExpired ? `
                        <span class="text-rose-700 font-semibold">Grup ini telah dibatalkan otomatis dan seluruh dana peserta telah dikembalikan 100%.</span>
                      ` : isAlmostFull ? `
                        <span class="font-bold text-amber-900 flex items-center gap-1">
                          <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-600"></i>
                          Jadilah peserta terakhir untuk mengaktifkan akun seketika!
                        </span>
                      ` : isActive ? `
                        <span class="text-slate-500">Grup ini telah aktif berjalan.</span>
                      ` : `
                        <span>Masa aktif 30 hari dihitung sejak kuota 5/5 terpenuhi.</span>
                      `}
                    </div>

                    ${isExpired ? `
                      <button disabled class="px-5 py-2 bg-rose-100 text-rose-600 font-bold text-xs border border-rose-300 cursor-not-allowed">
                        Waktu Habis
                      </button>
                    ` : isFull || isActive ? `
                      <button disabled class="px-5 py-2 bg-slate-200 text-slate-400 font-bold text-xs border border-slate-300 cursor-not-allowed">
                        Slot Sudah Penuh
                      </button>
                    ` : `
                      <button onclick="app.handleJoinGroup('${group.id}', '${currentPlanKey}')" 
                              class="px-5 py-2.5 ${isAlmostFull ? 'bg-amber-400 hover:bg-amber-300 text-slate-900' : 'bg-slate-900 hover:bg-blue-600 text-white'} font-extrabold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 transition-all">
                        <span>Gabung Grup Ini</span>
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                      </button>
                    `}
                  </div>

                </div>
              `;
            }).join('')}
          </div>

        </div>

      </div>
    `;
  }

  selectProductPlan(productId, planKey) {
    this.selectedPlanDuration = planKey;
    this.navigate('product-detail', { productId, planKey });
  }

  // ========================================================
  // VIEW 3: CHECKOUT & PAYMENT FLOW
  // ========================================================
  renderCheckoutView(groupId) {
    const group = patunganState.getGroupById(groupId);
    if (!group) {
      return `
        <div class="bg-white border-2 border-slate-900 p-8 text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <h3 class="font-bold text-lg text-red-600">Grup Tidak Ditemukan</h3>
          <p class="text-xs text-slate-600 mt-2">Grup ID "${groupId}" tidak valid.</p>
          <button onclick="app.navigate('home')" class="mt-4 px-4 py-2 bg-slate-900 text-white font-bold text-xs">
            Kembali ke Katalog
          </button>
        </div>
      `;
    }

    const product = patunganState.getProductById(group.productId);
    const planKey = this.viewParams.planKey || group.planKey || '1_month';
    const plan = product.plans[planKey] || Object.values(product.plans)[0];
    const user = patunganState.getCurrentUser() || { name: 'Tamu (Belum Login)', balance: 0 };
    const hasEnoughBalance = user.balance >= plan.price;
    const balanceShortage = plan.price - user.balance;

    // Menentukan apakah user akan jadi member terakhir yang mengaktifkan grup
    const isBecomingLastSlot = (group.currentSlots + 1) >= group.maxSlots;

    return `
      <!-- BREADCRUMB -->
      <nav class="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
        <button onclick="app.navigate('home')" class="hover:text-blue-600">Katalog</button>
        <span>/</span>
        <button onclick="app.navigate('product-detail', { productId: '${product.id}' })" class="hover:text-blue-600">${product.name}</button>
        <span>/</span>
        <span class="text-slate-900 font-bold">Checkout Pembayaran</span>
      </nav>

      <div class="max-w-4xl mx-auto">
        
        <!-- RACE CONDITION ERROR BANNER (CASE 4C) -->
        ${this.checkoutRaceConditionError ? `
          <div class="p-4 bg-red-100 border-2 border-red-600 text-red-950 mb-6 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
            <div class="flex items-start gap-3">
              <i data-lucide="alert-octagon" class="w-6 h-6 text-red-600 shrink-0 mt-0.5"></i>
              <div class="flex-grow">
                <h4 class="font-black text-sm text-red-900">Maaf, slot grup ini baru saja penuh oleh pengguna lain!</h4>
                <p class="text-xs text-red-800 mt-1 leading-relaxed">
                  Pengguna lain baru saja menyelesaikan pembayaran beberapa detik sebelum Anda dan kuota telah mencapai ${group.maxSlots}/${group.maxSlots}. Saldo Anda tetap aman (tidak terpotong). Silakan pilih grup patungan lain yang masih membuka slot.
                </p>
                <button onclick="app.navigate('product-detail', { productId: '${product.id}' })" 
                        class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider border border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <i data-lucide="arrow-left" class="w-4 h-4"></i>
                  <span>Pilih Grup Lain</span>
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- SIMULATOR RACE CONDITION BOX (TESTER) -->
        <div class="bg-amber-50 border-2 border-amber-400 p-3.5 mb-6 shadow-[2px_2px_0px_0px_rgba(245,158,11,1)]">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <i data-lucide="sliders" class="w-4 h-4 text-amber-600"></i>
              <span>Simulator Edge Case (Tester):</span>
            </div>
            <button onclick="app.simulateRaceCondition('${group.id}')" 
                    class="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-[11px] border border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1">
              <i data-lucide="zap" class="w-3.5 h-3.5"></i>
              <span>Simulasikan Slot Diserobot Orang Lain (Penuh)</span>
            </button>
          </div>
          <p class="text-[10px] text-amber-800 mt-1">
            Klik tombol di atas untuk mengisi slot grup ini secara diam-diam (5/5). Lalu klik tombol <b>"Konfirmasi & Bayar"</b> untuk menguji penanganan error saat slot habis mendadak.
          </p>
        </div>

        <div class="mb-6">
          <h1 class="text-2xl font-black text-slate-900">Konfirmasi Pemesanan & Pembayaran</h1>
          <p class="text-xs text-slate-600 mt-1">Pastikan detail pesanan patungan Anda sudah sesuai sebelum melanjutkan.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- LEFT 2 COLUMNS: PAYMENT METHOD SELECTION -->
          <div class="md:col-span-2 space-y-6">
            
            <!-- ORDER SUMMARY CARD -->
            <div class="bg-white border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <h3 class="font-black text-xs uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b-2 border-slate-900 flex items-center justify-between">
                <span>Ringkasan Item Patungan</span>
                <span class="text-blue-600 font-mono">${group.groupNumber}</span>
              </h3>

              <div class="flex items-start gap-4 mb-4">
                <div class="w-12 h-12 ${product.badgeColor} text-white flex items-center justify-center font-bold border-2 border-slate-900 shrink-0">
                  <i data-lucide="${product.icon}" class="w-6 h-6"></i>
                </div>
                <div class="flex-grow">
                  <div class="flex items-start justify-between">
                    <div>
                      <h4 class="font-extrabold text-base text-slate-900">${product.name}</h4>
                      <p class="text-xs text-slate-500 font-mono">Grup ${group.groupNumber} • Durasi: ${plan.name}</p>
                    </div>
                    <div class="text-right">
                      <span class="font-mono font-black text-base text-slate-900">Rp ${plan.price.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Important Fair Use Notice -->
              <div class="p-3 bg-blue-50 border border-blue-300 text-blue-950 text-xs space-y-1">
                <div class="font-bold flex items-center gap-1.5">
                  <i data-lucide="info" class="w-4 h-4 text-blue-600"></i>
                  <span>Kebijakan Masa Aktif & Pengembalian Dana</span>
                </div>
                <p class="leading-relaxed text-[11px] text-blue-900">
                  Masa aktif <b>${plan.name}</b> baru mulai dihitung saat kuota grup penuh (${group.maxSlots}/${group.maxSlots}). 
                  Jika grup tidak terpenuhi sampai sisa waktu berakhir, sistem secara otomatis mengembalikan 100% dana Anda ke dompet saldo.
                </p>
                ${isBecomingLastSlot ? `
                  <div class="mt-2 pt-2 border-t border-blue-200 text-emerald-800 font-bold text-xs flex items-center gap-1">
                    <i data-lucide="zap" class="w-3.5 h-3.5 text-emerald-600"></i>
                    <span>Anda adalah peserta slot terakhir (${group.currentSlots + 1}/${group.maxSlots}). Pembayaran sukses akan langsung mengaktifkan akun!</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- PAYMENT METHODS -->
            <div class="bg-white border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <h3 class="font-black text-xs uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b-2 border-slate-900">
                Pilih Metode Pembayaran
              </h3>

              <div class="space-y-3 mb-6">
                
                <!-- Option 1: Bayar Pakai Saldo -->
                <div onclick="app.setPaymentMethod('SALDO')" 
                     class="p-4 border-2 cursor-pointer transition-all ${
                       this.selectedPaymentMethod === 'SALDO' 
                         ? 'border-slate-900 bg-slate-50 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]' 
                         : 'border-slate-300 hover:border-slate-600'
                     }">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <input type="radio" name="payment_method" value="SALDO" 
                             ${this.selectedPaymentMethod === 'SALDO' ? 'checked' : ''} class="w-4 h-4 text-slate-900" />
                      <div>
                        <div class="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                          <span>Bayar Pakai Saldo Dompet</span>
                          <span class="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold border border-emerald-400">Instan</span>
                        </div>
                        <div class="text-xs text-slate-600 mt-0.5">
                          Saldo Aktif: <b class="font-mono text-slate-900">Rp ${user.balance.toLocaleString('id-ID')}</b>
                        </div>
                      </div>
                    </div>
                    <div class="text-right">
                      <i data-lucide="wallet" class="w-5 h-5 text-slate-700"></i>
                    </div>
                  </div>

                  <!-- Saldo Balance Check Banner -->
                  ${this.selectedPaymentMethod === 'SALDO' ? `
                    <div class="mt-3 pt-3 border-t border-slate-200">
                      ${hasEnoughBalance ? `
                        <div class="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
                          <span class="flex items-center gap-1.5 font-bold">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600"></i>
                            Saldo mencukupi! Pembayaran diproses instan tanpa verifikasi manual.
                          </span>
                          <span class="font-mono text-[11px] text-emerald-700">Sisa saldo nanti: Rp ${(user.balance - plan.price).toLocaleString('id-ID')}</span>
                        </div>
                      ` : `
                        <div class="p-2.5 bg-red-50 border border-red-300 text-red-900 text-xs">
                          <div class="flex items-center justify-between font-bold mb-1">
                            <span class="flex items-center gap-1.5">
                              <i data-lucide="alert-circle" class="w-4 h-4 text-red-600"></i>
                              Saldo Tidak Cukup (Kurang Rp ${balanceShortage.toLocaleString('id-ID')})
                            </span>
                          </div>
                          <p class="text-[11px] text-red-700 mb-2">Silakan lakukan Top Up saldo simulasi atau pilih metode Transfer Manual.</p>
                          <button onclick="app.showTopUpModal()" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1">
                            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Top Up Saldo Sekarang
                          </button>
                        </div>
                      `}
                    </div>
                  ` : ''}
                </div>

                <!-- Option 2: Transfer Manual -->
                <div onclick="app.setPaymentMethod('TRANSFER_MANUAL')" 
                     class="p-4 border-2 cursor-pointer transition-all ${
                       this.selectedPaymentMethod === 'TRANSFER_MANUAL' 
                         ? 'border-slate-900 bg-slate-50 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]' 
                         : 'border-slate-300 hover:border-slate-600'
                     }">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <input type="radio" name="payment_method" value="TRANSFER_MANUAL" 
                             ${this.selectedPaymentMethod === 'TRANSFER_MANUAL' ? 'checked' : ''} class="w-4 h-4 text-slate-900" />
                      <div>
                        <div class="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                          <span>Transfer Manual (BCA / Mandiri / QRIS)</span>
                          <span class="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold border border-amber-400">Verifikasi Admin</span>
                        </div>
                        <div class="text-xs text-slate-600 mt-0.5">Upload struk/screenshot transfer untuk diverifikasi admin</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <i data-lucide="qr-code" class="w-5 h-5 text-slate-700"></i>
                    </div>
                  </div>

                  <!-- Transfer Manual Instructions & Dummy Upload -->
                  ${this.selectedPaymentMethod === 'TRANSFER_MANUAL' ? `
                    <div class="mt-4 pt-4 border-t border-slate-200 space-y-4">
                      
                      <!-- Account Details -->
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div class="p-3 bg-white border border-slate-300">
                          <span class="text-[10px] text-slate-500 font-bold uppercase block">Bank BCA</span>
                          <span class="font-mono font-bold text-sm text-slate-900 block">8820-192-881</span>
                          <span class="text-[11px] text-slate-600">a/n PT Patungan Akun Indonesia</span>
                        </div>
                        <div class="p-3 bg-white border border-slate-300">
                          <span class="text-[10px] text-slate-500 font-bold uppercase block">QRIS All Payment</span>
                          <span class="font-mono font-bold text-sm text-slate-900 block">NMID: ID1029381029</span>
                          <span class="text-[11px] text-slate-600">Scan via GoPay, OVO, ShopeePay, BCA</span>
                        </div>
                      </div>

                      <!-- File Upload Simulation -->
                      <div>
                        <label class="block text-xs font-bold text-slate-800 mb-1">
                          Upload Bukti Transfer <span class="text-red-500">*</span>
                        </label>
                        <div class="border-2 border-dashed border-slate-400 p-4 text-center bg-white hover:bg-slate-50 transition-all cursor-pointer"
                             onclick="document.getElementById('proof-file-input').click()">
                          <input type="file" id="proof-file-input" class="hidden" accept="image/*" 
                                 onchange="app.handleProofFileUpload(event)" />
                          
                          ${this.uploadedProofFile ? `
                            <div class="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700">
                              <i data-lucide="file-check" class="w-5 h-5"></i>
                              <span>File Terpilih: <b>${this.uploadedProofFile.name}</b> (${Math.round(this.uploadedProofFile.size / 1024)} KB)</span>
                            </div>
                            <span class="text-[10px] text-slate-500 block mt-1">Klik untuk mengganti gambar</span>
                          ` : `
                            <i data-lucide="upload-cloud" class="w-6 h-6 mx-auto text-slate-500 mb-1"></i>
                            <div class="text-xs font-bold text-slate-700">Pilih File Bukti Transfer (JPG, PNG)</div>
                            <div class="text-[10px] text-slate-400 mt-0.5">Atau klik untuk menggunakan file simulasi otomatis</div>
                          `}
                        </div>
                      </div>

                      <div class="text-[11px] text-amber-800 bg-amber-50 p-2.5 border border-amber-300 flex items-center gap-2">
                        <i data-lucide="info" class="w-4 h-4 shrink-0"></i>
                        <span>Pesanan akan berstatus <b>Menunggu Verifikasi</b>. Anda dapat menyimulasikan persetujuan via tombol Mode Admin di navbar.</span>
                      </div>

                    </div>
                  ` : ''}

                </div>

              </div>

            </div>

          </div>

          <!-- RIGHT COLUMN: TOTAL & PLACE ORDER -->
          <div class="md:col-span-1">
            <div class="bg-white border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] sticky top-24">
              <h3 class="font-black text-xs uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b-2 border-slate-900">
                Rincian Tagihan
              </h3>

              <div class="space-y-2 text-xs mb-4">
                <div class="flex justify-between text-slate-600">
                  <span>Harga Patungan:</span>
                  <span class="font-mono text-slate-900 font-bold">Rp ${plan.price.toLocaleString('id-ID')}</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Biaya Layanan & Admin:</span>
                  <span class="font-mono text-emerald-600 font-bold">Rp 0 (GRATIS)</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Garansi Full Refund:</span>
                  <span class="font-mono text-emerald-600 font-bold">Termasuk</span>
                </div>
                
                <div class="pt-3 border-t-2 border-slate-900 flex justify-between items-baseline">
                  <span class="font-extrabold text-sm text-slate-900">Total Tagihan:</span>
                  <span class="font-mono font-black text-lg text-blue-600">Rp ${plan.price.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <!-- Submit Button -->
              <button onclick="app.submitCheckout('${group.id}', '${planKey}')" 
                      class="w-full py-3 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2">
                <i data-lucide="lock" class="w-4 h-4"></i>
                <span>Konfirmasi & Bayar</span>
              </button>

              <div class="mt-4 text-center">
                <button onclick="app.navigate('product-detail', { productId: '${product.id}' })" 
                        class="text-xs text-slate-500 hover:text-slate-900 font-semibold underline">
                  Batal & Kembali
                </button>
              </div>

              <div class="mt-6 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-400">
                <i data-lucide="shield-check" class="w-4 h-4 mx-auto mb-1 text-slate-500"></i>
                <span>Transaksi dijamin aman & terlindungi oleh sistem enkripsi simulator.</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    `;
  }

  setPaymentMethod(method) {
    this.selectedPaymentMethod = method;
    this.renderCurrentView();
  }

  handleProofFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      this.uploadedProofFile = {
        name: file.name,
        size: file.size,
        type: file.type
      };
      this.showToast(`Bukti transfer "${file.name}" siap diunggah.`, 'info');
      this.renderCurrentView();
    }
  }

  submitCheckout(groupId, planKey) {
    if (patunganState.isGuest()) {
      this.pendingCheckout = { groupId, planKey };
      this.showLoginModal();
      this.showToast('Silakan masuk terlebih dahulu untuk menyelesaikan pembayaran.', 'info');
      return;
    }

    try {
      let proofFileName = null;

      if (this.selectedPaymentMethod === 'TRANSFER_MANUAL') {
        if (!this.uploadedProofFile) {
          // Buat dummy upload nama jika user belum upload manual
          proofFileName = `bukti_transfer_simulasi_${Date.now().toString().slice(-4)}.jpg`;
        } else {
          proofFileName = this.uploadedProofFile.name;
        }
      }

      const result = patunganState.createOrder({
        groupId: groupId,
        planKey: planKey,
        paymentMethod: this.selectedPaymentMethod,
        proofFile: proofFileName
      });

      // Reset upload state & race condition state
      this.uploadedProofFile = null;
      this.checkoutRaceConditionError = false;

      if (result.order.status === 'Aktif') {
        this.showToast('🎉 Selamat! Kuota grup genap terpenuhi dan akun Anda langsung AKTIF!', 'success');
      } else if (result.order.status === 'Menunggu Kuota') {
        this.showToast('✅ Pembayaran saldo berhasil! Menunggu kuota grup terpenuhi.', 'success');
      } else {
        this.showToast('📋 Pesanan berhasil dibuat! Silakan verifikasi via Mode Admin.', 'info');
      }

      // Navigate to order history
      this.navigate('my-orders');

    } catch (err) {
      if (err.message === 'SLOT_FULL_RACE_CONDITION') {
        this.checkoutRaceConditionError = true;
        this.renderCurrentView();
        this.showToast('Gagal: Slot grup ini baru saja penuh oleh pengguna lain!', 'error');
      } else if (err.message === 'AUTH_REQUIRED') {
        this.pendingCheckout = { groupId, planKey };
        this.showLoginModal();
        this.showToast('Silakan masuk terlebih dahulu.', 'info');
      } else {
        this.showToast(err.message, 'error');
      }
    }
  }

  // ========================================================
  // VIEW 4: MY ORDERS & DOMPET SALDO
  // ========================================================
  renderMyOrdersView() {
    if (patunganState.isGuest()) {
      return `
        <div class="bg-white border-2 border-slate-900 p-10 text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] max-w-lg mx-auto my-12">
          <div class="w-14 h-14 bg-blue-100 text-blue-600 border-2 border-slate-900 flex items-center justify-center mx-auto mb-4">
            <i data-lucide="user-x" class="w-7 h-7"></i>
          </div>
          <h2 class="text-xl font-black text-slate-900">Anda Sedang di Mode Tamu</h2>
          <p class="text-xs text-slate-600 mt-2 leading-relaxed">
            Riwayat pesanan dan dompet saldo hanya dapat diakses setelah masuk ke akun. Silakan login cepat menggunakan akun pengujian yang tersedia.
          </p>
          <button onclick="app.showLoginModal()" 
                  class="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2 mx-auto">
            <i data-lucide="log-in" class="w-4 h-4"></i>
            <span>Masuk Akun Sekarang</span>
          </button>
        </div>
      `;
    }

    const user = patunganState.getCurrentUser();
    const orders = patunganState.getUserOrders();
    const mutations = patunganState.getUserMutations();

    const activeTab = this.viewParams.tab || 'all';

    let filteredOrders = orders;
    if (activeTab === 'active') {
      filteredOrders = orders.filter(o => o.status === 'Aktif');
    } else if (activeTab === 'waiting') {
      filteredOrders = orders.filter(o => o.status === 'Menunggu Kuota' || o.status === 'Menunggu Verifikasi');
    } else if (activeTab === 'history') {
      filteredOrders = orders.filter(o => o.status === 'Ditolak' || o.status === 'Refund');
    }

    return `
      <!-- PAGE HEADER -->
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900">Pesanan Saya & Dompet Saldo</h1>
          <p class="text-xs text-slate-600 mt-1">Kelola saldo akun, pantau progres slot patungan, dan lihat kredensial akun aktif.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="app.showTopUpModal()" 
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Top Up Saldo</span>
          </button>
        </div>
      </div>

      <!-- WALLET & MUTATIONS ROW -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        <!-- WALLET CARD -->
        <div class="lg:col-span-1 bg-slate-900 text-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Dompet Saldo Patungan</span>
              <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-400 text-slate-900">Aktif</span>
            </div>
            <div class="text-xs text-slate-400">Total Saldo Tersedia:</div>
            <div class="text-3xl font-black font-mono text-emerald-400 mt-1">
              Rp ${user.balance.toLocaleString('id-ID')}
            </div>
            <p class="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Saldo otomatis digunakan untuk pembayaran instan dan menjadi tujuan refund jika grup tidak terpenuhi.
            </p>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span class="text-slate-400">${user.name}</span>
            <button onclick="app.showTopUpModal()" class="text-emerald-300 hover:text-white font-bold underline">
              + Isi Saldo
            </button>
          </div>
        </div>

        <!-- MUTATION HISTORY TABLE -->
        <div class="lg:col-span-2 bg-white border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <div class="flex items-center justify-between mb-3 pb-2 border-b-2 border-slate-900">
            <h3 class="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <i data-lucide="history" class="w-4 h-4"></i>
              <span>Riwayat Mutasi Saldo Dompet</span>
            </h3>
            <span class="text-[11px] text-slate-500 font-mono">${mutations.length} Transaksi</span>
          </div>

          <div class="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
            ${mutations.length === 0 ? `
              <div class="py-6 text-center text-slate-400">Belum ada riwayat mutasi saldo.</div>
            ` : mutations.map(m => {
              const isCredit = m.type === 'CREDIT';
              return `
                <div class="py-2.5 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 ${isCredit ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'} flex items-center justify-center font-bold shrink-0">
                      <i data-lucide="${isCredit ? 'arrow-down-left' : 'arrow-up-right'}" class="w-3.5 h-3.5"></i>
                    </div>
                    <div>
                      <div class="font-bold text-slate-900 leading-snug">${m.title}</div>
                      <div class="text-[10px] text-slate-400 font-mono">${new Date(m.date).toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="font-mono font-black ${isCredit ? 'text-emerald-700' : 'text-slate-900'}">
                      ${isCredit ? '+' : '-'} Rp ${m.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- ORDERS LIST SECTION -->
      <div class="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        
        <!-- Filter Tabs -->
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b-2 border-slate-900">
          <div class="flex gap-2">
            <button onclick="app.setOrderTab('all')" 
                    class="px-3 py-1.5 text-xs font-bold border-2 transition-all ${
                      activeTab === 'all' 
                        ? 'border-slate-900 bg-slate-900 text-white' 
                        : 'border-slate-300 hover:border-slate-800'
                    }">
              Semua (${orders.length})
            </button>
            <button onclick="app.setOrderTab('active')" 
                    class="px-3 py-1.5 text-xs font-bold border-2 transition-all ${
                      activeTab === 'active' 
                        ? 'border-slate-900 bg-slate-900 text-white' 
                        : 'border-slate-300 hover:border-slate-800'
                    }">
              Aktif (${orders.filter(o => o.status === 'Aktif').length})
            </button>
            <button onclick="app.setOrderTab('waiting')" 
                    class="px-3 py-1.5 text-xs font-bold border-2 transition-all ${
                      activeTab === 'waiting' 
                        ? 'border-slate-900 bg-slate-900 text-white' 
                        : 'border-slate-300 hover:border-slate-800'
                    }">
              Menunggu (${orders.filter(o => o.status === 'Menunggu Kuota' || o.status === 'Menunggu Verifikasi').length})
            </button>
            <button onclick="app.setOrderTab('history')" 
                    class="px-3 py-1.5 text-xs font-bold border-2 transition-all ${
                      activeTab === 'history' 
                        ? 'border-slate-900 bg-slate-900 text-white' 
                        : 'border-slate-300 hover:border-slate-800'
                    }">
              Selesai / Refund (${orders.filter(o => o.status === 'Ditolak' || o.status === 'Refund').length})
            </button>
          </div>

          <div class="text-xs text-slate-500 font-mono">
            ID User: <b class="text-slate-800">${user.id}</b>
          </div>
        </div>

        <!-- Orders Cards List -->
        <div class="space-y-4">
          ${filteredOrders.length === 0 ? `
            <div class="py-12 text-center">
              <i data-lucide="inbox" class="w-10 h-10 mx-auto text-slate-400 mb-2"></i>
              <h4 class="font-bold text-sm text-slate-700">Tidak ada pesanan pada kategori ini</h4>
              <p class="text-xs text-slate-500 mt-1">Jelajahi katalog dan gabung grup patungan sekarang.</p>
              <button onclick="app.navigate('home')" class="mt-4 px-4 py-2 bg-slate-900 text-white font-bold text-xs">
                Buka Katalog
              </button>
            </div>
          ` : filteredOrders.map(order => {
            const group = patunganState.getGroupById(order.groupId);
            return this.renderOrderItem(order, group);
          }).join('')}
        </div>

      </div>
    `;
  }

  renderOrderItem(order, group) {
    let badgeHtml = '';
    let actionHtml = '';
    let extraInfoHtml = '';

    // Status Badge Logic
    switch (order.status) {
      case 'Aktif':
        badgeHtml = `
          <span class="px-2.5 py-1 text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-600 flex items-center gap-1">
            <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Aktif</span>
          </span>
        `;
        actionHtml = `
          <button onclick="app.showCredentialsModal('${order.groupId}')" 
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5">
            <i data-lucide="key" class="w-3.5 h-3.5"></i>
            <span>Lihat Detail Akun</span>
          </button>
        `;
        break;

      case 'Menunggu Kuota':
        badgeHtml = `
          <span class="px-2.5 py-1 text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-600 flex items-center gap-1">
            <i data-lucide="users" class="w-3.5 h-3.5 text-blue-600"></i>
            <span>Menunggu Kuota</span>
          </span>
        `;
        if (group) {
          extraInfoHtml = `
            <div class="mt-3 p-3 bg-blue-50 border border-blue-200">
              <div class="flex justify-between items-center text-xs mb-1">
                <span class="font-bold text-blue-900">Progres Slot Grup Saat Ini:</span>
                <span class="font-mono font-bold text-blue-950">${group.currentSlots} / ${group.maxSlots} Peserta</span>
              </div>
              <div class="w-full bg-slate-200 h-2.5 border border-slate-400 flex p-0.5 gap-1 mb-2">
                ${Array.from({ length: group.maxSlots }).map((_, i) => `
                  <div class="flex-1 h-full ${i < group.currentSlots ? 'bg-blue-600' : 'bg-transparent'}"></div>
                `).join('')}
              </div>
              <div class="flex justify-between items-center text-[11px] text-blue-800">
                <span>Sisa Waktu Menunggu:</span>
                <span class="font-mono font-bold countdown-timer" data-expires-at="${group.expiresAt}">Menghitung...</span>
              </div>
            </div>
          `;
        }
        actionHtml = `
          <button onclick="app.navigate('admin')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-900 flex items-center gap-1">
            <i data-lucide="shield" class="w-3.5 h-3.5"></i> Mode Admin (Isi Penuh)
          </button>
        `;
        break;

      case 'Menunggu Verifikasi':
        badgeHtml = `
          <span class="px-2.5 py-1 text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-600 flex items-center gap-1">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-600"></i>
            <span>Menunggu Verifikasi</span>
          </span>
        `;
        extraInfoHtml = `
          <div class="mt-2 text-xs text-amber-800 bg-amber-50 p-2 border border-amber-200">
            Bukti transfer sedang diperiksa oleh admin. Estimasi verifikasi 5-15 menit.
            ${order.proofFile ? `<div class="font-mono text-[10px] text-slate-600 mt-0.5">File: ${order.proofFile}</div>` : ''}
          </div>
        `;
        actionHtml = `
          <button onclick="app.navigate('admin')" class="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs border border-slate-900 flex items-center gap-1">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Approve di Admin
          </button>
        `;
        break;

      case 'Ditolak':
        badgeHtml = `
          <span class="px-2.5 py-1 text-xs font-extrabold bg-red-100 text-red-900 border border-red-600 flex items-center gap-1">
            <i data-lucide="x-circle" class="w-3.5 h-3.5 text-red-600"></i>
            <span>Ditolak</span>
          </span>
        `;
        actionHtml = `
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="app.showRejectReasonModal('${order.id}')" 
                    class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 font-bold text-xs border border-red-500 flex items-center gap-1">
              <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
              <span>Lihat Alasan Ditolak</span>
            </button>
            <button onclick="app.showReuploadProofModal('${order.id}')" 
                    class="px-3 py-1.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1">
              <i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>
              <span>Upload Ulang Bukti</span>
            </button>
          </div>
        `;
        break;

      case 'Refund':
        badgeHtml = `
          <span class="px-2.5 py-1 text-xs font-extrabold bg-purple-100 text-purple-900 border border-purple-600 flex items-center gap-1">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-purple-600"></i>
            <span>100% Refund</span>
          </span>
        `;
        extraInfoHtml = `
          <div class="mt-2 text-xs text-purple-900 bg-purple-50 p-2 border border-purple-200">
            Kuota grup tidak terpenuhi dalam batas waktu. Dana sebesar <b>Rp ${order.amount.toLocaleString('id-ID')}</b> telah dikembalikan ke saldo Anda.
          </div>
        `;
        break;
    }

    return `
      <div class="p-4 border-2 border-slate-900 bg-slate-50 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-xs text-slate-800">${order.id}</span>
            <span class="text-slate-400">•</span>
            <span class="text-xs text-slate-500 font-mono">${new Date(order.createdAt).toLocaleDateString('id-ID')}</span>
          </div>
          <div>${badgeHtml}</div>
        </div>

        <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 class="font-extrabold text-sm text-slate-900">${order.productName}</h4>
            <div class="text-xs text-slate-600 font-mono mt-0.5">
              Durasi: ${order.planName} • Metode: ${order.paymentMethod === 'SALDO' ? 'Saldo Dompet' : 'Transfer Manual'}
            </div>
          </div>
          <div class="text-left sm:text-right">
            <span class="text-[10px] uppercase font-bold text-slate-500 block">Total Biaya</span>
            <span class="font-mono font-black text-sm text-slate-900">Rp ${order.amount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        ${extraInfoHtml}

        <div class="pt-3 border-t border-slate-200 flex items-center justify-between">
          <div class="text-[11px] text-slate-500 font-mono">
            ${group ? `Grup Ref: ${group.groupNumber}` : ''}
          </div>
          <div>${actionHtml}</div>
        </div>
      </div>
    `;
  }

  setOrderTab(tab) {
    this.viewParams.tab = tab;
    this.renderCurrentView();
  }

  // ========================================================
  // VIEW 5: ADMIN SIMULATOR (PANEL PENGUJIAN)
  // ========================================================
  renderAdminView() {
    const allOrders = patunganState.getAllOrders();
    const allGroups = patunganState.getAllGroups();
    const pendingOrders = allOrders.filter(o => o.status === 'Menunggu Verifikasi');
    const openGroups = allGroups.filter(g => g.status === 'OPEN');
    const user = patunganState.getCurrentUser();

    return `
      <!-- ADMIN HEADER BANNER -->
      <div class="bg-amber-400 border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] mb-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xl border-2 border-slate-900 shrink-0">
              <i data-lucide="shield-alert" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="inline-block px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-bold uppercase mb-1">
                Panel Kontrol Simulasi Pengujian
              </div>
              <h1 class="text-2xl font-black text-slate-900 leading-tight">Admin Simulator & Scenario Tester</h1>
              <p class="text-xs text-slate-800 mt-1 font-medium">
                Gunakan kontrol di bawah ini untuk menyimulasikan verifikasi transfer, kuota penuh instan, dan skenario refund waktu habis.
              </p>
            </div>
          </div>
          <button onclick="app.resetDataConfirm()" 
                  class="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 shrink-0">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            <span>Reset Semua Data Dummy</span>
          </button>
        </div>
      </div>

      <!-- METRIC CARDS -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="p-4 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
          <span class="text-[10px] uppercase font-bold text-slate-500 block">Pesanan Pending</span>
          <span class="text-2xl font-black font-mono text-amber-600">${pendingOrders.length}</span>
        </div>
        <div class="p-4 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
          <span class="text-[10px] uppercase font-bold text-slate-500 block">Grup Terbuka (OPEN)</span>
          <span class="text-2xl font-black font-mono text-blue-600">${openGroups.length}</span>
        </div>
        <div class="p-4 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
          <span class="text-[10px] uppercase font-bold text-slate-500 block">Total Pesanan Sistem</span>
          <span class="text-2xl font-black font-mono text-slate-900">${allOrders.length}</span>
        </div>
        <div class="p-4 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
          <span class="text-[10px] uppercase font-bold text-slate-500 block">Saldo Akun Budi</span>
          <span class="text-2xl font-black font-mono text-emerald-600">Rp ${user.balance.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <!-- SECTION 1: VERIFIKASI PESANAN TRANSFER MANUAL -->
      <div class="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] mb-8">
        <div class="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-4">
          <div>
            <h3 class="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <i data-lucide="check-square" class="w-4 h-4 text-blue-600"></i>
              <span>1. Verifikasi Pesanan Transfer Pending (${pendingOrders.length})</span>
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Menyetujui akan menambah slot +1; jika mencapai batas kuota, grup otomatis aktif.</p>
          </div>
        </div>

        ${pendingOrders.length === 0 ? `
          <div class="py-8 text-center text-slate-400 text-xs">
            Tidak ada pesanan transfer manual yang menunggu verifikasi saat ini.
            <div class="mt-2 text-slate-600">Anda dapat mencoba checkout paket baru dengan metode Transfer Manual.</div>
          </div>
        ` : `
          <div class="space-y-3">
            ${pendingOrders.map(order => {
              const group = patunganState.getGroupById(order.groupId);
              return `
                <div class="p-4 bg-slate-50 border-2 border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-mono font-bold text-xs bg-amber-300 px-1.5 py-0.5 border border-slate-900">${order.id}</span>
                      <span class="font-extrabold text-sm text-slate-900">${order.productName}</span>
                      <span class="text-xs text-slate-500 font-mono">(${order.planName})</span>
                    </div>
                    <div class="text-xs text-slate-600 space-x-2">
                      <span>User ID: <b>${order.userId}</b></span>
                      <span>•</span>
                      <span>Grup: <b>${group ? group.groupNumber : '-'}</b></span>
                      <span>•</span>
                      <span>Nominal: <b class="font-mono text-slate-900">Rp ${order.amount.toLocaleString('id-ID')}</b></span>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-1 font-mono flex items-center gap-1">
                      <i data-lucide="paperclip" class="w-3 h-3"></i>
                      <span>Bukti Transfer: <b>${order.proofFile || 'bukti_transfer.jpg'}</b></span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <button onclick="app.adminApproveOrder('${order.id}')" 
                            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5">
                      <i data-lucide="check" class="w-4 h-4"></i>
                      <span>Approve</span>
                    </button>
                    <button onclick="app.adminRejectPrompt('${order.id}')" 
                            class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5">
                      <i data-lucide="x" class="w-4 h-4"></i>
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- SECTION 2: KONTROL SIMULASI GRUP PATUNGAN -->
      <div class="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] mb-8">
        <div class="pb-3 border-b-2 border-slate-900 mb-4">
          <h3 class="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <i data-lucide="sliders" class="w-4 h-4 text-emerald-600"></i>
            <span>2. Kontrol Simulasi Grup Patungan Terbuka (${openGroups.length})</span>
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">Uji coba langsung skenario grup penuh (Auto-Aktif) atau grup gagal/waktu habis (Auto-Refund 100%).</p>
        </div>

        ${openGroups.length === 0 ? `
          <div class="py-8 text-center text-slate-400 text-xs">
            Semua grup saat ini telah penuh atau aktif. Klik "Reset Semua Data Dummy" untuk memulai kembali.
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${openGroups.map(group => {
              const product = patunganState.getProductById(group.productId);
              return `
                <div class="p-4 bg-slate-50 border-2 border-slate-900 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-extrabold text-sm text-slate-900">
                        ${product ? product.name : group.productId} ${group.groupNumber}
                      </div>
                      <span class="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-400">
                        Slot: ${group.currentSlots}/${group.maxSlots}
                      </span>
                    </div>

                    <div class="text-xs text-slate-600 mb-3 space-y-1">
                      <div>Harga: <b class="font-mono">Rp ${group.price.toLocaleString('id-ID')}</b></div>
                      <div class="flex items-center gap-1 text-[11px] text-slate-500">
                        <span>Countdown Timer:</span>
                        <span class="font-mono font-bold text-slate-800 countdown-timer" data-expires-at="${group.expiresAt}">Menghitung...</span>
                      </div>
                    </div>

                    <!-- Visual Slot Progress -->
                    <div class="w-full bg-slate-200 h-2 border border-slate-400 flex p-0.2 gap-1 mb-4">
                      ${Array.from({ length: group.maxSlots }).map((_, i) => `
                        <div class="flex-1 h-full ${i < group.currentSlots ? 'bg-blue-600' : 'bg-transparent'}"></div>
                      `).join('')}
                    </div>
                  </div>

                  <!-- 2 Simulator Buttons -->
                  <div class="space-y-2 pt-3 border-t border-slate-300">
                    <button onclick="app.adminSimulateFillGroup('${group.id}')" 
                            class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-1.5 transition-all">
                      <i data-lucide="zap" class="w-3.5 h-3.5"></i>
                      <span>Simulasikan Penuh (Aktifkan)</span>
                    </button>

                    <button onclick="app.adminSimulateExpireGroup('${group.id}')" 
                            class="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-1.5 transition-all">
                      <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                      <span>Simulasikan Waktu Habis (Expired & Refund)</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- SECTION 3: BUKA GRUP PATUNGAN BARU (CASE 5) -->
      <div class="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] mb-8">
        <div class="pb-3 border-b-2 border-slate-900 mb-4">
          <h3 class="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <i data-lucide="folder-plus" class="w-4 h-4 text-emerald-600"></i>
            <span>3. Buka Grup Patungan Baru</span>
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">Admin dapat membuka grup patungan baru untuk produk yang belum memiliki grup (seperti Spotify) atau menambah kuota grup baru.</p>
        </div>

        <form onsubmit="app.handleAdminCreateGroup(event)" class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-1">Pilih Produk:</label>
            <select id="admin-new-group-product" class="w-full p-2.5 text-xs border-2 border-slate-900 bg-white font-semibold">
              ${patunganState.getProducts().map(p => {
                const openCount = patunganState.getGroupsByProduct(p.id).filter(g => g.status === 'OPEN').length;
                const isRequested = patunganState.getGroupRequests().includes(p.id);
                return `<option value="${p.id}">${p.name} (${openCount} grup terbuka)${isRequested ? ' - [ADA REQUEST USER]' : ''}</option>`;
              }).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-1">Durasi Paket:</label>
            <select id="admin-new-group-plan" class="w-full p-2.5 text-xs border-2 border-slate-900 bg-white font-semibold">
              <option value="1_month">1 Bulan</option>
              <option value="3_month">3 Bulan</option>
            </select>
          </div>
          <div>
            <button type="submit" class="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-1.5 transition-colors">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Buat Grup Baru</span>
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // --- ADMIN ACTIONS ---
  adminApproveOrder(orderId) {
    try {
      const res = patunganState.approveOrder(orderId);
      if (res.group.status === 'ACTIVE') {
        this.showToast(`Pesanan ${orderId} di-approve! Kuota grup ${res.group.groupNumber} GENAP PENUH dan akun resmi AKTIF!`, 'success');
      } else {
        this.showToast(`Pesanan ${orderId} disetujui! Slot grup bertambah menjadi ${res.group.currentSlots}/${res.group.maxSlots}.`, 'success');
      }
      this.renderCurrentView();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  adminRejectPrompt(orderId) {
    const reason = prompt('Masukkan alasan penolakan pesanan ini:', 'Bukti transfer tidak terbaca / nominal tidak sesuai.');
    if (reason !== null) {
      try {
        patunganState.rejectOrder(orderId, reason);
        this.showToast(`Pesanan ${orderId} telah ditolak. Alasan tersimpan untuk user.`, 'info');
        this.renderCurrentView();
      } catch (e) {
        this.showToast(e.message, 'error');
      }
    }
  }

  adminSimulateFillGroup(groupId) {
    try {
      const res = patunganState.simulateFillGroup(groupId);
      this.showToast(`⚡ Grup ${res.group.groupNumber} berhasil diisi penuh (${res.group.maxSlots}/${res.group.maxSlots})! ${res.activatedOrders} pesanan kini AKTIF. Cek kredensial di Pesanan Saya.`, 'success');
      this.renderCurrentView();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  adminSimulateExpireGroup(groupId) {
    try {
      const res = patunganState.simulateExpireGroup(groupId);
      this.showToast(`⌛ Waktu grup habis! ${res.refundedCount} pesanan di-refund 100% (Total: Rp ${res.totalRefundedAmount.toLocaleString('id-ID')}). Saldo user bertambah.`, 'info');
      this.renderCurrentView();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  resetDataConfirm() {
    if (confirm('Apakah Anda yakin ingin mereset seluruh database dummy ke kondisi awal? Data pesanan, saldo, dan grup akan dikembalikan ke default.')) {
      patunganState.resetAll();
      this.showToast('Semua data berhasil di-reset ke kondisi awal.', 'info');
      this.navigate('home');
    }
  }

  // ========================================================
  // LIVE COUNTDOWN TIMER TICKER
  // ========================================================
  startCountdownTicker() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.updateCountdownElements();
    }, 1000);
  }

  updateCountdownElements() {
    const elements = document.querySelectorAll('.countdown-timer');
    const now = Date.now();

    elements.forEach(el => {
      const expiresAt = Number(el.getAttribute('data-expires-at'));
      if (!expiresAt || isNaN(expiresAt)) return;

      const diff = expiresAt - now;
      if (diff <= 0) {
        el.innerText = 'Waktu Habis';
        el.className = 'countdown-timer text-red-600 font-bold';
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        let formatted = '';
        if (days > 0) formatted += `${days}h `;
        formatted += `${hours.toString().padStart(2, '0')}j ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}d`;
        el.innerText = formatted;
      }
    });
  }

  // ========================================================
  // MODALS & HELPERS
  // ========================================================
  showCredentialsModal(groupId) {
    const group = patunganState.getGroupById(groupId);
    if (!group) return;

    const product = patunganState.getProductById(group.productId);
    const creds = group.credentials || {};

    const container = document.getElementById('credentials-content');
    if (!container) return;

    container.innerHTML = `
      <div class="p-3 bg-slate-100 border border-slate-300 flex items-center justify-between">
        <div>
          <span class="text-[10px] uppercase font-bold text-slate-500 block">Layanan Akun</span>
          <span class="font-extrabold text-sm text-slate-900">${product.name} (Grup ${group.groupNumber})</span>
        </div>
        <div class="text-right">
          <span class="text-[10px] uppercase font-bold text-slate-500 block">Masa Aktif</span>
          <span class="font-mono font-bold text-xs text-emerald-700">${creds.period || '30 Hari Aktif'}</span>
        </div>
      </div>

      <!-- EMAIL / USERNAME -->
      <div>
        <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email / Akun Login:</label>
        <div class="flex">
          <input type="text" readonly value="${creds.email || '-'}" id="cred-email" 
                 class="flex-grow bg-slate-50 font-mono text-xs px-3 py-2 border-2 border-slate-900 select-all font-semibold" />
          <button onclick="app.copyToClipboard('cred-email', 'Email akun')" 
                  class="bg-slate-900 text-white px-3 hover:bg-slate-800 text-xs font-bold border-2 border-l-0 border-slate-900 flex items-center gap-1">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i> Salin
          </button>
        </div>
      </div>

      <!-- PASSWORD -->
      <div>
        <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Password:</label>
        <div class="flex">
          <input type="password" readonly value="${creds.password || '-'}" id="cred-password" 
                 class="flex-grow bg-slate-50 font-mono text-xs px-3 py-2 border-2 border-slate-900 select-all font-semibold" />
          <button onclick="app.togglePasswordVisibility('cred-password', 'cred-eye-icon')" 
                  class="bg-slate-200 text-slate-800 px-2.5 hover:bg-slate-300 text-xs font-bold border-2 border-l-0 border-slate-900 flex items-center">
            <i data-lucide="eye" id="cred-eye-icon" class="w-4 h-4"></i>
          </button>
          <button onclick="app.copyToClipboard('cred-password', 'Password akun')" 
                  class="bg-slate-900 text-white px-3 hover:bg-slate-800 text-xs font-bold border-2 border-l-0 border-slate-900 flex items-center gap-1">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i> Salin
          </button>
        </div>
      </div>

      <!-- PIN / PROFIL DETAIL -->
      <div>
        <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Info Profil / PIN / Catatan Khusus:</label>
        <div class="p-3 bg-amber-50 border border-amber-300 font-mono text-xs text-amber-950 font-bold leading-relaxed">
          ${creds.pin || 'Gunakan profil yang telah dialokasikan.'}
        </div>
      </div>

      <!-- RULES OF USE -->
      <div class="p-3 bg-slate-100 border border-slate-300 text-[11px] text-slate-700 space-y-1">
        <span class="font-bold text-slate-900 block uppercase tracking-wide">Ketentuan Penggunaan:</span>
        <p>${creds.rules || 'Dilarang mengubah kredensial atau login lebih dari 1 perangkat secara bersamaan.'}</p>
      </div>
    `;

    document.getElementById('modal-credentials').classList.remove('hidden');
    this.safeRenderIcons();
  }

  showRejectReasonModal(orderId) {
    const order = patunganState.getOrderById(orderId);
    if (!order) return;

    const el = document.getElementById('reject-reason-text');
    if (el) el.innerText = order.rejectReason || 'Bukti transfer tidak dapat diverifikasi oleh admin.';

    document.getElementById('modal-reject-reason').classList.remove('hidden');
    this.safeRenderIcons();
  }

  showTopUpModal() {
    const user = patunganState.getCurrentUser();
    const el = document.getElementById('topup-user-name');
    if (el) el.innerText = user.name;

    document.getElementById('modal-topup').classList.remove('hidden');
    this.safeRenderIcons();
  }

  processTopUp(amount) {
    patunganState.topUpBalance(amount, `Top Up Saldo Tester Rp ${amount.toLocaleString('id-ID')}`);
    this.showToast(`Berhasil menambahkan saldo Rp ${amount.toLocaleString('id-ID')}!`, 'success');
    this.closeModal('modal-topup');
  }

  showUserSwitchModal() {
    const available = patunganState.getAvailableUsers();
    const current = patunganState.getCurrentUser();
    const isGuest = patunganState.isGuest();

    const container = document.getElementById('user-switch-list');
    if (!container) return;

    container.innerHTML = available.map(u => {
      const isSelected = !isGuest && current && u.id === current.id;
      const isGuestOpt = u.id === 'guest' || u.isGuest;
      return `
        <div onclick="app.switchUser('${u.id}')" 
             class="p-3 border-2 cursor-pointer transition-all ${
               (isSelected || (isGuest && isGuestOpt)) ? 'border-slate-900 bg-slate-100 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] font-bold' : 'border-slate-300 hover:border-slate-800'
             } flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-900 flex items-center gap-1.5">
              ${isGuestOpt ? '<i data-lucide="user-x" class="w-3.5 h-3.5 text-slate-600"></i>' : ''}
              <span>${u.name}</span>
            </div>
            <div class="text-[11px] text-slate-500">${u.email}</div>
          </div>
          <div class="text-right">
            ${isGuestOpt ? `
              <span class="font-mono text-xs font-bold text-slate-500">Mode Tamu</span>
            ` : `
              <span class="font-mono text-xs font-bold text-emerald-700">Rp ${u.balance.toLocaleString('id-ID')}</span>
            `}
            ${(isSelected || (isGuest && isGuestOpt)) ? '<span class="block text-[9px] font-bold text-slate-900 uppercase">Sedang Digunakan</span>' : ''}
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('modal-user-switch').classList.remove('hidden');
    this.safeRenderIcons();
  }

  switchUser(userId) {
    patunganState.switchUser(userId);
    this.showToast('Berhasil berganti profil akun.', 'info');
    this.closeModal('modal-user-switch');
    this.updateNavbarBadges();
    this.renderCurrentView();
  }

  showLoginModal() {
    const container = document.getElementById('login-preset-users');
    if (container) {
      const users = patunganState.getAvailableUsers().filter(u => !u.isGuest && u.id !== 'guest');
      container.innerHTML = users.map(u => `
        <div onclick="app.loginUser('${u.id}')" 
             class="p-2.5 bg-slate-50 hover:bg-blue-50 border-2 border-slate-900 cursor-pointer flex items-center justify-between transition-all">
          <div>
            <span class="font-extrabold text-xs text-slate-900 block">${u.name}</span>
            <span class="text-[10px] text-slate-500">${u.email}</span>
          </div>
          <div class="text-right">
            <span class="font-mono text-xs font-black text-emerald-700">Rp ${u.balance.toLocaleString('id-ID')}</span>
            <span class="text-[9px] text-blue-600 font-bold block">Pilih Akun →</span>
          </div>
        </div>
      `).join('');
    }
    const modal = document.getElementById('modal-login');
    if (modal) modal.classList.remove('hidden');
    this.safeRenderIcons();
  }

  loginUser(userId) {
    patunganState.switchUser(userId);
    this.closeModal('modal-login');
    this.showToast('Login berhasil!', 'success');
    this.updateNavbarBadges();

    if (this.pendingCheckout) {
      const dest = this.pendingCheckout;
      this.pendingCheckout = null;
      this.navigate('checkout', dest);
    } else {
      this.renderCurrentView();
    }
  }

  logoutUser() {
    patunganState.logout();
    this.showToast('Anda beralih ke Mode Tamu (Belum Login).', 'info');
    this.updateNavbarBadges();
    this.renderCurrentView();
  }

  handleQuickRegister(event) {
    event.preventDefault();
    const nameInput = document.getElementById('reg-name');
    const emailInput = document.getElementById('reg-email');
    if (!nameInput || !emailInput) return;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!name || !email) return;

    patunganState.registerUser(name, email);
    this.closeModal('modal-login');
    this.showToast(`Selamat datang, ${name}! Bonus saldo Rp 25.000 telah ditambahkan.`, 'success');
    this.updateNavbarBadges();

    if (this.pendingCheckout) {
      const dest = this.pendingCheckout;
      this.pendingCheckout = null;
      this.navigate('checkout', dest);
    } else {
      this.renderCurrentView();
    }
  }

  handleJoinGroup(groupId, planKey) {
    if (patunganState.isGuest()) {
      this.pendingCheckout = { groupId, planKey };
      this.showLoginModal();
      this.showToast('Silakan masuk atau buat profil cepat untuk melanjutkan pesanan.', 'info');
      return;
    }
    this.navigate('checkout', { groupId, planKey });
  }

  simulateRaceCondition(groupId) {
    try {
      patunganState.simulateSlotRaceCondition(groupId);
      this.showToast('⚡ [Simulator] Kuota grup ini berhasil diisi penuh oleh pengguna lain di background!', 'info');
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  showReuploadProofModal(orderId) {
    const order = patunganState.getOrderById(orderId);
    if (!order) return;

    this.reuploadOrderId = orderId;
    this.reuploadFileName = null;

    const titleEl = document.getElementById('reupload-order-title');
    const reasonEl = document.getElementById('reupload-reject-reason');
    const previewEl = document.getElementById('reupload-file-preview');

    if (titleEl) titleEl.innerText = `${order.productName} (${order.id}) - Rp ${order.amount.toLocaleString('id-ID')}`;
    if (reasonEl) reasonEl.innerText = order.rejectReason || 'Bukti transfer tidak dapat diverifikasi oleh admin.';
    if (previewEl) {
      previewEl.innerHTML = `
        <i data-lucide="image" class="w-6 h-6 mx-auto text-slate-400 mb-1"></i>
        <span>Klik untuk memilih file baru (atau gunakan simulasi)</span>
      `;
    }

    const modal = document.getElementById('modal-reupload-proof');
    if (modal) modal.classList.remove('hidden');
    this.safeRenderIcons();
  }

  handleReuploadFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      this.reuploadFileName = file.name;
      const previewEl = document.getElementById('reupload-file-preview');
      if (previewEl) {
        previewEl.innerHTML = `
          <i data-lucide="file-check" class="w-6 h-6 mx-auto text-emerald-600 mb-1"></i>
          <span class="text-emerald-700 font-bold">${file.name} (${Math.round(file.size / 1024)} KB)</span>
        `;
      }
      this.safeRenderIcons();
    }
  }

  submitReuploadProof() {
    if (!this.reuploadOrderId) return;
    const fileName = this.reuploadFileName || `bukti_transfer_reupload_${Date.now().toString().slice(-4)}.jpg`;

    try {
      patunganState.reuploadProof(this.reuploadOrderId, fileName);
      this.closeModal('modal-reupload-proof');
      this.showToast(`Bukti transfer untuk pesanan ${this.reuploadOrderId} berhasil dikirim ulang! Status kini Menunggu Verifikasi.`, 'success');
      this.renderCurrentView();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  requestNewGroup(productId) {
    patunganState.requestGroup(productId);
    const product = patunganState.getProductById(productId);
    this.showToast(`Permintaan buka grup baru untuk ${product ? product.name : 'produk'} telah dikirim ke admin! Anda juga dapat langsung membukanya di Mode Admin.`, 'success');
    this.renderCurrentView();
  }

  handleAdminCreateGroup(event) {
    event.preventDefault();
    const productSelect = document.getElementById('admin-new-group-product');
    const planSelect = document.getElementById('admin-new-group-plan');
    if (!productSelect || !planSelect) return;

    const productId = productSelect.value;
    const planKey = planSelect.value;

    try {
      const newGroup = patunganState.createGroup({ productId, planKey, durationDays: 3 });
      const product = patunganState.getProductById(productId);
      this.showToast(`Grup baru ${product.name} ${newGroup.groupNumber} berhasil dibuka! Sekarang dapat diakses di Katalog & Detail Produk.`, 'success');
      this.renderCurrentView();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  }

  togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input) return;

    if (input.type === 'password') {
      input.type = 'text';
      if (icon) icon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      if (icon) icon.setAttribute('data-lucide', 'eye');
    }
    this.safeRenderIcons();
  }

  copyToClipboard(elementId, label = 'Teks') {
    const input = document.getElementById(elementId);
    if (!input) return;
    
    navigator.clipboard.writeText(input.value).then(() => {
      this.showToast(`${label} berhasil disalin ke clipboard!`, 'info');
    }).catch(() => {
      input.select();
      document.execCommand('copy');
      this.showToast(`${label} disalin!`, 'info');
    });
  }

  toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    
    let bgClass = 'bg-slate-900 text-white border-2 border-slate-900';
    let iconName = 'info';

    if (type === 'success') {
      bgClass = 'bg-emerald-600 text-white border-2 border-slate-900';
      iconName = 'check-circle';
    } else if (type === 'error') {
      bgClass = 'bg-red-600 text-white border-2 border-slate-900';
      iconName = 'alert-triangle';
    }

    toast.className = `${bgClass} p-3 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2.5 text-xs font-bold pointer-events-auto transform transition-all duration-300 translate-y-[-10px] opacity-0 max-w-sm`;
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-4 h-4 shrink-0"></i>
      <span class="flex-grow">${message}</span>
    `;

    container.appendChild(toast);
    this.safeRenderIcons();

    setTimeout(() => {
      toast.classList.remove('translate-y-[-10px]', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ========================================================
  // FLOATING AI CHATBOT LOGIC
  // ========================================================
  toggleChat() {
    const chatWindow = document.getElementById('ai-chat-window');
    if (chatWindow) {
      chatWindow.classList.toggle('hidden');
      if (!chatWindow.classList.contains('hidden')) {
        this.scrollChatToBottom();
        const input = document.getElementById('ai-chat-input');
        if (input) input.focus();
      }
    }
    this.safeRenderIcons();
  }

  openChatWithPrompt(promptText) {
    const chatWindow = document.getElementById('ai-chat-window');
    if (chatWindow && chatWindow.classList.contains('hidden')) {
      chatWindow.classList.remove('hidden');
    }
    this.sendChatMessage(promptText);
  }

  clearChatHistory() {
    this.chatMessages = [
      {
        sender: 'ai',
        text: 'Halo kembali! Ada yang bisa saya bantu terkait paket patungan, cek kuota, atau refund saldo?'
      }
    ];
    this.renderChatMessages();
  }

  handleChatSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('ai-chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    this.sendChatMessage(text);
  }

  sendChatMessage(userText) {
    // Tambah pesan user
    this.chatMessages.push({ sender: 'user', text: userText });
    this.renderChatMessages();

    // Generate respon AI secara cerdas berdasarkan keyword & data produk
    setTimeout(() => {
      const response = this.generateAIResponse(userText);
      this.chatMessages.push(response);
      this.renderChatMessages();
    }, 400);
  }

  renderChatMessages() {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    container.innerHTML = this.chatMessages.map(msg => {
      const isUser = msg.sender === 'user';
      return `
        <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[85%] ${
            isUser 
              ? 'bg-slate-900 text-white p-2.5 border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] font-medium' 
              : 'bg-white text-slate-800 p-3 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]'
          }">
            ${!isUser ? `
              <div class="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 mb-1">
                <i data-lucide="bot" class="w-3 h-3"></i> Asisten Patungan
              </div>
            ` : ''}
            
            <div class="leading-relaxed whitespace-pre-line">${msg.text}</div>

            <!-- Jika AI menyertakan tombol aksi / kartu rekomendasi -->
            ${msg.actionCard ? `
              <div class="mt-2.5 pt-2 border-t border-slate-200">
                <div class="p-2 bg-slate-50 border border-slate-300 text-[11px] mb-2">
                  <span class="font-bold text-slate-900 block">${msg.actionCard.title}</span>
                  <span class="font-mono text-emerald-700 font-bold block">${msg.actionCard.price}</span>
                  <span class="text-[10px] text-slate-500">${msg.actionCard.note}</span>
                </div>
                <button onclick="app.navigate('product-detail', { productId: '${msg.actionCard.productId}' }); app.toggleChat();" 
                        class="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] uppercase tracking-wider border border-slate-900 flex items-center justify-center gap-1">
                  <span>Lihat Paket & Grup</span>
                  <i data-lucide="arrow-right" class="w-3 h-3"></i>
                </button>
              </div>
            ` : ''}

          </div>
        </div>
      `;
    }).join('');

    this.scrollChatToBottom();
    this.safeRenderIcons();
  }

  scrollChatToBottom() {
    const container = document.getElementById('ai-chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  generateAIResponse(prompt) {
    const p = prompt.toLowerCase();

    // 1. Keyword: Di bawah 25rb / Hemat / Murah
    if (p.includes('25') || p.includes('murah') || p.includes('hemat') || p.includes('termurah')) {
      return {
        sender: 'ai',
        text: 'Ini rekomendasi paket paling hemat di bawah Rp 25.000 / bulan:\n\n• **Canva Pro Team**: Hanya Rp 18.000/bln (Cocok buat desainer & pembuat konten).\n• **CapCut Pro**: Hanya Rp 24.000/bln (Unlock auto-caption & effect).\n\nKamu mau gabung grup yang mana?',
        actionCard: {
          title: 'Canva Pro Team (1 Bulan)',
          price: 'Rp 18.000 / bulan',
          note: 'Grup #12 sedang buka (3/5 slot)',
          productId: 'prod_canva'
        }
      };
    }

    // 2. Keyword: Sistem Patungan & Refund / Garansi
    if (p.includes('sistem') || p.includes('refund') || p.includes('cara') || p.includes('garansi') || p.includes('aturan')) {
      return {
        sender: 'ai',
        text: 'Sistem patungan di sini sangat adil & 100% aman:\n\n1. **Pilih Grup**: Kamu memilih slot di grup yang sedang dibuka.\n2. **Masa Aktif Fair**: Masa aktif langganan **baru mulai dihitung** setelah kuota penuh (5/5).\n3. **Garansi Full Refund**: Jika waktu tunggu habis dan slot belum genap, 100% dana langsung kembali otomatis ke saldo dompet tanpa potongan!',
      };
    }

    // 3. Keyword: Netflix
    if (p.includes('netflix') || p.includes('film') || p.includes('streaming') || p.includes('tontonan')) {
      return {
        sender: 'ai',
        text: 'Untuk Netflix Premium Ultra HD (4K HDR), biayanya Rp 38.000/bln.\n\nKabar baik! **Grup Netflix #05 saat ini terisi 4/5 slot**. Jika kamu gabung sekarang, grup langsung lengkap 5/5 dan akunmu langsung aktif seketika!',
        actionCard: {
          title: 'Netflix Premium Ultra HD (4K)',
          price: 'Rp 38.000 / bulan',
          note: '⚡ Grup #05 sisa 1 slot lagi!',
          productId: 'prod_netflix'
        }
      };
    }

    // 4. Keyword: Desain / Canva
    if (p.includes('desain') || p.includes('canva') || p.includes('poster') || p.includes('gambar')) {
      return {
        sender: 'ai',
        text: 'Untuk kebutuhan desain, kami sangat merekomendasikan **Canva Pro Team** seharga Rp 18.000/bln.\n\nKamu dapat akses ke 100+ juta template premium, Magic Eraser, Background Remover, dan 1TB Cloud Storage.',
        actionCard: {
          title: 'Canva Pro Team',
          price: 'Rp 18.000 / bulan',
          note: '30 Hari Garansi Penuh',
          productId: 'prod_canva'
        }
      };
    }

    // 5. Keyword: Editing / Capcut / Video
    if (p.includes('editing') || p.includes('capcut') || p.includes('video') || p.includes('tiktok') || p.includes('reels')) {
      return {
        sender: 'ai',
        text: 'Untuk editing video TikTok & Instagram Reels, pilihan terbaik adalah **CapCut Pro** (Rp 24.000/bln).\n\nKamu dapat fitur export 4K 60fps tanpa watermark dan auto-caption otomatis bahasa Indonesia!',
        actionCard: {
          title: 'CapCut Pro',
          price: 'Rp 24.000 / bulan',
          note: 'Grup #03 Siap Gabung',
          productId: 'prod_capcut'
        }
      };
    }

    // 6. Keyword: AI / ChatGPT / GPT
    if (p.includes('ai') || p.includes('chatgpt') || p.includes('gpt') || p.includes('openai')) {
      return {
        sender: 'ai',
        text: 'Akses model tercanggih **ChatGPT Plus (GPT-4o)** dengan harga patungan hemat Rp 55.000/bln.\n\nBebas generate gambar via DALL-E 3 dan analisis data Excel/PDF.',
        actionCard: {
          title: 'ChatGPT Plus (GPT-4o)',
          price: 'Rp 55.000 / bulan',
          note: 'Grup #08 Siap Gabung',
          productId: 'prod_chatgpt'
        }
      };
    }

    // Default Fallback Response
    return {
      sender: 'ai',
      text: 'Pertanyaan menarik! Di sistem Patungan Akun ini, kamu bisa patungan **Netflix**, **Canva Pro**, **CapCut Pro**, atau **ChatGPT Plus**.\n\nKamu bisa coba tanyakan:\n• "Paket di bawah 25rb?"\n• "Gimana sistem patungan & refund?"\n• "Ada slot Netflix hampir penuh?"'
    };
  }
}

// Inisialisasi controller aplikasi saat window dimuat
window.app = new AppController();
