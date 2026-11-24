// Tolkningsmotor: text från kameran -> artikelnummer -> hylla / gissning / materialinfo.
// Körs både i appen och i Node-test.
(function (root) {
  'use strict';

  function fold(s) {
    return (' ' + s + ' ').toLowerCase()
      .replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[éè]/g, 'e')
      .replace(/[^a-z0-9.²\- ]+/g, ' ').replace(/\s+/g, ' ');
  }

  // Siffror med typiska OCR-förväxlingar rättade (bara där vi redan vet att det ska vara siffror).
  function digitsOnly(s) {
    return s.replace(/[Oo]/g, '0').replace(/[Il|!]/g, '1').replace(/[^0-9]/g, '');
  }

  function Engine(catalog, glossary, learned, prefixRules) {
    this.catalog = catalog;
    this.glossary = glossary || [];
    this.learned = learned || { codes: {}, kw: {}, prefKw: {}, names: {} };
    this.prefixRules = prefixRules || {};
    this.rebuild();
  }

  Engine.prototype.rebuild = function () {
    const all = Object.assign({}, this.catalog, this.learned.codes);
    this.all = all;
    const idx = {};
    for (const code in all) {
      const shelf = all[code];
      for (let L = 2; L <= 6; L++) {
        const p = code.slice(0, L);
        const m = idx[p] || (idx[p] = {});
        m[shelf] = (m[shelf] || 0) + 1;
      }
    }
    this.prefixIndex = idx;
  };

  Engine.prototype.shelfOf = function (code) {
    return Object.prototype.hasOwnProperty.call(this.all, code) ? this.all[code] : null;
  };

  // Hitta kandidatnummer i läst text.
  Engine.prototype.findNumbers = function (text) {
    const out = { se: [], seParts: [], loose: [], spaced: [] };
    const lines = text.split(/\n/);
    for (const rawLine of lines) {
      const line = rawLine.replace(/[“”"'‘’]/g, ' ');
      // Landskoder: SE (ev. felläst som 5E/S3), NO, FI, DK
      // Landskoder: Sverige = SE/S (även felläst 5E, $E, S3), Finland = FI/SF/FIN, Norge = NO/N, Danmark = DK.
      // OBS: "SF" betyder Suomi-Finland på äldre etiketter – aldrig Sverige.
      const re = /(^|[^A-Za-z0-9])(FIN|SF|S ?E|S3|[5$]E|N ?[O0]|F ?[I1l|]|D ?K|S|N)(?![A-Za-z])\s*[:.\-]?\s*([0-9OoIl| ]{2,20})/g;
      let m; const blocked = [];
      // E-nummer skrivet som "E1822343" (t.ex. i inventeringssystemet). Rätta vanliga felläsningar i siffrorna.
      const reE = /(^|[^A-Za-z0-9])E[ \-]?([0-9OoIl|SBZ]{7})(?![0-9A-Za-z])/g;
      while ((m = reE.exec(line))) {
        const d = m[2].replace(/[Oo]/g, '0').replace(/[Il|]/g, '1').replace(/S/g, '5').replace(/B/g, '8').replace(/Z/g, '2');
        if (/^\d{7}$/.test(d)) { out.se.push(d); blocked.push([m.index, reE.lastIndex]); }
      }
      while ((m = re.exec(line))) {
        const cc = m[2].toUpperCase().replace(/ /g, '');
        const d = digitsOnly(m[3]);
        blocked.push([m.index, re.lastIndex]);
        if (/^(SE|S3|5E|\$E|S)$/.test(cc)) {
          if (d.length >= 7) out.se.push(d.slice(0, 7));
          else if (d.length >= 2) out.seParts.push(d);
        }
      }
      // Lösa nummer: 7 tecken i följd eller formatet 12 345 67 — men inte efter NO/FI/DK och inte del av längre sifferserie
      const tokens = [];
      const tre = /\S+/g; let t;
      while ((t = tre.exec(line))) tokens.push({ s: t[0].replace(/[.,;:]+$/, ''), i: t.index });
      const isBlocked = (i) => blocked.some(([a, b]) => i >= a && i < b);
      for (let k = 0; k < tokens.length; k++) {
        const tk = tokens[k];
        if (isBlocked(tk.i)) continue;
        if (/^[0-9]{7}$/.test(tk.s) || /^[A-Z]{1,2}[0-9]{5,6}$/.test(tk.s) && tk.s.length === 7) {
          out.loose.push(tk.s);
        }
        // Nummer uppdelat i 2–3 sifferdelar som tillsammans blir 7 siffror (12 345 67, 12345 67, 12 34567 …)
        const digitTok = (x) => x && /^\d+$/.test(x.s);
        if (digitTok(tk) && !digitTok(tokens[k - 1])) {
          let joined = tk.s;
          for (let j = k + 1; j < Math.min(tokens.length, k + 3) && digitTok(tokens[j]) && joined.length < 7; j++) {
            joined += tokens[j].s;
            if (joined.length === 7 && !digitTok(tokens[j + 1]) && !tokens.slice(k + 1, j + 1).some(x => isBlocked(x.i))) {
              out.loose.push(joined); out.spaced.push(joined);
            }
          }
        }
      }
    }
    return out;
  };

  // Gissa hylla från början av ett nummer.
  Engine.prototype.guessPrefix = function (code) {
    // 1) Regler från prefixtabellen (PDF), längsta först
    for (let L = Math.min(7, code.length); L >= 2; L--) {
      const p = code.slice(0, L);
      if (this.prefixRules[p]) return { prefix: p, n: null, top: [{ shelf: this.prefixRules[p], pct: null }], source: 'regel' };
    }
    // 2) Statistik från kända artiklar
    for (let L = Math.min(6, code.length); L >= 2; L--) {
      const p = code.slice(0, L);
      const m = this.prefixIndex[p];
      if (!m) continue;
      const n = Object.values(m).reduce((a, b) => a + b, 0);
      if (n < 2 && L < 5) continue;
      const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([shelf, c]) => ({ shelf, pct: Math.round(100 * c / n) }));
      return { prefix: p, n, top, source: 'statistik' };
    }
    return null;
  };

  // Materialkännedom från ord i texten.
  Engine.prototype.matchGlossary = function (text) {
    const f = fold(text);
    const hits = [];
    for (const g of this.glossary) {
      for (const w of g.ord) {
        const fw = fold(w).trim();
        // Inledande/avslutande mellanslag i ordlistan betyder "måste vara ordgräns"
        const key = (/^\s/.test(w) ? ' ' : '') + fw + (/\s$/.test(w) ? ' ' : '');
        if (fw.length >= 2 && f.includes(key)) { hits.push(g); break; }
      }
    }
    // "Brytarserie" är bara intressant om inget annat hittas
    const specific = hits.filter(h => h.id !== 'serie');
    return specific.length ? specific : hits;
  };

  Engine.prototype.glossById = function (id) { return this.glossary.find(g => g.id === id) || null; };

  // Vilka hyllor brukar en materialtyp ligga på (startvärden + inlärt)?
  Engine.prototype.shelvesForGloss = function (g) {
    const m = Object.assign({}, g.hyllor || {});
    const l = this.learned.kw[g.id] || {};
    for (const s in l) m[s] = (m[s] || 0) + l[s] * 2;
    const n = Object.values(m).reduce((a, b) => a + b, 0);
    if (!n) return { top: [], n: 0 };
    const seen = Object.values(g.hyllor || {}).reduce((a, b) => a + b, 0) + Object.values(l).reduce((a, b) => a + b, 0);
    const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([shelf, c]) => ({ shelf, pct: seen >= 3 ? Math.round(100 * c / n) : null }));
    return { top, n: seen };
  };

  // Materialtyp för ett nummer: först exakt inlärt per artikel, sedan varugrupp (4 siffror) om minst 2 bekräftelser är överens.
  // Returnerar { g, source: 'artikel' | 'grupp' } eller null.
  Engine.prototype.glossForCode = function (code) {
    const L = this.learned;
    if (!code) return null;
    const cg = (L.codeGloss || {})[code];
    if (cg === 'none') return { g: null, source: 'artikel' };
    if (cg) { const g = this.glossById(cg); if (g) return { g, source: 'artikel' }; }
    const m = (L.prefKw || {})[code.slice(0, 4)];
    if (!m) return null;
    const entries = Object.entries(m).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((a, [, c]) => a + c, 0);
    const [id, c] = entries[0] || [];
    if (!id || c < 2 || c / total < 0.75) return null;
    const g = this.glossById(id);
    return g ? { g, source: 'grupp' } : null;
  };

  // Rätta produkttyp för ett nummer (felrapport). id = glossary-id eller 'none'.
  Engine.prototype.setCodeGloss = function (code, id, wrongId) {
    const L = this.learned;
    L.codeGloss = L.codeGloss || {};
    L.codeGloss[code] = id;
    const p = code.slice(0, 4);
    if (wrongId && L.prefKw && L.prefKw[p] && L.prefKw[p][wrongId]) { L.prefKw[p][wrongId] -= 1; if (L.prefKw[p][wrongId] <= 0) delete L.prefKw[p][wrongId]; }
    if (id !== 'none') { L.prefKw = L.prefKw || {}; (L.prefKw[p] = L.prefKw[p] || {})[id] = (L.prefKw[p][id] || 0) + 1; }
  };

  // Huvudfunktion: tolka en läsning.
  Engine.prototype.resolve = function (text) {
    const nums = this.findNumbers(text);
    const gloss = this.matchGlossary(text);
    const res = { kind: 'none', text, gloss, nums };

    const seHits = [...new Set(nums.se)].filter(c => this.shelfOf(c));
    if (seHits.length === 1) return Object.assign(res, { kind: 'exact', code: seHits[0], shelf: this.shelfOf(seHits[0]), via: 'SE' });
    if (seHits.length > 1) return Object.assign(res, { kind: 'choice', options: seHits.map(c => ({ code: c, shelf: this.shelfOf(c) })), via: 'SE' });

    const looseHits = [...new Set(nums.loose)].filter(c => this.shelfOf(c));
    if (looseHits.length === 1 && !nums.se.length) return Object.assign(res, { kind: 'exact', code: looseHits[0], shelf: this.shelfOf(looseHits[0]), via: 'nummer' });
    if (looseHits.length > 1 && !nums.se.length) return Object.assign(res, { kind: 'choice', options: looseHits.map(c => ({ code: c, shelf: this.shelfOf(c) })), via: 'nummer' });

    const partial = nums.se[0] || nums.spaced[0] || nums.seParts.sort((a, b) => b.length - a.length)[0];
    if (partial) {
      const g = this.guessPrefix(partial);
      if (g) return Object.assign(res, { kind: 'guess', code: partial, guess: g, via: nums.se[0] ? 'okänt SE' : nums.spaced[0] === partial ? 'okänt nummer' : 'del av SE' });
    }
    if (gloss.length) {
      const sg = this.shelvesForGloss(gloss[0]);
      return Object.assign(res, { kind: sg.top.length ? 'gloss' : 'glossOnly', guess: sg.top.length ? { top: sg.top, n: sg.n, examples: true } : null });
    }
    return res;
  };

  // Lär in en bekräftad placering.
  Engine.prototype.learn = function (code, shelf, glossIds, name) {
    const L = this.learned;
    if (code && /^[A-Z0-9]{7}$/.test(code)) {
      if (this.catalog[code] !== shelf) L.codes[code] = shelf; else delete L.codes[code];
      if (name) L.names[code] = name;
      // Produkttyp sparas bara när den lästes på själva förpackningen (glossIds kommer från texten)
      if (glossIds && glossIds[0]) {
        L.codeGloss = L.codeGloss || {};
        if (!L.codeGloss[code]) L.codeGloss[code] = glossIds[0];
        const p = code.slice(0, 4);
        L.prefKw = L.prefKw || {};
        (L.prefKw[p] = L.prefKw[p] || {})[glossIds[0]] = (L.prefKw[p][glossIds[0]] || 0) + 1;
      }
    }
    for (const id of glossIds || []) {
      const m = (L.kw[id] = L.kw[id] || {});
      m[shelf] = (m[shelf] || 0) + 1;
    }
    this.rebuild();
  };

  root.Engine = Engine;
  root.foldText = fold;
  if (typeof module !== 'undefined') module.exports = { Engine, fold };
})(typeof self !== 'undefined' ? self : globalThis);
