/* 3D / 4D house viewer (three.js r128). 4D = time: construction progress + time of day. */
(function () {
  var HD = (window.HD = window.HD || {});

  var ROOM_FLOOR = {
    living: 0xf6e7c8, kitchen: 0xffe0c2, dining: 0xfbe9ad, bedroom: 0xcfe8f7, master: 0xbfdcf5, bath: 0xbfeee6,
    porch: 0xe3e0d6, verandah: 0xe3e0d6, pooja: 0xffd9e4, balcony: 0xd8f0c8, lounge: 0xe8dcf7, stair: 0xd9d9d9,
    store: 0xe6d9c8, carport: 0xd6dbe0, study: 0xf0e1ff
  };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  /* prism extruded along X with a triangular cross-section [[z,y],[z,y],[z,y]] */
  function prism(halfX, cs) {
    var pos = [], i;
    for (i = 0; i < 3; i++) pos.push(-halfX, cs[i][1], cs[i][0]);
    for (i = 0; i < 3; i++) pos.push(halfX, cs[i][1], cs[i][0]);
    var idx = [0, 1, 2, 3, 5, 4,
      0, 3, 4, 0, 4, 1,
      1, 4, 5, 1, 5, 2,
      2, 5, 3, 2, 3, 0];
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function HouseViewer(container, plan) {
    this.container = container;
    this.plan = plan;
    this.active = true;
    this.autoRotate = false;
    this.progress = 1;
    this.hour = 12;
    this.onStage = null;
    this.az = 0.55; this.el = 0.5;
    var P = plan, FH = P.floor_height;
    this.FH = FH;
    this.radius = Math.max(P.plot.w, P.plot.d, FH * P.floor_list.length * 2.2) * 1.55;

    var w = container.clientWidth || 640, h = container.clientHeight || 420;
    var r = (this.renderer = new THREE.WebGLRenderer({ antialias: true }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.setSize(w, h);
    r.shadowMap.enabled = true;
    container.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, w / h, 1, 3000);
    this.target = new THREE.Vector3(0, FH * P.floor_list.length * 0.4, 0);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x556655, 0.7);
    this.sun = new THREE.DirectionalLight(0xffffff, 0.9);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    var sc = this.sun.shadow.camera, s = Math.max(P.plot.w, P.plot.d) * 0.9;
    sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.near = 10; sc.far = 500;
    this.moon = new THREE.DirectionalLight(0x6f86ff, 0);
    this.moon.position.set(-90, 120, -60);
    this.scene.add(this.hemi, this.sun, this.sun.target, this.moon);

    this._build();
    this._bindControls();
    this.setProgress(1);
    this.setHour(12);

    var self = this;
    this._ro = new ResizeObserver(function () { self.resize(); });
    this._ro.observe(container);
    this._loop = function () {
      self._raf = requestAnimationFrame(self._loop);
      if (!self.active || self._disposed) return;
      if (self.autoRotate && !self._drag) self.az += 0.004;
      self._place();
      self.renderer.render(self.scene, self.camera);
    };
    this._loop();
  }

  var proto = HouseViewer.prototype;

  proto._build = function () {
    var P = this.plan, FH = this.FH, cx = P.plot.w / 2, cz = P.plot.d / 2, inn = P.inner;
    var floors = P.floor_list.length;
    var wallColor = new THREE.Color(P.palette.wall);
    this.extMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.9 });
    this.intMat = new THREE.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.95 });
    this.concrete = new THREE.Color(0x9a9a94);
    this.wallColor = wallColor;
    this.glassMat = new THREE.MeshStandardMaterial({ color: 0x8ecae6, roughness: 0.15, metalness: 0.2, emissive: 0xffc860, emissiveIntensity: 0 });
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.8 });
    var roofMat = new THREE.MeshStandardMaterial({ color: P.palette.roof, roughness: 0.85, side: THREE.DoubleSide });
    var self = this;

    function X(x) { return x - cx; }
    function Z(y) { return y - cz; }
    function box(wx, hy, dz, mat) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(wx, hy, dz), mat);
      m.castShadow = true; m.receiveShadow = true; return m;
    }

    // ground, plot, road
    var g = new THREE.Mesh(new THREE.PlaneGeometry(P.plot.w + 120, P.plot.d + 120), new THREE.MeshStandardMaterial({ color: 0x7aa66a, roughness: 1 }));
    g.rotation.x = -Math.PI / 2; g.receiveShadow = true; this.scene.add(g); this.ground = g;
    var plot = new THREE.Mesh(new THREE.PlaneGeometry(P.plot.w, P.plot.d), new THREE.MeshStandardMaterial({ color: 0x9cc58a, roughness: 1 }));
    plot.rotation.x = -Math.PI / 2; plot.position.y = 0.05; plot.receiveShadow = true; this.scene.add(plot);
    var road = new THREE.Mesh(new THREE.PlaneGeometry(P.plot.w + 120, 16), new THREE.MeshStandardMaterial({ color: 0x4a4d52, roughness: 1 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.06, -cz - 9); this.scene.add(road);

    // plinth / foundation
    var plinth = box(inn.w + 1.8, 1, inn.d + 1.8, new THREE.MeshStandardMaterial({ color: 0x8d8d86, roughness: 1 }));
    plinth.position.set(X(inn.x + inn.w / 2), 0.5, Z(inn.y + inn.d / 2));
    this.scene.add(plinth); this.plinth = plinth;

    this.floorGroups = [];
    this.windows = [];
    this.doors = [];
    var T = 0.05;

    P.floor_list.forEach(function (fl, level) {
      var grp = new THREE.Group();
      grp.position.y = 1 + level * FH;
      var wallH = FH - 0.5;
      var seen = {};

      var slab = box(inn.w + 0.9, 0.5, inn.d + 0.9, new THREE.MeshStandardMaterial({ color: 0xcfcfc8, roughness: 1 }));
      slab.position.set(X(inn.x + inn.w / 2), -0.25, Z(inn.y + inn.d / 2));
      grp.add(slab);

      function isExt(orient, a, b0, b1) {
        // a = fixed coordinate, [b0,b1] = span
        if (orient === 'h') return Math.abs(a - inn.y) < T * 2 || Math.abs(a - (inn.y + inn.d)) < T * 2;
        return Math.abs(a - inn.x) < T * 2 || Math.abs(a - (inn.x + inn.w)) < T * 2;
      }
      function wall(orient, a, b0, b1) {
        var key = orient + Math.round(a * 10) + ':' + Math.round(b0 * 10) + ':' + Math.round(b1 * 10);
        if (seen[key]) return; seen[key] = 1;
        var len = b1 - b0, ext = isExt(orient, a, b0, b1), th = ext ? 0.8 : 0.5;
        var m = orient === 'h' ? box(len + th, wallH, th, ext ? self.extMat : self.intMat) : box(th, wallH, len + th, ext ? self.extMat : self.intMat);
        var mid = (b0 + b1) / 2;
        if (orient === 'h') m.position.set(X(mid), wallH / 2, Z(a)); else m.position.set(X(a), wallH / 2, Z(mid));
        grp.add(m);
        if (ext && len >= 7) {
          var n = len > 16 ? 2 : 1;
          for (var i = 0; i < n; i++) {
            var pos = b0 + len * (n === 1 ? 0.5 : (i + 1) / 3);
            var win = orient === 'h' ? box(3.6, 4, th + 0.12, self.glassMat) : box(th + 0.12, 4, 3.6, self.glassMat);
            if (orient === 'h') win.position.set(X(pos), 5, Z(a)); else win.position.set(X(a), 5, Z(pos));
            win.castShadow = false; grp.add(win); self.windows.push(win);
          }
        }
      }

      fl.rooms.forEach(function (r) {
        var f = new THREE.Mesh(new THREE.BoxGeometry(r.w - 0.1, 0.1, r.h - 0.1),
          new THREE.MeshStandardMaterial({ color: ROOM_FLOOR[r.type] || 0xeeeeee, roughness: 1 }));
        f.position.set(X(r.x + r.w / 2), 0.06, Z(r.y + r.h / 2)); f.receiveShadow = true; grp.add(f);
        wall('h', r.y, r.x, r.x + r.w); wall('h', r.y + r.h, r.x, r.x + r.w);
        wall('v', r.x, r.y, r.y + r.h); wall('v', r.x + r.w, r.y, r.y + r.h);
        if (level === 0 && Math.abs(r.y - inn.y) < T * 2 && (r.type === 'porch' || r.type === 'verandah' || r.type === 'carport' || (r.type === 'living' && r.w > 9))) {
          var dw = r.type === 'carport' ? 9 : 3.4;
          var door = box(dw, r.type === 'carport' ? 7 : 7.2, 1.1, r.type === 'carport' ? new THREE.MeshStandardMaterial({ color: 0x777c80 }) : doorMat);
          door.position.set(X(r.x + r.w / 2), 3.7, Z(inn.y) - 0.1);
          grp.add(door); self.doors.push(door);
        }
      });
      self.scene.add(grp);
      self.floorGroups.push(grp);
    });

    // roof
    var top = 1 + floors * FH, roof = new THREE.Group();
    roof.position.set(X(inn.x + inn.w / 2), top, Z(inn.y + inn.d / 2));
    var hx = inn.w / 2 + 1.2, hz = inn.d / 2 + 1.2, mesh;
    if (P.roof === 'gable') {
      var rh = clamp(inn.d * 0.28, 4, 9);
      mesh = new THREE.Mesh(prism(hx, [[-hz, 0], [0, rh], [hz, 0]]), roofMat);
    } else if (P.roof === 'shed') {
      var sh = clamp(inn.d * 0.2, 3, 7);
      mesh = new THREE.Mesh(prism(hx, [[-hz, 0], [hz, 0], [hz, sh]]), roofMat);
    } else {
      mesh = box(inn.w + 2.4, 0.7, inn.d + 2.4, roofMat); mesh.position.y = 0.35;
      var tank = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.6, 16), new THREE.MeshStandardMaterial({ color: 0x2f5f9e }));
      tank.position.set(hx - 4, 2, -hz + 4); tank.castShadow = true; roof.add(tank);
    }
    mesh.castShadow = true; mesh.receiveShadow = true;
    roof.add(mesh);
    this.scene.add(roof); this.roof = roof; this.roofTop = top;
    this.cutaway = false;
  };

  /* ---- 4D: construction progress 0..1 ---- */
  proto.setProgress = function (p) {
    p = clamp(p, 0, 1); this.progress = p;
    var floors = this.floorGroups.length, seg = 0.63 / floors, i, stage = 'stage_foundation';
    this.plinth.scale.y = p < 0.12 ? Math.max(0.2, p / 0.12) : 1;
    this.plinth.position.y = 0.5 * this.plinth.scale.y;
    for (i = 0; i < floors; i++) {
      var f = clamp((p - 0.12 - i * seg) / seg, 0, 1), g = this.floorGroups[i];
      g.visible = f > 0; g.scale.y = Math.max(f, 0.001);
      if (f > 0) stage = 'stage_walls';
    }
    var rr = clamp((p - 0.75) / 0.15, 0, 1);
    this.roof.visible = rr > 0 && !this.cutaway;
    this.roof.position.y = this.roofTop + (1 - rr) * 28;
    if (rr > 0) stage = 'stage_roof';
    var fin = clamp((p - 0.9) / 0.1, 0, 1);
    this.extMat.color.copy(this.concrete).lerp(this.wallColor, fin);
    var showFin = fin > 0;
    this.windows.forEach(function (w) { w.visible = showFin; });
    this.doors.forEach(function (d) { d.visible = showFin; });
    if (fin > 0) stage = 'stage_finish';
    if (this.onStage) this.onStage(stage);
  };

  proto.setCutaway = function (on) {
    this.cutaway = !!on;
    this.setProgress(this.progress);
  };

  /* ---- time of day (hours 0..24) ---- */
  proto.setHour = function (h) {
    this.hour = h;
    var ang = (h - 6) / 12 * Math.PI, elev = Math.sin(ang);
    var k = smooth(-0.12, 0.28, elev), night = 1 - k;
    this.sun.position.set(Math.cos(ang) * 160, Math.max(elev, 0.02) * 170 + 8, 80);
    this.sun.target.position.set(0, 0, 0);
    var warm = 1 - smooth(0.1, 0.55, elev);
    this.sun.color.setRGB(1, 0.95 - 0.35 * warm, 0.88 - 0.5 * warm);
    this.sun.intensity = 1.0 * k;
    this.moon.intensity = 0.35 * night;
    this.hemi.intensity = 0.18 + 0.62 * k;
    var dayC = new THREE.Color(0xbfe3f5), duskC = new THREE.Color(0xf2b27a), nightC = new THREE.Color(0x0b1020);
    var sky = nightC.clone().lerp(duskC, smooth(-0.12, 0.05, elev)).lerp(dayC, smooth(0.05, 0.4, elev));
    this.scene.background = sky;
    if (this.container) this.container.style.background = '#' + sky.getHexString();
    this.glassMat.emissiveIntensity = night * 1.1;
    this.ground.material.color.setHex(0x7aa66a).multiplyScalar(0.25 + 0.75 * k);
  };

  /* ---- camera + controls ---- */
  proto._place = function () {
    var r = this.radius, el = this.el, az = this.az;
    this.camera.position.set(
      this.target.x + r * Math.sin(az) * Math.cos(el),
      this.target.y + r * Math.sin(el),
      this.target.z - r * Math.cos(az) * Math.cos(el));
    this.camera.lookAt(this.target);
  };

  proto._bindControls = function () {
    var self = this, el = this.renderer.domElement, ptrs = {}, lastDist = 0;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', function (e) {
      el.setPointerCapture(e.pointerId); ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      self._drag = true;
      var ids = Object.keys(ptrs);
      if (ids.length === 2) lastDist = Math.hypot(ptrs[ids[0]].x - ptrs[ids[1]].x, ptrs[ids[0]].y - ptrs[ids[1]].y);
    });
    el.addEventListener('pointermove', function (e) {
      var p = ptrs[e.pointerId]; if (!p) return;
      var ids = Object.keys(ptrs);
      if (ids.length === 1) {
        self.az -= (e.clientX - p.x) * 0.008;
        self.el = clamp(self.el + (e.clientY - p.y) * 0.006, 0.06, 1.45);
      } else if (ids.length === 2) {
        ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
        var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastDist) self.radius = clamp(self.radius * (lastDist / d), 30, 700);
        lastDist = d; return;
      }
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    });
    function up(e) { delete ptrs[e.pointerId]; lastDist = 0; if (!Object.keys(ptrs).length) self._drag = false; }
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      self.radius = clamp(self.radius * (1 + e.deltaY * 0.001), 30, 700);
    }, { passive: false });
  };

  proto.resize = function () {
    var w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  };

  proto.setActive = function (on) { this.active = on; if (on) this.resize(); };

  proto.dispose = function () {
    this._disposed = true;
    cancelAnimationFrame(this._raf);
    if (this._ro) this._ro.disconnect();
    this.scene.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.dispose(); });
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
  };

  HD.HouseViewer = HouseViewer;
})();
