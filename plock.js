// TILLFÄLLIG plockrunda för skoluppgift AO356. Tas bort 2026-11-27 kl. 15.
// Hela funktionen ligger i den här filen + en <script>-rad i index.html.
(function () {
  'use strict';
  if (Date.now() >= Date.parse('2026-11-27T15:00:00+01:00')) return;
  const ITEMS = [{"rad":"28","namn":"Minibrytare Resi9 1P C6A","nr":"2112650","hylla":"03","saker":true,"not":"AVVIKELSE: Resi9 finns inte i 4 A."},{"rad":"29","namn":"Minibrytare Resi9 1P C10A","nr":"2112651","hylla":"03","saker":true,"not":""},{"rad":"27","namn":"Kabelkanal","nr":"1161400","hylla":"08","saker":true,"not":""},{"rad":"46","namn":"TC 7–10 klammer","nr":"1500136","hylla":"09","saker":true,"not":""},{"rad":"7","namn":"Skarvmuff 16 mm","nr":"1401018","hylla":"10","saker":true,"not":""},{"rad":"8","namn":"Apparatdosa","nr":"1426101","hylla":"10","saker":true,"not":""},{"rad":"9","namn":"Kopplingsdosa","nr":"1420319","hylla":"10","saker":true,"not":""},{"rad":"10","namn":"Täcklock kopplingsdosa","nr":"1426038","hylla":"10","saker":true,"not":""},{"rad":"11","namn":"Täcklock för en utg. kabel","nr":"1424320","hylla":"10","saker":true,"not":""},{"rad":"12 + 16","namn":"Strömställare trapp komplett – Exxact","nr":"1822121","hylla":"13","saker":true,"not":"Täcker både trappbrytaren (rad 12) och enpoliga (rad 16)."},{"rad":"13","namn":"Strömställare kors – Exxact","nr":"1820131","hylla":"13","saker":true,"not":""},{"rad":"13–14","namn":"Ram 1-fack – Exxact Primo","nr":"1822141","hylla":"13","saker":true,"not":"Ram till kors och dubbeltrapp."},{"rad":"14","namn":"Strömställare dubbeltrapp – Exxact","nr":"1820126","hylla":"13","saker":true,"not":""},{"rad":"15","namn":"Strömställare kron komplett – Exxact","nr":"1822416","hylla":"13","saker":true,"not":""},{"rad":"17 + 18 + 20","namn":"Vägguttag 2-vägs jordat – Exxact","nr":"1820296","hylla":"13","saker":true,"not":"Används i rad 17, 18 och 20."},{"rad":"17","namn":"Ram 2-fack – Exxact Primo","nr":"1822342","hylla":"13","saker":true,"not":"2 st 2-vägsuttag i denna = 4-vägsuttag."},{"rad":"18 + 20","namn":"Ram 2-vägsuttag – Exxact Primo","nr":"1822147","hylla":"13","saker":true,"not":""},{"rad":"19","namn":"Vägguttag 1-vägs jordat komplett – Exxact","nr":"1822176","hylla":"13","saker":true,"not":""},{"rad":"30","namn":"Nödstopp","nr":"3734734","hylla":"15","saker":true,"not":""},{"rad":"31","namn":"Stoppknapp","nr":"3715001","hylla":"15","saker":false,"not":""},{"rad":"32","namn":"Startknapp","nr":"3715002","hylla":"15","saker":false,"not":""},{"rad":"33","namn":"Indikeringslampa","nr":"3732638","hylla":"15","saker":true,"not":""},{"rad":"34","namn":"Kontaktor 4-pol","nr":"3232114","hylla":"15","saker":true,"not":""},{"rad":"35","namn":"Motorskyddsbrytare MS116","nr":"3111938","hylla":"15","saker":false,"not":""},{"rad":"26","namn":"Hålad fläns","nr":"2631622","hylla":"16","saker":true,"not":""},{"rad":"24","namn":"Eltejp svart","nr":"0752787","hylla":"17","saker":true,"not":""},{"rad":"37","namn":"Dosplåt","nr":"1116265","hylla":"17","saker":false,"not":""},{"rad":"43","namn":"Kabelstege 200","nr":"1116102","hylla":"17","saker":false,"not":""},{"rad":"45","namn":"Förskruvning M25","nr":"1470702","hylla":"17","saker":true,"not":""},{"rad":"47","namn":"MP skruv och mutter","nr":"1116290","hylla":"17","saker":false,"not":""},{"rad":"38","namn":"Najtråd","nr":"0630061","hylla":"18","saker":true,"not":""},{"rad":"1","namn":"FQ 1,5 brun – Amokabel","nr":"0463332","hylla":"20","saker":true,"not":""},{"rad":"2","namn":"FQ 1,5 orange – Amokabel","nr":"0463342","hylla":"20","saker":true,"not":""},{"rad":"3","namn":"FQ 2,5 blå – Draka","nr":"0435372","hylla":"20","saker":true,"not":""},{"rad":"4","namn":"FQ 2,5 gul/grön – Draka","nr":"0435392","hylla":"20","saker":true,"not":""},{"rad":"21","namn":"Böjfjäder 16 mm","nr":"1664984","hylla":"28","saker":true,"not":""},{"rad":"22","namn":"Dragfjäder 10 m","nr":"1659610","hylla":"28","saker":true,"not":""},{"rad":"23","namn":"Dosfräs","nr":"1601137","hylla":"28","saker":true,"not":""},{"rad":"5","namn":"VP-slang 20 mm","nr":"1414051","hylla":"130","saker":false,"not":""},{"rad":"6","namn":"VP-rör 16 mm","nr":"1414002","hylla":"130","saker":true,"not":""},{"rad":"39","namn":"EXQJ Pure 4×2,5/2,5 – Draka","nr":"0001560","hylla":"141","saker":false,"not":""},{"rad":"40","namn":"EXQ 3G1,5 – Amokabel","nr":"0463252","hylla":"141","saker":true,"not":""},{"rad":"41","namn":"EQLQ 5G2,5 – Draka","nr":"0461351","hylla":"141","saker":true,"not":""},{"rad":"42","namn":"EQRQ 3G1,5 – Nexans","nr":"0443001","hylla":"141","saker":true,"not":"AVVIKELSE: Amokabel gör ingen EQRQ."},{"rad":"Ny","namn":"Garagekabel EXQJ Pure 4×6/6 – Draka, 50 m","nr":"0001585","hylla":"141","saker":false,"not":"Kapas från trumma: 50 m."},{"rad":"36","namn":"Trådstege Z4","nr":"1116416","hylla":"142","saker":true,"not":""}];
  const KEY = 'plock-AO356';
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (c) => /^\d{7}$/.test(c) ? c.slice(0, 2) + ' ' + c.slice(2, 5) + ' ' + c.slice(5) : c;
  let i = 0; try { i = +localStorage.getItem(KEY) || 0; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, String(i)); } catch (e) {} };

  const css = document.createElement('style');
  css.textContent = `
  #plock{position:fixed;inset:0;background:var(--bg);z-index:20;display:none;flex-direction:column;overflow:auto;padding:calc(var(--st) + 12px) 18px calc(var(--sb) + 16px)}
  #plock.open{display:flex}
  .pl-top{display:flex;justify-content:space-between;align-items:center;font-weight:800;color:var(--navy)}
  .pl-bar{height:6px;border-radius:3px;background:#dde3ec;margin:10px 0 14px;overflow:hidden}.pl-bar i{display:block;height:100%;background:var(--cyan)}
  .pl-name{font-size:22px;font-weight:800;line-height:1.2;margin:6px 0 4px}
  .pl-nr{font-size:26px;font-weight:900;letter-spacing:1px;color:var(--ink);font-variant-numeric:tabular-nums}
  .pl-warn{margin-top:10px;background:#fff3d6;border-left:4px solid var(--amber);border-radius:10px;padding:10px 12px;font-weight:700;color:#6b4c00}
  .pl-note{margin-top:10px;background:#eef6fb;border-left:4px solid var(--cyan);border-radius:10px;padding:10px 12px;font-size:15px}
  .pl-new{display:inline-block;white-space:nowrap;letter-spacing:0;background:var(--cyan);color:#fff;font-weight:800;font-size:13px;border-radius:999px;padding:5px 10px;margin-left:8px;vertical-align:middle}
  .pl-nav{display:grid;grid-template-columns:1fr 2fr;gap:10px;margin-top:16px}
  .pl-nav .btn{padding:18px 10px;font-size:18px}
  #plockBtn{background:var(--amber);color:#17233b}`;
  document.head.appendChild(css);

  const ov = document.createElement('div'); ov.id = 'plock'; document.body.appendChild(ov);

  function render() {
    const n = ITEMS.length;
    if (i >= n) {
      ov.innerHTML = `<div class="pl-top"><span>📦 Plockrunda AO356</span><button class="iconbtn" style="background:#e3e7ee;color:var(--ink)" data-pl="close">✕</button></div>
        <div class="pl-bar"><i style="width:100%"></i></div>
        <div class="res-shelf" style="font-size:56px">Klart! ✓</div>
        <div class="pl-warn">Fråga handledaren: rad 25 apparatskåp och rad 44 SKY-armatur.</div>
        <div class="pl-note"><b>Märk ordern:</b> AO356<br><b>Godsmärkning:</b> Soneparjkpg<br>Fyll i ditt namn och företag.</div>
        <div class="pl-nav"><button class="btn" data-pl="prev">← Tillbaka</button><button class="btn" data-pl="restart">Börja om</button></div>`;
      return;
    }
    const it = ITEMS[i], prev = ITEMS[i - 1];
    const newShelf = !prev || prev.hylla !== it.hylla;
    const warn = it.not.startsWith('AVVIKELSE');
    ov.innerHTML = `<div class="pl-top"><span>📦 Plockrunda AO356</span><span>${i + 1} / ${n}</span><button class="iconbtn" style="background:#e3e7ee;color:var(--ink)" data-pl="close">✕</button></div>
      <div class="pl-bar"><i style="width:${Math.round(100 * i / n)}%"></i></div>
      <div class="res-label">Hylla${it.saker ? '' : ' (gissad)'}</div>
      <div class="res-shelf">${esc(it.hylla || '?')}${newShelf ? '<span class="pl-new">Ny hylla</span>' : ''}</div>
      <div class="pl-name">${esc(it.namn)}</div>
      <div class="pl-nr">${esc(fmt(it.nr))}</div>
      <div class="res-code">Rad ${esc(it.rad)} på blanketten · <a href="https://www.sonepar.se/s?s=${it.nr}&artnr=${it.nr}" target="_blank" rel="noopener" style="color:var(--cyan);font-weight:700;text-decoration:none">🔎 Bild på sonepar.se</a></div>
      ${it.not ? `<div class="${warn ? 'pl-warn' : 'pl-note'}">${warn ? '⚠︎ ' : ''}${esc(it.not)}</div>` : ''}
      ${it.saker ? '' : '<div class="pl-note">Hyllan är gissad utifrån liknande nummer – titta runt i närheten.</div>'}
      <div class="mapwrap">${self.ShelfMap ? ShelfMap.render(it.hylla ? { [it.hylla]: 'main' } : {}) : ''}</div>
      <div class="pl-nav"><button class="btn" data-pl="prev" ${i ? '' : 'disabled style="opacity:.4"'}>← Förra</button><button class="btn primary" data-pl="next" style="grid-column:auto">Nästa →</button></div>`;
    ov.scrollTop = 0;
  }
  ov.addEventListener('click', (e) => {
    const a = e.target.closest('[data-pl]'); if (!a) return;
    const act = a.dataset.pl;
    if (act === 'close') { ov.classList.remove('open'); return; }
    if (act === 'next') i = Math.min(i + 1, ITEMS.length);
    if (act === 'prev') i = Math.max(i - 1, 0);
    if (act === 'restart') i = 0;
    save(); render();
  });
  function open() { render(); ov.classList.add('open'); }

  const mk = (style) => { const b = document.createElement('button'); b.textContent = '📦 Plockrunda AO356'; b.addEventListener('click', open); if (style) b.style.cssText = style; return b; };
  const tools = document.querySelector('.tools');
  if (tools) { const b = mk(); b.className = 'pill'; b.id = 'plockBtn'; tools.appendChild(b); }
  const start = document.querySelector('#startBtn');
  if (start) { const b = mk('margin-top:12px;background:var(--amber);color:#17233b;font-weight:800;font-size:17px;padding:14px 26px;border-radius:16px;min-width:240px'); start.after(b); }
})();
