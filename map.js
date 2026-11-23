// Hyllkarta ritad efter "Sonepar prefix + karta" (sida 4). Koordinater i originalbildens pixlar.
(function (root) {
  'use strict';
  const G = '#9aa1ad', LIGHT = '#cdd1d8';
  const R1 = { y: 1138, h: 175 }, R2 = { y: 1370, h: 175 };
  const rack = (x, r, w = 28, fill = G) => ({ t: 'rect', x, y: r.y, w, h: r.h, fill });

  // Grundstrukturer
  const base = [
    { t: 'rect', x: 65, y: 995, w: 320, h: 27 }, { t: 'rect', x: 612, y: 995, w: 503, h: 27 },
    { t: 'rect', x: 1085, y: 995, w: 28, h: 597 }, { t: 'rect', x: 65, y: 995, w: 28, h: 318 },
    { t: 'rect', x: 65, y: 1340, w: 28, h: 35 }, { t: 'rect', x: 65, y: 1686, w: 28, h: 36 },
    { t: 'rect', x: 65, y: 1868, w: 603, h: 29 }, { t: 'poly', p: '65,1820 115,1868 65,1868' },
    rack(210, R1), rack(370, R1), rack(569, R1), rack(769, R1), rack(927, R1),
    rack(210, R2), rack(370, R2), rack(529, R2), rack(670, R2), rack(860, R2), { t: 'rect', x: 985, y: 1370, w: 53, h: 222, fill: LIGHT },
    { t: 'poly', p: '188,1583 482,1662 477,1690 182,1606' }, { t: 'poly', p: '188,1690 482,1769 477,1797 182,1713' },
  ];

  const face = (x, r, side, w = 28) => ({ t: 'rect', x: side === 'L' ? x - 14 : x + w, y: r.y, w: 14, h: r.h });
  const d = (dy) => (s) => s.replace(/(\d+),(\d+)/g, (_, a, b) => a + ',' + (+b + dy));

  // Hylla -> [etikettposition, markering]
  const S = {
    '01': [191, 1151, face(210, R1, 'L')], '02': [255, 1151, face(210, R1, 'R')],
    '03': [351, 1154, face(370, R1, 'L')], '04': [414, 1154, face(370, R1, 'R')],
    '05': [552, 1154, face(569, R1, 'L')], '06': [615, 1154, face(569, R1, 'R')],
    '07': [751, 1154, face(769, R1, 'L')], '08': [814, 1154, face(769, R1, 'R')],
    '09': [909, 1154, face(927, R1, 'L')], '10': [972, 1154, face(927, R1, 'R')],
    '11': [193, 1383, face(210, R2, 'L')], '12': [256, 1383, face(210, R2, 'R')],
    '13': [353, 1383, face(370, R2, 'L')], '14': [416, 1383, face(370, R2, 'R')],
    '15': [512, 1383, face(529, R2, 'L')], '16': [575, 1383, face(529, R2, 'R')],
    '17': [653, 1383, face(670, R2, 'L')], '18': [716, 1383, face(670, R2, 'R')],
    '19': [842, 1383, face(860, R2, 'L')], '20': [905, 1383, face(860, R2, 'R')],
    '21': [968, 1383, { t: 'rect', x: 971, y: 1370, w: 14, h: 222 }], '22': [1055, 1383, { t: 'rect', x: 1038, y: 1370, w: 14, h: 222 }],
    '23': [166, 1594, { t: 'poly', p: '188,1583 214,1590 208,1613 182,1606' }],
    '24': [439, 1632, { t: 'poly', p: '214,1581 484,1653 482,1662 212,1590' }],
    '25': [439, 1698, { t: 'poly', p: '206,1613 477,1690 475,1699 204,1622' }],
    '26': [166, 1692, { t: 'poly', p: d(107)('188,1583 214,1590 208,1613 182,1606') }],
    '27': [311, 1708, { t: 'poly', p: d(107)('214,1581 484,1653 482,1662 212,1590') }],
    '28': [311, 1770, { t: 'poly', p: d(107)('206,1613 477,1690 475,1699 204,1622') }],
    '29': [108, 1835, { t: 'poly', p: '65,1820 115,1868 65,1868' }],
    '30': [624, 1857, { t: 'rect', x: 115, y: 1868, w: 553, h: 29 }],
    '80': [111, 1705, { t: 'rect', x: 65, y: 1686, w: 28, h: 36 }],
    '90': [111, 1358, { t: 'rect', x: 65, y: 1340, w: 28, h: 35 }],
    '100': [114, 1215, { t: 'rect', x: 65, y: 1022, w: 28, h: 291 }],
    '110': [352, 1041, { t: 'rect', x: 93, y: 995, w: 292, h: 27 }],
    '120': [626, 1037, { t: 'rect', x: 612, y: 995, w: 108, h: 27 }],
    '130': [798, 1037, { t: 'rect', x: 720, y: 995, w: 365, h: 27 }],
    '141': [1073, 1485, { t: 'rect', x: 1085, y: 1310, w: 28, h: 282 }],
    '142': [1065, 1098, { t: 'rect', x: 1085, y: 995, w: 28, h: 315 }],
  };

  function el(o, fill, extra = '') {
    if (o.t === 'rect') return `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="${fill || o.fill || G}" ${extra}/>`;
    return `<polygon points="${o.p}" fill="${fill || o.fill || G}" ${extra}/>`;
  }

  // highlight: { '13': 'main', '12': 'alt' }
  function render(highlight = {}, opts = {}) {
    const parts = [];
    parts.push(`<svg class="map" viewBox="45 975 1090 940" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hyllkarta">`);
    parts.push(`<rect x="45" y="975" width="1090" height="940" fill="#fff"/>`);
    parts.push(`<rect x="65" y="995" width="1050" height="902" fill="#f6f8fb"/>`);
    parts.push(base.map(o => el(o)).join(''));
    parts.push(`<rect x="385" y="995" width="13" height="40" fill="#17233b"/><rect x="598" y="995" width="14" height="40" fill="#17233b"/>`);
    parts.push(`<rect x="1070" y="1677" width="45" height="7" fill="#17233b"/><rect x="1070" y="1814" width="45" height="7" fill="#17233b"/>`);
    parts.push(`<text x="498" y="1027" class="m-zone">Lager</text><text x="1050" y="1755" class="m-zone">Entré</text>`);
    for (const shelf in S) {
      const kind = highlight[shelf];
      if (!kind) continue;
      const color = kind === 'main' ? '#009bd2' : '#f2a900';
      parts.push(el(S[shelf][2], color, kind === 'main' ? 'class="m-pulse"' : 'opacity=".9"'));
    }
    for (const shelf in S) {
      const [x, y] = S[shelf], kind = highlight[shelf];
      const r = shelf.length > 2 ? 30 : 24;
      if (kind) parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${kind === 'main' ? '#009bd2' : '#f2a900'}"/>`);
      parts.push(`<text x="${x}" y="${y}" class="m-lbl${kind ? ' m-on' : ''}" data-shelf="${shelf}">${shelf}</text>`);
    }
    parts.push(`</svg>`);
    return parts.join('');
  }

  root.ShelfMap = { render, shelves: Object.keys(S) };
})(self);
