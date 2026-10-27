# Fact ledger: "The Relation Under the Surface"

Every claim spoken or shown in `analogy-to-arc.yaml` and where it comes from. The papers were read in full via arXiv/alphaXiv on 2026-10-27. Several claims in the source dossier did not match the papers; the **Corrections** column records what the video says instead.

| Claim in the video | Source | Corrections vs. the dossier |
|---|---|---|
| abc→abd; ijk→ijl; iijjkk→iijjll; xyz→wyz; Copycat's alphabet does not wrap (z has no successor) | Hofstadter & Mitchell (1995); Mitchell (1993) | — |
| Slipnet (conceptual depth, activation, labelled links that shrink), Workspace (descriptions, bonds, groups, bridges, salience = importance + unhappiness), codelets (noticers bottom-up, seekers top-down, urgency), parallel terraced scan, temperature 0–100 that can rise again | Hofstadter & Mitchell (1995) | — |
| Copycat finds *wyz* "only now and then, much like people" | Mitchell (1993): *wyz* is a minority answer for both Copycat and people | Worded qualitatively; no run percentages are quoted |
| 2023: GPT-3 solved letter-string analogies better than college students | Webb, Holyoak & Lu (2023), as summarised in Stevenson et al. (2026), §1 | — |
| 42 children aged 7–9, 62 adults, four LLMs (GPT-4o, Llama-3.1 405B, Claude-3.5, Gemma-2 27B); Latin / Greek / invented symbol list `* @ % ! ^ # ~ $ { ? = :`; the list was shown with every item; previous conversation was prepended | Stevenson, Pafford, van der Maas & Mitchell, TACL 14 (2026), arXiv:2411.02348v3, §2 | Dossier said "14 problems" and a different symbol list. The paper has **5 items per alphabet (15 total)** and the list above. LLMs saw Greek letters spelled as words (alpha, beta) |
| Latin / Greek / Symbol means: adults .88/.91/.89, children .62/.66/.67, GPT-4o .85/.63/.48, Claude-3.5 .68/.62/.46, Llama-405B .79/.74/.27, Gemma-27B .60/.39/.14 | Stevenson et al., Table 2 | Dossier gave no numbers; "children beat all models on symbols" holds (.67 vs ≤ .48) |
| Repetition rules transfer; second-successor and predecessor rules fail on symbols; some models answered "literally" (5–21%), and adults never did | Stevenson et al., §3.3.3, Table 7, §5 | — |
| ConceptARC: 16 concepts × 30 tasks = 480 (tasks have 3 test grids; the paper evaluates 480 tasks) | Beger et al. (NeurIPS 2026), arXiv:2510.02125v5, §3 | — |
| o3 medium effort, text: 77.1%; images: 5.6%; images + Python (medium): 29.2%; humans 73% | Beger et al., Table 1 | Dossier said visual accuracy was "0%". It isn't |
| ~27% of o3's correct text outputs rest on correct-unintended or incorrect rules, vs ~7% for humans | Beger et al., §4 | — |
| In images (medium + tools), correct-intended rules exceed correct grids: o3 40.0% vs 29.2% | Beger et al., §4 | — |
| Gemini's "sort shapes by size, then colour value" rule = correct-unintended; human "remove the top and bottom object" = correct-intended | Beger et al., §3 (Figure 1 discussion) | Rule texts abridged on screen |
| Models struggle to read grid size from images; with Python they use computer-vision libraries | Beger et al., §4 | The malformed grid on screen is illustrative |
| Potemkin village legend (1787, Catherine II, Crimea); "Potemkin understanding" | Common history (told as a legend); Mancoridis et al. (2025) | — |
| Five dimensions: Definition, Classification (5 candidates, all must be right), Constrained Generation, Editing (normalised Hamming ≤ 0.70), Inversion; generators + verifiers | Beger, Yi & Mitchell (NeurIPS 2026), arXiv:2609.27288v2, §2 | Corruption types are **human errors, corrupted verifier, colour flip, retrieval, instance mismatch**. Human errors are the hardest |
| Models: GPT-5.4, Gemini 3.1 Pro, Claude Opus 4.6, Kimi K2.5, MiniMax M2.5 | PotARCin §2 | — |
| ARC-AGI-1 output grid vs full-task: 84.2/46.6, 89.1/58.2, 87.6/37.6, 63.4/38.6, 72.9/20.6 | PotARCin Table 3 | Spoken as "84 to 89 percent" (the three proprietary models) and "58 … 21" |
| Gemini ≈ Claude on standard accuracy, but Gemini +20.6 points full-task | PotARCin §3 | — |
| Matched budget: 25.5% vs 20.2% failures exposed (p = 0.030) | PotARCin §3.1 | — |
| Self-consistency: correct Definition, wrong other answer → 21.1% agreement | PotARCin §3.4, Table 4 | — |
| GPT-5.4 passes 185 / 188 tasks, 146 shared (Jaccard 0.64) | PotARCin Table 7 | — |
| P-ARC: 50 hand-made held-out tasks; full-task 1–8% (GPT-5.4 6, Gemini 4, Claude 8, Kimi 2, MiniMax 1) | PotARCin Table 3, §2 | — |

**Not claimed:** the dossier's phrase "Chomsky 1965" for performance vs. competence. The paper cites Korossy (1999), and the video avoids attribution. Any exact share of runs in which Copycat finds *wyz*.
