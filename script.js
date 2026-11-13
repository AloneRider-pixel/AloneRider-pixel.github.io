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
    var cols = Math.min(110, Math.floor((el.offsetWidth - 8) / 8.6));
    var rows = 14, grid = [];
    for (var r = 0; r < rows; r++) { grid.push(new Array(cols).fill(' ')); }
    function put(r, c, s) { for (var i = 0; i < s.length; i++) if (grid[r] && c + i >= 0 && c + i < cols) grid[r][c + i] = s[i]; }
    function hline(r, c1, c2, ch) { for (var c = c1; c < c2; c++) put(r, c, ch); }
    function vline(c, r1, r2, ch) { for (var r = r1; r < r2; r++) put(r, c, ch); }
    function box(r, c, w, label) {
      put(r, c, '+' + new Array(w - 1).join('-') + '+'); put(r + 2, c, '+' + new Array(w - 1).join('-') + '+');
      put(r + 1, c, '|'); put(r + 1, c + w, '|'); put(r + 1, c + 2, label);
    }
    var w = 12, gap = Math.max(4, Math.floor((cols - 3 * w) / 2));
    var xs = [0, w + gap, 2 * (w + gap)];
    box(0, xs[0], w, 'client'); box(0, xs[1], w, 'api'); box(0, xs[2], w, 'queue');
    box(8, xs[0], w, 'db'); box(8, xs[1], w, 'cache'); box(8, xs[2], w, 'worker');
    hline(1, xs[0] + w + 1, xs[1], '='); put(1, xs[1] - 1, '>');
    hline(1, xs[1] + w + 1, xs[2], '='); put(1, xs[2] - 1, '>');
    vline(xs[2] + 6, 3, 8, ':'); put(7, xs[2] + 6, 'v');
    hline(9, xs[1] + w + 1, xs[2], '='); put(9, xs[1] + w + 1, '<');
    hline(9, xs[0] + w + 1, xs[1], '='); put(9, xs[0] + w + 1, '<');
    put(12, 0, '# request in, retry on failure, result written back');
    el.textContent = grid.map(function (row) { return row.join(''); }).join('\n');
  }

  function init() { ascii(); gutter(); }
  window.addEventListener('load', init);
  var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(init, 150); });
})();
