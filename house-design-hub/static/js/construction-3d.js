/* Interactive six-stage 3D construction preview, entirely self-hosted. */
(function () {
    'use strict';
    const root = document.getElementById('buildHero'); if (!root) return;
    const sceneEl = root.querySelector('.hero-v4-scene'); let renderer, scene, camera, house, raf, started = false;
    let parts = [];
    function addBox(w, h, d, x, y, z, color, stage, material) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material || new THREE.MeshStandardMaterial({ color, roughness: .75 })); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; house.add(mesh); parts.push({ mesh, stage }); return mesh; }
    function init() {
        if (started) return true; if (!window.THREE) return false;
        try {
            scene = new THREE.Scene(); scene.background = new THREE.Color(0xd5e6eb); camera = new THREE.PerspectiveCamera(36, 1, .1, 100); camera.position.set(12, 9, 15); camera.lookAt(0, 2.6, 0);
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.shadowMap.enabled = true; renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.domElement.className = 'construction-canvas'; renderer.domElement.setAttribute('aria-label', 'Animated three-dimensional house construction model'); renderer.domElement.setAttribute('role', 'img'); sceneEl.appendChild(renderer.domElement);
            scene.add(new THREE.HemisphereLight(0xffffff, 0x708a77, 1.3)); const sun = new THREE.DirectionalLight(0xfff4d6, 1.7); sun.position.set(6, 14, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); scene.add(sun);
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ color: 0x9ebfa4 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
            house = new THREE.Group(); scene.add(house);
            // Slab, concrete structure, masonry, roof, windows, landscaping — sequential groups.
            addBox(9, .32, 7, 0, .17, 0, 0xaaa9a0, 0);
            for (const x of [-4, 4]) for (const z of [-3, 3]) for (const floor of [0, 1]) addBox(.32, 2.8, .32, x, 1.7 + floor * 3, z, 0xc8c6bc, 1);
            for (const y of [3.05, 6.1]) addBox(8.7, .28, 6.7, 0, y, 0, 0xbcbab0, 1);
            for (const y of [1.65, 4.7]) {
                addBox(8, 2.7, .16, 0, y, -3, 0xece6dc, 2); addBox(8, 2.7, .16, 0, y, 3, 0xece6dc, 2);
                addBox(.15, 2.7, 5.8, -4, y, 0, 0xece6dc, 2); addBox(.15, 2.7, 5.8, 4, y, 0, 0xece6dc, 2);
            }
            addBox(9, .4, 7.3, 0, 6.45, 0, 0x414a4c, 3); addBox(9, .17, .4, 0, 6.3, -3.5, 0x29383c, 3);
            for (const y of [1.6, 4.65]) for (const x of [-2.4, 1.7]) {
                const glass = addBox(1.5, 1.55, .08, x, y, -3.14, 0x83c7dc, 4, new THREE.MeshStandardMaterial({ color: 0x85c5df, metalness: .22, roughness: .16, transparent: true, opacity: .82 }));
                addBox(.075, 1.65, .13, x, y, -3.23, 0x33454a, 4); addBox(1.6, .07, .13, x, y, -3.23, 0x33454a, 4);
            }
            addBox(1.15, 2.3, .1, .15, 1.3, -3.2, 0x9e7049, 4);
            for (const x of [-5.5, 5.5]) for (const z of [-3.7, 3.7]) { addBox(.35, 1.4, .35, x, .8, z, 0x71543a, 5); const tree = new THREE.Mesh(new THREE.SphereGeometry(.95, 12, 9), new THREE.MeshStandardMaterial({ color: 0x3d8e60 })); tree.position.set(x, 2, z); house.add(tree); parts.push({ mesh: tree, stage: 5 }); }
            function resize() { const w = sceneEl.clientWidth, h = sceneEl.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); } window.addEventListener('resize', resize); resize(); started = true; renderStage(Number(root.dataset.step) || 0);
            let angle = 0; function frame() { if (!document.hidden) { angle += .0016; house.rotation.y = Math.sin(angle) * .22; renderer.render(scene, camera); } raf = requestAnimationFrame(frame); } frame(); return true;
        } catch (e) { console.warn('Construction preview unavailable', e); return false; }
    }
    function renderStage(step) { if (!started) return; parts.forEach(({ mesh, stage }) => { mesh.visible = stage <= step; }); }
    root.addEventListener('constructionstep', e => renderStage(e.detail.step));
    const launch = document.createElement('button'); launch.type = 'button'; launch.className = 'hero-v4-3d'; launch.textContent = '◈ View 3D build'; launch.setAttribute('aria-pressed', 'false'); sceneEl.appendChild(launch);
    launch.addEventListener('click', () => { if (root.classList.contains('show-3d')) { root.classList.remove('show-3d'); launch.setAttribute('aria-pressed', 'false'); launch.textContent = '◈ View 3D build'; return; } if (init()) { root.classList.add('show-3d'); launch.setAttribute('aria-pressed', 'true'); launch.textContent = '▣ View photo'; } });
})();
