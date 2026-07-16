/* ================================================================
   KIRANA BASKET — main.js
   Landing page logic: PIN entry, location auto-detect, PWA install,
   service worker registration. Runs on index.html.
   ================================================================ */

/* ══ LANDING PIN LOGIC ══ */
const pinInp = document.getElementById("pin-inp");
const pinBtn = document.getElementById("pin-btn");
const pinErr = document.getElementById("pin-err");
let   LANDING_SETTINGS = { ...DEFAULT_SETTINGS };

function forceSkipLoad() {
  document.getElementById("loading-overlay").style.display = "none";
  document.getElementById("landing").style.display  = "none";
  document.getElementById("main-app").style.display = "block";
  window.scrollTo(0, 0);
}

function scrollToPin() {
  document.getElementById("pin-inp").scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => document.getElementById("pin-inp").focus(), 500);
}

/* ══ Load THIS store's own settings (before login/PIN check) so every
   shop shows its own name / address / phone / PIN — not Bongarde's ══ */
async function loadLandingBranding() {
  await dbInit();
  const sett = await dbLoadSettings();
  LANDING_SETTINGS = sett || { ...DEFAULT_SETTINGS };
  const s = LANDING_SETTINGS;

  document.getElementById("page-title").textContent   = s.storeName + (s.storeAddr ? " – " + s.storeAddr.split(",")[0] : "");
  document.getElementById("nav-logo-txt").textContent  = s.storeName;
  document.getElementById("nav-logo-ic").textContent   = (s.storeName || "S").trim().charAt(0).toUpperCase();
  document.getElementById("hero-loc").textContent      = "📍 " + (s.storeAddr || "") + (s.deliveryPin ? " – " + s.deliveryPin : "");
  document.getElementById("hero-sub-txt").innerHTML    = "Fresh kirana items at best<br>prices. Order on WhatsApp.";
  document.getElementById("hero-badge-txt").textContent= (s.storeAddr ? s.storeAddr.split(",")[0] : "Local") + "'s Own!";
  document.getElementById("pin-hint").textContent      = "We deliver to " + (s.storeAddr || "your area") + (s.deliveryPin ? " – " + s.deliveryPin : "");
  document.getElementById("footer-logo-txt").textContent = "🛒 " + s.storeName;
  document.getElementById("footer-addr-txt").innerHTML = `${s.storeAddr || ""}<br>📞 ${s.storePhone || ""} &nbsp;·&nbsp; WhatsApp Orders Available`;
  const loadTxt = document.getElementById("loading-text");
  if (loadTxt) loadTxt.textContent = "Loading " + s.storeName + "...";

  setupDynamicManifest(s);
}
loadLandingBranding();

pinInp.addEventListener("input", function () {
  const ok = this.value.length >= 4;
  pinBtn.classList.toggle("active", ok);
  pinBtn.textContent = ok ? "Go →" : "Check →";
  this.classList.toggle("valid", ok);
  pinErr.textContent = "";
});

pinInp.addEventListener("keydown", e => {
  if (e.key === "Enter") checkPin();
});

/* ══ AUTO-DETECT LOCATION (Blinkit-style) ══
   Uses the browser's GPS instead of making the customer type a PIN code.
   Falls back gracefully to manual PIN entry if location is denied/unavailable. */
