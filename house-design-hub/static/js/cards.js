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

  HD.cardHTML = function (m) {
    return '<a class="card" href="/design/' + m.id + '">' +
      '<div class="thumb">' + HD.planSVG(thumbPlan(m), 0, { thumb: true }) + '</div>' +
      '<div class="body"><div class="name">' + HD.designName(m).replace(/</g, '&lt;') + '</div>' +
      '<div class="facts"><span>' + HD.num(m.built_area) + ' sq ft</span><span>' + HD.money(m.cost) + '</span><span>' + HD.t(m.facing) + '</span></div>' +
      '<div class="badges"><span class="badge">2D</span><span class="badge">3D</span><span class="badge">4D</span></div></div></a>';
  };

  HD.renderCards = function (el, items, append) {
    var html = items.map(HD.cardHTML).join('');
    if (append) el.insertAdjacentHTML('beforeend', html); else el.innerHTML = html;
  };
})();
