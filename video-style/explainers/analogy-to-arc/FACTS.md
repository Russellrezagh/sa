# Fact ledger: the explainer page

The page re-uses every claim of the video, so `../../storyboards/builders/FACTS.md` applies in full. This file lists only what the page adds. The papers' LaTeX sources (arXiv e-prints) were read on 2026-10-28.

| Claim on the page | Source | Note |
|---|---|---|
| Hofstadter laid out Copycat in a January 1984 MIT memo; the abstract's codelet sentence ("small pieces of ready-to-run code … selected at random to run with probability proportional to heuristically assigned 'urgencies'") | Hofstadter, MIT AI Memo 755 (1984), DTIC ADA142744, via the Internet Archive | Quoted with ellipses only. The DTIC copy states "Distribution of this document is unlimited"; the title page says © 1984 MIT. Shown as a clipping for commentary. |
| The hand-drawn Slipnet ("That part of the Slipnet dealing with Platonic and cytoplasmic adjacency"), with pred/succ, first/last, L-most/R-most | Memo 755, p. 18 | The link labels (hiso, loso, PCA, …) are not explained on the page. |
| The 1995 account: "The Copycat project: a model of mental fluidity and analogy-making" | Hofstadter & Mitchell (1995), in *Fluid Concepts and Creative Analogies* | — |
| Mitchell's PhD built Copycat | Mitchell (1993), *Analogy-Making as Perception*; Wikipedia | No year is shown. |
| Temperature bars: "the shape of the effect, not Copycat's exact formula" | — | The page draws weights `u^k`, with k growing as the workspace cools. That is labelled as an illustration on screen. |
| Item 1 in three alphabets as shown to participants (ab → ac, gh → ?) | Stevenson et al., Figure 2 | **Inconsistency in the paper:** the figure's symbol list ends `? : ]`, while §2 and the item table give `? = :`. The page uses the text's list and says so in the cite. The symbol items whose answers fit neither list (items 2 and 4) are not used. |
| The models got the children's instructions plus one worked example; 55 runs of each model | Stevenson et al., §2 | — |
| Repetition transfers; two-steps-on (successor_2) and one-step-back (predecessor) are where models stumble on symbols | Stevenson et al., §3.3.3, Figure 5, Discussion | The page does not quote per-rule numbers. |
| Literal answers (ab → acc, gh → gcc): 5–21 % of model answers; people never | Stevenson et al., Error Categories and Discussion | The paper says "People did not use the literal rule". |
| Models in paper 3: o3, Claude Sonnet 4, Gemini 2.5 Pro (plus people) | Beger et al., §3 and Figure 1 discussion | — |
| The quoted rules for the TopBottom2D task (person, Claude, Gemini, o3) and their grades | Beger et al., §3 | **Checked by running them:** `data.py` asserts that the person's rule solves every demo and the test, that Gemini's fits all three demos but gets the test wrong (16 cells differ), and that o3's fails demo 2. |
| Center task: Claude's "rarest values" rule is correct on the demos and test 1 (graded correct-unintended) | Beger et al., §3 | **Our extension, labelled as ours:** on the task's test 2 (`4 6 0 6 0 6 0 6 0 6 4`) the rule returns 4 where the answer is 6 (`data.py` asserts that it breaks somewhere). |
| A correct-unintended rule exploiting colour numbers (o3, Above vs. Below) | Beger et al., appendix on correct-unintended rules | "by coincidence, the outlier color has been assigned a higher integer value than the primary color in both training demonstrations" |
| Figure 2 colours: green intended, yellow unintended, red incorrect; in the visual setting, wrong-grid bars contain many intended rules | Beger et al., Figure 2 and abstract | Matches "a substantial share of their rules capture intended abstractions, even as the models struggle to apply these concepts". |
| Error types for o3 are mostly mismatches; some formatting errors and uneven rows | Beger et al., appendix (error types) | — |
| Performance vs. competence: the paper cites Korossy (1999), "modeling knowledge as competence and performance" | Beger et al., §1 | The page adds that linguists know the pair from Chomsky. That is general history (Chomsky 1965, *Aspects*), not a claim about the paper. |
| Definition is checked on the demos, the test, the ARC-GEN set and 50 generator samples; Classification needs all five judgements right; Editing must stay within normalised Hamming distance 0.70 | PotARCin §2 | The page's grids are **our illustration on ARC-AGI-1 task 00d62c1b** (made by `data.py`, with assertions). The paper's Figure 1 uses task 890034e9. |
| GPT-5.4 solved 890034e9's standard test but failed all other dimensions | PotARCin, Figure 1 caption | — |
| Full-task drops of 25–52 points; Gemini 89.1/58.2 vs Claude 87.6/37.6; Kimi 63.4/38.6 (weakest on output grid, not weakest on full task) | PotARCin, Table 3 and §1 ("ranking reversal") | "Leads by 21 points" rounds 20.6. |
| Human errors are, in general, the hardest corruptions; on ARC-AGI-1, models accepted 8.21–31.32 % of them | PotARCin, failure-rates-by-corruption table and §3 | It is not the hardest type for every model on ARC-AGI-1 (Kimi, MiniMax), hence "in general". |
| Sampling: on 20 tasks GPT-5.4 had fully passed, hard full-task accuracy 65 → 45 → 35 → 25 % at 1/2/5/10 samples; it failed at least one of ten configurations on 15 of 20 | PotARCin, sampling table and Conclusion | — |
| Self-consistency: agreement with its own correct Definition is 99.1 % when the other answer is right and 21.1 % when it is wrong (ARC-AGI-1) | PotARCin §3.4 | — |
| Matched budget: 25.5 % vs 20.2 %, task-paired t-test p = 0.030 | PotARCin §3.1 | — |
| P-ARC: 50 held-out hand-made tasks; output grid 17–64 %, full task 1–8 % | PotARCin, Table 3 | — |

**Not claimed:** any Copycat run frequency for *wyz*, any per-rule symbol accuracy from Figure 5, or the meaning of the memo's link labels.
