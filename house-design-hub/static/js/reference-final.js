(function () {
    'use strict';
    const btn = document.getElementById('headerSearchBtn');
    const panel = document.getElementById('headerSearchPanel');
    if (btn && panel) {
        btn.addEventListener('click', () => {
            const opening = panel.hidden;
            panel.hidden = !opening;
            btn.setAttribute('aria-expanded', String(opening));
            if (opening) document.getElementById('headerSearchInput').focus();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !panel.hidden) {
                panel.hidden = true;
                btn.setAttribute('aria-expanded', 'false');
                btn.focus();
            }
        });
    }
})();
