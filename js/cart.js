/* MAX SPATIAL CRAFT — cart.js
   Fizyczne wydruki 3D — dostawa InPost
   Darmowa dostawa od 150 zł
*/

var SHIPPING  = 15;
var FREE_FROM = 150;

var cart = [];
try { cart = JSON.parse(localStorage.getItem('msc-cart') || '[]'); } catch(e){ cart = []; }

function cartSave()     { localStorage.setItem('msc-cart', JSON.stringify(cart)); }
function cartFmt(n)     { return Math.round(n) + ' zł'; }
function cartSubtotal() { return cart.reduce(function(s,i){ return s + i.price * i.qty; }, 0); }
function cartShipping() { return cartSubtotal() >= FREE_FROM ? 0 : SHIPPING; }
function cartGrand()    { return cartSubtotal() + cartShipping(); }
function cartCount()    { return cart.reduce(function(s,i){ return s + i.qty; }, 0); }

function openCart() {
  var o = document.getElementById('cartOverlay');
  var s = document.getElementById('cartSidebar');
  if(o) o.classList.add('open');
  if(s) s.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  var o = document.getElementById('cartOverlay');
  var s = document.getElementById('cartSidebar');
  if(o) o.classList.remove('open');
  if(s) s.classList.remove('open');
  document.body.style.overflow = '';
}

window.addToCart = function(id, name, price) {
  price = parseFloat(price);
  var found = false;
  for(var i = 0; i < cart.length; i++) {
    if(cart[i].id === id) { cart[i].qty++; found = true; break; }
  }
  if(!found) cart.push({ id: id, name: name, price: price, qty: 1 });
  cartSave(); cartRender(); openCart();
  cartToast('✓ ' + name + ' dodano do koszyka');
};

window.changeQty = function(id, delta) {
  for(var i = 0; i < cart.length; i++) {
    if(cart[i].id === id) {
      cart[i].qty = Math.max(0, cart[i].qty + delta);
      if(cart[i].qty === 0) cart.splice(i, 1);
      break;
    }
  }
  cartSave(); cartRender();
};

window.removeItem = function(id) {
  cart = cart.filter(function(i){ return i.id !== id; });
  cartSave(); cartRender();
};

function cartRender() {
  var c       = cartCount();
  var badge   = document.getElementById('cfBadge');
  var lbl     = document.getElementById('cartCountLabel');
  var items   = document.getElementById('cartItems');
  var empty   = document.getElementById('cartEmpty');
  var foot    = document.getElementById('cartFoot');
  var subEl   = document.getElementById('sidebarSubtotal');
  var shipEl  = document.getElementById('shippingCost');
  var totEl   = document.getElementById('sidebarTotal');
  var payBtn  = document.getElementById('btnToPay');
  var barEl   = document.getElementById('freeShippingBar');
  var msgEl   = document.getElementById('freeShippingMsg');

  if(badge) { badge.textContent = c; badge.className = 'cf-badge' + (c > 0 ? ' show' : ''); }
  if(lbl)   lbl.textContent = c > 0 ? '(' + c + ')' : '';
  if(!items) return;

  while(items.firstChild) items.removeChild(items.firstChild);

  if(cart.length === 0) {
    if(empty) { empty.style.display = 'flex'; items.appendChild(empty); }
    if(foot)  foot.style.display = 'none';
    if(payBtn) payBtn.disabled = true;
    return;
  }

  if(empty) empty.style.display = 'none';
  if(foot)  foot.style.display = 'block';
  if(payBtn) payBtn.disabled = false;

  for(var i = 0; i < cart.length; i++) {
    var item = cart[i];
    var row  = document.createElement('div');
    row.className = 'cart-item-row';
    row.innerHTML =
      '<div class="ci-thumb">' + item.name.substring(0,2).toUpperCase() + '</div>' +
      '<div class="ci-info">' +
        '<div class="ci-name">' + item.name + '</div>' +
        '<div class="ci-unit-price">' + cartFmt(item.price) + ' / szt.</div>' +
        '<div class="ci-qty-row">' +
          '<button class="cq-btn" onclick="changeQty(\'' + item.id + '\',-1)">−</button>' +
          '<span class="cq-n">' + item.qty + '</span>' +
          '<button class="cq-btn" onclick="changeQty(\'' + item.id + '\',1)">+</button>' +
        '</div>' +
      '</div>' +
      '<div class="ci-right">' +
        '<span class="ci-line">' + cartFmt(item.price * item.qty) + '</span>' +
        '<button class="ci-del" onclick="removeItem(\'' + item.id + '\')">Usuń</button>' +
      '</div>';
    items.appendChild(row);
  }

  var sub  = cartSubtotal();
  var ship = cartShipping();
  var left = FREE_FROM - sub;

  if(subEl) subEl.textContent = cartFmt(sub);
  if(totEl) totEl.textContent = cartFmt(cartGrand());

  if(shipEl) {
    if(ship === 0) { shipEl.textContent = 'Gratis ✓'; shipEl.style.color = '#d4f000'; }
    else           { shipEl.textContent = cartFmt(ship); shipEl.style.color = '#aaa'; }
  }

  if(barEl && msgEl) {
    if(ship === 0) {
      msgEl.textContent = '✓ Darmowa dostawa!';
      msgEl.style.color = '#d4f000';
      barEl.style.width = '100%';
    } else {
      msgEl.textContent = 'Jeszcze ' + cartFmt(left) + ' do darmowej dostawy';
      msgEl.style.color = '#555';
      barEl.style.width = Math.min(100, Math.round((sub / FREE_FROM) * 100)) + '%';
    }
  }

  if(payBtn) payBtn.textContent = 'Zapłać ' + cartFmt(cartGrand()) + ' →';
}

