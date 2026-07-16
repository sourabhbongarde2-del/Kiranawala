/* ================================================================
   KIRANA BASKET — admin-products.js
   Product list, add/edit form, variants, CSV import, images.
   ================================================================ */

function admList() {
  const body = document.getElementById("adm-body");
  body.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <div style="flex:1;background:#fff;border-radius:12px;display:flex;align-items:center;gap:8px;padding:10px 14px;border:1.5px solid #eee">
        <span style="opacity:.5">🔍</span>
        <input id="adm-search" placeholder="Search products..." oninput="renderAdmList()" style="border:none;flex:1;font-size:13px;outline:none;font-family:'Poppins',sans-serif"/>
      </div>
      <button onclick="document.getElementById('csv-inp').click()" style="background:#f0faf0;border:1.5px solid #0c831f;border-radius:12px;padding:0 12px;font-size:12px;font-weight:700;color:#0c831f;cursor:pointer;white-space:nowrap">📂 CSV</button>
    </div>
    <input type="file" id="csv-inp" accept=".csv" style="display:none" onchange="importCSV(event)"/>
    <div style="font-size:10px;color:#aaa;margin-bottom:10px">CSV format: name,brand,unit,price,mrp,cat,badge</div>
    <div id="prod-list-body"></div>`;
  renderAdmList();
}

function renderAdmList() {
  const q = (document.getElementById("adm-search")?.value || "").toLowerCase();
  const list = ADM.products.filter(p => !q || p.name.toLowerCase().includes(q) || (p.brand||"").toLowerCase().includes(q));
  document.getElementById("prod-list-body").innerHTML = list.map(p => `
    <div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #f5f5f5">
      <div style="width:48px;height:48px;background:#f8f9f5;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
        ${isImg(p.img) ? `<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain"/>` : `<span style="font-size:26px">${p.img||"🛍️"}</span>`}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</div>
        <div style="font-size:10px;color:#aaa;margin-bottom:3px">${(p.variants||[]).map(v=>`${v.label}:₹${v.price}`).join(" · ")}</div>
        <div onclick="toggleStock('${p.id}')" style="display:inline-flex;align-items:center;gap:4px;background:${p.stock?"#f0faf0":"#fff0f0"};border:1px solid ${p.stock?"#0c831f":"#f44"};border-radius:20px;padding:2px 8px;cursor:pointer">
          <div style="width:7px;height:7px;border-radius:50%;background:${p.stock?"#0c831f":"#f44"}"></div>
          <span style="font-size:9px;font-weight:700;color:${p.stock?"#0c831f":"#f44"}">${p.stock?(p.stockQty!=null?`In Stock (${p.stockQty})`:"In Stock"):"Out of Stock"}</span>
        </div>
      </div>
      <button onclick="admEditProd('${p.id}')" style="background:#f0faf0;border:1px solid #d0ead0;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:700;color:#0c831f;cursor:pointer">✏️</button>
      <button onclick="admDelProd('${p.id}')" style="background:#fff0f0;border:1px solid #fdd;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:700;color:#cc0000;cursor:pointer">🗑️</button>
    </div>`).join("");
}

function toggleStock(id) {
  const p = ADM.products.find(x => x.id === id); if (!p) return;
  p.stock = !p.stock; dbSaveProduct(p); renderAdmList();
}
function admDelProd(id) {
  if (!confirm("Delete karein?")) return;
  ADM.products = ADM.products.filter(p => p.id !== id);
  dbDeleteProduct(id); updateSubLine(); renderAdmList();
}
function admEditProd(id) { ADM.editId = id; admTab("add"); }

function importCSV(e) {
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    const lines = ev.target.result.split("\n").slice(1).filter(l => l.trim());
    const newP  = lines.map((line, i) => {
      const [nm,br,un,pr,mr,ct,bg] = line.split(",").map(s => s.trim());
      return { id:"csv"+Date.now()+i, name:nm||"Product", brand:br||"", cat:ct||"grocery", img:"🛍️", badge:bg||"", stock:true, variants:[{label:un||"1 pc",price:+(pr||0),mrp:+(mr||pr||0)}] };
    });
    ADM.products = [...ADM.products, ...newP];
    dbSaveProducts(ADM.products); updateSubLine(); renderAdmList();
    showToast(`✅ ${newP.length} products import kiye!`);
  };
  r.readAsText(file); e.target.value = "";
}

/* ════ ADD / EDIT PRODUCT ════ */
function admAdd() {
  const p = ADM.editId ? ADM.products.find(x => x.id === ADM.editId) : null;
  ADM.admImg   = p && isImg(p.img) ? p.img : "";
  ADM.admVars  = p ? p.variants.map(v => ({...v})) : [];
  ADM.admBadge = p?.badge || "";
  ADM.admCat   = p?.cat || "grocery";
  window._admSelEmoji = p && !isImg(p.img) ? p.img : "🛍️";

  const body = document.getElementById("adm-body");
  body.innerHTML = `
    <!-- Image -->
    <div class="card">
      <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:10px">📸 Product Image</div>
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div onclick="document.getElementById('img-inp').click()" id="img-prev-box"
          style="width:90px;height:90px;background:${ADM.admImg?"#fff":"#f8f9f5"};border-radius:12px;border:2.5px dashed #0c831f;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;flex-shrink:0">
          ${ADM.admImg ? `<img src="${ADM.admImg}" style="width:100%;height:100%;object-fit:contain"/>` : `<div style="text-align:center"><div style="font-size:28px">📷</div><div style="font-size:9px;color:#0c831f;font-weight:700;margin-top:4px">Upload</div></div>`}
        </div>
        <div style="flex:1">
          <button onclick="document.getElementById('img-inp').click()" style="width:100%;background:#0c831f;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;font-size:13px;margin-bottom:8px;cursor:pointer">📂 Choose Image</button>
          <div style="font-size:11px;color:#aaa">JPG/PNG · Max 2MB (auto-resized)</div>
          <button id="rm-img-btn" onclick="removeAdmImg()" style="background:#fff0f0;border:none;border-radius:8px;padding:5px 10px;font-size:11px;color:#cc0000;margin-top:6px;font-weight:600;cursor:pointer;display:${ADM.admImg?"block":"none"}">✕ Remove</button>
        </div>
      </div>
      <input type="file" id="img-inp" accept="image/*" style="display:none" onchange="handleAdmImg(event)"/>
      <div id="emoji-row" style="${ADM.admImg?"display:none":""}">
        <div style="font-size:11px;color:#888;margin:10px 0 6px;font-weight:600">Ya emoji choose karein:</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${EMOJIS.map(e => `<button onclick="setAdmEmoji('${e}')" id="emj-${e}" style="font-size:20px;padding:4px 7px;border:2px solid ${(p&&p.img===e)?"#0c831f":"#eee"};border-radius:9px;background:${(p&&p.img===e)?"#f0faf0":"#fff"};cursor:pointer">${e}</button>`).join("")}
        </div>
      </div>
    </div>

    <!-- Basic Info -->
    <div class="card">
      <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:10px">📝 Product Info</div>
      <div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:#666;margin-bottom:4px">Product Name *</div><input id="adm-name" class="inp" value="${p?.name||""}"/></div>
      <div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:#666;margin-bottom:4px">Brand</div><input id="adm-brand" class="inp" value="${p?.brand||""}"/></div>
      <div style="margin-bottom:10px">
        <div style="font-size:11px;font-weight:700;color:#666;margin-bottom:6px">Category</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap" id="cat-pills">
          ${CATEGORIES.filter(c=>c.id!=="all").map(c=>`<button onclick="setAdmCat('${c.id}')" id="cp-${c.id}" style="border:1.5px solid ${ADM.admCat===c.id?"#0c831f":"#eee"};background:${ADM.admCat===c.id?"#f0faf0":"#fff"};border-radius:20px;padding:5px 11px;font-size:11px;font-weight:600;color:${ADM.admCat===c.id?"#0c831f":"#666"};cursor:pointer;font-family:'Poppins',sans-serif">${c.emoji} ${c.label}</button>`).join("")}
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:12px;font-weight:700">In Stock</div>
        <div class="toggle ${p===null||p?.stock?"on":""}" id="stock-tog" onclick="this.classList.toggle('on')"></div>
      </div>
      <div style="margin-top:10px">
        <div style="font-size:11px;font-weight:700;color:#666;margin-bottom:4px">Quantity track karein? (optional)</div>
        <input id="stock-qty" type="number" min="0" class="inp" placeholder="Khali chodo agar track nahi karna — sirf In Stock/Out toggle chalega"
          value="${(p && p.stockQty != null) ? p.stockQty : ""}"/>
        <div style="font-size:10px;color:#aaa;margin-top:3px">Bharne par: har order pe quantity apne aap kam hogi, 0 hone par "Out of Stock" automatically ho jayega.</div>
      </div>
    </div>

    <!-- Variants / Units -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:12px;font-weight:700;color:#555">📦 Unit / Variant (Sizes & Prices)</div>
        <button onclick="addVarRow()" style="background:#f0faf0;border:1px solid #0c831f;border-radius:8px;padding:5px 10px;font-size:12px;font-weight:700;color:#0c831f;cursor:pointer">+ Add</button>
      </div>
      <div style="font-size:11px;color:#888;margin-bottom:6px;font-weight:600">Quick add size:</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">
        ${UNIT_PRESETS.map(lbl=>`<button onclick="quickAddVar('${lbl}')" style="border:1px solid #eee;border-radius:16px;padding:3px 10px;font-size:10px;font-weight:600;color:#555;background:#fff;cursor:pointer;font-family:'Poppins',sans-serif">${lbl}</button>`).join("")}
        <button onclick="quickAddVar('Custom')" style="border:1px solid #0c831f;border-radius:16px;padding:3px 10px;font-size:10px;font-weight:600;color:#0c831f;background:#f0faf0;cursor:pointer;font-family:'Poppins',sans-serif">✏️ Custom</button>
      </div>
      <div id="variant-rows"></div>
      <div style="font-size:10px;color:#aaa;margin-top:6px">* Kam se kam 1 variant zaroori hai (label + price)</div>
    </div>

    <!-- Badge -->
    <div class="card">
      <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:10px">🏷️ Badge</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${["","FRESH","POPULAR","SALE"].map(b=>`<button onclick="ADM.admBadge='${b}';document.querySelectorAll('.badge-opt').forEach(x=>{x.style.borderColor='#eee';x.style.background='#fff'});this.style.borderColor='#0c831f';this.style.background='#f0faf0'" class="badge-opt" style="border:2px solid ${ADM.admBadge===b?"#0c831f":"#eee"};background:${ADM.admBadge===b?"#f0faf0":"#fff"};border-radius:20px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif">${b||"None"}</button>`).join("")}
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button onclick="saveAdmProduct()" style="flex:1;background:#0c831f;color:#fff;border:none;border-radius:12px;padding:14px;font-weight:800;font-size:15px;cursor:pointer">${ADM.editId?"✓ Update Product":"➕ Add Product"}</button>
      ${ADM.editId?`<button onclick="ADM.editId=null;admTab('list')" style="background:#f0f0f0;border:none;border-radius:12px;padding:14px 16px;font-weight:700;font-size:14px;color:#555;cursor:pointer">Cancel</button>`:""}
    </div>`;

  renderVarRows();
}

function renderVarRows() {
  const vr = document.getElementById("variant-rows"); if (!vr) return;
  vr.innerHTML = ADM.admVars.length ? ADM.admVars.map((v, i) => `
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
      <input value="${v.label}" oninput="ADM.admVars[${i}].label=this.value" placeholder="Label (e.g. 500 g)"
        style="flex:1.5;border:1.5px solid #eee;border-radius:8px;padding:8px 10px;font-size:12px;outline:none;font-family:'Poppins',sans-serif" onfocus="this.style.borderColor='#0c831f'" onblur="this.style.borderColor='#eee'"/>
      <input value="${v.price}" oninput="ADM.admVars[${i}].price=+this.value" type="number" placeholder="Price ₹"
        style="flex:1;border:1.5px solid #eee;border-radius:8px;padding:8px 10px;font-size:12px;outline:none;font-family:'Poppins',sans-serif" onfocus="this.style.borderColor='#0c831f'" onblur="this.style.borderColor='#eee'"/>
      <input value="${v.mrp||v.price}" oninput="ADM.admVars[${i}].mrp=+this.value" type="number" placeholder="MRP ₹"
        style="flex:1;border:1.5px solid #eee;border-radius:8px;padding:8px 10px;font-size:12px;outline:none;font-family:'Poppins',sans-serif" onfocus="this.style.borderColor='#0c831f'" onblur="this.style.borderColor='#eee'"/>
      <button onclick="ADM.admVars.splice(${i},1);renderVarRows()" style="background:#fff0f0;border:1px solid #fdd;border-radius:8px;padding:6px 9px;font-size:12px;color:#cc0000;cursor:pointer">✕</button>
    </div>`).join("")
    : `<div style="font-size:12px;color:#aaa;text-align:center;padding:10px">No variants yet — click + Add or use presets above</div>`;
}

function addVarRow()         { ADM.admVars.push({label:"",price:0,mrp:0}); renderVarRows(); }
function quickAddVar(lbl)    { if (lbl==="Custom") lbl=""; if (ADM.admVars.find(v=>v.label===lbl)&&lbl) return; ADM.admVars.push({label:lbl,price:0,mrp:0}); renderVarRows(); }
function setAdmEmoji(e)      {
  window._admSelEmoji = e;
  EMOJIS.forEach(em => { const b = document.getElementById("emj-"+em); if (b) { b.style.borderColor = em===e?"#0c831f":"#eee"; b.style.background = em===e?"#f0faf0":"#fff"; } });
}
function setAdmCat(id)       {
  ADM.admCat = id;
  CATEGORIES.filter(c=>c.id!=="all").forEach(c => { const b = document.getElementById("cp-"+c.id); if (!b) return; b.style.borderColor=c.id===id?"#0c831f":"#eee"; b.style.background=c.id===id?"#f0faf0":"#fff"; b.style.color=c.id===id?"#0c831f":"#666"; });
}
function handleAdmImg(e)     {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 2*1024*1024) { alert("2MB se bada nahi!"); return; }
  resizeImg(file, 400, .8, dataUrl => {
    ADM.admImg = dataUrl;
    const box = document.getElementById("img-prev-box");
    if (box) box.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:contain"/>`;
    const rm = document.getElementById("rm-img-btn"); if (rm) rm.style.display = "block";
    const er = document.getElementById("emoji-row");  if (er) er.style.display = "none";
  });
  e.target.value = "";
}
function removeAdmImg()      {
  ADM.admImg = "";
  const box = document.getElementById("img-prev-box");
  if (box) box.innerHTML = `<div style="text-align:center"><div style="font-size:28px">📷</div><div style="font-size:9px;color:#0c831f;font-weight:700;margin-top:4px">Upload</div></div>`;
  const rm = document.getElementById("rm-img-btn"); if (rm) rm.style.display = "none";
  const er = document.getElementById("emoji-row");  if (er) er.style.display = "block";
}

