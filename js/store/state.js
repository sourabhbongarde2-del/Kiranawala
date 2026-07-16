/* ================================================================
   KIRANA BASKET — state.js
   Shared in-memory state (ST) + small pure-function helpers used
   across the storefront. Load this FIRST among js/store/*.js files.
   ================================================================ */

/* ================================================================
   BONGARDE MART – store.js
   Customer-facing store logic
   ================================================================ */

/* ── STATE ── */
let ST = {
  products: [],
  settings: { ...DEFAULT_SETTINGS },
  banners:  [],
  cart:     {},        // { "pid__varLabel": qty }
  wishlist: new Set(),
  recent:   [],
  selVar:   {},        // { pid: variantLabel }
  curCat:   "all",
  lang:     "en",
  dark:     false,
  bannerIdx: 0,
  bTimer:    null,
  // cart drawer state
  delivType: "delivery",
  payMode:   "cod",
  couponDisc: 0,
};

/* ── LOCAL HELPERS ── */
const isImg    = s => s && (s.startsWith("data:") || s.startsWith("http"));
const discPct  = (p, mrp) => mrp > p ? Math.round(((mrp - p) / mrp) * 100) : 0;
const fmtDate  = ts => new Date(ts).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
/* NOTE: LS() / LSGet() are defined once in Db.js (loaded before this file)
   and are shared globally — they are already scoped per-store (STORE_ID),
   which correctly keeps each store's cart/wishlist/etc. separate on the
   same device. Redeclaring them here with `const` used to crash the whole
   file at parse time ("Identifier 'LS' has already been declared"), which
   silently broke every customer-facing feature — that's been removed. */

function getSelVar(pid) {
  const p = ST.products.find(x => x.id === pid);
  if (!p) return null;
  const lbl = ST.selVar[pid] || p.variants[0].label;
  return p.variants.find(v => v.label === lbl) || p.variants[0];
}
function cartKey(pid, vlbl) { return pid + "__" + vlbl; }
function cartCount() { return Object.values(ST.cart).reduce((s, v) => s + v, 0); }
function cartSubtotal() {
  return Object.entries(ST.cart).reduce((s, [key, qty]) => {
    const [pid, vlbl] = key.split("__");
    const p = ST.products.find(x => x.id === pid);
    if (!p) return s;
    const v = p.variants.find(x => x.label === vlbl) || p.variants[0];
    return s + v.price * qty;
  }, 0);
}
function cartItems() {
  return Object.entries(ST.cart).map(([key, qty]) => {
    const [pid, vlbl] = key.split("__");
    const p = ST.products.find(x => x.id === pid);
    if (!p || qty <= 0) return null;
    const v = p.variants.find(x => x.label === vlbl) || p.variants[0];
    return { ...p, variantLabel: vlbl, price: v.price, mrp: v.mrp, qty, cartKey: key };
  }).filter(Boolean);
}

function calcDelivFee(sub) {
  if (ST.delivType === "pickup")  return 0;
  if (ST.delivType === "instant") return sub >= ST.settings.instantMinOrder ? ST.settings.instantFee : -1;
  return sub >= ST.settings.freeDelivAt ? 0 : ST.settings.delivFee;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1100].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = f; o.type = "sine";
      g.gain.setValueAtTime(.25, ctx.currentTime + i * .15);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + i * .15 + .25);
      o.start(ctx.currentTime + i * .15);
      o.stop(ctx.currentTime + i * .15 + .25);
    });
  } catch(e) {}
}

function resizeImg(file, maxPx, quality, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxPx || h > maxPx) {
        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
        else        { w = Math.round(w * maxPx / h); h = maxPx; }
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

