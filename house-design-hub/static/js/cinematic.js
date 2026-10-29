/**
 * AI House Design - Cinema HUD, Blueprint Stage Scrubber & Exploded Layers
 */
(function (window) {
  "use strict";
  window.HD = window.HD || {};

  window.HD.initMasterExperience = function (mountEl) {
    if (!mountEl) return;

    var activeTab = "blueprint";
    var currentStage = 0;
    var currentRoom = 0;
    var filmInterval = null;
    var isFilmPlaying = false;

    var stagesData = [
      { num: "STAGE 00", title: "Blueprint CAD", desc: "Every home starts as lines on paper. Scroll to watch this one come to life.", tag: "CAD WIREFRAME" },
      { num: "STAGE 01", title: "Foundation", desc: "Poured footers and a sealed crawl space set the stage for what goes up.", tag: "SOLID FOOTING" },
      { num: "STAGE 02", title: "Framing", desc: "Every wall, floor, joist and truss built to blueprint plan. Solid lumber as good as it gets.", tag: "TIMBER SKELETON" },
      { num: "STAGE 03", title: "Dried in", desc: "Weather-tight. Fully house-wrapped and roof-sealed before the weather gets a say.", tag: "WEATHER SHIELD" },
      { num: "STAGE 04", title: "Exterior", desc: "Architectural shingles, board-and-batten siding and hand-laid stone.", tag: "FACADE & STONE" },
      { num: "STAGE 05", title: "Welcome Home", desc: "4,200 sq ft, five bedrooms, five bathrooms. Built to picture.", tag: "COMPLETED RESIDENCE" }
    ];

    var layersData = [
      { id: "01", name: "ROOF DECK", spec: "5/8\" or 3/4\" exterior-grade plywood/OSB. Inspected and structurally verified." },
      { id: "02", name: "DRIP EDGE", spec: "Corrosion-resistant eaves & rakes edging to direct runoff clear of fascia." },
      { id: "03", name: "ICE & WATER SHIELD", spec: "Self-adhering waterproof membrane along eaves, valleys, and vulnerable joints." },
      { id: "04", name: "SYNTHETIC UNDERLAYMENT", spec: "High-traction woven polymer air and moisture barrier with 4\" overlapping seams." },
      { id: "05", name: "ARCHITECTURAL SHINGLES", spec: "Multi-layered fiberglass dimensional asphalt shingles with Class-A fire rating." },
      { id: "06", name: "RIDGE VENT & CAP", spec: "Continuous passive exhaust ventilation balancing ridge airflow and attic temperature." }
    ];

    var roomsData = [
      { name: "EXTERIOR", sub: "Architectural Facade & Landscaping", lens: "24mm F/2.8", iso: "ISO 100", tc: "00:00:14:02" },
      { name: "FOYER", sub: "Grand High-Ceiling Reception Gallery", lens: "35mm F/1.8", iso: "ISO 200", tc: "00:01:04:18" },
      { name: "DINING ROOM", sub: "Coffered Ceiling Formal Dining Space", lens: "50mm F/1.4", iso: "ISO 320", tc: "00:02:18:09" },
      { name: "KITCHEN", sub: "Chef's Island with Quartz Countertops", lens: "35mm F/1.8", iso: "ISO 400", tc: "00:03:45:12" },
      { name: "LOWER LEVEL", sub: "Entertainment Billiards & Private Wet Bar", lens: "24mm F/2.8", iso: "ISO 500", tc: "00:04:30:20" },
      { name: "GREAT ROOM", sub: "Double-Height Natural Stone Fireplace", lens: "50mm F/1.4", iso: "ISO 250", tc: "00:05:12:04" },
      { name: "HOME OFFICE", sub: "Bespoke Built-in Oak Shelving & Library", lens: "35mm F/2.0", iso: "ISO 200", tc: "00:06:05:15" },
      { name: "PRIMARY SUITE", sub: "Master Retreat with Private Balcony", lens: "50mm F/1.4", iso: "ISO 160", tc: "00:07:22:19" },
      { name: "PRIMARY BATH", sub: "Freestanding Soaking Tub & Dual Vanities", lens: "24mm F/2.8", iso: "ISO 320", tc: "00:08:40:02" },
      { name: "BACKYARD", sub: "Outdoor Pool, Stone Patio & Covered Verandah", lens: "18mm F/2.8", iso: "ISO 100", tc: "00:09:55:23" }
    ];

    mountEl.innerHTML = `
      <div class="video-exp-wrapper">
        <div class="video-exp-header">
          <div class="video-exp-tabs">
            <button class="exp-tab-btn active" data-target="blueprint">Built from Blueprint</button>
            <button class="exp-tab-btn" data-target="layers">Six Layers (X-Ray)</button>
            <button class="exp-tab-btn" data-target="morningnight">Morning vs. Night</button>
            <button class="exp-tab-btn" data-target="film">Shot Like a Film</button>
          </div>
          <div class="exp-badge-info">CINEMA SYSTEM · 4K UHD 24FPS</div>
        </div>

        <div class="video-screen" id="videoScreen">
          <div class="screen-hud" id="screenHud">
            <div class="hud-top-bar">
              <div class="hud-rec-tag"><span class="rec-dot"></span> REC</div>
              <div class="hud-timecode" id="hudTc">00:01:24:05</div>
              <div class="hud-vu-meters">
                <div class="vu-bar"><span style="height:65%;"></span></div>
                <div class="vu-bar"><span style="height:55%;"></span></div>
                <span class="vu-label">CH1/CH2</span>
              </div>
            </div>

            <div class="hud-reticle"><div class="reticle-box"></div></div>

            <div class="hud-bottom-bar">
              <div>
                <div class="hud-big-title" id="hudBigTitle">EXTERIOR</div>
                <div class="hud-sub-title" id="hudSubTitle">Architectural Facade & Landscaping</div>
              </div>
              <div class="hud-tech-specs">
                <div id="hudOptics">24mm F/2.8 · ISO 100</div>
                <div id="hudBadgeRight" class="hud-accent-tag">DCI RAW</div>
              </div>
            </div>
          </div>

          <div class="viewport-layer active" id="layerBlueprint">
            <div class="bp-stage-img" id="bpStageImg"></div>
            <canvas class="bp-wireframe-canvas" id="bpCanvas"></canvas>
            <div class="bp-stage-card" id="bpStageCard">
              <div class="bp-stage-pill" id="bpCardPill">STAGE 00</div>
              <h3 id="bpCardTitle">Built from the blueprint up.</h3>
              <p id="bpCardDesc">Every home starts as lines on paper. Scroll or click through the stages below.</p>
            </div>
          </div>

          <div class="viewport-layer" id="layerSixLayers">
            <div class="xray-split-layout">
              <div class="xray-text-col">
                <div class="xray-kicker">X-RAY · MULTI-SECTION</div>
                <h2 class="xray-heading">SIX LAYERS.<br>ZERO SHORTCUTS.</h2>
                <div class="xray-layer-list" id="xrayLayerList"></div>
              </div>
              <div class="xray-3d-visual">
                <div class="exploded-deck-stack" id="explodedStack"></div>
              </div>
            </div>
          </div>

          <div class="viewport-layer" id="layerMorningNight">
            <div class="slider-split-host" id="splitHost">
              <div class="split-side night" id="splitNight">
                <div class="side-label night-tag">NIGHT EXTERIOR</div>
              </div>
              <div class="split-side morning" id="splitMorning">
                <div class="side-label morning-tag">MORNING LIGHT</div>
              </div>
              <div class="split-divider-line" id="splitDivider">
                <div class="split-drag-handle">&harr;</div>
              </div>
            </div>
          </div>

          <div class="viewport-layer" id="layerFilmWalk">
            <div class="film-room-visual" id="filmRoomVisual"></div>
          </div>
        </div>

        <div class="video-exp-controls">
          <div class="ctrl-subpanel active" id="ctrlBlueprint">
            <div class="bp-timeline-bar" id="bpTimelineBar"></div>
          </div>

          <div class="ctrl-subpanel" id="ctrlLayers">
            <div class="layers-action-row">
              <button class="btn" id="btnExplodeAll">Explode Layers Stack</button>
              <button class="btn primary" id="btnAssembleAll">Assemble Solid Roof</button>
              <span class="muted small">Hover or click any structural layer to inspect engineering specs.</span>
            </div>
          </div>

          <div class="ctrl-subpanel" id="ctrlMorningNight">
            <div class="split-instructions">
              <span><strong>Drag the slider handle:</strong> Compare stormy morning ambient daylight with finished warm interior lighting at dusk.</span>
            </div>
          </div>

          <div class="ctrl-subpanel" id="ctrlFilm">
            <div class="film-ctrl-row">
              <button class="btn primary" id="btnPlayFilm">Play Walkthrough &blacktriangleright;</button>
              <div class="film-chips-scroll" id="filmChipsScroll"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    var screenHud = document.getElementById("screenHud");
    var hudTc = document.getElementById("hudTc");
    var hudBigTitle = document.getElementById("hudBigTitle");
    var hudSubTitle = document.getElementById("hudSubTitle");
    var hudOptics = document.getElementById("hudOptics");
    var hudBadgeRight = document.getElementById("hudBadgeRight");

    var layerBlueprint = document.getElementById("layerBlueprint");
    var layerSixLayers = document.getElementById("layerSixLayers");
    var layerMorningNight = document.getElementById("layerMorningNight");
    var layerFilmWalk = document.getElementById("layerFilmWalk");

    var ctrlBlueprint = document.getElementById("ctrlBlueprint");
    var ctrlLayers = document.getElementById("ctrlLayers");
    var ctrlMorningNight = document.getElementById("ctrlMorningNight");
    var ctrlFilm = document.getElementById("ctrlFilm");

    var bpCanvas = document.getElementById("bpCanvas");
    var bpStageImg = document.getElementById("bpStageImg");
    var bpCardPill = document.getElementById("bpCardPill");
    var bpCardTitle = document.getElementById("bpCardTitle");
    var bpCardDesc = document.getElementById("bpCardDesc");
    var bpTimelineBar = document.getElementById("bpTimelineBar");

    var xrayLayerList = document.getElementById("xrayLayerList");
    var explodedStack = document.getElementById("explodedStack");

    var splitHost = document.getElementById("splitHost");
    var splitMorning = document.getElementById("splitMorning");
    var splitDivider = document.getElementById("splitDivider");

    var filmRoomVisual = document.getElementById("filmRoomVisual");
    var btnPlayFilm = document.getElementById("btnPlayFilm");
    var filmChipsScroll = document.getElementById("filmChipsScroll");

    stagesData.forEach(function (st, idx) {
      var btn = document.createElement("button");
      btn.className = "bp-step-btn" + (idx === 0 ? " active" : "");
      btn.innerHTML = `<span class="bp-step-tag">${st.num}</span><span class="bp-step-lbl">${st.title}</span>`;
      btn.onclick = function () { setBlueprintStage(idx); };
      bpTimelineBar.appendChild(btn);
    });

    function drawBlueprintWireframe() {
      bpCanvas.width = bpCanvas.clientWidth || 800;
      bpCanvas.height = bpCanvas.clientHeight || 500;
      var ctx = bpCanvas.getContext("2d");
      ctx.clearRect(0, 0, bpCanvas.width, bpCanvas.height);

      ctx.strokeStyle = "rgba(45, 212, 191, 0.25)";
      ctx.lineWidth = 1;
      var step = 32;
      for (var x = 0; x < bpCanvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, bpCanvas.height); ctx.stroke();
      }
      for (var y = 0; y < bpCanvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(bpCanvas.width, y); ctx.stroke();
      }

      ctx.strokeStyle = "rgba(45, 212, 191, 0.9)";
      ctx.lineWidth = 2;
      var cx = bpCanvas.width * 0.5;
      var cy = bpCanvas.height * 0.55;
      var w = bpCanvas.width * 0.5;
      var h = bpCanvas.height * 0.35;

      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, cy - h / 2);
      ctx.lineTo(cx, cy - h * 0.85);
      ctx.lineTo(cx + w / 2, cy - h / 2);
      ctx.stroke();

      for (var rx = -w / 2 + 30; rx < w / 2; rx += 35) {
        ctx.beginPath();
        ctx.moveTo(cx + rx, cy - h / 2);
        ctx.lineTo(cx + rx * 0.6, cy - h * 0.7);
        ctx.stroke();
      }
    }

    function setBlueprintStage(idx) {
      currentStage = idx;
      var st = stagesData[idx];
      bpCardPill.textContent = st.num;
      bpCardTitle.textContent = st.title;
      bpCardDesc.textContent = st.desc;

      hudBigTitle.textContent = st.title.toUpperCase();
      hudSubTitle.textContent = st.desc;
      hudBadgeRight.textContent = st.tag;

      Array.from(bpTimelineBar.children).forEach(function (b, i) {
        b.classList.toggle("active", i === idx);
      });

      if (idx === 0) {
        bpCanvas.style.display = "block";
        drawBlueprintWireframe();
        bpStageImg.style.filter = "invert(0.9) hue-rotate(180deg) brightness(0.6)";
      } else {
        bpCanvas.style.display = "none";
        if (idx === 1) bpStageImg.style.filter = "sepia(0.85) contrast(1.2) brightness(0.7)";
        if (idx === 2) bpStageImg.style.filter = "sepia(0.65) saturate(1.8) brightness(0.85)";
        if (idx === 3) bpStageImg.style.filter = "contrast(1.25) brightness(0.95)";
        if (idx === 4) bpStageImg.style.filter = "contrast(1.1) brightness(1.05)";
        if (idx === 5) bpStageImg.style.filter = "none";
      }
    }

    layersData.forEach(function (layer, idx) {
      var item = document.createElement("div");
      item.className = "xray-item" + (idx === 0 ? " active" : "");
      item.innerHTML = `
        <div class="xray-item-num">${layer.id}</div>
        <div class="xray-item-body">
          <div class="xray-item-name">${layer.name}</div>
          <div class="xray-item-spec">${layer.spec}</div>
        </div>
      `;
      item.onmouseenter = function () { selectLayer(idx); };
      xrayLayerList.appendChild(item);

      var plate = document.createElement("div");
      plate.className = "deck-plate plate-" + layer.id;
      plate.style.transform = "translateZ(" + ((5 - idx) * 45) + "px)";
      plate.innerHTML = `<span class="plate-label">${layer.id} ${layer.name}</span>`;
      plate.onclick = function () { selectLayer(idx); };
      explodedStack.appendChild(plate);
    });

    function selectLayer(idx) {
      Array.from(xrayLayerList.children).forEach(function (el, i) { el.classList.toggle("active", i === idx); });
      Array.from(explodedStack.children).forEach(function (el, i) { el.classList.toggle("highlight", i === idx); });
    }

    document.getElementById("btnExplodeAll").onclick = function () {
      Array.from(explodedStack.children).forEach(function (el, i) {
        el.style.transform = "translateZ(" + ((5 - i) * 70) + "px) translateY(" + ((i - 2.5) * 15) + "px)";
      });
    };

    document.getElementById("btnAssembleAll").onclick = function () {
      Array.from(explodedStack.children).forEach(function (el, i) {
        el.style.transform = "translateZ(" + ((5 - i) * 8) + "px)";
      });
    };

    var isDraggingSplit = false;
    function updateSplitPosition(clientX) {
      var rect = splitHost.getBoundingClientRect();
      var pos = Math.max(0, Math.min(clientX - rect.left, rect.width));
      var pct = (pos / rect.width) * 100;
      splitMorning.style.width = pct + "%";
      splitDivider.style.left = pct + "%";
    }

    splitDivider.addEventListener("mousedown", function () { isDraggingSplit = true; });
    window.addEventListener("mouseup", function () { isDraggingSplit = false; });
    window.addEventListener("mousemove", function (e) {
      if (isDraggingSplit) updateSplitPosition(e.clientX);
    });

    splitHost.addEventListener("touchstart", function (e) {
      if (e.touches && e.touches[0]) {
        isDraggingSplit = true;
        updateSplitPosition(e.touches[0].clientX);
      }
    }, { passive: true });
    window.addEventListener("touchend", function () { isDraggingSplit = false; });
    window.addEventListener("touchmove", function (e) {
      if (isDraggingSplit && e.touches && e.touches[0]) {
        updateSplitPosition(e.touches[0].clientX);
      }
    }, { passive: true });

    roomsData.forEach(function (rm, idx) {
      var chip = document.createElement("button");
      chip.className = "film-chip-btn" + (idx === 0 ? " active" : "");
      chip.textContent = rm.name;
      chip.onclick = function () { selectFilmRoom(idx); };
      filmChipsScroll.appendChild(chip);
    });

    function selectFilmRoom(idx) {
      currentRoom = idx;
      var target = roomsData[idx];

      hudBigTitle.textContent = target.name;
      hudSubTitle.textContent = target.sub;
      hudOptics.textContent = target.lens + " · " + target.iso;
      hudTc.textContent = target.tc;
      hudBadgeRight.textContent = "4K RAW FILM";

      Array.from(filmChipsScroll.children).forEach(function (b, i) {
        b.classList.toggle("active", i === idx);
      });
    }

    btnPlayFilm.onclick = function () {
      if (isFilmPlaying) {
        clearInterval(filmInterval);
        isFilmPlaying = false;
        btnPlayFilm.innerHTML = "Play Walkthrough &blacktriangleright;";
      } else {
        isFilmPlaying = true;
        btnPlayFilm.innerHTML = "Pause Walkthrough &#10074;&#10074;";
        filmInterval = setInterval(function () {
          var next = (currentRoom + 1) % roomsData.length;
          selectFilmRoom(next);
        }, 3000);
      }
    };

    setInterval(function () {
      if (activeTab === "film" || activeTab === "blueprint") {
        var now = new Date();
        var ms = Math.floor((now.getMilliseconds() / 1000) * 24);
        hudTc.textContent = "00:" + String(now.getMinutes()).padStart(2, "0") + ":" +
          String(now.getSeconds()).padStart(2, "0") + ":" + String(ms).padStart(2, "0");
      }
    }, 180);

    var tabBtns = mountEl.querySelectorAll(".exp-tab-btn");
    tabBtns.forEach(function (btn) {
      btn.onclick = function () {
        tabBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        activeTab = btn.getAttribute("data-target");

        [layerBlueprint, layerSixLayers, layerMorningNight, layerFilmWalk].forEach(function (l) { l.classList.remove("active"); });
        [ctrlBlueprint, ctrlLayers, ctrlMorningNight, ctrlFilm].forEach(function (c) { c.classList.remove("active"); });

        if (activeTab === "blueprint") {
          layerBlueprint.classList.add("active");
          ctrlBlueprint.classList.add("active");
          screenHud.style.display = "flex";
          setBlueprintStage(currentStage);
        } else if (activeTab === "layers") {
          layerSixLayers.classList.add("active");
          ctrlLayers.classList.add("active");
          screenHud.style.display = "none";
        } else if (activeTab === "morningnight") {
          layerMorningNight.classList.add("active");
          ctrlMorningNight.classList.add("active");
          screenHud.style.display = "none";
        } else if (activeTab === "film") {
          layerFilmWalk.classList.add("active");
          ctrlFilm.classList.add("active");
          screenHud.style.display = "flex";
          selectFilmRoom(currentRoom);
        }
      };
    });

    setBlueprintStage(0);
  };
})(window);