function saveAdmProduct() {
  const name = (document.getElementById("adm-name")?.value||"").trim();
  if (!name) { alert("Name zaroori hai!"); return; }
  const validVars = ADM.admVars.filter(v => v.label && v.price > 0);
  if (!validVars.length) { alert("Kam se kam ek variant chahiye (label + price)!"); return; }
  const imgFinal = ADM.admImg || (window._admSelEmoji || "🛍️");
  const qtyRaw = document.getElementById("stock-qty")?.value;
  const stockQty = (qtyRaw !== "" && qtyRaw != null) ? Math.max(0, parseInt(qtyRaw, 10) || 0) : null;
  const prod = {
    id:       ADM.editId || ("p" + Date.now()),
    name,
    brand:    document.getElementById("adm-brand")?.value || "",
    cat:      ADM.admCat,
    img:      imgFinal,
    badge:    ADM.admBadge,
    // If quantity tracking is on, "in stock" is derived from qty > 0.
    // Otherwise it's the plain manual toggle, same as before.
    stock:    stockQty != null ? stockQty > 0 : (document.getElementById("stock-tog")?.classList.contains("on") ?? true),
    stockQty: stockQty,
    variants: validVars,
  };
  if (ADM.editId) ADM.products = ADM.products.map(p => p.id === ADM.editId ? prod : p);
  else            ADM.products.push(prod);
  dbSaveProduct(prod); updateSubLine();
  ADM.editId = null; ADM.admImg = ""; ADM.admVars = [];
  showToast("✅ Product saved!"); admTab("list");
}

/* ════ BANNERS ════ */
