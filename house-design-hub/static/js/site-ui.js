/**
 * site-ui.js
 *  1. "On this page" side navigation for the legal pages (Terms, Privacy, Cookies).
 *  2. Cookie consent pop-up (light/dark aware). Shown once per browser; remembered for a year.
 *     Google Analytics is loaded ONLY after the visitor accepts it.
 * Safe by design: every storage call is wrapped, nothing here can break the page.
 */
(function () {
    "use strict";

    /* ======================================================================================
     * 1. On this page (table of contents + scroll spy)
     * ====================================================================================== */
    function initToc() {
        var aside = document.querySelector(".doc-toc");
        var article = document.querySelector("article.doc[data-toc]");
        if (!aside || !article) return;
        var heads = article.querySelectorAll("h2");
        if (heads.length < 2) { aside.hidden = true; return; }

        var title = document.createElement("p");
        title.className = "doc-toc-h"; title.textContent = "On this page";
        var list = document.createElement("ol");
        var links = [], used = {};
        heads.forEach(function (h, i) {
            var id = h.id || (h.textContent || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section-" + (i + 1);
            while (used[id]) id += "-" + i;
            used[id] = 1; h.id = id;
            var li = document.createElement("li"), a = document.createElement("a");
            a.href = "#" + id; a.textContent = h.textContent; li.appendChild(a); list.appendChild(li); links.push(a);
        });
        aside.appendChild(title); aside.appendChild(list);

        function setActive(id) {
            links.forEach(function (a) {
                var on = a.getAttribute("href") === "#" + id;
                a.classList.toggle("active", on);
                if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
                if (on && window.innerWidth <= 900 && aside.scrollTo) {          // keep the active chip visible in the mobile row
                    try { aside.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" }); } catch (e) { }
                }
            });
        }
        setActive(heads[0].id);

        if ("IntersectionObserver" in window) {
            var visible = {};
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting ? e.boundingClientRect.top : null; });
                var best = null;
                heads.forEach(function (h) { var t = visible[h.id]; if (t != null && (best === null || t < visible[best])) best = h.id; });
                if (best) setActive(best);
            }, { rootMargin: "-80px 0px -65% 0px", threshold: 0 });
            heads.forEach(function (h) { io.observe(h); });
        }
        aside.addEventListener("click", function (e) {
            var a = e.target.closest("a[href^='#']"); if (!a) return;
            setActive(a.getAttribute("href").slice(1));
        });
    }

    /* ======================================================================================
     * 2. Cookie consent
     * ====================================================================================== */
    var KEY = "hd-consent", COOKIE = "hd_consent", VERSION = 1;
    var GA_ID = window.HD_GA_ID || "";

    function readChoice() {
        try {
            var raw = localStorage.getItem(KEY);
            if (raw) { var o = JSON.parse(raw); if (o && o.v === VERSION) return o; }
        } catch (e) { }
        try {
            var m = document.cookie.match(/(?:^|; )hd_consent=([^;]*)/);
            if (m) { var o2 = JSON.parse(decodeURIComponent(m[1])); if (o2 && o2.v === VERSION) return o2; }
        } catch (e) { }
        return null;
    }
    function saveChoice(analytics) {
        var o = { v: VERSION, analytics: !!analytics, ts: Date.now() }, s = JSON.stringify(o);
        try { localStorage.setItem(KEY, s); } catch (e) { }
        try { document.cookie = COOKIE + "=" + encodeURIComponent(s) + "; Max-Age=31536000; Path=/; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : ""); } catch (e) { }
        return o;
    }

    var gaLoaded = false;
    function loadAnalytics() {
        if (gaLoaded || !GA_ID) return; gaLoaded = true;
        window["ga-disable-" + GA_ID] = false;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag("js", new Date());
        window.gtag("config", GA_ID, { anonymize_ip: true });
        var s = document.createElement("script"); s.async = true;
        s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
        document.head.appendChild(s);
    }
    function stopAnalytics() {
        if (GA_ID) window["ga-disable-" + GA_ID] = true;
        try {                                                    // best effort: remove Google Analytics cookies we may have set before
            var host = location.hostname.split("."), domains = [location.hostname];
            for (var i = 1; i < host.length - 1; i++) domains.push("." + host.slice(i).join("."));
            document.cookie.split(";").forEach(function (c) {
                var n = c.split("=")[0].trim();
                if (n === "_ga" || n.indexOf("_ga_") === 0 || n === "_gid") domains.forEach(function (d) { document.cookie = n + "=; Max-Age=0; Path=/; Domain=" + d; document.cookie = n + "=; Max-Age=0; Path=/"; });
            });
        } catch (e) { }
    }
    function apply(choice) { if (choice && choice.analytics) loadAnalytics(); else stopAnalytics(); }

    var banner = null;
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

    function closeBanner() {
        if (!banner) return;
        var b = banner; banner = null; b.classList.remove("show");
        setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 260);
    }

    function openBanner(startManage, current) {
        if (banner) return;                                       // only ever one at a time
        var box = el("div", "cc");
        box.setAttribute("role", "dialog"); box.setAttribute("aria-labelledby", "cc-title"); box.setAttribute("aria-describedby", "cc-text");

        /* ---- main view ---- */
        var main = el("div", "cc-main");
        main.appendChild(el("h2", "cc-title", "We value your privacy")).id = "cc-title";
        var p = el("p", "cc-text"); p.id = "cc-text";
        p.appendChild(document.createTextNode("We use essential browser storage to remember your theme and language. Optional cookies may be used for analytics only with your permission. "));
        var pl = el("a", "cc-link", "Read our Privacy Policy"); pl.href = "/privacy"; p.appendChild(pl); p.appendChild(document.createTextNode("."));
        main.appendChild(p);
        var row = el("div", "cc-row");
        var bManage = el("button", "cc-btn", "Manage cookies"), bReject = el("button", "cc-btn", "Reject non-essential"), bAccept = el("button", "cc-btn cc-primary", "Accept all");
        [bManage, bReject, bAccept].forEach(function (b) { b.type = "button"; row.appendChild(b); });
        main.appendChild(row);

        /* ---- manage view ---- */
        var manage = el("div", "cc-manage"); manage.hidden = true;
        manage.appendChild(el("h2", "cc-title", "Cookie preferences"));
        function option(name, desc, checked, locked) {
            var label = el("label", "cc-opt"), txt = el("span", "cc-opt-t");
            txt.appendChild(el("strong", "", name)); txt.appendChild(el("small", "", desc));
            var input = el("input"); input.type = "checkbox"; input.checked = checked; input.disabled = !!locked;
            var sw = el("span", "cc-switch"); sw.setAttribute("aria-hidden", "true");
            label.appendChild(txt); label.appendChild(input); label.appendChild(sw); return { label: label, input: input };
        }
        var oEss = option("Essential", "Remembers your theme, language and this choice. Always on.", true, true);
        var oAna = option("Analytics", "Google Analytics, so we can see which pages are useful. Off unless you allow it.", !!(current && current.analytics), false);
        manage.appendChild(oEss.label); manage.appendChild(oAna.label);
        var row2 = el("div", "cc-row"), bSave = el("button", "cc-btn cc-primary", "Save choices"), bBack = el("button", "cc-btn", "Back");
        [bSave, bBack].forEach(function (b) { b.type = "button"; row2.appendChild(b); });
        manage.appendChild(row2);

        box.appendChild(main); box.appendChild(manage); document.body.appendChild(box); banner = box;
        requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add("show"); }); });

        function show(m) { main.hidden = m; manage.hidden = !m; }
        function decide(analytics) { var c = saveChoice(analytics); apply(c); closeBanner(); }
        bAccept.addEventListener("click", function () { decide(true); });
        bReject.addEventListener("click", function () { decide(false); });
        bManage.addEventListener("click", function () { show(true); oAna.input.focus(); });
        bBack.addEventListener("click", function () { show(false); bManage.focus(); });
        bSave.addEventListener("click", function () { decide(oAna.input.checked); });
        if (startManage) show(true);
    }

    function initConsent() {
        var choice = readChoice();
        apply(choice);
        if (!choice) setTimeout(function () { if (!readChoice()) openBanner(false, null); }, 700);

        // "Cookie settings" links anywhere on the site re-open the panel
        document.addEventListener("click", function (e) {
            var t = e.target.closest("[data-cookie-settings]"); if (!t) return;
            e.preventDefault(); if (banner) return; openBanner(true, readChoice());
        });
        // if the visitor decides in another tab, close the pop-up here too (keeps it to one decision at a time)
        window.addEventListener("storage", function (e) { if (e.key === KEY && e.newValue) { apply(readChoice()); closeBanner(); } });
    }

    function boot() { try { initToc(); } catch (e) { } try { initConsent(); } catch (e) { } }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();