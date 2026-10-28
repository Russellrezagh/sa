/* Views specific to "The Relation Under the Surface". Same contract as engine/views.js:
   build(ctx) creates elements once; apply(inst, state, ctx) maps a folded state onto them. */
(() => {
  'use strict';
  const { h, s, toggle } = MAI;
  const ids = (v) => new Set(Array.isArray(v) ? v : v ? [v] : []);
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /** Tween numeric properties of an object over `ms` (rAF); jumps when fast. Used where SVG geometry must move (links). */
  function tween(obj, to, ms, fast, onFrame) {
    if (obj._raf) cancelAnimationFrame(obj._raf);
    const from = {}; for (const k of Object.keys(to)) from[k] = obj[k];
    if (fast) { Object.assign(obj, to); onFrame(); return; }
    let t0 = null;
    const tick = (now) => {
      t0 ??= now;
      const t = Math.min(1, (now - t0) / ms), e = ease(t);
      for (const k of Object.keys(to)) obj[k] = from[k] + (to[k] - from[k]) * e;
      onFrame();
      if (t < 1) obj._raf = requestAnimationFrame(tick);
    };
    obj._raf = requestAnimationFrame(tick);
  }
  const textEl = (x, y, text, cls = '', extra = {}) => s('text', { x, y, class: cls, text, ...extra });

  // ================================================================== parts: Copycat's four parts and their loop
  MAI.view('parts', {
    build(ctx) {
      const { svg } = ctx;
      const box = (id, x, y, w, hh, title, sub, role) => {
        const g = s('g', { class: 'fx hide' },
          s('rect', { x, y, width: w, height: hh, rx: 18, class: 'r-bg', style: { stroke: `var(--${role})`, strokeWidth: 2.5 } }),
          textEl(x + 22, y + 40, title, 'serif', { style: { fontSize: '30px' } }),
          textEl(x + 22, y + 68, sub, 'soft', { style: { fontSize: '15px' } }));
        g.id_ = id; svg.append(g); return g;
      };
      const inst = { boxes: {}, arrows: {} };
      inst.boxes.slipnet = box('slipnet', 300, 40, 400, 120, 'Slipnet', 'long-term memory: a network of concepts', 'c5');
      inst.boxes.workspace = box('workspace', 260, 240, 480, 140, 'Workspace', 'short-term: the letters and what is built on them', 'c1');
      inst.boxes.coderack = box('coderack', 300, 460, 400, 120, 'Coderack', 'a bag of tiny agents (codelets) waiting to run', 'c4');
      inst.boxes.temperature = box('temperature', 790, 230, 190, 240, 'Temperature', '', 'c3');
      // decorations
      const sn = s('g', { class: 'fx' });
      [[520, 120], [580, 92], [640, 126], [600, 140]].forEach(([x, y], i, a) => { if (i) sn.append(s('path', { d: `M${a[i - 1][0]} ${a[i - 1][1]} L ${x} ${y}`, class: 'ink-line', style: { strokeWidth: 1.4 } })); });
      [[520, 120], [580, 92], [640, 126], [600, 140]].forEach(([x, y]) => sn.append(s('circle', { cx: x, cy: y, r: 8, class: 'r-c5', opacity: 0.7 })));
      inst.boxes.slipnet.append(sn);
      inst.boxes.workspace.append(textEl(300, 345, 'a b c → a b d      i j k → ?', 'mono', { style: { fontSize: '24px' } }));
      [0, 1, 2, 3, 4].forEach((i) => inst.boxes.coderack.append(s('rect', { x: 330 + i * 70, y: 530, width: 56, height: 30, rx: 6, class: 'r-c4', opacity: 0.25 + i * 0.12 })));
      const th = inst.boxes.temperature;
      th.append(s('rect', { x: 920, y: 300, width: 30, height: 140, rx: 15, fill: 'none', class: 's-ink', 'stroke-width': 2 }),
        s('rect', { x: 926, y: 350, width: 18, height: 86, rx: 9, class: 'r-c3' }),
        textEl(812, 320, 'how messy', 'soft', { style: { fontSize: '14px' } }), textEl(812, 340, 'the workspace', 'soft', { style: { fontSize: '14px' } }), textEl(812, 360, 'is right now', 'soft', { style: { fontSize: '14px' } }));
      const arrow = (id, d, label, lx, ly, role) => {
        const g = s('g', { class: 'fx hide' }, s('path', { d, class: 'thread-line draw fx', pathLength: 1, style: { stroke: `var(--${role})`, strokeWidth: 2.4, markerEnd: 'url(#arrowhead)' } }),
          textEl(lx, ly, label, `tag r-${role}`));
        svg.append(g); inst.arrows[id] = g;
      };
      svg.append(s('defs', {}, s('marker', { id: 'arrowhead', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
        s('path', { d: 'M0 0 L10 5 L0 10 z', class: 'r-ink' }))));
      arrow('spawn', 'M296 110 C 120 160, 120 450, 296 512', 'concepts send seekers', 20, 214, 'c5');
      arrow('build', 'M500 458 L 500 386', 'codelets build', 512, 430, 'c4');
      arrow('activate', 'M742 290 C 790 250, 770 160, 704 120', 'structures light concepts', 730, 202, 'c1');
      arrow('heat', 'M742 340 L 786 340', '', 0, 0, 'c3');
      arrow('random', 'M885 472 C 885 545, 800 560, 704 540', 'and sets how random they are', 700, 600, 'c3');
      return inst;
    },
    apply(inst, st, ctx) {
      const show = ids(st.show), hl = st.hl;
      let n = 0;
      for (const [id, g] of Object.entries(inst.boxes)) {
        toggle(g, 'hide', !show.has(id));
        g.style.opacity = hl && hl !== id && show.has(id) ? 0.35 : '';
        g.style.transitionDelay = !ctx.fast && show.has(id) ? `${(n++) * 120}ms` : '0ms';
      }
      for (const [id, g] of Object.entries(inst.arrows)) {
        const on = !!st.loop;
        toggle(g, 'hide', !on);
        g.querySelector('.draw').classList.toggle('on', on);
        g.style.transitionDelay = g.querySelector('.draw').style.transitionDelay = on && !ctx.fast ? `${300 + Object.keys(inst.arrows).indexOf(id) * 380}ms` : '0ms';
      }
    },
  });

  // ================================================================== slipnet: concepts with depth, activation and shrinking links
  const SLIP = {
    nodes: {
      opposite: { x: 500, y: 110, label: 'opposite' },
      sameness: { x: 250, y: 170, label: 'sameness' },
      first: { x: 250, y: 300, label: 'first', x2: 395 },
      last: { x: 750, y: 300, label: 'last', x2: 605 },
      successor: { x: 300, y: 405, label: 'successor', x2: 425 },
      predecessor: { x: 700, y: 405, label: 'predecessor', x2: 575 },
      a: { x: 180, y: 525, label: 'a' },
      z: { x: 820, y: 525, label: 'z' },
    },
    links: [['first', 'last', 'opposite'], ['successor', 'predecessor', 'opposite'], ['a', 'first', ''], ['z', 'last', ''], ['opposite', 'sameness', '']],
  };
  MAI.view('slipnet', {
    build(ctx) {
      const { svg } = ctx;
      const inst = { nodes: {}, links: [] };
      const axis = s('g', { class: 'fx hide' },
        s('path', { d: 'M60 560 V 90', class: 'ink-line', style: { strokeWidth: 1.6, markerEnd: 'url(#sn-arrow)' } }),
        textEl(48, 70, 'deep', 'tag', { 'text-anchor': 'start' }), textEl(48, 590, 'shallow', 'tag soft'),
        s('defs', {}, s('marker', { id: 'sn-arrow', viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 8, markerHeight: 8, orient: 'auto' }, s('path', { d: 'M0 0 L10 5 L0 10 z', class: 'r-ink' }))));
      svg.append(axis); inst.axis = axis;
      const linkLayer = s('g', {}), nodeLayer = s('g', {});
      svg.append(linkLayer, nodeLayer);
      for (const [id, n] of Object.entries(SLIP.nodes)) {
        const g = s('g', { class: 'fx hide' });
        const halo = s('circle', { r: 46, class: 'halo r-thread', opacity: 0 });
        const disc = s('circle', { r: id.length === 1 ? 26 : 34, class: 'r-bg', style: { stroke: 'var(--ink)', strokeWidth: 2.2 } });
        const t = textEl(0, 6, n.label, id.length === 1 ? 'mono' : '', { 'text-anchor': 'middle', style: { fontSize: id.length === 1 ? '26px' : '15px', fontWeight: 600 } });
        g.append(halo, disc, t);
        nodeLayer.append(g);
        inst.nodes[id] = { g, halo, x: n.x, y: n.y, home: n };
      }
      for (const [a, b, label] of SLIP.links) {
        const line = s('path', { class: 'ink-line fx hide', style: { strokeWidth: label ? 2.4 : 1.4 } });
        const tag = label ? textEl(0, 0, label, 'tag r-c5 fx hide', { 'text-anchor': 'middle' }) : null;
        linkLayer.append(line); if (tag) linkLayer.append(tag);
        inst.links.push({ a, b, line, tag, label });
      }
      inst.token = s('g', { class: 'fx hide' }, s('rect', { x: -38, y: -15, width: 76, height: 30, rx: 15, class: 'r-thread' }), textEl(0, 5, 'first', 'tag', { 'text-anchor': 'middle', style: { fill: 'var(--bg)' } }));
      svg.append(inst.token);
      inst.draw = () => {
        for (const [, n] of Object.entries(inst.nodes)) n.g.setAttribute('transform', `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`);
        for (const l of inst.links) {
          const A = inst.nodes[l.a], B = inst.nodes[l.b];
          l.line.setAttribute('d', `M${A.x} ${A.y} L ${B.x} ${B.y}`);
          if (l.tag) { l.tag.setAttribute('x', (A.x + B.x) / 2); l.tag.setAttribute('y', (A.y + B.y) / 2 - 10); }
        }
      };
      inst.draw();
      return inst;
    },
    apply(inst, st, ctx) {
      const show = st.show === 'all' ? new Set(Object.keys(inst.nodes)) : ids(st.show);
      toggle(inst.axis, 'hide', !st.axis);
      let n = 0;
      for (const [id, nd] of Object.entries(inst.nodes)) {
        toggle(nd.g, 'hide', !show.has(id));
        nd.g.style.transitionDelay = !ctx.fast && show.has(id) ? `${(n++) * 80}ms` : '0ms';
        const act = (st.active || {})[id];
        nd.halo.setAttribute('class', `halo r-thread ${act || ''}`);
        nd.halo.setAttribute('opacity', act === 'on' || act === 'linger' ? 0.32 : 0);
      }
      for (const l of inst.links) {
        const on = show.has(l.a) && show.has(l.b);
        toggle(l.line, 'hide', !on);
        if (l.tag) toggle(l.tag, 'hide', !on);
        const short = st.shrink && l.label === 'opposite';
        l.line.style.stroke = short ? 'var(--thread)' : '';
      }
      const to = {};
      for (const [id, nd] of Object.entries(inst.nodes)) to[id] = st.shrink && nd.home.x2 != null ? nd.home.x2 : nd.home.x;
      const proxy = inst.proxy || (inst.proxy = Object.fromEntries(Object.entries(inst.nodes).map(([id, nd]) => [id, nd.x])));
      tween(proxy, to, 900, ctx.fast, () => { for (const [id, nd] of Object.entries(inst.nodes)) nd.x = proxy[id]; inst.draw(); });
      // slippage token: "first" rides the shortened link over to "last"
      const slip = st.slip;
      if (slip) {
        const A = SLIP.nodes.first, B = SLIP.nodes.last;
        const x = slip === 'done' ? B.x2 : A.x2;
        inst.token.style.transform = `translate(${x}px, ${A.y - 58}px)`;
        const label = slip === 'done' ? 'first → last' : 'first';
        inst.token.querySelector('text').textContent = label;
        const tw = label.length * 9.5 + 28;
        inst.token.querySelector('rect').setAttribute('x', -tw / 2);
        inst.token.querySelector('rect').setAttribute('width', tw);
      }
      toggle(inst.token, 'hide', !slip);
    },
  });

  // ================================================================== workspace: Copycat's scratchpad for one problem
  // props: {target: 'i j k' | 'x y z'}.  cue: rows, desc, bonds, groups, bridges, wobble, rule, answer, temp, snag, slips, focus
  MAI.view('workspace', {
    build(ctx) {
      const { svg, html, props } = ctx;
      const inst = { rows: {}, props };
      const mkRow = (key, text, cx, y) => {
        const toks = text.split(' ');
        const tiles = toks.map((t, i) => {
          const x = cx + (i - (toks.length - 1) / 2) * 76;
          const g = s('g', { class: 'tile fx hide', style: { transform: `translate(${x}px, ${y}px)` } },
            s('rect', { x: -30, y: -36, width: 60, height: 72, rx: 9 }), textEl(0, 1, t, '', {}));
          g.cx = x; g.cy = y; svg.append(g); return g;
        });
        inst.rows[key] = { tiles, y, cx, toks };
      };
      const tgt = props.target || 'i j k';
      mkRow('top', 'a b c', 260, 150);
      mkRow('mod', 'a b d', 640, 150);
      mkRow('tgt', tgt, 260, 430);
      inst.arrowTop = s('path', { d: 'M395 150 h 90 m -12 -10 l 12 10 l -12 10', class: 'ink-line fx hide' });
      inst.arrowTgt = s('path', { d: 'M395 430 h 90 m -12 -10 l 12 10 l -12 10', class: 'ink-line fx hide' });
      svg.append(inst.arrowTop, inst.arrowTgt);
      inst.slot = s('g', { class: 'tile ghost fx hide', style: { transform: 'translate(640px, 430px)' } }, s('rect', { x: -110, y: -36, width: 220, height: 72, rx: 9 }), textEl(0, 1, '?'));
      svg.append(inst.slot);
      inst.answer = textEl(640, 444, '', 'mono r-thread fx hide', { 'text-anchor': 'middle', style: { fontSize: '44px', fontWeight: 700, letterSpacing: '8px' } });
      svg.append(inst.answer);
      // descriptions under tiles
      inst.desc = s('g', { class: 'fx hide' });
      const descFor = (row, labels) => labels.forEach(([i, t]) => { const tile = inst.rows[row].tiles[i]; inst.desc.append(textEl(tile.cx, tile.cy + 60, t, 'tag soft', { 'text-anchor': 'middle' })); });
      descFor('top', [[0, 'leftmost'], [2, 'rightmost']]);
      descFor('tgt', [[0, 'leftmost'], [2, 'rightmost']]);
      svg.append(inst.desc);
      // alphabet facts that matter for xyz
      inst.alpha = s('g', { class: 'fx hide' });
      inst.alpha.append(textEl(inst.rows.top.tiles[0].cx, 228, 'first letter', 'tag r-c3', { 'text-anchor': 'middle' }), textEl(inst.rows.tgt.tiles[2].cx, 508, 'last letter', 'tag r-c3', { 'text-anchor': 'middle' }));
      svg.append(inst.alpha);
      // bonds: arcs over adjacent tiles, two directions available per row
      inst.bonds = {};
      for (const row of ['top', 'tgt']) for (const dir of ['succ', 'pred']) {
        const g = s('g', { class: 'fx hide' });
        const T = inst.rows[row].tiles;
        for (let i = 0; i < T.length - 1; i++) {
          const [a, b] = dir === 'succ' ? [T[i], T[i + 1]] : [T[i + 1], T[i]];
          const y = a.cy - 44;
          g.append(s('path', { d: `M${a.cx} ${y} C ${a.cx} ${y - 34}, ${b.cx} ${y - 34}, ${b.cx} ${y - 4}`, class: 'thread-line', style: { stroke: `var(--${dir === 'succ' ? 'c2' : 'c5'})`, strokeWidth: 2.4 } }),
            s('path', { d: `M${b.cx - 6} ${y - 13} L ${b.cx} ${y - 3} L ${b.cx + 6} ${y - 13}`, class: 'thread-line', style: { stroke: `var(--${dir === 'succ' ? 'c2' : 'c5'})`, strokeWidth: 2.4 } }));
        }
        g.append(textEl(inst.rows[row].tiles[0].cx - 50, inst.rows[row].y - 50, dir === 'succ' ? 'successor' : 'predecessor', `tag r-${dir === 'succ' ? 'c2' : 'c5'}`, { 'text-anchor': 'end' }),
          textEl(inst.rows[row].tiles[0].cx - 50, inst.rows[row].y - 32, dir === 'succ' ? 'bonds →' : '← bonds', `tag r-${dir === 'succ' ? 'c2' : 'c5'}`, { 'text-anchor': 'end' }));
        svg.append(g); inst.bonds[`${row}:${dir}`] = g;
      }
      // groups
      inst.groups = {};
      for (const row of ['top', 'tgt']) {
        const T = inst.rows[row].tiles;
        for (const kind of ['succ', 'pred']) {
          const g = s('g', { class: 'fx hide' }, s('rect', { x: T[0].cx - 44, y: T[0].cy - 50, width: T[2].cx - T[0].cx + 88, height: 100, rx: 18, fill: 'none',
            class: `s-${kind === 'succ' ? 'c2' : 'c5'}`, 'stroke-width': 3, 'stroke-dasharray': kind === 'pred' ? '8 6' : null }));
          svg.append(g); inst.groups[`${row}:${kind}`] = g;
        }
      }
      // bridges between rows
      const T0 = inst.rows.top.tiles, T1 = inst.rows.tgt.tiles;
      const bridge = (a, b, label, role, side = 0) => s('g', {}, s('path', { d: `M${a.cx} ${a.cy + 74} C ${a.cx} ${a.cy + 150}, ${b.cx} ${b.cy - 150}, ${b.cx} ${b.cy - 74}`, class: 'thread-line', 'stroke-dasharray': '7 6', style: { stroke: `var(--${role})`, strokeWidth: 2.2 } }),
        label ? textEl((a.cx + b.cx) / 2 + side * 12, (a.cy + b.cy) / 2 + 4, label, `tag r-${role}`, { 'text-anchor': side < 0 ? 'end' : side > 0 ? 'start' : 'middle' }) : null);
      inst.bridges = {
        plain: s('g', { class: 'fx hide' }, bridge(T0[0], T1[0], 'leftmost = leftmost', 'c1', -1), bridge(T0[1], T1[1], '', 'c1'), bridge(T0[2], T1[2], 'rightmost = rightmost', 'c1', 1)),
        mirror: s('g', { class: 'fx hide' }, bridge(T0[0], T1[2], '', 'thread'), bridge(T0[2], T1[0], '', 'thread'), bridge(T0[1], T1[1], 'a ⇄ z,  c ⇄ x', 'thread', 1)),
      };
      svg.append(inst.bridges.plain, inst.bridges.mirror);
      // snag: z hits the end of the alphabet
      const z = T1[2];
      inst.snag = s('g', { class: 'fx hide' }, s('path', { d: `M${z.cx + 48} ${z.cy - 46} V ${z.cy + 46}`, class: 'thread-line', style: { stroke: 'var(--emph)', strokeWidth: 7 } }),
        textEl(z.cx + 60, z.cy - 44, 'z has no', 'tag r-emph'), textEl(z.cx + 60, z.cy - 26, 'successor', 'tag r-emph'));
      svg.append(inst.snag);
      // thermometer
      inst.therm = s('g', { class: 'fx hide' },
        s('rect', { x: 902, y: 110, width: 34, height: 380, rx: 17, fill: 'none', class: 's-ink', 'stroke-width': 2 }),
        (inst.mercury = s('rect', { x: 909, y: 118, width: 20, height: 364, rx: 10, class: 'fx r-c1', style: { transformBox: 'fill-box', transformOrigin: '50% 100%' } })),
        textEl(919, 92, 'hot', 'tag r-c3', { 'text-anchor': 'middle' }), textEl(919, 518, 'cool', 'tag r-c1', { 'text-anchor': 'middle' }),
        textEl(919, 548, 'temperature', 'tag soft', { 'text-anchor': 'middle' }));
      svg.append(inst.therm);
      // rule + slippage cards (HTML)
      inst.rule = h('div', { class: 'card fx hide', style: { left: '50%', top: '93%', width: '64%', transform: 'translate(-50%,-50%)', textAlign: 'center' } });
      inst.slips = h('div', { class: 'card fx hide', style: { left: '78%', top: '50%', width: '20%', transform: 'translate(-50%,-50%)', fontSize: '1.3cqw' } });
      html.append(inst.rule, inst.slips);
      return inst;
    },
    apply(inst, st, ctx) {
      const rows = ids(st.rows);
      const showRow = (key, on, base = 0) => inst.rows[key].tiles.forEach((t, i) => {
        toggle(t, 'hide', !on);
        t.style.transitionDelay = on && !ctx.fast ? `${base + i * 70}ms` : '0ms';
      });
      showRow('top', rows.has('top'));
      showRow('mod', rows.has('top') && rows.has('mod'), 200);
      showRow('tgt', rows.has('tgt'), 150);
      toggle(inst.arrowTop, 'hide', !rows.has('top'));
      toggle(inst.arrowTgt, 'hide', !rows.has('tgt'));
      toggle(inst.slot, 'hide', !rows.has('tgt') || !!st.answer);
      toggle(inst.answer, 'hide', !st.answer);
      if (st.answer) inst.answer.textContent = st.answer;
      // changed letter in abd
      toggle(inst.rows.mod.tiles[2], 'hl', true);
      // wobble = unhappiness (CSS animation on tiles not yet in a structure)
      for (const key of ['top', 'tgt']) inst.rows[key].tiles.forEach((t, i) => t.classList.toggle('wobble', !!st.wobble && !(st.groups || {})[key]));
      const focus = ids(st.focus);
      inst.rows.top.tiles.forEach((t, i) => toggle(t, 'hl', focus.has(`top${i}`)));
      inst.rows.tgt.tiles.forEach((t, i) => { toggle(t, 'hl', focus.has(`tgt${i}`)); toggle(t, 'bad', st.snag && i === 2); });
      toggle(inst.desc, 'hide', !st.desc);
      toggle(inst.alpha, 'hide', !st.alpha);
      for (const [key, g] of Object.entries(inst.bonds)) { const [row, dir] = key.split(':'); toggle(g, 'hide', (st.bonds || {})[row] !== dir); }
      for (const [key, g] of Object.entries(inst.groups)) { const [row, kind] = key.split(':'); toggle(g, 'hide', (st.groups || {})[row] !== kind); }
      for (const [key, g] of Object.entries(inst.bridges)) toggle(g, 'hide', st.bridges !== key);
      toggle(inst.snag, 'hide', !st.snag);
      // temperature
      const temp = st.temp;
      toggle(inst.therm, 'hide', temp == null);
      if (temp != null) {
        inst.mercury.style.transform = `scaleY(${Math.max(0.04, temp / 100).toFixed(3)})`;
        inst.mercury.setAttribute('class', `fx ${temp > 60 ? 'r-c3' : 'r-c1'}`);
      }
      if (st.rule) inst.rule.innerHTML = `<span class="k">${MAI.md(st.rule.k || 'rule')}</span>${MAI.md(st.rule.text)}`;
      toggle(inst.rule, 'hide', !st.rule);
      if (st.slips) inst.slips.innerHTML = `<span class="k">slippages</span>${st.slips.map((x) => `<div>${MAI.md(x)}</div>`).join('')}`;
      toggle(inst.slips, 'hide', !st.slips);
    },
  });

  // ================================================================== codelets: the coderack, and how temperature shapes the draw
  const CODELETS = [
    ['bond scout', 'n'], ['describer', 'n'], ['group scout', 's'], ['bridge scout', 'n'],
    ['successor bond', 's'], ['breaker', 'n'], ['bridge scout', 's'], ['group scout', 'n'],
    ['describer', 'n'], ['rule scout', 's'], ['bond scout', 'n'], ['bridge scout', 's'],
  ];
  const URGENCY = [0.35, 0.2, 0.7, 0.45, 0.9, 0.15, 0.6, 0.3, 0.25, 0.8, 0.4, 0.55];
  MAI.view('codelets', {
    build(ctx) {
      const { svg } = ctx;
      const inst = { cards: [] };
      inst.concept = s('g', { class: 'fx hide', transform: 'translate(120 110)' },
        s('circle', { r: 46, class: 'halo r-thread', opacity: 0.25 }), s('circle', { r: 34, class: 'r-bg', style: { stroke: 'var(--ink)', strokeWidth: 2.2 } }),
        textEl(0, 5, 'successor', '', { 'text-anchor': 'middle', style: { fontSize: '14px', fontWeight: 600 } }), textEl(0, -54, 'active concept', 'tag r-thread', { 'text-anchor': 'middle' }));
      svg.append(inst.concept);
      CODELETS.forEach(([name, kind], i) => {
        const x = 230 + (i % 4) * 170, y = 230 + Math.floor(i / 4) * 110;
        const g = s('g', { class: 'fx hide', style: { transform: `translate(${x}px, ${y}px)` } },
          s('rect', { x: 0, y: 0, width: 150, height: 84, rx: 10, class: 'r-bg', style: { stroke: 'var(--ink)', strokeWidth: 1.8 } }),
          textEl(14, 30, name, '', { style: { fontSize: '16px', fontWeight: 600 } }),
          textEl(14, 52, 'urgency', 'tag soft', { style: { fontSize: '10px' } }),
          s('rect', { x: 14, y: 60, width: 122, height: 9, rx: 4.5, class: 'r-guide', opacity: 0.5 }),
          s('rect', { x: 14, y: 60, width: 122 * URGENCY[i], height: 9, rx: 4.5, class: 'r-c4' }));
        g.kind = kind; g.x = x; g.y = y;
        svg.append(g); inst.cards.push(g);
      });
      inst.seekLines = s('g', { class: 'fx hide' });
      inst.cards.filter((c) => c.kind === 's').forEach((c) => inst.seekLines.append(s('path', { d: `M150 140 C 200 ${c.y - 20}, ${c.x - 40} ${c.y - 10}, ${c.x} ${c.y + 30}`, class: 'thread-line', style: { strokeWidth: 1.6, opacity: 0.7 } })));
      svg.insertBefore(inst.seekLines, inst.cards[0]);
      inst.legend = s('g', { class: 'fx hide' },
        s('rect', { x: 230, y: 570, width: 18, height: 18, rx: 4, class: 'r-bg', style: { stroke: 'var(--ink)', strokeWidth: 1.8 } }), textEl(256, 584, 'noticers: wander bottom-up', '', { style: { fontSize: '15px' } }),
        s('rect', { x: 530, y: 570, width: 18, height: 18, rx: 4, class: 'r-bg', style: { stroke: 'var(--thread)', strokeWidth: 3 } }), textEl(556, 584, 'seekers: sent top-down by a concept', '', { style: { fontSize: '15px' } }));
      svg.append(inst.legend);
      inst.pickRing = s('rect', { x: -8, y: -8, width: 166, height: 100, rx: 14, fill: 'none', class: 's-thread fx hide', 'stroke-width': 4 });
      svg.append(inst.pickRing);
      return inst;
    },
    apply(inst, st, ctx) {
      toggle(inst.concept, 'hide', !st.kinds);
      toggle(inst.seekLines, 'hide', !st.kinds);
      toggle(inst.legend, 'hide', !st.kinds);
      inst.cards.forEach((c, i) => {
        toggle(c, 'hide', !st.rack);
        c.style.transitionDelay = st.rack && !ctx.fast ? `${i * 50}ms` : '0ms';
        c.querySelector('rect').style.stroke = st.kinds && c.kind === 's' ? 'var(--thread)' : '';
        c.querySelector('rect').style.strokeWidth = st.kinds && c.kind === 's' ? '3' : '';
        const picked = st.pick === i;
        c.style.transform = `translate(${c.x}px, ${c.y - (picked ? 14 : 0)}px)`;
      });
      if (st.pick != null) { const c = inst.cards[st.pick]; inst.pickRing.style.transform = `translate(${c.x}px, ${c.y - 14}px)`; }
      toggle(inst.pickRing, 'hide', st.pick == null);
    },
  });

  // ================================================================== temperature: how heat flattens the choice among codelets
  MAI.view('temperature', {
    build(ctx) {
      const { svg } = ctx;
      const inst = { bars: [] };
      const names = ['successor bond', 'rule scout', 'group scout', 'bridge scout', 'describer', 'breaker'];
      const urg = [0.9, 0.8, 0.7, 0.45, 0.2, 0.15];
      inst.urg = urg;
      names.forEach((n, i) => {
        const x = 110 + i * 105;
        const bar = s('rect', { x, y: 140, width: 70, height: 340, class: 'fx r-c4', style: { transformBox: 'fill-box', transformOrigin: '50% 100%', transform: 'scaleY(0)' } });
        const lab = textEl(x + 35, 508, n, '', { 'text-anchor': 'middle', style: { fontSize: '14px', fontWeight: 600 } });
        const ub = s('rect', { x: x + 10, y: 528, width: 50 * urg[i], height: 8, rx: 4, class: 'r-guide' });
        svg.append(bar, lab, ub);
        inst.bars.push(bar);
      });
      svg.append(s('path', { d: 'M90 480 H 760', class: 'ink-line' }), textEl(90, 560, 'urgency', 'tag soft'), textEl(90, 120, 'chance of being picked next', 'tag soft'));
      inst.therm = s('g', {},
        s('rect', { x: 860, y: 120, width: 34, height: 360, rx: 17, fill: 'none', class: 's-ink', 'stroke-width': 2 }),
        (inst.mercury = s('rect', { x: 867, y: 128, width: 20, height: 344, rx: 10, class: 'fx r-c3', style: { transformBox: 'fill-box', transformOrigin: '50% 100%' } })),
        textEl(877, 104, 'hot', 'tag r-c3', { 'text-anchor': 'middle' }), textEl(877, 506, 'cool', 'tag r-c1', { 'text-anchor': 'middle' }),
        textEl(877, 536, 'temperature', 'tag soft', { 'text-anchor': 'middle' }));
      svg.append(inst.therm);
      inst.note = textEl(110, 600, 'illustration: the shape of the effect, not Copycat’s exact formula', 'tag soft fx hide', { style: { fontSize: '11px' } });
      svg.append(inst.note);
      return inst;
    },
    apply(inst, st) {
      const T = st.temp ?? 90;
      // weight = urgency^k, k grows as the workspace cools (an illustration of the shape, not the paper's formula)
      const k = 0.15 + ((100 - T) / 100) * 4.5;
      const w = inst.urg.map((u) => Math.pow(u, k)), sum = w.reduce((a, b) => a + b, 0), maxP = 0.75;
      inst.bars.forEach((b, i) => { b.style.transform = st.bars ? `scaleY(${(w[i] / sum / maxP).toFixed(3)})` : 'scaleY(0)'; });
      inst.mercury.style.transform = `scaleY(${(T / 100).toFixed(3)})`;
      inst.mercury.setAttribute('class', `fx ${T > 60 ? 'r-c3' : 'r-c1'}`);
      toggle(inst.note, 'hide', !st.bars);
    },
  });

  // ================================================================== scan: the parallel terraced scan
  MAI.view('scan', {
    build(ctx) {
      const { svg } = ctx;
      const inst = { tiers: [[], [], []] };
      const root = [90, 330];
      svg.append(s('circle', { cx: root[0], cy: root[1], r: 10, class: 'r-ink' }));
      const ys = [70, 140, 210, 280, 350, 420, 490, 560];
      ys.forEach((y, i) => {
        const p1 = s('path', { d: `M${root[0]} ${root[1]} C 200 ${root[1]}, 220 ${y}, 330 ${y}`, pathLength: 1, class: 'thread-line draw fx', style: { stroke: 'var(--ink-soft)', strokeWidth: 1.6 } });
        svg.append(p1); inst.tiers[0].push(p1);
        if ([1, 4, 6].includes(i)) {
          const p2 = s('path', { d: `M330 ${y} C 430 ${y}, 470 ${y + (i === 4 ? -10 : 8)}, 590 ${y + (i === 4 ? -10 : 8)}`, pathLength: 1, class: 'thread-line draw fx', style: { stroke: 'var(--c4)', strokeWidth: 3.4 } });
          svg.append(p2); inst.tiers[1].push(p2);
          if (i === 4) {
            const p3 = s('path', { d: `M590 ${y - 10} C 690 ${y - 10}, 730 ${y - 40}, 850 ${y - 40}`, pathLength: 1, class: 'thread-line draw fx', style: { strokeWidth: 6 } });
            svg.append(p3); inst.tiers[2].push(p3);
            inst.goal = s('g', { class: 'fx hide' }, s('circle', { cx: 870, cy: y - 40, r: 16, class: 'r-thread' }), textEl(870, y - 66, 'a structure gets built', 'tag r-thread', { 'text-anchor': 'middle' }));
            svg.append(inst.goal);
          }
        } else {
          svg.append(s('circle', { cx: 336, cy: y, r: 4, class: 'r-guide fx' }));
        }
      });
      inst.labels = [
        textEl(330, 606, 'many quick, cheap looks', 'tag soft fx hide', { 'text-anchor': 'middle' }),
        textEl(560, 36, 'closer looks where it seems promising', 'tag r-c4 fx hide', { 'text-anchor': 'middle' }),
        textEl(850, 36, 'full effort', 'tag r-thread fx hide', { 'text-anchor': 'middle' }),
      ];
      svg.append(...inst.labels);
      return inst;
    },
    apply(inst, st, ctx) {
      const tier = st.tier ?? -1;
      inst.tiers.forEach((ps, t) => ps.forEach((p, i) => { toggle(p, 'on', t <= tier); p.style.transitionDelay = !ctx.fast && t === tier ? `${i * 90}ms` : '0ms'; }));
      inst.labels.forEach((l, t) => toggle(l, 'hide', t > tier));
      toggle(inst.goal, 'hide', tier < 2);
    },
  });

  // ================================================================== roles: the relation stays, the fillers change
  MAI.view('roles', {
    build(ctx) {
      const { svg } = ctx;
      const inst = { sets: {} };
      const xs = [320, 500, 680], y = 300;
      inst.sockets = s('g', { class: 'fx hide' });
      ['first', 'middle', 'last'].forEach((r, i) => inst.sockets.append(
        s('rect', { x: xs[i] - 50, y: y - 60, width: 100, height: 120, rx: 14, fill: 'none', class: 's-c1', 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }),
        textEl(xs[i], y + 92, r, 'tag r-c1', { 'text-anchor': 'middle' })));
      svg.append(inst.sockets);
      inst.rel = s('g', { class: 'fx hide' });
      [0, 1].forEach((i) => inst.rel.append(s('path', { d: `M${xs[i] + 10} ${y - 70} C ${xs[i] + 40} ${y - 120}, ${xs[i + 1] - 40} ${y - 120}, ${xs[i + 1] - 10} ${y - 72}`, class: 'thread-line' }),
        s('path', { d: `M${xs[i + 1] - 18} ${y - 82} L ${xs[i + 1] - 9} ${y - 71} L ${xs[i + 1] - 2} ${y - 84}`, class: 'thread-line' })));
      inst.rel.append(textEl(500, y - 128, 'successor, successor', 'tag r-thread', { 'text-anchor': 'middle' }));
      svg.append(inst.rel);
      for (const set of ctx.props.sets) {
        const g = s('g', { class: 'fx hide' });
        set.split(' ').forEach((t, i) => g.append(s('g', { class: 'tile', transform: `translate(${xs[i]} ${y})` }, s('rect', { x: -38, y: -45, width: 76, height: 90, rx: 10 }), textEl(0, 1, t))));
        svg.append(g); inst.sets[set] = g;
      }
      return inst;
    },
    apply(inst, st) {
      toggle(inst.sockets, 'hide', !st.sockets);
      toggle(inst.rel, 'hide', !st.relation);
      for (const [set, g] of Object.entries(inst.sets)) {
        const on = st.fillers === set;
        toggle(g, 'hide', !on);
        g.style.transform = on ? 'translateY(0)' : 'translateY(40px)';
      }
    },
  });

  // ================================================================== people: who took part
  MAI.view('people', {
    build(ctx) {
      const { svg } = ctx;
      const inst = {};
      const dots = (n, cols, x0, y0, role, hollow) => {
        const g = s('g', { class: 'fx hide' });
        for (let i = 0; i < n; i++) g.append(s('circle', { cx: x0 + (i % cols) * 22, cy: y0 + Math.floor(i / cols) * 22, r: 8, class: hollow ? '' : `r-${role}`, style: hollow ? { fill: 'none', stroke: `var(--${role})`, strokeWidth: 2.2 } : {} }));
        return g;
      };
      inst.children = dots(42, 7, 100, 150, 'c2', true);
      inst.children.append(textEl(100, 120, '42 children, aged 7–9', '', { style: { fontSize: '20px', fontWeight: 600 } }));
      inst.adults = dots(62, 8, 380, 150, 'c2', false);
      inst.adults.append(textEl(380, 120, '62 adults', '', { style: { fontSize: '20px', fontWeight: 600 } }));
      inst.models = s('g', { class: 'fx hide' }, textEl(700, 120, '4 language models', '', { style: { fontSize: '20px', fontWeight: 600 } }));
      ['GPT-4o', 'Claude-3.5', 'Llama-3.1 405B', 'Gemma-2 27B'].forEach((m, i) => {
        const chip = MAI.ink(MAI.shapes['icon.chip'].shape);
        const vb = MAI.shapes['icon.chip'].shape.viewBox;
        const g = s('g', { transform: `translate(${700} ${150 + i * 80}) scale(${56 / vb[2]})` }, chip);
        inst.models.append(g, textEl(770, 190 + i * 80, m, '', { style: { fontSize: '17px' } }));
      });
      inst.models.append(textEl(700, 500, '55 runs of each model', 'tag soft'));
      svg.append(inst.children, inst.adults, inst.models);
      return inst;
    },
    apply(inst, st, ctx) {
      const show = ids(st.show);
      ['children', 'adults', 'models'].forEach((k, i) => { toggle(inst[k], 'hide', !show.has(k)); inst[k].style.transitionDelay = !ctx.fast ? `${i * 160}ms` : '0ms'; });
    },
  });

  // ================================================================== ops: which rules survive the move to the symbol list
  MAI.view('ops', {
    build(ctx) {
      const { svg, props } = ctx;
      const list = props.list.split(' ');
      const inst = { rows: [] };
      props.rows.forEach((r, ri) => {
        const y = 110 + ri * 118;
        const g = s('g', { class: 'fx hide' });
        g.append(textEl(40, y + 6, r.op, '', { style: { fontSize: '19px', fontWeight: 600 } }), textEl(40, y + 30, r.example, 'mono soft', { style: { fontSize: '17px' } }));
        const x0 = 300, w = 34;
        list.forEach((t, i) => g.append(s('g', { class: `tile${r.marks.includes(t) ? ' hl' : ''}`, transform: `translate(${x0 + i * (w + 4)} ${y})` },
          s('rect', { x: -w / 2, y: -20, width: w, height: 40, rx: 6 }), textEl(0, 1, t, '', { style: { fontSize: '22px' } }))));
        if (r.hop) {
          const a = x0 + list.indexOf(r.hop[0]) * (w + 4), b = x0 + list.indexOf(r.hop[1]) * (w + 4);
          const lift = a === b ? 0 : 26 + Math.abs(b - a) * 0.15;
          g.append(a === b
            ? s('path', { d: `M${a - 8} ${y - 22} C ${a - 26} ${y - 62}, ${a + 26} ${y - 62}, ${a + 8} ${y - 22}`, class: 'thread-line', style: { strokeWidth: 2.4 } })
            : s('path', { d: `M${a} ${y - 22} C ${a} ${y - 22 - lift}, ${b} ${y - 22 - lift}, ${b} ${y - 24}`, class: 'thread-line', style: { strokeWidth: 2.4 } }));
        }
        const verdict = textEl(790, y + 8, r.verdict, `tag fx hide r-${r.ok ? 'c2' : 'emph'}`, { style: { fontSize: '15px' } });
        g.append(verdict);
        svg.append(g); inst.rows.push({ g, verdict });
      });
      return inst;
    },
    apply(inst, st, ctx) {
      inst.rows.forEach(({ g, verdict }, i) => {
        toggle(g, 'hide', i >= (st.rows ?? 0));
        g.style.transitionDelay = !ctx.fast ? `${i * 120}ms` : '0ms';
        toggle(verdict, 'hide', !st.verdicts);
        verdict.style.transitionDelay = st.verdicts && !ctx.fast ? `${300 + i * 200}ms` : '0ms';
      });
    },
  });

  // ================================================================== cells: what a model "sees" (colours, numbers, or a picture)
  MAI.view('cells', {
    build(ctx) {
      const { svg, html, props } = ctx;
      const g = props.grid;
      const cell = 30;
      const inst = { props };
      inst.grid = MAI.grid(g, { x: 90, y: 90, cell, digits: true });
      inst.grid.classList.add('hide');
      svg.append(inst.grid);
      inst.text = h('div', { class: 'card code fx hide', style: { left: '57%', top: '14%', width: '38%', fontSize: '1.15cqw', lineHeight: 1.35 }, text: g.map((r) => r.join(' ')).join('\n') });
      inst.text.style.transform = 'none';
      html.append(inst.text);
      // the "picture" a vision model gets, and a misread of its size
      inst.picture = MAI.grid(g, { x: 90, y: 90, cell });
      inst.picture.classList.add('hide');
      inst.picture.style.filter = 'blur(1.6px)';
      svg.append(inst.picture);
      const mis = g.slice(0, g.length - 1).map((r) => [...r.slice(0, r.length), 0]);
      inst.misread = MAI.grid(mis, { x: 600, y: 120, cell: 24 });
      inst.misread.classList.add('hide');
      svg.append(inst.misread);
      inst.misLabel = s('g', { class: 'fx hide' }, textEl(600, 100, `read as ${mis.length} × ${mis[0].length}`, 'tag r-emph'), textEl(90, 70, `really ${g.length} × ${g[0].length}`, 'tag r-c2'));
      svg.append(inst.misLabel);
      return inst;
    },
    apply(inst, st) {
      const mode = st.mode || 'none';
      toggle(inst.grid, 'hide', !(mode === 'color' || mode === 'digits'));
      inst.grid.cells.forEach((c) => { c.style.opacity = mode === 'digits' ? 0.08 : 1; });
      toggle(inst.grid.digits, 'hide', mode !== 'digits');
      toggle(inst.text, 'hide', !st.text);
      toggle(inst.picture, 'hide', mode !== 'picture');
      toggle(inst.misread, 'hide', !st.misread);
      toggle(inst.misLabel, 'hide', !st.misread);
    },
  });

  // ================================================================== potemkin: perfect fronts, nothing behind
  MAI.view('potemkin', {
    build(ctx) {
      const { svg } = ctx;
      const inst = { houses: [] };
      const facade = MAI.shapes['icon.facade'].shape;
      svg.append(s('path', { d: 'M40 470 H 960', class: 'ink-line' }));
      [215, 500, 785].forEach((x, i) => {
        const front = s('g', { class: 'fx', style: { transformBox: 'fill-box', transformOrigin: '50% 100%' } });
        // front only: the shape's strokes minus the props behind it (the last three strokes are the struts)
        front.append(MAI.ink({ ...facade, strokes: facade.strokes.slice(0, 7) }));
        const back = s('g', { class: 'fx', style: { transformBox: 'fill-box', transformOrigin: '50% 100%', transform: 'scaleX(0)' } },
          s('path', { d: 'M 40 190 L 40 82 L 100 34 L 160 82 L 160 190', class: 'ink-line', style: { strokeDasharray: '4 6' } }),
          s('path', { d: 'M 160 96 L 226 190 M 160 138 L 198 190 M 40 96 L -26 190 M 40 138 L 2 190', class: 'ink-line', style: { strokeWidth: 3 } }),
          s('path', { d: 'M 60 120 H 140 M 60 150 H 140', class: 'ink-line', style: { strokeWidth: 1.2, opacity: 0.5 } }));
        const g = s('g', { transform: `translate(${x - 130 * 1.15} ${470 - 190 * 1.15}) scale(1.15)` }, front, back);
        svg.append(g);
        inst.houses.push({ front, back });
      });
      inst.carriage = s('g', { class: 'fx', style: { transform: 'translate(-160px, 0)' } },
        s('rect', { x: 0, y: 418, width: 90, height: 40, rx: 8, class: 'r-c5', opacity: 0.85 }), s('circle', { cx: 18, cy: 462, r: 11, class: 'r-ink' }), s('circle', { cx: 72, cy: 462, r: 11, class: 'r-ink' }),
        textEl(45, 404, '1787', 'tag', { 'text-anchor': 'middle' }));
      svg.append(inst.carriage);
      return inst;
    },
    apply(inst, st, ctx) {
      const behind = !!st.behind;
      inst.houses.forEach(({ front, back }, i) => {
        const d = ctx.fast ? 0 : i * 140;
        front.style.transform = behind ? 'scaleX(0)' : 'scaleX(1)';
        front.style.transitionDelay = `${behind ? d : d + 450}ms`;
        back.style.transform = behind ? 'scaleX(-1)' : 'scaleX(0)';
        back.style.transitionDelay = `${behind ? d + 450 : d}ms`;
      });
      inst.carriage.style.transform = `translate(${st.carriage ? 860 : -160}px, 0)`;
      inst.carriage.style.transitionDuration = st.carriage && !ctx.fast ? '2600ms' : '';
    },
  });

  // ================================================================== fiveuses: PotARCin's five uses of one rule, on one ARC task
  MAI.view('fiveuses', {
    build(ctx) {
      const { svg, html, props } = ctx;
      const D = MAI.data.arc_fill;
      const inst = { panels: {}, D };
      const DIMS = [['definition', 'Definition', 'write the rule as a program'], ['classification', 'Classification', 'which pairs follow the rule?'],
        ['generation', 'Constrained generation', 'invent a new valid pair'], ['editing', 'Editing', 'repair a broken pair, minimally'], ['inversion', 'Inversion', 'from an output, build an input']];
      inst.dims = DIMS;
      // the task, small, top-left
      const task = s('g', { class: 'fx' }, textEl(30, 34, 'ARC task 00d62c1b', 'tag soft'));
      D.train.slice(0, 3).forEach((p, i) => {
        const x = 30 + i * 128;
        const gi = MAI.grid(p.input.slice(0, 10).map((r) => r.slice(0, 10)), { x, y: 46, cell: 5 });
        const go = MAI.grid(p.output.slice(0, 10).map((r) => r.slice(0, 10)), { x: x + 58, y: 46, cell: 5 });
        task.append(gi, go, s('path', { d: `M${x + 50} ${46 + gi.h / 2} h 6`, class: 'ink-line', style: { strokeWidth: 1.4 } }));
      });
      svg.append(task);
      // the list of five
      inst.list = DIMS.map(([id, name, sub], i) => {
        const g = s('g', { class: 'fx hide', style: { transform: `translate(30px, ${150 + i * 86}px)` } },
          s('circle', { cx: 16, cy: 0, r: 16, class: 'r-bg', style: { stroke: 'var(--ink)', strokeWidth: 2 } }), textEl(16, 6, String(i + 1), 'mono', { 'text-anchor': 'middle', style: { fontSize: '16px', fontWeight: 700 } }),
          textEl(44, 2, name, '', { style: { fontSize: '17px', fontWeight: 600 } }), textEl(44, 24, sub, 'soft', { style: { fontSize: '13px' } }),
          textEl(260, 6, '✓', 'r-c2 fx hide', { style: { fontSize: '22px', fontWeight: 700 } }));
        svg.append(g); g.id_ = id; return g;
      });
      const P = (id) => { const g = s('g', { class: 'fx hide' }); svg.append(g); inst.panels[id] = g; return g; };
      const X0 = 330;
      // standard: test input → output
      {
        const g = P('standard');
        const gi = MAI.grid(D.test.input, { x: X0 + 10, y: 150, cell: 13 });
        const go = MAI.grid(D.test.input, { x: X0 + 360, y: 150, cell: 13 });
        g.append(textEl(X0 + 10, 135, 'test input', 'tag soft'), gi, s('path', { d: `M${X0 + 286} ${150 + gi.h / 2} h 50 m -10 -8 l 10 8 l -10 8`, class: 'ink-line' }), textEl(X0 + 360, 135, 'standard ARC: produce this output', 'tag r-thread'), go);
        inst.std = { go, truth: D.test.output, input: D.test.input };
      }
      // definition: code that is run on the demos
      {
        const g = P('definition');
        inst.code = h('div', { class: 'card code fx hide', style: { left: '33%', top: '22%', width: '44%', fontSize: '1.05cqw' }, text: D.definition });
        html.append(inst.code);
        inst.defRuns = D.train.slice(0, 3).map((p, i) => {
          const x = X0 + 60 + i * 200;
          const go = MAI.grid(p.output, { x, y: 400, cell: Math.min(14, 150 / p.output[0].length) });
          const badge = textEl(x + go.w / 2, 395 + go.h + 34, '✓', 'r-c2 fx hide', { 'text-anchor': 'middle', style: { fontSize: '24px', fontWeight: 700 } });
          g.append(go, badge);
          return badge;
        });
        g.append(textEl(X0 + 60, 384, 'run on the demos (and on fresh examples)', 'tag soft'));
      }
      // classification: five candidate pairs, stamps
      {
        const g = P('classification');
        inst.cls = D.classification.map((c, i) => {
          const x = X0 + 8 + i * 128, cell = 5.6;
          const gi = MAI.grid(c.pair.input, { x, y: 150, cell });
          const go = MAI.grid(c.pair.output, { x, y: 230, cell });
          go.marks([]);
          const stamp = s('g', { class: 'fx hide' },
            s('rect', { x: x - 4, y: 300, width: 64, height: 26, rx: 5, fill: 'none', class: c.valid ? 's-c2' : 's-emph', 'stroke-width': 2.4 }),
            textEl(x + 28, 318, c.valid ? 'valid' : 'broken', `tag ${c.valid ? 'r-c2' : 'r-emph'}`, { 'text-anchor': 'middle' }),
            textEl(x + 28, 344, c.valid ? '' : c.kind, 'tag soft', { 'text-anchor': 'middle', style: { fontSize: '10px' } }));
          g.append(textEl(x, 140, `pair ${i + 1}`, 'tag soft'), gi, s('path', { d: `M${x + 28} ${210} v 14`, class: 'ink-line', style: { strokeWidth: 1.4 } }), go, stamp);
          return { stamp, go, c };
        });
        g.append(textEl(X0 + 8, 400, 'all five judgements must be right to pass', 'tag r-thread'));
      }
      // generation: a new input appears, then its output
      {
        const g = P('generation');
        const blank = D.generation.input.map((r) => r.map(() => 0));
        inst.gen = { gi: MAI.grid(blank, { x: X0 + 30, y: 150, cell: 22 }), go: MAI.grid(blank, { x: X0 + 330, y: 150, cell: 22 }), blank };
        g.append(textEl(X0 + 30, 135, 'a new input, with exactly three enclosed holes', 'tag soft'), inst.gen.gi, s('path', { d: `M${X0 + 262} ${260} h 50 m -10 -8 l 10 8 l -10 8`, class: 'ink-line' }), inst.gen.go,
          (inst.gen.stamp = textEl(X0 + 330, 410, 'verifier: matches ✓', 'tag r-c2 fx hide')));
      }
      // editing: broken → repaired
      {
        const g = P('editing');
        inst.ed = { broken: MAI.grid(D.editing.broken, { x: X0 + 30, y: 150, cell: 22 }), fixed: MAI.grid(D.editing.broken, { x: X0 + 330, y: 150, cell: 22 }) };
        inst.ed.broken.marks(D.editing.mark);
        g.append(textEl(X0 + 30, 135, 'a broken output (input not shown)', 'tag r-emph'), inst.ed.broken, s('path', { d: `M${X0 + 262} ${260} h 50 m -10 -8 l 10 8 l -10 8`, class: 'ink-line' }),
          textEl(X0 + 330, 135, 'repaired: 2 cells changed', 'tag r-c2'), inst.ed.fixed,
          (inst.ed.stamp = textEl(X0 + 330, 410, `edit distance ${D.editing.distance.toFixed(2)} ≤ 0.70 ✓`, 'tag r-c2 fx hide')));
      }
      // inversion: output → an input that produces it
      {
        const g = P('inversion');
        inst.inv = { out: MAI.grid(D.inversion.output, { x: X0 + 30, y: 150, cell: 22 }), inp: MAI.grid(D.inversion.output, { x: X0 + 330, y: 150, cell: 22 }) };
        g.append(textEl(X0 + 30, 135, 'given this output…', 'tag soft'), inst.inv.out, s('path', { d: `M${X0 + 262} ${260} h 50 m -10 -8 l 10 8 l -10 8`, class: 'ink-line' }),
          textEl(X0 + 330, 135, '…build an input that produces it', 'tag r-thread'), inst.inv.inp,
          (inst.inv.stamp = textEl(X0 + 330, 410, 'verifier: input → this output ✓', 'tag r-c2 fx hide')));
      }
      // full task
      {
        const g = P('full');
        g.append(textEl(X0 + 40, 300, 'full task = pass all five', 'serif', { style: { fontSize: '40px' } }), textEl(X0 + 40, 340, 'generators make the examples; verifiers check the answers', 'soft', { style: { fontSize: '16px' } }));
      }
      return inst;
    },
    apply(inst, st, ctx) {
      const cur = st.dim, done = ids(st.done), D = inst.D, f = ctx.fast;
      inst.list.forEach((g, i) => {
        toggle(g, 'hide', !st.list);
        g.style.transitionDelay = st.list && !f ? `${i * 90}ms` : '0ms';
        g.querySelector('circle').style.stroke = g.id_ === cur ? 'var(--thread)' : '';
        g.querySelector('circle').style.strokeWidth = g.id_ === cur ? '3.5' : '';
        toggle(g.querySelector('.r-c2'), 'hide', !done.has(g.id_));
      });
      for (const [id, g] of Object.entries(inst.panels)) toggle(g, 'hide', id !== cur);
      const stagger = (grid, from, to) => {
        const delays = [];
        let n = 0;
        to.forEach((row, r) => row.forEach((v, c) => { delays[r * grid.cols + c] = from[r][c] !== v ? 260 + 45 * n++ : 0; }));
        return delays;
      };
      // each panel resets while hidden, then plays when it becomes current
      inst.std.go.set(cur === 'standard' ? inst.std.truth : inst.std.input, cur === 'standard' && !f ? stagger(inst.std.go, inst.std.input, inst.std.truth) : null);
      toggle(inst.code, 'hide', cur !== 'definition');
      inst.defRuns.forEach((b, i) => { toggle(b, 'hide', cur !== 'definition'); b.style.transitionDelay = cur === 'definition' && !f ? `${600 + i * 300}ms` : '0ms'; });
      inst.cls.forEach(({ stamp }, i) => { toggle(stamp, 'hide', cur !== 'classification'); stamp.style.transitionDelay = cur === 'classification' && !f ? `${500 + i * 350}ms` : '0ms'; });
      inst.cls.forEach(({ go, c }) => go.marks(cur === 'classification' && c.pair.mark ? c.pair.mark : []));
      const G = inst.gen;
      if (cur === 'generation') {
        G.gi.set(D.generation.input, f ? null : stagger(G.gi, G.blank, D.generation.input));
        const late = f ? null : stagger(G.go, G.blank, D.generation.output).map((d) => (d ? d + 2000 : 0));
        G.go.set(D.generation.output, late);
      } else { G.gi.set(G.blank); G.go.set(G.blank); }
      toggle(G.stamp, 'hide', cur !== 'generation');
      G.stamp.style.transitionDelay = cur === 'generation' && !f ? '3400ms' : '0ms';
      const E = inst.ed;
      E.fixed.set(cur === 'editing' ? D.editing.fixed : D.editing.broken, cur === 'editing' && !f ? stagger(E.fixed, D.editing.broken, D.editing.fixed).map((d) => (d ? d + 600 : 0)) : null);
      E.fixed.marks(cur === 'editing' ? D.editing.mark : []);
      toggle(E.stamp, 'hide', cur !== 'editing');
      E.stamp.style.transitionDelay = cur === 'editing' && !f ? '1400ms' : '0ms';
      const I = inst.inv;
      I.inp.set(cur === 'inversion' ? D.inversion.input : D.inversion.output, cur === 'inversion' && !f ? stagger(I.inp, D.inversion.output, D.inversion.input).map((d) => (d ? d + 500 : 0)) : null);
      toggle(I.stamp, 'hide', cur !== 'inversion');
      I.stamp.style.transitionDelay = cur === 'inversion' && !f ? '2200ms' : '0ms';
    },
  });

  // ================================================================== venn: which tasks pass, run to run
  MAI.view('venn', {
    build(ctx) {
      const { svg, props } = ctx;
      const inst = {};
      inst.a = s('g', { class: 'fx hide', style: { transform: 'translate(250px, 320px)' } }, s('circle', { r: 175, class: 'r-c1', opacity: 0.22, style: { stroke: 'var(--c1)', strokeWidth: 3 } }), textEl(-90, -190, props.a, 'tag r-c1'));
      inst.b = s('g', { class: 'fx hide', style: { transform: 'translate(750px, 320px)' } }, s('circle', { r: 177, class: 'r-c4', opacity: 0.22, style: { stroke: 'var(--c4)', strokeWidth: 3 } }), textEl(-10, -190, props.b, 'tag r-c4'));
      inst.na = textEl(250, 330, '', 'mono fx', { 'text-anchor': 'middle', style: { fontSize: '40px', fontWeight: 700 } });
      inst.nb = textEl(750, 330, '', 'mono fx', { 'text-anchor': 'middle', style: { fontSize: '40px', fontWeight: 700 } });
      inst.shared = textEl(500, 330, String(props.shared), 'mono r-thread fx hide', { 'text-anchor': 'middle', style: { fontSize: '46px', fontWeight: 700 } });
      inst.sharedLab = textEl(500, 362, 'passed in both', 'tag r-thread fx hide', { 'text-anchor': 'middle' });
      inst.j = textEl(500, 590, props.jaccard, 'tag fx hide', { 'text-anchor': 'middle' });
      svg.append(inst.a, inst.b, inst.na, inst.nb, inst.shared, inst.sharedLab, inst.j);
      return inst;
    },
    apply(inst, st, ctx) {
      const P = ctx.props, step = st.stage ?? 0;
      toggle(inst.a, 'hide', step < 1);
      toggle(inst.b, 'hide', step < 2);
      const merged = step >= 3;
      inst.a.style.transform = `translate(${merged ? 410 : 250}px, 320px)`;
      inst.b.style.transform = `translate(${merged ? 590 : 750}px, 320px)`;
      inst.na.textContent = step < 1 ? '' : merged ? String(P.na - P.shared) : String(P.na);
      inst.nb.textContent = step < 2 ? '' : merged ? String(P.nb - P.shared) : String(P.nb);
      inst.na.setAttribute('x', merged ? 300 : 250);
      inst.nb.setAttribute('x', merged ? 700 : 750);
      toggle(inst.shared, 'hide', !merged);
      toggle(inst.sharedLab, 'hide', !merged);
      toggle(inst.j, 'hide', !merged);
    },
  });

  // ================================================================== budget: one question five times vs five questions once
  MAI.view('budget', {
    build(ctx) {
      const { svg, props } = ctx;
      const inst = { lanes: [] };
      props.lanes.forEach((lane, li) => {
        const y = 150 + li * 210;
        const g = s('g', { class: 'fx hide' }, textEl(40, y - 40, lane.name, '', { style: { fontSize: '19px', fontWeight: 600 } }));
        lane.items.forEach((t, i) => g.append(s('rect', { x: 40 + i * 104, y: y - 20, width: 94, height: 56, rx: 9, class: 'r-bg', style: { stroke: `var(--${lane.role})`, strokeWidth: 2.4 } }),
          textEl(87 + i * 104, y + 13, t, 'tag', { 'text-anchor': 'middle', style: { fontSize: '11px' } })));
        const bar = s('rect', { x: 620, y: y - 20, width: 300 * (lane.value / 30), height: 56, rx: 6, class: `fx r-${lane.role}`, style: { transformBox: 'fill-box', transformOrigin: '0 50%', transform: 'scaleX(0)' } });
        const val = textEl(630 + 300 * (lane.value / 30), y + 17, `${lane.value}%`, `mono fx hide r-${lane.role}`, { style: { fontSize: '26px', fontWeight: 700 } });
        g.append(bar, val, textEl(620, y + 60, 'trials that exposed at least one failure', 'tag soft', { style: { fontSize: '10px' } }));
        svg.append(g);
        inst.lanes.push({ g, bar, val });
      });
      inst.p = textEl(620, 590, props.p, 'tag fx hide');
      svg.append(inst.p);
      return inst;
    },
    apply(inst, st, ctx) {
      inst.lanes.forEach(({ g, bar, val }, i) => {
        toggle(g, 'hide', i >= (st.lanes ?? 0));
        bar.style.transform = st.bars ? 'scaleX(1)' : 'scaleX(0)';
        bar.style.transitionDelay = st.bars && !ctx.fast ? `${i * 300}ms` : '0ms';
        toggle(val, 'hide', !st.bars);
      });
      toggle(inst.p, 'hide', !st.bars);
    },
  });

  // ================================================================== credits: every source and every borrowed picture
  MAI.view('credits', {
    build(ctx) {
      const { html } = ctx;
      const inst = {};
      const papers = Object.values(MAI.cites).filter((c) => c.long);
      inst.papers = h('div', { class: 'card plain fx hide', style: { left: '0', top: '6%', width: '100%', fontSize: '1.3cqw', lineHeight: 1.5 } },
        h('span', { class: 'k', text: 'papers and data' }),
        ...papers.map((c) => h('div', { style: { marginBottom: '.6cqw' }, html: `${MAI.md(c.long)}${c.url ? ` · <span style="font-family:'MAI Mono',monospace;font-size:.85em;color:var(--ink-soft)">${c.url}</span>` : ''}` })));
      const media = Object.entries(MAI.ledger);
      inst.media = h('div', { class: 'card plain fx hide', style: { left: '0', top: '2%', width: '100%', fontSize: '1.2cqw', lineHeight: 1.4, columns: 2, columnGap: '2.5cqw' } },
        h('span', { class: 'k', text: 'pictures on these pages' }),
        ...media.map(([, a]) => h('div', { style: { breakInside: 'avoid', marginBottom: '.4cqw' }, html: `<b>${MAI.md(a.title)}</b> · ${MAI.md(MAI.shortCredit(a))} · ${a.licence}` })),
        h('div', { style: { marginTop: '.6cqw' }, html: 'Characters, icons and diagrams: the MAI asset library (drawn for this project). Fonts: Inter, Instrument Serif, JetBrains Mono, Caveat (SIL OFL 1.1).' }));
      html.append(inst.papers, inst.media);
      return inst;
    },
    apply(inst, st) {
      toggle(inst.papers, 'hide', st.page !== 'papers');
      toggle(inst.media, 'hide', st.page !== 'media');
    },
  });
})();
