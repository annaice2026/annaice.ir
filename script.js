/* ANNA ICE DRINKS — small progressive enhancements. No dependencies. */
(function () {
  'use strict';

  /* --- mobile navigation --- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'باز کردن منو');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeNav();
    });
  }

  /* --- current year, in Persian digits --- */
  var yearEl = document.getElementById('year');
  if (yearEl) {
    try {
      yearEl.textContent = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(new Date());
    } catch (err) {
      /* keep the hard-coded fallback already in the markup */
    }
  }

  /* --- shopping basket --- */
  /* Prices in toman. Plain cups and every flavored cup share one price each. */
  var PRICES = { plain: 89000, flavored: 110000 };
  var MAX_QTY = 999;
  var CART_KEY = 'annaice-cart';
  var WHATSAPP = 'https://wa.me/989331330905';

  var numFa = null;
  try { numFa = new Intl.NumberFormat('fa-IR'); } catch (err) { /* fall back to latin digits */ }
  function fmt(n) { return numFa ? numFa.format(n) : String(n); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var catalog = {};
  var cart = [];

  var cartDialog = document.getElementById('cart');
  var cartOpenBtn = document.getElementById('cartOpen');
  var cartCount = document.getElementById('cartCount');
  var cartList = document.getElementById('cartList');
  var cartEmpty = document.getElementById('cartEmpty');
  var cartFoot = document.getElementById('cartFoot');
  var cartTotal = document.getElementById('cartTotal');
  var cartCheckout = document.getElementById('cartCheckout');

  function loadCart() {
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (err) { saved = []; }
    if (!Array.isArray(saved)) saved = [];
    /* keep only products that still exist on the page, with sane quantities */
    cart = saved.filter(function (line) {
      return line && catalog[line.id] && line.qty >= 1;
    }).map(function (line) {
      return { id: line.id, qty: Math.min(MAX_QTY, Math.floor(line.qty)) };
    });
  }

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (err) { /* storage unavailable: cart lives for this visit only */ }
  }

  function findLine(id) {
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i];
    return null;
  }

  function addToCart(id, qty) {
    var line = findLine(id);
    if (line) line.qty = Math.min(MAX_QTY, line.qty + qty);
    else cart.push({ id: id, qty: qty });
    saveCart();
    renderCart();
    if (cartCount) {
      cartCount.classList.remove('bump');
      void cartCount.offsetWidth; /* restart the animation */
      cartCount.classList.add('bump');
    }
  }

  function setQty(id, qty) {
    var line = findLine(id);
    if (!line) return;
    line.qty = Math.min(MAX_QTY, qty);
    saveCart();
    renderCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(function (line) { return line.id !== id; });
    saveCart();
    renderCart();
  }

  /* +1 / -1 on a product already in the basket; going below 1 removes it */
  function stepQty(id, step) {
    var line = findLine(id);
    if (!line) return;
    if (line.qty + step < 1) removeFromCart(id);
    else setQty(id, line.qty + step);
  }

  function qtyControl(label, qty, suffix) {
    return '<div class="qty" role="group" aria-label="' + esc(label) + '">' +
      '<button type="button" class="qty-btn" data-step="1" aria-label="افزایش تعداد"' + (qty >= MAX_QTY ? ' disabled' : '') + '>+</button>' +
      '<span class="qty-val" aria-live="polite">' + fmt(qty) + (suffix || '') + '</span>' +
      '<button type="button" class="qty-btn" data-step="-1" aria-label="' + (qty <= 1 ? 'حذف از سبد' : 'کاهش تعداد') + '">−</button>' +
      '</div>';
  }

  function renderCart() {
    if (!cartList) return;
    var count = 0;
    var total = 0;
    var lines = [];
    var html = '';

    cart.forEach(function (line) {
      var item = catalog[line.id];
      var sum = item.price * line.qty;
      count += line.qty;
      total += sum;
      lines.push('- ' + item.name + ' × ' + fmt(line.qty) + ' = ' + fmt(sum) + ' تومان');
      html +=
        '<li class="cart-item" data-id="' + esc(line.id) + '">' +
          '<div class="ci-info"><b>' + esc(item.name) + '</b><span>هر لیوان ' + fmt(item.price) + ' تومان</span></div>' +
          '<button type="button" class="ci-remove" aria-label="حذف ' + esc(item.name) + ' از سبد">حذف</button>' +
          qtyControl('تعداد ' + item.name, line.qty) +
          '<b class="ci-total">' + fmt(sum) + ' تومان</b>' +
        '</li>';
    });

    cartList.innerHTML = html;
    cartList.hidden = cart.length === 0;
    cartEmpty.hidden = cart.length > 0;
    cartFoot.hidden = cart.length === 0;
    cartTotal.textContent = fmt(total) + ' تومان';

    var message = 'سلام، سفارش از سایت آنا ایس:\n' + lines.join('\n') + '\nجمع کل: ' + fmt(total) + ' تومان';
    cartCheckout.href = WHATSAPP + '?text=' + encodeURIComponent(message);

    if (cartCount) {
      cartCount.textContent = fmt(count);
      cartCount.hidden = count === 0;
    }
    if (cartOpenBtn) {
      cartOpenBtn.setAttribute('aria-label', count ? 'سبد خرید، ' + fmt(count) + ' لیوان' : 'سبد خرید');
    }

    renderBuys();
  }

  /* product blocks on the page: "add" button, or the in-basket quantity once added */
  var buyBlocks = [];

  function renderBuys() {
    buyBlocks.forEach(function (box) {
      var id = box.getAttribute('data-id');
      var line = findLine(id);
      box.querySelector('.buy-action').innerHTML = line
        ? qtyControl('تعداد ' + catalog[id].name + ' در سبد', line.qty, ' در سبد')
        : '<button type="button" class="add-btn">افزودن به سبد</button>';
    });
  }

  /* re-rendering replaces the clicked button, so hand keyboard focus to its replacement */
  function refocus(scope, step) {
    var target = scope.querySelector(step ? '.qty-btn[data-step="' + step + '"]' : '.add-btn') ||
      scope.querySelector('.add-btn, .qty-btn');
    if (target) target.focus();
  }

  function mountBuy(container, id, name, price, showPrice) {
    catalog[id] = { name: name, price: price };
    buyBlocks.push(container);

    container.classList.add('buy');
    container.setAttribute('data-id', id);
    container.innerHTML =
      (showPrice ? '<p class="buy-price"><b>' + fmt(price) + '</b> تومان</p>' : '') +
      '<div class="buy-action"></div>';

    container.addEventListener('click', function (e) {
      var step = e.target.closest('.qty-btn');
      if (e.target.closest('.add-btn')) {
        addToCart(id, 1);
        refocus(container, '1');
      } else if (step) {
        stepQty(id, Number(step.getAttribute('data-step')));
        refocus(container, step.getAttribute('data-step'));
      }
    });
  }

  if (cartDialog && cartList) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-buy="plain"]'), function (el) {
      mountBuy(el, 'plain', 'یخ لیوانی ساده', PRICES.plain, false);
    });

    Array.prototype.forEach.call(document.querySelectorAll('.flavor'), function (li) {
      var img = li.querySelector('img');
      var title = li.querySelector('h3');
      var match = img && /annaice-yakh-livani-([a-z-]+)\.jpg/.exec(img.getAttribute('src'));
      if (!match || !title) return;
      var box = document.createElement('div');
      li.appendChild(box);
      mountBuy(box, 'flavor-' + match[1], 'یخ لیوانی طعم ' + title.textContent.trim(), PRICES.flavored, true);
    });

    loadCart();
    renderCart();

    function openCart() {
      if (typeof cartDialog.showModal === 'function') cartDialog.showModal();
      else cartDialog.setAttribute('open', '');
      document.body.classList.add('cart-open');
      closeNav();
    }

    function closeCart() {
      if (typeof cartDialog.close === 'function') cartDialog.close();
      else cartDialog.removeAttribute('open');
      document.body.classList.remove('cart-open');
    }

    if (cartOpenBtn) {
      cartOpenBtn.hidden = false;
      cartOpenBtn.addEventListener('click', openCart);
    }

    cartDialog.addEventListener('close', function () {
      document.body.classList.remove('cart-open');
    });

    cartDialog.addEventListener('click', function (e) {
      /* a click on the dialog itself (not the panel) is a click on the backdrop */
      if (e.target === cartDialog || e.target.closest('#cartClose') || e.target.closest('a[href^="#"]')) {
        closeCart();
        return;
      }

      var row = e.target.closest('.cart-item');
      if (!row) return;
      var id = row.getAttribute('data-id');
      var line = findLine(id);
      var step = e.target.closest('.qty-btn');

      if (step && line) {
        stepQty(id, Number(step.getAttribute('data-step')));
        var sameRow = cartList.querySelector('.cart-item[data-id="' + id + '"]');
        if (sameRow) refocus(sameRow, step.getAttribute('data-step'));
        else cartDialog.querySelector('#cartClose').focus();
      } else if (e.target.closest('.ci-remove')) {
        removeFromCart(id);
        cartDialog.querySelector('#cartClose').focus();
      }
    });

    document.getElementById('cartClear').addEventListener('click', function () {
      cart = [];
      saveCart();
      renderCart();
      cartDialog.querySelector('#cartClose').focus();
    });

    /* keep several open tabs in sync */
    window.addEventListener('storage', function (e) {
      if (e.key !== CART_KEY) return;
      loadCart();
      renderCart();
    });
  }

  /* --- reveal sections on scroll --- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll(
      '.section-head, .about-grid, .product-card, .flavor, .feature, .cov-card, .faq details, .contact-card'
    );

    Array.prototype.forEach.call(targets, function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity .6s ease ' + ((i % 6) * 60) + 'ms, transform .6s cubic-bezier(.2,.8,.3,1) ' + ((i % 6) * 60) + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'none';
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }
})();
