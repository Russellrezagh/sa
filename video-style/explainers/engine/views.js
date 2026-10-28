/* Generic MAI explainer views. A view is { build(ctx) → inst, apply(inst, state, ctx) }.
   build creates every element once; apply maps a folded state onto classes, attributes and transforms,
   and CSS transitions do the animating. apply must be idempotent: the same state gives the same picture. */
(() => {
  'use strict';
  const { h, s, toggle } = MAI;
  const pct = (v, d = 0) => `${(v * 100).toFixed(d)}%`;
  const ids = (v) => new Set(Array.isArray(v) ? v : v ? [v] : []);

  // ================================================================== strings: letter-string analogies
  // props.rows: [{id, l, r, y, label}] with space-separated tokens ("a b c"); props.strip: {items, y, wall}
  const TILE = { w: 58, h: 70, gap: 10 };
  function tileRow(tokens, cx, y, size) {
    const w = size.w, gap = size.gap, n = tokens.length, x0 = cx - (n * w + (n - 1) * gap) / 2;
    const g = s('g', {});
    g.tiles = tokens.map((t, i) => {
      const x = x0 + i * (w + gap) + w / 2;
      const tile = s('g', { class: 'tile fx hide', style: { transform: `translate(${x}px, ${y + 12}px)` } },
        s('rect', { x: -w / 2, y: -size.h / 2, width: w, height: size.h, rx: 8 }),
        s('text', { x: 0, y: 1, text: t, style: { fontSize: `${size.font}px` } }));
      tile.cx = x; tile.cy = y; tile.i = i;
      g.append(tile);
      return tile;
    });
    return g;
  }
  const sizeFor = (n, max = 380) => {
    const w = Math.min(TILE.w, (max - (n - 1) * TILE.gap) / n);
    return { w, h: Math.min(TILE.h, w * 1.2), gap: Math.min(TILE.gap, w * 0.18), font: Math.min(40, w * 0.68) };
  };
  const showTiles = (row, on, delay = 0) => row.tiles.forEach((t, i) => {
    toggle(t, 'hide', !on);
    t.style.transform = `translate(${t.cx}px, ${t.cy + (on ? 0 : 12)}px)`;
    t.style.transitionDelay = on ? `${delay + i * 70}ms` : '0ms';
  });

  MAI.view('strings', {
    build(ctx) {
      const { svg, props } = ctx;
      const P = { xl: props.xl ?? 280, xr: props.xr ?? 720, max: props.max ?? 330 };
      const inst = { P, rows: {}, svg, layers: {} };
      inst.layers.under = s('g', {});
      inst.layers.tiles = s('g', {});
      inst.layers.over = s('g', {});
      svg.append(inst.layers.under, inst.layers.tiles, inst.layers.over);
      for (const r of props.rows) {
        const L = r.l.split(' ');
        const size = sizeFor(Math.max(L.length, ...(r.alts || [r.r || '']).map((x) => x.split(' ').length)), P.max);
        const row = { def: r, size, y: r.y, right: null, rightText: null };
        row.left = tileRow(L, P.xl, r.y, size);
        row.arrow = s('g', { class: 'fx hide' }, s('path', { d: `M${500 - 38} ${r.y} H ${500 + 30}`, class: 'ink-line' }), s('path', { d: `M${500 + 20} ${r.y - 9} L ${500 + 32} ${r.y} L ${500 + 20} ${r.y + 9}`, class: 'ink-line' }));
        row.q = tileRow(['?'], P.xr, r.y, size);
        row.q.tiles[0].classList.add('ghost');
        row.label = s('text', { x: 36, y: r.y + 6, class: 'tag soft fx hide', text: r.label || '' });
        row.strike = s('path', { d: '', class: 'thread-line fx hide', style: { stroke: 'var(--emph)' } });
        inst.layers.tiles.append(row.left, row.q, row.arrow, row.label);
        inst.layers.over.append(row.strike);
        inst.rows[r.id] = row;
      }
      inst.marks = {}; // keyed overlays (arrows, groups, walls, bridges, brackets)
      if (props.strip) {
        const items = props.strip.items.split(' ');
        const sw = Math.min(30, 880 / items.length - 4);
        const size = { w: sw, h: sw * 1.15, gap: 4, font: sw * 0.62 };
        inst.strip = tileRow(items, 500, props.strip.y, size);
        inst.strip.items = items;
        inst.strip.tiles.forEach((t) => t.classList.add('mini'));
        const last = inst.strip.tiles[items.length - 1];
        inst.strip.wall = s('g', { class: 'fx hide' },
          s('path', { d: `M${last.cx + sw / 2 + 9} ${props.strip.y - 26} V ${props.strip.y + 26}`, class: 'thread-line', style: { stroke: 'var(--emph)', strokeWidth: 5 } }),
          s('text', { x: last.cx + sw / 2 + 18, y: props.strip.y + 5, class: 'tag r-emph', text: props.strip.wallLabel || 'end' }));
        inst.strip.hop = s('path', { class: 'thread-line draw fx', pathLength: 1, d: '' });
        inst.strip.hopLabel = s('text', { class: 'tag r-thread fx hide', 'text-anchor': 'middle', text: '' });
        inst.layers.tiles.append(inst.strip, inst.strip.wall);
        inst.layers.over.append(inst.strip.hop, inst.strip.hopLabel);
      }
      inst.relation = s('g', { class: 'fx hide' },
        s('rect', { x: -10, y: -17, height: 32, rx: 16, class: 'r-bg', style: { stroke: 'var(--thread)', strokeWidth: 2 } }),
        s('text', { x: 6, y: 5, class: 'tag r-thread', text: '' }));
      inst.layers.over.append(inst.relation);
      return inst;
    },

    apply(inst, st, ctx) {
      const { P } = inst;
      const vis = st.rows || {};
      for (const [id, row] of Object.entries(inst.rows)) {
        const mode = vis[id] || '';
        showTiles(row.left, mode.includes('l'));
        toggle(row.arrow, 'hide', !mode.includes('l'));
        toggle(row.label, 'hide', !mode.includes('l') || !row.def.label);
        const rText = (st.r && st.r[id]) || row.def.r;
        const showR = mode.includes('r');
        if (rText && rText !== row.rightText) {
          if (row.right) { const old = row.right; showTiles(old, false); setTimeout(() => old.remove(), ctx.fast ? 0 : 700); }
          row.right = tileRow(rText.split(' '), P.xr, row.y, row.size);
          row.rightText = rText;
          inst.layers.tiles.append(row.right);
          void row.right.getBoundingClientRect();
        }
        if (row.right) showTiles(row.right, showR, showR && !ctx.fast ? 250 : 0);
        showTiles(row.q, mode.includes('?') && !showR);
        toggle(row.left, 'dim', st.dim && st.dim[id]);
        row.left.style.opacity = st.dim && st.dim[id] ? 0.35 : '';
        if (row.right) row.right.style.opacity = st.dim && st.dim[id] ? 0.35 : '';
        // highlights
        const hl = (st.hl && st.hl[id]) || {}, bad = (st.bad && st.bad[id]) || {};
        row.left.tiles.forEach((t) => { toggle(t, 'hl', (hl.l || []).includes(t.i)); toggle(t, 'bad', (bad.l || []).includes(t.i)); });
        if (row.right) row.right.tiles.forEach((t) => { toggle(t, 'hl', (hl.r || []).includes(t.i)); toggle(t, 'bad', (bad.r || []).includes(t.i)); });
        // strike-through of the right string
        const strike = st.strike && st.strike[id];
        if (row.right && strike) {
          const a = row.right.tiles[0], b = row.right.tiles[row.right.tiles.length - 1];
          row.strike.setAttribute('d', `M${a.cx - row.size.w / 2 - 6} ${row.y + 4} L ${b.cx + row.size.w / 2 + 6} ${row.y - 4}`);
        }
        toggle(row.strike, 'hide', !(row.right && strike && showR));
      }
      // keyed overlays
      const want = new Set();
      for (const [key, m] of Object.entries(st.change || {})) if (m) { want.add(`change:${key}`); changeArrow(inst, `change:${key}`, m); }
      for (const [key, m] of Object.entries(st.groups || {})) if (m) { want.add(`group:${key}`); groupBox(inst, `group:${key}`, m); }
      for (const [key, m] of Object.entries(st.walls || {})) if (m) { want.add(`wall:${key}`); wallMark(inst, `wall:${key}`, m); }
      for (const [key, m] of Object.entries(st.bridges || {})) if (m) { want.add(`bridge:${key}`); bridge(inst, `bridge:${key}`, m); }
      for (const [key, m] of Object.entries(st.brackets || {})) if (m) { want.add(`bracket:${key}`); bracket(inst, `bracket:${key}`, m); }
      for (const [key, node] of Object.entries(inst.marks)) {
        const on = want.has(key);
        toggle(node, 'hide', !on);
        node.querySelectorAll('.draw').forEach((p) => toggle(p, 'on', on));
      }
      // relation tag: one object that travels between rows
      const rel = st.relation;
      if (rel) {
        const row = inst.rows[rel.row];
        const text = inst.relation.querySelector('text');
        text.textContent = rel.text;
        const w = Math.max(80, rel.text.length * 9.2 + 18);
        inst.relation.querySelector('rect').setAttribute('width', w);
        const y = row.y + (rel.dy ?? -row.size.h / 2 - 34);
        inst.relation.style.transform = `translate(${(rel.x ?? 500) - w / 2 + 4}px, ${y}px)`;
      }
      toggle(inst.relation, 'hide', !rel);
      // alphabet strip
      if (inst.strip) {
        const sp = st.strip || {};
        showTiles(inst.strip, !!sp.show);
        const marks = new Set(sp.mark || []), bad = new Set(sp.bad || []);
        inst.strip.tiles.forEach((t) => { toggle(t, 'hl', marks.has(inst.strip.items[t.i])); toggle(t, 'bad', bad.has(inst.strip.items[t.i])); });
        toggle(inst.strip.wall, 'hide', !(sp.show && sp.wall));
        if (sp.hop) {
          const a = inst.strip.tiles[inst.strip.items.indexOf(sp.hop[0])], b = inst.strip.tiles[inst.strip.items.indexOf(sp.hop[1])];
          const y = a.cy - a.querySelector('rect').getAttribute('height') / 2 - 4, lift = 30 + Math.abs(b.cx - a.cx) * 0.12;
          inst.strip.hop.setAttribute('d', `M${a.cx} ${y} C ${a.cx} ${y - lift}, ${b.cx} ${y - lift}, ${b.cx} ${y - 2}`);
          inst.strip.hopLabel.textContent = sp.hop[2] || '';
          inst.strip.hopLabel.setAttribute('x', (a.cx + b.cx) / 2);
          inst.strip.hopLabel.setAttribute('y', y - lift + 2);
        }
        toggle(inst.strip.hop, 'on', !!(sp.show && sp.hop));
        toggle(inst.strip.hopLabel, 'hide', !(sp.show && sp.hop && sp.hop[2]));
      }
    },
  });

  /** Keyed overlay: rebuilt only when its spec changes, so an arrow drawn on one step is not redrawn on the next. */
  function mark(inst, key, spec, make) {
    const sig = JSON.stringify(spec);
    const old = inst.marks[key];
    if (old && old._sig === sig) return old;
    if (old) old.remove();
    const g = make();
    g._sig = sig;
    g.classList.add('fx', 'hide');
    inst.layers.over.append(g);
    inst.marks[key] = g;
    void g.getBoundingClientRect();
    return g;
  }
  const tileOf = (inst, row, side, i) => {
    const r = inst.rows[row];
    const g = side === 'l' ? r.left : side === 'q' ? r.q : r.right;
    return g.tiles[i < 0 ? g.tiles.length + i : i];
  };
  function changeArrow(inst, key, m) {
    const a = tileOf(inst, m.row, 'l', m.i), b = tileOf(inst, m.row, 'r', m.j ?? m.i), size = inst.rows[m.row].size;
    const dir = m.below ? -1 : 1; // below: the arc runs under the tiles
    const y = a.cy - dir * (size.h / 2 + 6), lift = (m.lift ?? 64) * dir;
    mark(inst, key, m, () => s('g', {},
      s('path', { d: `M${a.cx} ${y} C ${a.cx} ${y - lift}, ${b.cx} ${y - lift}, ${b.cx} ${y - 3 * dir}`, class: 'thread-line draw fx', pathLength: 1, style: m.role ? { stroke: `var(--${m.role})` } : {} }),
      s('path', { d: `M${b.cx - 7} ${y - 12 * dir} L ${b.cx} ${y - 2 * dir} L ${b.cx + 7} ${y - 12 * dir}`, class: 'thread-line', style: m.role ? { stroke: `var(--${m.role})` } : {} }),
      m.label ? s('text', { x: (a.cx + b.cx) / 2, y: y - lift * 0.78 - 6 * dir + (dir < 0 ? 10 : 0), 'text-anchor': 'middle', class: `tag ${m.role ? `r-${m.role}` : 'r-thread'}`, text: m.label }) : null));
  }
  function groupBox(inst, key, m) {
    const row = inst.rows[m.row], size = row.size;
    mark(inst, key, m, () => s('g', {}, ...m.spans.map(([i, j]) => {
      const a = tileOf(inst, m.row, m.side || 'l', i), b = tileOf(inst, m.row, m.side || 'l', j);
      return s('rect', { x: a.cx - size.w / 2 - 5, y: row.y - size.h / 2 - 6, width: b.cx - a.cx + size.w + 10, height: size.h + 12, rx: 14,
        fill: 'none', class: `s-${m.role || 'c5'}`, 'stroke-width': 3, 'stroke-dasharray': m.dashed ? '6 5' : null });
    }), m.label ? s('text', { x: inst.P[m.side === 'r' ? 'xr' : 'xl'], y: row.y + size.h / 2 + 30, 'text-anchor': 'middle', class: `tag r-${m.role || 'c5'}`, text: m.label }) : null));
  }
  function wallMark(inst, key, m) {
    const a = tileOf(inst, m.row, m.side || 'l', m.i), size = inst.rows[m.row].size;
    const x = a.cx + size.w / 2 + 9;
    mark(inst, key, m, () => s('g', {},
      s('path', { d: `M${x} ${a.cy - size.h / 2 - 8} V ${a.cy + size.h / 2 + 8}`, class: 'thread-line', style: { stroke: 'var(--emph)', strokeWidth: 6 } }),
      s('text', { x, y: a.cy + size.h / 2 + 30, 'text-anchor': 'middle', class: 'tag r-emph', text: m.label || '' })));
  }
  function bridge(inst, key, m) {
    const a = tileOf(inst, ...m.a), b = tileOf(inst, ...m.b), size = inst.rows[m.a[0]].size;
    const y1 = a.cy + size.h / 2 + 4, y2 = b.cy - size.h / 2 - 4;
    mark(inst, key, m, () => s('g', {},
      s('path', { d: `M${a.cx} ${y1} C ${a.cx} ${(y1 + y2) / 2}, ${b.cx} ${(y1 + y2) / 2}, ${b.cx} ${y2}`, class: `thread-line draw fx`, pathLength: 1, 'stroke-dasharray': null,
        style: { stroke: `var(--${m.role || 'c1'})`, strokeWidth: 2.4 } }),
      m.label ? s('text', { x: (a.cx + b.cx) / 2 + (m.dx ?? 8), y: (y1 + y2) / 2 + 4, class: `tag r-${m.role || 'c1'}`, text: m.label }) : null));
  }
  function bracket(inst, key, m) {
    const r0 = inst.rows[m.rows[0]], r1 = inst.rows[m.rows[1]];
    const x = m.x ?? 930, y0 = r0.y - r0.size.h / 2, y1 = r1.y + r1.size.h / 2;
    mark(inst, key, m, () => s('g', {},
      s('path', { d: `M${x - 10} ${y0} H ${x} V ${y1} H ${x - 10}`, class: 'ink-line', style: { stroke: `var(--${m.role || 'ink'})` } }),
      s('text', { x: x + 10, y: (y0 + y1) / 2 + 5, class: `tag r-${m.role || 'ink'}`, text: m.label })));
  }

  // ================================================================== figure: clippings that move, mark and zoom
  // props.items: {mediaId: {x, y, w, rot}} in % of the canvas.  cue: show, at, mark, zoom
  MAI.view('figure', {
    build(ctx) {
      const inst = { figs: {} };
      for (const [id, p] of Object.entries(ctx.props.items)) {
        const fig = MAI.clip(id, p);
        fig.classList.add('hide');
        fig._home = p;
        ctx.html.append(fig);
        inst.figs[id] = fig;
      }
      return inst;
    },
    apply(inst, st) {
      const show = ids(st.show);
      for (const [id, fig] of Object.entries(inst.figs)) {
        const p = { ...fig._home, ...((st.at || {})[id] || {}) };
        const on = show.has(id);
        toggle(fig, 'hide', !on);
        Object.assign(fig.style, { width: `${p.w}%`, left: `${p.x}%`, top: `${p.y}%`, zIndex: p.z ?? '' });
        fig.style.transform = `translate(-50%, ${on ? '-50%' : '-46%'}) rotate(${p.rot ?? 0}deg) scale(${p.scale ?? 1})`;
        const zoom = (st.zoom || {})[id], box = (st.mark || {})[id];
        MAI.mark(fig, zoom || box || null, { zoom: !!zoom });
      }
    },
  });

  // ================================================================== cards: positioned text objects
  // props.items: [{id, kind, x, y, w, k, title, body, role, icon, anchor}]  cue: show, hl, dim, at, text
  MAI.view('cards', {
    build(ctx) {
      const inst = { cards: {} };
      for (const it of ctx.props.items) {
        const card = h('div', { class: `card fx hide ${it.kind || ''} ${it.role ? `role-${it.role}` : ''}` });
        card._it = it;
        fillCard(card, it, it.body);
        ctx.html.append(card);
        inst.cards[it.id] = card;
      }
      return inst;
    },
    apply(inst, st, ctx) {
      const show = ids(st.show), hl = ids(st.hl), dim = ids(st.dim);
      let n = 0;
      for (const [id, card] of Object.entries(inst.cards)) {
        const it = { ...card._it, ...((st.at || {})[id] || {}) };
        const on = show.has(id);
        if (st.text && st.text[id] != null && card._body !== st.text[id]) fillCard(card, it, st.text[id]);
        toggle(card, 'hide', !on);
        toggle(card, 'hl', hl.has(id));
        toggle(card, 'dim', dim.has(id));
        const tl = it.anchor === 'tl';
        Object.assign(card.style, { left: `${it.x}%`, top: `${it.y}%`, width: it.w ? `${it.w}%` : '', textAlign: it.align || '' });
        card.style.transform = `${tl ? '' : 'translate(-50%, -50%) '}translateY(${on ? 0 : 1.2}cqw) rotate(${it.rot ?? 0}deg)`;
        card.style.transitionDelay = on && !ctx.fast && !card._was ? `${(n++) * 90}ms` : '0ms';
        card._was = on;
      }
    },
  });
  function fillCard(card, it, body) {
    card._body = body;
    card.replaceChildren();
    if (it.icon) {
      const shape = MAI.shapes[it.icon].shape;
      const [x, y, w, hh] = shape.viewBox;
      const svg = s('svg', { viewBox: `${x} ${y} ${w} ${hh}`, style: { width: `${it.iconW || 5}cqw`, float: it.iconSide || 'left', marginRight: '1cqw', overflow: 'visible' } }, MAI.ink(shape));
      card.append(svg);
    }
    if (it.k) card.append(h('span', { class: 'k', text: it.k }));
    if (it.title) card.append(h('h3', { html: MAI.md(it.title) }));
    if (body) card.append(h('div', { html: it.kind === 'code' ? body.replace(/&/g, '&amp;').replace(/</g, '&lt;') : MAI.md(body) }));
  }

  // ================================================================== lines: a slope chart across categories
  // props: {cats, series:[{name, role, values, dashed, group}], box:[x,y,w,h], y0, y1, ticks}  cue: upto, focus (group), hl
  MAI.view('lines', {
    build(ctx) {
      const { svg, props } = ctx;
      const [bx, by, bw, bh] = props.box || [150, 90, 560, 430];
      const X = (i) => bx + (bw * i) / (props.cats.length - 1);
      const Y = (v) => by + bh - ((v - (props.y0 ?? 0)) / ((props.y1 ?? 1) - (props.y0 ?? 0))) * bh;
      const inst = { X, Y, series: [], props };
      const axis = s('g', { class: 'fx' });
      for (const t of props.ticks || [0, 0.25, 0.5, 0.75, 1]) {
        axis.append(s('path', { d: `M${bx - 10} ${Y(t)} H ${bx + bw + 10}`, class: 'ink-line', style: { strokeWidth: 0.8, opacity: 0.25 } }),
          s('text', { x: bx - 22, y: Y(t) + 4, 'text-anchor': 'end', class: 'mono soft', style: { fontSize: '13px' }, text: `${Math.round(t * 100)}%` }));
      }
      inst.cats = props.cats.map((c, i) => {
        const t = s('text', { x: X(i), y: by + bh + 38, 'text-anchor': 'middle', class: 'serif fx hide', style: { fontSize: '26px' }, text: c });
        axis.append(t, s('path', { d: `M${X(i)} ${by - 6} V ${by + bh + 8}`, class: 'ink-line', style: { strokeWidth: 0.8, opacity: 0.2 } }));
        return t;
      });
      if (props.yLabel) axis.append(s('text', { x: bx - 70, y: by - 26, class: 'tag soft', text: props.yLabel }));
      svg.append(axis);
      for (const ser of props.series) {
        const g = s('g', { class: 'fx' });
        const segs = ser.values.slice(1).map((v, i) => s('path', { d: `M${X(i)} ${Y(ser.values[i])} L ${X(i + 1)} ${Y(v)}`, pathLength: 1,
          class: `thread-line draw fx s-${ser.role}`, style: { strokeWidth: 3.2, ...(ser.dashed ? { strokeDasharray: '1', strokeWidth: 3.2 } : {}) } }));
        const dots = ser.values.map((v, i) => s('circle', { cx: X(i), cy: Y(v), r: 6.5, class: `fx hide r-${ser.role}`, style: ser.hollow ? { fill: 'var(--bg)', stroke: `var(--${ser.role})`, strokeWidth: 2.5 } : {} }));
        const label = s('text', { class: `fx hide r-${ser.role}`, style: { fontSize: '17px', fontWeight: 600 } });
        g.append(...segs, ...dots, label);
        svg.append(g);
        inst.series.push({ ser, g, segs, dots, label });
      }
      return inst;
    },
    apply(inst, st, ctx) {
      const upto = st.upto ?? -1;
      inst.cats.forEach((t, i) => toggle(t, 'hide', i > upto));
      const focus = st.focus ? ids(st.focus) : null;
      const placed = [];
      inst.series.forEach(({ ser, g, segs, dots, label }) => {
        segs.forEach((p, i) => { toggle(p, 'on', i + 1 <= upto); p.style.transitionDelay = ctx.fast ? '0ms' : `${120}ms`; if (ser.dashed) p.style.strokeDasharray = i + 1 <= upto ? '0.012 0.012' : '1'; });
        dots.forEach((d, i) => { toggle(d, 'hide', i > upto); d.style.transitionDelay = ctx.fast ? '0ms' : `${i === upto ? 520 : 0}ms`; });
        g.style.opacity = focus && !(focus.has(ser.group) || focus.has(ser.name)) ? 0.22 : 1;
        if (upto >= 0) placed.push({ label, ser, y: inst.Y(ser.values[upto]), v: ser.values[upto] });
        toggle(label, 'hide', upto < 0 || st.labels === false);
      });
      // labels at the right of the last visible point, nudged apart (deterministic sweep)
      placed.sort((a, b) => a.y - b.y || a.ser.name.localeCompare(b.ser.name));
      for (let i = 1; i < placed.length; i++) placed[i].y = Math.max(placed[i].y, placed[i - 1].y + 21);
      const x = inst.X(Math.max(0, upto)) + 16;
      for (const p of placed) {
        p.label.textContent = `${p.ser.name}  ${Math.round(p.v * 100)}`;
        p.label.setAttribute('x', x);
        p.label.setAttribute('y', p.y + 6);
      }
    },
  });

  // ================================================================== bars: grouped bars that grow in layers
  // props: {groups:[{label, bars:[{v, role, layer, tag}]}], max, box:[x,y,w,h], legend:[{name, role, layer}], unit}
  MAI.view('bars', {
    build(ctx) {
      const { svg, props } = ctx;
      const [bx, by, bw, bh] = props.box || [90, 80, 820, 400];
      const max = props.max ?? 100, unit = props.unit ?? '%';
      const n = props.groups.length, gw = bw / n, inner = gw * (props.fill ?? 0.72);
      const Y = (v) => by + bh - (v / max) * bh;
      const inst = { bars: [], groups: [], legend: [] };
      svg.append(s('path', { d: `M${bx - 8} ${by + bh} H ${bx + bw + 8}`, class: 'ink-line' }));
      for (const t of props.ticks || [0, 25, 50, 75, 100]) {
        svg.append(s('path', { d: `M${bx - 8} ${Y(t)} H ${bx + bw}`, class: 'ink-line', style: { strokeWidth: 0.7, opacity: 0.18 } }),
          s('text', { x: bx - 16, y: Y(t) + 4, 'text-anchor': 'end', class: 'mono soft', style: { fontSize: '12px' }, text: `${t}${unit}` }));
      }
      props.groups.forEach((grp, gi) => {
        const gx = bx + gi * gw + (gw - inner) / 2, k = grp.bars.length, w = inner / k;
        const label = s('text', { x: bx + gi * gw + gw / 2, y: by + bh + 28, 'text-anchor': 'middle', class: 'fx', style: { fontSize: `${props.labelSize || 16}px`, fontWeight: 600 }, text: grp.label });
        svg.append(label);
        inst.groups.push(label);
        grp.bars.forEach((b, bi) => {
          const x = gx + bi * w + 2, top = Y(b.v);
          const rect = s('rect', { x, y: top, width: w - 4, height: by + bh - top, class: `fx r-${b.role}`, style: { transformBox: 'fill-box', transformOrigin: '50% 100%', transform: 'scaleY(0)' } });
          const val = s('text', { x: x + (w - 4) / 2, y: top - 8, 'text-anchor': 'middle', class: `mono fx hide r-${b.role}`, style: { fontSize: `${props.valueSize || 15}px`, fontWeight: 600 }, text: b.text ?? `${b.v}` });
          const tag = b.tag ? s('text', { x: x + (w - 4) / 2, y: by + bh - 10, 'text-anchor': 'middle', class: 'tag fx hide', style: { fill: 'var(--bg)', fontSize: '11px' }, text: b.tag }) : null;
          svg.append(rect, val, ...(tag ? [tag] : []));
          inst.bars.push({ rect, val, tag, b, gi, bi });
        });
      });
      (props.legend || []).forEach((l, i) => {
        const g = s('g', { class: 'fx hide', transform: `translate(${(props.legendX ?? bx) + i * (props.legendGap ?? 260)} ${props.legendY ?? by - 34})` },
          s('rect', { x: 0, y: -12, width: 16, height: 16, rx: 3, class: `r-${l.role}` }), s('text', { x: 24, y: 1, style: { fontSize: '15px' }, text: l.name }));
        svg.append(g);
        inst.legend.push({ g, l });
      });
      return inst;
    },
    apply(inst, st, ctx) {
      const layer = st.layer ?? -1, hl = st.hl ? ids(st.hl) : null;
      let n = 0;
      for (const { rect, val, tag, b, gi } of inst.bars) {
        const on = (b.layer ?? 0) <= layer;
        rect.style.transform = on ? 'scaleY(1)' : 'scaleY(0)';
        rect.style.transitionDelay = on && !ctx.fast ? `${(n++) * 60}ms` : '0ms';
        toggle(val, 'hide', !on);
        val.style.transitionDelay = rect.style.transitionDelay;
        if (tag) toggle(tag, 'hide', !on);
        rect.style.opacity = hl && !hl.has(gi) ? 0.25 : 1;
        val.style.opacity = hl && !hl.has(gi) ? 0.25 : '';
      }
      inst.groups.forEach((g, gi) => { g.style.opacity = hl && !hl.has(gi) ? 0.3 : 1; });
      inst.legend.forEach(({ g, l }) => toggle(g, 'hide', (l.layer ?? 0) > layer));
    },
  });

  // ================================================================== arc: an ARC task board (demos, tests, rule runs)
  // props: {pairs:[{input, output}], test | tests:[...], rules:{key:{who, text, role, runs:[{output, ok, wrong}]}},
  //         layout:'cols'|'rows', cell, perColumn, testStart:'blank'|'input'}
  // cue: pairs (n demos shown), test (bool) | tests (n), answer:'fill'|'show', rule (key), runTest (bool)
  MAI.view('arc', {
    build(ctx) {
      const { svg, html, props } = ctx;
      const rowsMode = props.layout === 'rows';
      const tests = props.tests || [props.test];
      const all = [...props.pairs.map((p) => ({ p, test: false })), ...tests.map((p) => ({ p, test: true }))];
      const inst = { cols: [], props, rowsMode };
      const area = props.area || [40, 70, 920, rowsMode ? 380 : 400];
      if (!rowsMode) {
        const gap = 44;
        let cells = all.map(({ p }) => Math.min(props.cell || 16, (area[3] - 50) / (p.input.length + p.output.length)));
        if (!props.perColumn) { const c = Math.min(...cells); cells = cells.map(() => c); }
        let widths = all.map(({ p }, i) => Math.max(p.input[0].length, p.output[0].length) * cells[i]);
        const total = widths.reduce((x, y) => x + y, 0) + gap * (all.length - 1);
        const k = Math.min(1, area[2] / total);
        cells = cells.map((c) => c * k); widths = widths.map((w) => w * k);
        let x = area[0] + (area[2] - (widths.reduce((x2, y) => x2 + y, 0) + gap * (all.length - 1))) / 2;
        all.forEach(({ p, test }, i) => {
          const cell = cells[i], w = widths[i];
          const gin = MAI.grid(p.input, { x: x + (w - p.input[0].length * cell) / 2, y: area[1], cell });
          const oy = area[1] + p.input.length * cell + 44;
          const start = test ? (props.testStart === 'input' ? p.input : p.output.map((r) => r.map(() => 0))) : p.output;
          const gout = MAI.grid(start, { x: x + (w - p.output[0].length * cell) / 2, y: oy, cell });
          const arrow = s('path', { d: `M${x + w / 2} ${oy - 36} v 26 m -7 -9 l 7 9 l 7 -9`, class: 'ink-line' });
          const label = s('text', { x: x + w / 2, y: area[1] - 14, 'text-anchor': 'middle', class: `tag ${test ? 'r-thread' : 'soft'}`, text: test ? 'test' : `demo ${i + 1}` });
          const badge = s('text', { x: x + w / 2, y: oy + p.output.length * cell + 34, 'text-anchor': 'middle', class: 'fx hide', style: { fontSize: '28px', fontWeight: 700 } });
          const col = s('g', { class: 'fx hide' }, label, gin, arrow, gout, badge);
          svg.append(col);
          inst.cols.push({ col, gin, gout, badge, p, test, i, start });
          x += w + gap;
        });
      } else {
        const cell = props.cell || 30, gap = 16;
        let ti = 0;
        all.forEach(({ p, test }, i) => {
          const y = area[1] + i * (cell + gap) + (test ? 14 : 0);
          const gin = MAI.grid(p.input, { x: area[0] + 120, y, cell });
          const ox = area[0] + 120 + p.input[0].length * cell + 70;
          const gout = MAI.grid(p.output, { x: ox, y, cell });
          const arrow = s('path', { d: `M${ox - 56} ${y + cell / 2} h 36 m -9 -7 l 9 7 l -9 7`, class: 'ink-line' });
          const label = s('text', { x: area[0] + 100, y: y + cell / 2 + 5, 'text-anchor': 'end', class: `tag ${test ? 'r-thread' : 'soft'}`, text: test ? `test ${++ti}` : `demo ${i + 1}` });
          const badge = s('text', { x: ox + cell + 22, y: y + cell / 2 + 10, class: 'fx hide', style: { fontSize: '28px', fontWeight: 700 } });
          const truth = s('g', { class: 'fx hide' }, s('text', { x: ox + cell + 60, y: y + cell / 2 + 5, class: 'tag soft', text: 'should be' }), MAI.grid(p.output, { x: ox + cell + 150, y, cell }));
          const col = s('g', { class: 'fx hide' }, label, gin, arrow, gout, badge, truth);
          svg.append(col);
          inst.cols.push({ col, gin, gout, badge, truth, p, test, i, start: p.output });
        });
      }
      inst.rule = h('div', { class: 'card fx hide', style: { left: '50%', top: rowsMode ? '86%' : '88%', width: '80%' } });
      html.append(inst.rule);
      return inst;
    },
    apply(inst, st, ctx) {
      const shown = st.pairs ?? 0, nTests = st.tests ?? (st.test ? 1 : 0), run = st.rule && inst.props.rules[st.rule];
      let order = 0, ti = 0;
      for (const c of inst.cols) {
        const on = c.test ? ti++ < nTests : c.i < shown;
        toggle(c.col, 'hide', !on);
        c.col.style.transitionDelay = on && !ctx.fast && !c.was ? `${(order++) * 140}ms` : '0ms';
        c.was = on;
        let out = c.start, badge = '', marks = [], wrongTruth = false;
        if (c.test && (st.answer === 'fill' || st.answer === 'show')) out = c.p.output;
        const r = run && run.runs[c.i];
        if (r && (!c.test || st.runTest)) { out = r.output; badge = r.ok ? '✓' : '✗'; marks = r.wrong || []; wrongTruth = !r.ok; }
        const delays = !ctx.fast && st.answer === 'fill' && c.test ? fillDelays(c.gout, out) : null;
        c.gout.set(out, delays);
        c.gout.marks(marks);
        c.badge.textContent = badge;
        c.badge.setAttribute('class', `fx ${badge ? '' : 'hide'} ${badge === '✓' ? 'r-c2' : 'r-emph'}`);
        c.badge.style.transitionDelay = badge && !ctx.fast ? `${250 + order * 220}ms` : '0ms';
        if (c.truth) toggle(c.truth, 'hide', !wrongTruth);
      }
      if (run) {
        inst.rule.className = `card fx ${run.role ? `role-${run.role}` : ''}`;
        inst.rule.innerHTML = `<span class="k">${MAI.md(run.who)}</span><span style="color:var(--ink)">“${MAI.md(run.text)}”</span>`;
      }
      inst.rule.style.transform = `translate(-50%, -50%) translateY(${run ? 0 : 1.2}cqw)`;
      toggle(inst.rule, 'hide', !run);
    },
  });
  function fillDelays(g, out) {
    const d = [];
    let n = 0;
    out.forEach((row, r) => row.forEach((v, c) => { const i = r * g.cols + c; d[i] = g.cells[i].getAttribute('class') !== `cell fx c${v}` ? 300 + 22 * n++ : 0; }));
    return d;
  }

  // ================================================================== title: the cover
  MAI.view('title', {
    build(ctx) {
      const { html, props } = ctx;
      const inst = {};
      inst.kicker = h('div', { class: 'card plain fx hide', style: { left: '50%', top: '17%', transform: 'translate(-50%,-50%)', font: '600 1.2cqw "MAI Mono", monospace', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-soft)' }, text: props.kicker || '' });
      inst.title = h('div', { class: 'card big fx hide', style: { left: '50%', top: '31%', width: '90%', textAlign: 'center', transform: 'translate(-50%,-50%)', fontSize: '6.4cqw' }, html: MAI.md(props.title) });
      inst.sub = h('div', { class: 'card plain fx hide', style: { left: '50%', top: '45%', width: '70%', textAlign: 'center', transform: 'translate(-50%,-50%)', fontSize: '1.9cqw', color: 'var(--ink-soft)' }, html: MAI.md(props.sub || '') });
      html.append(inst.kicker, inst.title, inst.sub);
      inst.cards = (props.cards || []).map((c, i) => {
        const n = props.cards.length, x = 50 + (i - (n - 1) / 2) * 23;
        const el = h('div', { class: 'card fx hide', style: { left: `${x}%`, top: '75%', width: '21%', transform: `translate(-50%,-50%) rotate(${[-2, 1, -1, 2][i % 4]}deg)`, padding: '.8cqw', fontSize: '1.15cqw' } },
          h('span', { class: 'k', text: c.k }), h('div', { html: MAI.md(c.label), style: { fontFamily: '"MAI Serif", Georgia, serif', fontStyle: 'italic', fontSize: '1.6cqw', lineHeight: 1.15 } }));
        html.append(el);
        return el;
      });
      return inst;
    },
    apply(inst, st, ctx) {
      const show = ids(st.show);
      toggle(inst.kicker, 'hide', !show.has('kicker'));
      toggle(inst.title, 'hide', !show.has('title'));
      toggle(inst.sub, 'hide', !show.has('sub'));
      inst.cards.forEach((c, i) => { toggle(c, 'hide', !show.has('cards')); c.style.transitionDelay = !ctx.fast && show.has('cards') ? `${200 + i * 140}ms` : '0ms'; });
    },
  });
})();
