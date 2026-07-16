/* ================================================================
   BONGARDE MART – Db.js  (v4 - MULTI-STORE / WHITE-LABEL)
   localStorage se turant khulta hai
   Firebase background mein sync karta hai
   Har dukan (store) ka data alag STORE_ID ke through isolate hota hai
   ================================================================ */

let _db   = null;
let _fbOk = false;
let _mode = "firestore";

/* ────────────────────────────────────────
   STORE ID — multi-tenant isolation
   URL: index.html?s=STOREID  /  admin.html?s=STOREID
──────────────────────────────────────── */
function getStoreId() {
  try {
    const p = new URLSearchParams(window.location.search);
    let id = (p.get("s") || p.get("store") || "").trim();
    if (id) {
      id = id.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
      if (id) { try { localStorage.setItem("bm_active_store", id); } catch(e) {} return id; }
    }
    const saved = (function(){ try { return localStorage.getItem("bm_active_store"); } catch(e) { return null; } })();
    if (saved) return saved;
  } catch(e) {}
  return "demo";
}
const STORE_ID = getStoreId();

/* ────────────────────────────────────────
   INIT — background mein connect karta hai,
   lekin ab dbInit() connection settle hone
   tak wait karta hai (max 4s), taaki pehli
   baar load hote hi sahi settings/password milein
──────────────────────────────────────── */
let _connectPromise = null;

function dbInit() {
  if (!_connectPromise) _connectPromise = _connectFirebaseBackground();
  return _connectPromise;
}

function _connectFirebaseBackground() {
  return new Promise(resolve => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(_fbOk); } };
    const timeout = setTimeout(finish, 4000); // don't hang forever on slow/no network

    try {
      if (typeof firebase === "undefined" || typeof FIREBASE_CONFIG === "undefined") {
        clearTimeout(timeout); return finish();
      }
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);

      const fs = firebase.firestore();

      fs.collection("stores").doc(STORE_ID).collection("data").doc("settings").get()
        .then(() => {
          _db = fs; _fbOk = true; _mode = "firestore";
          console.log("✅ Firestore connected");
          clearTimeout(timeout); finish();
        })
        .catch(err => {
          console.warn("Firestore failed:", err.code, "- trying RTDB");
          _tryRTDB(() => { clearTimeout(timeout); finish(); });
        });
    } catch(e) {
      console.warn("Firebase init error:", e.message);
      clearTimeout(timeout); finish();
    }
  });
}

function _tryRTDB(done) {
  try {
    if (!firebase.apps.length) return done();
    const rtdb = firebase.database();
    rtdb.ref("bm_stores/" + STORE_ID + "/settings").once("value")
      .then(() => {
        _db = rtdb; _fbOk = true; _mode = "rtdb";
        console.log("✅ RTDB connected");
        done();
      })
      .catch(err => { console.warn("RTDB failed:", err.message); done(); });
  } catch(e) {
    console.warn("RTDB error:", e.message); done();
  }
}

/* ────────────────────────────────────────
   LOCALSTORAGE
──────────────────────────────────────── */
const LS    = (k, v) => { try { localStorage.setItem("bm_" + STORE_ID + "_" + k, JSON.stringify(v)); } catch(e) {} };
const LSGet = (k, d) => { try { const v = localStorage.getItem("bm_" + STORE_ID + "_" + k); return v ? JSON.parse(v) : d; } catch(e) { return d; } };

/* ────────────────────────────────────────
   FIRESTORE HELPERS
──────────────────────────────────────── */
function _withTimeout(promise, ms, fallback) {
  return new Promise(resolve => {
    let done = false;
    const t = setTimeout(() => { if (!done) { done = true; resolve(fallback); } }, ms);
    promise.then(v => { if (!done) { done = true; clearTimeout(t); resolve(v); } })
           .catch(() => { if (!done) { done = true; clearTimeout(t); resolve(fallback); } });
  });
}

