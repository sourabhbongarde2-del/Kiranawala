/* ================================================================
   KIRANA BASKET — register.js
   New store owner registration flow. Runs on register.html.
   ================================================================ */

let CREATED_STORE_ID = "";
let CAPTURED_LAT = null;
let CAPTURED_LNG = null;

function captureLocation() {
  const btn = document.getElementById("loc-btn");
  const status = document.getElementById("loc-status");
  if (!navigator.geolocation) {
    status.textContent = "⚠️ Is browser mein location support nahi hai.";
    return;
  }
  btn.textContent = "📍 Location dhoondh rahe hain... (thoda time lagega)";
  btn.disabled = true;
  status.textContent = "GPS signal dhoond rahe hain, dukan ke andar ho to 20-30 second lag sakte hain...";
  status.style.color = "#888";

  function onSuccess(pos) {
    CAPTURED_LAT = pos.coords.latitude;
    CAPTURED_LNG = pos.coords.longitude;
    btn.textContent = "✅ Location Mil Gayi!";
    btn.style.background = "#0c831f";
    btn.style.color = "#fff";
    status.textContent = "📍 Location save ho gayi (" + CAPTURED_LAT.toFixed(4) + ", " + CAPTURED_LNG.toFixed(4) + ")";
    status.style.color = "#0c831f";
    btn.disabled = false;
  }

  function onFail(err) {
    status.textContent = "⚠️ Phir bhi nahi mili — thoda bahar/khidki ke paas jaake try karo, ya dukan ke bahar khade hoke dabao. (" + err.message + ")";
    status.style.color = "#c00";
    btn.textContent = "📍 Dobara Try Karo";
    btn.disabled = false;
  }

  // Try high-accuracy GPS first (best for exact shop location), longer timeout since indoors is slow.
  navigator.geolocation.getCurrentPosition(
    onSuccess,
    () => {
      // Fallback: lower accuracy (network/wifi based) — much faster, still good enough for 3km radius.
      status.textContent = "High-accuracy GPS slow hai, network-based location try kar rahe hain...";
      navigator.geolocation.getCurrentPosition(onSuccess, onFail, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );
}

function slugify(name) {
  return (name || "store").toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 24) || "store";
}

function showErr(msg) {
  const e = document.getElementById("reg-err");
  e.textContent = msg; e.style.display = "block";
}

async function submitReg() {
  const g = id => document.getElementById(id).value.trim();
  const name   = g("r-name");
  const owner  = g("r-owner");
  const mobile = g("r-mobile");
  let   wa     = g("r-wa");
  const addr   = g("r-addr");
  const pin    = g("r-pin");
  const pass   = g("r-pass");
  const pass2  = g("r-pass2");

  document.getElementById("reg-err").style.display = "none";

  if (!name || !owner || !addr) return showErr("⚠️ Sab zaroori fields bharo!");
  if (mobile.length !== 10)     return showErr("⚠️ 10 digit mobile number daalo!");
  if (pin.length < 4)           return showErr("⚠️ Sahi PIN code daalo!");
  if (CAPTURED_LAT === null)    return showErr("⚠️ Pehle 'Location Lo' button dabao — dukan mein khade hoke!");
  if (pass.length < 6)          return showErr("⚠️ Password kam se kam 6 characters ka ho!");
  if (pass !== pass2)           return showErr("⚠️ Dono password match nahi ho rahe!");
  if (!wa) wa = mobile;

  const btn = document.getElementById("reg-btn");
  btn.disabled = true; btn.textContent = "Ban raha hai...";

  try {
    // generate unique-ish store id
    let storeId = slugify(name);
    let exists  = await dbCheckStoreExists(storeId);
    let tries = 0;
    while (exists && tries < 5) {
      storeId = slugify(name) + "-" + Math.floor(1000 + Math.random() * 9000);
      exists = await dbCheckStoreExists(storeId);
      tries++;
    }

    // Create a real, securely-hashed login for this owner (Firebase Auth)
    // instead of storing their password as plain text in the database.
    let ownerUid;
    try {
      ownerUid = await dbRegisterOwner(mobile, pass);
    } catch (authErr) {
      btn.disabled = false; btn.textContent = "🚀 Mera Store Banao";
      if (authErr.code === "auth/email-already-in-use") {
        return showErr("⚠️ Ye mobile number pehle se ek store ke liye registered hai. Login karo ya doosra number try karo.");
      }
      if (authErr.code === "auth/weak-password") {
        return showErr("⚠️ Password kam se kam 6 characters ka rakho.");
      }
      return showErr("❌ Account nahi ban paya: " + (authErr.message || "try again"));
    }

    const settings = {
      ...DEFAULT_SETTINGS,
      storeName:    name,
      storeTagline: "Grocery Delivery – " + (g("r-city") || addr),
      storeAddr:    addr + (g("r-city") ? (", " + g("r-city")) : ""),
      storePhone:   mobile,
      whatsapp:     "91" + wa,
      deliveryPin:  pin,
      ownerName:    owner,
      ownerMobile:  mobile,
      ownerUid:     ownerUid,
      lat:          CAPTURED_LAT,
      lng:          CAPTURED_LNG,
    };
    delete settings.adminPass; // never store plaintext passwords in the database

    await dbCreateStore(storeId, {
      settings,
      products: INITIAL_PRODUCTS,
      banners:  DEFAULT_BANNERS,
    });

    // Add to the public directory so nearby.html can find this store
    await dbWriteDirectory(storeId, {
      name, addr: settings.storeAddr, phone: mobile,
      lat: CAPTURED_LAT, lng: CAPTURED_LNG,
      iconUrl: null, createdAt: Date.now(),
    });

    CREATED_STORE_ID = storeId;
    const base = location.href.replace(/register\.html.*$/, "");
    const custLink = base + "index.html?s=" + storeId;
    document.getElementById("cust-link").textContent = custLink;
    document.getElementById("adm-link").textContent  = base + "admin.html?s=" + storeId;
    document.getElementById("succ-name").textContent = "🎉 " + name + " Ban Gaya!";

    new QRCode(document.getElementById("qr-box"), {
      text: custLink, width: 180, height: 180,
      colorDark: "#0c831f", colorLight: "#ffffff"
    });

    document.getElementById("form-card").style.display = "none";
    document.getElementById("succ-card").style.display = "block";
  } catch (e) {
    console.error(e);
    showErr("❌ Kuch gadbad ho gayi: " + (e.message || "try again") + ". Firebase config.js check karo.");
    btn.disabled = false; btn.textContent = "🚀 Mera Store Banao";
  }
}

function downloadQR() {
  const canvas = document.querySelector("#qr-box canvas");
  if (!canvas) return alert("QR abhi ready nahi hai, thoda ruko.");
  const a = document.createElement("a");
  a.download = (CREATED_STORE_ID || "store") + "-qr.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
}

function copyLink(id) {
  const txt = document.getElementById(id).textContent;
  navigator.clipboard?.writeText(txt).then(() => alert("✅ Link copy ho gaya!"));
}
function shareWA() {
  const txt = document.getElementById("cust-link").textContent;
  const name = document.getElementById("succ-name").textContent;
  window.open("https://wa.me/?text=" + encodeURIComponent(`🛒 ${name}\nAb order karo online:\n${txt}`), "_blank");
}
function openAdmin() {
  location.href = "admin.html?s=" + CREATED_STORE_ID;
}

