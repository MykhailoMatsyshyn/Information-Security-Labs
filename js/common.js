/* ============================================================
   CryptoLab — Common UI utilities
   ============================================================
   Бібліотеки через CDN (просто підключаємо <script src="...">):
     • highlight.js  — підсвітка коду
     • Chart.js      — графіки/візуалізації
     • CryptoJS      — готові крипто-примітиви
   ============================================================ */

'use strict';

// ── Toast notification ──────────────────────────────────────
function showToast(msg = 'Скопійовано!', duration = 2000) {
  let toast = document.getElementById('cl-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cl-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ── Clipboard ───────────────────────────────────────────────
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('✓ Скопійовано до буфера');
  } catch {
    showToast('Не вдалось скопіювати');
  }
}

function copyFromElement(selector) {
  const el = document.querySelector(selector);
  if (el) copyText(el.textContent.trim());
}

// ── Output rendering ────────────────────────────────────────
/**
 * @param {string}   resultId   — id елемента-результату
 * @param {string}   text       — зашифрований/розшифрований текст
 * @param {string}   [color]    — CSS колір (default: var(--green))
 */
function renderOutput(resultId, text, color = 'var(--green)') {
  const el = document.getElementById(resultId);
  if (!el) return;
  el.innerHTML = `
    <span style="color:${color};word-break:break-all;">${escapeHtml(text)}</span>
    <button class="copy-btn" onclick="copyText('${escapeAttr(text)}')">COPY</button>
  `;
}

function clearOutput(resultId, placeholder = 'Результат з\'явиться тут...') {
  const el = document.getElementById(resultId);
  if (el) el.innerHTML = `<span class="result-empty">${placeholder}</span>`;
}

// ── Steps log rendering ─────────────────────────────────────
/**
 * @param {string}   stepsId  — id елемента .steps-log-body
 * @param {Array<{n:string, t:string, d?:string}>} steps
 */
function renderSteps(stepsId, steps) {
  const el = document.getElementById(stepsId);
  if (!el) return;
  el.innerHTML = steps.map(s => `
    <div class="log-line">
      <span class="log-idx">${s.n}</span>
      <span class="log-text">${s.t}${s.d ? ` — <span class="hl">${escapeHtml(s.d)}</span>` : ''}</span>
    </div>
  `).join('');
}

function clearSteps(stepsId) {
  const el = document.getElementById(stepsId);
  if (el) el.innerHTML = '<div class="log-line"><span class="log-idx">—</span><span class="log-text">Оберіть алгоритм та натисніть «Зашифрувати»</span></div>';
}

// ── Workspace tabs ──────────────────────────────────────────
function initTabs(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const tabs   = container.querySelectorAll('.workspace-tab');
  const panels = container.querySelectorAll('.workspace-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      const panel = container.querySelector(`.workspace-panel[data-panel="${target}"]`);
      if (panel) panel.classList.add('active');
    });
  });

  // Activate first tab by default
  if (tabs[0]) tabs[0].click();
}

// ── Algo-card scroll-to ──────────────────────────────────────
function initAlgoCards() {
  document.querySelectorAll('.algo-card[data-target]').forEach(card => {
    card.addEventListener('click', () => {
      const target = document.getElementById(card.dataset.target);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ── Theory accordion (smooth max-height) ────────────────────
function initTheory() {
  document.querySelectorAll('.theory-header').forEach(header => {
    header.addEventListener('click', () => {
      const body   = header.nextElementSibling;
      const toggle = header.querySelector('.theory-toggle');
      const isOpen = body.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);

      // Force reflow for smooth opening from 0
      if (isOpen) {
        body.style.maxHeight = body.scrollHeight + 'px';
        // After transition ends let CSS class handle it
        body.addEventListener('transitionend', () => {
          if (body.classList.contains('open')) body.style.maxHeight = '';
        }, { once: true });
      } else {
        // Snap to explicit px before collapsing to 0
        body.style.maxHeight = body.scrollHeight + 'px';
        requestAnimationFrame(() => { body.style.maxHeight = '0'; });
        body.addEventListener('transitionend', () => {
          if (!body.classList.contains('open')) body.style.maxHeight = '';
        }, { once: true });
      }
    });
  });
}

// ── Sidebar active link ─────────────────────────────────────
function initSidebarNav() {
  document.querySelectorAll('.sidebar-nav-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const target = document.getElementById(item.dataset.section);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ── Scroll spy ──────────────────────────────────────────────
function initScrollSpy(sectionIds) {
  const items = document.querySelectorAll('.sidebar-nav-item[data-section]');
  if (!items.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        items.forEach(i => i.classList.remove('active'));
        const active = document.querySelector(`.sidebar-nav-item[data-section="${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

// ── Helpers ─────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str).replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

// ── Init all on DOMContentLoaded ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTabs('.cipher-workspace');
  initTheory();
  initAlgoCards();
  initSidebarNav();
});
