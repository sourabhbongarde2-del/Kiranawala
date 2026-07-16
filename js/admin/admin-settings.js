/* ================================================================
   KIRANA BASKET — admin-settings.js
   Store settings form, QR code, location, icon upload, password
   change, logout.
   ================================================================ */

function admSettings() {
  const s = ADM.settings;
  const inp = (lbl, id, val, tp="text") =>
    `<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:700;color:#666;margin-bottom:5px">${lbl}</div><input type="${tp}" id="${id}" value="${val}" class="inp"/></div>`;
  const body = document.getElementById("adm-body");
  body.innerHTML = `
    <div class="card">
      <div style="font-size:14px;font-weight:800;margin-bottom:12px">🏪 Store Info</div>
      ${inp("Store Name",    "s-sname",  s.storeName)}
      ${inp("Store Tagline", "s-stag",   s.storeTagline)}
      ${inp("Store Address", "s-saddr",  s.storeAddr)}
      ${inp("Store Phone",   "s-sphone", s.storePhone)}
      <div style="margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:#666;margin-bottom:5px">📍 Nearby-Search Location</div>
        <div style="font-size:11px;color:${s.lat?"#0c831f":"#e65100"};font-weight:600;margin-bottom:6px">
          ${s.lat ? "✅ Set hai — customers ko 3km ke andar dikhogi" : "⚠️ Set nahi hai — nearby search mein nahi dikhoge"}
        </div>
        <button type="button" onclick="updateAdmLocation()" id="adm-loc-btn" style="width:100%;background:#f0faf0;border:1.5px solid #0c831f;color:#0c831f;border-radius:8px;padding:10px;font-weight:700;font-size:12px;cursor:pointer">
          📍 Dukan Mein Khade Hoke Location ${s.lat ? "Update" : "Set"} Karo
        </button>
      </div>
      <div style="margin-bottom:6px">
        <div style="font-size:11px;font-weight:700;color:#666;margin-bottom:6px">App Icon (jab customer PWA install kare)</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div id="icon-prev-box" style="width:48px;height:48px;border-radius:12px;overflow:hidden;background:#f8f9f5;border:1px solid #eee;display:flex;align-items:center;justify-content:center">
            ${s.iconUrl ? `<img src="${s.iconUrl}" style="width:100%;height:100%;object-fit:cover"/>` : `<span style="font-size:22px">🏪</span>`}
          </div>
          <label style="background:#f0faf0;border:1.5px solid #0c831f;border-radius:8px;padding:8px 12px;font-size:11px;font-weight:700;color:#0c831f;cursor:pointer">
            📷 Icon Upload Karo
            <input type="file" accept="image/*" style="display:none" onchange="handleStoreIcon(event)"/>
          </label>
        </div>
      </div>
    </div>
    <div class="card">
      <div style="font-size:14px;font-weight:800;margin-bottom:12px">📱 WhatsApp & UPI</div>
      ${inp("WhatsApp (with country code e.g. 918855020634)","s-wa",s.whatsapp)}
      ${inp("UPI ID","s-upi",s.upiId)}
      ${inp("UPI Display Name","s-uname",s.upiName)}
    </div>
    <div class="card">
      <div style="font-size:14px;font-weight:800;margin-bottom:12px">🚚 Delivery Fees</div>
      ${inp("Minimum Order (₹)",            "s-min",   s.minOrder,         "number")}
      ${inp("Standard Delivery Fee (₹)",    "s-dfee",  s.delivFee,         "number")}
      ${inp("Free Delivery Above (₹)",      "s-free",  s.freeDelivAt,      "number")}
      ${inp("Standard Delivery ETA",        "s-eta",   s.delivEta)}
      ${inp("Instant Delivery Fee (₹)",     "s-inst",  s.instantFee,       "number")}
      ${inp("Instant: Min Cart Value (₹)",  "s-imin",  s.instantMinOrder,  "number")}
      ${inp("Pickup ETA",                   "s-peta",  s.pickupEta)}
      ${inp("Delivery PIN Code",            "s-pin",   s.deliveryPin)}
    </div>
    <div class="card">
      <div style="font-size:14px;font-weight:800;margin-bottom:12px">🔑 Admin Password</div>
      ${inp("Naya Password (khali chodo agar change nahi karna)","s-newpass","","password")}
      <div style="font-size:10px;color:#aaa;margin-top:-6px;margin-bottom:6px">Kam se kam 6 characters. Save karte hi purana password kaam nahi karega.</div>
    </div>
    <div class="card">
      <div style="font-size:14px;font-weight:800;margin-bottom:10px">📲 Customer Link Share Karo</div>
      <div style="font-size:11px;color:#888;word-break:break-all;background:#f8f9f5;border-radius:8px;padding:8px 10px;margin-bottom:10px" id="cust-link-box">${location.origin + location.pathname.replace(/admin\.html$/, "")}index.html?s=${dbGetStoreId()}</div>
      <button onclick="shareCustLink()" style="width:100%;background:#25d366;color:#fff;border:none;border-radius:10px;padding:11px;font-weight:700;font-size:13px;cursor:pointer;margin-bottom:12px">📲 WhatsApp Par Share Karo</button>
      <div style="text-align:center">
        <div id="adm-qr-box" style="display:inline-flex;padding:10px;background:#fff"></div>
        <button onclick="downloadAdmQR()" style="display:block;width:100%;background:#fff;border:1.5px solid #0c831f;color:#0c831f;border-radius:10px;padding:10px;font-weight:700;font-size:12px;cursor:pointer;margin-top:8px">⬇️ QR Download Karo (Print ke liye)</button>
      </div>
    </div>
    <div class="card">
      <div style="font-size:14px;font-weight:800;margin-bottom:8px">🔥 Firebase Status</div>
      <div style="font-size:12px;color:${dbIsFirebase()?"#0c831f":"#e65100"};font-weight:700;margin-bottom:6px">${dbIsFirebase()?"✅ Connected – all browsers sync in real-time!":"⚠️ Not connected – fill FIREBASE_CONFIG in config.js"}</div>
      <div style="font-size:11px;color:#888">When Firebase is connected, admin changes (products, banners, settings) instantly appear in all customer browsers — including incognito.</div>
    </div>
    <button id="save-sett-btn" onclick="saveAdmSettings()" style="width:100%;background:#0c831f;color:#fff;border:none;border-radius:12px;padding:14px;font-weight:800;font-size:15px;cursor:pointer;margin-bottom:10px">✓ Save Settings</button>
    <button onclick="admLogout()" style="width:100%;background:#fff0f0;color:#c00;border:1.5px solid #ffd0d0;border-radius:12px;padding:12px;font-weight:700;font-size:13px;cursor:pointer;margin-bottom:16px">🚪 Logout</button>`;

  const qrBox = document.getElementById("adm-qr-box");
  if (qrBox && typeof QRCode !== "undefined") {
    qrBox.innerHTML = "";
    new QRCode(qrBox, {
      text: document.getElementById("cust-link-box").textContent,
      width: 160, height: 160, colorDark: "#0c831f", colorLight: "#ffffff"
    });
  }
}

