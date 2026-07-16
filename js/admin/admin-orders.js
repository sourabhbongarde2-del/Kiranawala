/* ================================================================
   KIRANA BASKET — admin-orders.js
   Order list + full lifecycle management: status updates (pending →
   packed → out for delivery → delivered), cancellation, payment
   verification, and delivery-person assignment.
   ================================================================ */

const ORDER_STATUS_FLOW = ["pending", "packed", "out_for_delivery", "delivered"];
const ORDER_STATUS_LABEL = {
  pending:          { text: "🕐 Pending",          color: "#e67e00" },
  packed:           { text: "📦 Packed",            color: "#0077cc" },
  out_for_delivery: { text: "🚚 Out for Delivery",  color: "#7b3ff2" },
  delivered:        { text: "✅ Delivered",         color: "#0c831f" },
  cancelled:        { text: "❌ Cancelled",         color: "#cc0000" },
};
let _admOrderFilter = "all";

function admOrders() {
  const body = document.getElementById("adm-body");
  const filters = ["all", ...ORDER_STATUS_FLOW, "cancelled"];
  const orders = [...ADM.orders].reverse().filter(o => {
    const st = o.status || "pending";
    return _admOrderFilter === "all" || st === _admOrderFilter;
  });

  body.innerHTML = `
    <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:10px">
      ${filters.map(f => `<button onclick="_admOrderFilter='${f}';admOrders()" style="white-space:nowrap;border:none;border-radius:16px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;background:${_admOrderFilter===f?"#0c831f":"#f0f0f0"};color:${_admOrderFilter===f?"#fff":"#555"}">${f==="all"?"All":(ORDER_STATUS_LABEL[f]?.text||f)}</button>`).join("")}
    </div>
    ${orders.length === 0
      ? `<div style="text-align:center;padding:40px 20px;color:#aaa"><div style="font-size:48px">📭</div><div style="font-size:15px;font-weight:700;margin-top:10px;color:#888">Koi order nahi is category mein</div></div>`
      : orders.map(o => renderOrderCard(o)).join("")}`;
}

function renderOrderCard(o) {
  const status = o.status || "pending";
  const label  = ORDER_STATUS_LABEL[status] || ORDER_STATUS_LABEL.pending;
  const nextIdx = ORDER_STATUS_FLOW.indexOf(status);
  const nextStatus = (nextIdx >= 0 && nextIdx < ORDER_STATUS_FLOW.length - 1) ? ORDER_STATUS_FLOW[nextIdx + 1] : null;
  const isFinal = status === "delivered" || status === "cancelled";

  return `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
      <div><div style="font-size:13px;font-weight:800">#${o.id.slice(-8)}</div><div style="font-size:11px;color:#aaa">${fmtDate(o.ts)}</div></div>
      <div style="font-weight:900;font-size:15px;color:#0c831f">₹${o.total}</div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
      <span style="background:${label.color}22;color:${label.color};border-radius:8px;padding:3px 10px;font-size:11px;font-weight:800">${label.text}</span>
      <span style="background:${o.paymentVerified?"#f0faf0":"#fff8e1"};color:${o.paymentVerified?"#0c831f":"#996b00"};border-radius:8px;padding:3px 10px;font-size:11px;font-weight:700">${o.paymentVerified?"✅ Payment Verified":"⏳ Payment Unverified"}</span>
    </div>
    <div style="font-size:12px;color:#555;margin-bottom:4px">👤 ${o.name||"Customer"} · 📞 ${o.phone||"N/A"}</div>
    ${o.delivType==="pickup"?`<div style="font-size:11px;color:#777;margin-bottom:8px">🏪 Self Pickup</div>`:`<div style="font-size:11px;color:#777;margin-bottom:8px">📍 ${o.address||"Belewadi Masa"}</div>`}
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">
      ${(o.cart||[]).map(it=>`<span style="background:#f8f9f5;border-radius:8px;padding:3px 8px;font-size:11px;color:#555">${it.name} (${it.variantLabel}) ×${it.qty}</span>`).join("")}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
      <span style="background:#f0faf0;color:#0c831f;border-radius:8px;padding:3px 10px;font-size:11px;font-weight:700">${o.payMode==="upi"?"📱 UPI":"💵 COD"}</span>
      <span style="background:#e0f2ff;color:#0077cc;border-radius:8px;padding:3px 10px;font-size:11px;font-weight:700">${o.delivType==="pickup"?"🏪 Pickup":o.delivType==="instant"?"⚡ Instant":"🚚 Home"}</span>
    </div>

    ${!isFinal ? `
    <div style="margin-bottom:8px">
      <div style="font-size:10px;color:#999;margin-bottom:3px">🛵 Delivery person (optional)</div>
      <input value="${o.deliveryPerson||""}" placeholder="Naam likho" class="inp"
        onchange="admUpdateOrder('${o.id}', {deliveryPerson: this.value})"/>
    </div>` : (o.deliveryPerson ? `<div style="font-size:11px;color:#777;margin-bottom:8px">🛵 ${o.deliveryPerson}</div>` : "")}

    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${!o.paymentVerified && !isFinal ? `<button onclick="admUpdateOrder('${o.id}', {paymentVerified: true})" style="background:#fff8e1;border:1px solid #ffb300;border-radius:8px;padding:7px 12px;font-size:11px;font-weight:700;color:#996b00;cursor:pointer">✅ Payment Aa Gaya</button>` : ""}
      ${nextStatus ? `<button onclick="admUpdateOrder('${o.id}', {status: '${nextStatus}'})" style="background:#0c831f;color:#fff;border:none;border-radius:8px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer">${ORDER_STATUS_LABEL[nextStatus].text} →</button>` : ""}
      ${!isFinal ? `<button onclick="if(confirm('Order cancel karein?'))admUpdateOrder('${o.id}', {status: 'cancelled'})" style="background:#fff0f0;border:none;border-radius:8px;padding:7px 12px;font-size:11px;font-weight:700;color:#cc0000;cursor:pointer">✕ Cancel</button>` : ""}
    </div>
  </div>`;
}

async function admUpdateOrder(orderId, patch) {
  const o = ADM.orders.find(x => x.id === orderId);
  if (!o) return;
  Object.assign(o, patch);
  if (patch.status) {
    o.statusHistory = [...(o.statusHistory || []), { status: patch.status, ts: Date.now() }];
    patch = { ...patch, statusHistory: o.statusHistory };
  }
  try {
    await dbUpdateOrder(orderId, patch);
    showToast("✅ Order update ho gaya");
  } catch (e) {
    showToast("❌ Update nahi hua: " + (e.message || "try again"));
  }
  admOrders();
}
