/* ============================================================
   Лаб. №5 + №6 — RSA шифрування та ЕЦП
   ============================================================
   BigInt API (вбудований у всі сучасні браузери) використовується
   для точної арифметики великих чисел.
   ============================================================ */

'use strict';

/* ── Math utilities ───────────────────────────────────────────── */

/** Розширений алгоритм Евкліда: повертає [g, x, y] де a*x + b*y = g */
function extGcd(a, b) {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x, y] = extGcd(b, a % b);
  return [g, y, x - (a / b) * y];
}

/** Модульне обернення: a⁻¹ mod m */
function modInverse(a, m) {
  const [g, x] = extGcd(((a % m) + m) % m, m);
  if (g !== 1n) throw new Error('Оберненого не існує (числа не взаємно прості)');
  return ((x % m) + m) % m;
}

/** Швидке модульне піднесення до степеня: base^exp mod mod */
function modPow(base, exp, mod) {
  if (mod === 1n) return 0n;
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = result * base % mod;
    exp = exp / 2n;
    base = base * base % mod;
  }
  return result;
}

/** НСД двох BigInt */
function gcd(a, b) { return b === 0n ? a : gcd(b, a % b); }

/** Перевірка числа на простоту (детермінований тест Міллера-Рабіна) */
function isPrime(n) {
  if (n < 2n) return false;
  const smallPrimes = [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n];
  if (smallPrimes.includes(n)) return true;
  if (smallPrimes.some(p => n % p === 0n)) return false;

  let d = n - 1n, r = 0n;
  while (d % 2n === 0n) { d /= 2n; r++; }

  const witnesses = [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n];
  for (const a of witnesses) {
    if (a >= n) continue;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let composite = true;
    for (let i = 0n; i < r - 1n; i++) {
      x = modPow(x, 2n, n);
      if (x === n - 1n) { composite = false; break; }
    }
    if (composite) return false;
  }
  return true;
}

/* ── RSA ──────────────────────────────────────────────────────── */
const RSA = {
  /**
   * Генерація ключів.
   * @param {bigint} p  — просте число
   * @param {bigint} q  — просте число
   * @param {bigint} [eHint]  — бажане e (якщо не передано — вибирається автоматично)
   * @returns {{ n, e, d, phi, steps }}
   */
  generateKeys(p, q, eHint) {
    if (!isPrime(p)) throw new Error(`${p} не є простим числом`);
    if (!isPrime(q)) throw new Error(`${q} не є простим числом`);
    if (p === q) throw new Error('p і q мають бути різними');

    const n = p * q;
    const phi = (p - 1n) * (q - 1n);

    let e = eHint ? BigInt(eHint) : 65537n;
    // Якщо переданий e не підходить — підбираємо наступний
    while (gcd(e, phi) !== 1n || e >= phi || e <= 1n) e++;

    const d = modInverse(e, phi);

    const steps = [
      { n: '01', t: `p = ${p}, q = ${q}` },
      { n: '02', t: `n = p × q = ${n}` },
      { n: '03', t: `φ(n) = (p−1)(q−1) = ${phi}` },
      { n: '04', t: `e = ${e}`, d: `НСД(e, φ(n)) = ${gcd(e, phi)}` },
      { n: '05', t: `d = e⁻¹ mod φ(n) = ${d}`, d: `перевірка: e×d mod φ(n) = ${(e * d) % phi}` },
      { n: '06', t: `Відкритий ключ: (e=${e}, n=${n})` },
      { n: '07', t: `Закритий ключ: (d=${d}, n=${n})` },
    ];

    return { n, e, d, phi, steps };
  },

  /** Шифрування блоку: c = m^e mod n */
  encryptBlock(m, e, n) {
    return modPow(BigInt(m), BigInt(e), BigInt(n));
  },

  /** Розшифрування блоку: m = c^d mod n */
  decryptBlock(c, d, n) {
    return modPow(BigInt(c), BigInt(d), BigInt(n));
  },

  /**
   * Шифрування числового повідомлення (рядок цифр, розбитих на блоки).
   * @param {string} numStr   — повідомлення як рядок чисел "688 232 687"
   * @param {bigint} e
   * @param {bigint} n
   */
  encryptBlocks(numStr, e, n) {
    const blocks = numStr.trim().split(/\s+/).map(BigInt);
    const steps = [
      { n: '01', t: `Шифрування RSA`, d: `c = mᵉ mod n` },
      { n: '02', t: `e = ${e}, n = ${n}` },
    ];
    const cipher = blocks.map((m, i) => {
      const c = modPow(m, e, n);
      steps.push({ n: String(3 + i).padStart(2, '0'), t: `m=${m}`, d: `c = ${m}^${e} mod ${n} = ${c}` });
      return c;
    });
    return { cipher, steps };
  },

  decryptBlocks(cipherArr, d, n) {
    const steps = [
      { n: '01', t: `Розшифрування RSA`, d: `m = cᵈ mod n` },
      { n: '02', t: `d = ${d}, n = ${n}` },
    ];
    const plain = cipherArr.map((c, i) => {
      const m = modPow(BigInt(c), BigInt(d), BigInt(n));
      steps.push({ n: String(3 + i).padStart(2, '0'), t: `c=${c}`, d: `m = ${c}^${d} mod ${n} = ${m}` });
      return m;
    });
    return { plain, steps };
  },
};

/* ── Digital Signature (ЕЦП) ─────────────────────────────────── */
const DSA = {
  /**
   * Геш-функція: H_i = (M_i + H_{i-1})² mod n
   * @param {string} message  — повідомлення як рядок цифр "312"
   * @param {bigint} n
   * @param {bigint} H0       — вектор ініціалізації
   */
  hash(message, n, H0 = 6n) {
    const digits = message.trim().split('').map(BigInt);
    const steps = [
      { n: '01', t: `Гешування повідомлення M="${message}"`, d: `H₀ = ${H0}` },
    ];
    let H = H0;
    digits.forEach((m, i) => {
      const newH = modPow(m + H, 2n, n);
      steps.push({ n: String(2 + i).padStart(2, '0'), t: `H${i + 1} = (${m}+${H})² mod ${n} = ${newH}` });
      H = newH;
    });
    return { hash: H, steps };
  },

  /** Формування ЕЦП: S = m^d mod n */
  sign(hashVal, d, n) {
    const S = modPow(BigInt(hashVal), BigInt(d), BigInt(n));
    return {
      signature: S,
      steps: [
        { n: '01', t: `Підписування: S = m^d mod n` },
        { n: '02', t: `S = ${hashVal}^${d} mod ${n} = ${S}` },
      ],
    };
  },

  /** Перевірка ЕЦП: m1 = S^e mod n, перевіряємо m1 == m */
  verify(signature, e, n, expectedHash) {
    const m1 = modPow(BigInt(signature), BigInt(e), BigInt(n));
    const valid = m1 === BigInt(expectedHash);
    return {
      computedHash: m1,
      valid,
      steps: [
        { n: '01', t: `Верифікація: m1 = S^e mod n` },
        { n: '02', t: `m1 = ${signature}^${e} mod ${n} = ${m1}` },
        { n: '03', t: `m1 (${m1}) ${valid ? '==' : '!='} m (${expectedHash})`, d: valid ? '✓ Підпис ДІЙСНИЙ' : '✗ Підпис НЕДІЙСНИЙ' },
      ],
    };
  },
};

window.CL = window.CL || {};
Object.assign(window.CL, { RSA, DSA, modPow, modInverse, isPrime, gcd });
