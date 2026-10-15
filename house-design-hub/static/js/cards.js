/* Gallery cards with a mini ground-floor plan thumbnail. */
(function () {
  var HD = (window.HD = window.HD || {});

  function thumbPlan(m) {
    var t = m.thumb;
    return {
      plot: t.plot, inner: t.inner, facing: m.facing,
      floor_list: [{ level: 0, rooms: t.rooms.map(function (r) { return { type: r[0], x: r[1], y: r[2], w: r[3], h: r[4] }; }) }]
    };
  }

  // Baseline thumbnail = a plain static image looked up by ID (designs/<id>, else designs/<style>-<N>bhk). It never loads 3D or layers;
  // those open only on the design page. No image => the drawn plan thumbnail.
  function realImage(m) {
    var have = (window.HD_IMG && window.HD_IMG.designs) || {};
    var key = have[m.id] ? String(m.id) : (have[m.style + '-' + m.beds + 'bhk'] ? m.style + '-' + m.beds + 'bhk' : null);
    if (!key) return null;
    var base = window.HD_ASSET ? window.HD_ASSET + '/designs/' : '/static/img/designs/';
    return '<img src="' + base + have[key] + '" alt="' + HD.designName(m).replace(/[<>"&]/g, '') +
      ' - 2D plan and 3D design" width="400" height="300" loading="lazy" decoding="async">';
  }

  HD.cardHTML = function (m) {
    var img = realImage(m);
    return '<a class="card" href="/design/' + m.id + '">' +
      '<div class="thumb' + (img ? ' has-img' : '') + '">' + (img || HD.planSVG(thumbPlan(m), 0, { thumb: true })) + '</div>' +
      '<div class="body"><div class="name">' + HD.designName(m).replace(/</g, '&lt;') + '</div>' +
      '<div class="facts"><span>' + HD.num(m.built_area) + ' sq ft</span><span>' + HD.money(m.cost) + '</span><span>' + HD.t(m.facing) + '</span></div>' +
      '<div class="badges"><span class="badge">2D</span><span class="badge">3D</span><span class="badge">4D</span></div></div></a>';
  };

  HD.renderCards = function (el, items, append) {
    var html = items.map(HD.cardHTML).join('');
    if (append) el.insertAdjacentHTML('beforeend', html); else el.innerHTML = html;
  };
})();