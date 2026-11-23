(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const STORE = 'hyllskanner.learned.v1';

  // ---------- Inlärning (sparas i telefonen) ----------
  function loadLearned() {
    try { const j = JSON.parse(localStorage.getItem(STORE)); if (j && j.codes) return Object.assign({ codes: {}, kw: {}, prefKw: {}, names: {}, count: 0 }, j); } catch (e) {}
    return { codes: {}, kw: {}, prefKw: {}, names: {}, count: 0 };
  }
  function saveLearned() { try { localStorage.setItem(STORE, JSON.stringify(engine.learned)); } catch (e) {} }

  const engine = new Engine(self.CATALOG, self.GLOSSARY, loadLearned(), self.PREFIX_RULES);
  const shelves = ShelfMap.shelves.slice().sort((a, b) => (+a) - (+b));

  // ---------- Kamera + textläsning ----------
  const video = $('#video'), frame = $('#frame'), live = $('#live');
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
  let worker = null, scanning = false, busy = false, tall = false, rotFlip = false;
  let history = [];

  async function initOCR(onProgress) {
    worker = await Tesseract.createWorker('eng', 1, {
      workerPath: 'vendor/worker.min.js', corePath: 'vendor/', langPath: 'vendor/lang',
      workerBlobURL: false, gzip: true,
      logger: (m) => { if (m.progress != null && onProgress) onProgress(m.status, m.progress); }
    });
    await worker.setParameters({ tessedit_pageseg_mode: '11', preserve_interword_spaces: '1' });
  }

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }
    });
    video.srcObject = stream;
    await video.play();
    try { // autofokus om telefonen tillåter
      const [track] = stream.getVideoTracks(); const caps = track.getCapabilities ? track.getCapabilities() : {};
      if (caps.focusMode && caps.focusMode.includes('continuous')) await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
    } catch (e) {}
  }

  // Klipp ut det som syns i rutan, gråskala + kontrast.
  function grab() {
    const vw = video.videoWidth, vh = video.videoHeight; if (!vw) return null;
    const box = video.getBoundingClientRect(), f = frame.getBoundingClientRect();
    const scale = Math.max(box.width / vw, box.height / vh);
    const ox = (vw * scale - box.width) / 2, oy = (vh * scale - box.height) / 2;
    const sx = (f.left - box.left + ox) / scale, sy = (f.top - box.top + oy) / scale;
    const sw = f.width / scale, sh = f.height / scale;
    const longSide = 1100, k = longSide / Math.max(sw, sh);
    const w = Math.round(sw * k), h = Math.round(sh * k);
    if (tall) { canvas.width = h; canvas.height = w; } else { canvas.width = w; canvas.height = h; }
    ctx.save();
    if (tall) { // rotera så att texten blir liggande; växla riktning varannan gång
      if (rotFlip) { ctx.translate(h, 0); ctx.rotate(Math.PI / 2); } else { ctx.translate(0, w); ctx.rotate(-Math.PI / 2); }
      rotFlip = !rotFlip;
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    ctx.restore();
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height), d = img.data;
    const hist = new Uint32Array(256);
    for (let i = 0; i < d.length; i += 4) { const g = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8; d[i] = g; hist[g]++; }
    const n = d.length / 4; let lo = 0, hi = 255, acc = 0;
    for (; lo < 255; lo++) { acc += hist[lo]; if (acc > n * 0.02) break; }
    acc = 0; for (; hi > 0; hi--) { acc += hist[hi]; if (acc > n * 0.02) break; }
    const span = Math.max(1, hi - lo);
    for (let i = 0; i < d.length; i += 4) { let g = (d[i] - lo) * 255 / span; g = g < 0 ? 0 : g > 255 ? 255 : g; d[i] = d[i + 1] = d[i + 2] = g; }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  async function loop() {
    if (!scanning) return;
    if (!busy && worker) {
      busy = true; frame.classList.add('busy');
      try {
        const c = grab();
        if (c) {
          const { data } = await worker.recognize(c);
          if (scanning) handle(engine.resolve(data.text || ''));
        }
      } catch (e) { console.warn(e); }
      busy = false;
    }
    if (scanning) setTimeout(loop, 60);
  }

  // Kräv samma svar i flera läsningar i rad innan vi visar det.
  function keyOf(r) {
    if (r.kind === 'exact') return 'E' + r.code;
    if (r.kind === 'choice') return 'C' + r.options.map(o => o.code).sort().join(',');
    if (r.kind === 'guess') return 'G' + r.guess.prefix;
    if (r.kind === 'gloss' || r.kind === 'glossOnly') return 'W' + r.gloss[0].id;
    return 'N';
  }
  function handle(r) {
    live.textContent = r.text.replace(/\s+/g, ' ').trim().slice(0, 160);
    history.push(keyOf(r)); if (history.length > 4) history.shift();
    const k = history[history.length - 1];
    const same = (n) => history.length >= n && history.slice(-n).every(x => x === k);
    if (k === 'N') return;
    const need = (r.kind === 'exact' || r.kind === 'choice') ? 2 : 3;
    if (same(need)) { stopScan(); show(r); }
  }

  function startScan() {
    history = []; scanning = true; $('#sheet').classList.remove('open');
    $('#hint').textContent = tall ? 'Etiketten står på högkant – rikta rutan längs texten' : 'Rikta rutan mot SE-numret eller produktnamnet';
    loop();
  }
  function stopScan() { scanning = false; frame.classList.remove('busy'); }

  // ---------- Visa resultat ----------
  let current = null;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtCode = (c) => /^\d{7}$/.test(c) ? c.slice(0, 2) + ' ' + c.slice(2, 5) + ' ' + c.slice(5) : c;

  function infoHtml(r, code) {
    let g = (r.gloss && r.gloss[0]) || (code && engine.glossForCode(code));
    const name = code && engine.learned.names[code];
    let html = '';
    if (g) html += `<b>${esc(g.namn)}</b> – ${esc(g.info)}`;
    if (name) html += `${html ? '<br>' : ''}<span class="muted">Senast läst på förpackningen: ${esc(name)}</span>`;
    if (!html) html = '<span class="muted">Ingen materialinfo än. Fånga gärna produktnamnet i rutan nästa gång, så lär sig appen vad det här numret är.</span>';
    return `<div class="info">📘 ${html}</div>`;
  }

  function show(r) {
    current = r;
    const body = $('#sheetBody');
    let h = '';
    if (r.kind === 'exact') {
      h += `<div class="res-head"><div><div class="res-label">Hylla</div><div class="res-shelf">${esc(r.shelf)}</div></div>
        <span class="badge b-ok">✓ Exakt träff</span></div>
        <div class="res-code">${r.via === 'SE' ? 'SE' : 'Nr'} ${esc(fmtCode(r.code))}${engine.learned.codes[r.code] ? ' · inlärd placering' : ''}</div>`;
      h += infoHtml(r, r.code);
      h += mapHtml({ [r.shelf]: 'main' });
      h += `<div class="actions"><button class="btn ok" data-act="confirm">✓ Stämmer – hylla ${esc(r.shelf)}</button><button class="btn" data-act="other">Står på annan hylla</button>
        <button class="btn primary" data-act="next">Skanna nästa</button></div>`;
    } else if (r.kind === 'choice') {
      h += `<div class="res-label">Flera nummer hittades – vilket gäller?</div><div class="choices">` +
        r.options.map(o => `<button class="choice" data-pick="${esc(o.code)}"><span>${esc(fmtCode(o.code))}</span><span>${esc(o.shelf)}</span></button>`).join('') +
        `</div><div class="actions"><button class="btn primary" data-act="next">Skanna igen</button></div>`;
    } else if (r.kind === 'guess' || r.kind === 'gloss') {
      const top = r.guess.top, main = top[0];
      const why = r.kind === 'guess'
        ? (r.via === 'okänt SE' || r.via === 'okänt nummer' ? `${r.via === 'okänt SE' ? 'SE ' : 'Nr '}${esc(fmtCode(r.code))} finns inte i listan. Andra nummer som börjar på ${esc(r.guess.prefix)}` : `Numret lästes bara delvis (${esc(r.code)}…). Nummer som börjar på ${esc(r.guess.prefix)}`)
        : `Inget nummer hittades, men det ser ut som <b>${esc(r.gloss[0].namn.toLowerCase())}</b>. Sådant`;
      h += `<div class="res-head"><div><div class="res-label">Troligen hylla</div><div class="res-shelf">${esc(main.shelf)}${main.pct != null ? `<small>${main.pct}%</small>` : ''}</div></div>
        <span class="badge b-guess">Fingervisning</span></div>
        <div class="res-code">${why} ${r.guess.examples ? `har lagts här tidigare (${r.guess.n} ${r.guess.n === 1 ? 'exempel' : 'exempel'})` : `ligger oftast här${r.guess.n ? ` (${r.guess.n} kända artiklar)` : ''}`}.</div>`;
      if (top.length > 1) h += `<div class="alts">${top.slice(1).map(t => `<span class="alt">annars ${esc(t.shelf)}${t.pct != null ? ' · ' + t.pct + '%' : ''}</span>`).join('')}</div>`;
      h += infoHtml(r, r.kind === 'guess' ? r.code : null);
      const hl = {}; top.slice(1).forEach(t => hl[t.shelf] = 'alt'); hl[main.shelf] = 'main';
      h += mapHtml(hl);
      h += `<div class="actions"><button class="btn ok" data-act="confirm">✓ Stämmer – hylla ${esc(main.shelf)}</button><button class="btn" data-act="other">Står på annan hylla</button>
        <button class="btn primary" data-act="next">Skanna igen</button></div>`;
    } else if (r.kind === 'glossOnly') {
      h += `<div class="res-head"><div><div class="res-label">Ingen hylla än</div></div><span class="badge b-none">Okänd placering</span></div>
        <div class="res-code">Inget artikelnummer hittades. Det ser ut som <b>${esc(r.gloss[0].namn.toLowerCase())}</b>, men appen vet inte var sådant brukar ligga än. Tala om vilken hylla den står på, så lär den sig.</div>`;
      h += infoHtml(r, null);
      h += mapHtml({});
      h += `<div class="actions"><button class="btn" data-act="other">Den står på …</button><button class="btn" data-act="type">Skriv nummer</button>
        <button class="btn primary" data-act="next">Skanna igen</button></div>`;
    }
    body.innerHTML = h;
    $('#sheet').classList.add('open');
    $('#sheet').scrollTop = 0;
  }

  const mapHtml = (hl) => `<div class="mapwrap">${ShelfMap.render(hl)}</div>`;

  function nameFromText(r) {
    if (!r.gloss || !r.gloss.length) return '';
    const kws = r.gloss[0].ord.map(w => foldText(w).trim());
    const line = r.text.split('\n').find(l => kws.some(k => foldText(l).includes(k)));
    return line ? line.replace(/[^\wåäöÅÄÖ\-.,/ ]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) : '';
  }

  function confirm(shelf) {
    const r = current; if (!r) return;
    const code = r.kind === 'exact' ? r.code : (r.kind === 'guess' && r.code && r.code.length === 7 ? r.code : null);
    const ids = (r.gloss || []).slice(0, 2).map(g => g.id);
    engine.learn(code, shelf, ids, nameFromText(r));
    engine.learned.count = (engine.learned.count || 0) + 1;
    saveLearned();
    toastLearned(shelf);
    startScan();
  }
  function toastLearned(shelf) { $('#hint').textContent = `✓ Sparat: hylla ${shelf}. Rikta mot nästa vara`; }

  $('#sheet').addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]'), p = e.target.closest('[data-pick]');
    if (p) { const code = p.dataset.pick; show(Object.assign({}, current, { kind: 'exact', code, shelf: engine.shelfOf(code) })); return; }
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'next') { if (video.srcObject && worker) startScan(); else { $('#sheet').classList.remove('open'); if (!video.srcObject) location.reload(); } }
    if (act === 'confirm') confirm(current.kind === 'exact' ? current.shelf : current.guess.top[0].shelf);
    if (act === 'other') openPicker();
    if (act === 'type') openType();
  });

  // ---------- Hyllväljare ----------
  function openPicker() {
    $('#pickGrid').innerHTML = shelves.map(s => `<button data-s="${s}">${s}</button>`).join('');
    $('#pickModal').classList.add('open');
  }
  $('#pickGrid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    $('#pickModal').classList.remove('open'); confirm(b.dataset.s);
  });

  // ---------- Skriv nummer ----------
  function openType() { stopScan(); $('#typeModal').classList.add('open'); $('#typeOut').innerHTML = ''; const f = $('#typeField'); f.value = ''; setTimeout(() => f.focus(), 50); }
  function typed() {
    const v = $('#typeField').value.trim();
    if (!v) return null;
    const r = resolveAny(v);
    if (r.kind !== 'none') return r;
    const d = v.replace(/\D/g, '');
    const r2 = d.length >= 2 ? engine.resolve('SE ' + d) : r;
    return r2.kind === 'none' ? null : r2;
  }
  $('#typeField').addEventListener('input', () => {
    const r = typed();
    $('#typeOut').innerHTML = !r ? '' : r.kind === 'exact' ? `<p><b>Hylla ${esc(r.shelf)}</b> – exakt</p>`
      : r.kind === 'guess' ? `<p>Troligen <b>hylla ${esc(r.guess.top[0].shelf)}</b>${r.guess.top[0].pct != null ? ' (' + r.guess.top[0].pct + '%)' : ''}</p>` : '';
  });
  $('#typeGo').addEventListener('click', () => {
    const r = typed();
    if (!r) { $('#typeOut').innerHTML = '<p style="color:#b42336;font-weight:700">Hittade inget på det numret.</p>'; return; }
    $('#typeModal').classList.remove('open'); $('#typeField').blur(); show(r);
  });
  $('#typeField').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#typeGo').click(); });
  $('#typeBtn').addEventListener('click', openType);

  // ---------- Klistra in / läs från bild ----------
  function hideStart() { const st = $('#start'); if (st) st.remove(); }
  function resolveAny(text) {
    const t = (text || '').trim();
    const compact = t.toUpperCase().replace(/\s+/g, '');
    if (engine.shelfOf(compact)) return { kind: 'exact', code: compact, shelf: engine.shelfOf(compact), via: 'nummer', gloss: engine.matchGlossary(t), text: t };
    let r = engine.resolve(t);
    if (r.kind === 'none' && /^\d{2,7}$/.test(compact)) r = engine.resolve('SE ' + compact);
    return r;
  }
  async function doPaste() {
    let text = '';
    try { text = await navigator.clipboard.readText(); } catch (e) {}
    if (!text) { openType(); $('#typeOut').innerHTML = '<p class="muted">Kunde inte läsa urklipp – håll fingret i rutan och välj Klistra in.</p>'; return; }
    stopScan(); hideStart();
    const r = resolveAny(text);
    if (r.kind === 'none') { openType(); $('#typeField').value = text.trim().slice(0, 30); $('#typeField').dispatchEvent(new Event('input')); return; }
    show(r);
  }
  async function ensureOCR() {
    if (worker) return;
    $('#busyMsg').textContent = 'Laddar textläsning…'; $('#busyMsg').style.display = 'block';
    await initOCR((st, p) => { $('#busyMsg').textContent = 'Laddar textläsning ' + Math.round(p * 100) + '%'; });
  }
  async function readImage(file) {
    stopScan(); hideStart();
    const bm = $('#busyMsg');
    try {
      await ensureOCR();
      bm.textContent = 'Läser bilden…'; bm.style.display = 'block';
      const img = await createImageBitmap(file);
      const k = Math.min(1, 1800 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const cx = c.getContext('2d'); cx.filter = 'grayscale(1) contrast(1.3)'; cx.drawImage(img, 0, 0, c.width, c.height);
      const { data } = await worker.recognize(c);
      bm.style.display = 'none';
      live.textContent = (data.text || '').replace(/\s+/g, ' ').trim().slice(0, 300);
      const r = resolveAny(data.text || '');
      if (r.kind === 'none') { show({ kind: 'glossOnly', gloss: [{ namn: 'okänd vara', info: 'Hittade inget artikelnummer i bilden. Prova att beskära runt numret eller skriv det.', ord: [] }], text: data.text || '' }); return; }
      show(r);
    } catch (e) { bm.style.display = 'none'; showErr('Kunde inte läsa bilden.'); console.error(e); }
  }
  $('#pasteBtn').addEventListener('click', doPaste);
  $('#startPaste').addEventListener('click', doPaste);
  $('#imgBtn').addEventListener('click', () => $('#imgInput').click());
  $('#startImg').addEventListener('click', () => $('#imgInput').click());
  $('#imgInput').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) readImage(f); });

  // ---------- Övrigt ----------
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
    b.closest('.modal').classList.remove('open');
    if (!$('#sheet').classList.contains('open') && worker && !scanning) startScan();
  }));
  $('#rotBtn').addEventListener('click', () => {
    tall = !tall; frame.classList.toggle('tall', tall);
    $('#rotBtn').textContent = tall ? '↺' : '↻'; $('#rotBtn').style.background = tall ? 'var(--cyan)' : '';
    if (scanning) { history = []; $('#hint').textContent = tall ? 'Etiketten står på högkant – rikta rutan längs texten' : 'Rikta rutan mot SE-numret eller produktnamnet'; }
  });
  $('#menuBtn').addEventListener('click', () => {
    const L = engine.learned;
    $('#stats').textContent = `${Object.keys(self.CATALOG).length} artiklar i listan · ${Object.keys(self.PREFIX_RULES).length} prefixregler · ${L.count || 0} bekräftade placeringar · ${Object.keys(L.codes).length} egna/ändrade nummer. Inlärningen sparas bara i den här telefonen.`;
    $('#menuModal').classList.add('open');
  });
  $('#exportBtn').addEventListener('click', async () => {
    const blob = new Blob([JSON.stringify(engine.learned, null, 1)], { type: 'application/json' });
    const file = new File([blob], 'hyllskanner-inlarning.json', { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); } catch (e) {} }
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); }
  });
  $('#resetBtn').addEventListener('click', () => {
    if (!window.confirm('Radera allt appen har lärt sig i den här telefonen?')) return;
    engine.learned = { codes: {}, kw: {}, prefKw: {}, names: {}, count: 0 }; engine.rebuild(); saveLearned();
    $('#menuModal').classList.remove('open');
  });
  $('#mapBtn').addEventListener('click', () => {
    $('#menuModal').classList.remove('open'); stopScan();
    current = null;
    $('#sheetBody').innerHTML = `<div class="res-label">Hyllkarta</div>${mapHtml({})}<div class="actions"><button class="btn primary" data-act="next">Tillbaka till kameran</button></div>`;
    $('#sheet').classList.add('open');
  });

  function showErr(msg) { const e = $('#err'); e.textContent = msg; e.style.display = 'block'; }

  // Installationstips för iPhone
  const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  if (!standalone && /iPhone|iPad/.test(navigator.userAgent)) $('#installTip').textContent = 'Tips: tryck på Dela ⬆︎ och välj "Lägg till på hemskärmen".';

  $('#startBtn').addEventListener('click', async () => {
    const btn = $('#startBtn'), msg = $('#startMsg'), prog = $('#prog');
    btn.disabled = true; btn.textContent = 'Startar…';
    try {
      await startCamera();
    } catch (e) {
      btn.disabled = false; btn.textContent = 'Försök igen';
      msg.textContent = 'Kameran gick inte att starta. Tillåt kameran för den här sidan (Inställningar › Safari › Kamera) och försök igen.';
      return;
    }
    try {
      prog.hidden = false; msg.textContent = 'Laddar textläsning (första gången tar det en stund)…';
      await initOCR((status, p) => { prog.firstElementChild.style.width = Math.round(p * 100) + '%'; });
    } catch (e) {
      msg.textContent = 'Textläsningen kunde inte laddas. Du kan fortfarande skriva nummer för hand.';
      console.error(e);
      setTimeout(() => $('#start').remove(), 1800);
      return;
    }
    $('#start').remove();
    startScan();
  });

  if ('serviceWorker' in navigator) {
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && $('#start')) location.reload(); });
    navigator.serviceWorker.register('sw.js').then(r => r.update()).catch(() => {});
  }
})();
