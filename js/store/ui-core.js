/* ================================================================
   KIRANA BASKET — ui-core.js
   Toasts, store init/sync, header binding, dark mode, language toggle.
   ================================================================ */

/* ── TOAST ── */
function showToast(msg, dur = 3200) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.style.animation = "none"; void t.offsetWidth;
  t.style.display = "block";
  t.style.animation = `toast-ani ${dur / 1000}s ease forwards`;
  setTimeout(() => t.style.display = "none", dur);
}

/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
async function storeInit() {
  const _stat = (t) => { if (window._setLoadStatus) window._setLoadStatus(t); console.log("[storeInit]", t); };

  // ── STEP 1: show the store INSTANTLY using whatever's cached locally
  // (or sensible defaults) — never wait on the network to render the UI.
  ST.products = LSGet("products", null) || INITIAL_PRODUCTS;
  ST.settings = LSGet("settings", null) || { ...DEFAULT_SETTINGS };
  ST.banners  = LSGet("banners",  null) || [...DEFAULT_BANNERS];

  ST.cart     = LSGet("cart", {});
  ST.wishlist = new Set(LSGet("wishlist", []));
  ST.recent   = LSGet("recent", []);
  ST.selVar   = LSGet("selVar", {});

  ST.products.forEach(p => {
    if (!Array.isArray(p.variants) || !p.variants.length) p.variants = [{ label: "1 pc", price: p.price || 0 }];
    if (!ST.selVar[p.id]) ST.selVar[p.id] = p.variants[0].label;
  });

  _stat("Building app...");
  buildUI();

  // ── STEP 2: sync with Firebase quietly in the background. Products,
  // settings and banners are fetched in PARALLEL (not one-by-one) so a
  // slow connection adds delay once, not three times over. If this is
  // slower than the user's patience, they've already got a working store
  // in front of them from Step 1 — this just refreshes it in place.
  (async () => {
    try {
      await dbInit();
      const [dbProds, dbSett, dbBann] = await Promise.all([
        dbLoadProducts(), dbLoadSettings(), dbLoadBanners()
      ]);

      if (dbProds) {
        ST.products = dbProds;
        dbProds.forEach(p => {
          if (!Array.isArray(p.variants) || !p.variants.length) p.variants = [{ label: "1 pc", price: p.price || 0 }];
          if (!ST.selVar[p.id]) ST.selVar[p.id] = p.variants[0].label;
        });
      }
      // Always refresh the local cache with the latest known-good data —
      // whether it came from Firebase just now or is the fallback default —
      // so the NEXT visit (even fully offline) has something real to show
      // instead of falling back to generic demo products again.
      dbSaveProducts(ST.products);

      if (dbSett) ST.settings = dbSett;
      dbSaveSettings(ST.settings);
      refreshHeaderFromSettings();

      if (dbBann) ST.banners = dbBann;
      dbSaveBanners(ST.banners);

      renderProducts();
      buildBanners();
      renderCategoryBar?.();
    } catch(e) { console.warn("Background sync failed:", e.message); }

    // Real-time listeners (sync from other browsers/admin)
    dbListenProducts(prods => {
      ST.products = prods;
      prods.forEach(p => {
        if (!Array.isArray(p.variants) || !p.variants.length) p.variants = [{ label: "1 pc", price: p.price || 0 }];
        if (!ST.selVar[p.id]) ST.selVar[p.id] = p.variants[0].label;
      });
      const obj = {}; prods.forEach(p => obj[p.id] = p); LS("products", obj);
      renderProducts();
    });
    dbListenBanners(banners => {
      ST.banners = banners;
      const obj = {}; banners.forEach(b => obj[b.id] = b); LS("banners", obj);
      buildBanners();
    });
    dbListenSettings(sett => { ST.settings = sett; LS("settings", sett); refreshHeaderFromSettings(); });
  })();
}

/* ════════════════════════════════════════════════════════════
   UI BUILD
════════════════════════════════════════════════════════════ */
function refreshHeaderFromSettings() {
  const nameEl = document.getElementById("hdr-store-name");
  if (nameEl) nameEl.textContent = (ST.settings.storeName || "Kirana Basket") + " 🛒";
  const subEl = document.getElementById("store-sub");
  if (subEl) subEl.textContent = "📍 " + (ST.settings.storeAddr || "");
  document.title = ST.settings.storeName || "Kirana Basket";
}

function buildUI() {
  refreshHeaderFromSettings();
  const notifBtn = document.getElementById("notif-btn");
  if (notifBtn && "Notification" in window) {
    if (Notification.permission === "granted") { notifBtn.textContent = "🔔"; notifBtn.title = "Notifications ON"; initNotifications(); }
    else if (Notification.permission === "denied") { notifBtn.textContent = "🔕"; notifBtn.title = "Notifications blocked — browser settings se on karo"; }
  }
  buildCats();
  buildBanners();
  renderProducts();
  updateCartUI();
  updateWishBadge();
  checkAdminHash();
}

/* ── DARK / LANG ── */
function toggleDark() {
  ST.dark = !ST.dark;
  document.body.style.background = ST.dark ? "#0a0a0a" : "#f0f0f5";
  document.getElementById("dark-btn").textContent = ST.dark ? "☀️" : "🌙";
}
function toggleLang() {
  ST.lang = ST.lang === "en" ? "mr" : "en";
  document.getElementById("lang-btn").textContent = ST.lang === "en" ? "मर" : "EN";
  buildCats(); renderProducts();
}

