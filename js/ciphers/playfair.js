/* ============================================================
   Лаб. №3 — Playfair та шифр Вернама (OTP)
   ============================================================ */

'use strict';

function _tr(key) {
  return (typeof window !== 'undefined' && window.CL && window.CL.i18n && window.CL.i18n.t) ? window.CL.i18n.t(key) : key;
}

/* ── Playfair ─────────────────────────────────────────────────
   Біграмний шифр на основі квадрату Полібія 5×5.
   Правила:
     1. Обидві в одному рядку → беремо букви праворуч (з огортанням)
     2. Обидві в одному стовпці → беремо букви знизу (з огортанням)
     3. Прямокутник → міняємо кути прямокутника
   ─────────────────────────────────────────────────────────── */
const Playfair = {
  buildSquare(keyword = '') {
    const base = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // без J
    const seen = new Set();
    const sq = [];
    const add = ch => {
      const c = ch === 'J' ? 'I' : ch;
      if (base.includes(c) && !seen.has(c)) { seen.add(c); sq.push(c); }
    };
    keyword.toUpperCase().split('').forEach(add);
    base.split('').forEach(add);
    return sq;
  },

  pos(sq, ch) {
    const idx = sq.indexOf(ch === 'J' ? 'I' : ch);
    return { r: Math.floor(idx / 5), c: idx % 5 };
  },

  run(text, keyword, decrypt = false) {
    const sq = this.buildSquare(keyword);
    const d = decrypt ? -1 : 1;

    const upper = text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');

    // Розбиваємо на біграми (вставляємо X між однаковими)
    const chars = [];
    let i = 0;
    while (i < upper.length) {
      const a = upper[i];
      const b = upper[i + 1] || 'X';
      if (a === b) { chars.push(a, 'X'); i++; }
      else         { chars.push(a, b);   i += 2; }
    }
    if (chars.length % 2 !== 0) chars.push('X');

    const steps = [
      { n: '01', t: _tr('stepAlgoPlayfair'), d: decrypt ? _tr('decrypt') : _tr('encrypt') },
      { n: '02', t: `${_tr('stepKey')}: "${keyword || _tr('lab03NoKey')}"` },
      { n: '03', t: `${_tr('stepRow1Square')}: "${sq.slice(0, 5).join(' ')}"` },
      { n: '04', t: `${_tr('stepPreparedBigrams')}: ${chars.join('').match(/.{2}/g).join(' ')}` },
    ];

    let result = '';
    for (let j = 0; j < chars.length; j += 2) {
      const a = chars[j], b = chars[j + 1];
      const pa = this.pos(sq, a), pb = this.pos(sq, b);
      let ea, eb;

      if (pa.r === pb.r) {
        ea = sq[pa.r * 5 + mod(pa.c + d, 5)];
        eb = sq[pb.r * 5 + mod(pb.c + d, 5)];
        if (j < 8) steps.push({ n: `0${5 + j / 2}`, t: `[${a}${b}] ${_tr('stepOneRow')} → [${ea}${eb}]` });
      } else if (pa.c === pb.c) {
        ea = sq[mod(pa.r + d, 5) * 5 + pa.c];
        eb = sq[mod(pb.r + d, 5) * 5 + pb.c];
        if (j < 8) steps.push({ n: `0${5 + j / 2}`, t: `[${a}${b}] ${_tr('stepOneCol')} → [${ea}${eb}]` });
      } else {
        ea = sq[pa.r * 5 + pb.c];
        eb = sq[pb.r * 5 + pa.c];
        if (j < 8) steps.push({ n: `0${5 + j / 2}`, t: `[${a}${b}] ${_tr('stepRectangle')} → [${ea}${eb}]` });
      }
      result += ea + eb;
    }

    steps.push({ n: String(steps.length + 1).padStart(2, '0'), t: `${_tr('stepResult')}: "${result}"` });
    return { result, steps };
  },
};

/* ── Vernam (One-Time Pad) ────────────────────────────────────
   yi = xi XOR ki   (побітове XOR)
   Для тексту: перетворюємо в байти, XOR з ключем, назад у рядок.
   ─────────────────────────────────────────────────────────── */
const Vernam = {
  /**
   * @param {string} text   — відкритий/зашифрований текст
   * @param {string} key    — ключ (має бути >= довжини тексту)
   * @returns {{ result: string, steps: Array, keyUsed: string }}
   */
  run(text, key) {
    // Якщо ключ коротший — повторюємо (технічно не OTP, але для демо ок)
    const expandedKey = key.padEnd(text.length, key).slice(0, text.length);

    const steps = [
      { n: '01', t: _tr('stepAlgoVernam'), d: _tr('lab03VernamBadge') },
      { n: '02', t: `${_tr('stepTextLen')}: ${text.length}`, d: `${_tr('stepKeyLen')}: ${key.length}` },
      { n: '03', t: _tr('stepOpXor') },
    ];

    const result = text.split('').map((ch, i) => {
      const xorVal = ch.charCodeAt(0) ^ expandedKey.charCodeAt(i);
      const enc = String.fromCharCode(xorVal);
      if (i < 5) steps.push({
        n: `0${4 + i}`,
        t: `'${ch}'(${ch.charCodeAt(0)}) XOR '${expandedKey[i]}'(${expandedKey.charCodeAt(i)}) = ${xorVal}`,
        d: `→ '${enc.charCodeAt(0) < 32 ? `\\u${xorVal.toString(16).padStart(4,'0')}` : enc}'`
      });
      return enc;
    }).join('');

    // Показуємо як hex для зрозумілості
    const hexResult = [...result].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    steps.push({ n: String(steps.length + 1).padStart(2, '0'), t: `${_tr('stepHexResult')}: ${hexResult}` });

    return { result, hexResult, steps, keyUsed: expandedKey };
  },

  /** Для відображення hex → текст */
  toHex(str) {
    return [...str].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
  },
};

window.CL = window.CL || {};
Object.assign(window.CL, { Playfair, Vernam });
