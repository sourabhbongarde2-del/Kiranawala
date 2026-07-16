/* ================================================================
   KIRANA BASKET — products.js
   Product card rendering + variant selection + product grid.
   ================================================================ */

/* ── PRODUCT CARD HTML ── */
function prodCardHTML(p) {
  const selLbl = ST.selVar[p.id] || p.variants[0].label;
  const selVar = p.variants.find(v => v.label === selLbl) || p.variants[0];
  const cKey   = cartKey(p.id, selLbl);
  const qty    = ST.cart[cKey] || 0;
  const d      = discPct(selVar.price, selVar.mrp);
  const wished = ST.wishlist.has(p.id);
  const ri     = isImg(p.img);

  const imgHtml = ri
    ? `<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain"/>`
    : `<span style="font-size:48px;line-height:1">${p.img || "🛍️"}</span>`;

  const varPills = p.variants.length > 1
    ? `<div class="var-pills">${p.variants.map(v =>
        `<span class="var-pill ${v.label === selLbl ? "sel" : ""}" onclick="selectVar('${p.id}','${v.label}')">${v.label}</span>`
      ).join("")}</div>`
    : `<div style="font-size:10px;color:#aaa;margin:2px 0">${selLbl}</div>`;

  const ctrl = !p.stock
    ? `<button class="oos-btn">${ST.lang === "en" ? "Out of Stock" : "स्टॉक संपला"}</button>`
    : qty === 0
      ? `<button class="add-btn" onclick="addCart('${p.id}','${selLbl}')">${ST.lang === "en" ? "ADD" : "घाला"}</button>`
      : `<div class="qty-ctrl"><button onclick="decCart('${p.id}','${selLbl}')">−</button><span>${qty}</span><button onclick="incCart('${p.id}','${selLbl}')">+</button></div>`;

  return `<div class="prod-card" id="card-${p.id}" style="opacity:${p.stock ? 1 : .65}">
    ${d > 0 ? `<div class="badge badge-disc">${d}% OFF</div>` : ""}
    ${p.badge ? `<div class="badge badge-type badge-${p.badge}" style="${d > 0 ? "right:5px" : "right:28px"}">${p.badge}</div>` : ""}
    <button class="wish-btn" onclick="toggleWish('${p.id}')">${wished ? "❤️" : "🤍"}</button>
    <div class="prod-img">${imgHtml}</div>
    <div class="prod-body">
      <div style="font-size:12px;font-weight:700;line-height:1.3;min-height:28px">${p.name}</div>
      <div style="font-size:10px;color:#888">${p.brand}</div>
      ${varPills}
      <div style="display:flex;align-items:baseline;gap:5px;margin-top:auto;padding-top:3px">
        <span style="font-size:14px;font-weight:900">₹${selVar.price}</span>
        ${selVar.mrp > selVar.price ? `<span style="font-size:10px;color:#bbb;text-decoration:line-through">₹${selVar.mrp}</span>` : ""}
      </div>
      <div style="margin-top:4px" id="ctrl-${p.id}">${ctrl}</div>
    </div>
  </div>`;
}

function selectVar(pid, lbl) {
  ST.selVar[pid] = lbl;
  LS("selVar", ST.selVar);
  const el = document.getElementById("card-" + pid);
  if (el) el.outerHTML = prodCardHTML(ST.products.find(x => x.id === pid));
}

/* ── RENDER GRID ── */
function renderProducts() {
  const q    = (document.getElementById("search-inp")?.value || "").toLowerCase();
  const sort = document.getElementById("sort-sel")?.value || "default";

  let list = ST.products.filter(p => {
    const cOk = ST.curCat === "all" || p.cat === ST.curCat;
    const sOk = !q || p.name.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q);
    return cOk && sOk;
  });

  if (sort === "price_asc")  list = [...list].sort((a, b) => a.variants[0].price - b.variants[0].price);
  if (sort === "price_desc") list = [...list].sort((a, b) => b.variants[0].price - a.variants[0].price);
  if (sort === "discount")   list = [...list].sort((a, b) => discPct(b.variants[0].price, b.variants[0].mrp) - discPct(a.variants[0].price, a.variants[0].mrp));
  if (sort === "name")       list = [...list].sort((a, b) => a.name.localeCompare(b.name));

  const catObj = CATEGORIES.find(c => c.id === ST.curCat);
  const titleEl = document.getElementById("grid-title");
  if (titleEl) titleEl.textContent = q ? `🔍 "${q}" (${list.length})` : `${catObj.emoji} ${ST.lang === "mr" ? catObj.mr : catObj.label} (${list.length})`;

  const grid = document.getElementById("product-grid");
  if (!list.length) {
    grid.style.gridTemplateColumns = "1fr";
    grid.innerHTML = `<div style="text-align:center;padding:50px 20px;color:#bbb"><div style="font-size:56px">😕</div><div style="font-size:16px;font-weight:700;margin-top:10px;color:#888">Koi product nahi mila</div></div>`;
  } else {
    grid.style.gridTemplateColumns = "1fr 1fr";
    grid.innerHTML = list.map(prodCardHTML).join("");
  }

  // Recently viewed
  const rw = document.getElementById("recent-wrap");
  if (rw) {
    if (ST.recent.length > 0 && !q) {
      rw.style.display = "block";
      document.getElementById("recent-row").innerHTML = ST.recent.map(p =>
        `<div onclick="setCat('${p.cat}')" style="display:flex;flex-direction:column;align-items:center;gap:4px;background:#f8f9f5;border-radius:12px;padding:8px 10px;flex-shrink:0;cursor:pointer;min-width:64px;border:1px solid #f0f0f0">
          <span style="font-size:${isImg(p.img) ? 0 : 22}px;line-height:1">${isImg(p.img) ? `<img src="${p.img}" style="width:28px;height:28px;object-fit:contain"/>` : (p.img || "🛍️")}</span>
          <span style="font-size:9px;font-weight:600;color:#aaa;text-align:center;max-width:56px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</span>
        </div>`
      ).join("");
    } else {
      rw.style.display = "none";
    }
  }
}

