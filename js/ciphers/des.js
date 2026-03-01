/* ============================================================
   Лаб. №4 — DES (Data Encryption Standard)
   ============================================================
   Повна реалізація DES згідно FIPS 46-3:
     • 64-bit блок, 56-bit ключ, 16 раундів мережі Фейстеля
     • Всі таблиці перестановок (IP, IP⁻¹, E, P, S1..S8, PC1, PC2)
   ============================================================ */

'use strict';

/* ── Таблиці ─────────────────────────────────────────────────── */
const DES_TABLES = {
  IP: [
    58,50,42,34,26,18,10,2, 60,52,44,36,28,20,12,4,
    62,54,46,38,30,22,14,6, 64,56,48,40,32,24,16,8,
    57,49,41,33,25,17, 9,1, 59,51,43,35,27,19,11,3,
    61,53,45,37,29,21,13,5, 63,55,47,39,31,23,15,7,
  ],
  IP_INV: [
    40,8,48,16,56,24,64,32, 39,7,47,15,55,23,63,31,
    38,6,46,14,54,22,62,30, 37,5,45,13,53,21,61,29,
    36,4,44,12,52,20,60,28, 35,3,43,11,51,19,59,27,
    34,2,42,10,50,18,58,26, 33,1,41, 9,49,17,57,25,
  ],
  E: [
    32,1,2,3,4,5,   4,5,6,7,8,9,
    8,9,10,11,12,13, 12,13,14,15,16,17,
    16,17,18,19,20,21, 20,21,22,23,24,25,
    24,25,26,27,28,29, 28,29,30,31,32,1,
  ],
  P: [
    16,7,20,21,29,12,28,17, 1,15,23,26,5,18,31,10,
    2,8,24,14,32,27,3,9,   19,13,30,6,22,11,4,25,
  ],
  PC1: [
    57,49,41,33,25,17,9,  1,58,50,42,34,26,18,
    10,2,59,51,43,35,27, 19,11,3,60,52,44,36,
    63,55,47,39,31,23,15, 7,62,54,46,38,30,22,
    14,6,61,53,45,37,29, 21,13,5,28,20,12,4,
  ],
  PC2: [
    14,17,11,24,1,5,3,28, 15,6,21,10,23,19,12,4,
    26,8,16,7,27,20,13,2, 41,52,31,37,47,55,30,40,
    51,45,33,48,44,49,39,56, 34,53,46,42,50,36,29,32,
  ],
  SHIFTS: [1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1],
  S: [
    // S1
    [[14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7],
     [0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8],
     [4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0],
     [15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13]],
    // S2
    [[15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10],
     [3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5],
     [0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15],
     [13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9]],
    // S3
    [[10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8],
     [13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1],
     [13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7],
     [1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12]],
    // S4
    [[7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15],
     [13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9],
     [10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4],
     [3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14]],
    // S5
    [[2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9],
     [14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6],
     [4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14],
     [11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3]],
    // S6
    [[12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11],
     [10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8],
     [9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6],
     [4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13]],
    // S7
    [[4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1],
     [13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6],
     [1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2],
     [6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12]],
    // S8
    [[13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7],
     [1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2],
     [7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8],
     [2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11]],
  ],
};

/* ── Bit helpers ─────────────────────────────────────────────── */
function strToBits(str) {
  const bits = [];
  for (let i = 0; i < str.length; i++) {
    const b = str.charCodeAt(i).toString(2).padStart(8, '0');
    bits.push(...b.split('').map(Number));
  }
  return bits;
}

function hexToBits(hex) {
  return hex.split('').flatMap(h => parseInt(h, 16).toString(2).padStart(4, '0').split('').map(Number));
}

function bitsToHex(bits) {
  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4).join(''), 2).toString(16);
  }
  return hex.toUpperCase();
}

function bitsToStr(bits) {
  let str = '';
  for (let i = 0; i < bits.length; i += 8) {
    str += String.fromCharCode(parseInt(bits.slice(i, i + 8).join(''), 2));
  }
  return str;
}

function permute(bits, table) {
  return table.map(pos => bits[pos - 1]);
}