function downloadAdmQR() {
  const canvas = document.querySelector("#adm-qr-box canvas");
  if (!canvas) return alert("QR abhi ready nahi hai.");
  const a = document.createElement("a");
  a.download = dbGetStoreId() + "-qr.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
}

function updateAdmLocation() {
  const btn = document.getElementById("adm-loc-btn");
  if (!navigator.geolocation) return alert("Location support nahi hai is browser mein.");
  btn.textContent = "📍 Location dhoondh rahe hain... (20-30 sec lag sakte hain)";

  function onOk(pos) {
    ADM.settings.lat = pos.coords.latitude;
    ADM.settings.lng = pos.coords.longitude;
    dbSaveSettings(ADM.settings);
    dbWriteDirectory(dbGetStoreId(), {
      name: ADM.settings.storeName, addr: ADM.settings.storeAddr,
      phone: ADM.settings.storePhone, lat: ADM.settings.lat, lng: ADM.settings.lng,
      iconUrl: ADM.settings.iconUrl || null,
    });
    showToast("✅ Location save ho gayi!");
    admSettings();
  }
  function onErr(err) {
    alert("⚠️ Location nahi mili: " + err.message + " — khidki/bahar ke paas try karo.");
    btn.textContent = "📍 Dobara Try Karo";
  }

  navigator.geolocation.getCurrentPosition(
    onOk,
    () => navigator.geolocation.getCurrentPosition(onOk, onErr, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }),
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );
}

