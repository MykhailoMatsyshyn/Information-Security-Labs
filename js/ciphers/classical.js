/* ============================================================
   Лаб. №1 — Шифри заміни та перестановки
   ============================================================
   Реалізації:
     • Caesar         — шифр Цезаря (простий зсув)
     • Atbash         — дзеркальна заміна (A↔Z)
     • Vigenere       — шифр Виженера (багатоалфавітний)
     • Transposition  — проста перестановка блоками
     • VerticalTransp — вертикальна перестановка (стовпці)
   ============================================================ */

'use strict';

/* ── Алфавіти ─────────────────────────────────────────────── */
const ALPHA_EN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_UK = 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ';

function getAlpha(lang = 'en') {
  return lang === 'uk' ? ALPHA_UK : ALPHA_EN;
}

/* ── Caesar ──────────────────────────────────────────────────
   b = (a + shift) mod n
   ─────────────────────────────────────────────────────────── */
const Caesar = {
  /**
   * @param {string} text
   * @param {number} shift
   * @param {boolean} decrypt
   * @param {'en'|'uk'} lang
   * @returns {{ result: string, steps: Array }}
   */
  run(text, shift, decrypt = false, lang = 'en') {
    const alpha = getAlpha(lang);
    const n = alpha.length;
    const s = mod(decrypt ? -shift : shift, n);
    const upper = text.toUpperCase();

    const steps = [
      { n: '01', t: `Алгоритм: Шифр Цезаря`, d: decrypt ? 'розшифрування' : 'шифрування' },
      { n: '02', t: `Алфавіт: ${lang === 'uk' ? 'Українська' : 'English'} (${n} символів)` },
      { n: '03', t: `Ключ: зсув = ${shift}`, d: `ефективний зсув: ${s}` },
      { n: '04', t: `Формула: b = (a ${decrypt ? '-' : '+'} ${shift}) mod ${n}` },
    ];

    const result = upper.split('').map((ch, i) => {
      const idx = alpha.indexOf(ch);
      if (idx === -1) return ch;
      const enc = alpha[(idx + s) % n];
      if (i < 5) steps.push({ n: `0${5 + i}`, t: `'${ch}'[${idx}] → '${enc}'[${(idx + s) % n}]`, d: `зсув +${s}` });
      return enc;
    }).join('');

    steps.push({ n: String(steps.length + 1).padStart(2, '0'), t: `Результат: "${result}"` });
    return { result, steps };
  },
};

/* ── Atbash ──────────────────────────────────────────────────
   b = (n - 1 - a)   (симетрично, розшифрування = шифрування)
   ─────────────────────────────────────────────────────────── */
const Atbash = {
  run(text, lang = 'en') {
    const alpha = getAlpha(lang);
    const n = alpha.length;
    const upper = text.toUpperCase();

    const steps = [
      { n: '01', t: `Алгоритм: Атбаш`, d: 'дзеркальна заміна' },
      { n: '02', t: `Формула: b = ${n - 1} − a` },
      { n: '03', t: `A↔${alpha[n - 1]}, B↔${alpha[n - 2]}, C↔${alpha[n - 3]} ...` },
    ];

    const result = upper.split('').map((ch, i) => {
      const idx = alpha.indexOf(ch);
      if (idx === -1) return ch;
      const enc = alpha[n - 1 - idx];
      if (i < 5) steps.push({ n: `0${4 + i}`, t: `'${ch}'[${idx}] → '${enc}'[${n - 1 - idx}]` });
      return enc;
    }).join('');

    steps.push({ n: String(steps.length + 1).padStart(2, '0'), t: `Результат: "${result}"` });
    return { result, steps };
  },
};

/* ── Vigenere ─────────────────────────────────────────────────
   bi = (ai ± ki) mod n   (ki — позиція букви ключа)
   ─────────────────────────────────────────────────────────── */
const Vigenere = {
  run(text, keyword, decrypt = false, lang = 'en') {
    const alpha = getAlpha(lang);
    const n = alpha.length;
    const upper = text.toUpperCase();
    const key = keyword.toUpperCase().replace(new RegExp(`[^${alpha}]`, 'g'), '') || alpha[0];

    const steps = [
      { n: '01', t: `Алгоритм: Шифр Виженера`, d: 'багатоалфавітна заміна' },
      { n: '02', t: `Ключ: "${key}"`, d: `довжина ${key.length}, повторюється циклічно` },
      { n: '03', t: `Формула: bi = (ai ${decrypt ? '−' : '+'} ki) mod ${n}` },
    ];

    let ki = 0;
    const result = upper.split('').map((ch, i) => {
      const idx = alpha.indexOf(ch);
      if (idx === -1) return ch;
      const keyChar = key[ki % key.length];
      const shift = alpha.indexOf(keyChar);
      const enc = alpha[mod(decrypt ? idx - shift : idx + shift, n)];
      if (i < 5) steps.push({ n: `0${4 + i}`, t: `'${ch}'[${idx}] ${decrypt ? '−' : '+'} '${keyChar}'[${shift}] → '${enc}'` });
      ki++;
      return enc;
    }).join('');

    steps.push({ n: String(steps.length + 1).padStart(2, '0'), t: `Результат: "${result}"` });
    return { result, steps };
  },
};

