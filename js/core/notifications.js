/* ================================================================
   KIRANA BASKET — notifications.js
   Client-side push notification setup (Firebase Cloud Messaging).

   WHAT THIS DOES ON ITS OWN (no extra setup needed):
   - Asks the customer for notification permission
   - Registers their device with FCM and saves the token to Firestore
   - Plays a sound + shows an in-page toast for FOREGROUND messages
     (i.e. while the site tab is actually open)

   WHAT NEEDS ONE-TIME SETUP TO WORK FULLY (see NOTIFICATIONS.md):
   - A VAPID key from Firebase Console → Project Settings → Cloud
     Messaging → Web Push certificates (paste it into VAPID_KEY below)
   - Deploying the Cloud Function in /functions so offers actually get
     sent when the admin clicks "🔔 Notify Now"
   - Background notifications (app fully closed) are handled by
     firebase-messaging-sw.js at the project root
   ================================================================ */

const VAPID_KEY = ""; // <-- paste your Firebase Web Push VAPID key here

let _fcmReady = false;

async function initNotifications() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
  if (typeof firebase === "undefined" || typeof firebase.messaging !== "function") return;

  // Don't ask again if the customer already answered before.
  if (Notification.permission === "denied") return;

  try {
    const reg = await navigator.serviceWorker.register("firebase-messaging-sw.js");
    const messaging = firebase.messaging();

    if (Notification.permission !== "granted") {
      // Only prompt after some engagement, not the instant the page loads —
      // call this from a real user action (see the 🔔 bell button in index.html).
      return;
    }

    if (!VAPID_KEY) { console.warn("[notifications] VAPID_KEY not set — see NOTIFICATIONS.md"); return; }

    const token = await messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (token) { await dbSaveFcmToken(token); _fcmReady = true; }

    messaging.onMessage((payload) => {
      const { title, body } = payload.notification || {};
      if (typeof playBeep === "function") playBeep();
      if (typeof showToast === "function") showToast(`🔔 ${title || "Offer"}: ${body || ""}`, 5000);
    });
  } catch (e) { console.warn("[notifications] setup failed:", e.message); }
}

/* Call this from a real tap (a button), not on page load — browsers
   ignore/penalize permission prompts that aren't tied to user action. */
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    if (typeof showToast === "function") showToast("⚠️ Ye browser notifications support nahi karta");
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm === "granted") {
    if (typeof showToast === "function") showToast("✅ Notifications ON — naye offers ki khabar milegi!");
    await initNotifications();
  } else {
    if (typeof showToast === "function") showToast("⚠️ Notifications off rahenge — kabhi bhi settings se on kar sakte ho");
  }
}
