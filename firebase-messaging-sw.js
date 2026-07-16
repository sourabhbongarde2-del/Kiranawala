/* ================================================================
   KIRANA BASKET — firebase-messaging-sw.js
   Handles push notifications that arrive while the app/browser tab is
   NOT open. Must live at the site root (not in /js) — Firebase's
   default messaging setup looks for it there.

   Requires a Cloud Function to actually be deployed (see /functions)
   for anything to ever reach this file — see NOTIFICATIONS.md.
   ================================================================ */

importScripts("https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js");

/* NOTE: this config is intentionally duplicated here (rather than
   importing js/core/config.js) because service workers load in an
   isolated scope. These values are copied from js/core/config.js as of
   this writing — if you ever change Firebase projects, update BOTH
   files. */
firebase.initializeApp({
  apiKey:            "AIzaSyBLhidhauwICyH_0-WPcsRoQTRd6HNGgW0",
  authDomain:        "bongarde-mart.firebaseapp.com",
  projectId:         "bongarde-mart",
  storageBucket:     "bongarde-mart.firebasestorage.app",
  messagingSenderId: "221016020353",
  appId:             "1:221016020353:web:105b028df3e3b909790480",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "Kirana Basket", {
    body: body || "Naya offer aaya hai!",
    icon: "assets/icons/icon-192.png",
    badge: "assets/icons/icon-192.png",
    vibrate: [200, 100, 200],
    tag: (payload.data && payload.data.tag) || "offer",
  });
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow("./index.html"));
});