function _storeDoc(docId) {
  return _db.collection("stores").doc(STORE_ID).collection("data").doc(docId);
}
async function fsRead(col, docId) {
  try {
    const snap = await _withTimeout(_storeDoc(docId).get(), 6000, null);
    return (snap && snap.exists) ? snap.data() : null;
  } catch(e) { return null; }
}
function fsWrite(col, docId, data) {
  if (!_db || _mode !== "firestore") return;
  _storeDoc(docId).set(data).catch(e => console.warn("fsWrite:", e.message));
}
function fsListen(col, docId, cb) {
  if (!_db || _mode !== "firestore") return;
  _storeDoc(docId).onSnapshot(
    snap => { if (snap.exists) cb(snap.data()); },
    err  => console.warn("fsListen:", err.message)
  );
}

/* ────────────────────────────────────────
   RTDB HELPERS
──────────────────────────────────────── */
async function rtRead(path) {
  try {
    const snap = await _withTimeout(_db.ref(path).once("value"), 6000, null);
    return snap ? snap.val() : null;
  } catch(e) { return null; }
}
function rtWrite(path, data) {
  if (!_db || _mode !== "rtdb") return;
  _db.ref(path).set(data).catch(e => console.warn("rtWrite:", e.message));
}
function rtListen(path, cb) {
  if (!_db || _mode !== "rtdb") return;
  _db.ref(path).on("value",
    snap => { if (snap.val() !== null) cb(snap.val()); },
    err  => console.warn("rtListen:", err.message)
  );
}
function _rtPath(key) { return "bm_stores/" + STORE_ID + "/" + key; }

/* ────────────────────────────────────────
   UNIFIED READ / WRITE / LISTEN
──────────────────────────────────────── */
async function dbRead(key, fallback) {
  const cached = LSGet(key, null);
  if (!_fbOk || !_db) return cached !== null ? cached : fallback;

  let data = null;
  try {
    if (_mode === "firestore") {
      const res = await fsRead("stores", key);
      data = res ? res.data : null;
    } else {
      data = await rtRead(_rtPath(key));
    }
  } catch(e) {}

  if (data !== null) { LS(key, data); return data; }
  return cached !== null ? cached : fallback;
}

function dbWrite(key, data) {
  LS(key, data);
  if (!_fbOk || !_db) return;
  if (_mode === "firestore") fsWrite("stores", key, { data });
  else rtWrite(_rtPath(key), data);
}

function dbListen(key, cb) {
  if (!_fbOk || !_db) return;
  if (_mode === "firestore") {
    fsListen("stores", key, doc => { if (doc && doc.data !== undefined) cb(doc.data); });
  } else {
    rtListen(_rtPath(key), cb);
  }
}

/* ────────────────────────────────────────
   DOMAIN FUNCTIONS
──────────────────────────────────────── */
function _productsCol() { return _db.collection("stores").doc(STORE_ID).collection("products"); }

/* Loads products from the new per-document collection. If that's empty but
   the OLD single-document format still has data (stores created before
   this update), it's read once and automatically migrated into the new
   collection — no manual action needed for existing stores. */
async function dbLoadProducts() {
  if (_fbOk && _db && _mode === "firestore") {
    try {
      const snap = await _withTimeout(_productsCol().get(), 6000, null);
      if (snap && !snap.empty) {
        const list = snap.docs.map(d => d.data());
        const obj = {}; list.forEach(p => obj[p.id] = p); LS("products", obj);
        return list;
      }
    } catch(e) { console.warn("dbLoadProducts:", e.message); }

    // New collection is empty — check the legacy single-document format.
    try {
      const legacyRaw = await dbRead("products", null);
      if (legacyRaw) {
        const list = Array.isArray(legacyRaw) ? legacyRaw : Object.values(legacyRaw);
        if (list.length) { dbSaveProducts(list); return list; } // migrates in the background
      }
    } catch(e) {}
    return null;
  }
  const raw = LSGet("products", null);
  return raw ? Object.values(raw) : null;
}

/* Bulk save (CSV import, reordering) — writes every product as its own
   document in one batch. Concurrent edits to DIFFERENT products never
   collide, and no single write can ever approach Firestore's 1MB
   per-document limit no matter how large the catalog grows. */
function dbSaveProducts(list) {
  const obj = {}; list.forEach(p => obj[p.id] = p); LS("products", obj);
  if (!_fbOk || !_db || _mode !== "firestore") return;
  try {
    const batch = _db.batch();
    list.forEach(p => batch.set(_productsCol().doc(p.id), p));
    batch.commit().catch(e => console.warn("dbSaveProducts:", e.message));
  } catch(e) { console.warn("dbSaveProducts:", e.message); }
}

