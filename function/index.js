/* ================================================================
   KIRANA BASKET — Cloud Functions
   ------------------------------------------------------------------
   WHAT THIS DOES:
   Watches every store's `notificationsOutbox` subcollection. Whenever
   the admin panel adds a new document there (via the "🔔 Notify Now"
   button), this function reads all saved device tokens for that store
   and sends them a push notification through Firebase Cloud Messaging.

   This MUST run on a server — it uses the Firebase Admin SDK, which
   has full access to your project and can never be safely shipped to
   a browser. That's why it lives here instead of in js/.

   HOW TO DEPLOY (one-time setup — see NOTIFICATIONS.md for more detail):
     1. Install the Firebase CLI:      npm install -g firebase-tools
     2. Log in:                        firebase login
     3. From the project root:         firebase init functions
        (choose your existing project, JavaScript, and say NO to
        overwriting this functions/ folder if it asks)
     4. Upgrade to the Blaze (pay-as-you-go) plan in Firebase Console —
        Cloud Functions require it. The free monthly quota is generous;
        a small kirana store's notification volume will likely stay
        within it.
     5. Deploy:                        firebase deploy --only functions
   ================================================================ */

const { initializeApp } = require("firebase-admin/app");
const { getFirestore }  = require("firebase-admin/firestore");
const { getMessaging }  = require("firebase-admin/messaging");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

initializeApp();
const db = getFirestore();

exports.sendOfferNotification = onDocumentCreated(
  "stores/{storeId}/notificationsOutbox/{notifId}",
  async (event) => {
    const { storeId } = event.params;
    const data = event.data.data();
    const { title, body, tag } = data;

    const tokensSnap = await db.collection("stores").doc(storeId).collection("tokens").get();
    if (tokensSnap.empty) {
      console.log(`No devices subscribed for store ${storeId} — nothing to send.`);
      return;
    }
    const tokens = tokensSnap.docs.map((d) => d.id);

    const message = {
      notification: { title: title || "Kirana Basket", body: body || "Naya offer aaya hai!" },
      data: { tag: tag || "offer" },
      tokens,
    };

    const res = await getMessaging().sendEachForMulticast(message);
    console.log(`Sent to ${res.successCount}/${tokens.length} devices for store ${storeId}.`);

    // Clean up tokens that are no longer valid (uninstalled app, expired, etc.)
    const deletions = [];
    res.responses.forEach((r, i) => {
      if (!r.success && (r.error?.code === "messaging/registration-token-not-registered")) {
        deletions.push(
          db.collection("stores").doc(storeId).collection("tokens").doc(tokens[i]).delete()
        );
      }
    });
    if (deletions.length) await Promise.all(deletions);
  }
);