function handleStoreIcon(e) {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 2*1024*1024) { alert("2MB se bada nahi!"); return; }
  resizeImg(file, 512, .85, dataUrl => {
    ADM.settings.iconUrl = dataUrl;
    dbSaveSettings(ADM.settings);
    const box = document.getElementById("icon-prev-box");
    if (box) box.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover"/>`;
    showToast("✅ Icon saved! Naye installs mein dikhega.");
  });
  e.target.value = "";
}

function shareCustLink() {
  const link = document.getElementById("cust-link-box").textContent;
  const msg  = `🛒 *${ADM.settings.storeName}*\nAb order karo online:\n${link}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

function admLogout() {
  try { localStorage.removeItem("bm_admin_ok_" + dbGetStoreId()); } catch(e) {}
  dbSignOutOwner();
  location.reload();
}

async function saveAdmSettings() {
  const g = id => document.getElementById(id)?.value || "";
  ADM.settings = {
    ...ADM.settings,
    storeName:       g("s-sname"),
    storeTagline:    g("s-stag"),
    storeAddr:       g("s-saddr"),
    storePhone:      g("s-sphone"),
    whatsapp:        g("s-wa"),
    upiId:           g("s-upi"),
    upiName:         g("s-uname"),
    minOrder:       +g("s-min"),
    delivFee:       +g("s-dfee"),
    freeDelivAt:    +g("s-free"),
    delivEta:        g("s-eta"),
    instantFee:     +g("s-inst"),
    instantMinOrder:+g("s-imin"),
    pickupEta:       g("s-peta"),
    deliveryPin:     g("s-pin"),
  };
  const newPass = g("s-newpass");
  if (newPass) {
    if (newPass.length < 6) {
      showToast("⚠️ Naya password kam se kam 6 characters ka rakho — nahi save hua.");
    } else if (ADM.settings.ownerUid) {
      try {
        await dbChangeOwnerPassword(newPass);
        showToast("✅ Password change ho gaya!");
      } catch (e) {
        if (e.code === "auth/requires-recent-login") {
          showToast("⚠️ Password badalne ke liye dobara login karo (logout karke wapas aao).");
        } else {
          showToast("❌ Password change nahi hua: " + (e.message || "try again"));
        }
      }
    } else {
      // Legacy store without secure login yet — keep old plaintext fallback.
      ADM.settings.adminPass = newPass;
    }
  }
  dbSaveSettings(ADM.settings);

  // Keep the public nearby-stores directory in sync
  if (typeof ADM.settings.lat === "number" && typeof ADM.settings.lng === "number") {
    dbWriteDirectory(dbGetStoreId(), {
      name: ADM.settings.storeName, addr: ADM.settings.storeAddr,
      phone: ADM.settings.storePhone, lat: ADM.settings.lat, lng: ADM.settings.lng,
      iconUrl: ADM.settings.iconUrl || null,
    });
  }

  const btn = document.getElementById("save-sett-btn");
  btn.textContent = "✅ Saved!"; setTimeout(() => btn.textContent = "✓ Save Settings", 2000);
  showToast("✅ Settings saved!");
}