/* Single-product save — use this for normal add/edit/toggle-stock actions.
   Only touches the one document that actually changed. */
async function dbSaveProduct(product) {
  const cached = LSGet("products", {}); cached[product.id] = product; LS("products", cached);
  if (!_fbOk || !_db || _mode !== "firestore") return;
  try { await _productsCol().doc(product.id).set(product); }
  catch(e) { console.warn("dbSaveProduct:", e.message); }
}
async function dbDeleteProduct(id) {
  const cached = LSGet("products", {}); delete cached[id]; LS("products", cached);
  if (!_fbOk || !_db || _mode !== "firestore") return;
  try { await _productsCol().doc(id).delete(); }
  catch(e) { console.warn("dbDeleteProduct:", e.message); }
}
function dbListenProducts(cb) {
  if (_fbOk && _db && _mode === "firestore") {
    try {
      _productsCol().onSnapshot(
        snap => { if (!snap.empty) cb(snap.docs.map(d => d.data())); },
        err => console.warn("dbListenProducts:", err.message)
      );
      return;
    } catch(e) {}
  }
  dbListen("products", raw => { if (raw) cb(Array.isArray(raw) ? raw : Object.values(raw)); });
}

function _ordersCol() {
  return _db.collection("stores").doc(STORE_ID).collection("orders");
}

/* dbAddOrder — writes ONE order as its own document. This never reads or
   overwrites any other customer's order, so two people checking out at the
   same moment can never wipe each other's order out (the old version read
   the whole order list, appended locally, then overwrote the whole list —
   classic lost-update bug + it meant every customer's browser downloaded
   every other customer's name/phone/address just to place an order). */
async function dbAddOrder(order) {
  const cached = LSGet("orders", {});
  cached[order.id] = order;
  LS("orders", cached);

  if (!_fbOk || !_db || _mode !== "firestore") return;
  try { await _ordersCol().doc(order.id).set(order); }
  catch(e) { console.warn("dbAddOrder:", e.message); }
}

/* Decrements stock for every item in a cart using a Firestore transaction
   PER PRODUCT — this is what actually prevents overselling when two
   customers buy the last unit at the same moment; whichever transaction
   commits first wins, the second sees the updated count and can stop at
   zero instead of going negative. Only applies to products that have
   quantity-tracking turned on (stockQty is a number, not null). Silently
   skipped if offline — the order still goes through either way. */
async function dbDecrementStock(cartItems) {
  if (!_fbOk || !_db || _mode !== "firestore") return;
  for (const item of cartItems) {
    try {
      const ref = _productsCol().doc(item.id);
      await _db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return;
        const p = snap.data();
        if (p.stockQty == null) return; // quantity tracking not used for this product
        const newQty = Math.max(0, p.stockQty - item.qty);
        tx.update(ref, { stockQty: newQty, stock: newQty > 0 });
      });
    } catch(e) { console.warn("dbDecrementStock:", item.id, e.message); }
  }
}

/* Admin-only: update an order's status (pending/packed/out_for_delivery/
   delivered/cancelled), payment verification, or assigned delivery person.
   Firestore rules only allow this write for the store's signed-in owner. */
async function dbUpdateOrder(orderId, patch) {
  if (!_fbOk || !_db || _mode !== "firestore") throw new Error("Offline — can't update order");
  await _ordersCol().doc(orderId).update(patch);
}

/* ────────────────────────────────────────
   LIGHTWEIGHT ERROR MONITORING (no third-party service required)
   Logs uncaught JS errors so the admin can see if customers are hitting
   real bugs, without needing a paid tool like Sentry. Best-effort only —
   never throws, never blocks the app. Capped to avoid noise/cost.
──────────────────────────────────────── */
function dbLogError(message, source) {
  try {
    if (!_fbOk || !_db || _mode !== "firestore") return;
    _db.collection("stores").doc(STORE_ID).collection("errorLog").add({
      message: String(message).slice(0, 500),
      source:  source || "unknown",
      url:     (typeof location !== "undefined" ? location.href : ""),
      ts:      Date.now(),
    }).catch(() => {});
  } catch(e) {}
}
function dbInitErrorMonitoring() {
  window.addEventListener("error", (e) => dbLogError(e.message, e.filename ? e.filename.split("/").pop() : "window"));
  window.addEventListener("unhandledrejection", (e) => dbLogError(e.reason?.message || String(e.reason), "promise"));
}
async function dbLoadErrorLog() {
  if (!_fbOk || !_db || _mode !== "firestore") return [];
  try {
    const snap = await _withTimeout(
      _db.collection("stores").doc(STORE_ID).collection("errorLog").orderBy("ts", "desc").limit(50).get(),
      6000, null
    );
    return snap ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : [];
  } catch(e) { return []; }
}

