# 📁 Project Structure — Kirana Basket

Har cheez ab uske apne alag file mein hai, taaki koi bhi ek cheez change
karni ho to sahi file turant mil jaye — poora project khangalna na pade.

```
Kirana Basket/
├── index.html              customer-facing store (page shell only)
├── admin.html              admin dashboard (page shell only)
├── register.html           new store owner sign-up
├── nearby.html             "find nearby stores" page
├── manifest.json           PWA install config
├── sw.js                   offline/installability service worker
├── firebase-messaging-sw.js   background push notification handler
├── firestore.rules         paste this into Firebase Console → Firestore → Rules
├── NOTIFICATIONS.md         push notification one-time setup guide
│
├── css/
│   ├── store.css            all styling for index.html
│   ├── admin.css            all styling for admin.html
│   ├── register.css         all styling for register.html
│   └── nearby.css           all styling for nearby.html
│
├── js/
│   ├── core/                shared by every page
│   │   ├── config.js          Firebase project keys + default store settings
│   │   ├── Db.js              all database read/write/auth functions
│   │   └── notifications.js   push notification client-side setup
│   │
│   ├── store/                index.html only, loaded in this order
│   │   ├── state.js            shared state (ST) + small helpers
│   │   ├── ui-core.js           init, header, dark mode, language
│   │   ├── banners-categories.js  ad banners + category filter
│   │   ├── products.js          product cards + grid
│   │   ├── cart.js              cart/wishlist logic
│   │   ├── checkout.js          checkout, payment, receipt
│   │   └── main.js              PIN/location entry, PWA install
│   │
│   ├── admin/                 admin.html only, loaded in this order
│   │   ├── admin-state.js       shared admin state (ADM) + helpers
│   │   ├── admin-core.js        tabs, dashboard stats
│   │   ├── admin-products.js    product CRUD, CSV import
│   │   ├── admin-banners.js     ads/banner scheduling
│   │   ├── admin-orders.js      order list
│   │   ├── admin-settings.js    store settings, QR, password
│   │   └── admin-login.js       secure owner login
│   │
│   ├── register/register.js   register.html logic
│   └── nearby/nearby.js       nearby.html logic
│
├── assets/
│   └── icons/                icon-192.png, icon-512.png
│
└── functions/                Cloud Function — deploy yourself (see NOTIFICATIONS.md)
    ├── index.js
    └── package.json
```

## ⚠️ Important rule when editing

All the files inside one folder (e.g. everything in `js/store/`) are loaded
as **plain `<script>` tags on the same page** — they all share one global
scope, exactly like if they were still one big file. This means:

- ✅ **Fine**: adding a new `function` in any file — functions never collide.
- ❌ **Will break the whole page**: adding a top-level `const x = ...` or
  `let x = ...` that's already declared in another file loaded on the same
  page. This exact bug (`Identifier 'LS' has already been declared`) is what
  caused the app to get stuck on "Connecting to Firebase..." earlier —
  the whole `store.js` silently failed to run.

**Before adding a new top-level `const`/`let`,** quickly check it doesn't
already exist among the files loaded on that same page:
```bash
grep -rn "^const \|^let " js/store/     # for index.html
grep -rn "^const \|^let " js/admin/     # for admin.html
```

## Where to make common changes

| Want to change... | Edit this file |
|---|---|
| Product list, categories | `js/store/products.js`, `js/core/config.js` |
| Cart/checkout behaviour | `js/store/checkout.js` |
| Colors, fonts, spacing (customer app) | `css/store.css` |
| Admin dashboard look | `css/admin.css` |
| Delivery PIN / store address defaults | `js/core/config.js` |
| Banner/ad scheduling behaviour | `js/admin/admin-banners.js` |
| Push notification wording | `js/admin/admin-banners.js` (`admSendBannerNotification`) |
| Firebase project keys | `js/core/config.js` **and** `firebase-messaging-sw.js` |