function xorBits(a, b) {
  return a.map((bit, i) => bit ^ b[i]);
}

function circularLeft(bits, n) {
  return [...bits.slice(n), ...bits.slice(0, n)];
}

/* ── Key schedule ─────────────────────────────────────────────── */
function generateSubkeys(keyBits) {
  const pc1 = permute(keyBits, DES_TABLES.PC1);
  let C = pc1.slice(0, 28);
  let D = pc1.slice(28, 56);
  const subkeys = [];
  for (let i = 0; i < 16; i++) {
    C = circularLeft(C, DES_TABLES.SHIFTS[i]);
    D = circularLeft(D, DES_TABLES.SHIFTS[i]);
    subkeys.push(permute([...C, ...D], DES_TABLES.PC2));
  }
  return subkeys;
}

/* ── Feistel F-function ───────────────────────────────────────── */
function fFunction(R, subkey) {
  const expanded = permute(R, DES_TABLES.E);
  const xored = xorBits(expanded, subkey);
  const sOutput = [];
  for (let i = 0; i < 8; i++) {
    const block = xored.slice(i * 6, (i + 1) * 6);
    const row = (block[0] << 1) | block[5];
    const col = (block[1] << 3) | (block[2] << 2) | (block[3] << 1) | block[4];
    const val = DES_TABLES.S[i][row][col];
    sOutput.push(...val.toString(2).padStart(4, '0').split('').map(Number));
  }
  return permute(sOutput, DES_TABLES.P);
}

/* ── DES core ─────────────────────────────────────────────────── */
const DES = {
  /**
   * @param {string} textHex   — 16 hex символів (64 bit)
   * @param {string} keyHex    — 16 hex символів (64 bit, 8 парити)
   * @param {boolean} decrypt
   * @returns {{ result: string, steps: Array, rounds: Array }}
   */
  runHex(textHex, keyHex, decrypt = false) {
    const textBits = hexToBits(textHex.padEnd(16, '0').slice(0, 16));
    const keyBits  = hexToBits(keyHex.padEnd(16, '0').slice(0, 16));

    const subkeys = generateSubkeys(keyBits);
    if (decrypt) subkeys.reverse();

    const ip = permute(textBits, DES_TABLES.IP);
    let L = ip.slice(0, 32);
    let R = ip.slice(32, 64);

    const steps = [
      { n: '01', t: `Алгоритм: DES`, d: decrypt ? 'розшифрування' : 'шифрування' },
      { n: '02', t: `Вхід (hex): ${textHex.toUpperCase()}` },
      { n: '03', t: `Ключ (hex): ${keyHex.toUpperCase()}` },
      { n: '04', t: `Після IP: L₀=${bitsToHex(L)} R₀=${bitsToHex(R)}` },
    ];

    const rounds = [];
    for (let i = 0; i < 16; i++) {
      const fResult = fFunction(R, subkeys[i]);
      const newR = xorBits(L, fResult);
      const newL = R;
      rounds.push({ round: i + 1, L: bitsToHex(newL), R: bitsToHex(newR) });
      if (i < 3) steps.push({ n: `0${5 + i}`, t: `Раунд ${i + 1}: L=${bitsToHex(newL)} R=${bitsToHex(newR)}` });
      L = newL; R = newR;
    }

    const combined = permute([...R, ...L], DES_TABLES.IP_INV);
    const result = bitsToHex(combined);

    steps.push({ n: String(steps.length + 1).padStart(2, '0'), t: `Після IP⁻¹ (результат): ${result}` });
    return { result, steps, rounds };
  },

  /** Зручна обгортка для текстового вводу (UTF-8 → hex → DES) */
  runText(text, keyText, decrypt = false) {
    const padded = text.padEnd(8, '\0').slice(0, 8);
    const keyPadded = keyText.padEnd(8, '\0').slice(0, 8);
    const textHex = [...padded].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    const keyHex  = [...keyPadded].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    const { result, steps, rounds } = this.runHex(textHex, keyHex, decrypt);
    return { result, textHex, keyHex, steps, rounds };
  },
};

window.CL = window.CL || {};
Object.assign(window.CL, { DES });