/* dbLoadOrders — admin-only: loads every order for this store. Requires the
   admin to be signed in (see dbSignInOwner) — the Firestore security rules
   only allow this read for the authenticated store owner. */
async function dbLoadOrders() {
  if (_fbOk && _db && _mode === "firestore") {
    try {
      const snap = await _withTimeout(_ordersCol().orderBy("ts", "desc").limit(500).get(), 7000, null);
      if (snap) return snap.docs.map(d => d.data());
    } catch(e) { console.warn("dbLoadOrders:", e.message); }
  }
  const raw = LSGet("orders", {});
  return Object.values(raw || {});
}

async function dbLoadSettings() { return await dbRead("settings", null); }
function dbSaveSettings(s) { dbWrite("settings", s); }
function dbListenSettings(cb) { dbListen("settings", cb); }

function _bannersCol() { return _db.collection("stores").doc(STORE_ID).collection("banners"); }

async function dbLoadBanners() {
  if (_fbOk && _db && _mode === "firestore") {
    try {
      const snap = await _withTimeout(_bannersCol().get(), 6000, null);
      if (snap && !snap.empty) {
        const list = snap.docs.map(d => d.data());
        const obj = {}; list.forEach(b => obj[b.id] = b); LS("banners", obj);
        return list;
      }
    } catch(e) { console.warn("dbLoadBanners:", e.message); }

    try {
      const legacyRaw = await dbRead("banners", null);
      if (legacyRaw) {
        const list = Array.isArray(legacyRaw) ? legacyRaw : Object.values(legacyRaw);
        if (list.length) { dbSaveBanners(list); return list; }
      }
    } catch(e) {}
    return null;
  }
  const raw = LSGet("banners", null);
  return raw ? Object.values(raw) : null;
}
function dbSaveBanners(list) {
  const obj = {}; list.forEach(b => obj[b.id] = b); LS("banners", obj);
  if (!_fbOk || !_db || _mode !== "firestore") return;
  try {
    const batch = _db.batch();
    list.forEach(b => batch.set(_bannersCol().doc(b.id), b));
    batch.commit().catch(e => console.warn("dbSaveBanners:", e.message));
  } catch(e) { console.warn("dbSaveBanners:", e.message); }
}
function dbListenBanners(cb) {
  if (_fbOk && _db && _mode === "firestore") {
    try {
      _bannersCol().onSnapshot(
        snap => { if (!snap.empty) cb(snap.docs.map(d => d.data())); },
        err => console.warn("dbListenBanners:", err.message)
      );
      return;
    } catch(e) {}
  }
  dbListen("banners", raw => { if (raw) cb(Array.isArray(raw) ? raw : Object.values(raw)); });
}

function dbIsFirebase() { return _fbOk; }
function dbGetStoreId() { return STORE_ID; }

/* ────────────────────────────────────────
   OWNER AUTH — real server-verified login.
   Firebase Auth needs an email, so we derive a synthetic one from the
   owner's mobile number ("9876543210@bongardemart.store"). The owner still
   only ever sees/types their mobile + password — this is just how we plug
   into Firebase's secure, hashed password system instead of comparing
   plaintext passwords stored in Firestore (which anyone could read).
──────────────────────────────────────── */
function _authEmailFor(mobile) { return String(mobile).trim() + "@bongardemart.store"; }

async function dbRegisterOwner(mobile, pass) {
  const fs = _regInitFirebase(); // also ensures firebase.initializeApp() ran
  if (!fs) throw new Error("Firebase not configured — check config.js");
  const cred = await firebase.auth().createUserWithEmailAndPassword(_authEmailFor(mobile), pass);
  return cred.user.uid;
}

