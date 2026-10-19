/* Six-stage construction hero: high-resolution scene images, working controls, accessible state. */
(function () {
    'use strict';
    var root = document.getElementById('buildHero');
    if (!root) return;
    var names = ['Foundation', 'Structure', 'Walls', 'Roof', 'Finishing', 'Completed'];
    var buttons = Array.from(root.querySelectorAll('[data-build-step]'));
    var label = root.querySelector('#buildStageText');
    var progress = root.querySelector('#buildProgress');
    var toggle = root.querySelector('#buildToggle');
    var scene = root.querySelector('.hero-v4-scene > img');
    var thumbs = Array.from(root.querySelectorAll('.hero-v4-thumbs [data-build-step]'));
    var step = 2;
    var paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer = null;
    var sources = thumbs.map(function (button) { return button.getAttribute('data-build-image') || (button.querySelector('img') ? button.querySelector('img').src : ''); });
    function render() {
        root.dataset.step = String(step);
        if (scene && sources[step]) {
            if (scene.getAttribute('src') !== sources[step]) scene.setAttribute('src', sources[step]);
            scene.alt = names[step] + ' stage of a house construction project';
        }
        if (label) label.textContent = String(step + 1).padStart(2, '0') + ' / ' + names[step];
        if (progress) progress.style.width = ((step + 1) / names.length * 100) + '%';
        buttons.forEach(function (button) {
            var active = Number(button.getAttribute('data-build-step')) === step;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        if (toggle) {
            toggle.textContent = paused ? 'Watch the Construction Process' : 'Pause Construction'; toggle.setAttribute('data-state', paused ? 'play' : 'pause');
            toggle.setAttribute('aria-label', paused ? 'Play construction animation' : 'Pause construction animation');
        }
        root.dispatchEvent(new CustomEvent('constructionstep', { detail: { step: step } }));
    }
    function start() {
        window.clearInterval(timer);
        if (!paused && !document.hidden) timer = window.setInterval(function () { step = (step + 1) % names.length; render(); }, 4200);
    }
    buttons.forEach(function (button) {
        button.addEventListener('click', function () { step = Number(button.getAttribute('data-build-step')) || 0; paused = true; render(); start(); });
    });
    if (toggle) toggle.addEventListener('click', function () { paused = !paused; render(); start(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) window.clearInterval(timer); else start(); });
    render(); start();
})();
