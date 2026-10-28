/* MAI explainer runtime: a hand-navigated, deterministic explainer page.

   The page is a pure function of its position. A position is (scene, step); the stage state at that
   position is the fold of the scene's cues from step 0 to the current step. Moving to an adjacent step
   animates (CSS transitions); any other jump applies the state instantly. No Math.random, no Date,
   no network: everything the page shows is inlined by build.py. Navigation is the only input. */
(() => {
  'use strict';
  const SVGNS = 'http://www.w3.org/2000/svg';
  const MAI = (window.MAI = { views: {}, scenes: [], chapters: [], cast: {}, cites: {}, shapes: {}, media: {}, ledger: {}, data: {} });

  // ------------------------------------------------------------------ DOM helpers
  const make = (ns) => (tag, attrs, ...kids) => {
    const n = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
      else if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return n;
  };
  const h = (MAI.h = make(null));
  const s = (MAI.s = make(SVGNS));
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /** Inline markup for dialogue and cards: [[role|text]] colours a phrase by role, **b**, *serif italic*, `code`. */
  MAI.md = (text) =>
    esc(text)
      .replace(/\[\[([a-z0-9-]+)\|(.+?)\]\]/g, '<span class="r r-$1">$2</span>')
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<i>$1</i>')
      .replace(/`(.+?)`/g, '<code>$1</code>');

  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  /** Deep merge of plain objects; arrays and scalars replace. Cues never mutate. */
  const merge = (a, b) => {
    const out = { ...a };
    for (const [k, v] of Object.entries(b || {})) out[k] = isObj(v) && isObj(a?.[k]) ? merge(a[k], v) : v;
    return out;
  };
  MAI.fold = (cues) => cues.reduce((acc, c) => merge(acc, c || {}), {});
  MAI.toggle = (node, cls, on) => node.classList.toggle(cls, !!on);
  MAI.cssPath = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

  // ------------------------------------------------------------------ registration (content files call these)
  MAI.view = (name, def) => { MAI.views[name] = def; };
  MAI.chapter = (ch) => MAI.chapters.push(ch);
  MAI.scene = (sc) => { MAI.scenes.push(sc); return sc; };

  // ------------------------------------------------------------------ ink shapes (asset shape objects → SVG)
  /** Render a shape.json object (strokes, washes, fills) as an <svg> group in ink and role colours. */
  MAI.ink = (shape, { pose, boil = true, cls = '' } = {}) => {
    const g = s('g', { class: `${boil ? 'ink ' : ''}${cls}` });
    const parts = [shape, ...(pose ? [pose] : [])];
    for (const p of parts) for (const w of p.washes || []) g.append(s('path', { d: w.d, class: `wash r-${roleClass(w.role)}`, opacity: w.opacity ?? 0.55, transform: 'translate(2.2 2.8)' }));
    for (const p of parts) for (const d of p.strokes || []) g.append(s('path', { d, class: 'ink-line' }));
    for (const p of parts) for (const d of p.threads || []) g.append(s('path', { d, class: 'thread-line' }));
    for (const p of parts) for (const f of p.fills || []) g.append(s('path', { d: f.d, class: `r-${roleClass(f.role)}` }));
    return g;
  };
  const roleClass = (role) => ({ 'concept-1': 'c1', 'concept-2': 'c2', 'concept-3': 'c3', 'concept-4': 'c4', 'concept-5': 'c5',
    'ink-dark': 'inkdark', 'wash-skin': 'skin', 'wash-cloth': 'cloth' }[role] || role);

  // ------------------------------------------------------------------ clippings (figures, scans, photos) with credit
  MAI.clip = (id, { w = 40, x = 50, y = 50, rot = 0, caption = true } = {}) => {
    const a = MAI.ledger[id];
    if (!a) throw new Error(`unknown media ${id}`);
    const img = h('img', { src: MAI.media[id], alt: a.title, draggable: 'false' });
    const frame = h('div', { class: 'frame' }, img);
    const fig = h('figure', { class: `clip fx ${a.kind}`, 'data-id': id, style: { width: `${w}%`, left: `${x}%`, top: `${y}%` } }, frame,
      caption ? h('figcaption', { html: `<b>${esc(a.title)}</b> · ${esc(shortCredit(a))} · ${esc(a.licence)}` }) : null);
    fig.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
    fig._img = img; fig._frame = frame; fig._aspect = a.size[1] / a.size[0];
    return fig;
  };
  const shortCredit = (MAI.shortCredit = (a) => a.credit.replace(/, “.*?”, /, ', ').replace(/ \(arXiv:[^)]+\)/, ''));

  /** Highlight a box (fractions of the image) on a clipping; null removes it. Optionally zoom the image so the box fills the frame. */
  MAI.mark = (fig, box, { zoom = false } = {}) => {
    let m = fig._frame.querySelector('.mark');
    if (!box) { if (m) m.classList.add('hide'); fig._img.style.transform = ''; return; }
    if (!m) { m = h('div', { class: 'mark hide' }); fig._frame.append(m); }
    const [x0, y0, x1, y1] = box;
    if (zoom) {
      const k = Math.min(1 / (x1 - x0), 1 / (y1 - y0)) * 0.92;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const tx = 0.5 - cx * k, ty = 0.5 - cy * k;
      fig._img.style.transform = `translate(${(tx * 100).toFixed(2)}%, ${(ty * 100).toFixed(2)}%) scale(${k.toFixed(3)})`;
      Object.assign(m.style, { left: `${(x0 * k + tx) * 100}%`, top: `${(y0 * k + ty) * 100}%`, width: `${(x1 - x0) * k * 100}%`, height: `${(y1 - y0) * k * 100}%` });
    } else {
      fig._img.style.transform = '';
      Object.assign(m.style, { left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${(x1 - x0) * 100}%`, height: `${(y1 - y0) * 100}%` });
    }
    m.classList.remove('hide');
  };

  // ------------------------------------------------------------------ ARC-style grids
  /** An ARC grid as SVG cells; returns a group with .set(grid) to recolour cells (fill transitions animate). */
  MAI.grid = (grid, { x = 0, y = 0, cell = 14, digits = false } = {}) => {
    const g = s('g', { class: 'grid fx', transform: `translate(${x} ${y})` });
    const rows = grid.length, cols = grid[0].length;
    g.cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const rect = s('rect', { x: c * cell, y: r * cell, width: cell, height: cell, class: `cell fx c${grid[r][c]}` });
      g.append(rect); g.cells.push(rect);
    }
    g.append(s('rect', { x: 0, y: 0, width: cols * cell, height: rows * cell, class: 'gframe' }));
    g.w = cols * cell; g.h = rows * cell; g.rows = rows; g.cols = cols; g.cell = cell;
    g.set = (next, delays) => {
      next.forEach((row, r) => row.forEach((v, c) => {
        const rect = g.cells[r * cols + c];
        rect.setAttribute('class', `cell fx c${v}`);
        rect.style.transitionDelay = delays ? `${delays[r * cols + c] || 0}ms` : '';
      }));
    };
    g.marks = (cells) => {
      g.querySelectorAll('.cmark').forEach((m) => m.remove());
      for (const [r, c] of cells || []) g.append(s('rect', { x: c * cell + 1, y: r * cell + 1, width: cell - 2, height: cell - 2, class: 'cmark' }));
    };
    if (digits) {
      g.digits = s('g', { class: 'fx hide' });
      grid.forEach((row, r) => row.forEach((v, c) => g.digits.append(s('text', { x: c * cell + cell / 2, y: r * cell + cell / 2 + 0.5, class: 'digit', text: v }))));
      g.append(g.digits);
    }
    return g;
  };

  // ------------------------------------------------------------------ the runtime
  let flat = [], cur = null, layer = null, timers = [], els = {};

  MAI.start = () => {
    MAI.scenes.forEach((sc, si) => sc.steps.forEach((st, k) => flat.push({ si, k })));
    buildChrome();
    const target = fromHash();
    go(target ?? 0, { instant: true });
    window.addEventListener('hashchange', () => { const t = fromHash(); if (t != null && t !== cur) go(t, { instant: true }); });
    document.addEventListener('keydown', onKey);
    let x0 = null;
    els.stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    els.stage.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.querySelectorAll('#boil animate').forEach((a) => a.remove());
  };

  function fromHash() {
    // #scene-id--3 (step 3); the older #scene-id/3 still parses. Plain #name hashes survive every host.
    const m = decodeURIComponent(location.hash.slice(1)).match(/^([a-z0-9]+(?:-[a-z0-9]+)*)(?:(?:--|\/)(\d+))?$/i);
    if (!m) return null;
    const si = MAI.scenes.findIndex((sc) => sc.id === m[1]);
    if (si < 0) return null;
    const k = Math.min(Math.max(1, +(m[2] || 1)), MAI.scenes[si].steps.length) - 1;
    return flat.findIndex((f) => f.si === si && f.k === k);
  }

  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const fwd = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'], back = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'];
    if (fwd.includes(e.key)) { e.preventDefault(); step(e.shiftKey && e.key === ' ' ? -1 : 1); }
    else if (back.includes(e.key)) { e.preventDefault(); step(-1); }
    else if (e.key === 'Home') go(0, { instant: true });
    else if (e.key === 'End') go(flat.length - 1, { instant: true });
  }
  const step = (d) => { const t = cur + d; if (t >= 0 && t < flat.length) go(t); };
  MAI.step = step;

  function buildChrome() {
    const app = document.getElementById('app');
    els.chapters = h('nav', { class: 'chapters', 'aria-label': 'Chapters' });
    for (const ch of MAI.chapters.filter((c) => c.nav)) {
      const first = MAI.scenes.findIndex((sc) => sc.chapter === ch.id);
      const b = h('button', { 'data-ch': ch.id, text: ch.nav, title: ch.title });
      b.addEventListener('click', () => go(flat.findIndex((f) => f.si === first), { instant: true }));
      els.chapters.append(b);
    }
    els.thread = s('svg', { class: 'thread', viewBox: '0 0 1000 16', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const d = 'M0 9 C 120 2, 200 15, 330 8 S 560 3, 680 9 S 880 14, 1000 7';
    els.thread.append(s('path', { d, class: 'track' }), (els.threadLine = s('path', { d, class: 'line', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1, 'vector-effect': 'non-scaling-stroke' })));
    els.knots = MAI.chapters.filter((c) => c.nav).map((ch) => {
      const first = flat.findIndex((f) => MAI.scenes[f.si].chapter === ch.id);
      const k = s('circle', { r: 3.2, cy: 8.5, cx: (1000 * first) / (flat.length - 1), class: 'knot', 'vector-effect': 'non-scaling-stroke' });
      k.dataset.at = first; els.thread.append(k); return k;
    });
    app.append(
      h('header', { class: 'top' }, h('div', { class: 'brand', text: MAI.meta.title }), els.chapters, els.thread),
      h('main', { class: 'room' },
        (els.stage = h('section', { class: 'stage', 'aria-label': 'Stage' })),
        h('aside', { class: 'talk', 'aria-label': 'Conversation' }, (els.talk = h('div', { class: 'scroll', 'aria-live': 'polite' })))),
      h('footer', { class: 'controls' },
        (els.prev = h('button', { class: 'nav prev', 'aria-label': 'Back', html: arrow(-1) })),
        (els.next = h('button', { class: 'nav next', 'aria-label': 'Next', html: arrow(1) })),
        (els.dots = h('div', { class: 'dots', 'aria-hidden': 'true' })),
        (els.where = h('div', { class: 'where' })),
        h('div', { class: 'hint', html: '<kbd>←</kbd> <kbd>→</kbd> or <kbd>space</kbd> to move' })));
    els.prev.addEventListener('click', () => step(-1));
    els.next.addEventListener('click', () => step(1));
  }
  const arrow = (d) => `<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="${d > 0 ? 'M4 9h10M10 4l5 5-5 5' : 'M14 9H4M8 4L3 9l5 5'}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function go(i, { instant = false } = {}) {
    i = Math.max(0, Math.min(flat.length - 1, i));
    const prev = cur;
    cur = i;
    const { si, k } = flat[i];
    const sc = MAI.scenes[si];
    const back = prev != null && i < prev;
    const adjacent = prev != null && Math.abs(i - prev) === 1;
    const fast = instant || !adjacent;
    const same = layer && layer.si === si;
    clearTimers();

    const ch = MAI.chapters.find((c) => c.id === sc.chapter);
    MAI.toggle(document.body, 'night', ch && ch.mode === 'night');

    if (!same) enterScene(si, k, { fast, back });
    else applyStep(layer, sc, k, fast);
    renderTalk(sc, k, { fast, same });
    renderChrome(sc, k, i);
    const hash = `#${sc.id}--${k + 1}`;
    if (location.hash !== hash) try { history.replaceState(null, '', hash); } catch (e) { /* sandboxed frames may refuse; position still works */ }
  }
  MAI.go = go;

  function enterScene(si, k, { fast, back }) {
    const sc = MAI.scenes[si];
    const view = MAI.views[sc.view];
    if (!view) throw new Error(`scene ${sc.id}: unknown view ${sc.view}`);
    const node = h('div', { class: `layer pre${back ? ' back' : ''}` });
    const canvas = h('div', { class: 'canvas' });
    const svg = s('svg', { class: 'view', viewBox: '0 0 1000 620', 'aria-hidden': 'true' });
    const html = h('div', { class: 'html' });
    const head = h('div', { class: 'head' });
    const cite = h('div', { class: 'cite' });
    canvas.append(svg, html, head, cite);
    node.append(canvas);
    const ctx = { svg, html, canvas, props: sc.props || {}, scene: sc };
    const lay = { node, ctx, si, inst: null, head, cite, notes: {} };
    els.stage.append(node);
    lay.inst = view.build(ctx);

    const old = layer;
    layer = lay;
    // Arriving forward at step 0 plays the first cue from an empty state; any other arrival lands instantly.
    const animateIn = !fast && k === 0 && !back;
    node.classList.add('instant');
    applyStep(lay, sc, animateIn ? -1 : k, true);
    void node.offsetWidth; // commit the instant state before transitions are re-enabled
    node.classList.remove('instant');
    requestAnimationFrame(() => {
      node.classList.remove('pre');
      if (animateIn) applyStep(lay, sc, k, false);
    });
    if (old) {
      old.node.classList.add('out');
      if (back) old.node.classList.add('back');
      setTimeout(() => old.node.remove(), 900);
    }
  }

  function applyStep(lay, sc, k, fast) {
    const cues = k < 0 ? [] : sc.steps.slice(0, k + 1).map((st) => st.cue || {});
    const state = MAI.fold(cues);
    if (fast) lay.node.classList.add('instant');
    MAI.views[sc.view].apply(lay.inst, state, { ...lay.ctx, fast, k });
    const st = k < 0 ? {} : sc.steps[k];
    setHead(lay, k < 0 ? null : (st.head ?? lastDefined(sc, k, 'head')), sc);
    setCite(lay, k < 0 ? null : (st.cite ?? lastDefined(sc, k, 'cite')));
    applyNotes(lay, state.notes || {});
    if (fast) { void lay.node.offsetWidth; lay.node.classList.remove('instant'); }
  }
  const lastDefined = (sc, k, key) => { for (let j = k; j >= 0; j--) if (sc.steps[j][key] !== undefined) return sc.steps[j][key]; return sc[key] ?? null; };

  function setHead(lay, head, sc) {
    const text = head == null ? '' : head;
    const kicker = sc.kicker ? `<span class="kicker">${esc(sc.kicker)}</span>` : '';
    const html = text || kicker ? `${kicker}${MAI.md(text)}` : '';
    if (lay.head.innerHTML !== html) lay.head.innerHTML = html;
  }
  function setCite(lay, key) {
    let text = '';
    if (key) {
      const [id, where] = Array.isArray(key) ? key : [key, null];
      const c = MAI.cites[id];
      if (!c) throw new Error(`unknown cite ${id}`);
      text = `${c.short}${where ? `, ${where}` : ''}`;
    }
    MAI.toggle(lay.cite, 'fade', !text);
    if (text) lay.cite.textContent = text;
  }
  /** Handwritten notes (one per id) that any view can carry: {id: {x, y, text, rot, role}} in % of the canvas. */
  function applyNotes(lay, notes) {
    for (const [id, n] of Object.entries(notes)) {
      let el = lay.notes[id];
      if (!el) { el = lay.notes[id] = h('div', { class: 'note fx hide' }); lay.ctx.html.append(el); }
      if (!n) { el.classList.add('hide'); continue; }
      el.textContent = n.text;
      el.className = `note fx${n.role === 'emph' ? ' emph' : ''}`;
      Object.assign(el.style, { left: `${n.x}%`, top: `${n.y}%`, transform: `translateY(-50%) rotate(${n.rot ?? -3}deg)` });
    }
    for (const [id, el] of Object.entries(lay.notes)) if (!(id in notes)) el.classList.add('hide');
  }

  // ------------------------------------------------------------------ conversation panel
  function renderTalk(sc, k, { fast, same }) {
    const box = els.talk;
    if (!same) {
      box.replaceChildren(h('div', { class: 'scene-title', text: sc.title || '' }));
    }
    for (const n of [...box.querySelectorAll('.line')]) if (+n.dataset.step > k) n.remove();
    let delay = 120;
    for (let j = 0; j <= k; j++) {
      const lines = sc.steps[j].say || [];
      lines.forEach(([who, text], li) => {
        let n = box.querySelector(`.line[data-step="${j}"][data-li="${li}"]`);
        if (!n) {
          n = lineNode(who, text, j, li);
          box.append(n);
          if (j === k && !fast) {
            const at = delay;
            timers.push(setTimeout(() => { n.classList.add('in'); scrollTalk(); }, at));
            delay += Math.min(2600, 650 + 38 * text.split(/\s+/).length);
          } else n.classList.add('in');
        }
        MAI.toggle(n, 'old', j < k);
      });
    }
    scrollTalk(fast);
  }
  const scrollTalk = (fast) => els.talk.scrollTo({ top: els.talk.scrollHeight, behavior: fast ? 'auto' : 'smooth' });
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
    els.talk && els.talk.querySelectorAll('.line:not(.in)').forEach((n) => n.classList.add('in'));
  }
  function lineNode(who, text, j, li) {
    const sp = MAI.cast[who];
    if (!sp) throw new Error(`unknown speaker ${who}`);
    return h('div', { class: `line ${who}`, 'data-step': j, 'data-li': li },
      h('div', { class: 'avatar', 'aria-hidden': 'true' }, sp.avatar()),
      h('div', {}, h('div', { class: 'who', text: sp.name }), h('div', { class: 'bubble', html: MAI.md(text) })));
  }

  function renderChrome(sc, k, i) {
    els.prev.disabled = i === 0;
    els.next.disabled = i === flat.length - 1;
    els.dots.replaceChildren(...sc.steps.map((_, j) => h('span', { class: `dot${j < k ? ' done' : j === k ? ' on' : ''}` })));
    const ch = MAI.chapters.find((c) => c.id === sc.chapter);
    els.where.textContent = `${ch ? ch.title : ''} · ${i + 1} / ${flat.length}`;
    const order = MAI.chapters.map((c) => c.id);
    const navOf = (id) => { // the nav chapter a chapter belongs to (chapters without nav fold into the previous one)
      let idx = order.indexOf(id);
      while (idx > 0 && !MAI.chapters[idx].nav) idx--;
      return MAI.chapters[idx].id;
    };
    const here = navOf(sc.chapter);
    let seen = false;
    for (const b of els.chapters.children) {
      const on = b.dataset.ch === here;
      MAI.toggle(b, 'on', on);
      MAI.toggle(b, 'done', !seen && !on);
      if (on) seen = true;
    }
    els.threadLine.setAttribute('stroke-dashoffset', String(1 - i / (flat.length - 1)));
    els.knots.forEach((kn) => MAI.toggle(kn, 'done', +kn.dataset.at <= i));
  }

  MAI.clearTimers = clearTimers;
})();