function goToStripe() {
  var btn = document.getElementById('btnToPay');
  if(cart.length === 0) return;
  if(btn) { btn.textContent = 'Przekierowuję...'; btn.disabled = true; }

  fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart, shipping: cartShipping() })
  })
  .then(function(res){ return res.json(); })
  .then(function(data){
    if(data.url) {
      window.location.href = data.url;
    } else {
      cartToast('⚠ Błąd: ' + (data.error || 'Spróbuj ponownie'));
      if(btn){ btn.textContent = 'Zapłać ' + cartFmt(cartGrand()) + ' →'; btn.disabled = false; }
    }
  })
  .catch(function(){
    cartToast('⚠ Problem z połączeniem. Spróbuj ponownie.');
    if(btn){ btn.textContent = 'Zapłać ' + cartFmt(cartGrand()) + ' →'; btn.disabled = false; }
  });
}

function cartToast(msg) {
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:90px;right:28px;background:#0e0e0e;border:1px solid #d4f000;color:#e8e8e8;font-family:"Space Mono",monospace;font-size:11px;letter-spacing:.1em;padding:12px 18px;border-radius:2px;z-index:9999;opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s;pointer-events:none;';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.style.opacity='1'; t.style.transform='translateY(0)'; }, 10);
  setTimeout(function(){ t.style.opacity='0'; setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 300); }, 3000);
}

document.addEventListener('DOMContentLoaded', function(){
  var floatBtn = document.getElementById('cartFloat');
  var closeBtn = document.getElementById('cartClose');
  var overlay  = document.getElementById('cartOverlay');
  var backBtn  = document.getElementById('btnBack');
  var toPayBtn = document.getElementById('btnToPay');

  if(floatBtn) floatBtn.addEventListener('click', openCart);
  if(closeBtn) closeBtn.addEventListener('click', closeCart);
  if(overlay)  overlay.addEventListener('click', closeCart);
  if(backBtn)  backBtn.addEventListener('click', closeCart);
  if(toPayBtn) toPayBtn.addEventListener('click', goToStripe);

  if(window.location.search.indexOf('cancelled=true') !== -1) {
    setTimeout(function(){ openCart(); cartToast('Płatność anulowana — koszyk czeka na Ciebie'); }, 500);
  }

  cartRender();
});
