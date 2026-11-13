(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme');
  if (btn) btn.addEventListener('click', function () {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function gutter() {
    var g = document.getElementById('gutter');
    var ed = document.querySelector('.editor');
    if (!g || !ed) return;
    var n = Math.max(40, Math.floor(ed.offsetHeight / 22));
    var out = '';
    for (var i = 1; i <= n; i++) out += i + '\n';
    g.textContent = out;
  }

  // ASCII request-flow texture: client -> api -> queue -> worker -> db, drawn with box characters.
  function ascii() {
    var el = document.getElementById('ascii');
    if (!el) return;
    var cols = Math.min(150, Math.floor(el.offsetWidth / 7.3));
    var rows = 13, grid = [];
    for (var r = 0; r < rows; r++) { grid.push(new Array(cols).fill(' ')); }
    function put(r, c, s) { for (var i = 0; i < s.length; i++) if (grid[r] && c + i < cols) grid[r][c + i] = s[i]; }
    function hline(r, c1, c2, ch) { for (var c = c1; c < c2; c++) put(r, c, ch || '-'); }
    function box(r, c, w, label) {
      hline(r, c, c + w, '-'); hline(r + 2, c, c + w, '-');
      put(r + 1, c, '|'); put(r + 1, c + w - 1, '|');
      put(r + 1, c + 2, label);
    }
    for (var rr = 0; rr < rows; rr += 4) hline(rr, 0, cols, '-');
    var step = Math.max(12, Math.floor(cols / 5)), labels = ['client', 'api', 'queue', 'worker', 'db'];
    for (var k = 0; k < labels.length; k++) {
      var c = k * step + 1; if (c + 11 > cols) break;
      var r0 = 1 + (k % 2) * 5;
      box(r0, c, 11, labels[k]);
      if (k < labels.length - 1) { hline(r0 + 1, c + 11, c + step, '.'); put(r0 + 1, c + step - 1, '>'); }
      
    }
    el.textContent = grid.map(function (row) { return row.join(''); }).join('\n');
  }

  function init() { ascii(); gutter(); }
  window.addEventListener('load', init);
  var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(init, 150); });
})();
