/* Gallery page: filters, search, pagination. */
(function () {
  var HD = window.HD;
  var $ = function (id) { return document.getElementById(id); };
  var grid = $('grid'), more = $('more'), empty = $('empty'), count = $('resultCount');
  var page = 1, loading = false, all = [];
  var params = new URLSearchParams(location.search);
  var topic = params.get('topic') || '';

  ['q', 'style', 'beds', 'floors', 'facing', 'sort'].forEach(function (k) {
    if (params.get(k) && $(k)) $(k).value = params.get(k);
  });

  function query() {
    var p = new URLSearchParams();
    ['q', 'style', 'beds', 'floors', 'facing', 'sort'].forEach(function (k) { if ($(k).value) p.set(k, $(k).value); });
    if (topic) p.set('topic', topic);
    p.set('page', page); p.set('per', 24);
    return p.toString();
  }

  function load(reset) {
    if (loading) return;
    loading = true;
    if (reset) { page = 1; all = []; }
    fetch('/api/designs?' + query()).then(function (r) { return r.json(); }).then(function (data) {
      all = all.concat(data.items);
      HD.renderCards(grid, data.items, !reset);
      count.setAttribute('data-n', data.total);
      count.textContent = HD.num(data.total) + ' ' + HD.t('designs_count');
      more.hidden = !data.has_more;
      empty.hidden = all.length > 0;
      loading = false;
    }).catch(function () { loading = false; });
  }

  var timer;
  ['q', 'style', 'beds', 'floors', 'facing', 'sort'].forEach(function (k) {
    $(k).addEventListener(k === 'q' ? 'input' : 'change', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { load(true); }, k === 'q' ? 250 : 0);
    });
  });
  more.addEventListener('click', function () { page++; load(false); });

  document.addEventListener('langchange', function () {
    HD.renderCards(grid, all);
    var n = count.getAttribute('data-n');
    if (n) count.textContent = HD.num(n) + ' ' + HD.t('designs_count');
  });

  HD.ready.then(function () { load(true); });
})();
