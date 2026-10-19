/* Accessible preset and gallery quick-filter interactions. */
(function () {
    'use strict';
    const qs = (s, r = document) => r.querySelector(s), qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
    const collectionButtons = qsa('[data-collection-filter]');
    collectionButtons.forEach(button => button.addEventListener('click', () => {
        const choice = button.dataset.collectionFilter;
        collectionButtons.forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
        qsa('.collection-item').forEach(card => { card.hidden = choice !== 'all' && card.dataset.category !== choice; });
    }));
    const quickButtons = qsa('[data-quick]');
    const controls = { beds: qs('#beds'), facing: qs('#facing'), style: qs('#style'), sort: qs('#sort') };
    function syncQuick(button) { quickButtons.forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); }); }
    quickButtons.forEach(button => button.addEventListener('click', () => {
        if (!controls.beds) return;
        const key = button.dataset.quick;
        controls.beds.value = ['1', '2', '3'].includes(key) ? key : '';
        controls.facing.value = key === 'north' ? 'N' : '';
        controls.style.value = key === 'modern' ? 'modern' : '';
        // The server has no documented budget filter; low-cost uses ascending price sort.
        controls.sort.value = key === 'low' ? 'cost_asc' : 'popular';
        syncQuick(button);
        controls.sort.dispatchEvent(new Event('change', { bubbles: true }));
    }));
    ['beds', 'facing', 'style', 'sort'].forEach(id => controls[id]?.addEventListener('change', () => {
        if (quickButtons.length) quickButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    }));
})();
