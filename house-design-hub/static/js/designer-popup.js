/* designer-popup.js: the "AI House Designer" pop-up (opens from the Modern / Traditional / Minimalist / Luxury chips).
 * Six working tabs. Everything runs in the browser on real house photos: no external model is called.
 *  1 Generate High-Res  2 Create & Edit  3 Animate to Video  4 Analyze Photo  5 Analyze Video  6 High Thinking Engine */
(function () {
    'use strict';
    var chips = document.querySelectorAll('[data-style-pick]');
    if (!chips.length) return;
    var first = document.querySelector('img[src*="/static/img/"]');
    var IMG = first ? first.src.split('/img/')[0] + '/img/' : '/static/img/';
    var PHOTOS = { dusk: 'house-dusk.webp', white: 'house-white.webp', modern: 'feature-3d.webp', warm: 'feature-ai.webp', walls: 'build-stage-3-hd.webp' };
    var STYLES = {
        luxury: { photo: 'dusk', label: 'Contemporary Luxury', prompt: 'Modern two-story luxury villa with cedar wood louvers, glass balconies, warm ambient dusk lighting, and infinity pool' },
        modern: { photo: 'modern', label: 'Modern', prompt: 'Modern two-storey home with clean lines, flat roof, large glass windows and timber cladding in bright daylight' },
        minimalist: { photo: 'white', label: 'Minimalist', prompt: 'Minimalist white house with simple geometry, large glazing and a quiet landscaped garden, soft morning light' },
        traditional: { photo: 'warm', label: 'Traditional', prompt: 'Traditional family home with a pitched roof, stone and timber details and a covered veranda at golden hour' }
    };
    var STYLE_OPTS = ['Contemporary Luxury', 'Modern', 'Minimalist', 'Traditional', 'Passive Eco', 'Tropical Villa'];
    var cache = {};
    function load(url) {
        if (cache[url]) return cache[url];
        cache[url] = new Promise(function (ok, bad) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = bad; i.src = url; });
        return cache[url];
    }
    var photoUrl = function (k) { return IMG + PHOTOS[k]; };
    var $ = function (sel, r) { return (r || root).querySelector(sel); };
    var $$ = function (sel, r) { return Array.prototype.slice.call((r || root).querySelectorAll(sel)); };
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var ic = function (n) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; };

    var root, state = { style: 'luxury', src: null, srcName: '', last: null, vidSrc: null, tab: 0, lastFocus: null };
    var ASPECTS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
    var RES = [['1K', '1024x1024', 1024], ['2K', '2048x2048', 2048], ['4K', '4096x4096 Ultra', 3840]];
    var TABS = [['wand', '1. Generate High-Res'], ['sparkles', '2. Create & Edit'], ['video', '3. Animate to Video'], ['eye', '4. Analyze Photo'], ['filevideo', '5. Analyze Video'], ['brain', '6. High Thinking Engine']];

    /* ---------------------------------------------------------------- drawing helpers */
    function ratio(a) { var p = a.split(':'); return +p[0] / +p[1]; }
    function cover(ctx, img, w, h, zoom, ox, oy) {
        var s = Math.max(w / img.width, h / img.height) * (zoom || 1), dw = img.width * s, dh = img.height * s;
        ctx.drawImage(img, (w - dw) / 2 + (ox || 0) * w, (h - dh) / 2 + (oy || 0) * h, dw, dh);
    }
    function look(ctx, w, h, prompt) {                              // lighting / colour treatment from the prompt keywords
        var t = (prompt || '').toLowerCase(), f = 'contrast(1.04) saturate(1.06)', ov = null;
        if (/(dusk|sunset|golden|evening|warm|ambient)/.test(t)) { f = 'sepia(.26) saturate(1.28) contrast(1.08) brightness(.96)'; ov = ['rgba(40,70,140,.30)', 'rgba(255,150,40,.26)']; }
        if (/(night|moonlit|midnight)/.test(t)) { f = 'brightness(.62) contrast(1.18) saturate(.95)'; ov = ['rgba(10,25,80,.45)', 'rgba(255,170,60,.18)']; }
        if (/(morning|bright|sunny|daylight|clear sky)/.test(t)) f = 'brightness(1.08) saturate(1.16) contrast(1.05)';
        if (/(black and white|monochrome|b&w|grayscale|greyscale)/.test(t)) f = 'grayscale(1) contrast(1.12)';
        if (/(vivid|vibrant|saturated|colorful|colourful)/.test(t)) f = 'saturate(1.55) contrast(1.08)';
        if (/(moody|overcast|rain|cloudy|fog)/.test(t)) { f = 'saturate(.72) contrast(1.12) brightness(.92)'; ov = ['rgba(60,80,100,.22)', 'rgba(60,80,100,.08)']; }
        return { filter: f, overlay: ov };
    }
    function paint(canvas, img, w, h, prompt, zoom, ox, oy) {
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d'), L = look(ctx, w, h, prompt);
        ctx.save(); if ('filter' in ctx) ctx.filter = L.filter; cover(ctx, img, w, h, zoom, ox, oy); ctx.restore();
        if (L.overlay) { var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, L.overlay[0]); g.addColorStop(1, L.overlay[1]); ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore(); }
        var v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .45, w / 2, h / 2, Math.max(w, h) * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.16)'); ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    }
    function save(canvas, name) { canvas.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); }, 'image/png'); }
    function fileToImg(file) { return new Promise(function (ok, bad) { var r = new FileReader(); r.onload = function () { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = bad; i.src = r.result; }; r.onerror = bad; r.readAsDataURL(file); }); }
    function progress(box, text, ms) {
        box.innerHTML = '<div class="ast-wait"><div class="ast-spin"></div><span>' + esc(text) + '</span><div class="ast-bar"><i></i></div></div>';
        var bar = box.querySelector('.ast-bar i'); requestAnimationFrame(function () { bar.style.transitionDuration = ms + 'ms'; bar.style.width = '100%'; });
        return new Promise(function (ok) { setTimeout(ok, ms); });
    }

    /* ---------------------------------------------------------------- pixel analysis (real, colour-based) */
    function classify(img, W) {
        var H = Math.max(40, Math.round(W * (img.videoHeight || img.height) / (img.videoWidth || img.width))), c = document.createElement('canvas'); c.width = W; c.height = H;
        var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, W, H);
        var d = x.getImageData(0, 0, W, H).data, n = W * H, k = { sky: 0, vegetation: 0, brick: 0, timber: 0, water: 0, earth: 0, white: 0, concrete: 0, glass: 0, other: 0 }, lumSum = 0;
        for (var i = 0, p = 0; i < d.length; i += 4, p++) {
            var r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0, lum = .299 * r + .587 * g + .114 * b, y = Math.floor(p / W) / H;
            lumSum += lum;
            if (y < .6 && b > r + 12 && b >= g - 8 && lum > 105) k.sky++;
            else if (y > .45 && b > r + 25 && b > g + 5 && lum > 80) k.water++;
            else if (g > r + 10 && g > b + 10 && lum < 200) k.vegetation++;
            else if (r > 120 && r > g + 30 && g > b - 5 && sat > .35 && g < r * .82 && b < g * .9) k.brick++;
            else if (r > 170 && g > r * .7 && b < 110 && r > g + 10 && sat > .5) k.timber++;
            else if (r > g && g >= b && r - b > 22 && sat > .14 && sat < .6 && lum > 70 && lum < 200 && r <= g + 45) k.earth++;
            else if (lum > 195 && sat < .16) k.white++;
            else if (sat < .17 && lum >= 80) k.concrete++;
            else if (lum < 62) k.glass++;
            else k.other++;
        }
        var out = {}; Object.keys(k).forEach(function (m) { out[m] = k[m] * 100 / n; });
        out.brightness = lumSum / n; return out;
    }
    var STAGE_NAMES = ['Foundation', 'Structure', 'Walls', 'Roof', 'Finishing', 'Completed'];
    function guessStage(m) {
        var s = [Math.max(0, m.earth - 18) * 5 + m.concrete * .5 - m.sky * .4,
        m.concrete * 1.3 + m.sky * .6 - m.brick * 1.5 - m.white * .8 - m.earth * .3,
        (m.brick > 6 ? m.brick * 5 : m.brick * 2) + m.concrete * .3,
        m.white * 1.2 + m.concrete * .9 - m.sky * .3 + m.timber * 4 - m.glass * .2,
        m.white * 1.6 + m.vegetation * 1.2 + m.glass * .4 - m.concrete * .4 + m.earth * .1,
        m.glass * 1.4 + m.water * 2 + m.vegetation * .8 + m.brick * .3 - m.sky * .4], best = 0;
        for (var i = 1; i < 6; i++) if (s[i] > s[best]) best = i;
        var sorted = s.slice().sort(function (a, b) { return b - a; }), margin = sorted[0] ? (sorted[0] - sorted[1]) / sorted[0] : 0;
        var second = s.indexOf(sorted[1]);
        return { idx: best, second: second, conf: margin > .3 ? 'high' : margin > .12 ? 'medium' : 'low' };
    }
    var NOTES = [
        ['Check drainage channels and waterproof membrane continuity before backfilling.', 'Confirm rebar cover (minimum 50 mm) and bearing test records for the raft.', 'Keep excavation edges shored; watch for water ingress after rain.'],
        ['Verify column plumb and formwork stripping times against the curing schedule.', 'Cure slabs for at least 14 days before loading trusses or masonry.', 'Confirm scaffold ties and edge protection on every open slab edge.'],
        ['Inspect lintels over every opening and masonry bond pattern for continuity.', 'Rough-in plumbing and conduit risers before closing walls with insulation.', 'Check wall plumb and mortar joint thickness (typically 10 mm).'],
        ['Confirm roof slab falls to outlets (1:80 minimum) and waterproofing laps.', 'Test parapet drainage and truss or purlin fixings before cladding.', 'Provide fall protection around the full roof perimeter.'],
        ['Check glazing seals, thermal breaks and facade finishing tolerances.', 'Commission HVAC, electrical and plumbing tests before handover.', 'Protect finished surfaces and keep a punch list per room.'],
        ['Run final inspections: structure, fire safety, electrical and water tightness.', 'Collect as-built drawings, warranties and the occupancy paperwork.', 'Plan landscaping drainage and exterior lighting commissioning.']
    ];
    var MAT = [['brick', 'Brick / terracotta masonry', '#d9663d'], ['concrete', 'Concrete / grey surfaces', '#94a3b8'], ['white', 'White render / plaster', '#e2e8f0'], ['timber', 'Timber / roof framing', '#e0a52a'], ['glass', 'Glazing / dark openings', '#334155'], ['vegetation', 'Vegetation', '#34a853'], ['sky', 'Sky', '#60a5fa'], ['earth', 'Soil / excavation', '#a16d3f'], ['water', 'Water / pool', '#22d3ee']];
    function report(m, title) {
        var g = guessStage(m), rows = MAT.filter(function (r) { return m[r[0]] >= 1.5; }).sort(function (a, b) { return m[b[0]] - m[a[0]]; }).slice(0, 6);
        var light = m.brightness > 150 ? 'Bright, well-lit scene' : m.brightness > 95 ? 'Balanced daylight' : 'Low light / dusk exposure';
        return '<div class="ast-rep"><h5>' + esc(title) + '</h5><p class="ast-big">Likely stage: <b>' + STAGE_NAMES[g.idx] + '</b> <small>(' + g.conf + ' confidence)</small></p>' +
            '<div class="ast-mats">' + rows.map(function (r) { return '<div><span>' + r[1] + '</span><i><b style="width:' + Math.min(100, Math.round(m[r[0]] * 2.2)) + '%;background:' + r[2] + '"></b></i><em>' + Math.round(m[r[0]]) + '%</em></div>'; }).join('') + '</div>' +
            '<p class="ast-mini"><b>Conditions:</b> ' + light + '.</p><ul>' + NOTES[g.idx].map(function (n) { return '<li>' + ic('check') + n + '</li>'; }).join('') + '</ul>' +
            '<p class="ast-fine">Estimated from the colours in the image. It does not replace a site inspection by a licensed engineer.</p></div>';
    }

    /* ---------------------------------------------------------------- engineering rule engine (tab 6) */
    function engineering(q) {
        var t = q.toLowerCase().replace(/,/g, ''), num = function (re, d) { var m = re.exec(t); return m ? parseFloat(m[1]) : d; };
        var sqft = num(/(\d{3,5}(?:\.\d+)?)\s*(?:sq\.?\s*ft|sqft|square f)/, 3850), fl = num(/(\d)\s*[- ]?\s*(?:story|storey|floor|stories)/, 2), zone = num(/zone\s*(\d|iv|v|ii|iii)/, 3);
        var zm = /zone\s*(iv|v|iii|ii)/.exec(t); if (zm) zone = { ii: 2, iii: 3, iv: 4, v: 5 }[zm[1]];
        var lat = num(/latitude\s*(\d{1,2}(?:\.\d+)?)/, 26), Z = { 2: .10, 3: .16, 4: .24, 5: .36 }[zone] || .16;
        var area = sqft * .0929, W = area * 10, Ah = (Z / 2) * (1 / 4) * 2.5, Vb = Ah * W, Vu = 1.5 * Vb, L = Vu / 100;
        var altS = 90 - lat + 23.45, altW = 90 - lat - 23.45, altD = Math.min(altS, 75), H = 2.4, Ds = H / Math.tan(altD * Math.PI / 180), gap = .45, Dw = gap / Math.tan(altW * Math.PI / 180);
        var f = function (v, n) { return v.toFixed(n === undefined ? 1 : n); }, out = '';
        out += '<div class="ast-rep"><h5>Engineering assessment (preliminary)</h5><p class="ast-mini"><b>Inputs read from your query:</b> ' + Math.round(sqft).toLocaleString('en-US') + ' sq ft (' + f(area, 0) + ' m²), ' + fl + ' floors, seismic zone ' + zone + ' (Z = ' + Z + '), latitude ' + lat + '°.</p>';
        out += '<div class="ast-steps"><div><b>1. Seismic base shear</b><span>W ≈ ' + f(W, 0) + ' kN (10 kN/m² all floors). Ah = (Z/2)·(I/R)·(Sa/g) = ' + f(Ah, 3) + ' with I = 1, R = 4, Sa/g = 2.5. Vb = Ah·W ≈ <b>' + f(Vb, 0) + ' kN</b>.</span></div>';
        out += '<div class="ast-steps-i"><b>2. Shear wall sizing</b><span>Design shear Vu = 1.5·Vb ≈ ' + f(Vu, 0) + ' kN per direction. With 200 mm walls at 0.5 MPa, provide about <b>' + f(L, 1) + ' m</b> of wall length in each plan direction, spread symmetrically.</span></div>';
        out += '<div class="ast-steps-i"><b>3. Wall reinforcement</b><span>Minimum 0.25% steel each way: <b>10 mm bars at 200 mm c/c on each face</b> (vertical and horizontal), with boundary elements of 4 No. 16 mm bars confined by 8 mm ties at 100 mm c/c.</span></div>';
        out += '<div class="ast-steps-i"><b>4. Passive solar overhang</b><span>Noon sun altitude is ' + f(altS, 0) + '° in summer and ' + f(altW, 0) + '° in winter. For ' + H + ' m windows an overhang of <b>' + f(Ds, 2) + ' m</b> shades them in summer; to keep winter sun on the glass keep it under ' + f(Dw, 2) + ' m with a ' + gap + ' m head gap, or use adjustable louvers. A fixed depth of about <b>' + f(Math.min(Ds, Math.max(Dw, .5)), 2) + ' m</b> with louvers is a good compromise.</span></div>';
        if (/hvac|cooling|heating|ventilation/.test(t)) out += '<div class="ast-steps-i"><b>5. HVAC balance</b><span>Cooling load ≈ 120 W/m² → about <b>' + f(area * 120 / 3517, 1) + ' TR</b> for the whole house. Shading and insulation can cut this by 20 to 30%.</span></div>';
        if (/zoning|setback|permit/.test(t)) out += '<div class="ast-steps-i"><b>5. Zoning</b><span>Confirm plot coverage, height limit and side setbacks with your municipality before design freeze (see the permit checklist in the guides).</span></div>';
        out += '</div><p class="ast-fine">Preliminary hand-calculation based on simplified IS 1893-style factors. Final design must be verified and stamped by a licensed structural engineer.</p></div>';
        return out;
    }

    /* ---------------------------------------------------------------- tab views */
    function dropdown(id, opts, val) { return '<div class="ast-sel"><select id="' + id + '">' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>' + ic('chev-d') + '</div>'; }
    var VIEWS = [
        function () {
            return '<div class="ast-two"><div><label class="ast-l" for="gPrompt">Architectural prompt</label><textarea id="gPrompt" rows="3"></textarea>' +
                '<div class="ast-lr"><span class="ast-l">Aspect ratio</span><em id="gAspNote">16:9</em></div><div class="ast-grid4" id="gAsp">' + ASPECTS.map(function (a) { return '<button type="button" data-v="' + a + '"' + (a === '16:9' ? ' class="on"' : '') + '>' + a + '</button>'; }).join('') + '</div>' +
                '<div class="ast-lr"><span class="ast-l">Resolution quality (image size)</span><em id="gResNote">2K</em></div><div class="ast-grid3" id="gRes">' + RES.map(function (r) { return '<button type="button" data-v="' + r[0] + '"' + (r[0] === '2K' ? ' class="on"' : '') + '><b>' + r[0] + '</b><small>' + r[1] + '</small></button>'; }).join('') + '</div>' +
                '<span class="ast-l">Architectural style</span>' + dropdown('gStyle', STYLE_OPTS, 'Contemporary Luxury') + '<button type="button" class="ast-go" id="gGo">' + ic('wand') + '<span>Generate 2K Render (16:9)</span></button></div>' +
                '<div><span class="ast-l">Output preview</span><div class="ast-out" id="gOut"><p class="ast-hint">Press Generate to create a render</p></div><div class="ast-acts" id="gActs" hidden><button type="button" id="gDl">' + ic('download') + 'Download PNG</button><button type="button" id="gUse">' + ic('video') + 'Animate this render</button></div></div></div>';
        },
        function () {
            return '<div class="ast-ban ast-green">' + ic('sparkles') + '<div><b>Create &amp; Edit</b><span>Describe a change in lighting, colour or mood and apply it to any house render or to your own photo.</span></div></div>' +
                '<div class="ast-two ast-two-eq"><div><span class="ast-l">Source image</span><div class="ast-out ast-src" id="eSrc"><label class="ast-up">' + ic('upload') + 'Upload Custom Photo<input type="file" accept="image/*" id="eFile" hidden></label></div></div><div><span class="ast-l">Edited output</span><div class="ast-out ast-dark" id="eOut"><p class="ast-hint">Ready for edit prompt</p></div></div></div>' +
                '<span class="ast-l">Modification prompt</span><div class="ast-row"><input id="ePrompt" type="text" value="Add warm ambient dusk lighting with a golden sunset glow"><button type="button" class="ast-go ast-inline" id="eGo">' + ic('sparkles') + 'Apply AI Edit</button></div><div class="ast-acts" id="eActs" hidden><button type="button" id="eDl">' + ic('download') + 'Download PNG</button></div><p class="ast-fine">Applies lighting, colour and mood edits such as dusk, night, morning, vivid, moody or black and white.</p>';
        },
        function () {
            return '<div class="ast-ban ast-blue">' + ic('video') + '<div><b>Animate to Video</b><span>Turn any house render into a cinematic walkthrough or drone flythrough. Supports 16:9 landscape or 9:16 portrait.</span></div></div>' +
                '<div class="ast-two ast-two-eq"><div><label class="ast-l" for="vPrompt">Video prompt</label><textarea id="vPrompt" rows="3">Cinematic aerial drone flythrough orbiting the modern villa at golden hour dusk, showing full architectural scale</textarea>' +
                '<span class="ast-l">Aspect ratio</span><div class="ast-grid2" id="vAsp"><button type="button" class="on" data-v="16:9">16:9 (Landscape Desktop)</button><button type="button" data-v="9:16">9:16 (Portrait Mobile)</button></div><button type="button" class="ast-go" id="vGo">' + ic('video') + '<span>Generate Flythrough (16:9)</span></button></div>' +
                '<div><span class="ast-l">Video output</span><div class="ast-out ast-black" id="vOut"><p class="ast-hint">' + ic('video') + '<br>Flythrough output</p></div><div class="ast-acts" id="vActs" hidden><button type="button" id="vDl">' + ic('download') + 'Download video</button></div></div></div>';
        },
        function () {
            return '<div class="ast-ban ast-amber">' + ic('eye') + '<div><b>Photo analysis</b><span>Upload any house, blueprint or site photo for a material breakdown, construction-stage detection and condition notes.</span></div></div>' +
                '<div class="ast-two ast-two-eq"><div><div class="ast-out ast-src" id="aSrc"><label class="ast-up">' + ic('upload') + 'Upload Blueprint/Photo<input type="file" accept="image/*" id="aFile" hidden></label></div><button type="button" class="ast-go" id="aGo">' + ic('eye') + '<span>Run Photo Analysis</span></button></div>' +
                '<div class="ast-panel" id="aOut"><h5>Architectural &amp; structural report</h5><p class="ast-hint">Click the button on the left to analyze the photo</p></div></div>';
        },
        function () {
            return '<div class="ast-ban ast-purple">' + ic('filevideo') + '<div><b>Video analysis</b><span>Scans construction-site walkthrough footage for stage verification, worker safety and timeline checks.</span></div></div>' +
                '<div class="ast-drop" id="mDrop">' + ic('video') + '<p>Upload drone footage or click analyze to review the current site inspection</p><input type="file" accept="video/*" id="mFile" hidden><div class="ast-acts"><button type="button" id="mPick">' + ic('upload') + 'Choose video</button><button type="button" class="ast-go ast-inline" id="mGo">' + ic('filevideo') + 'Inspect Construction Progress</button></div></div><div class="ast-panel" id="mOut" hidden></div>';
        },
        function () {
            return '<div class="ast-ban ast-teal">' + ic('brain') + '<div><b>High-thinking engineering</b><span>Works through structural load, shear wall, passive solar and HVAC questions step by step.</span></div></div>' +
                '<label class="ast-l" for="tQ">Complex engineering query</label><textarea id="tQ" rows="4">Calculate structural shear wall reinforcement and passive solar overhang depth for a 3,850 sq ft 2-story concrete &amp; wood villa located in an area with seismic zone 3.</textarea>' +
                '<button type="button" class="ast-go" id="tGo">' + ic('brain') + '<span>Run High Thinking Engineering Simulation</span></button><div class="ast-panel" id="tOut" hidden></div>';
        }
    ];

    /* ---------------------------------------------------------------- tab behaviours */
    var BIND = [
        function () {
            var asp = '16:9', res = '2K', area = $('#gOut');
            $('#gPrompt').value = STYLES[state.style].prompt; $('#gStyle').value = STYLES[state.style].label;
            function lab() { $('#gGo span').textContent = 'Generate ' + res + ' Render (' + asp + ')'; $('#gAspNote').textContent = asp; $('#gResNote').textContent = res; area.style.aspectRatio = asp.replace(':', '/'); }
            function pick(box, cb) { $$('button', $(box)).forEach(function (b) { b.onclick = function () { $$('button', $(box)).forEach(function (x) { x.classList.toggle('on', x === b); }); cb(b.getAttribute('data-v')); lab(); }; }); }
            pick('#gAsp', function (v) { asp = v; }); pick('#gRes', function (v) { res = v; }); lab();
            $('#gStyle').onchange = function () { var k = Object.keys(STYLES).filter(function (s) { return STYLES[s].label === $('#gStyle').value; })[0]; if (k) { state.style = k; $('#gPrompt').value = STYLES[k].prompt; } };
            $('#gGo').onclick = function () {
                var btn = $('#gGo'), prompt = $('#gPrompt').value, st = $('#gStyle').value, key = Object.keys(STYLES).filter(function (s) { return STYLES[s].label === st; })[0] || (/(minimal|white)/i.test(st + prompt) ? 'minimalist' : /(tradition|stone|veranda)/i.test(prompt) ? 'traditional' : /(dusk|luxury|pool|villa)/i.test(prompt) ? 'luxury' : 'modern');
                btn.disabled = true; $('#gActs').hidden = true;
                Promise.all([progress(area, 'Rendering ' + res + ' image…', 1700), load(photoUrl(STYLES[key].photo))]).then(function (r) {
                    var cv = document.createElement('canvas'), long = RES.filter(function (x) { return x[0] === res; })[0][2], k = ratio(asp), w = k >= 1 ? long : Math.round(long * k), h = k >= 1 ? Math.round(long / k) : long;
                    paint(cv, r[1], w, h, prompt); cv.className = 'ast-cv'; area.innerHTML = ''; area.appendChild(cv); state.last = cv; state.src = r[1]; state.srcName = STYLES[key].photo;
                    $('#gActs').hidden = false; btn.disabled = false;
                });
            };
            $('#gDl').onclick = function () { if (state.last) save(state.last, 'ai-houses-render.png'); };
            $('#gUse').onclick = function () { setTab(2); };
        },
        function () {
            var src = $('#eSrc'), out = $('#eOut'), cur = null;
            function show(img) { cur = img; state.src = img; var c = src.querySelector('canvas') || document.createElement('canvas'); paint(c, img, 960, 600, ''); c.className = 'ast-cv'; if (!c.parentNode) src.insertBefore(c, src.firstChild); }
            (state.src ? Promise.resolve(state.src) : load(photoUrl(STYLES[state.style].photo))).then(show);
            $('#eFile').onchange = function (e) { var f = e.target.files[0]; if (f) fileToImg(f).then(show); };
            $('#eGo').onclick = function () {
                if (!cur) return; var b = $('#eGo'); b.disabled = true; $('#eActs').hidden = true;
                progress(out, 'Applying edit…', 1300).then(function () { var cv = document.createElement('canvas'), k = Math.min(1, 1600 / cur.width); paint(cv, cur, Math.round(cur.width * k), Math.round(cur.height * k), $('#ePrompt').value); cv.className = 'ast-cv'; out.innerHTML = ''; out.appendChild(cv); state.last = cv; $('#eActs').hidden = false; b.disabled = false; });
            };
            $('#eDl').onclick = function () { if (state.last) save(state.last, 'ai-houses-edit.png'); };
        },
        function () {
            var asp = '16:9', out = $('#vOut'), raf = 0, stop = false, cv = null;
            function lab() { $('#vGo span').textContent = 'Generate Flythrough (' + asp + ')'; out.style.aspectRatio = asp.replace(':', '/'); }
            $$('button', $('#vAsp')).forEach(function (b) { b.onclick = function () { $$('button', $('#vAsp')).forEach(function (x) { x.classList.toggle('on', x === b); }); asp = b.getAttribute('data-v'); lab(); }; }); lab();
            function play(img, prompt) {
                var t = prompt.toLowerCase(), mode = /(aerial|drone|overhead|rise)/.test(t) ? 'aerial' : /(walk|push|enter|interior|inside)/.test(t) ? 'push' : 'orbit', w = asp === '16:9' ? 960 : 540, h = asp === '16:9' ? 540 : 960;
                cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.className = 'ast-cv'; out.innerHTML = ''; out.appendChild(cv); var x = cv.getContext('2d'), t0 = performance.now(), D = 6000; cancelAnimationFrame(raf);
                (function frame(now) {
                    var u = ((now || performance.now()) - t0) % D / D, e = .5 - Math.cos(u * Math.PI * 2) / 2; x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
                    if (mode === 'aerial') cover(x, img, w, h, 1.34 - .22 * e, 0, -.03 * e); else if (mode === 'push') cover(x, img, w, h, 1.06 + .3 * e, 0, 0); else cover(x, img, w, h, 1.2 + .05 * e, (e - .5) * .1, 0);
                    x.fillStyle = 'rgba(255,255,255,.88)'; x.font = '600 ' + Math.round(w / 48) + 'px sans-serif'; x.fillText('AI Houses Design · ' + (mode === 'aerial' ? 'Aerial flythrough' : mode === 'push' ? 'Walkthrough' : 'Orbit flythrough'), w * .03, h - h * .04);
                    raf = requestAnimationFrame(frame);
                })();
            }
            $('#vGo').onclick = function () { var b = $('#vGo'); b.disabled = true; $('#vActs').hidden = true; var img = state.last ? null : state.src; Promise.all([progress(out, 'Composing flythrough…', 1500), img ? Promise.resolve(img) : (state.last ? Promise.resolve(state.last) : load(photoUrl(STYLES[state.style].photo)))]).then(function (r) { play(r[1], $('#vPrompt').value); $('#vActs').hidden = false; b.disabled = false; }); };
            $('#vDl').onclick = function () {
                if (!cv || !cv.captureStream || !window.MediaRecorder) { alert('Video export is not supported in this browser.'); return; }
                var rec = new MediaRecorder(cv.captureStream(30), { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm' }), parts = [], b = $('#vDl'); b.disabled = true; b.textContent = 'Recording 6 s…';
                rec.ondataavailable = function (e) { parts.push(e.data); }; rec.onstop = function () { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(parts, { type: 'video/webm' })); a.download = 'ai-houses-flythrough.webm'; document.body.appendChild(a); a.click(); a.remove(); b.disabled = false; b.innerHTML = ic('download') + 'Download video'; };
                rec.start(); setTimeout(function () { rec.stop(); }, 6000);
            };
            state.stopVideo = function () { cancelAnimationFrame(raf); };
        },
        function () {
            var src = $('#aSrc'), cur = null;
            function show(img) { cur = img; var c = src.querySelector('canvas') || document.createElement('canvas'); paint(c, img, 960, 600, ''); c.className = 'ast-cv'; if (!c.parentNode) src.insertBefore(c, src.firstChild); }
            load(photoUrl('walls')).then(show);
            $('#aFile').onchange = function (e) { var f = e.target.files[0]; if (f) fileToImg(f).then(show); };
            $('#aGo').onclick = function () { if (!cur) return; var o = $('#aOut'); o.innerHTML = '<h5>Architectural &amp; structural report</h5>'; progress(o, 'Analyzing materials and stage…', 1100).then(function () { o.innerHTML = report(classify(cur, 220), 'Architectural & structural report'); }); };
        },
        function () {
            var out = $('#mOut'), file = null;
            $('#mPick').onclick = function () { $('#mFile').click(); };
            $('#mFile').onchange = function (e) { file = e.target.files[0] || null; $('#mDrop p').textContent = file ? 'Selected: ' + file.name : 'Upload drone footage or click analyze to review the current site inspection'; };
            function site() {
                var data = null; try { data = JSON.parse(document.getElementById('vhData').textContent); } catch (e) { }
                var vh = document.getElementById('villa-horizon'), now = vh ? (+vh.getAttribute('data-vh-now') || 3) : 3, s = data ? data.filter(function (x) { return x.id === now; })[0] : null;
                if (!s) return '<div class="ast-rep"><h5>Site inspection</h5><p class="ast-mini">No project data is available on this page. Open the home page to inspect the Villa Horizon site.</p></div>';
                return '<div class="ast-rep"><h5>Site inspection: Villa Horizon</h5><p class="ast-big">Verified stage: <b>' + s.id + '. ' + s.name + '</b> <small>(' + s.progress + '% of target, day ' + s.days + ' of 180)</small></p><ul>' + s.milestones.map(function (m) { return '<li>' + ic('check') + m + '</li>'; }).join('') +
                    '</ul><div class="ast-steps"><div><b>Safety</b><span>' + esc(s.safety) + '</span></div><div class="ast-steps-i"><b>Inspection</b><span>' + esc(s.inspection) + '</span></div><div class="ast-steps-i"><b>Stage budget</b><span>' + esc(s.cost) + ' of $495,000 total</span></div></div><p class="ast-fine">Based on the project dashboard data. Upload footage to analyze your own site.</p></div>';
            }
            $('#mGo').onclick = function () {
                out.hidden = false;
                if (!file) { out.innerHTML = ''; progress(out, 'Reviewing site inspection…', 900).then(function () { out.innerHTML = site(); }); return; }
                out.innerHTML = ''; progress(out, 'Sampling frames…', 600);
                var v = document.createElement('video'); v.muted = true; v.preload = 'auto'; v.src = URL.createObjectURL(file);
                v.onerror = function () { out.innerHTML = '<p class="ast-hint">This video format could not be read by your browser.</p>'; };
                v.onloadedmetadata = function () {
                    var n = 6, dur = v.duration || 6, res = [], i = 0;
                    (function next() { if (i >= n) { done(); return; } v.currentTime = Math.min(dur - .05, dur * (i + .5) / n); v.onseeked = function () { v.onseeked = null; var m = classify(v, 160), g = guessStage(m); res.push({ t: v.currentTime, g: g, m: m }); i++; next(); }; })();
                    function done() {
                        URL.revokeObjectURL(v.src); var cnt = {}; res.forEach(function (r) { cnt[r.g.idx] = (cnt[r.g.idx] || 0) + 1; }); var main = +Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0];
                        out.innerHTML = '<div class="ast-rep"><h5>Footage analysis</h5><p class="ast-big">Dominant stage: <b>' + STAGE_NAMES[main] + '</b> <small>(' + cnt[main] + ' of ' + n + ' sampled frames)</small></p><div class="ast-mats">' +
                            res.map(function (r) { return '<div><span>' + r.t.toFixed(1) + ' s</span><i><b style="width:' + Math.round((r.g.idx + 1) * 100 / 6) + '%;background:#34d399"></b></i><em>' + STAGE_NAMES[r.g.idx] + '</em></div>'; }).join('') + '</div><ul>' + NOTES[main].map(function (x) { return '<li>' + ic('check') + x + '</li>'; }).join('') + '</ul><p class="ast-fine">Stage estimated from the colours in sampled frames. Worker safety and timeline checks need a site visit.</p></div>';
                    }
                };
            };
        },
        function () { $('#tGo').onclick = function () { var o = $('#tOut'); o.hidden = false; o.innerHTML = ''; progress(o, 'Working through the calculation…', 1400).then(function () { o.innerHTML = engineering($('#tQ').value); }); }; }
    ];

    /* ---------------------------------------------------------------- shell */
    function build() {
        root = document.createElement('div'); root.className = 'ast'; root.id = 'houseDesigner'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'astTitle');
        root.innerHTML = '<div class="ast-box"><header class="ast-head"><span class="ast-logo"><img src="' + IMG + 'favicon-96x96.png" alt="" width="42" height="42"></span><div><h2 id="astTitle">AI House Designer</h2><p>Design, edit, animate and analyze your house, all in one place</p></div><button type="button" class="ast-x" id="astClose" aria-label="Close">' + ic('x') + '</button></header>' +
            '<nav class="ast-tabs" role="tablist">' + TABS.map(function (t, i) { return '<button type="button" role="tab" id="astTab' + i + '" aria-selected="false" data-tab="' + i + '">' + ic(t[0]) + t[1] + '</button>'; }).join('') + '</nav><div class="ast-body" id="astBody" role="tabpanel"></div></div>';
        document.body.appendChild(root);
        root.addEventListener('mousedown', function (e) { if (e.target === root) close(); });
        $('#astClose').onclick = close;
        $$('.ast-tabs button').forEach(function (b) { b.onclick = function () { setTab(+b.getAttribute('data-tab')); }; });
    }
    function setTab(i) {
        if (state.stopVideo) { state.stopVideo(); state.stopVideo = null; }
        state.tab = i; $$('.ast-tabs button').forEach(function (b, k) { var on = k === i; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); if (on) b.scrollIntoView({ inline: 'center', block: 'nearest' }); });
        $('#astBody').innerHTML = VIEWS[i](); BIND[i]();
    }
    function open(style) {
        if (!root) build();
        state.style = STYLES[style] ? style : 'luxury'; state.src = null; state.last = null; state.lastFocus = document.activeElement;
        root.hidden = false; document.documentElement.classList.add('hd-search-open');
        var start = { modern: 0, traditional: 1, minimalist: 2, luxury: 3 }[state.style] || 0;   // each style opens its own tab
        setTab(start);
        if (start === 0) { var go = $('#gGo'); if (go) go.click(); }                              // tab 1 shows this style's render straight away
        $('#astClose').focus();
    }
    function close() { if (!root || root.hidden) return; if (state.stopVideo) state.stopVideo(); root.hidden = true; document.documentElement.classList.remove('hd-search-open'); if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus(); }
    document.addEventListener('keydown', function (e) { if (root && !root.hidden && e.key === 'Escape') { e.stopPropagation(); close(); } });
    Array.prototype.forEach.call(chips, function (b) { b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); Array.prototype.forEach.call(chips, function (c) { c.classList.toggle('on', c === b); }); open(b.getAttribute('data-style-pick')); }); });
})();