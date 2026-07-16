/* ================================================================
   KIRANA BASKET — admin-core.js
   Dashboard init, tab switching, dashboard stats view.
   ================================================================ */

async function adminInit() {
  await dbInit();

  const dbProds = await dbLoadProducts();
  ADM.products = dbProds || INITIAL_PRODUCTS;
  if (!dbProds) dbSaveProducts(ADM.products);

  ADM.orders = await dbLoadOrders();

  const dbSett = await dbLoadSettings();
  ADM.settings = dbSett || { ...DEFAULT_SETTINGS };
  if (!dbSett) dbSaveSettings(ADM.settings);

  const dbBann = await dbLoadBanners();
  ADM.banners = dbBann || [...DEFAULT_BANNERS];
  if (!dbBann) dbSaveBanners(ADM.banners);

  updateSubLine();
  admTab("dash");

  // Real-time listeners
  dbListenProducts(p => { ADM.products = p; updateSubLine(); if (document.getElementById("adm-body").dataset.tab === "list") admList(); });
  dbListenBanners(b  => { ADM.banners  = b; });
  dbListenSettings(s => { ADM.settings = s; });
}

function updateSubLine() {
  const rev = ADM.orders.reduce((s, o) => s + (o.total || 0), 0);
  const el  = document.getElementById("adm-sub");
  if (el) el.textContent = `${ADM.products.length} products · ${ADM.orders.length} orders · ₹${rev.toLocaleString()} revenue ${dbIsFirebase() ? "· 🔥 Firebase" : "· 💾 Local"}`;
}

/* ════ TABS ════ */
function admTab(tab) {
  document.querySelectorAll(".adm-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  const body = document.getElementById("adm-body");
  body.dataset.tab = tab;
  if (tab === "dash")     admDash();
  if (tab === "list")     admList();
  if (tab === "add")      admAdd();
  if (tab === "banners")  admBanners();
  if (tab === "orders")   admOrders();
  if (tab === "settings") admSettings();
}

/* ════ DASHBOARD ════ */
function admDash() {
  const body = document.getElementById("adm-body");
  const rev  = ADM.orders.reduce((s, o) => s + (o.total || 0), 0);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekOrders = ADM.orders.filter(o => o.ts >= weekAgo);
  const weekRev = weekOrders.reduce((s, o) => s + (o.total || 0), 0);
  const pendingPay = ADM.orders.filter(o => !o.paymentVerified && o.status !== "cancelled").length;
  const statusCounts = ORDER_STATUS_FLOW.reduce((a, s) => ({ ...a, [s]: ADM.orders.filter(o => (o.status || "pending") === s).length }), {});
  const repeatCustomers = Object.entries(
    ADM.orders.reduce((a, o) => { if (o.phone) a[o.phone] = (a[o.phone] || 0) + 1; return a; }, {})
  ).filter(([, c]) => c > 1).length;

  const topMap = ADM.orders.flatMap(o => o.cart || []).reduce((a, i) => ({ ...a, [i.name]: (a[i.name] || 0) + i.qty }), {});
  const top    = Object.entries(topMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      ${[["📦","Total Orders",ADM.orders.length,"#3b82f6"],["💰","Total Revenue","₹"+rev.toLocaleString(),"#0c831f"],["📅","This Week","₹"+weekRev.toLocaleString()+" ("+weekOrders.length+")","#7c3aed"],["👥","Repeat Customers",repeatCustomers,"#e67e00"]]
        .map(([ic,lbl,val,col]) => `<div class="card" style="margin:0"><div style="font-size:24px;margin-bottom:4px">${ic}</div><div style="font-size:20px;font-weight:900;color:${col}">${val}</div><div style="font-size:11px;color:#aaa;margin-top:2px">${lbl}</div></div>`).join("")}
    </div>
    ${pendingPay > 0 ? `<div style="background:#fff8e1;border-radius:12px;padding:12px 14px;border:1px solid #ffe0b2;margin-bottom:12px;cursor:pointer" onclick="admTab('orders')"><div style="font-size:12px;font-weight:800;color:#996b00">⏳ ${pendingPay} order(s) ka payment verify nahi hua abhi tak</div></div>` : ""}
    ${!dbIsFirebase() ? `<div style="background:#fff8e1;border-radius:12px;padding:12px 14px;border:1px solid #ffe0b2;margin-bottom:12px"><div style="font-size:12px;font-weight:800;color:#e65100;margin-bottom:4px">⚠️ Firebase not connected</div><div style="font-size:11px;color:#888">Product changes won't sync to other browsers. Fill in FIREBASE_CONFIG in config.js.</div></div>` : ""}

    <div class="card" style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:800;margin-bottom:10px">📋 Order Status</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${ORDER_STATUS_FLOW.map(s => `<span style="background:${ORDER_STATUS_LABEL[s].color}22;color:${ORDER_STATUS_LABEL[s].color};border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700">${ORDER_STATUS_LABEL[s].text}: ${statusCounts[s]}</span>`).join("")}
      </div>
    </div>

    <div class="card" style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:800;margin-bottom:10px">🏆 Top Selling</div>
      ${top.length ? top.map(([nm,qty],i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f5f5f5"><span style="font-size:13px;font-weight:600"><span style="color:#aaa;font-size:11px;margin-right:6px">#${i+1}</span>${nm}</span><span style="background:#f0faf0;color:#0c831f;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">${qty} sold</span></div>`).join("")
        : `<div style="color:#aaa;font-size:13px;text-align:center;padding:20px 0">Orders aane ke baad dikhenga</div>`}
    </div>
    <div class="card">
      <div style="font-size:13px;font-weight:800;margin-bottom:10px">📅 Recent Orders</div>
      ${ADM.orders.length ? [...ADM.orders].reverse().slice(0,4).map(o=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f5f5f5"><div><div style="font-size:12px;font-weight:700">#${o.id.slice(-8)} · ${o.name||"Customer"}</div><div style="font-size:10px;color:#aaa">${fmtDate(o.ts)}</div></div><div style="font-weight:900;color:#0c831f">₹${o.total}</div></div>`).join("")
        : `<div style="color:#aaa;font-size:13px;text-align:center;padding:20px 0">Koi order nahi abhi</div>`}
    </div>
    <button onclick="admShowErrorLog()" style="width:100%;margin-top:12px;background:#f8f9f5;border:1px solid #eee;border-radius:10px;padding:10px;font-size:12px;font-weight:700;color:#888;cursor:pointer">🐞 Technical Error Log Dekho</button>`;
}

async function admShowErrorLog() {
  const body = document.getElementById("adm-body");
  body.innerHTML = `<div style="text-align:center;padding:30px;color:#aaa">Loading...</div>`;
  const errors = await dbLoadErrorLog();
  body.innerHTML = `
    <button onclick="admDash()" style="background:none;border:none;color:#0c831f;font-weight:700;font-size:13px;cursor:pointer;margin-bottom:10px">← Dashboard</button>
    <div style="font-size:13px;font-weight:800;margin-bottom:10px">🐞 Recent Errors (customer devices se, last 50)</div>
    ${errors.length === 0
      ? `<div style="text-align:center;padding:30px;color:#aaa">Koi error report nahi hua — accha sign hai!</div>`
      : errors.map(e => `<div class="card" style="margin-bottom:8px">
          <div style="font-size:11px;color:#aaa;margin-bottom:4px">${fmtDate(e.ts)} · ${e.source||"unknown"}</div>
          <div style="font-size:12px;color:#cc0000;font-family:monospace;word-break:break-word">${e.message||"(no message)"}</div>
        </div>`).join("")}`;
}

/* ════ PRODUCT LIST ════ */
