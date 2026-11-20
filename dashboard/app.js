// Token Launch Radar dashboard: renders window.RADAR with no network.
// Board, filters, sorting, a detail view per protocol and the live-token set that
// calibrates the board's category multiples. Deep links: #<slug> opens a protocol's
// detail view; ?category=, ?chain=, ?q= and ?watchlist=1 preset the filters.
(function () {
  var R = window.RADAR;
  if (!R) {
    document.getElementById('rows').innerHTML = '<tr><td colspan="8" class="empty">No radar data loaded.</td></tr>';
    return;
  }
  var watchSet = {};
  R.watchlist.forEach(function (s) { watchSet[s] = true; });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) {
    if (n == null || !isFinite(n)) return '—';
    var abs = Math.abs(n);
    if (abs >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
    if (abs >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }
  function pct(n) {
    if (n == null || !isFinite(n)) return '—';
    var v = (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    return (n > 0 ? '+' : '') + v + '%';
  }
  function ageText(d) {
    if (d == null) return 'unknown';
    if (d < 30) return d + 'd';
    if (d < 365) return Math.round(d / 30) + 'mo';
    return (d / 365).toFixed(1) + 'y';
  }

  document.getElementById('asof').textContent = R.as_of;
  document.getElementById('source').textContent = R.source;
  document.getElementById('livecount').textContent = '(' + R.live_size + ')';
  var totalImplied = R.rows.reduce(function (a, r) { return a + r.implied_value_usd; }, 0);
  document.getElementById('stats').innerHTML =
    '<div class="stat"><b>' + R.board_size + '</b><span>board rows</span></div>' +
    '<div class="stat"><b>' + R.watchlist_size + '</b><span>watchlist</span></div>' +
    '<div class="stat"><b>' + money(totalImplied) + '</b><span>total implied</span></div>' +
    '<div class="stat"><b>' + money(R.rows[0].implied_value_usd) + '</b><span>top implied</span></div>' +
    '<div class="stat"><b>' + R.model_version + '</b><span>model</span></div>';

  var catSel = document.getElementById('category');
  var chainSel = document.getElementById('chain');
  var cats = {};
  var chains = {};
  R.rows.forEach(function (r) {
    if (r.category) cats[r.category] = true;
    r.chains.forEach(function (c) { chains[c] = true; });
  });
  Object.keys(cats).sort().forEach(function (c) {
    catSel.add(new Option(c, c));
  });
  Object.keys(chains).sort().forEach(function (c) {
    chainSel.add(new Option(c, c));
  });

  var params = new URLSearchParams(location.search);
  var qEl = document.getElementById('q');
  var watchEl = document.getElementById('watchonly');
  var sortEl = document.getElementById('sort');
  if (params.get('q')) qEl.value = params.get('q');
  if (params.get('category')) catSel.value = params.get('category');
  if (params.get('chain')) chainSel.value = params.get('chain');
  if (params.get('watchlist') === '1') watchEl.checked = true;
  if (params.get('sort')) sortEl.value = params.get('sort');

  var rowsEl = document.getElementById('rows');
  var countEl = document.getElementById('count');

  function filtered() {
    var q = qEl.value.trim().toLowerCase();
    var cat = catSel.value;
    var chain = chainSel.value;
    var wonly = watchEl.checked;
    var list = R.rows.filter(function (r) {
      if (q && r.name.toLowerCase().indexOf(q) < 0 && r.slug.toLowerCase().indexOf(q) < 0) return false;
      if (cat && r.category !== cat) return false;
      if (chain && r.chains.indexOf(chain) < 0) return false;
      if (wonly && !watchSet[r.slug]) return false;
      return true;
    });
    var sort = sortEl.value;
    list.sort(function (a, b) {
      if (sort === 'tvl') return b.tvl_usd - a.tvl_usd;
      if (sort === 'growth') return (b.change_7d || 0) - (a.change_7d || 0);
      if (sort === 'age') return (b.age_days || 0) - (a.age_days || 0);
      if (sort === 'name') return a.name.localeCompare(b.name);
      return b.implied_value_usd - a.implied_value_usd;
    });
    return list;
  }

  function renderBoard() {
    var list = filtered();
    countEl.textContent = list.length + ' of ' + R.rows.length + ' shown';
    if (list.length === 0) {
      rowsEl.innerHTML = '<tr><td colspan="8" class="empty">No protocols match these filters.</td></tr>';
      return;
    }
    rowsEl.innerHTML = list.map(function (r) {
      var g = r.change_7d;
      var gCls = g == null ? '' : g >= 0 ? 'up' : 'down';
      var watch = watchSet[r.slug] ? '<span class="badge">WATCHLIST</span>' : '';
      return '<tr data-slug="' + esc(r.slug) + '">' +
        '<td class="num">' + r.rank + '</td>' +
        '<td><span class="name">' + esc(r.name) + '</span> ' + watch + '<br><span class="slug">' + esc(r.slug) + '</span></td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc(r.chains.join(', ') || '—') + '</td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td>' +
        '<td class="num ' + gCls + '">' + pct(g) + '</td>' +
        '<td class="num">' + r.category_multiple.toFixed(2) + '×</td>' +
        '<td class="num imp">' + money(r.implied_value_usd) + '</td>' +
        '</tr>';
    }).join('');
  }

  function renderLive() {
    document.getElementById('liverows').innerHTML = R.live.map(function (p) {
      var g = p.change_7d;
      var gCls = g == null ? '' : g >= 0 ? 'up' : 'down';
      return '<tr>' +
        '<td><span class="name">' + esc(p.name) + '</span><br><span class="slug">' + esc(p.slug) + '</span></td>' +
        '<td>' + esc(p.category || '—') + '</td>' +
        '<td>' + esc(p.chains.join(', ') || '—') + '</td>' +
        '<td class="num">' + money(p.tvl_usd) + '</td>' +
        '<td class="num">' + money(p.mcap_usd) + '</td>' +
        '<td class="num ' + gCls + '">' + pct(g) + '</td>' +
        '</tr>';
    }).join('');
  }

  function openDetail(slug) {
    var r = null;
    for (var i = 0; i < R.rows.length; i++) if (R.rows[i].slug === slug) { r = R.rows[i]; break; }
    var detail = document.getElementById('detail');
    var body = document.getElementById('detailbody');
    if (!r) { detail.hidden = true; body.innerHTML = ''; return; }
    var multLabel = r.multiple_source === 'category'
      ? r.category_multiple.toFixed(2) + '× ' + esc(r.category || 'uncategorised') + ' multiple'
      : r.category_multiple.toFixed(2) + '× global multiple';
    var math = money(r.tvl_usd) + ' TVL × ' + multLabel + ' × ' + r.growth_multiplier.toFixed(2) + '× growth × ' + r.maturity_multiplier.toFixed(2) +
      '× maturity × ' + r.breadth_multiplier.toFixed(2) + '× breadth = ' + money(r.implied_value_usd);
    var multWhy = r.multiple_source === 'category'
      ? 'the median market-cap-per-TVL of live ' + esc(r.category || 'uncategorised') + ' protocols'
      : 'the global median market-cap-per-TVL of live protocols (fewer than 3 live ' + esc(r.category || 'uncategorised') + ' protocols to price from)';
    var why = 'It ranks #' + r.rank + ' because its TVL of ' + money(r.tvl_usd) + ' is priced at ' +
      r.category_multiple.toFixed(2) + '× — ' + multWhy + ' — and it has run ' + ageText(r.age_days) + ' with no token. ' +
      (watchSet[r.slug] ? 'It is on the watchlist: at or above $50M TVL with no token. ' : 'It is below the $50M watchlist floor, which is where the early radar looks. ') +
      (r.change_7d == null ? 'No 7-day change was reported, so growth counts as flat.' :
        r.change_7d >= 0 ? 'Its TVL grew ' + pct(r.change_7d) + ' over 7 days.' : 'Its TVL fell ' + pct(r.change_7d) + ' over 7 days.');
    var steps = r.farm_steps.map(function (s) {
      var parts = s.split(' Cost: ');
      var main = parts[0];
      var rest = parts[1] ? parts[1].split(' Time: ') : [];
      var cost = rest[0] || '';
      var time = (rest[1] || '').replace(/\.$/, '');
      return '<li>' + esc(main) + '<span class="cost">Cost: ' + esc(cost) + ' · Time: ' + esc(time) + '</span></li>';
    }).join('');
    body.innerHTML =
      '<div class="detail-card">' +
      '<h2>' + esc(r.name) + (watchSet[r.slug] ? ' <span class="badge">WATCHLIST</span>' : '') + '</h2>' +
      '<p class="meta">' + esc(r.slug) + ' · ' + esc(r.category || 'Uncategorised') + ' · ' + esc(r.chains.join(', ') || '—') +
      ' · Listed ' + esc(r.listed_at || 'unknown') + ' · Age ' + ageText(r.age_days) + '</p>' +
      '<div class="kv">' +
      '<div><b>' + money(r.implied_value_usd) + '</b><span>implied value</span></div>' +
      '<div><b>' + money(r.tvl_usd) + '</b><span>TVL</span></div>' +
      '<div><b>' + pct(r.change_7d) + '</b><span>7-day change</span></div>' +
      '<div><b>' + r.category_multiple.toFixed(2) + '×</b><span>category multiple</span></div>' +
      '<div><b>#' + r.rank + ' of ' + R.rows.length + '</b><span>rank</span></div>' +
      '</div>' +
      '<div class="math">' + esc(math) + '</div>' +
      '<p class="why">' + esc(why) + '</p>' +
      '<h3>Farm plan — six steps</h3>' +
      '<ol class="steps">' + steps + '</ol>' +
      '</div>';
    detail.hidden = false;
    detail.scrollIntoView({ behavior: 'auto', block: 'start' });
    var sel = rowsEl.querySelector('tr.selected');
    if (sel) sel.classList.remove('selected');
    var row = rowsEl.querySelector('tr[data-slug="' + slug + '"]');
    if (row) row.classList.add('selected');
  }

  function closeDetail() {
    document.getElementById('detail').hidden = true;
    document.getElementById('detailbody').innerHTML = '';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    var sel = rowsEl.querySelector('tr.selected');
    if (sel) sel.classList.remove('selected');
  }

  rowsEl.addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-slug]');
    if (!tr) return;
    location.hash = tr.getAttribute('data-slug');
    openDetail(tr.getAttribute('data-slug'));
  });
  document.getElementById('closedetail').addEventListener('click', closeDetail);
  [qEl, catSel, chainSel, watchEl, sortEl].forEach(function (el) {
    el.addEventListener('input', renderBoard);
    el.addEventListener('change', renderBoard);
  });

  var tabs = document.querySelectorAll('#tabs button');
  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabs.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var live = btn.getAttribute('data-tab') === 'live';
      document.getElementById('liveview').hidden = !live;
      document.getElementById('boardview').hidden = live;
      document.getElementById('controls').style.display = live ? 'none' : '';
      if (live) renderLive();
    });
  });

  renderBoard();
  renderLive();
  if (location.hash && location.hash.length > 1) openDetail(location.hash.slice(1));
})();
