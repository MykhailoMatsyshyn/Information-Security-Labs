/* ============================================================
   Лаб. №2 — Шифр Полібія та Гронсфельда
   ============================================================ */

'use strict';

/* ── Polybius Square ──────────────────────────────────────────
   Квадрат 5×5 (EN) або 6×6 (UK).
   Кожна літера кодується координатами (рядок, стовпець).
   ─────────────────────────────────────────────────────────── */
const Polybius = {
  /**
   * Будує квадрат Полібія з ключовим словом.
   * @param {string} keyword
   * @param {'en'|'uk'} lang
   * @returns {string[]}  масив літер квадрата (по рядках)
   */
  buildSquare(keyword = '', lang = 'en') {
    const baseEN = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // J=I (25 літер = 5×5)
    const baseUK = 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ'; // 33 → 6×6 (36 клітин)

    const base = lang === 'uk' ? baseUK : baseEN;
    const seen = new Set();
    const result = [];

    const addChar = ch => {
      const c = ch.toUpperCase();
      if (lang === 'en' && c === 'J') return; // J≡I
      if (base.includes(c) && !seen.has(c)) { seen.add(c); result.push(c); }
    };

    keyword.toUpperCase().split('').forEach(addChar);
    base.split('').forEach(addChar);

    return result;
  },

  /** Розмір сторони квадрата */
  size(lang) { return lang === 'uk' ? 6 : 5; },

  run(text, keyword, decrypt = false, lang = 'en') {
    const sq = this.buildSquare(keyword, lang);
    const sz = this.size(lang);
    const upper = text.toUpperCase().replace(lang === 'en' ? /J/g : '', lang === 'en' ? 'I' : '');

    const steps = [
      { n: '01', t: `Алгоритм: Квадрат Полібія` },
      { n: '02', t: `Ключ: "${keyword || '(без ключа)'}"`, d: `розмір ${sz}×${sz}` },
      { n: '03', t: `Рядок 1 квадрату: "${sq.slice(0, sz).join(' ')}"` },
    ];

    let result = '';

    if (!decrypt) {
      upper.split('').forEach((ch, i) => {
        const idx = sq.indexOf(ch);
        if (idx === -1) { result += ch; return; }
        const row = Math.floor(idx / sz);
        const col = idx % sz;
        // Зсуваємо рядок вниз (з огортанням)
        const newIdx = ((row + 1) % sz) * sz + col;
        const enc = sq[newIdx];
        if (i < 4) steps.push({ n: `0${4 + i}`, t: `'${ch}'(${row + 1},${col + 1}) → '${enc}'(${(row + 1) % sz + 1},${col + 1})` });
        result += enc;
      });
    } else {
      upper.split('').forEach((ch, i) => {
        const idx = sq.indexOf(ch);
        if (idx === -1) { result += ch; return; }
        const row = Math.floor(idx / sz);
        const col = idx % sz;
        const newIdx = mod(row - 1, sz) * sz + col;
        const dec = sq[newIdx];
        if (i < 4) steps.push({ n: `0${4 + i}`, t: `'${ch}'(${row + 1},${col + 1}) → '${dec}'(${mod(row - 1, sz) + 1},${col + 1})` });
        result += dec;
      });
    }

    steps.push({ n: String(steps.length + 1).padStart(2, '0'), t: `Результат: "${result}"` });
    return { result, steps, square: sq, size: sz };
  },
};

/* ── Gronsfeld ────────────────────────────────────────────────
   Числовий варіант Виженера: ключ — послідовність цифр (0–9).
   bi = (ai ± di) mod n
   ─────────────────────────────────────────────────────────── */
const Gronsfeld = {
  run(text, numKey, decrypt = false, lang = 'en') {
    const alpha = lang === 'uk'
      ? 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ'
      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const n = alpha.length;
    const digits = String(numKey).replace(/\D/g, '') || '0';
    const upper = text.toUpperCase();

    const steps = [
      { n: '01', t: `Алгоритм: Шифр Гронсфельда`, d: 'числовий Виженер' },
      { n: '02', t: `Ключ: "${digits}"`, d: `цифри циклічно накладаються на текст` },
      { n: '03', t: `Формула: bi = (ai ${decrypt ? '−' : '+'} di) mod ${n}` },
    ];

    let di = 0;
    const result = upper.split('').map((ch, i) => {
      const idx = alpha.indexOf(ch);
      if (idx === -1) return ch;
      const shift = parseInt(digits[di % digits.length]);
      di++;
      const enc = alpha[mod(decrypt ? idx - shift : idx + shift, n)];
      if (i < 5) steps.push({ n: `0${4 + i}`, t: `'${ch}'[${idx}] ${decrypt ? '−' : '+'} ${shift} → '${enc}'` });
      return enc;
    }).join('');

    steps.push({ n: String(steps.length + 1).padStart(2, '0'), t: `Результат: "${result}"` });
    return { result, steps };
  },
};

window.CL = window.CL || {};
Object.assign(window.CL, { Polybius, Gronsfeld });