/* ── Simple Transposition ─────────────────────────────────────
   Текст розбивається на блоки довжини n.
   В кожному блоці символи переставляються згідно з ключем.
   Ключ: рядок "3 1 4 2" або "3,1,4,2"
   ─────────────────────────────────────────────────────────── */
const SimpleTransposition = {
  parseKey(keyStr) {
    return keyStr.trim().split(/[\s,]+/).map(Number).filter(x => !isNaN(x) && x > 0);
  },

  run(text, keyStr, decrypt = false) {
    const key = this.parseKey(keyStr);
    if (!key.length) return { result: text, steps: [{ n: '01', t: 'Помилка: невірний ключ' }] };

    const n = key.length;
    // Зворотній ключ для розшифрування
    const invKey = new Array(n);
    key.forEach((pos, i) => { invKey[pos - 1] = i + 1; });
    const useKey = decrypt ? invKey : key;

    const upper = text.toUpperCase().replace(/\s/g, '_');
    const padded = upper.padEnd(Math.ceil(upper.length / n) * n, 'X');
    const blocks = [];
    for (let i = 0; i < padded.length; i += n) blocks.push(padded.slice(i, i + n));

    const steps = [
      { n: '01', t: `Алгоритм: Проста перестановка` },
      { n: '02', t: `Ключ: [${key.join(', ')}]`, d: `розмір блоку: ${n}` },
      { n: '03', t: `Блоків: ${blocks.length}`, d: `доповнення: 'X'` },
    ];

    const result = blocks.map((block, bi) => {
      const arr = block.split('');
      const out = new Array(n);
      useKey.forEach((pos, i) => { out[pos - 1] = arr[i]; });
      if (bi < 2) steps.push({ n: `0${4 + bi}`, t: `Блок ${bi + 1}: "${block}" → "${out.join('')}"` });
      return out.join('');
    }).join('');

    steps.push({ n: String(steps.length + 1).padStart(2, '0'), t: `Результат: "${result}"` });
    return { result, steps };
  },
};

/* ── Vertical (Columnar) Transposition ────────────────────────
   Текст записується рядками в таблицю (cols = довжина ключа).
   Зчитуються стовпці в порядку, визначеному ключем.
   Ключ: рядок "3 1 4 2" або слово (сортується за алфавітом → порядок)
   ─────────────────────────────────────────────────────────── */
const VerticalTransposition = {
  parseKey(keyStr) {
    const trimmed = keyStr.trim();
    if (/^[\d\s,]+$/.test(trimmed)) {
      return trimmed.split(/[\s,]+/).map(Number).filter(x => !isNaN(x) && x > 0);
    }
    // Ключ-слово: визначаємо порядок стовпців за алфавітом
    const chars = trimmed.toUpperCase().split('');
    const sorted = [...chars].sort();
    return chars.map(c => sorted.indexOf(c) + 1);
  },

  run(text, keyStr, decrypt = false) {
    const order = this.parseKey(keyStr);
    if (!order.length) return { result: text, steps: [{ n: '01', t: 'Помилка: невірний ключ' }] };

    const cols = order.length;
    const upper = text.toUpperCase().replace(/\s/g, '_');
    const padded = upper.padEnd(Math.ceil(upper.length / cols) * cols, 'X');
    const rows = Math.ceil(padded.length / cols);

    // Заповнюємо таблицю рядками
    const table = [];
    for (let r = 0; r < rows; r++) {
      table.push(padded.slice(r * cols, (r + 1) * cols).split(''));
    }

    const steps = [
      { n: '01', t: `Алгоритм: Вертикальна перестановка` },
      { n: '02', t: `Ключ: [${order.join(', ')}]`, d: `стовпців: ${cols}, рядків: ${rows}` },
    ];

    let result = '';
    if (!decrypt) {
      // Зашифрування: виписуємо стовпці в порядку ключа (1-based)
      const sortedCols = [...order].map((_, i) => i).sort((a, b) => order[a] - order[b]);
      sortedCols.forEach((col, i) => {
        const colData = table.map(row => row[col]).join('');
        if (i < 3) steps.push({ n: `0${3 + i}`, t: `Стовпець ${col + 1} (пріоритет ${order[col]}): "${colData}"` });
        result += colData;
      });
    } else {
      // Розшифрування
      const sortedCols = [...order].map((_, i) => i).sort((a, b) => order[a] - order[b]);
      const colTexts = [];
      let pos = 0;
      sortedCols.forEach(col => {
        colTexts[col] = padded.slice(pos, pos + rows).split('');
        pos += rows;
      });
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          result += colTexts[c][r];
        }
      }
    }

    steps.push({ n: String(steps.length + 1).padStart(2, '0'), t: `Результат: "${result}"` });
    return { result, steps };
  },
};

/* ── Експорт ─────────────────────────────────────────────────
   Доступно глобально для lab1.html
   ─────────────────────────────────────────────────────────── */
window.CL = window.CL || {};
Object.assign(window.CL, { Caesar, Atbash, Vigenere, SimpleTransposition, VerticalTransposition });
