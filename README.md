# Hyllskanner

Privat webbapp för iPhone: skanna artikelnumret (SE-numret) med kameran och se direkt vilken hylla varan ska stå på, markerad på lagerkartan, plus en kort rad om vad produkten är.

- Läser text offline i telefonen (Tesseract.js), inga kostnader.
- Prioriterar numret efter "SE", ignorerar NO/FI/DK.
- Gissar hylla från början av numret eller från ord på förpackningen när numret inte går att läsa.
- Lär sig av bekräftade placeringar (sparas bara i telefonen).

Öppna sidan i Safari → Dela → Lägg till på hemskärmen.

Filer: `data.js` (artikel → hylla), `prefixes.js` (prefixregler), `glossary.js` (materialkännedom), `map.js` (karta), `engine.js` (tolkning), `app.js` (kamera/gränssnitt).