async function dbSignInOwner(mobile, pass) {
  if (typeof firebase === "undefined") throw new Error("Firebase not loaded");
  const cred = await firebase.auth().signInWithEmailAndPassword(_authEmailFor(mobile), pass);
  return cred.user.uid;
}

function dbSignOutOwner() {
  try { if (typeof firebase !== "undefined") firebase.auth().signOut(); } catch(e) {}
}

async function dbChangeOwnerPassword(newPass) {
  if (typeof firebase === "undefined" || !firebase.auth().currentUser) {
    throw new Error("Not signed in");
  }
  await firebase.auth().currentUser.updatePassword(newPass);
}

/* ────────────────────────────────────────
   PUSH NOTIFICATIONS (Firebase Cloud Messaging)
   Client-side half only — actually SENDING a push requires a Cloud
   Function (see /functions/index.js) that you deploy yourself, because
   sending pushes needs a server-held credential that must never sit in
   browser code. See NOTIFICATIONS.md for the one-time setup steps.
──────────────────────────────────────── */

/* Saves this device's FCM token under the store so the Cloud Function
   knows who to notify. Token doc ID = the token itself, so re-registering
   the same device just overwrites its own entry (safe, no duplicates). */
async function dbSaveFcmToken(token) {
  const fs = _regInitFirebase();
  if (!fs || !token) return;
  try {
    await fs.collection("stores").doc(STORE_ID).collection("tokens").doc(token)
      .set({ token, updatedAt: Date.now() });
  } catch(e) { console.warn("dbSaveFcmToken:", e.message); }
}

/* Admin-only: queues a notification. A Cloud Function watches this
   collection and fans it out via FCM to every saved token for this store. */
async function dbQueueNotification({ title, body, tag }) {
  const fs = _regInitFirebase();
  if (!fs) throw new Error("Firebase not configured");
  if (!firebase.auth().currentUser) throw new Error("Not signed in as store owner");
  await fs.collection("stores").doc(STORE_ID).collection("notificationsOutbox").add({
    title, body, tag: tag || "", createdAt: Date.now(),
  });
}

/* ────────────────────────────────────────
   DIRECTORY — lightweight public listing used
   by nearby.html to find stores within 3km.
   Separate from the per-store private data.
──────────────────────────────────────── */
async function dbWriteDirectory(storeId, entry) {
  const fs = _regInitFirebase();
  if (!fs) return;
  try { await fs.collection("directory").doc(storeId).set(entry, { merge: true }); }
  catch(e) { console.warn("dbWriteDirectory:", e.message); }
}
async function dbListDirectory() {
  const fs = _regInitFirebase();
  if (!fs) return [];
  try {
    const snap = await _withTimeout(fs.collection("directory").get(), 7000, null);
    if (!snap) return [];
    const out = [];
    snap.forEach(doc => out.push({ id: doc.id, ...doc.data() }));
    return out;
  } catch(e) { console.warn("dbListDirectory:", e.message); return []; }
}

/* ────────────────────────────────────────
   REGISTRATION HELPERS (used by register.js)
   Works even before this page's own STORE_ID is relevant —
   writes/reads directly against any storeId passed in.
──────────────────────────────────────── */
function _regInitFirebase() {
  try {
    if (typeof firebase === "undefined" || typeof FIREBASE_CONFIG === "undefined") return null;
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    return firebase.firestore();
  } catch(e) { return null; }
}
async function dbCheckStoreExists(storeId) {
  const fs = _regInitFirebase();
  if (!fs) return false;
  try {
    const snap = await fs.collection("stores").doc(storeId).collection("data").doc("settings").get();
    return snap.exists;
  } catch(e) { return false; }
}
async function dbCreateStore(storeId, { settings, products, banners }) {
  const fs = _regInitFirebase();
  if (!fs) throw new Error("Firebase not configured — check config.js");
  const prodObj = {}; (products || []).forEach(p => prodObj[p.id] = p);
  const bannObj = {}; (banners  || []).forEach(b => bannObj[b.id] = b);
  const doc = fs.collection("stores").doc(storeId).collection("data");
  await doc.doc("settings").set({ data: settings });
  await doc.doc("products").set({ data: prodObj });
  await doc.doc("banners").set({ data: bannObj });
  // Orders now live in their own subcollection (stores/{id}/orders/{orderId})
  // — one document per order — so no seed document is needed here.
}
