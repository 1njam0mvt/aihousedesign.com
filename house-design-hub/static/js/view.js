/* Design view: 2D plan / 3D model / 4D timeline tabs + info panel. Used by design and designer pages. */
(function () {
  var HD = (window.HD = window.HD || {});

  HD.mountView = function (root, data) {
    if (root._cleanup) root._cleanup();
    var plan = data.plan, meta = data.meta, notes = data.notes || [];
    var level = 0, tab = '2d', viewer = null, playTimer = null;

    root.innerHTML =
      '<div class="tabs" role="tablist">' +
      '<button class="tab" role="tab" data-tab="2d" aria-selected="true" data-i18n="view_2d"></button>' +
      '<button class="tab" role="tab" data-tab="3d" aria-selected="false" data-i18n="view_3d"></button>' +
      '<button class="tab" role="tab" data-tab="4d" aria-selected="false" data-i18n="view_4d"></button></div>' +
      '<div class="view-grid"><div class="stage">' +
      '<div class="pane" data-pane="2d"><div class="floor-tabs"></div><div class="plan-host"></div></div>' +
      '<div class="pane" data-pane="3d" hidden><div class="viewer-host"></div>' +
      '<div class="viewer-ctl">' +
      '<label class="tl-only" hidden><span><span data-i18n="construction"></span>: <span class="stage-name"></span></span>' +
      '<input type="range" class="r-progress" min="0" max="100" value="100"></label>' +
      '<label><span><span data-i18n="time_of_day"></span>: <span class="hour-lbl">12:00</span></span>' +
      '<input type="range" class="r-hour" min="0" max="24" step="0.25" value="12"></label>' +
      '<label class="row"><input type="checkbox" class="c-rot"> <span data-i18n="rotate"></span></label>' +
      '<label class="row"><input type="checkbox" class="c-cut"> <span data-i18n="cutaway"></span></label>' +
      '<button class="btn tl-only" type="button" hidden><span class="play-lbl" data-i18n="play"></span></button>' +
      '</div><p class="hint" data-i18n="drag_hint"></p></div></div>' +
      '<aside class="info panel"></aside></div>';

    var $ = function (s) { return root.querySelector(s); };
    var floorTabs = $('.floor-tabs'), planHost = $('.plan-host'), info = $('.info');

    function render2D() {
      planHost.innerHTML = HD.planSVG(plan, level);
      floorTabs.innerHTML = plan.floor_list.map(function (f, i) {
        var label = i === 0 ? HD.t('ground') : HD.t('floor_label') + ' ' + i;
        return '<button class="tab" data-level="' + i + '" aria-selected="' + (i === level) + '">' + label + '</button>';
      }).join('');
      floorTabs.hidden = plan.floor_list.length < 2;
    }

    function renderInfo() {
      var rows = [
        ['style', HD.t('style.' + meta.style)], ['bedrooms', meta.beds], ['floors', meta.floors],
        ['plot', meta.w + "' × " + meta.d + "'"], ['facing', HD.t(meta.facing)],
        ['area', HD.num(plan.built_area) + ' sq ft'], ['cost', HD.money(plan.cost)]
      ];
      var h = '<h3>' + HD.designName(meta).replace(/</g, '&lt;') + '</h3>';
      rows.forEach(function (r) { h += '<div class="stat"><span>' + HD.t(r[0]) + '</span><span>' + r[1] + '</span></div>'; });
      h += '<h3 style="margin-top:14px">' + HD.t('rooms') + '</h3><ul class="room-list">';
      plan.floor_list.forEach(function (f, i) {
        if (plan.floor_list.length > 1) h += '<li class="lvl"><span>' + (i === 0 ? HD.t('ground') : HD.t('floor_label') + ' ' + i) + '</span></li>';
        f.rooms.forEach(function (r) {
          h += '<li><span>' + HD.t('room.' + r.type) + '</span><span>' + Math.round(r.w) + "'×" + Math.round(r.h) + "'</span></li>";
        });
      });
      h += '</ul>';
      h += '<button class="btn" type="button" data-act="dl">' + HD.t('download_svg') + '</button>';
      var q = new URLSearchParams({ style: meta.style, beds: meta.beds, floors: meta.floors, w: meta.w, d: meta.d, facing: meta.facing, variant: (meta.variant || 1) - 1 });
      h += '<a class="btn primary" href="/designer?' + q.toString() + '">' + HD.t('open_in_ai') + '</a>';
      if (notes.length) {
        h += '<div class="notes"><h3 style="margin-top:14px">' + HD.t('ai_notes_title') + '</h3><ul>' +
          notes.map(function (n) { return '<li>' + String(n).replace(/</g, '&lt;') + '</li>'; }).join('') + '</ul></div>';
      }
      info.innerHTML = h;
    }

    function ensureViewer() {
      if (viewer) return viewer;
      var host = $('.viewer-host');
      if (!window.THREE) {
        host.innerHTML = '<div class="viewer-msg">3D viewer could not load. Please check your internet connection (three.js is loaded from a CDN) and reload.</div>';
        return null;
      }
      try {
        viewer = new HD.HouseViewer(host, plan);
      } catch (e) {
        host.innerHTML = '<div class="viewer-msg">3D is not supported on this device / browser (WebGL is required).</div>';
        return null;
      }
      viewer.onStage = function (s) { $('.stage-name').textContent = HD.t(s); };
      viewer.setProgress(viewer.progress);
      return viewer;
    }

    function setTab(t) {
      tab = t;
      root.querySelectorAll('.tab[data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tab === t); });
      $('[data-pane="2d"]').hidden = t !== '2d';
      $('[data-pane="3d"]').hidden = t === '2d';
      root.querySelectorAll('.tl-only').forEach(function (el) { el.hidden = t !== '4d'; });
      stopPlay();
      if (t === '2d') { if (viewer) viewer.setActive(false); return; }
      var v = ensureViewer(); if (!v) return;
      v.setActive(true);
      if (t === '3d') { v.setProgress(1); $('.r-progress').value = 100; }
      else { v.setProgress(0.0); $('.r-progress').value = 0; }
    }

    function stopPlay() {
      if (playTimer) { clearInterval(playTimer); playTimer = null; }
      var l = $('.play-lbl'); if (l) { l.setAttribute('data-i18n', 'play'); l.textContent = HD.t('play'); }
    }

    function play() {
      if (playTimer) { stopPlay(); return; }
      var v = ensureViewer(); if (!v) return;
      if (v.progress >= 1) v.setProgress(0);
      var l = $('.play-lbl'); l.setAttribute('data-i18n', 'pause'); l.textContent = HD.t('pause');
      playTimer = setInterval(function () {
        var p = v.progress + 0.004;
        v.setProgress(p); $('.r-progress').value = Math.round(p * 100);
        if (p >= 1) stopPlay();
      }, 50);
    }

    root.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tab]'); if (t) return setTab(t.dataset.tab);
      var lv = e.target.closest('[data-level]'); if (lv) { level = +lv.dataset.level; return render2D(); }
      if (e.target.closest('[data-act="dl"]')) return HD.downloadPlanSVG(plan, level, 'house-design-' + (meta.id || 'ai'));
      if (e.target.closest('.btn.tl-only')) return play();
    });
    $('.r-progress').addEventListener('input', function (e) { stopPlay(); var v = ensureViewer(); if (v) v.setProgress(e.target.value / 100); });
    $('.r-hour').addEventListener('input', function (e) {
      var v = ensureViewer(); if (!v) return; v.setHour(+e.target.value);
      var h = +e.target.value; $('.hour-lbl').textContent = String(Math.floor(h) % 24).padStart(2, '0') + ':' + (h % 1 ? String(Math.round((h % 1) * 60)).padStart(2, '0') : '00');
    });
    $('.c-rot').addEventListener('change', function (e) { var v = ensureViewer(); if (v) v.autoRotate = e.target.checked; });
    $('.c-cut').addEventListener('change', function (e) { var v = ensureViewer(); if (v) v.setCutaway(e.target.checked); });

    function onLang() { render2D(); renderInfo(); HD.applyI18n(root); if (viewer) viewer.onStage && viewer.setProgress(viewer.progress); }
    document.addEventListener('langchange', onLang);

    root._cleanup = function () {
      stopPlay();
      document.removeEventListener('langchange', onLang);
      if (viewer) viewer.dispose();
      root._cleanup = null;
    };

    render2D(); renderInfo(); HD.applyI18n(root);
  };
})();
