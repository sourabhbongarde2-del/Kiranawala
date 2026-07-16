/* ================================================================
   KIRANA BASKET — admin-state.js
   Shared admin dashboard state (ADM) + small helpers.
   Load this FIRST among js/admin/*.js files.
   ================================================================ */

/* ================================================================
   BONGARDE MART – admin.js
   ================================================================ */

let ADM = {
  products: [],
  orders:   [],
  settings: { ...DEFAULT_SETTINGS },
  banners:  [],
  editId:   null,
  admImg:   "",
  admVars:  [],
  admBadge: "",
  admCat:   "grocery",
};

const isImg    = s => s && (s.startsWith("data:") || s.startsWith("http"));
const fmtDate  = ts => new Date(ts).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
const discPct  = (p, mrp) => mrp > p ? Math.round(((mrp - p) / mrp) * 100) : 0;

function resizeImg(file, maxPx, quality, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxPx || h > maxPx) { if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; } else { w = Math.round(w * maxPx / h); h = maxPx; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function showToast(msg, dur = 2800) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.style.animation = "none"; void t.offsetWidth;
  t.style.display = "block";
  t.style.animation = `toast-ani ${dur / 1000}s ease forwards`;
  setTimeout(() => t.style.display = "none", dur);
}

/* ════ INIT ════ */
