/* AI designer page: chat + parameter form -> /api/chat | /api/generate. */
(function () {
  var HD = window.HD;
  var $ = function (id) { return document.getElementById(id); };
  var log = $('chatLog'), input = $('chatInput'), view = $('view');
  var busy = false;

  function bubble(text, who, i18nKey) {
    var b = document.createElement('div');
    b.className = 'bubble ' + who;
    if (i18nKey) b.setAttribute('data-i18n', i18nKey);
    b.textContent = text;
    log.appendChild(b); log.scrollTop = log.scrollHeight;
    return b;
  }

  function show(data) { HD.mountView(view, data); }

  function post(url, body) {
    if (busy) return;
    busy = true;
    body.lang = HD.lang;
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        busy = false;
        if (data.error) { bubble(data.error, 'bot'); return; }
        bubble(data.reply, 'bot');
        show(data);
      })
      .catch(function () { busy = false; bubble('Network error, please try again.', 'bot'); });
  }

  $('chatForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim(); if (!text) return;
    bubble(text, 'me'); input.value = '';
    post('/api/chat', { message: text });
  });

  $('paramForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var body = {};
    new FormData(e.target).forEach(function (v, k) { if (v !== '') body[k] = v; });
    bubble(JSON.stringify(body).replace(/[{}"]/g, '').replace(/,/g, ' · '), 'me');
    post('/api/generate', body);
  });

  $('surprise').addEventListener('click', function () {
    post('/api/generate', { seed: Math.floor(Math.random() * 1e9) });
  });

  HD.ready.then(function () {
    bubble(HD.t('ai_hello'), 'bot', 'ai_hello');
    var p = new URLSearchParams(location.search), body = {};
    var q = (p.get('q') || '').trim().slice(0, 300);
    if (q) { bubble(q, 'me'); post('/api/chat', { message: q }); return; }
    ['style', 'beds', 'floors', 'w', 'd', 'facing', 'variant'].forEach(function (k) { if (p.get(k)) body[k] = p.get(k); });
    if (!Object.keys(body).length) body = { style: 'modern', beds: 3, floors: 2, w: 30, d: 40, facing: 'E' };
    post('/api/generate', body);
  });
})();