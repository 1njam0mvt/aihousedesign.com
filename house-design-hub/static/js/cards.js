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

  // Real photo/render if one exists: /static/img/designs/<id>.webp, else /static/img/designs/<style>-<beds>bhk.webp
  function realImage(m) {
    var have = (window.HD_IMG && window.HD_IMG.designs) || {};
    var key = have[m.id] ? String(m.id) : (have[m.style + '-' + m.beds + 'bhk'] ? m.style + '-' + m.beds + 'bhk' : null);
    if (!key) return null;
    return '<img src="/static/img/designs/' + key + '.webp" alt="' + HD.designName(m).replace(/[<>"&]/g, '') +
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