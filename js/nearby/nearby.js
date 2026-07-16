/* ================================================================
   KIRANA BASKET — nearby.js
   Nearby-stores finder (geolocation + directory search).
   Runs on nearby.html.
   ================================================================ */

const RADIUS_KM = 3;

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function showState(icon, title, msg, btnText, btnFn) {
  document.getElementById("content").innerHTML = `
    <div class="state-box">
      <div class="ic">${icon}</div>
      <h2>${title}</h2>
      <p>${msg}</p>
      ${btnText ? `<button onclick="${btnFn}">${btnText}</button>` : ""}
    </div>`;
}

async function init() {
  if (!navigator.geolocation) {
    showState("📍", "Location Support Nahi Hai", "Yeh browser location detect nahi kar sakta. Kisi aur browser (Chrome) mein try karo.", null);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async pos => {
      document.getElementById("nav-sub").textContent = "Tumhare 3km ke andar ki dukane";
      await findNearby(pos.coords.latitude, pos.coords.longitude);
    },
    err => {
      showState("🔒", "Location Permission Chahiye",
        "Nearby dukane dikhane ke liye location ki zaroorat hai. Browser ki settings mein location allow karo aur phir try karo.",
        "🔄 Dobara Try Karo", "init()");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

async function findNearby(myLat, myLng) {
  await dbInit();
  const stores = await dbListDirectory();

  if (!stores.length) {
    showState("🏪", "Koi Store Nahi Mila", "Abhi is area mein koi registered kirana store nahi hai. Sabse pehle apni dukan register karo!", "🚀 Store Register Karo", "location.href='register.html'");
    return;
  }

  const nearby = stores
    .filter(s => typeof s.lat === "number" && typeof s.lng === "number")
    .map(s => ({ ...s, dist: haversine(myLat, myLng, s.lat, s.lng) }))
    .filter(s => s.dist <= RADIUS_KM)
    .sort((a, b) => a.dist - b.dist);

  if (!nearby.length) {
    showState("😔", "3km Mein Koi Dukan Nahi", "Tumhare aas-paas 3km ke andar abhi koi kirana store register nahi hai.", "🚀 Apni Dukan Register Karo", "location.href='register.html'");
    return;
  }

  const html = nearby.map(s => `
    <div class="store-card" onclick="location.href='index.html?s=${s.id}'">
      <div class="store-ic">${s.iconUrl ? `<img src="${s.iconUrl}"/>` : "🏪"}</div>
      <div class="store-info">
        <h3>${s.name || "Kirana Store"}</h3>
        <div class="addr">${s.addr || ""}</div>
      </div>
      <div class="store-dist">${s.dist < 1 ? Math.round(s.dist*1000) + "m" : s.dist.toFixed(1) + "km"}</div>
    </div>
  `).join("");

  document.getElementById("content").innerHTML = `
    <div class="radius-note">📍 ${RADIUS_KM}km ke andar ${nearby.length} dukan mili</div>
    <div class="list">${html}</div>`;
}

init();
