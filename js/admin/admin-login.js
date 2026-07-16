/* ================================================================
   KIRANA BASKET — admin-login.js
   Secure owner login (Firebase Auth) + legacy fallback.
   Runs on admin.html.
   ================================================================ */

/* ══ Fix "Back to Store" / links to carry the store id ══ */
document.querySelectorAll('a[href="index.html"]').forEach(a => a.href = "index.html?s=" + dbGetStoreId());
document.querySelectorAll('a[href="register.html"]').forEach(a => {}); // register stays store-agnostic

let _storeSettings = null;
const REMEMBER_KEY = "bm_admin_ok_" + dbGetStoreId();

/* Fetch this store's public settings (name, mobile, ownerUid) so we know
   who to authenticate against before letting anyone into the panel. The
   actual password is never fetched or compared here — Firebase Auth
   verifies it server-side (see dbSignInOwner in Db.js). */
(async function preflight() {
  await dbInit();
  const sett = await dbLoadSettings();
  _storeSettings = sett || DEFAULT_SETTINGS;
  const nameEl = document.getElementById("login-store-name");
  if (nameEl) nameEl.textContent = "🏪 " + (_storeSettings.storeName || "Store");
  document.title = "Admin – " + (_storeSettings.storeName || "Kirana Basket");

  const connEl = document.getElementById("login-conn-status");
  if (connEl) {
    if (dbIsFirebase() && sett) {
      connEl.textContent = "🟢 Live";
      connEl.style.color = "#0c831f";
    } else {
      connEl.textContent = "🔴 Offline / connect nahi hua — thodi der baad try karo";
      connEl.style.color = "#e65100";
    }
  }

  // Already logged in on this device AND Firebase still has a live session
  // for stores using secure login? Skip straight in. (Legacy/demo stores
  // without ownerUid keep the simpler remembered-flag behaviour.)
  const hasSecureLogin = !!_storeSettings.ownerUid;
  const stillSignedIn  = !hasSecureLogin || (typeof firebase !== "undefined" && firebase.auth().currentUser);
  if (localStorage.getItem(REMEMBER_KEY) === "1" && stillSignedIn) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("admin-panel").style.display  = "flex";
    adminInit().catch(e => console.error("adminInit error:", e));
  }
})();

/* ══ LOGIN LOGIC ══ */
async function doLogin() {
  const p   = (document.getElementById("adm-pass").value || "").trim();
  const err = document.getElementById("login-err");
  const btn = document.getElementById("login-btn");

  if (!p) { err.textContent = "⚠️ Password likho!"; return; }

  btn.textContent = "Checking...";
  btn.disabled    = true;
  err.textContent = "";

  const onSuccess = () => {
    try { localStorage.setItem(REMEMBER_KEY, "1"); } catch(e) {}
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("admin-panel").style.display  = "flex";
    adminInit().catch(e => {
      console.error("adminInit error:", e);
      document.getElementById("adm-sub").textContent = "⚠️ Firebase error — local mode";
    });
  };
  const onFail = () => {
    err.textContent = "❌ Galat password!";
    document.getElementById("adm-pass").value = "";
    btn.textContent = "Login →";
    btn.disabled    = false;
  };

  if (_storeSettings && _storeSettings.ownerUid) {
    // Secure path: verify the password with Firebase Auth (server-side,
    // hashed) and confirm the signed-in account actually owns this store.
    try {
      const uid = await dbSignInOwner(_storeSettings.ownerMobile, p);
      if (uid === _storeSettings.ownerUid) onSuccess();
      else { dbSignOutOwner(); onFail(); }
    } catch (e) { onFail(); }
  } else {
    // Legacy path: stores created before secure login existed. Falls back
    // to the plaintext password kept in settings for backward compatibility.
    setTimeout(() => {
      const expected = (_storeSettings && _storeSettings.adminPass) || DEFAULT_SETTINGS.adminPass;
      if (p === expected) onSuccess(); else onFail();
    }, 300);
  }
}

document.getElementById("adm-pass")?.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
