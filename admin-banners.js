/* ================================================================
   KIRANA BASKET — admin-banners.js
   Promotional banner / ADS system: add, edit, reorder, delete,
   schedule a start/end date+time, pause/resume, and optional
   tap-through link. Only banners that are "active" AND inside their
   scheduled window are shown to customers (see isBannerLive() below,
   shared with js/store/banners-categories.js on the customer side).
   ================================================================ */

const MAX_BANNERS = 8;

/* Shared status logic — a banner is "live" if it's marked active AND
   the current time is within its optional start/end window. No dates
   set = always live while active. Used by both admin preview and the
   real customer-facing banner carousel. */
function isBannerLive(b, now = Date.now()) {
  if (b.active === false) return false;
  if (b.startAt && now < new Date(b.startAt).getTime()) return false;
  if (b.endAt   && now > new Date(b.endAt).getTime())   return false;
  return true;
}
function bannerStatusLabel(b) {
  const now = Date.now();
  if (b.active === false) return { text: "⏸️ Paused", color: "#888" };
  if (b.startAt && now < new Date(b.startAt).getTime()) return { text: "🕒 Scheduled", color: "#e67e00" };
  if (b.endAt   && now > new Date(b.endAt).getTime())   return { text: "⌛ Expired",   color: "#cc0000" };
  return { text: "🟢 Live now", color: "#0c831f" };
}

