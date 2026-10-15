/**
 * Home hero. Two modes, same controls (Build / Open up / Dusk):
 *   1. PHOTO mode  - if real photos exist in static/img/hero/, they play as a cinematic crossfade sequence.
 *   2. 3D mode     - a real-time modern-farmhouse that goes through real construction stages
 *                    (Foundation > Framing > Dried-in > Finished), then the façade folds open and the roof peels apart
 *                    layer by layer to reveal a furnished interior, then dusk lighting. Needs THREE r128.
 * It never throws into the page: no WebGL / reduced motion / offscreen => it degrades or pauses.
 */
(function (window) {
    "use strict";
    window.HD = window.HD || {};

    function webglOK() {
        try {
            var c = document.createElement("canvas");
            return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
        } catch (e) { return false; }
    }
    function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function backOut(t) { var c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
    function rnd(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

    /* ===================================================================================================
     * shared UI (chips, play, progress, stage label) used by both modes
     * =================================================================================================== */
    function bindUI(host, api) {
        var ui = (host.closest("section") || host.parentNode).querySelector("[data-hero3d-ui]");
        if (!ui) return function () { };
        var btnPlay = ui.querySelector("[data-act=play]"), label = ui.querySelector("[data-h3-stage]"), bar = ui.querySelector(".h3-bar i");
        var chips = {};
        ["build", "open", "dusk"].forEach(function (k) { chips[k] = ui.querySelector("[data-act=" + k + "]"); });
        ui.addEventListener("click", function (ev) {
            var b = ev.target.closest("[data-act]"); if (!b) return;
            api.act(b.getAttribute("data-act"));
        });
        return function refresh(st) {
            Object.keys(chips).forEach(function (k) { if (chips[k]) chips[k].classList.toggle("active", k === st.phase); });
            if (btnPlay) btnPlay.textContent = st.playing ? "Pause" : "Play";
            if (label) label.textContent = st.label || "";
            if (bar) bar.style.width = (clamp(st.progress, 0, 1) * 100) + "%";
        };
    }

    /* ===================================================================================================
     * PHOTO mode
     * =================================================================================================== */
    function initPhotos(host, photos) {
        var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
        var layers = photos.map(function (p) {
            var d = document.createElement("div"); d.className = "h3-photo"; d.style.backgroundImage = "url('" + p.src + "')";
            host.appendChild(d); return d;
        });
        var n = layers.length, PER = 3.6, TOTAL = PER * n, clock = 0, playing = !reduce, last = performance.now(), raf = 0, visible = true;
        var refresh;
        function render() {
            var p = (clock / PER) % n;
            layers.forEach(function (l, i) {
                var d = Math.abs(p - i); d = Math.min(d, n - d);                 // circular distance so the last photo fades into the first
                var o = clamp(1 - d, 0, 1); l.style.opacity = o;
                l.style.transform = "scale(" + (1.03 + .06 * o) + ") translate3d(" + ((i % 2 ? -1 : 1) * (p - i) * -1.2) + "%,0,0)";
            });
            var near = Math.round(p) % n;
            refresh({ phase: near === 0 ? "build" : near === n - 1 ? "dusk" : "open", playing: playing, label: photos[near].label, progress: (clock % TOTAL) / TOTAL });
        }
        function frame(now) {
            raf = 0; var dt = Math.min(.05, (now - last) / 1000); last = now;
            if (playing) clock = (clock + dt) % TOTAL;
            render(); if (visible && playing) raf = requestAnimationFrame(frame);
        }
        function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
        refresh = bindUI(host, {
            act: function (a) {
                if (a === "play") { playing = !playing; }
                else if (a === "build") { clock = 0; playing = true; }
                else if (a === "open") { clock = PER * Math.floor((n - 1) / 2); playing = true; }
                else if (a === "dusk") { clock = PER * (n - 1); playing = true; }
                render(); if (playing) start();
            }
        });
        if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && playing) start(); }, { threshold: .05 }).observe(host);
        render(); if (playing) start();
        host.setAttribute("data-ready", "photo");
        return true;
    }

    /* ===================================================================================================
     * 3D mode
     * =================================================================================================== */
    window.HD.initHero3D = function (host) {
        if (!host) return false;
        var photos = []; try { photos = JSON.parse(host.getAttribute("data-photos") || "[]"); } catch (e) { }
        if (photos.length >= 2) return initPhotos(host, photos);
        if (!window.THREE || !webglOK()) return false;
        var T = window.THREE;
        var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
        var small = Math.min(window.innerWidth, window.innerHeight) < 700;

        var renderer;
        try { renderer = new T.WebGLRenderer({ antialias: !small, powerPreference: "high-performance" }); } catch (e) { return false; }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
        renderer.outputEncoding = T.sRGBEncoding;
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = T.PCFSoftShadowMap;
        var canvas = renderer.domElement; canvas.setAttribute("aria-hidden", "true"); host.appendChild(canvas);

        var scene = new T.Scene();
        var camera = new T.PerspectiveCamera(30, 1, 1, 900);

        /* ---------- sky / environment (so glass + metal reflect a real-looking sky) ---------- */
        var C = function (h) { return new T.Color(h); };
        var SKY = {
            dayTop: C("#5b97d6"), dayHor: C("#eaf1f4"), duskTop: C("#16203f"), duskHor: C("#f2a06b")
        };
        function skyTexture(top, hor) {
            var c = document.createElement("canvas"); c.width = 4; c.height = 256; var g = c.getContext("2d");
            var gr = g.createLinearGradient(0, 0, 0, 256);
            gr.addColorStop(0, "#" + top.getHexString()); gr.addColorStop(.46, "#" + hor.getHexString()); gr.addColorStop(1, "#" + hor.clone().multiplyScalar(.7).getHexString());
            g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
            var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
        }
        var liveC = document.createElement("canvas"); liveC.width = 4; liveC.height = 256; var liveG = liveC.getContext("2d");
        var liveTex = new T.CanvasTexture(liveC); liveTex.encoding = T.sRGBEncoding;
        function drawSky(top, hor) {
            var gr = liveG.createLinearGradient(0, 0, 0, 256);
            gr.addColorStop(0, "#" + top.getHexString()); gr.addColorStop(.46, "#" + hor.getHexString()); gr.addColorStop(1, "#" + hor.clone().multiplyScalar(.7).getHexString());
            liveG.fillStyle = gr; liveG.fillRect(0, 0, 4, 256); liveTex.needsUpdate = true;
        }
        drawSky(SKY.dayTop, SKY.dayHor);
        var skyMat = new T.MeshBasicMaterial({ map: liveTex, side: T.BackSide, fog: false, depthWrite: false });
        var dome = new T.Mesh(new T.SphereGeometry(500, 32, 16), skyMat); dome.renderOrder = -2; scene.add(dome);
        scene.fog = new T.Fog(0xeaf1f4, 110, 430);

        var pmrem = new T.PMREMGenerator(renderer);
        function makeEnv(top, hor, sunCol, sunI) {
            var es = new T.Scene();
            es.add(new T.Mesh(new T.SphereGeometry(50, 32, 16), new T.MeshBasicMaterial({ map: skyTexture(top, hor), side: T.BackSide })));
            var sun = new T.Mesh(new T.SphereGeometry(5, 16, 8), new T.MeshBasicMaterial({ color: sunCol.clone().multiplyScalar(sunI) }));
            sun.position.set(-26, 30, 32); es.add(sun);
            var rt = pmrem.fromScene(es, .02); es.traverse(function (o) { if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } if (o.geometry) o.geometry.dispose(); });
            return rt.texture;
        }
        var envDay = makeEnv(SKY.dayTop, SKY.dayHor, C("#fff4dc"), 18), envDusk = makeEnv(SKY.duskTop, SKY.duskHor, C("#ffb070"), 10);
        scene.environment = envDay;

        /* ---------- procedural textures ---------- */
        function tex(w, h, draw, rx, ry) {
            var c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
            var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.anisotropy = 8; return t;
        }
        var TEX = {
            batten: tex(256, 256, function (g, w, h) {
                g.fillStyle = "#f3f1ec"; g.fillRect(0, 0, w, h);
                for (var i = 0; i < 4; i++) { var x = i * w / 4; g.fillStyle = "rgba(0,0,0,.16)"; g.fillRect(x, 0, 3, h); g.fillStyle = "rgba(255,255,255,.85)"; g.fillRect(x + 3, 0, 5, h); g.fillStyle = "rgba(0,0,0,.07)"; g.fillRect(x + 8, 0, 6, h); }
                var r = rnd(9); for (var k = 0; k < 500; k++) { g.fillStyle = "rgba(60,50,40," + (r() * .035) + ")"; g.fillRect(r() * w, r() * h, 2, 3 + r() * 14); }
            }, .5, .5),
            osb: tex(256, 256, function (g, w, h) {
                var r = rnd(21); g.fillStyle = "#c79a57"; g.fillRect(0, 0, w, h);
                for (var i = 0; i < 1500; i++) { var v = 150 + r() * 70; g.fillStyle = "rgba(" + v + "," + (v * .72) + "," + (v * .38) + "," + (.25 + r() * .3) + ")"; g.save(); g.translate(r() * w, r() * h); g.rotate(r() * 3.14); g.fillRect(0, 0, 6 + r() * 16, 2 + r() * 3); g.restore(); }
                g.fillStyle = "rgba(60,35,10,.5)"; g.fillRect(0, h / 2 - 1, w, 2); g.fillRect(w / 2 - 1, 0, 2, h);
            }, .25, .25),
            wrap: tex(256, 256, function (g, w, h) {
                g.fillStyle = "#e9e8e2"; g.fillRect(0, 0, w, h); var r = rnd(4);
                for (var i = 0; i < 700; i++) { g.fillStyle = "rgba(120,120,110," + (r() * .05) + ")"; g.fillRect(r() * w, r() * h, 40 + r() * 80, 1); }
                g.fillStyle = "rgba(190,60,40,.5)"; g.font = "bold 20px sans-serif"; g.fillText("AIHOUSES", 14, 60); g.fillText("AIHOUSES", 130, 190);
                g.fillStyle = "rgba(70,110,170,.55)"; g.fillRect(0, h * .5, w, 3);
            }, .4, .4),
            shingle: tex(256, 256, function (g, w, h) {
                var r = rnd(33);
                for (var row = 0; row < 8; row++) for (var col = -1; col < 9; col++) {
                    var x = col * 32 + (row % 2) * 16, v = 52 + r() * 22; g.fillStyle = "rgb(" + v + "," + (v + 3) + "," + (v + 7) + ")"; g.fillRect(x + 1, row * 32 + 1, 30, 30);
                    g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x, row * 32 + 28, 32, 4);
                }
            }, .22, .22),
            stone: tex(256, 256, function (g, w, h) {
                var r = rnd(5); g.fillStyle = "#6f6a62"; g.fillRect(0, 0, w, h);
                for (var y = 0; y < 8; y++) {
                    var x = (y % 2) * 18; while (x < w) {
                        var bw = 26 + r() * 36, v = 120 + r() * 60;
                        g.fillStyle = "rgb(" + v + "," + (v - 6) + "," + (v - 14) + ")"; g.fillRect(x + 1.5, y * 32 + 1.5, bw - 3, 29); x += bw;
                    }
                }
            }, .35, .35),
            wood: tex(256, 256, function (g, w, h) {
                var r = rnd(7), cols = ["#a77a4f", "#9a6e45", "#b3855a", "#a07248"];
                for (var i = 0; i < 8; i++) { g.fillStyle = cols[i % 4]; g.fillRect(0, i * h / 8, w, h / 8 - 1.5); for (var k = 0; k < 40; k++) { g.fillStyle = "rgba(70,40,15," + (r() * .14) + ")"; g.fillRect(r() * w, i * h / 8, r() * 70, 1); } }
            }, .35, .35),
            lawn: tex(512, 512, function (g, w, h) {
                var r = rnd(11); g.fillStyle = "#5f9847"; g.fillRect(0, 0, w, h);
                for (var i = 0; i < 6000; i++) { g.fillStyle = "hsl(" + (88 + r() * 30) + ",42%," + (30 + r() * 22) + "%)"; g.fillRect(r() * w, r() * h, 2, 3 + r() * 5); }
                for (var s = 0; s < 8; s++) { g.fillStyle = s % 2 ? "rgba(255,255,255,.045)" : "rgba(0,0,0,.05)"; g.fillRect(0, s * h / 8, w, h / 8); }
            }, 90, 90),
            dirt: tex(256, 256, function (g, w, h) {
                var r = rnd(2); g.fillStyle = "#7a5b3b"; g.fillRect(0, 0, w, h);
                for (var i = 0; i < 1800; i++) { var v = 80 + r() * 60; g.fillStyle = "rgba(" + v + "," + (v * .74) + "," + (v * .5) + ",.5)"; g.fillRect(r() * w, r() * h, 2 + r() * 5, 2 + r() * 4); }
            }, 6, 6)
        };
        var M = {
            wall: new T.MeshStandardMaterial({ map: TEX.osb, roughness: .95 }),
            osb: new T.MeshStandardMaterial({ map: TEX.osb, roughness: .95 }),
            frame: new T.MeshStandardMaterial({ color: 0x15181a, roughness: .4, metalness: .6 }),
            stone: new T.MeshStandardMaterial({ map: TEX.stone, roughness: 1 }),
            wood: new T.MeshStandardMaterial({ map: TEX.wood, roughness: .75 }),
            woodPost: new T.MeshStandardMaterial({ color: 0xb07a45, roughness: .7 }),
            floorIn: new T.MeshStandardMaterial({ map: TEX.wood, color: 0xe6c9a0, roughness: .5 }),
            slab: new T.MeshStandardMaterial({ color: 0xa9a59d, roughness: .95 }),
            conc: new T.MeshStandardMaterial({ color: 0x8a867f, roughness: .95 }),
            deckL: new T.MeshStandardMaterial({ map: TEX.osb, roughness: .95, transparent: true }),
            underL: new T.MeshStandardMaterial({ color: 0x24272b, roughness: .9, transparent: true }),
            shingL: new T.MeshStandardMaterial({ map: TEX.shingle, color: 0x9aa0a8, roughness: .85, transparent: true }),
            glass: new T.MeshPhysicalMaterial({ color: 0x9fc3d8, roughness: .03, metalness: 0, transparent: true, opacity: .32, envMapIntensity: 1.6, side: T.DoubleSide }),
            glow: new T.MeshBasicMaterial({ color: 0xffb35c, transparent: true, opacity: 0, depthWrite: false }),
            lawnM: new T.MeshStandardMaterial({ map: TEX.lawn, roughness: 1, envMapIntensity: .2 }),
            dirtM: new T.MeshStandardMaterial({ map: TEX.dirt, roughness: 1, transparent: true }),
            leaf: new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1, envMapIntensity: .4, flatShading: true }),
            trunk: new T.MeshStandardMaterial({ color: 0x4a3526, roughness: 1 }),
            hedge: new T.MeshStandardMaterial({ color: 0x2f6a35, roughness: 1 }),
            white: new T.MeshStandardMaterial({ color: 0xf4f2ee, roughness: .8 }),
            sofa: new T.MeshStandardMaterial({ color: 0x55707f, roughness: .95 }),
            sofa2: new T.MeshStandardMaterial({ color: 0xd9a84e, roughness: .95 }),
            rug: new T.MeshStandardMaterial({ color: 0xd2c3ab, roughness: 1 }),
            counter: new T.MeshStandardMaterial({ color: 0x30393f, roughness: .3, metalness: .15 }),
            bedcover: new T.MeshStandardMaterial({ color: 0x3a6a92, roughness: .95 }),
            lamp: new T.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffbf66, emissiveIntensity: .15 }),
            flower: new T.MeshStandardMaterial({ color: 0xf6f0f4, roughness: .9 })
        };
        M.wall.color.set(0xffffff);

        /* ---------- helpers ---------- */
        function box(w, h, d, mat, x, y, z, parent, shadow) {
            var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
            if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
            if (parent) parent.add(m); return m;
        }
        function grp(parent, x, y, z) { var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g; }
        function rr(parent, w, h, d, mat, x, y, z, r) { return box(w, h, d, mat, x, y, z, parent); }

        var world = grp(scene);

        /* ===================================================================================================
         * Dimensions (metres). House group origin = top of slab. Front is +z.
         * =================================================================================================== */
        var H = 5.8, FL = 3.1, SLAB = .6;
        var PITCH = Math.tan(33 * Math.PI / 180), PITCH_A = 1.1;   // wing roof is steeper so its ridge clears the main block
        var AX = -4.25, AW = 5.5, AZ0 = -4.5, AZ1 = 5.0;      // front-gable wing
        var BX0 = -1.5, BX1 = 7, BZ0 = -4.5, BZ1 = 3.0;      // main block (ridge along x)
        var RA = (AW / 2) * PITCH_A, RB = ((BZ1 - BZ0) / 2) * PITCH;

        /* ---------- ground ---------- */
        var ground = new T.Mesh(new T.CircleGeometry(520, 64), M.lawnM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
        var dirt = new T.Mesh(new T.CircleGeometry(15, 40), M.dirtM); dirt.rotation.x = -Math.PI / 2; dirt.position.set(0, .03, .5); dirt.receiveShadow = true; world.add(dirt);

        var house = grp(world, 0, SLAB, 0);

        /* ---------- Stage 00: blueprint wireframe on the ground ---------- */
        var bp = grp(world);
        var bpMat = new T.LineBasicMaterial({ color: 0x35e0d0, transparent: true, opacity: 0 });
        function wire(w, h, d, x, y, z) { var l = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(w, h, d)), bpMat); l.position.set(x, y, z); bp.add(l); }
        wire(15.0, SLAB, 10.8, 0, SLAB / 2, .25);
        wire(AW, H, AZ1 - AZ0, AX, SLAB + H / 2, (AZ0 + AZ1) / 2); wire(BX1 - BX0, H, BZ1 - BZ0, (BX0 + BX1) / 2, SLAB + H / 2, (BZ0 + BZ1) / 2);
        var grid = new T.GridHelper(34, 34, 0x35e0d0, 0x1d7a74); grid.position.y = .05; grid.material.transparent = true; grid.material.opacity = 0; bp.add(grid);

        /* ---------- foundation ---------- */
        var foundation = grp(world);
        box(15.0, SLAB, 10.8, M.slab, 0, SLAB / 2, .25, foundation);
        // stone skirt (appears at finishing)
        var skirt = grp(house);
        box(AW + .3, 1.0, .25, M.stone, AX, .5, AZ1 + .12, skirt); box(BX1 - BX0 + .3, 1.0, .25, M.stone, (BX0 + BX1) / 2, .5, BZ1 + .12, skirt);
        box(.25, 1.0, 9.8, M.stone, -7.12, .5, .25, skirt); box(.25, 1.0, 7.8, M.stone, 7.12, .5, -.75, skirt); box(14.5, 1.0, .25, M.stone, 0, .5, -4.62, skirt);

        /* ===================================================================================================
         * Walls (extruded polygons with real window holes)
         * =================================================================================================== */
        function wall(poly, holes, cu) {
            // poly/holes in (u,v) with u already relative to the wall centre; exterior face at local z=0, thickness .3 inward (-z)
            var sh = new T.Shape(); poly.forEach(function (p, i) { i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]); });
            holes.forEach(function (h) {
                var x0 = h[0] - h[2] / 2, x1 = h[0] + h[2] / 2, y0 = h[1], y1 = h[1] + h[3], p = new T.Path();
                p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.lineTo(x0, y0); sh.holes.push(p);
            });
            var g = new T.ExtrudeGeometry(sh, { depth: .3, bevelEnabled: false }); g.translate(0, 0, -.3);
            var m = new T.Mesh(g, M.wall); m.castShadow = true; m.receiveShadow = true; return m;
        }
        function rectPoly(w, h) { return [[-w / 2, 0], [w / 2, 0], [w / 2, h], [-w / 2, h]]; }
        function gablePoly(w, h, rise) { return [[-w / 2, 0], [w / 2, 0], [w / 2, h], [0, h + rise], [-w / 2, h]]; }

        var windows = [];        // window groups (pop in at 'dried-in')
        function windowAt(parent, u, v, w, h) {
            var g = grp(parent, u, v, 0), t = .07;
            var dep = .16;
            box(w + .14, t, dep, M.frame, 0, -t / 2, -.02, g, false); box(w + .14, t, dep, M.frame, 0, h + t / 2, -.02, g, false);
            box(t, h, dep, M.frame, -w / 2 - t / 2 + .0, h / 2, -.02, g, false); box(t, h, dep, M.frame, w / 2 + t / 2, h / 2, -.02, g, false);
            var cols = w > 1.2 ? 3 : 2, rows = h > 1.4 ? 3 : 2;
            for (var i = 1; i < cols; i++) box(.035, h, .07, M.frame, -w / 2 + w * i / cols, h / 2, -.03, g, false);
            for (var j = 1; j < rows; j++) box(w, .035, .07, M.frame, 0, h * j / rows, -.03, g, false);
            var gl = new T.Mesh(new T.PlaneGeometry(w, h), M.glass); gl.position.set(0, h / 2, -.1); g.add(gl);
            var gw = new T.Mesh(new T.PlaneGeometry(w, h), M.glow); gw.position.set(0, h / 2, -.22); g.add(gw);
            windows.push(g); return g;
        }
        function holeList(list) { return list.map(function (w) { return [w[0], w[1], w[2], w[3]]; }); }

        var walls = [];
        function makeWall(name, poly, wins, cx, cz, rotY, extraHoles) {
            var hinge = grp(house, cx, 0, cz); hinge.rotation.y = rotY; hinge.name = name;
            var holes = holeList(wins).concat(extraHoles || []);
            hinge.add(wall(poly, holes));
            wins.forEach(function (w) { windowAt(hinge, w[0], w[1], w[2], w[3]); });
            walls.push(hinge); return hinge;
        }
        // A front (+z), local x = world x - AX
        var aFront = makeWall("aFront", gablePoly(AW, H, RA), [
            [-1.5, .6, 1.3, 2.3], [1.5, .6, 1.3, 2.3], [-1.5, 3.9, 1.3, 1.7], [1.5, 3.9, 1.3, 1.7], [0, H + .35, .8, .8]], AX, AZ1, 0);
        // B front (+z)
        var bFront = makeWall("bFront", rectPoly(BX1 - BX0, H), [
            [-.9, .6, 1.4, 2.3], [1.9, .6, 1.4, 2.3], [-2.9, 3.9, 1.1, 1.7], [-.9, 3.9, 1.1, 1.7], [1.1, 3.9, 1.1, 1.7], [3.1, 3.9, 1.1, 1.7]],
            (BX0 + BX1) / 2, BZ1, 0, [[-2.9, .05, 1.15, 2.35]]);
        // back (-z): local x = -(world x)
        // local u = -(world x): the wing (x -7..-1.5) is at u 1.5..7, its gable peak at u = 4.25
        var back = makeWall("back", [[-7, 0], [7, 0], [7, H], [4.25, H + RA], [1.5, H], [-7, H]], [
            [-5.3, .8, 1.5, 1.9], [-1.2, .8, 1.5, 1.9], [1.8, .8, 1.5, 1.9], [5, .8, 1.5, 1.9], [-5.3, 3.9, 1.3, 1.5], [0, 3.9, 1.3, 1.5], [4.3, 3.9, 1.3, 1.5]],
            0, BZ0, Math.PI);
        // A left (-x): local x = z - cz
        var aLeft = makeWall("aLeft", rectPoly(AZ1 - AZ0, H), [[-2.5, .7, 1.4, 2.2], [2.4, .7, 1.4, 2.2], [-2.5, 3.9, 1.4, 1.6], [2.4, 3.9, 1.4, 1.6]], -7, (AZ0 + AZ1) / 2, -Math.PI / 2);
        // B right gable (+x): local x = -(z - cz)
        var bRight = makeWall("bRight", gablePoly(BZ1 - BZ0, H, RB), [[1.5, .7, 1.4, 2.2], [-1.5, .7, 1.4, 2.2], [1.5, 3.9, 1.2, 1.5], [-1.5, 3.9, 1.2, 1.5]], BX1, (BZ0 + BZ1) / 2, Math.PI / 2);
        // partition at x = BX0 (visible inside), with a doorway
        var part = makeWall("part", rectPoly(AZ1 - AZ0, H), [], BX0, (AZ0 + AZ1) / 2, Math.PI / 2, [[0.3, .05, 1.1, 2.25]]);
        part.visible = true;

        /* ---------- floors / stairs / interior ---------- */
        var floors = grp(house);
        box(13.8, .1, 7.6 + .0, M.floorIn, 0, .05, -.7, floors, false).receiveShadow = true;
        box(5.3, .1, 2.0, M.floorIn, AX, .05, 4.0, floors, false);
        // first-floor slab (underside visible when open)
        var slab1 = grp(house, 0, FL, 0);
        box(13.8, .3, 7.6, M.white, 0, .15, -.7, slab1); box(5.3, .3, 2.0, M.white, AX, .15, 4.0, slab1);
        var floor1 = box(13.6, .06, 7.4, M.floorIn, 0, FL + .33, -.7, house, false); floor1.receiveShadow = true;
        box(5.2, .06, 1.9, M.floorIn, AX, FL + .33, 4.0, house, false);

        var in0 = grp(house), in1 = grp(house, 0, FL + .35, 0);
        // ground floor: living (wing A)
        box(4.4, .03, 3.4, M.rug, AX, .13, 2.3, in0, false);
        box(3.1, .5, 1.1, M.sofa, AX, .35, 1.0, in0); box(3.1, .6, .3, M.sofa, AX, .8, .55, in0); box(.3, .6, 1.1, M.sofa, AX - 1.55, .6, 1.0, in0); box(.3, .6, 1.1, M.sofa, AX + 1.55, .6, 1.0, in0);
        box(1.4, .38, .8, M.wood, AX, .3, 2.5, in0); box(1.0, .9, 1.0, M.sofa2, AX + 1.7, .5, 3.2, in0);
        box(2.8, .5, .4, M.counter, AX, .35, -4.0, in0); box(2.0, 1.05, .08, M.frame, AX, 1.5, -4.2, in0);
        // kitchen + dining (block B)
        box(3.6, 1.0, 1.1, M.counter, 2.6, .55, .4, in0); box(3.7, .05, 1.2, M.white, 2.6, 1.08, .4, in0);
        for (var s = 0; s < 3; s++) { box(.42, .07, .42, M.wood, 1.5 + s * 1.1, .85, 1.35, in0); box(.07, .75, .07, M.frame, 1.5 + s * 1.1, .45, 1.35, in0); }
        box(6.0, 2.6, .6, M.white, 3.2, 1.45, -4.1, in0); box(6.0, .06, .64, M.counter, 3.2, 1.0, -4.1, in0);
        box(2.4, .08, 1.1, M.wood, 4.2, .95, -2.0 + .2, in0); box(.1, .9, .1, M.frame, 3.1, .5, -1.8, in0); box(.1, .9, .1, M.frame, 5.3, .5, -1.8, in0);
        for (var cx = 0; cx < 2; cx++) for (var cz = 0; cz < 2; cz++) box(.42, .55, .42, M.white, 3.7 + cx * 1.0, .33, -2.65 + cz * 1.35, in0);
        // stairs along the partition
        for (var st = 0; st < 11; st++) box(1.0, .28 * (st + 1), .3, M.wood, BX0 + 1.0 + st * .0, .14 * (st + 1), -3.7 + st * .3 + 0, in0);
        var pend = [];
        [[AX, 2.65, 2.3], [2.6, 2.75, .4], [4.2, 2.75, -1.8]].forEach(function (p) {
            var l = new T.Mesh(new T.SphereGeometry(.26, 16, 12), M.lamp); l.position.set(p[0], p[1], p[2]); in0.add(l); box(.03, .6, .03, M.frame, p[0], p[1] + .45, p[2], in0, false);
        });
        // upstairs: bedroom (A), study + bath (B)
        box(2.3, .55, 2.7, M.white, AX, .3, -2.2, in1); box(2.3, .24, 1.9, M.bedcover, AX, .7, -1.8, in1); box(2.4, 1.2, .2, M.wood, AX, .95, -3.5, in1);
        box(.7, .5, .6, M.wood, AX - 1.7, .28, -3.2, in1); box(.7, .5, .6, M.wood, AX + 1.7, .28, -3.2, in1);
        box(2.4, 2.5, .7, M.white, AX, 1.3, 4.1 - .0 - 1.2, in1).position.set(AX + 1.6, 1.3, 3.3);
        box(1.7, .08, .8, M.wood, 4.2, .85, -3.6, in1); box(.08, .85, .08, M.frame, 3.45, .42, -3.6, in1); box(.08, .85, .08, M.frame, 4.95, .42, -3.6, in1); box(.55, .8, .55, M.sofa, 4.2, .4, -2.9, in1);
        box(1.8, .55, .85, M.white, 5.9, .3, .4, in1); box(2.4, .1, 1.0, M.counter, 2.6, .8, 1.4, in1);
        var lampUp = new T.Mesh(new T.SphereGeometry(.22, 14, 10), M.lamp); lampUp.position.set(AX, 2.6, -1.6); in1.add(lampUp);

        /* ===================================================================================================
         * Roof: 3 layers (deck / underlayment / shingles) as separate groups so they can peel apart
         * =================================================================================================== */
        var roofDeck = grp(house, 0, H, 0), roofUnder = grp(house, 0, H, 0), roofShing = grp(house, 0, H, 0);
        var OH = .6;                                   // overhang
        function plane(layerGroup, mat, thick, yoff, axis, ridgeX, ridgeZ, ridgeY, half, length, sign, pitch) {
            // axis 'x': ridge runs along x (planes slope in z). axis 'z': ridge runs along z (planes slope in x).
            var a = Math.atan(pitch), L = (half + OH) / Math.cos(a);
            var pivot = grp(layerGroup, ridgeX, ridgeY, ridgeZ);
            var geo = axis === "x" ? new T.BoxGeometry(length, thick, L) : new T.BoxGeometry(L, thick, length);
            var m = new T.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
            if (axis === "x") { m.position.set(0, yoff, sign * L / 2); pivot.rotation.x = sign * a; }
            else { m.position.set(sign * L / 2, yoff, 0); pivot.rotation.z = -sign * a; }
            pivot.add(m); return m;
        }
        function roofSet(g, mat, thick, yoff) {
            var halfB = (BZ1 - BZ0) / 2, zc = (BZ0 + BZ1) / 2, len = (BX1 + OH) - AX, cx = ((BX1 + OH) + AX) / 2;   // block B runs into the wing so the cross-gable valley closes
            plane(g, mat, thick, yoff, "x", cx, zc, RB, halfB, len, 1, PITCH); plane(g, mat, thick, yoff, "x", cx, zc, RB, halfB, len, -1, PITCH);
            var lenA = (AZ1 - AZ0) + OH * 2, zA = (AZ0 + AZ1) / 2;
            plane(g, mat, thick, yoff, "z", AX, zA, RA, AW / 2, lenA, 1, PITCH_A); plane(g, mat, thick, yoff, "z", AX, zA, RA, AW / 2, lenA, -1, PITCH_A);
        }
        // pivots sit at ridge height: pass ridgeY relative to layerGroup origin (= eave height H)
        roofSet(roofDeck, M.deckL, .18, 0); roofSet(roofUnder, M.underL, .05, .115); roofSet(roofShing, M.shingL, .11, .2);
        var chim = grp(house, 0, 0, 0);
        box(1.0, 9.2, 1.7, M.stone, 7.55, 4.6, -.75, chim); box(1.25, .2, 1.95, M.slab, 7.55, 9.3, -.75, chim);

        /* ---------- porch ---------- */
        var porch = grp(house);
        box(BX1 - BX0 + .6, .3, 2.3, M.conc, (BX0 + BX1) / 2, -.15, BZ1 + 1.05, porch);
        [BX0 + .3, 2.2, 5.2, BX1 - .1].forEach(function (x) { box(.28, 3.2, .28, M.woodPost, x, 1.6, BZ1 + 1.95, porch); });
        box(BX1 - BX0 + .4, .3, .3, M.woodPost, (BX0 + BX1) / 2, 3.35, BZ1 + 1.95, porch);
        var porchRoof = grp(house, 0, 0, 0);
        var pr = box(BX1 - BX0 + .8, .16, 2.9, M.shingL, (BX0 + BX1) / 2, 3.45, BZ1 + 1.15, porchRoof); pr.rotation.x = .1;
        // front door (sits in the door opening at u=-2.9 of the main façade)
        var door = box(1.1, 2.3, .1, M.woodPost, (BX0 + BX1) / 2 - 2.9, 1.2, BZ1 - .1, porch);
        // steps + path
        box(2.2, .2, .8, M.conc, door.position.x, -.05, BZ1 + 2.6, porch); box(2.2, .1, .8, M.conc, door.position.x, -.2, BZ1 + 3.3, porch);

        /* ---------- landscape ---------- */
        var land = grp(world);
        var paving = grp(world);
        box(5.0, .06, 22, M.conc, 10.5, .03, 14, paving, false); box(1.8, .06, 14, M.slab, door.position.x, .03, 11.5, paving, false);
        for (var hI = 0; hI < 11; hI++) { var hb = new T.Mesh(new T.IcosahedronGeometry(.62, 2), M.hedge); hb.position.set(-6.6 + hI * 1.3, .55, BZ1 + .9); hb.scale.set(1, .85, 1); hb.castShadow = true; if (hI > 2 && hI < 8) hb.visible = false; land.add(hb); }
        var r2 = rnd(77);
        for (var f = 0; f < 36; f++) { var fl = new T.Mesh(new T.SphereGeometry(.09, 6, 6), M.flower); fl.position.set(-6.8 + r2() * 14, .45 + r2() * .2, BZ1 + .7 + r2() * .5); land.add(fl); }
        // fence posts hint
        var lamps = [];
        [[-1.6, 9.2], [3.8, 9.2]].forEach(function (p) { box(.1, 1.1, .1, M.frame, p[0], .55, p[1], land); var l = new T.Mesh(new T.SphereGeometry(.14, 10, 8), M.lamp); l.position.set(p[0], 1.18, p[1]); land.add(l); lamps.push(l); });

        /* ---------- trees (instanced: cheap, lots of them, autumn mix like the reference) ---------- */
        var foliageGeo = new T.IcosahedronGeometry(1, 1), trunkGeo = new T.CylinderGeometry(.18, .3, 1, 7);
        var palette = ["#3a7436", "#447f36", "#2f6a35", "#2a5f30", "#6f9a30", "#b9902c", "#c4651f", "#a8461a"].map(C);
        var treeData = [], rg = rnd(123);
        function addTree(x, z, s) { treeData.push([x, z, s]); }
        for (var i = 0; i < 260; i++) {
            var ang = rg() * Math.PI * 2, rad = 85 + rg() * 200;
            var fx = Math.sin(ang), fz = Math.cos(ang);
            if (fz > .2 && rad < 150) continue;                     // keep the front lawn open for the camera
            addTree(fx * rad, fz * rad, 20 + rg() * 14);
        }
        [[-26, -8, 10], [-30, 6, 11], [26, -10, 10.5], [30, 4, 10], [-34, -22, 14], [33, -24, 15]].forEach(function (p) { addTree(p[0], p[1], p[2]); });
        var foliage = new T.InstancedMesh(foliageGeo, M.leaf, treeData.length * 3), trunks = new T.InstancedMesh(trunkGeo, M.trunk, treeData.length);
        var dm = new T.Object3D(), tcol = new T.Color();
        treeData.forEach(function (t, i) {
            var x = t[0], z = t[1], s = t[2], base = palette[Math.floor(rg() * palette.length)];
            dm.rotation.set(0, 0, 0); dm.position.set(x, s * .35, z); dm.scale.set(.5 + s * .02, s * .7, .5 + s * .02); dm.updateMatrix(); trunks.setMatrixAt(i, dm.matrix);
            for (var b = 0; b < 3; b++) {
                var k = i * 3 + b, rr2 = s * (.27 - b * .05) * (.9 + rg() * .25);
                dm.position.set(x + (rg() - .5) * s * .32, s * (.5 + b * .2), z + (rg() - .5) * s * .32); dm.scale.set(rr2, rr2 * 1.15, rr2); dm.rotation.y = rg() * 6; dm.updateMatrix(); foliage.setMatrixAt(k, dm.matrix);
                tcol.copy(base).multiplyScalar(.58 + rg() * .26); foliage.setColorAt(k, tcol);
            }
        });
        foliage.instanceMatrix.needsUpdate = true; foliage.instanceColor.needsUpdate = true; trunks.instanceMatrix.needsUpdate = true;
        foliage.castShadow = false; trunks.castShadow = false; foliage.frustumCulled = false; trunks.frustumCulled = false;
        world.add(foliage); world.add(trunks);

        /* ---------- lights ---------- */
        var hemi = new T.HemisphereLight(0xcfe2ff, 0x6a8650, .55); scene.add(hemi);
        var sun = new T.DirectionalLight(0xfff0d2, 2.6); sun.position.set(-24, 26, 30); sun.target.position.set(0, 2, 0);
        sun.castShadow = true; sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048); sun.shadow.radius = 3; sun.shadow.bias = -.0003; sun.shadow.normalBias = .03;
        var sc = sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 22; sc.bottom = -22; sc.near = 5; sc.far = 110;
        scene.add(sun); scene.add(sun.target);
        var warm = [];
        [[AX, 2.2, 2.2], [3.2, 2.2, -.8], [AX, 6.2, -1.5], [3.4, 6.2, -1.0]].forEach(function (p) { var l = new T.PointLight(0xffb866, 0, 11, 1.8); l.position.set(p[0], p[1] + SLAB, p[2]); scene.add(l); warm.push(l); });

        /* ===================================================================================================
         * Timeline
         * =================================================================================================== */
        var T_FOUND = 1.3, T_FRAME = 2.7, T_DRY = 5.1, T_FIN = 6.6, BUILD_END = 9.0, HOLD = 1.8, OPEN_AT = 10.8, OPEN_DUR = 3.4, DUSK_AT = 14.6, DUSK_DUR = 3.0, TOTAL = 18.2;
        var LOOP_END = BUILD_END + HOLD;   // the always-on loop: Stage 00 > 01 > 02 > 03 > 04 (held a moment), then back to the ground
        var clock = reduce ? BUILD_END : 0, playing = !reduce;   // always on; only visitors who asked their OS for reduced motion get a still frame
        function u(t, s, d) { return clamp((t - s) / d, 0, 1); }

        function setVis(o, v) { o.visible = v; }
        function applyBuild(t) {
            var bpa = u(t, 0, .6) * (1 - u(t, T_FRAME, 1.4)); bp.visible = bpa > .01;
            bpMat.opacity = bpa * (.7 + .3 * Math.sin(t * 6)); grid.material.opacity = bpa * .55;
            var f = easeOut(u(t, T_FOUND, 1.2)); setVis(foundation, f > 0); foundation.scale.y = Math.max(.001, f);
            // dirt pad fades once the landscape arrives
            M.dirtM.opacity = 1 - u(t, T_FIN + .2, 1.8); dirt.visible = M.dirtM.opacity > .01;
            // walls rise one after another
            walls.forEach(function (w, i) { var k = easeOut(u(t, T_FRAME + i * .22, 1.1)); w.visible = k > 0; w.scale.y = Math.max(.001, k); });
            var fu = u(t, T_FRAME + .4, 1.0);[floors, slab1].forEach(function (g) { g.visible = fu > 0; g.scale.y = Math.max(.001, easeOut(fu)); });
            floor1.visible = fu > .6;
            var iu = u(t, T_FRAME + 1.0, 1.0);[in0, in1].forEach(function (g) { g.visible = iu > 0; g.scale.y = Math.max(.001, easeOut(iu)); });
            // sheathing -> house-wrap -> siding
            var stage = t < T_DRY ? 0 : t < T_FIN ? 1 : 2;
            if (stage === 0) { M.wall.map = TEX.osb; M.wall.color.setHex(0xffffff); M.wall.roughness = .95; }
            else if (stage === 1) { M.wall.map = TEX.wrap; M.wall.color.setHex(0xffffff); }
            else { M.wall.map = TEX.batten; M.wall.color.setHex(0xffffff); M.wall.roughness = .85; }
            M.wall.needsUpdate = M.wall.userData.stage !== stage; M.wall.userData.stage = stage;
            // roof layers
            var ud = u(t, T_FRAME + 1.4, 1.1); roofDeck.visible = ud > 0; M.deckL.opacity = ud; roofDeck.position.y = H + (1 - easeOut(ud)) * 5;
            var uu = u(t, T_DRY, 1.0); roofUnder.visible = uu > 0; M.underL.opacity = uu; roofUnder.position.y = H + (1 - easeOut(uu)) * 3;
            var us = u(t, T_DRY + 1.0, 1.4); roofShing.visible = us > 0; M.shingL.opacity = us; roofShing.position.y = H + (1 - easeOut(us)) * 3;
            // windows pop at dried-in
            windows.forEach(function (w, i) { var k = u(t, T_DRY + .2 + (i % 8) * .05, .7); w.visible = k > 0; w.scale.setScalar(Math.max(.001, backOut(k))); });
            // finishing: stone skirt, porch, chimney, landscape
            var pk = u(t, T_FIN, 1.2);[skirt, porch, chim].forEach(function (g, i) { var k = u(t, T_FIN + i * .25, 1.0); g.visible = k > 0; g.scale.setScalar(Math.max(.001, backOut(k))); });
            porchRoof.visible = pk > .2; porchRoof.scale.setScalar(Math.max(.001, backOut(u(t, T_FIN + .5, 1.0))));
            var lk = u(t, T_FIN + .6, 1.6); land.visible = lk > 0; land.scale.y = Math.max(.001, easeOut(lk)); paving.visible = t > T_FIN + .3;
            door.visible = pk > .3;
        }
        function applyOpen(o) {
            var e = ease(o);
            aFront.rotation.x = e * Math.PI * .5 * .985;                 // wing façade folds down onto the lawn
            bFront.position.y = -e * (H + 1.4);                           // main façade retracts into the base
            var lift = e;
            roofDeck.position.y += lift * 4.6; roofUnder.position.y += lift * 6.2; roofShing.position.y += lift * 7.8;
            chim.position.y = lift * 4.6; porchRoof.position.y = lift * 2.2;
            roofDeck.rotation.y = roofUnder.rotation.y = roofShing.rotation.y = e * .05;
        }
        var envIsDusk = false, lastN = -1;
        function applyNight(n) {
            if (Math.abs(n - lastN) > .004) { lastN = n; drawSky(SKY.dayTop.clone().lerp(SKY.duskTop, n), SKY.dayHor.clone().lerp(SKY.duskHor, n * .9)); }
            if (n > .5 !== envIsDusk) { envIsDusk = n > .5; scene.environment = envIsDusk ? envDusk : envDay; }
            var hor = SKY.dayHor.clone().lerp(SKY.duskHor, n * .9); scene.fog.color.copy(hor);
            hemi.intensity = .55 - n * .38; sun.intensity = 2.6 - n * 2.1; sun.color.setHex(n > .45 ? 0xffa466 : 0xfff0d2);
            sun.position.set(-24 + n * 8, 26 - n * 14, 30 - n * 6);
            renderer.toneMappingExposure = 1.0 + n * .08;
            M.glow.opacity = n * .9; M.lamp.emissiveIntensity = .15 + n * 1.6;
            warm.forEach(function (l) { l.intensity = n * 2.2; });
        }

        /* ---------- camera ---------- */
        var pointer = { x: 0, y: 0, tx: 0, ty: 0 }, look = new T.Vector3();
        function applyCamera(t) {
            var b = u(t, 0, BUILD_END), oc = u(t, OPEN_AT, OPEN_DUR), e = ease(oc);
            var ang = .5 - b * .25 + e * .2 + Math.sin(t * .15) * .05 + pointer.x * .12;
            var rad = 56 - b * 5 - e * 3, hgt = 13 + b * 1.5 + e * 5 + pointer.y * 1.2;
            var portrait = camera.aspect < 1;
            if (portrait) { rad *= 1.25; hgt += 3; }
            camera.position.set(Math.sin(ang) * rad, hgt, Math.cos(ang) * rad);
            look.set(portrait ? 0 : 1.0, portrait ? 12 : 4.4 + e * 3.4, 0);
            camera.lookAt(look);
        }

        /* ---------- sizing ---------- */
        function size() {
            var w = host.clientWidth || 800, h = host.clientHeight || 500;
            renderer.setSize(w, h, false); canvas.style.width = "100%"; canvas.style.height = "100%";
            camera.aspect = w / h; camera.fov = w / h < 1 ? 42 : 30;
            camera.clearViewOffset();
            camera.updateProjectionMatrix();
        }
        size();
        if (window.ResizeObserver) new ResizeObserver(size).observe(host); else window.addEventListener("resize", size);

        /* ---------- UI + loop ---------- */
        var refresh = bindUI(host, {
            act: function (a) {
                if (a === "play") { playing = !playing; }
                else if (a === "build") { clock = 0; manual = false; playing = true; }
                else if (a === "open") { clock = OPEN_AT - .3; manual = true; playing = true; }
                else if (a === "dusk") { clock = DUSK_AT - .1; manual = true; playing = true; }
                last = performance.now(); frame(performance.now(), true); if (playing) start();
            }
        });
        function stageLabel(t) {
            return t < T_FOUND ? "Stage 00 \u00b7 Blueprint" : t < T_FRAME ? "Stage 01 \u00b7 Foundation" : t < T_DRY ? "Stage 02 \u00b7 Framing" : t < T_FIN ? "Stage 03 \u00b7 Dried in"
                : t < OPEN_AT ? "Stage 04 \u00b7 Home" : t < DUSK_AT ? "Open up" : "Dusk";
        }
        (host.closest(".h3-viewport") || host.parentNode).addEventListener("pointermove", function (e) {
            var r = host.getBoundingClientRect(); pointer.tx = ((e.clientX - r.left) / r.width - .5) * 2; pointer.ty = -((e.clientY - r.top) / r.height - .5) * 2;
        });
        var visible = true, last = performance.now(), raf = 0, manual = false, restarting = false;
        var viewport = host.closest(".h3-viewport") || host.parentNode;
        function loopEnd() { return manual ? TOTAL : LOOP_END; }
        function restart() {
            if (restarting) return; restarting = true; viewport.classList.add("h3-fade");
            setTimeout(function () { clock = 0; manual = false; restarting = false; last = performance.now(); viewport.classList.remove("h3-fade"); if (playing) start(); }, 520);
        }
        function frame(now, force) {
            raf = 0; var dt = Math.min(.05, (now - last) / 1000); last = now;
            if (playing && !reduce && !restarting) { clock = Math.min(loopEnd(), clock + dt); if (clock >= loopEnd()) restart(); }
            pointer.x += (pointer.tx - pointer.x) * .05; pointer.y += (pointer.ty - pointer.y) * .05;
            var t = clock;
            applyBuild(t); applyOpen(u(t, OPEN_AT, OPEN_DUR)); applyNight(ease(u(t, DUSK_AT, DUSK_DUR)));
            applyCamera(t);
            renderer.render(scene, camera);
            refresh({ phase: t < OPEN_AT ? "build" : t < DUSK_AT ? "open" : "dusk", playing: playing, label: stageLabel(t), progress: t / TOTAL });
            if (!force && visible && !reduce) raf = requestAnimationFrame(frame);
        }
        function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
        if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !reduce) start(); }, { threshold: .05 }).observe(host);
        document.addEventListener("visibilitychange", function () { if (!document.hidden && visible && !reduce) start(); });
        window.HD.hero3d = { seek: function (t) { playing = false; clock = clamp(t, 0, TOTAL); frame(performance.now(), true); }, total: TOTAL };
        frame(performance.now(), reduce); if (!reduce) start();
        host.setAttribute("data-ready", "1");
        return true;
    };
})(window);
