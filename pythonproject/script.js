(function () {
  var KEY = 'expense-tracker-v1';
  var money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function monthLabel(ym) { var p = ym.split('-').map(Number); return new Date(p[0], p[1] - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }); }
  function dayLabel(s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
  function title(s) { return s.trim().toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  var storageOK = true;
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var o = JSON.parse(raw); if (o && Array.isArray(o.items)) return o.items; }
    } catch (e) { storageOK = false; }
    return null;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ items: items })); } catch (e) { storageOK = false; }
    $('storage-warn').hidden = storageOK;
  }
  function examples() {
    var n = new Date();
    function ago(k) { return iso(new Date(n.getFullYear(), n.getMonth(), n.getDate() - k)); }
    var rows = [
      [0, 'Food', 180, 'Canteen lunch'], [1, 'Travel', 60, 'Auto to college'], [2, 'Education', 450, 'Notebooks and pens'],
      [4, 'Food', 320, 'Dinner with friends'], [6, 'Bills', 599, 'Mobile recharge'], [9, 'Shopping', 1299, 'T-shirt'],
      [14, 'Health', 220, 'Pharmacy'], [21, 'Food', 410, 'Weekend groceries'], [33, 'Bills', 1180, 'Wi-Fi bill'], [38, 'Travel', 940, 'Train ticket']
    ];
    return rows.map(function (r) { return { id: newId(), date: ago(r[0]), category: r[1], amount: r[2], note: r[3], example: true }; });
  }

  var items = load();
  if (items === null) { items = examples(); save(); }
  var query = '', monthFilter = 'all', pendingDelete = null;

  function status(msg) { $('status').textContent = msg; }
  function sum(list) { return list.reduce(function (t, e) { return t + e.amount; }, 0); }
  function visible() {
    var q = query.trim().toLowerCase();
    return items.filter(function (e) {
      if (monthFilter !== 'all' && e.date.slice(0, 7) !== monthFilter) return false;
      return !q || e.category.toLowerCase().indexOf(q) > -1 || e.note.toLowerCase().indexOf(q) > -1;
    }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1); });
  }
  function totalsBy(list, key) {
    var t = {};
    list.forEach(function (e) { var k = key(e); t[k] = (t[k] || 0) + e.amount; });
    return t;
  }

  function renderHeader() {
    var ym = iso(new Date()).slice(0, 7);
    var cur = items.filter(function (e) { return e.date.slice(0, 7) === ym; });
    $('month-name').textContent = monthLabel(ym);
    $('month-sum').textContent = money.format(sum(cur));
    var cats = totalsBy(cur, function (e) { return e.category; });
    var top = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; })[0];
    $('month-meta').textContent = cur.length ? cur.length + (cur.length === 1 ? ' expense' : ' expenses') + (top ? ', most on ' + top : '') : 'No expenses this month';
  }

  function barList(el, entries, max, asButtons) {
    if (!entries.length) { el.innerHTML = ''; return; }
    el.innerHTML = entries.map(function (en) {
      var w = max ? Math.max(2, Math.round(en.value / max * 100)) : 0;
      var inner = '<span class="line"><span>' + esc(en.label) + '</span><span>' + money.format(en.value) + '</span></span><span class="bar"><i style="width:' + w + '%"></i></span>';
      if (asButtons) return '<li><button class="line" type="button" data-m="' + esc(en.key) + '" style="display:grid;gap:4px;background:none;border:0;padding:0;color:inherit;text-align:left;cursor:pointer;width:100%">' + inner + '</button></li>';
      return '<li>' + inner + '</li>';
    }).join('');
  }

  function renderSummaries() {
    var scoped = monthFilter === 'all' ? items : items.filter(function (e) { return e.date.slice(0, 7) === monthFilter; });
    $('cat-scope').textContent = monthFilter === 'all' ? 'All months' : monthLabel(monthFilter);
    var c = totalsBy(scoped, function (e) { return e.category; });
    var ce = Object.keys(c).map(function (k) { return { label: k, value: c[k] }; }).sort(function (a, b) { return b.value - a.value; });
    if (ce.length) { barList($('cat-bars'), ce, ce[0].value, false); } else { $('cat-bars').innerHTML = '<li class="empty">Nothing recorded yet.</li>'; }

    var m = totalsBy(items, function (e) { return e.date.slice(0, 7); });
    var me = Object.keys(m).sort().reverse().map(function (k) { return { key: k, label: monthLabel(k), value: m[k] }; });
    var max = me.reduce(function (a, b) { return Math.max(a, b.value); }, 0);
    if (me.length) { barList($('mon-bars'), me, max, true); } else { $('mon-bars').innerHTML = '<li class="empty">Nothing recorded yet.</li>'; }
  }

  function renderMonthSelect() {
    var months = Object.keys(totalsBy(items, function (e) { return e.date.slice(0, 7); })).sort().reverse();
    if (monthFilter !== 'all' && months.indexOf(monthFilter) < 0) monthFilter = 'all';
    $('mf').innerHTML = '<option value="all">All months</option>' + months.map(function (k) { return '<option value="' + k + '">' + monthLabel(k) + '</option>'; }).join('');
    $('mf').value = monthFilter;
  }

  function renderList() {
    var list = visible();
    if (!list.length) {
      $('list').innerHTML = '<li class="empty">' + (items.length ? 'No expenses match your search.' : 'No expenses yet. Add your first one with the form.') + '</li>';
    } else {
      $('list').innerHTML = list.map(function (e) {
        var act = pendingDelete === e.id
          ? 'Delete? <button class="link yes" data-yes="' + e.id + '" type="button">Yes</button><button class="link" data-no="1" type="button">No</button>'
          : '<button class="link" data-del="' + e.id + '" type="button" aria-label="Delete ' + esc(e.category) + ' expense of ' + money.format(e.amount) + '">Delete</button>';
        return '<li class="row"><span class="d">' + dayLabel(e.date) + '</span><span class="m"><span class="cat">' + esc(e.category) + (e.example ? '<span class="tag">Example</span>' : '') + '</span>' +
          (e.note ? '<span class="note">' + esc(e.note) + '</span>' : '') + '</span><span class="amt">' + money.format(e.amount) + '</span><span class="act">' + act + '</span></li>';
      }).join('');
    }
    $('list-total').textContent = list.length ? 'Total: ' + money.format(sum(list)) + ' (' + list.length + (list.length === 1 ? ' expense)' : ' expenses)') : '';
  }

  function render() {
    renderHeader(); renderMonthSelect(); renderSummaries(); renderList();
    $('example-note').hidden = !items.some(function (e) { return e.example; });
    $('storage-warn').hidden = storageOK;
  }

  $('f-date').value = iso(new Date());
  $('add-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var amount = Math.round(parseFloat($('f-amt').value) * 100) / 100;
    var date = $('f-date').value;
    var cat = title($('f-cat').value) || 'Other';
    if (!(amount > 0)) { status('Enter an amount greater than zero.'); $('f-amt').focus(); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { status('Pick a valid date.'); $('f-date').focus(); return; }
    items.push({ id: newId(), date: date, category: cat, amount: amount, note: $('f-note').value.trim() });
    save();
    status('Added ' + money.format(amount) + ' to ' + cat + '.');
    $('f-amt').value = ''; $('f-note').value = ''; $('f-amt').focus();
    render();
  });

  $('list').addEventListener('click', function (ev) {
    var t = ev.target.closest('button'); if (!t) return;
    if (t.dataset.del) { pendingDelete = t.dataset.del; renderList(); return; }
    if (t.dataset.no) { pendingDelete = null; renderList(); return; }
    if (t.dataset.yes) {
      items = items.filter(function (e) { return e.id !== t.dataset.yes; });
      pendingDelete = null; save(); status('Expense deleted.'); render();
    }
  });
  $('mon-bars').addEventListener('click', function (ev) {
    var t = ev.target.closest('button[data-m]'); if (!t) return;
    monthFilter = monthFilter === t.dataset.m ? 'all' : t.dataset.m; render();
  });
  $('q').addEventListener('input', function (ev) { query = ev.target.value; pendingDelete = null; renderList(); });
  $('mf').addEventListener('change', function (ev) { monthFilter = ev.target.value; pendingDelete = null; renderSummaries(); renderList(); });
  $('clear-examples').addEventListener('click', function () {
    items = items.filter(function (e) { return !e.example; }); save(); status('Example entries cleared.'); render();
  });

  function csvCell(v) { var s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function toCsv() {
    var rows = [['id', 'date', 'category', 'amount', 'note']];
    items.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (e, i) { rows.push([i + 1, e.date, e.category, e.amount.toFixed(2), e.note]); });
    return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\n') + '\n';
  }
  function localDownload() {
    $('export').hidden = false;
    $('export').addEventListener('click', function () {
      if (!items.length) { status('There is nothing to export yet.'); return; }
      var blob = new Blob([toCsv()], { type: 'text/csv' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'expenses.csv';
      document.body.appendChild(a); a.click(); a.remove();
      status('Downloaded expenses.csv.');
    });
  }
  if (!(window.claude && typeof window.claude.use === 'function')) { localDownload(); }
  else {
    window.claude.use('downloads').then(function (dl) {
      if (!dl) return;
      $('export').hidden = false;
      $('export').addEventListener('click', function () {
        if (!items.length) { status('There is nothing to export yet.'); return; }
        dl.save({ filename: 'expenses.csv', data: toCsv() }).then(function () { status('Saved expenses.csv.'); })
          .catch(function (err) { if (!err || err.code !== 'declined') status('Could not save the file here.'); });
      });
    }).catch(function () {});
  }

  render();
})();
