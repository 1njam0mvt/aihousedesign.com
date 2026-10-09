/* 2D floor plan renderer (inline SVG). */
(function () {
  var HD = (window.HD = window.HD || {});
  var LIGHT = {
    living: '#f6e7c8', kitchen: '#ffe0c2', dining: '#fbe9ad', bedroom: '#cfe8f7', master: '#bfdcf5', bath: '#bfeee6',
    porch: '#e3e0d6', verandah: '#e3e0d6', pooja: '#ffd9e4', balcony: '#d8f0c8', lounge: '#e8dcf7', stair: '#d9d9d9',
    store: '#e6d9c8', carport: '#d6dbe0', study: '#f0e1ff'
  };
  var ROT = { N: 0, E: -90, S: 180, W: 90 };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f1(n) { return (Math.round(n * 10) / 10).toString(); }

  /* plan: {plot:{w,d}, inner, facing, floor_list:[{level, rooms:[{type,x,y,w,h}]}]}
     opts: {thumb:true} for tiny cards, {theme:'light'} for standalone downloads */
  HD.planSVG = function (plan, level, opts) {
    opts = opts || {};
    var thumb = !!opts.thumb, light = opts.theme === 'light';
    var W = plan.plot.w, D = plan.plot.d, pad = thumb ? 1.5 : 7;
    var rooms = plan.floor_list[level].rooms;
    var ink = light ? '#1d2a2e' : 'var(--ink)';
    function fill(t) { return light ? (LIGHT[t] || '#eee') : 'var(--r-' + t + ')'; }
    var out = [];
    var vb = (-pad) + ' ' + (-pad) + ' ' + (W + 2 * pad) + ' ' + (D + 2 * pad);
    out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" role="img" aria-label="Floor plan">');
    if (light) out.push('<rect x="' + (-pad) + '" y="' + (-pad) + '" width="' + (W + 2 * pad) + '" height="' + (D + 2 * pad) + '" fill="#ffffff"/>');
    // road strip (front side)
    out.push('<rect x="' + (-pad) + '" y="' + (-pad) + '" width="' + (W + 2 * pad) + '" height="' + pad + '" style="fill:' + (light ? '#cfd4d1' : 'var(--road)') + '"/>');
    // plot boundary
    out.push('<rect x="0" y="0" width="' + W + '" height="' + D + '" fill="none" stroke="' + ink + '" stroke-opacity=".45" stroke-width="' + (thumb ? .4 : .35) + '" stroke-dasharray="2 1.5"/>');
    // rooms
    rooms.forEach(function (r) {
      out.push('<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + r.h + '" style="fill:' + fill(r.type) + '" stroke="' + ink + '" stroke-width="' + (thumb ? .3 : .3) + '"/>');
      if (thumb) return;
      if (r.type === 'stair') {
        var horiz = r.w >= r.h, n = 7, i, k;
        for (i = 1; i < n; i++) {
          k = i / n;
          out.push(horiz
            ? '<line x1="' + f1(r.x + r.w * k) + '" y1="' + (r.y + .4) + '" x2="' + f1(r.x + r.w * k) + '" y2="' + f1(r.y + r.h - .4) + '" stroke="' + ink + '" stroke-opacity=".5" stroke-width=".18"/>'
            : '<line x1="' + (r.x + .4) + '" y1="' + f1(r.y + r.h * k) + '" x2="' + f1(r.x + r.w - .4) + '" y2="' + f1(r.y + r.h * k) + '" stroke="' + ink + '" stroke-opacity=".5" stroke-width=".18"/>');
        }
      }
      var name = HD.t('room.' + r.type);
      var fs = Math.max(1.0, Math.min(2.3, Math.min(r.w, r.h) / 4));
      var need = name.length * 0.68 * fs;
      if (need > r.w - 0.6) fs = (r.w - 0.6) / (name.length * 0.68);
      var cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      if (fs >= 0.95) {
        out.push('<text x="' + f1(cx) + '" y="' + f1(cy - (r.h > 7 ? 0.3 : -0.35)) + '" font-size="' + f1(fs) + '" text-anchor="middle" fill="' + ink + '" font-weight="600">' + esc(name) + '</text>');
        if (r.w > 7 && r.h > 7) {
          out.push('<text x="' + f1(cx) + '" y="' + f1(cy + fs * 1.15) + '" font-size="' + f1(fs * 0.78) + '" text-anchor="middle" fill="' + ink + '" fill-opacity=".65">' + Math.round(r.w) + "'×" + Math.round(r.h) + "'</text>");
        }
      }
    });
    if (!thumb) {
      // outer wall emphasis
      var iN = plan.inner;
      out.push('<rect x="' + iN.x + '" y="' + iN.y + '" width="' + iN.w + '" height="' + iN.d + '" fill="none" stroke="' + ink + '" stroke-width=".7"/>');
      // road label
      out.push('<text x="' + f1(W / 2) + '" y="' + (-pad / 2 + 0.9) + '" font-size="2.2" text-anchor="middle" fill="' + ink + '" fill-opacity=".6">' + esc(HD.t('road')) + '</text>');
      // plot size
      out.push('<text x="' + f1(W / 2) + '" y="' + (D + 4.6) + '" font-size="2.2" text-anchor="middle" fill="' + ink + '" fill-opacity=".7">' + W + "' × " + D + "'</text>");
      // compass: arrow points to geographic north given which direction the road side faces
      var rot = ROT[plan.facing] || 0, cx0 = W - 4, cy0 = -pad / 2;
      out.push('<g transform="translate(' + cx0 + ' ' + cy0 + ') rotate(' + rot + ')"><circle r="2.8" fill="none" stroke="' + ink + '" stroke-opacity=".5" stroke-width=".25"/>' +
        '<path d="M0 -2.4 L1.1 1.2 L0 .5 L-1.1 1.2 Z" fill="' + ink + '"/></g>');
      out.push('<text x="' + cx0 + '" y="' + (cy0 + 0.5) + '" font-size="1.5" text-anchor="middle" fill="' + (light ? '#fff' : 'var(--surface)') + '" transform="translate(0 0)" opacity="0">N</text>');
    }
    out.push('</svg>');
    return out.join('');
  };

  HD.downloadPlanSVG = function (plan, level, filename) {
    var svg = HD.planSVG(plan, level, { theme: 'light' });
    var blob = new Blob([svg], { type: 'image/svg+xml' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (filename || 'house-plan') + '-floor' + (level + 1) + '.svg';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };
})();
