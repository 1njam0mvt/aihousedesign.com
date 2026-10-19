/* v11: remote photo fallback, including cached failures. */
(() => {
    const init = () => {
        document.querySelectorAll('img.architecture-photo[data-fallback]').forEach(img => {
            const useFallback = () => {
                if (img.dataset.fallbackUsed === '1') return;
                img.dataset.fallbackUsed = '1';
                img.src = img.dataset.fallback;
            };
            img.addEventListener('error', useFallback, { once: true });
            if (img.complete && img.naturalWidth === 0) useFallback();
        });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
