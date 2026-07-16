/* ================================================================
   KIRANA BASKET — banners-categories.js
   Promo banner carousel + category filter bar + search box.
   ================================================================ */

/* ── BANNERS (ads system) ── */
function _isBannerLive(b, now = Date.now()) {
  if (b.active === false) return false;
  if (b.startAt && now < new Date(b.startAt).getTime()) return false;
  if (b.endAt   && now > new Date(b.endAt).getTime())   return false;
  return true;
}
function bannerTap(link) {
  if (!link) return;
  const cat = CATEGORIES.find(c => c.id === link || c.name === link);
  if (cat) { setCat(cat.id); document.getElementById("prod-grid")?.scrollIntoView({ behavior: "smooth" }); return; }
  if (/^https?:\/\//.test(link)) window.open(link, "_blank");
}

function buildBanners() {
  const wrap = document.getElementById("banner-slides");
  const dots = document.getElementById("banner-dots");
  const liveBanners = (ST.banners || []).filter(b => _isBannerLive(b));
  if (!wrap || !liveBanners.length) { if (wrap) wrap.innerHTML = ""; if (dots) dots.innerHTML = ""; return; }
  ST._liveBanners = liveBanners;

  wrap.innerHTML = liveBanners.map((b, i) => {
    const bg = b.img ? `background:url('${b.img}') center/cover no-repeat` : `background:${b.bg || "#0c831f"}`;
    return `<div style="position:absolute;inset:0;${bg};padding:14px 16px;display:flex;align-items:center;opacity:${i === 0 ? 1 : 0};transition:opacity .5s;${b.link ? "cursor:pointer" : ""}" class="bnr-slide" ${b.link ? `onclick="bannerTap('${b.link.replace(/'/g, "\\'")}')"` : ""}>
      <div style="${b.img ? "background:rgba(0,0,0,.45);border-radius:10px;padding:8px 12px" : ""}">
        <div style="font-size:14px;font-weight:900;color:#fff">${b.title || ""}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.88);margin-top:2px">${b.sub || ""}</div>
      </div>
    </div>`;
  }).join("");

  dots.innerHTML = liveBanners.map((_, i) =>
    `<div onclick="goBanner(${i})" style="width:${i === 0 ? 20 : 6}px;height:6px;background:${i === 0 ? "#fff" : "rgba(255,255,255,.4)"};border-radius:3px;transition:all .3s;cursor:pointer"></div>`
  ).join("");

  ST.bannerIdx = 0;
  clearInterval(ST.bTimer);
  ST.bTimer = setInterval(() => goBanner((ST.bannerIdx + 1) % liveBanners.length), 3500);
}
function goBanner(i) {
  document.querySelectorAll(".bnr-slide").forEach((el, j) => el.style.opacity = j === i ? "1" : "0");
  document.querySelectorAll("#banner-dots div").forEach((d, j) => {
    d.style.width = j === i ? "20px" : "6px";
    d.style.background = j === i ? "#fff" : "rgba(255,255,255,.4)";
  });
  ST.bannerIdx = i;
}

/* ── CATEGORIES ── */
function buildCats() {
  const row = document.getElementById("cat-row");
  if (!row) return;
  row.innerHTML = CATEGORIES.map(c =>
    `<button onclick="setCat('${c.id}')" style="display:flex;flex-direction:column;align-items:center;gap:3px;background:${ST.curCat === c.id ? "#f0faf0" : "#f8f8f8"};border:2px solid ${ST.curCat === c.id ? "#0c831f" : "transparent"};border-radius:14px;padding:7px 10px;flex-shrink:0;min-width:58px;font-family:'Poppins',sans-serif">
      <span style="font-size:20px">${c.emoji}</span>
      <span style="font-size:9px;font-weight:${ST.curCat === c.id ? 800 : 500};color:${ST.curCat === c.id ? "#0c831f" : "#666"};white-space:nowrap">${ST.lang === "mr" ? c.mr : c.label}</span>
    </button>`
  ).join("");
}
function setCat(id) { ST.curCat = id; buildCats(); renderProducts(); }

/* ── SEARCH ── */
function onSearch() {
  const v = document.getElementById("search-inp").value;
  document.getElementById("clear-search").style.display = v ? "block" : "none";
  ["banner-wrap", "coupon-strip", "cat-row", "sort-bar", "recent-wrap"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = v ? "none" : "";
  });
  renderProducts();
}
function clearSearch() { document.getElementById("search-inp").value = ""; onSearch(); }

