/* "The Relation Under the Surface": a hand-navigated explainer of four papers on analogy and abstraction.
   Every claim is checked against the papers; see FACTS.md (this folder) and storyboards/builders/FACTS.md.
   Scenes are data: {id, chapter, view, props, title, steps:[{cue, say, cite, head}]}; the stage at a step is
   the fold of that scene's cues up to the step (engine/explainer.js). */
(() => {
  'use strict';
  const { s } = MAI;
  const M = (t) => ['mai', t];
  const S = (t) => ['sam', t];
  const st = (cue, say, extra = {}) => ({ cue, say, ...extra });
  const D = MAI.data;

  MAI.meta = {
    id: 'analogy-to-arc',
    title: 'The Relation Under the Surface',
    description: 'A hand-navigated explainer: analogy, children and AI, from Copycat (1995) to PotARCin (2026). Two characters talk you through it; the pictures do the explaining.',
  };

  // ---------------------------------------------------------------- cast: Mai (the guide, the thread) and Sam (the learner)
  const sam = MAI.shapes['character.everyperson'];
  MAI.cast = {
    mai: {
      name: 'Mai', role: 'guide',
      avatar: () => s('svg', { viewBox: '0 0 48 48' },
        s('path', { d: 'M6 31 C 9 15, 26 9, 33 18 C 39 26, 30 36, 22 31 C 15 27, 20 16, 29 16 C 38 16, 43 25, 42 33', class: 'thread-line', style: { strokeWidth: 3.2 } }),
        s('circle', { cx: 42, cy: 34, r: 2.6, class: 'r-thread' })),
    },
    sam: {
      name: 'Sam', role: 'learner',
      avatar: () => s('svg', { viewBox: '44 22 112 112' }, MAI.ink(sam.base, { pose: sam.neutral, boil: false })),
    },
  };

  // ---------------------------------------------------------------- sources (every number on screen names one)
  MAI.cites = {
    copycat1995: { short: 'Hofstadter & Mitchell (1995)', long: 'Hofstadter, D. R. & Mitchell, M. (1995). The Copycat project: a model of mental fluidity and analogy-making. In *Fluid Concepts and Creative Analogies*, Basic Books.' },
    memo1984: { short: 'Hofstadter, MIT AI Memo 755 (1984)', long: 'Hofstadter, D. R. (1984). *The Copycat Project: An Experiment in Nondeterminism and Creative Analogies.* MIT AI Memo 755 (DTIC ADA142744).', url: 'archive.org/details/DTIC_ADA142744' },
    mitchell1993: { short: 'Mitchell (1993)', long: 'Mitchell, M. (1993). *Analogy-Making as Perception: A Computer Model.* MIT Press.' },
    stevenson: { short: 'Stevenson, Pafford, van der Maas & Mitchell (TACL 2026)', long: 'Stevenson, C. E., Pafford, A., van der Maas, H. L. J. & Mitchell, M. (2026). Can large language models generalize analogy solving like children can? *TACL*. CC BY 4.0.', url: 'arxiv.org/abs/2411.02348' },
    chollet2019: { short: 'Chollet (2019); task 00d62c1b from ARC-AGI-1 (Apache-2.0)', long: 'Chollet, F. (2019). On the measure of intelligence. arXiv:1911.01547. Task 00d62c1b from the ARC-AGI-1 training set (Apache-2.0).', url: 'github.com/fchollet/ARC-AGI' },
    conceptarc: { short: 'Moskvichev, Odouard & Mitchell (2023)', long: 'Moskvichev, A., Odouard, V. V. & Mitchell, M. (2023). The ConceptARC benchmark. *TMLR*. Tasks TopBottom2D4 and Center2 (MIT licence).', url: 'github.com/victorvikram/ConceptARC' },
    beger: { short: 'Beger, Yi, Fu, Denton, Moskvichev, Tsai, Rajamanickam & Mitchell (NeurIPS 2026)', long: 'Beger, C., Yi, R., Fu, S., Denton, K., Moskvichev, A., Tsai, S. W., Rajamanickam, S. & Mitchell, M. (2026). Distinguishing performance from competence in evaluations of humanlike abstract reasoning. *NeurIPS*. CC BY 4.0.', url: 'arxiv.org/abs/2510.02125' },
    runs: { short: 'Rules quoted from Beger et al. (2026) §3, run as code on the ConceptARC task (data.py)' },
    potemkin: { short: 'The Potemkin-village story (1787), told as a legend; historians think it exaggerated' },
    mancoridis: { short: 'Mancoridis et al. (2025), “Potemkin understanding in large language models”', long: 'Mancoridis, M. et al. (2025). Potemkin understanding in large language models.' },
    potarcin: { short: 'Beger, Yi & Mitchell (NeurIPS 2026)', long: 'Beger, C., Yi, R. & Mitchell, M. (2026). PotARCin: multi-dimensional evaluation of skill acquisition in abstract reasoning tasks. *NeurIPS*. CC BY 4.0.', url: 'arxiv.org/abs/2609.27288' },
  };

  // ---------------------------------------------------------------- chapters (the beat grammar: HOOK → DEFINE → LADDER → TURN → RULE → RETURN)
  [
    { id: 'hook', nav: 'Puzzle', title: 'A puzzle with a wall', beat: 'HOOK' },
    { id: 'define', title: 'Seeing is analogy', beat: 'DEFINE' },
    { id: 'copycat', nav: 'Copycat · 1995', title: 'Paper 1 · Copycat', beat: 'LADDER' },
    { id: 'children', nav: 'Children · 2026', title: 'Paper 2 · Children vs. language models', beat: 'LADDER' },
    { id: 'turn', title: 'The drop', beat: 'TURN', mode: 'night' },
    { id: 'competence', nav: 'Competence · 2026', title: 'Paper 3 · Performance vs. competence', beat: 'LADDER' },
    { id: 'potarcin', nav: 'PotARCin · 2026', title: 'Paper 4 · PotARCin', beat: 'LADDER' },
    { id: 'rule', nav: 'The rule', title: 'The rule', beat: 'RULE' },
    { id: 'return', title: 'Back to xyz', beat: 'RETURN' },
    { id: 'credits', nav: 'Sources', title: 'Sources', beat: null },
  ].forEach(MAI.chapter);

  const ALPHA = 'a b c d e f g h i j k l m n o p q r s t u v w x y z';
  const SYMBOLS = '* @ % ! ^ # ~ $ { ? = :'; // Stevenson et al. §2 (text); see FACTS.md on the figure's variant

  // ================================================================ HOOK
  MAI.scene({
    id: 'hook-abc', chapter: 'hook', view: 'strings', title: 'A tiny puzzle',
    props: { rows: [{ id: 'src', l: 'a b c', r: 'a b d', y: 190 }, { id: 'tgt', l: 'i j k', r: 'i j l', y: 400 }], strip: { items: ALPHA, y: 565 } },
    steps: [
      st({ rows: { src: 'l' } }, [S('Give me a puzzle. Something small.'), M('Here’s a string of three letters: [[c1|abc]]. Watch it change.')]),
      st({ rows: { src: 'lr' }, change: { a: { row: 'src', i: 2, label: 'one step on' } }, strip: { show: true, mark: ['c', 'd'], hop: ['c', 'd', '+1'] }, relation: { row: 'src', text: 'last letter → next letter', dy: 64 } },
        [M('It became [[c1|abd]]. Only the last letter moved, one step along the alphabet.')]),
      st({ rows: { tgt: 'l?' }, strip: { mark: [], hop: null }, relation: null }, [S('So if [[c2|ijk]] changes the same way…')]),
      st({ rows: { tgt: 'lr' }, change: { b: { row: 'tgt', i: 2, label: 'one step on' } }, strip: { mark: ['k', 'l'], hop: ['k', 'l', '+1'] }, relation: { row: 'tgt', text: 'last letter → next letter', dy: 64 } },
        [S('…it becomes [[c2|ijl]]. Easy.'), M('Easy for you. But look at what travelled from the top row to the bottom one. Not a letter: a [[thread|relation]].')]),
    ],
  });

  MAI.scene({
    id: 'hook-pairs', chapter: 'hook', view: 'strings', title: 'What counts as “the last letter”?',
    props: { rows: [{ id: 'src', l: 'a b c', r: 'a b d', y: 170 }, { id: 'tgt', l: 'i i j j k k', r: 'i i j j k l', y: 420 }], max: 320 },
    steps: [
      st({ rows: { src: 'lr', tgt: 'l?' } }, [S('Then what does [[c2|iijjkk]] become?')]),
      st({ rows: { tgt: 'lr' }, change: { a: { row: 'tgt', i: 5, label: 'last letter +1' } } },
        [M('If you see six separate letters, you write [[c2|iijjkl]]: the last letter steps forward.'), S('That looks wrong somehow.')]),
      st({ strike: { tgt: true }, groups: { p: { row: 'tgt', side: 'l', spans: [[0, 1], [2, 3], [4, 5]], label: 'three pairs', role: 'c5' } } },
        [M('Most people don’t see six letters. They see three [[c5|pairs]].'), S('Oh. Then the whole last pair should move.')]),
      st({ strike: { tgt: false }, r: { tgt: 'i i j j l l' }, change: { a: null, b: { row: 'tgt', i: 5, label: 'last pair +1' } },
        groups: { q: { row: 'tgt', side: 'r', spans: [[0, 1], [2, 3], [4, 5]], role: 'c5' } } },
        [M('[[c2|iijjll]]. “Letter” quietly became “group”. Copycat’s makers called that kind of shift a [[thread|slippage]].'), S('So the answer depends on how I see the string.')]),
    ],
  });

  MAI.scene({
    id: 'hook-xyz', chapter: 'hook', view: 'strings', title: 'The wall',
    props: { rows: [{ id: 'src', l: 'a b c', r: 'a b d', y: 170 }, { id: 'tgt', l: 'x y z', r: 'x y a', y: 380 }], strip: { items: ALPHA, y: 560, wallLabel: 'no wrap' } },
    steps: [
      st({ rows: { src: 'lr', tgt: 'l?' }, strip: { show: true } }, [S('Fine. Then what does [[c2|xyz]] become?'), M('One rule of this little world: the alphabet doesn’t wrap around.')]),
      st({ walls: { z: { row: 'tgt', i: 2, label: 'no successor' } }, strip: { wall: true, bad: ['z'] }, bad: { tgt: { l: [2] } } },
        [M('So [[c2|z]] has no next letter. The obvious move hits a [[emph|wall]].'), S('Then it’s impossible?')]),
      st({ notes: { a: { x: 70, y: 52, text: 'xyd?  xyy?\nboth feel\nlike cheating', rot: -4 } } },
        [S('xyd? xyy? Those feel like cheating.'), M('They do. Keep the puzzle in the back of your mind. We’ll come back to it at the very end.')]),
    ],
  });

  MAI.scene({
    id: 'hook-title', chapter: 'hook', view: 'title', title: 'Four papers, one question',
    props: {
      kicker: 'analogy · children · AI', title: 'The Relation *Under the Surface*', sub: 'Does a mind see [[thread|the relation]], or just the surface?',
      cards: [{ k: '1995', label: 'Copycat' }, { k: 'TACL 2026', label: 'Children vs. language models' }, { k: 'NeurIPS 2026', label: 'Performance vs. competence' }, { k: 'NeurIPS 2026', label: 'PotARCin' }],
    },
    steps: [
      st({ show: ['kicker', 'title'] }, [M('That old puzzle still says a lot about today’s AI.'), S('How can letter puzzles say anything about AI?')]),
      st({ show: ['kicker', 'title', 'cards'] }, [M('Four papers, three decades apart, ask the same question in four different ways.')]),
      st({ show: ['kicker', 'title', 'cards', 'sub'] }, [M('Does a mind see [[thread|the relation]], or just the surface?'), S('Let’s find out.')]),
    ],
  });

  // ================================================================ DEFINE
  MAI.scene({
    id: 'def-people', chapter: 'define', view: 'figure', title: 'Who asked first',
    props: { items: { 'photo-hofstadter': { x: 30, y: 47, w: 29, rot: -2 }, 'photo-mitchell': { x: 70, y: 47, w: 29, rot: 2 } } },
    steps: [
      st({ show: ['photo-hofstadter'] }, [M('These puzzles come from Douglas Hofstadter, who began designing a program to solve them in the early 1980s.')], { cite: 'memo1984' }),
      st({ show: ['photo-hofstadter', 'photo-mitchell'] }, [M('His student Melanie Mitchell made it work for her PhD: a program called [[thread|Copycat]].'), S('A whole PhD on letter puzzles? Why?')]),
      st({ at: { 'photo-hofstadter': { x: 18, scale: 0.8 }, 'photo-mitchell': { x: 82, scale: 0.8 } }, notes: { q: { x: 36, y: 46, text: 'analogy is not a party trick:\nit is the core of thinking', rot: -3 } } },
        [M('Because analogy isn’t a party trick. To recognise anything, you map something you already know onto it. Seeing is already analogy.'), S('So perception and analogy are the same skill?')], { cite: 'copycat1995' }),
    ],
  });

  MAI.scene({
    id: 'def-transfer', chapter: 'define', view: 'strings', title: 'Same relation, new surface',
    props: { rows: [{ id: 'lat', l: 'a b', r: 'a c', y: 140, label: 'Latin' }, { id: 'gre', l: 'α β', r: 'α γ', y: 290, label: 'Greek' }, { id: 'sym', l: '* @', r: '* %', y: 440, label: 'Symbols' }], strip: { items: SYMBOLS, y: 572 } },
    steps: [
      st({ rows: { lat: 'lr' }, change: { l: { row: 'lat', i: 1, label: 'one step on', lift: 50 } } }, [M('Close enough, for our purposes. Here’s the core move: b becomes c, one step along the alphabet.')]),
      st({ rows: { gre: 'lr' }, change: { g: { row: 'gre', i: 1, label: 'one step on', lift: 50 } } }, [M('Same move in Greek: β becomes γ. The letters changed. The relation didn’t.')]),
      st({ rows: { sym: 'lr' }, change: { s: { row: 'sym', i: 1, label: 'one step on', lift: 50 } }, strip: { show: true, mark: ['@', '%'], hop: ['@', '%', '+1'] } },
        [M('And in a made-up list of symbols: @ becomes %, because % comes next in [[c1|this]] list.'), S('So the relation is what stays the same.')]),
      st({ brackets: { near: { rows: ['gre', 'gre'], label: 'near transfer', role: 'c2', x: 862 }, far: { rows: ['sym', 'sym'], label: 'far transfer', role: 'c3', x: 862 } } },
        [M('Yes. A new alphabet is [[c2|near transfer]]; arbitrary symbols, [[c3|far transfer]]. Every paper ahead changes the surface and checks whether the relation survives.')]),
    ],
  });

  // ================================================================ PAPER 1 · COPYCAT
  MAI.scene({
    id: 'cc-memo', chapter: 'copycat', view: 'figure', title: 'Paper 1 · Copycat', kicker: 'paper 1 · 1984 → 1995',
    props: { items: { 'memo-title': { x: 36, y: 50, w: 46, rot: -1.2 } } },
    steps: [
      st({ show: ['memo-title'] }, [M('Hofstadter first laid out Copycat in this 1984 MIT memo, found today in the Internet Archive.'), S('1984? Before the web!')], { cite: 'memo1984' }),
      st({ zoom: { 'memo-title': [0.04, 0.68, 0.98, 0.9] } },
        [M('The abstract already holds the strange plan: “codelets”, small pieces of code “selected at random to run with probability proportional to… urgencies.”')]),
      st({ zoom: { 'memo-title': null }, at: { 'memo-title': { x: 27, w: 36, rot: -3 } }, notes: { c: { x: 52, y: 44, text: '1995: Hofstadter & Mitchell,\n“The Copycat Project:\na model of mental fluidity\nand analogy-making”', rot: -2 } } },
        [M('With Mitchell it became a working program; the full account came out in 1995.'), S('Why not just write down the rules for these puzzles?')], { cite: 'copycat1995' }),
    ],
  });

  MAI.scene({
    id: 'cc-parts', chapter: 'copycat', view: 'parts', title: 'Four parts, one loop',
    steps: [
      st({ show: ['workspace'] }, [M('Fixed rules break on iijjkk and xyz, so Copycat bends its concepts instead. It has four parts. The [[c1|Workspace]] holds the letters.')], { cite: 'copycat1995' }),
      st({ show: ['workspace', 'slipnet'] }, [M('The [[c5|Slipnet]] holds concepts: first, last, successor, opposite…')]),
      st({ show: ['workspace', 'slipnet', 'coderack'] }, [M('The [[c4|Coderack]] holds a crowd of tiny agents, called codelets, waiting to act.')]),
      st({ show: ['workspace', 'slipnet', 'coderack', 'temperature'] }, [M('And [[c3|temperature]] measures how messy the Workspace is.'), S('And who runs the show?')]),
      st({ loop: true }, [M('Nobody. Concepts send out agents, agents build structures, structures light up concepts, and temperature sets how random the agents are.'), S('A loop with no boss.')]),
    ],
  });

  MAI.scene({
    id: 'cc-slipnet', chapter: 'copycat', view: 'slipnet', title: 'Part 1 · the Slipnet',
    steps: [
      st({ show: 'all', axis: true }, [M('The [[c5|Slipnet]] is long-term memory. Not letters but ideas: first, last, successor, sameness, opposite.'), S('Are they all equal?')], { cite: 'copycat1995' }),
      st({ active: { a: 'flare', opposite: 'linger' } },
        [M('No. Each has a [[c5|depth]]. Shallow ones, like “a”, light up fast and fade fast. Deep ones, like “opposite”, need more evidence, but once lit they linger.')]),
      st({ active: { a: null, opposite: 'on' }, shrink: true, slip: 'start' },
        [M('Links have lengths. When “opposite” is active, every link labelled opposite [[thread|shrinks]].'), S('So first and last get closer?')]),
      st({ slip: 'done' }, [M('Closer means easier to swap. That’s [[thread|conceptual slippage]], built into the geometry.'), S('A map where distances change with what you’re thinking about.')]),
    ],
  });

  MAI.scene({
    id: 'cc-sketch', chapter: 'copycat', view: 'figure', title: 'The 1984 sketch',
    props: { items: { 'memo-slipnet': { x: 38, y: 50, w: 43, rot: 1.2 } } },
    steps: [
      st({ show: ['memo-slipnet'] }, [M('In 1984 Hofstadter drew part of the Slipnet by hand.'), S('It looks like a subway map.')], { cite: ['memo1984', 'p. 18'] }),
      st({ zoom: { 'memo-slipnet': [0.2, 0.1, 0.8, 0.3] } }, [M('Find the pairs at the top: pred and succ, first and last. The same opposites that slip into each other.')]),
      st({ zoom: { 'memo-slipnet': [0.2, 0.78, 0.82, 0.96] } }, [M('And at the bottom, L-most and R-most: leftmost and rightmost. Keep an eye on those two.'), S('Why?')]),
    ],
  });

  MAI.scene({
    id: 'cc-workspace', chapter: 'copycat', view: 'workspace', title: 'Part 2 · the Workspace',
    props: { target: 'i j k' },
    steps: [
      st({ rows: ['top', 'mod', 'tgt'] }, [M('The [[c1|Workspace]] is the puzzle itself, laid out like parts on a workbench.')], { cite: 'copycat1995' }),
      st({ wobble: true }, [S('Why are the letters shaking?'), M('They’re [[emph|unhappy]]: not part of any structure yet. Unhappy objects attract attention.')]),
      st({ desc: true }, [S('Let me guess the first step: a is leftmost, c is rightmost?'), M('Those are [[c1|descriptions]]. The same goes for i and k.')]),
      st({ bonds: { top: 'succ', tgt: 'succ' } }, [M('Then [[c2|bonds]]: b is a’s successor, c is b’s. The same bonds form in ijk.')]),
      st({ groups: { top: 'succ', tgt: 'succ' } }, [M('Bonds that agree become a [[c2|group]], a successor group. Now the letters settle down.')]),
      st({ bridges: 'plain' }, [S('And between the two strings?'), M('[[c1|Bridges]] map one onto the other: a with i, c with k. Rightmost plays the same role as rightmost.')]),
      st({ rule: { k: 'rule', text: 'Replace the **rightmost** letter by its **successor**.' }, answer: 'i j l' },
        [M('Now a rule, read off abc → abd and carried across the bridges: replace the rightmost letter by its successor. ijl.'), S('Same answer as mine, with a lot more machinery.')]),
    ],
  });

  MAI.scene({
    id: 'cc-codelets', chapter: 'copycat', view: 'codelets', title: 'Part 3 · the Coderack',
    steps: [
      st({ rack: true }, [M('The [[c4|Coderack]] is a crowd of tiny agents called codelets. Each has one small job: propose a bond, look for a group, check a bridge.')], { cite: 'copycat1995' }),
      st({ kinds: true }, [S('Who tells them what to do?'), M('Nobody. Noticers wander bottom-up. Seekers are sent top-down by active concepts: if “successor” is lit, more successor-seekers join the rack.')]),
      st({ pick: 4 }, [M('Each codelet has an [[c4|urgency]]. The next one to run is drawn at random, weighted by urgency. Here a successor-bond builder wins the draw.'), S('A lottery with loaded tickets.')], { cite: 'memo1984' }),
    ],
  });

  MAI.scene({
    id: 'cc-scan', chapter: 'copycat', view: 'scan', title: 'The parallel terraced scan',
    steps: [
      st({ tier: 0 }, [M('Many little runs add up to a strategy they called the [[c4|parallel terraced scan]]. First, many quick, cheap looks in every direction.')], { cite: 'copycat1995' }),
      st({ tier: 1 }, [M('Then closer, costlier looks wherever something seems promising.'), S('Like ants: scouts everywhere, then a crowd on the good trail.')]),
      st({ tier: 2 }, [M('Exactly that picture. Only the best-supported idea gets the full effort, and nothing is decided in one place.')]),
    ],
  });

  MAI.scene({
    id: 'cc-temperature', chapter: 'copycat', view: 'temperature', title: 'Part 4 · temperature',
    steps: [
      st({ temp: 92, bars: true }, [M('[[c3|Temperature]] tracks how messy the Workspace is. When it runs hot, the draw is nearly fair: long shots get a real chance.'), S('So hot means wild guessing?')], { cite: 'copycat1995' }),
      st({ temp: 20 }, [M('Hot means open-minded. As structures form it cools, and the most urgent codelets win almost every draw.'), S('So the calmer it gets, the more careful it gets.')]),
      st({ temp: 84, notes: { n: { x: 58, y: 8, text: 'it can heat up again', rot: -3 } } }, [M('And unlike a cup of tea, it can heat up again. Remember that: it’s what cracks xyz.'), S('Okay, I’m ready for xyz.')]),
    ],
  });

  MAI.scene({
    id: 'cc-xyz', chapter: 'copycat', view: 'workspace', title: 'Copycat meets xyz',
    props: { target: 'x y z' },
    steps: [
      st({ rows: ['top', 'mod', 'tgt'], desc: true, bonds: { top: 'succ', tgt: 'succ' }, groups: { top: 'succ', tgt: 'succ' }, bridges: 'plain', temp: 30 },
        [M('Back to xyz. Copycat builds the same scaffolding as before: bonds, a successor group, bridges. The temperature drops.')], { cite: 'copycat1995' }),
      st({ rule: { k: 'rule', text: 'Replace the rightmost letter by its successor.' }, snag: true, temp: 96 },
        [S('And then it reaches for the successor of z…'), M('…and hits the wall. The snag sends the temperature soaring.')]),
      st({ groups: { tgt: null }, bonds: { tgt: null }, bridges: null, rule: null, wobble: true, alpha: true, focus: ['top0', 'tgt2'] },
        [M('Heat loosens everything. The structures break up, and attention goes to the trouble spot: z is the [[c3|last]] letter of the alphabet, just as a is the first.')]),
      st({ slips: ['first ⇄ last'], bridges: 'mirror', wobble: false },
        [M('“Opposite” lights up in the Slipnet, so first can slip to last. A new bridge forms: a with z, c with x.'), S('Like a mirror!')]),
      st({ bonds: { tgt: 'pred' }, groups: { tgt: 'pred' }, slips: ['first ⇄ last', 'rightmost → leftmost', 'successor → predecessor'] },
        [M('Seen from the right, xyz is a [[c5|predecessor]] group running backwards. So rightmost slips to leftmost, and successor to predecessor.')]),
      st({ rule: { k: 'rule, translated', text: 'Replace the **leftmost** letter by its **predecessor**.' }, answer: 'w y z', temp: 12, snag: false, focus: [] },
        [M('Translate the rule through those slippages: replace the leftmost letter by its predecessor. x becomes w: [[thread|wyz]]. The temperature falls.'), S('That’s beautiful.')]),
      st({ slips: null, notes: { n: { x: 60, y: 47, text: 'Copycat finds wyz\nonly now and then,\nmuch like people', rot: -3 } } },
        [S('Does it always find it?'), M('No. Only now and then, much like people. It’s a hard answer to see, which is part of why it feels so good.')], { cite: 'mitchell1993' }),
    ],
  });

  MAI.scene({
    id: 'cc-lesson', chapter: 'copycat', view: 'roles', title: 'The lesson of Copycat',
    props: { sets: ['a b c', 'α β γ', '* @ %'] },
    steps: [
      st({ sockets: true, relation: true, fillers: 'a b c' }, [M('The lesson: keep the [[c1|roles]] (first, last, successor) apart from the [[c4|fillers]], the letters that happen to play them.')], { cite: 'copycat1995' }),
      st({ fillers: 'α β γ' }, [M('Swap in Greek letters, and the roles stay put.')]),
      st({ fillers: '* @ %' }, [S('So with roles kept apart, it would work with any alphabet.'), M('That’s the claim. Paper two checks whether today’s language models can do it.')]),
    ],
  });

  // ================================================================ PAPER 2 · CHILDREN VS. LANGUAGE MODELS
  MAI.scene({
    id: 'p2-claim', chapter: 'children', view: 'cards', title: 'A claim from 2023', kicker: 'paper 2 · background',
    props: {
      items: [
        { id: 'webb', kind: 'card', x: 50, y: 26, w: 62, k: '2023 · Nature Human Behaviour', title: 'GPT-3 solves letter-string analogies better than college students', body: 'Webb, Holyoak & Lu (2023), as summarised by Stevenson et al.' },
        { id: 'cloud', kind: 'plain', x: 50, y: 58, w: 86, body: '`abcdefghijklmnopqrstuvwxyz` `abcdefghijklmnopqrstuvwxyz` `abcdefghijklmnopqrstuvwxyz` `abcdefghijklmnopqrstuvwxyz` `abcdefghijklmnopqrstuvwxyz` `abcdefghijklmnopqrstuvwxyz`', align: 'center' },
        { id: 'shuffled', kind: 'card', x: 50, y: 84, w: 62, role: 'c3', k: 'later studies', body: 'Performance degraded on **shuffled** alphabets and on unfamiliar **symbol** lists, where people did fine.' },
      ],
    },
    steps: [
      st({ show: ['webb'] }, [M('Fast-forward to 2023. A study reported GPT-3 solving letter-string analogies better than college students.'), S('So analogy just emerged from predicting the next word?')], { cite: ['stevenson', '§1'] }),
      st({ show: ['webb', 'cloud'] }, [M('Maybe. Or a shortcut: the alphabet appears endlessly in training text. A model could know abcd by heart without the idea of “successor”.')]),
      st({ show: ['webb', 'cloud', 'shuffled'] }, [M('Hints followed. Models faltered when the alphabet was shuffled, or swapped for unfamiliar symbols. People didn’t.'), S('So how do you test that properly?')]),
    ],
  });

  MAI.scene({
    id: 'p2-paper', chapter: 'children', view: 'figure', title: 'Paper 2 · children vs. language models', kicker: 'paper 2 · TACL 2026',
    props: { items: { 'p2-title': { x: 50, y: 38, w: 82 } } },
    steps: [
      st({ show: ['p2-title'] }, [M('With children. Paper two, by Claire Stevenson, Alexandra Pafford, Han van der Maas and Melanie Mitchell, asks if models generalise analogies like children can.'), S('Why children?')], { cite: 'stevenson' }),
      st({ zoom: { 'p2-title': [0.0, 0.0, 1.0, 0.33] } }, [M('Analogy shows up early in childhood and transfers easily. And Greek letters were new to these children, so transfer is a real test.')]),
    ],
  });

  MAI.scene({
    id: 'p2-who', chapter: 'children', view: 'people', title: 'Who took part',
    steps: [
      st({ show: ['children'] }, [M('They tested 42 children aged 7 to 9…')], { cite: ['stevenson', '§2'] }),
      st({ show: ['children', 'adults'] }, [M('…62 adults…')]),
      st({ show: ['children', 'adults', 'models'] }, [M('…and four language models, each run 55 times, given the instructions the children heard plus one worked example.'), S('Kids against GPT-4o. I like it.')]),
    ],
  });

  MAI.scene({
    id: 'p2-items', chapter: 'children', view: 'figure', title: 'One puzzle, three alphabets',
    props: { items: { 'p2-item-latin': { x: 50, y: 46, w: 58 }, 'p2-item-greek': { x: 62, y: 50, w: 58 }, 'p2-item-symbol': { x: 62, y: 50, w: 58 } } },
    steps: [
      st({ show: ['p2-item-latin'] }, [M('Every puzzle came in three versions. Here is item 1 as people saw it: ab → ac, gh → ?, with the whole alphabet on screen.')], { cite: ['stevenson', 'Figure 2'] }),
      st({ show: ['p2-item-latin', 'p2-item-greek'], at: { 'p2-item-latin': { x: 19, y: 20, w: 30 } } }, [M('The same item in Greek: [[c2|near transfer]].'), S('Those are new to the kids, right?')]),
      st({ show: ['p2-item-latin', 'p2-item-greek', 'p2-item-symbol'], at: { 'p2-item-greek': { x: 19, y: 50, w: 30 } } },
        [M('Right. And in an invented list of symbols: [[c3|far transfer]].'), S('So @ to % is one step, because % comes after @ in that list?')]),
      st({ at: { 'p2-item-symbol': { x: 19, y: 80, w: 30 } }, notes: { a: { x: 40, y: 20, text: '→  g i', rot: -2 }, b: { x: 40, y: 50, text: '→  ζ θ', rot: -2 }, c: { x: 40, y: 80, text: '→  ~ {', rot: -2 } } },
        [M('Exactly. Five items per alphabet, fifteen in all, and the list was always shown. Here are the answers.')], { cite: ['stevenson', '§2; the figure’s list ends “? : ]”, the text gives “? = :”'] }),
    ],
  });

  // ================================================================ TURN (night)
  const P2_SERIES = [ // Stevenson et al. (2026), Table 2: mean proportion correct (Latin, Greek, Symbol)
    { name: 'adults', role: 'c2', values: [0.88, 0.91, 0.89], group: 'humans' },
    { name: 'children 7–9', role: 'c2', values: [0.62, 0.66, 0.67], group: 'humans', hollow: true, dashed: true },
    { name: 'GPT-4o', role: 'c3', values: [0.85, 0.63, 0.48], group: 'models' },
    { name: 'Claude-3.5', role: 'c3', values: [0.68, 0.62, 0.46], group: 'models', dashed: true },
    { name: 'Llama-3.1 405B', role: 'c3', values: [0.79, 0.74, 0.27], group: 'models', hollow: true },
    { name: 'Gemma-2 27B', role: 'c3', values: [0.6, 0.39, 0.14], group: 'models', hollow: true, dashed: true },
  ];
  MAI.scene({
    id: 'p2-results', chapter: 'turn', view: 'lines', title: 'The drop',
    props: { cats: ['Latin', 'Greek', 'Symbols'], series: P2_SERIES, box: [150, 80, 520, 440], yLabel: 'proportion correct' },
    steps: [
      st({ upto: 0 }, [M('Results. The familiar Latin alphabet first: adults 88 percent, GPT-4o 85, Llama 79, Claude 68, children 62, Gemma 60.'), S('So the models beat the kids.')], { cite: ['stevenson', 'Table 2'] }),
      st({ upto: 1 }, [S('Now the Greek letters.'), M('Adults 91, children 66. GPT-4o drops to 63; Gemma to 39.')]),
      st({ upto: 2 }, [S('And the symbols?'), M('Adults 89. Children 67. GPT-4o 48, Claude 46, Llama 27, Gemma 14.')]),
      st({ focus: 'humans' }, [S('The kids’ line is flat!'), M('Both human lines stay [[c2|flat]]. Changing the alphabet barely mattered to people.')]),
      st({ focus: 'models' }, [M('Every model’s line [[c3|falls]], Latin to Greek, and again to symbols. On symbols, the children beat every model.')]),
    ],
  });

  MAI.scene({
    id: 'p2-fig', chapter: 'turn', view: 'figure', title: 'As the paper plots it',
    props: { items: { 'p2-results': { x: 50, y: 48, w: 60 } } },
    steps: [
      st({ show: ['p2-results'] }, [M('The same means as the paper plots them, with error bars. Browns are people, blues are models.'), S('The blue bars shrink alphabet by alphabet.')], { cite: ['stevenson', 'Figure 1'] }),
    ],
  });

  MAI.scene({
    id: 'p2-why', chapter: 'turn', view: 'ops', title: 'Which rules break',
    props: {
      list: SYMBOLS,
      rows: [
        { op: 'repeat', example: '! ^ → ! ^ ^', hop: ['^', '^'], marks: ['^'], verdict: 'transfers', ok: true },
        { op: 'two steps on', example: '@ % → @ ^', hop: ['%', '^'], marks: ['%', '^'], verdict: 'models stumble', ok: false },
        { op: 'one step back', example: '^ # → ! #', hop: ['^', '!'], marks: ['^', '!'], verdict: 'models stumble', ok: false },
      ],
    },
    steps: [
      st({ rows: 1 }, [S('But why? The list was right there on screen.'), M('They tested each rule on its own. Repeating a symbol needs no list at all…')], { cite: ['stevenson', '§3.3.3, Figure 5'] }),
      st({ rows: 3 }, [M('…but two steps along the list, or one step back, needs the list as an [[c1|ordered]] thing.')]),
      st({ verdicts: true }, [M('Repetition carried over to new alphabets. Two-steps-on and one-step-back did not: that’s where the models stumbled.'), S('Even with the list on screen.')]),
    ],
  });

  MAI.scene({
    id: 'p2-rulefig', chapter: 'turn', view: 'figure', title: 'Each rule on its own',
    props: { items: { 'p2-rulecheck': { x: 50, y: 48, w: 58 } } },
    steps: [
      st({ show: ['p2-rulecheck'] }, [M('Their Rule Check figure: one panel per model, one bar per rule, Latin, Greek and symbols side by side.'), S('The bars sag on the symbol side, for some rules far more than others.')], { cite: ['stevenson', 'Figure 5'] }),
    ],
  });

  MAI.scene({
    id: 'p2-literal', chapter: 'turn', view: 'strings', title: 'Glued to the letters',
    props: { rows: [{ id: 'ex', l: 'a b', r: 'a c c', y: 180 }, { id: 'ans', l: 'g h', r: 'g i i', y: 400 }] },
    steps: [
      st({ rows: { ex: 'lr', ans: 'l?' } }, [M('One more clue. Take ab → acc. What should gh become?'), S('gii: next letter, then repeat it.')]),
      st({ rows: { ans: 'lr' }, hl: { ans: { r: [1, 2] } } }, [M('That’s what people answer.')], { cite: ['stevenson', '§5'] }),
      st({ r: { ans: 'g c c' }, hl: { ans: { r: [] } }, bad: { ans: { r: [1, 2] } }, notes: { n: { x: 74, y: 80, text: 'literal: copies the c', rot: -3, role: 'emph' } } },
        [M('But models sometimes copied the change [[emph|literally]]: gcc. Between 5 and 21 percent of their answers, depending on the model. People never did.'), S('So kids carry the relation. Models leave it glued to the letters.')]),
    ],
  });

  // ================================================================ PAPER 3 · PERFORMANCE VS. COMPETENCE
  const fill = D.arc_fill;
  MAI.scene({
    id: 'p3-arc', chapter: 'competence', view: 'arc', title: 'A harder world: ARC',
    props: { pairs: fill.train.slice(1, 4), test: fill.test, testStart: 'input', perColumn: true, cell: 16 },
    steps: [
      st({ pairs: 3 }, [M('Same question, harder world: [[c1|ARC]], François Chollet’s 2019 benchmark. A few demonstration grids show a change…')], { cite: 'chollet2019' }),
      st({ test: true }, [M('…and you produce the output for a new grid.'), S('Easy: fill the closed green shapes with yellow.')]),
      st({ answer: 'fill' }, [M('Right. Each task hides one rule like that, built on core knowledge: objects, inside and outside, counting.')], { cite: ['beger', '§1'] }),
      st({ notes: { n: { x: 4, y: 88, text: 'reasoning models now score above people here', rot: -2 } } },
        [M('And AI reasoning models have since passed human performance on this original ARC.'), S('So abstraction is solved?')], { cite: ['beger', 'abstract'] }),
    ],
  });

  MAI.scene({
    id: 'p3-paper', chapter: 'competence', view: 'figure', title: 'Paper 3 · performance vs. competence', kicker: 'paper 3 · NeurIPS 2026',
    props: { items: { 'p3-title': { x: 50, y: 44, w: 70 } } },
    steps: [
      st({ show: ['p3-title'] }, [M('Paper three, from Claas Beger, Ryan Yi, Melanie Mitchell and colleagues, asks whether that score means what it seems to.'), S('What else could it mean?')], { cite: 'beger' }),
    ],
  });

  MAI.scene({
    id: 'p3-pvc', chapter: 'competence', view: 'cards', title: 'Two different things',
    props: {
      items: [
        { id: 'perf', kind: 'card', x: 29, y: 34, w: 36, k: 'performance', title: 'the score', body: 'what you can observe: accuracy on a test', icon: 'icon.watch', iconW: 4.5 },
        { id: 'comp', kind: 'card', x: 71, y: 34, w: 36, k: 'competence', title: 'the ability', body: 'what the score is meant to measure', icon: 'icon.magnifier', iconW: 4.5, role: 'c1' },
        { id: 'key', kind: 'quote', x: 50, y: 70, w: 70, body: 'Memorise the answer key, and the score goes up without the ability.' },
        { id: 'hist', kind: 'plain', x: 50, y: 92, w: 92, align: 'center', body: 'The terms are famous from Chomsky’s linguistics; the paper takes them from Korossy’s work on modelling knowledge as competence and performance.' },
      ],
    },
    steps: [
      st({ show: ['perf'] }, [M('Cognitive science separates two things. [[c4|Performance]] is what you can observe: the score.')], { cite: ['beger', '§1'] }),
      st({ show: ['perf', 'comp'] }, [M('[[c1|Competence]] is the ability the score is supposed to measure. Usually they travel together. Not always.')]),
      st({ show: ['perf', 'comp', 'key'] }, [S('Like memorising the answer key?'), M('Exactly: performance without competence. The paper asks how much of the models’ ARC score is that.')]),
      st({ show: ['perf', 'comp', 'key', 'hist'] }, [M('The pair of words is old. Linguists know it from Chomsky; this paper takes it from Korossy’s work on measuring knowledge.')]),
    ],
  });

  const CONCEPTS = ['Above / Below', 'Center', 'Clean Up', 'Complete Shape', 'Copy', 'Count', 'Extend to Boundary', 'Extract Objects',
    'Filled / Not Filled', 'Horizontal / Vertical', 'Inside / Outside', 'Move to Boundary', 'Order', 'Same / Different', 'Top / Bottom 2D', 'Top / Bottom 3D'];
  const cid = (c) => c.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  MAI.scene({
    id: 'p3-concepts', chapter: 'competence', view: 'cards', title: 'ConceptARC',
    props: { items: CONCEPTS.map((c, i) => ({ id: cid(c), kind: 'stamp', x: 14 + (i % 4) * 24, y: 18 + Math.floor(i / 4) * 19, w: 21, align: 'center', body: c, role: 'c1' })) },
    steps: [
      st({ show: CONCEPTS.map(cid) }, [M('To find out, they used [[c1|ConceptARC]]: 16 basic concepts, like inside versus outside, with 30 tasks each. 480 tasks, simpler than ARC.')], { cite: ['beger', '§3'] }),
      st({ hl: ['top-bottom-2d', 'center'], dim: CONCEPTS.map(cid).filter((c) => c !== 'top-bottom-2d' && c !== 'center') },
        [M('Two of them star in the paper’s first figure: Top / Bottom and Center.')], { cite: 'conceptarc' }),
    ],
  });

  MAI.scene({
    id: 'p3-examples', chapter: 'competence', view: 'figure', title: 'Two ConceptARC tasks',
    props: { items: { 'p3-examples': { x: 50, y: 46, w: 94 } } },
    steps: [
      st({ show: ['p3-examples'] }, [M('Here they are, from the paper. Each task: a few demonstrations, then a test.'), S('Top row: delete the top and bottom shapes. Bottom row: pick the middle colour.')], { cite: ['beger', 'Figure 1'] }),
    ],
  });

  MAI.scene({
    id: 'p3-cells', chapter: 'competence', view: 'cells', title: 'What a model sees',
    props: { grid: D.conceptarc_topbottom.train[0].input },
    steps: [
      st({ mode: 'color' }, [S('How do the models actually see a grid like this?')]),
      st({ mode: 'digits', text: true }, [M('Usually as text: each colour becomes a digit, 0 to 9, written out row by row.'), S('So we see shapes, and they see a spreadsheet.')], { cite: ['beger', '§3'] }),
    ],
  });

  MAI.scene({
    id: 'p3-design', chapter: 'competence', view: 'cards', title: 'The experiment',
    props: {
      items: [
        { id: 'f1', kind: 'stamp', x: 20, y: 14, w: 26, align: 'center', body: 'text  or  image' },
        { id: 'f2', kind: 'stamp', x: 50, y: 14, w: 30, align: 'center', body: 'low  or  medium effort' },
        { id: 'f3', kind: 'stamp', x: 80, y: 14, w: 26, align: 'center', body: 'no tools  or  Python' },
        { id: 'models', kind: 'plain', x: 50, y: 28, w: 80, align: 'center', body: 'reasoning models: o3, Claude Sonnet 4, Gemini 2.5 Pro · and people' },
        { id: 'rule', kind: 'card', x: 50, y: 47, w: 56, align: 'center', role: 'thread', title: 'Every solver also writes its rule in words.' },
        { id: 'g1', kind: 'stamp', x: 20, y: 74, w: 26, align: 'center', role: 'c2', body: 'correct · intended' },
        { id: 'g2', kind: 'stamp', x: 50, y: 74, w: 30, align: 'center', role: 'c4', body: 'correct · unintended' },
        { id: 'g3', kind: 'stamp', x: 80, y: 74, w: 26, align: 'center', role: 'emph', body: 'incorrect' },
        { id: 'gx', kind: 'plain', x: 50, y: 88, w: 80, align: 'center', body: 'fits the demos for the right reason · fits them for another reason · doesn’t fit them' },
      ],
    },
    steps: [
      st({ show: ['f1', 'f2', 'f3', 'models'] }, [M('Three dials: text or image, low or medium reasoning effort, with or without Python. Three reasoning models, plus people.')], { cite: ['beger', '§3'] }),
      st({ show: ['f1', 'f2', 'f3', 'models', 'rule'] }, [M('And every solver, human or model, had to write down its [[thread|rule]] in words.'), S('So you can check the reasoning, not just the answer.')]),
      st({ show: ['f1', 'f2', 'f3', 'models', 'rule', 'g1', 'g2', 'g3', 'gx'] },
        [M('People graded every rule: [[c2|correct and intended]], [[c4|correct but unintended]] (right on the demos for the wrong reason), or [[emph|incorrect]].')]),
    ],
  });

  const tb = D.conceptarc_topbottom;
  const tbRule = (k, who, role) => ({ who, role, text: tb.rules[k].text, runs: tb.rules[k].runs });
  MAI.scene({
    id: 'p3-rules', chapter: 'competence', view: 'arc', title: 'Run the rules',
    props: {
      pairs: tb.train, test: tb.test,
      rules: { human: tbRule('human', 'a person', 'c2'), claude: tbRule('claude', 'Claude Sonnet 4', 'c2'), gemini: tbRule('gemini', 'Gemini 2.5 Pro', 'c4'), o3: tbRule('o3', 'o3', 'emph') },
      area: [40, 64, 920, 380], cell: 14,
    },
    steps: [
      st({ pairs: 3, test: true }, [M('Here is that first task, for real: three demos and a test.'), S('Delete the top shape and the bottom shape. Done.')], { cite: 'conceptarc' }),
      st({ rule: 'human', runTest: true }, [M('That’s what a person wrote. We ran it as code: it reproduces every demo and the test. [[c2|Correct and intended.]]')], { cite: 'runs' }),
      st({ rule: 'gemini', runTest: false }, [M('Gemini 2.5 Pro wrote this: sort shapes by size, then by colour number, and delete the first two. Run it: every demo comes out right.'), S('Wait, colour numbers? Those are just labels!')]),
      st({ runTest: true }, [M('Exactly: a pattern that exists only because colours were written as digits. [[c4|Correct but unintended]], and on the test it deletes the wrong shape.')]),
      st({ rule: 'o3' }, [M('o3’s rule, “remove all the smallest objects”, already fails the second demo, where a small middle shape must stay. [[emph|Incorrect.]]')]),
      st({ rule: 'claude' }, [M('Claude Sonnet 4: remove the topmost and bottommost coloured regions. The person’s idea in grid words: [[c2|correct and intended]].'), S('Same score, very different understanding.')]),
    ],
  });

  const ce = D.conceptarc_center;
  const cePairs = ce.items.map((r, i) => ({ input: [r], output: [[ce.truth[i]]] }));
  MAI.scene({
    id: 'p3-center', chapter: 'competence', view: 'arc', title: 'Right answer, wrong reason',
    props: {
      layout: 'rows', pairs: cePairs.slice(0, ce.n_train), tests: cePairs.slice(ce.n_train), cell: 30, area: [30, 40, 940, 380],
      rules: { claude: { who: 'Claude Sonnet 4', role: 'c4', text: ce.claude_text,
        runs: ce.claude.map((v, i) => ({ output: [[v]], ok: v === ce.truth[i], wrong: v === ce.truth[i] ? [] : [[0, 0]] })) } },
    },
    steps: [
      st({ pairs: 3 }, [M('The second task: a row of colours, and the answer is the one in the [[c1|middle]].'), S('Easy.')], { cite: 'conceptarc' }),
      st({ rule: 'claude', tests: 1, runTest: true }, [M('Claude wrote a rule about the [[c4|rarest]] colours instead. It fits all three demos, and the test.')], { cite: 'runs' }),
      st({ tests: 3 }, [M('The paper graded it correct but unintended. We ran it on the task’s two other test rows. One of them breaks it.'), S('Because nothing made the shortcut hold.')]),
    ],
  });

  MAI.scene({
    id: 'p3-numeric', chapter: 'competence', view: 'figure', title: 'Digits as hidden clues',
    props: { items: { 'p3-numeric': { x: 50, y: 46, w: 94 } } },
    steps: [
      st({ show: ['p3-numeric'] }, [M('Colour numbers again, in another task. o3’s rule leans on which colour has the larger digit, which fits the demos only by coincidence.'), S('So the digits became a hidden clue.')], { cite: ['beger', 'appendix: correct-unintended rules'] }),
    ],
  });

  MAI.scene({
    id: 'p3-score', chapter: 'competence', view: 'bars', title: 'The score, and what’s inside it',
    props: {
      box: [200, 90, 600, 400], max: 100, fill: 0.62, labelSize: 18,
      groups: [
        { label: 'o3 · text · medium effort', bars: [{ v: 77.1, role: 'c1', layer: 0, text: '77.1' }, { v: 27, role: 'c3', layer: 1, text: '≈27' }] },
        { label: 'people · images', bars: [{ v: 73, role: 'c2', layer: 0, text: '73' }, { v: 7, role: 'c3', layer: 1, text: '≈7' }] },
      ],
      legend: [{ name: 'output grids correct', role: 'c1', layer: 0 }, { name: 'of those: rule unintended or wrong', role: 'c3', layer: 1 }], legendX: 200, legendGap: 300,
    },
    steps: [
      st({ layer: 0 }, [M('Across all 480 tasks, in text, o3 at medium effort got 77.1 percent of grids right. People, working from pictures: 73.'), S('So o3 wins.')], { cite: ['beger', 'Table 1'] }),
      st({ layer: 1 }, [M('On the score. But about [[c3|27 percent]] of o3’s correct grids rested on unintended or wrong rules. For people, about 7.')], { cite: ['beger', '§4'] }),
    ],
  });

  MAI.scene({
    id: 'p3-fig2', chapter: 'competence', view: 'figure', title: 'Inside every bar',
    props: { items: { 'p3-rules': { x: 50, y: 46, w: 94 } } },
    steps: [
      st({ show: ['p3-rules'] }, [M('The paper’s Figure 2 splits every bar by rule. [[c2|Green]]: right for the intended reason. [[c4|Yellow]]: right for another reason. [[emph|Red]]: wrong rule.')], { cite: ['beger', 'Figure 2'] }),
      st({ mark: { 'p3-rules': [0.535, 0.02, 0.865, 0.98] } }, [M('Now the visual side. Few correct grids, but look inside the wrong-grid bars: plenty of green. Right rule, botched grid.'), S('So they saw it, and still drew it wrong.')]),
    ],
  });

  MAI.scene({
    id: 'p3-words', chapter: 'competence', view: 'figure', title: 'Objects versus cells',
    props: { items: { 'p3-terms': { x: 50, y: 46, w: 70 } } },
    steps: [
      st({ show: ['p3-terms'] }, [M('You can hear it in the words. People’s rules mostly talk about [[c1|objects and shapes]]. The models’ rules mostly talk about [[c3|cells, rows and values]].'), S('Objects versus spreadsheets.')], { cite: ['beger', 'Figure 3'] }),
    ],
  });

  MAI.scene({
    id: 'p3-images', chapter: 'competence', view: 'bars', title: 'Pictures instead of numbers',
    props: {
      box: [130, 90, 740, 400], max: 100, fill: 0.5, labelSize: 15,
      groups: [
        { label: 'text', bars: [{ v: 77.1, role: 'c1', layer: 0, text: '77.1' }] },
        { label: 'image', bars: [{ v: 5.6, role: 'c1', layer: 0, text: '5.6' }] },
        { label: 'image + Python', bars: [{ v: 29.2, role: 'c1', layer: 1, text: '29.2' }] },
        { label: 'image + Python: intended rules', bars: [{ v: 40, role: 'c2', layer: 2, text: '40.0' }] },
      ],
    },
    steps: [
      st({ layer: 0 }, [S('Then show them pictures, like people get.'), M('They did. With images and no tools, o3’s accuracy fell to 5.6 percent.')], { cite: ['beger', 'Table 1 (o3, medium effort)'] }),
      st({ layer: 1 }, [S('What if it could measure the picture instead of eyeballing it?'), M('That’s the Python setting: o3 writes computer-vision code to measure the grid. Accuracy climbs to 29.2 percent.'), S('A prosthetic eye!')]),
      st({ layer: 2 }, [M('And there, 40 percent of its rules were the intended ones: more than the 29.2 percent of grids it got right.'), S('So it understood more than it showed.')], { cite: ['beger', '§4'] }),
    ],
  });

  MAI.scene({
    id: 'p3-misread', chapter: 'competence', view: 'cells', title: 'Botched grids',
    props: { grid: D.conceptarc_topbottom.train[0].input },
    steps: [
      st({ mode: 'picture', misread: true, notes: { n: { x: 60, y: 92, text: 'illustration', rot: 0 } } },
        [M('Often the models couldn’t even read the grid’s size off the picture, so the answer came out the wrong shape.'), S('Like copying a crossword by eye.')], { cite: ['beger', '§4'] }),
    ],
  });

  MAI.scene({
    id: 'p3-errors', chapter: 'competence', view: 'figure', title: 'What went wrong',
    props: { items: { 'p3-errors': { x: 50, y: 47, w: 58 } } },
    steps: [
      st({ show: ['p3-errors'] }, [M('The paper counts o3’s errors. In the visual setting, most are plain mismatches: a wrong cell or wrong dimensions. A few are formatting slips.')], { cite: ['beger', 'appendix: error types'] }),
    ],
  });

  MAI.scene({
    id: 'p3-lesson', chapter: 'competence', view: 'cards', title: 'Misleading both ways',
    props: {
      items: [
        { id: 'a', kind: 'card', x: 29, y: 45, w: 36, role: 'c3', k: 'text', title: 'score > understanding', body: 'right grids, often for unintended reasons' },
        { id: 'b', kind: 'card', x: 71, y: 45, w: 36, role: 'c1', k: 'images', title: 'score < understanding', body: 'intended rules, botched grids' },
      ],
    },
    steps: [
      st({ show: ['a', 'b'] }, [S('So accuracy misleads both ways?'), M('Yes. In text it [[c3|overestimates]] understanding. In images it [[c1|underestimates]] it. The score alone can’t tell you which.')], { cite: ['beger', 'abstract'] }),
    ],
  });

  // ================================================================ PAPER 4 · POTARCIN
  MAI.scene({
    id: 'p4-potemkin', chapter: 'potarcin', view: 'potemkin', title: 'Potemkin villages', kicker: 'paper 4 · background',
    steps: [
      st({ carriage: true }, [S('So what would real understanding look like?'), M('Start with a legend. In 1787, Catherine the Great toured Crimea, and Grigory Potemkin supposedly lined her route with fake village fronts.')], { cite: 'potemkin' }),
      st({ behind: true, notes: { b: { x: 60, y: 30, text: 'seen from behind:\nprops, and nothing else', rot: -3 } } }, [M('Perfect fronts, nothing behind. Historians think the story is exaggerated, but the name stuck.'), S('A [[c3|Potemkin village]].')]),
      st({ notes: { b: null, n: { x: 18, y: 8, text: 'Potemkin understanding: ace the hard question,\nfail easy uses of the same idea', rot: -1 } } },
        [M('In 2025, Mancoridis and colleagues named the AI version [[c3|Potemkin understanding]]: acing the hard question while failing easy uses of the same idea.')], { cite: 'mancoridis' }),
    ],
  });

  MAI.scene({
    id: 'p4-paper', chapter: 'potarcin', view: 'figure', title: 'Paper 4 · PotARCin', kicker: 'paper 4 · NeurIPS 2026',
    props: { items: { 'p4-title': { x: 50, y: 42, w: 74 } } },
    steps: [
      st({ show: ['p4-title'] }, [M('Paper four: [[thread|PotARCin]], from Claas Beger, Ryan Yi and Melanie Mitchell. Potemkin plus ARC.'), S('ARC answers that are only facades?')], { cite: 'potarcin' }),
      st({ mark: { 'p4-title': [0, 0, 1, 0.5] } }, [M('That’s the worry. Their test: if you’ve really learned a rule, you can [[thread|use]] it in more than one way.')]),
    ],
  });

  const FIVE = ['definition', 'classification', 'generation', 'editing', 'inversion'];
  MAI.scene({
    id: 'p4-five', chapter: 'potarcin', view: 'fiveuses', title: 'Five uses of one rule',
    steps: [
      st({ dim: 'standard' }, [M('Take one ARC task. The standard test asks for one thing: the output grid for the test input.')], { cite: ['potarcin', '§2; grids: our illustration on task 00d62c1b'] }),
      st({ list: true, dim: 'definition' }, [M('PotARCin asks for five more. One, [[c1|definition]]: write the rule as a program. It’s run on the demos, the test, and freshly generated examples, 50 from the task’s own generator.')]),
      st({ dim: 'classification', done: FIVE.slice(0, 1) }, [M('Two, [[c1|classification]]: here are five new pairs. Which follow the rule? Some are subtly broken. All five judgements must be right.')]),
      st({ dim: 'generation', done: FIVE.slice(0, 2) }, [M('Three, [[c1|constrained generation]]: invent a new valid pair that meets a condition. A verifier program checks it.'), S('Making your own example. Nice.')]),
      st({ dim: 'editing', done: FIVE.slice(0, 3) }, [M('Four, [[c1|editing]]: repair a broken pair while changing as little as possible.'), S('Fix the two wrong cells, leave the rest alone.')]),
      st({ dim: 'inversion', done: FIVE.slice(0, 4) }, [M('Five, [[c1|inversion]]: given only an output, build an input that would produce it.'), S('Define it, check it, make one, fix one, run it backwards.')]),
      st({ dim: 'full', done: FIVE }, [M('Pass all five and you pass the [[thread|full task]]. Every example and every check comes from code: a generator and a verifier for each task.')]),
    ],
  });

  MAI.scene({
    id: 'p4-overview', chapter: 'potarcin', view: 'figure', title: 'The paper’s own picture',
    props: { items: { 'p4-overview': { x: 50, y: 46, w: 88 } } },
    steps: [
      st({ show: ['p4-overview'] }, [M('The paper’s figure uses task 890034e9. GPT-5.4 solved its standard test, then [[c3|failed every one]] of the five other uses.'), S('Front perfect, nothing behind.')], { cite: ['potarcin', 'Figure 1'] }),
    ],
  });

  MAI.scene({
    id: 'p4-corrupt', chapter: 'potarcin', view: 'figure', title: 'Where broken pairs come from',
    props: {
      items: {
        'p4-human': { x: 16, y: 35, w: 21, rot: -1.5 }, 'p4-verifier': { x: 39, y: 35, w: 21, rot: 1 }, 'p4-mismatch': { x: 62, y: 35, w: 21, rot: -1 },
        'p4-flip': { x: 32, y: 80, w: 30, rot: 1 }, 'p4-retrieval': { x: 66, y: 80, w: 30, rot: -1 },
      },
    },
    steps: [
      st({ show: ['p4-human', 'p4-verifier', 'p4-mismatch', 'p4-flip', 'p4-retrieval'] },
        [S('Where do the broken pairs come from?'), M('Five sources: real [[c3|human errors]], verifier programs with planted bugs, flipped colours, look-alikes from other tasks, and outputs swapped between instances.')], { cite: ['potarcin', '§2, Figures 4–5'] }),
      st({ at: { 'p4-human': { x: 30, y: 50, w: 38, z: 5, rot: -1 } } },
        [M('In general, the hardest to catch were real human mistakes. On the public ARC tasks, models waved 8 to 31 percent of them through as valid.')], { cite: ['potarcin', 'failure rates by corruption type'] }),
    ],
  });

  const MODELS = ['GPT-5.4', 'Gemini 3.1 Pro', 'Claude Opus 4.6', 'Kimi K2.5', 'MiniMax M2.5'];
  const T3_ARC = [[84.2, 46.6], [89.1, 58.2], [87.6, 37.6], [63.4, 38.6], [72.9, 20.6]];
  const T3_PARC = [[31, 6], [45, 4], [64, 8], [17, 2], [24, 1]];
  const potBars = (rows) => MODELS.map((m, i) => ({ label: m, bars: [{ v: rows[i][0], role: 'c1', layer: 0 }, { v: rows[i][1], role: 'c3', layer: 1 }] }));
  const potLegend = [{ name: 'standard test: output grid', role: 'c1', layer: 0 }, { name: 'PotARCin: all five uses', role: 'c3', layer: 1 }];
  MAI.scene({
    id: 'p4-results', chapter: 'potarcin', view: 'bars', title: 'The gap',
    props: { box: [80, 90, 840, 400], groups: potBars(T3_ARC), legend: potLegend, legendX: 80, legendGap: 330, labelSize: 15 },
    steps: [
      st({ layer: 0 }, [S('So how did the models do?'), M('On 400 public ARC-AGI-1 tasks, the three big proprietary models get 84 to 89 percent of output grids right.')], { cite: ['potarcin', 'Table 3'] }),
      st({ layer: 1 }, [S('And with all five uses?'), M('The best model passes 58 percent of tasks in full. The weakest, 21. Drops of 25 to 52 points.')]),
      st({ hl: [1, 2] }, [S('Gemini and Claude look tied on the standard test.'), M('Neck and neck, 89 and 88. On all five uses, Gemini leads by 21 points.')]),
      st({ hl: [2, 3] }, [M('And Kimi K2.5, weakest on the standard test at 63, edges past Claude on all five: 38.6 to 37.6.'), S('So the leaderboard order isn’t the competence order.')]),
    ],
  });

  MAI.scene({
    id: 'p4-luck', chapter: 'potarcin', view: 'budget', title: 'Just more chances to slip?',
    props: {
      lanes: [
        { name: 'one dimension, sampled five times', items: ['same', 'same', 'same', 'same', 'same'], value: 20.2, role: 'c4' },
        { name: 'five different dimensions, once each', items: ['define', 'classify', 'generate', 'edit', 'invert'], value: 25.5, role: 'thread' },
      ],
      p: 'same budget · 20 tasks · task-paired t-test p = 0.030',
    },
    steps: [
      st({ lanes: 2 }, [S('Isn’t that just five chances to slip up?'), M('They checked, on the 20 tasks GPT-5.4 had fully passed, spending the same evaluation budget two ways.')], { cite: ['potarcin', '§3.1'] }),
      st({ bars: true }, [M('Five different questions exposed a failure in [[thread|25.5 percent]] of trials. One question asked five times: 20.2 percent. Different uses find different cracks.')]),
    ],
  });

  MAI.scene({
    id: 'p4-self', chapter: 'potarcin', view: 'bars', title: 'Contradicting its own code',
    props: {
      box: [260, 100, 480, 380], max: 100, fill: 0.55, labelSize: 16,
      groups: [
        { label: 'its other answer was right', bars: [{ v: 99.1, role: 'c2', layer: 0, text: '99.1' }] },
        { label: 'its other answer was wrong', bars: [{ v: 21.1, role: 'c3', layer: 1, text: '21.1' }] },
      ],
      legend: [{ name: 'agrees with its own correct Definition code (ARC-AGI-1)', role: 'ink', layer: 0 }], legendX: 260,
    },
    steps: [
      st({ layer: 0 }, [M('Stranger still. Take cases where a model wrote correct code for the rule. When its answer in another dimension was also right, the two agreed 99.1 percent of the time.')], { cite: ['potarcin', '§3.4, Table 4'] }),
      st({ layer: 1 }, [M('When its other answer was wrong, it agreed with its own correct code only [[c3|21.1 percent]] of the time.'), S('It doesn’t believe its own code?'), M('It doesn’t [[c3|use]] it.')]),
    ],
  });

  MAI.scene({
    id: 'p4-churn', chapter: 'potarcin', view: 'venn', title: 'The wins wobble',
    props: { a: 'run 1', b: 'run 2', na: 185, nb: 188, shared: 146, jaccard: 'overlap (Jaccard) 0.64' },
    steps: [
      st({ stage: 1 }, [M('Even the passes wobble. GPT-5.4 passed all five uses on 185 tasks in one run…')], { cite: ['potarcin', 'Table 7'] }),
      st({ stage: 2 }, [M('…and on 188 in another.'), S('Nearly the same, then.')]),
      st({ stage: 3 }, [M('Same totals, different tasks: only 146 passed both times.'), S('So a pass today says little about a pass tomorrow.')]),
    ],
  });

  MAI.scene({
    id: 'p4-sampling', chapter: 'potarcin', view: 'figure', title: 'Ask again, and again',
    props: { items: { 'p4-sampling': { x: 50, y: 47, w: 56 } } },
    steps: [
      st({ show: ['p4-sampling'] }, [M('Push harder: 20 tasks GPT-5.4 had fully passed, each re-sampled ten times with fresh examples. It failed at least once on 15 of the 20.')], { cite: ['potarcin', '§3.2, Figure 3'] }),
      st({ mark: { 'p4-sampling': [0.1, 0.0, 1.0, 0.93] } }, [M('The steepest line is the share that passed [[c3|every]] sample: 65 percent after one, 25 after ten.'), S('The more you look, the more it cracks.')]),
    ],
  });

  MAI.scene({
    id: 'p4-parc', chapter: 'potarcin', view: 'bars', title: 'Puzzles never seen: P-ARC',
    props: { box: [80, 90, 840, 400], groups: potBars(T3_PARC), legend: potLegend, legendX: 80, legendGap: 330, labelSize: 15 },
    steps: [
      st({ layer: 0 }, [S('And on puzzles they’ve never seen?'), M('They hand-built 50 new tasks, [[thread|P-ARC]], held out from public view. Standard accuracy: 17 to 64 percent.')], { cite: ['potarcin', 'Table 3'] }),
      st({ layer: 1 }, [M('Full task, all five uses: [[c3|1 to 8 percent]].'), S('So it’s a Potemkin village with a leaderboard.')]),
    ],
  });

  MAI.scene({
    id: 'p4-figure', chapter: 'potarcin', view: 'figure', title: 'All seven measures',
    props: { items: { 'p4-performance': { x: 50, y: 47, w: 90 } } },
    steps: [
      st({ show: ['p4-performance'] }, [M('All seven measures as the paper plots them: ARC-AGI-1 on top, P-ARC below.'), S('Look how short the full-task bars are, on both rows.')], { cite: ['potarcin', 'Figure 2'] }),
    ],
  });

  // ================================================================ RULE
  MAI.scene({
    id: 'rule', chapter: 'rule', view: 'cards', title: 'The rule',
    props: {
      items: [
        { id: 'rel', kind: 'big', x: 50, y: 14, w: 92, align: 'center', body: 'Test [[thread|the relation]], not the surface.' },
        { id: 'a', kind: 'card', x: 19, y: 46, w: 28, k: 'paper 2', title: 'Change the alphabet', body: 'Latin → Greek → symbols' },
        { id: 'b', kind: 'card', x: 50, y: 46, w: 28, k: 'paper 3', title: 'Change the format', body: 'text → picture; grade the rule, not only the grid' },
        { id: 'c', kind: 'card', x: 81, y: 46, w: 28, k: 'paper 4', title: 'Change the question', body: 'define · classify · generate · edit · invert' },
        { id: 'cc', kind: 'quote', x: 50, y: 82, w: 74, k: 'paper 1 · Copycat', body: 'Keep roles apart from fillers, and stay free to see a problem anew.' },
      ],
    },
    steps: [
      st({ show: ['rel'] }, [S('So a right answer isn’t proof.'), M('No. The rule that runs through all four papers: test [[thread|the relation]], not the surface.')]),
      st({ show: ['rel', 'a', 'b', 'c'] }, [M('Change the alphabet. Change the format. Change the question. Then see whether the rule survives.')]),
      st({ show: ['rel', 'a', 'b', 'c', 'cc'] }, [S('And if you want to build something that passes?'), M('Copycat’s answer, thirty years early: keep roles apart from fillers, and keep the freedom to see a problem anew.')]),
    ],
  });

  // ================================================================ RETURN
  MAI.scene({
    id: 'ret-xyz', chapter: 'return', view: 'strings', title: 'Back to xyz',
    props: { rows: [{ id: 'src', l: 'a b c', r: 'a b d', y: 170 }, { id: 'tgt', l: 'x y z', r: 'w y z', y: 430 }] },
    steps: [
      st({ rows: { src: 'lr', tgt: 'l?' }, walls: { z: { row: 'tgt', i: 2, label: 'no successor' } } }, [S('Back to the start. abc becomes abd. And xyz…')]),
      st({ bridges: { m1: { a: ['src', 'l', 0], b: ['tgt', 'l', 2], label: 'first ⇄ last', role: 'thread' }, m2: { a: ['src', 'l', 2], b: ['tgt', 'l', 0], role: 'thread' } } },
        [S('…read it as a mirror: a matches z, and c matches x.'), M('Keep going.')]),
      st({ rows: { tgt: 'lr' }, walls: { z: null }, change: { w: { row: 'tgt', i: 0, label: 'one step back', role: 'thread', below: true } } },
        [S('So the first letter steps backward: [[thread|wyz]].'), M('You made the slip yourself. That’s a relation surviving the wall.')]),
    ],
  });

  MAI.scene({
    id: 'ret-end', chapter: 'return', view: 'title', title: 'The end',
    props: { kicker: 'abc → abd · xyz → wyz', title: 'The Relation *Under the Surface*', sub: 'Test the relation, not the surface.' },
    steps: [
      st({ show: ['kicker', 'title', 'sub'] }, [M('Thanks for following the thread.'), S('Next time someone shows me a high score, I’ll ask what it’s measuring.')]),
    ],
  });

  // ================================================================ SOURCES
  MAI.scene({
    id: 'credits', chapter: 'credits', view: 'credits', title: 'Sources and credits',
    steps: [
      st({ page: 'papers' }, [M('Everything on these pages comes from the papers and datasets listed here.')]),
      st({ page: 'media' }, [M('And every borrowed picture, with its author and licence.'), S('Press Home to start again.')]),
    ],
  });
})();