function _haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function autoDetectLocation() {
  const statusEl = document.getElementById("auto-loc-status");
  const btn = document.getElementById("auto-loc-btn");

  if (!("geolocation" in navigator)) {
    statusEl.textContent = "⚠️ Location supported nahi hai — neeche PIN daalo";
    return;
  }

  btn.disabled = true;
  btn.textContent = "📍 Location check ho rahi hai...";
  statusEl.textContent = "";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const storeLat = LANDING_SETTINGS.lat, storeLng = LANDING_SETTINGS.lng;
      const DELIVERY_RADIUS_KM = LANDING_SETTINGS.deliveryRadiusKm || 5;

      btn.disabled = false;
      btn.textContent = "📍 Meri Location Se Pata Karo";

      if (typeof storeLat !== "number" || typeof storeLng !== "number") {
        // Store hasn't set its coordinates — fall back to PIN check.
        statusEl.textContent = "⚠️ Store ka location set nahi hai — neeche PIN daalo";
        return;
      }

      const distKm = _haversineKm(latitude, longitude, storeLat, storeLng);
      if (distKm <= DELIVERY_RADIUS_KM) {
        statusEl.innerHTML = `✅ Tum ${distKm.toFixed(1)} km door ho — hum yahan deliver karte hain!`;
        pinInp.value = LANDING_SETTINGS.deliveryPin || "";
        checkPin(true);
      } else {
        statusEl.innerHTML = `❌ Tum ${distKm.toFixed(1)} km door ho — hum sirf ${DELIVERY_RADIUS_KM}km ke andar deliver karte hain.`;
      }
    },
    (err) => {
      btn.disabled = false;
      btn.textContent = "📍 Meri Location Se Pata Karo";
      if (err.code === err.PERMISSION_DENIED) {
        statusEl.textContent = "⚠️ Location permission nahi mili — neeche PIN daalo";
      } else {
        statusEl.textContent = "⚠️ Location nahi mil payi — neeche PIN daalo";
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function checkPin(skipPinValueCheck) {
  const v = pinInp.value.trim();

  if (!skipPinValueCheck) {
    if (v.length < 4) {
      pinErr.textContent = "⚠️ Sahi PIN daalo!";
      return;
    }
  }

  /* Check against THIS store's own delivery PIN, loaded from Firestore/localStorage */
  const validPin = LANDING_SETTINGS.deliveryPin || "416218";

  if (v === validPin) {
    pinBtn.disabled = true;
    pinBtn.textContent = "Loading...";
    pinErr.textContent = "";

    // storeInit() now renders instantly from local/default data and syncs
    // with Firebase quietly in the background — no more blocking spinner
    // that could get stuck on a slow connection.
    storeInit()
      .then(() => finishLoad())
      .catch(err => {
        console.error("storeInit error:", err);
        finishLoad();
      });

    function finishLoad() {
      document.getElementById("landing").style.display  = "none";
      document.getElementById("main-app").style.display = "block";
      window.scrollTo(0, 0);
      pinBtn.disabled = false;
      pinBtn.textContent = "Go →";
    }

  } else {
    pinErr.textContent = `❌ Sirf ${validPin} (${LANDING_SETTINGS.storeAddr || "is area"}) deliver karte hain!`;
    pinInp.value = "";
    pinInp.classList.remove("valid");
    pinBtn.classList.remove("active");
    pinBtn.textContent = "Check →";
    pinInp.style.animation = "shake .4s ease";
    setTimeout(() => pinInp.style.animation = "", 500);
  }
}

/* ══ PWA — dynamic manifest + service worker so every store installs
   on the customer's phone with its OWN name/icon ══ */
function setupDynamicManifest(s) {
  try {
    const manifest = {
      name: s.storeName || "Grocery Store",
      short_name: (s.storeName || "Store").slice(0, 12),
      start_url: "index.html?s=" + dbGetStoreId(),
      scope: "./",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#0c831f",
      icons: [
        { src: (s.iconUrl || "assets/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
        { src: (s.iconUrl || "assets/icons/icon-512.png"), sizes: "512x512", type: "image/png" }
      ]
    };
    const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    // Reuse the single static manifest link tag (added in <head>) so the
    // browser never sees two conflicting <link rel="manifest"> tags.
    let link = document.getElementById("manifest-link");
    if (!link) {
      link = document.createElement("link");
      link.id = "manifest-link";
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.href = url;
    if (s.iconUrl) document.getElementById("apple-icon").href = s.iconUrl;
  } catch(e) { console.warn("manifest setup failed", e); }
}

/* ══ ERROR MONITORING — logs uncaught errors so the admin can see real
   bugs without a paid tool ══ */
dbInitErrorMonitoring();

/* ══ SERVICE WORKER — enables offline shell + installability ══ */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(err => {
      console.warn("SW registration failed:", err.message);
    });
  });
}

/* ══ INSTALL PROMPT — shows a friendly "Install App" button when the
   browser says the PWA is installable, instead of relying on the
   browser's own (often hidden) menu item. ══ */
let _deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  _deferredInstallPrompt = e;
  const btn = document.getElementById("install-app-btn");
  if (btn) btn.style.display = "inline-flex";
});
window.addEventListener("appinstalled", () => {
  _deferredInstallPrompt = null;
  const btn = document.getElementById("install-app-btn");
  if (btn) btn.style.display = "none";
});
function triggerInstallPrompt() {
  const btn = document.getElementById("install-app-btn");
  if (!_deferredInstallPrompt) { if (btn) btn.style.display = "none"; return; }
  _deferredInstallPrompt.prompt();
  _deferredInstallPrompt.userChoice.finally(() => { _deferredInstallPrompt = null; });
}
