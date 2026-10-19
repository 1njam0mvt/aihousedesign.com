/* merge-v12.js: search pop-up, Villa Horizon dashboard, cost estimator, building guides.
 * Every block checks that its markup exists first, so this file is safe to load on every page. */
(function () {
    'use strict';
    var $ = function (id) { return document.getElementById(id); };
    var onIndex = !!$('villa-horizon');

    /* =====================================================================
     * 1. Search pop-up
     * ===================================================================== */
    (function search() {
        var modal = $('hdSearch'), btn = $('headerSearchBtn'), input = $('hdSearchInput');
        if (!modal || !btn || !input) return;
        var body = $('hdSearchBody'), empty = $('hdSearchEmpty'), form = $('hdSearchForm');
        var items = Array.prototype.slice.call(modal.querySelectorAll('.hd-search-item'));
        var heads = Array.prototype.slice.call(modal.querySelectorAll('.hd-search-h'));
        var all = document.createElement('a');                       // "search all designs" row, shown while typing
        all.className = 'hd-search-item hd-search-all'; all.hidden = true;
        all.innerHTML = '<span class="hd-search-tag">⌕</span><span class="hd-search-t"><strong></strong><small>Search the full house design gallery</small></span>';
        body.appendChild(all);
        var lastFocus = null, active = -1;

        function visible() { return items.concat([all]).filter(function (a) { return !a.hidden; }); }
        function setActive(i) {
            var v = visible();
            v.forEach(function (a) { a.classList.remove('is-active'); });
            active = v.length ? (i + v.length) % v.length : -1;
            if (active > -1) { v[active].classList.add('is-active'); v[active].scrollIntoView({ block: 'nearest' }); }
        }
        function filter() {
            var q = input.value.trim().toLowerCase(), shown = 0;
            items.forEach(function (a) {
                var hit = !q || (a.getAttribute('data-text') || '').indexOf(q) > -1 || a.textContent.toLowerCase().indexOf(q) > -1;
                a.hidden = !hit; if (hit) shown++;
            });
            heads.forEach(function (h) {
                var g = h.getAttribute('data-group');
                h.hidden = !items.some(function (a) { return a.getAttribute('data-group') === g && !a.hidden; });
            });
            all.hidden = !q;
            if (q) { all.href = form.getAttribute('action') + '?q=' + encodeURIComponent(input.value.trim()); all.querySelector('strong').textContent = 'Search all house designs for “' + input.value.trim() + '”'; }
            empty.hidden = !(q && !shown);
            setActive(-1);
        }
        function open() {
            lastFocus = document.activeElement;
            modal.hidden = false; document.documentElement.classList.add('hd-search-open');
            btn.setAttribute('aria-expanded', 'true');
            input.value = ''; filter(); body.scrollTop = 0;
            window.setTimeout(function () { input.focus(); }, 20);
        }
        function close() {
            if (modal.hidden) return;
            modal.hidden = true; document.documentElement.classList.remove('hd-search-open');
            btn.setAttribute('aria-expanded', 'false');
            if (lastFocus && lastFocus.focus) lastFocus.focus(); else btn.focus();
        }
        btn.addEventListener('click', function () { if (modal.hidden) open(); else close(); });
        $('hdSearchClose').addEventListener('click', close);
        modal.addEventListener('mousedown', function (e) { if (e.target === modal) close(); });
        input.addEventListener('input', filter);
        document.addEventListener('keydown', function (e) {
            if (modal.hidden) return;
            if (e.key === 'Escape') { e.preventDefault(); close(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active < 0 ? -1 : active - 1); }
            else if (e.key === 'Tab') {                                // keep focus inside the dialog
                var f = [input, $('hdSearchClose')].concat(visible()), i = f.indexOf(document.activeElement);
                if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
                else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
            }
        });
        form.addEventListener('submit', function (e) {
            var v = visible();
            if (active > -1 && v[active]) { e.preventDefault(); v[active].click(); return; }
            if (!input.value.trim()) e.preventDefault();               // nothing typed: stay open (same as the old panel's "required")
        });
        modal.addEventListener('click', function (e) {
            var a = e.target.closest ? e.target.closest('.hd-search-item') : null;
            if (!a) return;
            var stage = a.getAttribute('data-sstage');
            if (stage && onIndex) {                                    // already on the home page: jump to the Villa section
                e.preventDefault(); close(); window.HDVilla && window.HDVilla.set(Number(stage), true);
            }
        });
    })();

    /* =====================================================================
     * 2. Villa Horizon: stage switcher
     * ===================================================================== */
    (function villa() {
        var root = $('villa-horizon'), dataEl = $('vhData');
        if (!root || !dataEl) return;
        var stages; try { stages = JSON.parse(dataEl.textContent); } catch (e) { return; }
        var total = 180, img = $('vhImg'), base = img ? img.getAttribute('data-base') : '';
        var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-vh-stage]'));
        function text(id, v) { var el = $(id); if (el) el.textContent = v; }
        function set(n, scroll) {
            var s = stages.filter(function (x) { return x.id === n; })[0]; if (!s) return;
            root.setAttribute('data-vh-now', String(n));
            text('vhKStage', s.id + '. ' + s.name); text('vhKProg', s.progress + '% Target Completed');
            text('vhKCum', 'Cumulative: ' + s.cost); text('vhKDays', s.days + ' / ' + total + ' Days');
            text('vhKPhase', 'On Schedule (Phase ' + s.id + ' of 6)');
            text('vhNum', s.id); text('vhName', s.name + ': ' + s.subtitle); text('vhDesc', s.description);
            text('vhSpecC', s.concrete); text('vhSpecS', s.steel); text('vhSpecF', s.safety); text('vhSpecI', s.inspection);
            var ul = $('vhMile');
            if (ul) {
                ul.innerHTML = '';
                s.milestones.forEach(function (m) {
                    var li = document.createElement('li');
                    li.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg><span></span>';
                    li.lastChild.textContent = m; ul.appendChild(li);
                });
            }
            var tab = tabs.filter(function (t) { return Number(t.getAttribute('data-vh-stage')) === n; })[0];
            if (img && tab) { img.src = tab.getAttribute('data-img'); img.alt = s.name + ' stage of the Villa Horizon build'; }
            tabs.forEach(function (t) { var on = Number(t.getAttribute('data-vh-stage')) === n; t.classList.toggle('on', on); t.setAttribute('aria-pressed', String(on)); });
            if (scroll) root.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        }
        tabs.forEach(function (t) { t.addEventListener('click', function () { set(Number(t.getAttribute('data-vh-stage'))); }); });
        window.HDVilla = { set: set };
        // choosing a stage in the hero keeps the dashboard in step (autoplay does not)
        var hero = $('buildHero');
        if (hero) hero.addEventListener('click', function (e) {
            var b = e.target.closest ? e.target.closest('[data-build-step]') : null;
            if (b) set(Number(b.getAttribute('data-build-step')) + 1);
        });
        var m = /[?&]stage=(\d)/.exec(location.search);              // arrives from the search pop-up on other pages
        if (m && Number(m[1]) >= 1 && Number(m[1]) <= stages.length) set(Number(m[1]));
    })();

    /* =====================================================================
     * 3. Real-time construction cost estimator
     * ===================================================================== */
    (function estimator() {
        var root = $('cost-estimator'), area = $('ceArea');
        if (!root || !area) return;
        var floors = 2, rate = 275, tier = 'luxury';
        var floorFactor = { 1: 1, 2: 1.08, 3: 1.18 };
        var tierWord = { standard: 'standard', luxury: 'luxury', ultra: 'ultra high-end' };
        function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
        function calc() {
            var sq = Number(area.value);
            var baseCost = Math.round(sq * rate * floorFactor[floors]);
            var total = baseCost + ($('cePool').checked ? 45000 : 0) + ($('ceSolar').checked ? 22000 : 0);
            $('ceAreaVal').textContent = sq.toLocaleString('en-US') + ' sq ft (' + Math.round(sq * 0.0929) + ' m²)';
            area.style.setProperty('--fill', ((sq - area.min) / (area.max - area.min) * 100) + '%');
            $('ceTotal').textContent = money(total);
            $('ceDesc').textContent = 'Estimated build cost for a ' + sq + ' sq ft ' + tierWord[tier] + ' architectural home.';
            Array.prototype.forEach.call(root.querySelectorAll('[data-ce-stage]'), function (b) { b.textContent = money(baseCost * Number(b.getAttribute('data-ce-stage'))); });
            var saved = $('ceSaved'); if (saved) saved.hidden = true;
            return { sqft: sq, floors: floors, tier: tier, total: total };
        }
        function group(sel, attr, cb) {
            var btns = Array.prototype.slice.call(root.querySelectorAll(sel));
            btns.forEach(function (b) {
                b.addEventListener('click', function () {
                    btns.forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
                    cb(b); calc();
                });
            });
        }
        group('[data-floors]', 'floors', function (b) { floors = Number(b.getAttribute('data-floors')); });
        group('[data-tier]', 'tier', function (b) { rate = Number(b.getAttribute('data-rate')); tier = b.getAttribute('data-tier'); });
        ['input', 'change'].forEach(function (ev) { area.addEventListener(ev, calc); });
        $('cePool').addEventListener('change', calc); $('ceSolar').addEventListener('change', calc);
        $('ceSave').addEventListener('click', function () {
            var est = calc(), msg = $('ceSaved');
            try { localStorage.setItem('hd-estimate', JSON.stringify({ sqft: est.sqft, floors: est.floors, tier: est.tier, pool: $('cePool').checked, solar: $('ceSolar').checked, total: est.total, ts: Date.now() })); msg.textContent = 'Estimate of ' + money(est.total) + ' for ' + est.sqft.toLocaleString('en-US') + ' sq ft saved on this device.'; }
            catch (e) { msg.textContent = 'Could not save here (browser storage is disabled). Your estimate is ' + money(est.total) + '.'; }
            msg.hidden = false;
        });
        calc();
    })();

    /* =====================================================================
     * 4. Building guides accordion (one open at a time)
     * ===================================================================== */
    (function guides() {
        var root = $('building-guides'); if (!root) return;
        var items = Array.prototype.slice.call(root.querySelectorAll('.bg-item'));
        items.forEach(function (it) {
            var b = it.querySelector('.bg-toggle'), p = it.querySelector('.bg-panel');
            b.addEventListener('click', function () {
                var open = b.getAttribute('aria-expanded') === 'true';
                items.forEach(function (o) { o.classList.remove('open'); o.querySelector('.bg-toggle').setAttribute('aria-expanded', 'false'); o.querySelector('.bg-panel').hidden = true; });
                if (!open) { it.classList.add('open'); b.setAttribute('aria-expanded', 'true'); p.hidden = false; }
            });
        });
    })();
})();
