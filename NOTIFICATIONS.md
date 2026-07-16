# 🔔 Push Notifications — Setup Guide

Kirana Basket ab **real push notifications** support karta hai — customer ka
phone/browser band ho tab bhi unhe naya offer notify ho sakta hai. Isko
poora chalu karne ke liye **ek baar** ye steps karne padenge.

## Kya already kaam kar raha hai (bina kisi setup ke)
- Customer 🔔 button dabayega → permission maangega → device register ho jayega
- Jab tak app khula hai, naya offer aane par sound + on-screen alert dikhega

## Kya setup karna padega (real push ke liye, app band hone par bhi)

### Step 1 — VAPID Key lo
1. [Firebase Console](https://console.firebase.google.com) → apna project (`bongarde-mart`) kholo
2. ⚙️ **Project Settings** → **Cloud Messaging** tab
3. **Web configuration** section mein **"Web Push certificates"** → **Generate key pair**
4. Jo key milegi, use copy karo

### Step 2 — Key ko code mein daalo
`js/core/notifications.js` file kholo, ye line dhundo:
```js
const VAPID_KEY = ""; // <-- paste your Firebase Web Push VAPID key here
```
Apni key wahan paste karo.

### Step 3 — Cloud Function deploy karo
Ye wahi cheez hai jo asal mein notification **bhejti** hai. Terminal mein:

```bash
npm install -g firebase-tools     # ek baar hi karna hai
firebase login
firebase init functions            # project select karo, JavaScript choose karo
```

⚠️ **Zaroori**: Firebase Console mein apne project ko **Blaze (pay-as-you-go)
plan** pe upgrade karo — Cloud Functions free (Spark) plan pe deploy nahi
hoti. Chinta mat karo — free monthly quota kaafi zyada hai, chhoti dukaan
ke liye normally paisa nahi lagega.

Phir:
```bash
firebase deploy --only functions
```

Bas! Ab jab bhi admin panel mein "🔔 Notify Now" dabaoge, customers ko
push notification milegi — chahe unka phone/browser band hi kyun na ho.

## Troubleshooting
- **"messaging/permission-blocked"** — customer ne pehle hi notification
  block kar diya; unhe apne browser settings se manually enable karna hoga
- **Notification nahi mil rahi** — check karo ki Cloud Function deploy hui
  hai (`firebase functions:log` se dekho) aur VAPID key sahi paste hui hai
- **"failed-precondition: quota exceeded"** — Blaze plan pe upgrade nahi
  hua hai abhi
