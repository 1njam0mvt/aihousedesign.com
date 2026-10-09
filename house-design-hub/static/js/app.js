/* Shared: theme toggle, mobile menu, language box + translation helpers. */
(function () {
  var HD = (window.HD = window.HD || {});
  HD.lang = 'en';
  HD.dict = {};

  // ---------- theme ----------
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeBtn');
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('hd-theme', t); } catch (e) { }
    document.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  }
  if (themeBtn) themeBtn.addEventListener('click', function () {
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // ---------- mobile menu ----------
  var menuBtn = document.getElementById('menuBtn'), nav = document.getElementById('nav');
  if (menuBtn) menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });

  // ---------- i18n ----------
  HD.t = function (k) { return HD.dict[k] != null ? HD.dict[k] : k; };

  HD.applyI18n = function (scope) {
    scope = scope || document;
    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (HD.dict[k] != null) el.textContent = HD.dict[k];
    });
    scope.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-ph');
      if (HD.dict[k] != null) el.setAttribute('placeholder', HD.dict[k]);
    });
  };

  HD.setLang = function (lang) {
    return fetch('/api/i18n/' + lang).then(function (r) { return r.json(); }).then(function (data) {
      HD.lang = data.lang;
      HD.dict = data.t;
      root.setAttribute('lang', data.lang);
      root.setAttribute('dir', data.dir);
      try { localStorage.setItem('hd-lang', data.lang); } catch (e) { }
      document.querySelectorAll('.lang-btn').forEach(function (b) {
        var on = b.dataset.lang === data.lang;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on);
        if (on) { var cur = document.getElementById('langCurrent'); if (cur) cur.textContent = b.textContent; }
      });
      HD.applyI18n();
      document.dispatchEvent(new CustomEvent('langchange', { detail: data.lang }));
    });
  };

  var langToggle = document.getElementById('langToggle'), langMenu = document.getElementById('langMenu');
  function langItems() { return Array.prototype.slice.call(document.querySelectorAll('.lang-btn')); }
  function closeLang(refocus) {
    if (!langMenu) return;
    langMenu.hidden = true; langToggle.setAttribute('aria-expanded', 'false');
    if (refocus) langToggle.focus();
  }
  function openLang() {
    langMenu.hidden = false; langToggle.setAttribute('aria-expanded', 'true');
    var cur = langMenu.querySelector('.lang-btn.active') || langItems()[0];
    if (cur) { cur.focus(); if (cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' }); }
  }
  if (langToggle) {
    langToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (langMenu.hidden) openLang(); else closeLang();
    });
    langToggle.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (langMenu.hidden) openLang(); }
    });
    langMenu.addEventListener('keydown', function (e) {
      var items = langItems(), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key === 'Tab') { closeLang(); }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('#langDd')) closeLang(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !langMenu.hidden) closeLang(true); });
  }
  document.querySelectorAll('.lang-btn').forEach(function (b) {
    b.addEventListener('click', function () { HD.setLang(b.dataset.lang); closeLang(true); });
  });

  // ---------- formatting helpers ----------
  HD.money = function (inr) { return '₹' + (inr / 100000).toFixed(1) + ' L'; };
  HD.num = function (n) { return Number(n).toLocaleString(HD.lang === 'en' ? 'en-IN' : HD.lang); };
  HD.designName = function (m) {
    var s = HD.t('style.' + m.style);
    return HD.t('design_name')
      .replace('{style}', s).replace('{beds}', m.beds).replace('{floors}', m.floors)
      .replace('{w}', m.w).replace('{d}', m.d);
  };

  var saved = 'en';
  try { saved = localStorage.getItem('hd-lang') || 'en'; } catch (e) { }
  HD.ready = HD.setLang(saved);
})();