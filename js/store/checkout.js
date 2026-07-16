/* ================================================================
   KIRANA BASKET — checkout.js
   Cart sheet, delivery/payment options, coupons, place order,
   receipt generation, WhatsApp share, admin-hash shortcut.
   ================================================================ */

function buildCartSheet() {
  ST.delivType = "delivery"; ST.payMode = "cod"; ST.couponDisc = 0;
  const items = cartItems();
  const body = document.getElementById("cart-body");

  if (!items.length) {
    body.innerHTML = `<div style="text-align:center;padding:50px 20px;color:#aaa"><div style="font-size:64px">🛒</div><div style="font-size:18px;font-weight:700;margin-top:12px;color:#555">Cart is empty!</div><button onclick="closeCart()" style="background:#0c831f;color:#fff;border:none;border-radius:12px;padding:12px 28px;font-weight:700;font-size:14px;margin-top:16px;cursor:pointer">Browse Products →</button></div>`;
    return;
  }

  body.innerHTML = `
    <!-- Delivery Type -->
    <div class="card">
      <div style="font-size:13px;font-weight:800;margin-bottom:10px">🚚 Choose Delivery Type</div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <button class="deliv-opt sel" id="dopt-delivery" onclick="setDelivType('delivery')">
          <div style="font-size:18px">🏠</div>
          <div class="dopt-title">Home Delivery</div>
          <div style="font-size:9px;color:#888;margin-top:2px" id="std-fee-lbl">₹${ST.settings.delivFee} / Free ₹${ST.settings.freeDelivAt}+</div>
        </button>
        <button class="deliv-opt" id="dopt-pickup" onclick="setDelivType('pickup')">
          <div style="font-size:18px">🏪</div>
          <div class="dopt-title">Self Pickup</div>
          <div style="font-size:9px;color:#888;margin-top:2px">Free · ${ST.settings.pickupEta}</div>
        </button>
        <button class="deliv-opt" id="dopt-instant" onclick="setDelivType('instant')">
          <div style="font-size:18px">⚡</div>
          <div class="dopt-title">Instant</div>
          <div style="font-size:9px;color:#888;margin-top:2px">+₹${ST.settings.instantFee} · 2 hrs</div>
        </button>
      </div>
      <div id="deliv-note" style="background:#f0faf0;border-radius:8px;padding:8px 12px;font-size:11px;color:#0c831f;font-weight:600"></div>
    </div>

    <!-- Items -->
    <div class="card">
      <div style="font-size:13px;font-weight:800;margin-bottom:10px">🛍️ Items (${items.reduce((s, i) => s + i.qty, 0)})</div>
      ${items.map(it => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f5f5f5">
          <div style="width:48px;height:48px;background:#f8f9f5;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
            ${isImg(it.img) ? `<img src="${it.img}" alt="" style="width:100%;height:100%;object-fit:contain"/>` : `<span style="font-size:26px">${it.img || "🛍️"}</span>`}
          </div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700">${it.name}</div>
            <div style="font-size:11px;color:#aaa">${it.variantLabel}</div>
            <div style="font-size:12px;font-weight:600">₹${it.price} × ${it.qty} = <b>₹${it.price * it.qty}</b></div>
          </div>
          <div class="qty-ctrl" style="flex-shrink:0">
            <button onclick="cartDrawerChg('${it.cartKey}',-1)">−</button>
            <span>${it.qty}</span>
            <button onclick="cartDrawerChg('${it.cartKey}',1)">+</button>
          </div>
        </div>`).join("")}
    </div>

    <!-- Payment -->
    <div class="card">
      <div style="font-size:13px;font-weight:800;margin-bottom:10px">💳 Payment Mode</div>
      <div style="display:flex;gap:8px">
        <button id="pbtn-cod" onclick="setPayMode('cod')" style="flex:1;border:2px solid #0c831f;background:#f0faf0;border-radius:10px;padding:10px 6px;font-size:12px;font-weight:700;color:#0c831f;font-family:'Poppins',sans-serif">💵 Cash on Delivery</button>
        <button id="pbtn-upi" onclick="setPayMode('upi')" style="flex:1;border:2px solid #eee;background:#fff;border-radius:10px;padding:10px 6px;font-size:12px;font-weight:700;color:#666;font-family:'Poppins',sans-serif">📱 UPI / QR Pay</button>
      </div>
      <div id="upi-qr-wrap" style="display:none;text-align:center;margin-top:12px">
        <img id="upi-qr-img" src="" alt="UPI QR" style="width:160px;height:160px;border-radius:12px;border:2px solid #eee;margin:0 auto"/>
        <div style="font-size:11px;color:#aaa;margin-top:6px">Scan to pay</div>
        <div style="font-size:13px;font-weight:800;color:#0c831f;margin-top:2px">${ST.settings.upiId}</div>
      </div>
    </div>

    <!-- Details -->
    <div class="card">
      <div style="font-size:13px;font-weight:800;margin-bottom:10px">📝 Your Details</div>
      <input id="c-name"  class="inp" placeholder="Your Name"    style="margin-bottom:8px"/>
      <input id="c-phone" class="inp" type="tel" placeholder="Phone Number" style="margin-bottom:8px"/>
      <input id="c-addr"  class="inp" placeholder="Full Address (skip for pickup)"/>
    </div>

    <!-- Coupon -->
    <div class="card">
      <div style="font-size:13px;font-weight:800;margin-bottom:10px">🏷️ Coupon Code</div>
      <div style="display:flex;gap:8px">
        <input id="coupon-inp" class="inp" placeholder="Enter code" oninput="this.value=this.value.toUpperCase()" style="flex:1"/>
        <button onclick="applyCoupon()" style="background:#0c831f;color:#fff;border:none;border-radius:10px;padding:10px 18px;font-weight:700;font-size:13px;cursor:pointer">Apply</button>
      </div>
      <div id="coupon-msg" style="font-size:12px;margin-top:8px;min-height:18px"></div>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        ${Object.entries(COUPONS).map(([code]) =>
          `<div onclick="document.getElementById('coupon-inp').value='${code}'" style="background:#f0faf0;border:1.5px dashed #0c831f;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;color:#0c831f;cursor:pointer">🏷 ${code}</div>`
        ).join("")}
      </div>
    </div>

    <!-- Bill -->
    <div class="card" id="bill-card"></div>
    <div id="min-warn" style="display:none;background:#fff8e1;border-radius:10px;padding:10px 14px;font-size:12px;color:#e65100;font-weight:600;border:1px solid #ffe0b2"></div>
    <button id="place-btn" onclick="placeOrder()" style="width:100%;background:#0c831f;color:#fff;border:none;border-radius:14px;padding:15px;font-weight:800;font-size:15px;cursor:pointer;margin-bottom:20px">🚀 Place Order</button>`;

  updateDelivNote();
  updateBill();
}

function setDelivType(t) {
  const items = cartItems();
  const sub   = items.reduce((s, i) => s + i.price * i.qty, 0);
  if (t === "instant" && sub < ST.settings.instantMinOrder) {
    showToast(`⚡ Instant ke liye ₹${ST.settings.instantMinOrder}+ chahiye`); return;
  }
  ST.delivType = t;
  ["delivery", "pickup", "instant"].forEach(v => {
    const b = document.getElementById("dopt-" + v); if (!b) return;
    b.classList.toggle("sel", v === t);
  });
  const addr = document.getElementById("c-addr");
  if (addr) addr.placeholder = t === "pickup" ? "Not needed for self pickup" : "Full delivery address";
  updateDelivNote(); updateBill();
}

function updateDelivNote() {
  const el  = document.getElementById("deliv-note"); if (!el) return;
  const sub = cartItems().reduce((s, i) => s + i.price * i.qty, 0);
  if (ST.delivType === "pickup")  el.textContent = `🏪 Pickup from store · Ready in ${ST.settings.pickupEta}`;
  else if (ST.delivType === "instant") el.textContent = `⚡ Instant delivery in ~2 hours · ₹${ST.settings.instantFee} charge`;
  else if (sub >= ST.settings.freeDelivAt) el.textContent = `🎉 FREE delivery! · Estimated arrival ${ST.settings.delivEta}`;
  else el.textContent = `🚚 Delivery ${ST.settings.delivEta} · ₹${ST.settings.delivFee} fee · Free on ₹${ST.settings.freeDelivAt}+`;
}

function setPayMode(m) {
  ST.payMode = m;
  ["cod", "upi"].forEach(v => {
    const b = document.getElementById("pbtn-" + v); if (!b) return;
    b.style.borderColor = v === m ? "#0c831f" : "#eee";
    b.style.background  = v === m ? "#f0faf0" : "#fff";
    b.style.color       = v === m ? "#0c831f" : "#666";
  });
  const qrWrap = document.getElementById("upi-qr-wrap");
  if (qrWrap) {
    qrWrap.style.display = m === "upi" ? "block" : "none";
    if (m === "upi") {
      const sub = cartItems().reduce((s, i) => s + i.price * i.qty, 0);
      const fee = Math.max(0, calcDelivFee(sub));
      const tot = sub - ST.couponDisc + fee;
      const qrImg = document.getElementById("upi-qr-img");
      if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${ST.settings.upiId}&pn=${ST.settings.upiName}&am=${tot}&cu=INR`)}`;
    }
  }
}

function applyCoupon() {
  const code = (document.getElementById("coupon-inp")?.value || "").toUpperCase();
  const c    = COUPONS[code];
  const sub  = cartItems().reduce((s, i) => s + i.price * i.qty, 0);
  const msg  = document.getElementById("coupon-msg");
  if (!c) { if (msg) { msg.style.color = "#f44"; msg.textContent = "❌ Invalid coupon"; } ST.couponDisc = 0; }
  else {
    const d = c.type === "percent" ? Math.round(sub * c.val / 100) : c.val;
    ST.couponDisc = d;
    if (msg) { msg.style.color = "#0c831f"; msg.textContent = `✅ ${c.desc} applied! Saved ₹${d}`; }
  }
  updateBill();
}

function cartDrawerChg(key, delta) {
  ST.cart[key] = (ST.cart[key] || 0) + delta;
  if (ST.cart[key] <= 0) delete ST.cart[key];
  LS("cart", ST.cart); updateCartUI();
  if (!cartCount()) { closeCart(); return; }
  buildCartSheet();
}

function updateBill() {
  const items  = cartItems();
  const sub    = items.reduce((s, i) => s + i.price * i.qty, 0);
  const fee    = calcDelivFee(sub);
  const aFee   = Math.max(0, fee);
  const total  = sub - ST.couponDisc + aFee;
  const bc     = document.getElementById("bill-card");
  const rows   = [
    ["Item Total",     "₹" + sub],
    ["Delivery",       ST.delivType === "pickup" ? "Free (Pickup)" : fee === 0 ? "FREE 🎉" : "₹" + fee],
    ...(ST.couponDisc > 0 ? [["Coupon Discount", "-₹" + ST.couponDisc]] : []),
  ];
  if (bc) bc.innerHTML = `
    <div style="font-size:13px;font-weight:800;margin-bottom:10px">💰 Bill Details</div>
    ${rows.map(([k, v]) => `<div class="receipt-row"><span>${k}</span><span style="font-weight:600;color:${k === "Coupon Discount" ? "#0c831f" : "#111"}">${v}</span></div>`).join("")}
    <div class="receipt-total"><span>To Pay</span><span>₹${total}</span></div>`;
  const warn = document.getElementById("min-warn");
  const pb   = document.getElementById("place-btn");
  if (warn) { const ok = sub >= ST.settings.minOrder; warn.style.display = ok ? "none" : "block"; warn.textContent = `⚠️ Min order ₹${ST.settings.minOrder} chahiye! ₹${ST.settings.minOrder - sub} aur add karein`; }
  if (pb)   { pb.style.background = sub >= ST.settings.minOrder ? "#0c831f" : "#ccc"; pb.textContent = `🚀 Place Order · ₹${total}`; }
  window._billTotal = total;
}

/* ════════════════════════════════════════════════════════════
   PLACE ORDER
════════════════════════════════════════════════════════════ */
let lastOrder = null;

function placeOrder() {
  const items = cartItems();
  const sub   = items.reduce((s, i) => s + i.price * i.qty, 0);
  if (sub < ST.settings.minOrder) { showToast(`⚠️ Min order ₹${ST.settings.minOrder} chahiye!`); return; }
  const name  = (document.getElementById("c-name")?.value || "").trim();
  const phone = (document.getElementById("c-phone")?.value || "").trim();
  const addr  = (document.getElementById("c-addr")?.value || "").trim();
  const fee   = Math.max(0, calcDelivFee(sub));
  const total = window._billTotal || sub;

  const order = {
    id:         "ORD" + Date.now(),
    ts:         Date.now(),
    cart:       items,
    sub, fee,
    discount:   ST.couponDisc,
    total,
    delivType:  ST.delivType,
    payMode:    ST.payMode,
    name, phone,
    address:    addr,
    status:          "pending",   // pending → packed → out_for_delivery → delivered  (or cancelled)
    paymentVerified: false,       // admin manually confirms after checking UPI/cash received
    deliveryPerson:  "",
    statusHistory:   [{ status: "pending", ts: Date.now() }],
  };

  // Save — writes this order as its own document (safe even if many
  // customers checkout at the same moment; never touches other orders).
  dbAddOrder(order);
  // Best-effort stock decrement for any products with quantity tracking on.
  dbDecrementStock(items);

  playBeep();
  lastOrder = order;

  // WhatsApp message
  let msg = `🛒 *${ST.settings.storeName}*\n`;
  msg += `Order #${order.id.slice(-8)} | ${fmtDate(order.ts)}\n\n`;
  msg += `👤 ${name || "Customer"} | 📞 ${phone || "N/A"}\n`;
  if (ST.delivType === "pickup") msg += `🏪 SELF PICKUP\n`;
  else msg += `📍 ${addr || "Belewadi Masa, 416218"}\n🚚 ${ST.delivType === "instant" ? "⚡ Instant (~2 hrs)" : `Home Delivery (${ST.settings.delivEta})`}\n`;
  msg += `💳 ${order.payMode === "upi" ? "UPI Payment" : "Cash on Delivery"}\n\n`;
  msg += `*ITEMS:*\n`;
  items.forEach(p => { msg += `• ${p.name} (${p.variantLabel}) × ${p.qty} = ₹${p.price * p.qty}\n`; });
  msg += `\n━━━━━━━━━━━━\nSubtotal: ₹${sub}`;
  if (fee > 0)            msg += `\nDelivery: ₹${fee}`;
  if (ST.couponDisc > 0)  msg += `\nDiscount: -₹${ST.couponDisc}`;
  msg += `\n*TOTAL: ₹${total}*`;

  window.open(`https://wa.me/${ST.settings.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");

  // Clear cart
  ST.cart = {}; LS("cart", ST.cart); updateCartUI();
  closeCart();
  showReceiptModal(order);
}

/* ════════════════════════════════════════════════════════════
   RECEIPT
════════════════════════════════════════════════════════════ */
function buildReceiptHTML(o) {
  const s = ST.settings;
  const delivLabel = o.delivType === "pickup" ? "🏪 Self Pickup" : o.delivType === "instant" ? "⚡ Instant Delivery" : `🚚 Home Delivery (${s.delivEta})`;
  const payLabel   = o.payMode === "upi" ? "📱 UPI Payment" : "💵 Cash on Delivery";
  return `
  <div style="background:linear-gradient(135deg,#0c831f,#056b16);padding:22px 20px;text-align:center">
    <div style="font-size:30px;margin-bottom:6px">🛒</div>
    <div style="font-size:18px;font-weight:900;color:#fff">${s.storeName}</div>
    <div style="font-size:11px;color:rgba(255,255,255,.85);margin-top:3px">${s.storeAddr}</div>
    <div style="font-size:11px;color:rgba(255,255,255,.8)">📞 ${s.storePhone}</div>
  </div>
  <div style="padding:16px 20px;background:#fff">
    <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:2px dashed #f0f0f0">
      <div><div style="font-size:10px;color:#aaa;font-weight:700">ORDER ID</div><div style="font-size:15px;font-weight:900">#${o.id.slice(-8)}</div></div>
      <div style="text-align:right"><div style="font-size:10px;color:#aaa;font-weight:700">DATE</div><div style="font-size:12px;font-weight:700">${fmtDate(o.ts)}</div></div>
    </div>
    <div style="background:#f8f9f5;border-radius:10px;padding:10px 12px;margin-bottom:12px">
      <div class="receipt-row"><span style="font-weight:600">👤 Customer</span><span style="font-weight:700">${o.name || "Customer"}</span></div>
      <div class="receipt-row"><span style="font-weight:600">📞 Phone</span><span style="font-weight:700">${o.phone || "N/A"}</span></div>
      ${o.delivType !== "pickup" ? `<div class="receipt-row"><span style="font-weight:600">📍 Address</span><span style="font-weight:700;max-width:55%;text-align:right">${o.address || "Belewadi Masa"}</span></div>` : ""}
      <div class="receipt-row"><span style="font-weight:600">🚚 Delivery</span><span style="font-weight:700">${delivLabel}</span></div>
      <div class="receipt-row"><span style="font-weight:600">💳 Payment</span><span style="font-weight:700">${payLabel}</span></div>
    </div>
    <div style="font-size:12px;font-weight:800;color:#111;margin-bottom:8px">ITEMS</div>
    ${o.cart.map(it => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f5f5f5">
        <div style="flex:1"><div style="font-size:12px;font-weight:700">${it.name}</div><div style="font-size:10px;color:#aaa">${it.variantLabel} × ${it.qty}</div></div>
        <div style="font-size:13px;font-weight:800">₹${it.price * it.qty}</div>
      </div>`).join("")}
    <div style="margin-top:12px;padding-top:8px;border-top:2px dashed #f0f0f0">
      <div class="receipt-row"><span>Subtotal</span><span>₹${o.sub}</span></div>
      ${o.fee > 0 ? `<div class="receipt-row"><span>Delivery</span><span>₹${o.fee}</span></div>` : ""}
      ${o.discount > 0 ? `<div class="receipt-row" style="color:#0c831f"><span>Discount</span><span>-₹${o.discount}</span></div>` : ""}
      <div class="receipt-total"><span>TOTAL</span><span>₹${o.total}</span></div>
    </div>
    <div style="text-align:center;margin-top:16px;padding-top:12px;border-top:1px dashed #eee">
      <div style="font-size:13px;font-weight:700;color:#0c831f">Thank you for shopping! 🙏</div>
      <div style="font-size:11px;color:#aaa;margin-top:4px">${s.storeName} – ${s.storeAddr}</div>
    </div>
  </div>`;
}

function showReceiptModal(order) {
  const rc = document.getElementById("receipt-content");
  if (rc) rc.innerHTML = buildReceiptHTML(order);
  document.getElementById("receipt-overlay").style.display = "flex";
}
function closeReceiptModal() { document.getElementById("receipt-overlay").style.display = "none"; }

function printReceipt() {
  if (!lastOrder) return;
  const pa = document.getElementById("receipt-print-area");
  pa.innerHTML = buildReceiptHTML(lastOrder);
  pa.style.display = "block"; window.print();
  setTimeout(() => pa.style.display = "none", 1000);
}

function whatsappReceipt() {
  if (!lastOrder) return;
  const o = lastOrder;
  let msg = `🧾 *RECEIPT – ${ST.settings.storeName}*\n#${o.id.slice(-8)} | ${fmtDate(o.ts)}\n\n`;
  o.cart.forEach(it => { msg += `• ${it.name} (${it.variantLabel}) ×${it.qty} = ₹${it.price * it.qty}\n`; });
  msg += `\nTotal: ₹${o.total} | ${o.payMode === "upi" ? "UPI" : "COD"}`;
  window.open(`https://wa.me/${ST.settings.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
}

/* ── Admin hash check ── */
function checkAdminHash() {
  const chk = () => { if (location.hash === "#/admin" || location.hash === "#admin") window.location.href = "admin.html"; };
  chk(); window.addEventListener("hashchange", chk);
}
