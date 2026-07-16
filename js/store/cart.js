/* ================================================================
   KIRANA BASKET — cart.js
   Cart quantity ops, wishlist, cart/wishlist badges + drawers.
   ================================================================ */

/* ── CART OPS ── */
function addCart(pid, vlbl) {
  const p = ST.products.find(x => x.id === pid);
  if (!p || !p.stock) return;
  const k = cartKey(pid, vlbl);
  ST.cart[k] = (ST.cart[k] || 0) + 1;
  LS("cart", ST.cart); updateCartUI();
  const el = document.getElementById("card-" + pid);
  if (el) el.outerHTML = prodCardHTML(p);
  if (!ST.recent.find(r => r.id === pid)) { ST.recent = [p, ...ST.recent].slice(0, 6); LS("recent", ST.recent); }
}
function incCart(pid, vlbl) {
  const k = cartKey(pid, vlbl);
  ST.cart[k] = (ST.cart[k] || 0) + 1;
  LS("cart", ST.cart); updateCartUI();
  const p = ST.products.find(x => x.id === pid);
  const el = document.getElementById("card-" + pid);
  if (el && p) el.outerHTML = prodCardHTML(p);
}
function decCart(pid, vlbl) {
  const k = cartKey(pid, vlbl);
  if (!ST.cart[k]) return;
  ST.cart[k]--;
  if (ST.cart[k] <= 0) delete ST.cart[k];
  LS("cart", ST.cart); updateCartUI();
  const p = ST.products.find(x => x.id === pid);
  const el = document.getElementById("card-" + pid);
  if (el && p) el.outerHTML = prodCardHTML(p);
}
function updateCartUI() {
  const cnt = cartCount(), tot = cartSubtotal();
  const badge = document.getElementById("cart-badge");
  if (badge) { badge.style.display = cnt > 0 ? "inline" : "none"; badge.textContent = cnt; }
  const bar = document.getElementById("cart-bar");
  if (bar) bar.style.display = cnt > 0 ? "flex" : "none";
  const bc = document.getElementById("bar-count");
  const bt = document.getElementById("bar-total");
  if (bc) bc.textContent = cnt + " item" + (cnt > 1 ? "s" : "");
  if (bt) bt.textContent = "₹" + tot;
  const app = document.getElementById("main-app");
  if (app) app.style.paddingBottom = cnt > 0 ? "72px" : "0";
}

/* ── WISHLIST ── */
function toggleWish(id) {
  ST.wishlist.has(id) ? ST.wishlist.delete(id) : ST.wishlist.add(id);
  LS("wishlist", [...ST.wishlist]);
  updateWishBadge();
  const p = ST.products.find(x => x.id === id);
  const el = document.getElementById("card-" + id);
  if (el && p) el.outerHTML = prodCardHTML(p);
  const wb = document.getElementById("wish-body");
  if (wb && wb.dataset.open) renderWishBody();
}
function updateWishBadge() {
  const wc = document.getElementById("wish-count");
  if (!wc) return;
  wc.style.display = ST.wishlist.size > 0 ? "block" : "none";
  wc.textContent = ST.wishlist.size;
}
function showWishlist() {
  renderWishBody();
  document.getElementById("wish-overlay").style.display = "flex";
}
function renderWishBody() {
  const body = document.getElementById("wish-body");
  if (!body) return;
  body.dataset.open = "1";
  const wished = ST.products.filter(p => ST.wishlist.has(p.id));
  if (!wished.length) {
    body.style.cssText = "";
    body.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#aaa"><div style="font-size:48px">🤍</div><div style="font-size:15px;font-weight:700;margin-top:10px;color:#888">Kuch save nahi kiya</div><div style="font-size:12px;margin-top:4px">Product pe ❤️ dabao</div></div>`;
  } else {
    body.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px";
    body.innerHTML = wished.map(prodCardHTML).join("");
  }
}
function closeWish() {
  const b = document.getElementById("wish-body");
  if (b) delete b.dataset.open;
  document.getElementById("wish-overlay").style.display = "none";
}

/* ════════════════════════════════════════════════════════════
   CART DRAWER
════════════════════════════════════════════════════════════ */
function openCart() { buildCartSheet(); document.getElementById("cart-overlay").style.display = "flex"; }
function closeCart() { document.getElementById("cart-overlay").style.display = "none"; }

