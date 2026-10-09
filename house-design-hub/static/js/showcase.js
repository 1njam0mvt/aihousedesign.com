/* Original house illustrations (inline SVG) for the home page: hero collage, style showcase, feature cards.
   Nothing here is a photo or a copy of another site; every picture is drawn from the style palettes below. */
(function () {
    var HD = (window.HD = window.HD || {});
    var uid = 0;

    // wall / roof / accent colours follow core/planner.py STYLES.  f = floors drawn, w = house width,
    // roof = flat | gable | shed, flags: bal(cony), ver(anda), car(port), glass (wide window), stilt, solar
    var CFG = {
        modern: { roof: 'flat', wall: '#ece8e1', rc: '#454b55', ac: '#d9822b', f: 2, w: 210, bal: 1, car: 1 },
        minimalist: { roof: 'flat', wall: '#f4f4f2', rc: '#6b7078', ac: '#222222', f: 1, w: 220, glass: 1 },
        contemporary: { roof: 'shed', wall: '#e2ddd3', rc: '#3b4048', ac: '#2f7f79', f: 2, w: 220, bal: 1, car: 1 },
        village: { roof: 'gable', wall: '#e8d3b0', rc: '#a4532f', ac: '#5b3a1e', f: 1, w: 200, ver: 1 },
        assam: { roof: 'gable', wall: '#d9c7a0', rc: '#3f6b4a', ac: '#6d4a2b', f: 1, w: 190, ver: 1, stilt: 1 },
        traditional: { roof: 'gable', wall: '#efe0c4', rc: '#8a3b24', ac: '#7a4a21', f: 2, w: 210, ver: 1 },
        duplex: { roof: 'flat', wall: '#ebe3d6', rc: '#5a5f68', ac: '#b5651d', f: 2, w: 190, bal: 1, car: 1 },
        passive: { roof: 'shed', wall: '#dfe8dc', rc: '#4c6a52', ac: '#7fa37a', f: 1, w: 220, solar: 1 },
        loft: { roof: 'shed', wall: '#d7d9dc', rc: '#2f3338', ac: '#e0a030', f: 2, w: 180, glass: 1 },
        farmhouse: { roof: 'gable', wall: '#f1ebe0', rc: '#6e4b3a', ac: '#9a6b3f', f: 1, w: 250, ver: 1 },
        bungalow: { roof: 'gable', wall: '#f0e6d2', rc: '#7c3f2a', ac: '#b08850', f: 1, w: 220, ver: 1, car: 1 },
        villa: { roof: 'flat', wall: '#f3efe8', rc: '#3d4249', ac: '#c8a24a', f: 2, w: 270, bal: 1, glass: 1 },
        lowcost: { roof: 'shed', wall: '#e7dcc6', rc: '#6f7c85', ac: '#8a6a45', f: 1, w: 160 },
        compact: { roof: 'flat', wall: '#eeeae2', rc: '#555b63', ac: '#3a7ca5', f: 2, w: 140, bal: 1 },
        mansion: { roof: 'flat', wall: '#f4efe6', rc: '#35393f', ac: '#b58b2a', f: 3, w: 290, bal: 1 }
    };
    var SKIES = [['#bfe6ff', '#effaff'], ['#ffd2a8', '#fff1dc'], ['#c9f2dd', '#f3fcea'], ['#d9d4ff', '#f6f3ff'], ['#ffd6e0', '#fff0f3']];
    var ORDER = Object.keys(CFG);

    function R(x, y, w, h, fill, extra) {
        return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (extra || '') + '/>';
    }
    function P(pts, fill, extra) {
        return '<polygon points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '" fill="' + fill + '"' + (extra || '') + '/>';
    }
    function tree(x, y, s) {
        return R(x - 3 * s, y - 26 * s, 6 * s, 26 * s, '#7a5a3a') +
            '<circle cx="' + x + '" cy="' + (y - 40 * s) + '" r="' + 22 * s + '" fill="#4fa860"/>' +
            '<circle cx="' + (x - 12 * s) + '" cy="' + (y - 30 * s) + '" r="' + 14 * s + '" fill="#5dbb70"/>' +
            '<circle cx="' + (x + 12 * s) + '" cy="' + (y - 32 * s) + '" r="' + 13 * s + '" fill="#43934f"/>';
    }
    function windowAt(x, y, w, h, lit) {
        var g = lit ? '#ffdc8f' : '#a9d6f5';
        return R(x, y, w, h, g, ' stroke="#ffffff" stroke-width="2.5" rx="2"') +
            '<path d="M' + (x + w / 2) + ' ' + y + 'v' + h + 'M' + x + ' ' + (y + h / 2) + 'h' + w + '" stroke="#ffffff" stroke-width="1.6"/>' +
            R(x - 2, y + h, w + 4, 3, 'rgba(0,0,0,.18)');
    }

    /* Front view of a house in the given style. opts: { sky: 0-4, dusk: bool } */
    HD.houseArt = function (style, opts) {
        var c = CFG[style] || CFG.modern;
        opts = opts || {};
        var idx = ORDER.indexOf(style); if (idx < 0) idx = 0;
        var sk = SKIES[(opts.sky != null ? opts.sky : idx) % SKIES.length];
        var dusk = opts.dusk != null ? opts.dusk : (sk[0] === '#ffd2a8' || sk[0] === '#d9d4ff');
        var id = 'ha' + (++uid);
        var W = c.w, f = c.f, fh = f === 3 ? 52 : 62, H = f * fh;
        var lift = c.stilt ? 16 : 0, ground = 240, hb = ground - lift;
        var total = W + (c.car ? 76 : 0), bx = Math.round((400 - total) / 2), cx = bx + W / 2, top = hb - H;
        var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">';
        s += '<defs><linearGradient id="' + id + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sk[0] + '"/><stop offset="1" stop-color="' + sk[1] + '"/></linearGradient>' +
            '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9bd68f"/><stop offset="1" stop-color="#78bb78"/></linearGradient></defs>';
        s += R(0, 0, 400, 300, 'url(#' + id + 's)');
        s += '<circle cx="' + (idx % 2 ? 70 : 335) + '" cy="52" r="22" fill="#fff6c9" opacity=".95"/>';
        s += '<g fill="#ffffff" opacity=".85"><ellipse cx="' + (idx % 2 ? 300 : 90) + '" cy="70" rx="38" ry="11"/><ellipse cx="' + (idx % 2 ? 325 : 115) + '" cy="62" rx="26" ry="10"/></g>';
        s += R(0, ground, 400, 60, 'url(#' + id + 'g)');
        s += P([[cx - 14, ground], [cx + 14, ground], [cx + 46, 300], [cx - 46, 300]], '#eadfca', ' opacity=".9"');

        // trees behind
        s += tree(34, ground + 4, 1) + tree(372, ground + 2, .85);

        // stilts
        if (c.stilt) {
            for (var k = 0; k <= 5; k++) s += R(bx + 6 + k * ((W - 18) / 5), hb, 6, lift, '#6d4a2b');
            s += P([[cx - 14, hb], [cx + 14, hb], [cx + 22, ground], [cx - 22, ground]], '#b8956a');
        }

        // wall body (+ slope for shed)
        if (c.roof === 'shed') {
            s += P([[bx, hb], [bx + W, hb], [bx + W, top - 34], [bx, top]], c.wall);
        } else {
            s += R(bx, top, W, H, c.wall);
        }
        s += R(bx + W * .86, top, W * .14, H, 'rgba(0,0,0,.07)');
        for (var i = 1; i < f; i++) s += R(bx, hb - i * fh - 2, W, 4, 'rgba(0,0,0,.14)');

        // roof
        if (c.roof === 'flat') {
            s += R(bx - 7, top - 9, W + 14, 9, c.rc) + R(bx - 7, top - 1, W + 14, 3, 'rgba(0,0,0,.2)');
        } else if (c.roof === 'gable') {
            s += P([[bx - 14, top], [cx, top - 56], [bx + W + 14, top]], c.rc);
            s += P([[bx - 14, top], [cx, top - 56], [cx, top - 50], [bx - 6, top]], 'rgba(255,255,255,.12)');
            s += R(bx - 14, top, W + 28, 4, 'rgba(0,0,0,.22)');
            s += '<circle cx="' + cx + '" cy="' + (top - 24) + '" r="7" fill="' + c.wall + '" stroke="' + c.ac + '" stroke-width="2.5"/>';
        } else {
            s += P([[bx - 8, top + 2], [bx + W + 8, top - 36], [bx + W + 8, top - 27], [bx - 8, top + 11]], c.rc);
            if (c.solar) {
                for (var p = 0; p < 4; p++) {
                    var x0 = bx + 14 + p * (W - 20) / 4, x1 = x0 + (W - 20) / 4 - 6;
                    var y = function (x) { return top + 2 - 38 * (x - (bx - 8)) / (W + 16); };
                    s += P([[x0, y(x0)], [x1, y(x1)], [x1, y(x1) - 8], [x0, y(x0) - 8]], '#1f4e8c', ' stroke="#9cc4f0" stroke-width="1"');
                }
            }
        }

        // windows + door
        var cols = W >= 250 ? 5 : W >= 175 ? 3 : 2, cw = W / cols, ww = Math.min(34, cw * .5), wh = 28;
        for (var fl = 0; fl < f; fl++) {
            var wy = hb - (fl + 1) * fh + 15;
            if (fl > 0 && c.glass) {
                s += windowAt(cx - W * .27, wy - 2, W * .54, wh + 8, dusk);
                continue;
            }
            for (var cc = 0; cc < cols; cc++) {
                var isDoor = fl === 0 && ((cols % 2 === 1 && cc === (cols - 1) / 2) || (cols === 2 && cc === 0));
                var wx = bx + cc * cw + (cw - ww) / 2;
                if (isDoor) continue;
                if (fl === 0 && c.glass) { s += windowAt(wx - 2, wy - 2, ww + 4, wh + 8, dusk); continue; }
                s += windowAt(wx, wy, ww, wh, dusk && ((cc + fl) % 2 === 0));
            }
        }
        var dc = cols === 2 ? bx + cw / 2 : cx;
        s += R(dc - 13, hb - 42, 26, 42, c.ac, ' rx="2"') + R(dc - 9, hb - 36, 18, 14, 'rgba(255,255,255,.28)', ' rx="1.5"') + '<circle cx="' + (dc + 8) + '" cy="' + (hb - 18) + '" r="2" fill="#fff6c9"/>';
        s += R(dc - 20, hb - 3, 40, 3, 'rgba(0,0,0,.2)');

        // balcony on first upper floor
        if (c.bal && f > 1) {
            var by = hb - fh - 1, bw = Math.min(110, W * .5);
            s += R(cx - bw / 2 - 4, by, bw + 8, 5, c.rc);
            for (var q = 0; q <= 10; q++) s += R(cx - bw / 2 + q * bw / 10 - 1, by - 20, 2, 20, c.rc);
            s += R(cx - bw / 2 - 4, by - 22, bw + 8, 3, c.rc);
        }
        // veranda
        if (c.ver) {
            s += R(bx - 10, hb - 50, W + 20, 6, c.rc) + R(bx - 10, hb - 44, W + 20, 3, 'rgba(0,0,0,.2)');
            for (var v = 0; v < 5; v++) s += R(bx - 6 + v * (W + 6) / 4, hb - 44, 5, 44, c.ac);
            s += R(bx - 12, hb, W + 24, 5, 'rgba(0,0,0,.14)');
        }
        // carport + car
        if (c.car) {
            var cpx = bx + W + 6;
            s += R(cpx, hb - 50, 70, 6, c.rc);
            s += R(cpx + 2, hb - 44, 4, 44, c.ac) + R(cpx + 62, hb - 44, 4, 44, c.ac);
            s += '<rect x="' + (cpx + 10) + '" y="' + (hb - 18) + '" width="50" height="14" rx="6" fill="#d8493e"/>' +
                '<rect x="' + (cpx + 18) + '" y="' + (hb - 27) + '" width="32" height="12" rx="5" fill="#e45a50"/>' +
                '<rect x="' + (cpx + 22) + '" y="' + (hb - 25) + '" width="11" height="8" rx="2" fill="#cfeaff"/><rect x="' + (cpx + 35) + '" y="' + (hb - 25) + '" width="11" height="8" rx="2" fill="#cfeaff"/>' +
                '<circle cx="' + (cpx + 22) + '" cy="' + (hb - 3) + '" r="5" fill="#2a2d33"/><circle cx="' + (cpx + 48) + '" cy="' + (hb - 3) + '" r="5" fill="#2a2d33"/>';
        }
        // shrubs
        var bushes = [bx - 6, bx + W * .22, bx + W * .78, bx + W + 2];
        for (var b = 0; b < bushes.length; b++) s += '<circle cx="' + bushes[b] + '" cy="' + (ground + 2) + '" r="' + (9 + (b % 2) * 3) + '" fill="' + (b % 2 ? '#3f9b55' : '#53b568') + '"/>';
        s += '<circle cx="' + (bx + W * .22) + '" cy="' + (ground - 3) + '" r="3" fill="#ff6b81"/><circle cx="' + (bx + W * .78 + 4) + '" cy="' + (ground - 1) + '" r="3" fill="#ffd166"/>';
        return s + '</svg>';
    };

    /* 2D floor plan picture */
    function planArt() {
        var rooms = [
            [20, 20, 120, 80, '#f6e7c8'], [140, 20, 70, 80, '#ffe0c2'], [210, 20, 90, 80, '#bfdcf5'],
            [20, 100, 70, 70, '#bfeee6'], [90, 100, 90, 70, '#fbe9ad'], [180, 100, 120, 70, '#cfe8f7']
        ];
        var s = '<svg viewBox="0 0 320 190" aria-hidden="true"><rect x="2" y="2" width="316" height="186" rx="10" fill="#fbfbf8"/>';
        rooms.forEach(function (r) { s += R(r[0], r[1], r[2], r[3], r[4], ' stroke="#3a4a50" stroke-width="3"'); });
        s += R(66, 97, 24, 6, '#fbfbf8') + R(137, 55, 6, 22, '#fbfbf8') + R(207, 55, 6, 22, '#fbfbf8') + R(176, 120, 6, 22, '#fbfbf8');
        s += '<path d="M20 180h280M20 176v8M300 176v8" stroke="#d9822b" stroke-width="2" fill="none"/>';
        s += '<circle cx="256" cy="136" r="9" fill="none" stroke="#3a4a50" stroke-width="2"/><path d="M200 140h30M200 128h30" stroke="#3a4a50" stroke-width="2"/>';
        return s + '</svg>';
    }
    /* 3D turntable picture */
    function cubeArt() {
        var s = '<svg viewBox="0 0 320 190" aria-hidden="true"><ellipse cx="160" cy="160" rx="110" ry="18" fill="rgba(0,0,0,.12)"/>' +
            '<ellipse cx="160" cy="150" rx="128" ry="26" fill="none" stroke="#0f766e" stroke-width="2" stroke-dasharray="6 7"/>' +
            '<path d="M283 144l8-10 3 13z" fill="#0f766e"/>';
        s += P([[90, 90], [160, 118], [160, 160], [90, 132]], '#e0d6c4') + P([[160, 118], [230, 90], [230, 132], [160, 160]], '#cdbfa6') + P([[90, 90], [160, 62], [230, 90], [160, 118]], '#efe8da');
        s += P([[84, 90], [160, 36], [236, 90], [160, 120]], '#a4532f') + P([[160, 36], [236, 90], [160, 120]], '#8a4326');
        s += P([[104, 104], [124, 112], [124, 130], [104, 122]], '#a9d6f5') + P([[176, 126], [210, 113], [210, 131], [176, 144]], '#a9d6f5');
        s += P([[138, 126], [152, 132], [152, 152], [138, 146]], '#d9822b');
        return s + '</svg>';
    }
    /* 4D construction stages (n = 1..4) */
    HD.stageArt = function (n) {
        var s = '<svg viewBox="0 0 120 90" aria-hidden="true">' + R(0, 70, 120, 20, '#9bd68f') + R(8, 66, 104, 6, n === 1 ? '#8c8c86' : '#c9c4b8');
        if (n >= 2) s += R(18, 30, 84, 36, n >= 4 ? '#efe0c4' : '#d8cdb5', n < 4 ? ' stroke="#8c8c86" stroke-dasharray="3 3"' : '');
        if (n >= 3) s += P([[10, 32], [60, 4], [110, 32]], n >= 4 ? '#a4532f' : '#b7a58a');
        if (n === 4) s += R(26, 40, 20, 16, '#a9d6f5') + R(74, 40, 20, 16, '#a9d6f5') + R(53, 44, 14, 22, '#d9822b');
        if (n === 1) s += R(18, 60, 84, 6, '#6f6f69');
        return s + '</svg>';
    };

    HD.renderShowcase = function (scope) {
        scope = scope || document;
        scope.querySelectorAll('[data-art]').forEach(function (el) {
            if (el.dataset.done) return;
            var k = el.getAttribute('data-art');
            if (k === 'plan') el.innerHTML = planArt();
            else if (k === 'cube') el.innerHTML = cubeArt();
            else el.innerHTML = HD.houseArt(k, el.dataset.dusk ? { dusk: true, sky: 1 } : null);
            el.dataset.done = '1';
        });
        scope.querySelectorAll('[data-stage]').forEach(function (el) {
            if (!el.dataset.done) { el.innerHTML = HD.stageArt(+el.getAttribute('data-stage')); el.dataset.done = '1'; }
        });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { HD.renderShowcase(); });
    else HD.renderShowcase();
})();