function admBanners() {
  const body = document.getElementById("adm-body");
  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <div style="font-size:13px;font-weight:800">🖼️ Ads &amp; Offer Banners</div>
      ${ADM.banners.length < MAX_BANNERS ? `<button onclick="addBanner()" style="background:#0c831f;color:#fff;border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer">+ Add Banner</button>` : ""}
    </div>
    <div style="font-size:11px;color:#999;margin-bottom:12px">Max ${MAX_BANNERS} banners. Schedule a start/end time to run timed offers automatically.</div>
    <div id="banner-list">${renderBannerList()}</div>`;
}

function renderBannerList() {
  if (!ADM.banners.length) return `<div style="text-align:center;padding:30px;color:#aaa"><div style="font-size:40px">🖼️</div><div style="font-size:13px;margin-top:10px">No banners. Click + Add Banner above.</div></div>`;
  return ADM.banners.map((b, i) => {
    const bgStyle = b.img ? `background:url('${b.img}') center/cover no-repeat` : `background:${b.bg||"#0c831f"}`;
    const status  = bannerStatusLabel(b);
    const toISOLocal = (v) => v ? new Date(v).toISOString().slice(0,16) : "";
    return `<div class="card" style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11px;font-weight:800;color:${status.color}">${status.text}</span>
        <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#555;cursor:pointer">
          <input type="checkbox" ${b.active !== false ? "checked" : ""}
            onchange="ADM.banners[${i}].active=this.checked;dbSaveBanners(ADM.banners);document.getElementById('banner-list').innerHTML=renderBannerList()"/>
          Active
        </label>
      </div>
      <div style="${bgStyle};border-radius:10px;padding:14px;margin-bottom:12px;min-height:60px;display:flex;align-items:center">
        <div style="${b.img?"background:rgba(0,0,0,.45);border-radius:8px;padding:6px 10px":""}">
          <div style="font-size:13px;font-weight:900;color:#fff">${b.title||"Banner Title"}</div>
          <div style="font-size:10px;color:rgba(255,255,255,.85);margin-top:2px">${b.sub||"Subtitle"}</div>
        </div>
      </div>
      <input value="${b.title||""}" placeholder="Title" class="inp" style="margin-bottom:6px"
        oninput="ADM.banners[${i}].title=this.value;dbSaveBanners(ADM.banners)"/>
      <input value="${b.sub||""}" placeholder="Subtitle" class="inp" style="margin-bottom:8px"
        oninput="ADM.banners[${i}].sub=this.value;dbSaveBanners(ADM.banners)"/>
      <input value="${b.link||""}" placeholder="Tap-through link (optional, e.g. a category name or URL)" class="inp" style="margin-bottom:8px"
        oninput="ADM.banners[${i}].link=this.value;dbSaveBanners(ADM.banners)"/>

      <div style="font-size:11px;font-weight:700;color:#555;margin-bottom:4px">📅 Schedule (optional — leave blank to run always)</div>
      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
        <div style="flex:1;min-width:140px">
          <div style="font-size:10px;color:#999;margin-bottom:2px">Starts</div>
          <input type="datetime-local" class="inp" value="${toISOLocal(b.startAt)}"
            onchange="ADM.banners[${i}].startAt=this.value?new Date(this.value).toISOString():'';dbSaveBanners(ADM.banners);document.getElementById('banner-list').innerHTML=renderBannerList()"/>
        </div>
        <div style="flex:1;min-width:140px">
          <div style="font-size:10px;color:#999;margin-bottom:2px">Ends</div>
          <input type="datetime-local" class="inp" value="${toISOLocal(b.endAt)}"
            onchange="ADM.banners[${i}].endAt=this.value?new Date(this.value).toISOString():'';dbSaveBanners(ADM.banners);document.getElementById('banner-list').innerHTML=renderBannerList()"/>
        </div>
      </div>

      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
        <div style="font-size:11px;font-weight:700;color:#555">BG Color:</div>
        <input type="color" value="#0c831f"
          oninput="ADM.banners[${i}].bg='linear-gradient(135deg,'+this.value+','+this.value+40+')';ADM.banners[${i}].img='';dbSaveBanners(ADM.banners);document.getElementById('banner-list').innerHTML=renderBannerList()"
          style="width:36px;height:28px;border:1px solid #eee;border-radius:6px;cursor:pointer;padding:2px"/>
        <div style="font-size:11px;color:#aaa">or upload image:</div>
        <button onclick="document.getElementById('bnr-img-${i}').click()" style="background:#f0faf0;border:1px solid #0c831f;border-radius:8px;padding:5px 10px;font-size:11px;font-weight:700;color:#0c831f;cursor:pointer">📷 Image</button>
        <input type="file" id="bnr-img-${i}" accept="image/*" style="display:none" onchange="uploadBannerImg(event,${i})"/>
        ${b.img?`<button onclick="ADM.banners[${i}].img='';dbSaveBanners(ADM.banners);document.getElementById('banner-list').innerHTML=renderBannerList()" style="background:#fff0f0;border:none;border-radius:8px;padding:5px 10px;font-size:11px;color:#cc0000;cursor:pointer">✕ Remove Image</button>`:""}
      </div>

      <div style="display:flex;gap:8px;align-items:center">
        <button onclick="admSendBannerNotification(${i})" style="background:#fff8e1;border:1px solid #ffb300;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;color:#996b00;cursor:pointer;margin-right:auto">🔔 Notify Now</button>
        ${i>0?`<button onclick="ADM.banners.splice(${i-1},0,ADM.banners.splice(${i},1)[0]);dbSaveBanners(ADM.banners);admBanners()" style="background:#f0f0f0;border:none;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer">↑</button>`:""}
        ${i<ADM.banners.length-1?`<button onclick="ADM.banners.splice(${i+1},0,ADM.banners.splice(${i},1)[0]);dbSaveBanners(ADM.banners);admBanners()" style="background:#f0f0f0;border:none;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer">↓</button>`:""}
        <button onclick="if(confirm('Delete banner?')){ADM.banners.splice(${i},1);dbSaveBanners(ADM.banners);admBanners()}" style="background:#fff0f0;border:none;border-radius:8px;padding:6px 10px;font-size:12px;color:#cc0000;cursor:pointer">🗑️</button>
      </div>
    </div>`;
  }).join("");
}

function addBanner() {
  ADM.banners.push({
    id: "b" + Date.now(), title: "New Offer 🎉", sub: "Special deal for you!",
    bg: "linear-gradient(135deg,#0c831f,#056b16)", img: "", link: "",
    active: true, startAt: "", endAt: ""
  });
  dbSaveBanners(ADM.banners); admBanners();
}
function uploadBannerImg(e, i) {
  const file = e.target.files[0]; if (!file) return;
  resizeImg(file, 800, .85, dataUrl => {
    ADM.banners[i].img = dataUrl; dbSaveBanners(ADM.banners);
    document.getElementById("banner-list").innerHTML = renderBannerList();
  });
  e.target.value = "";
}

/* ── Send a push notification to every customer subscribed to this
   store when the admin flips "🔔 Notify customers" on. This just writes
   a doc that a Cloud Function (see /functions) picks up and fans out
   via Firebase Cloud Messaging — see NOTIFICATIONS.md for setup. ── */
async function admSendBannerNotification(i) {
  const b = ADM.banners[i];
  if (!b || !b.title) return;
  try {
    await dbQueueNotification({
      title: b.title,
      body: b.sub || "Naya offer aaya hai!",
      tag: "banner-" + b.id,
    });
    showToast("🔔 Notification bhej di gayi!");
  } catch (e) {
    showToast("❌ Notification nahi bhej payi: " + (e.message || "try again"));
  }
}
