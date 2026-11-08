# Report: post-training-data-lab (P28)

Status: EXPLORATORY 2026-11-08. Not pre-registered (PROPOSAL.md says
why). Every number below is in a committed results file, named next to
it, and `./reproduce.sh` regenerates every results and data file byte
for byte (checked in CI). Every dataset is synthetic, generated or
hand-listed by this project and labelled synthetic in every record. No
real data was used, downloaded or claimed, and no external benchmark
items were downloaded or claimed.

Bottom line: strong engineering and honest accounting, weak external
validity. The headline mixture result is certain by construction, and
the ablation shows why. The ceiling now is data, not code: every
remaining gap needs a real corpus, a real benchmark, human labels or a
real fine-tuning run.

## Background

Post-training quality is decided largely before training, in the data
pipeline. This project builds that pipeline from zero in three stages
(baseline, build, deep), measures every stage, and asks what the
downstream effect of curation is and where it comes from. Scope and
prior work: PROPOSAL.md. Stage-by-stage method notes, datasheets and
per-record tables: level-1-learn/README.md, level-2-build/README.md,
level-3-deep/README.md and level-3-deep/RULES.md.

Compute and versions: Muse VM, Python 3.12.3, standard library only
(no third-party package), measured 2026-11-05 and 2026-11-07. CI
re-runs everything on Python 3.11 and 3.12. Generator seed 42; seeds
0 to 9 in the seed check.

## Results

| Test | Result | File |
| --- | --- | --- |
| Baseline pipeline stages (synthetic, 20 raw) | 19 after exact dedup, 18 after near dedup, 15 after quality, 14 after decontamination | level-1-learn/results_learn.json |
| Baseline split and leakage | 12 train, 2 eval (r10, r15), 0 exact and 0 near leakage pairs | level-1-learn/results_learn.json |
| Build filtering (synthetic, 536 raw) | 512 after exact dedup, 482 after near dedup, 194 after quality, 192 after decontamination | level-2-build/results_build.json |
| Build mixture study (held-out synthetic eval, 80) | Mixture A raw 0 of 80 (Wilson 95% 0.000 to 0.046), mixture B filtered 80 of 80 (0.954 to 1.000) | level-2-build/results_build.json, results_dose.json |
| Deep decontamination (SynthBench-P28-12, 78 candidates) | 72 after exact, 66 after normalized exact, 58 after 4-gram overlap; exact alone caught 6 of 20 contaminated, the 4-gram level 20 of 20 | level-3-deep/results_deep.json |
| Deep quality rules v1.0.0 (8 rules) | Build set 600 fire events, Deep set 19, clean records 0 in both sets | level-3-deep/results_deep.json |
| Tests | 12 baseline, 8 build, 10 deep, 10 follow-up study tests, plus the layout test | tests/ |

Wilson intervals (z 1.959964) describe the 80 eval records, not a
sampled population; per category, 0 of 20 is 0.000 to 0.161 and 20 of
20 is 0.839 to 1.000.

## Hypotheses (exploratory, no pass line set in advance)

| Hypothesis | Finding | Outcome | File |
| --- | --- | --- | --- |
| H1 dose-response | 80 of 80 for k = 0 to 40 poison records per category, 60 of 80 at k = 48 (poison equals the 48 clean per category), 0 of 80 from k = 56. The curve is a step, not a slope: the model is a vote between label counts | Supported (exploratory) | level-2-build/results_dose.json `dose` |
| H2 label versus quality | Stub outputs with correct labels give 80 of 80 even unfiltered; good outputs with shifted labels give 0 of 80 even after filtering (480 records kept). The v0.5 gain is entirely label noise, removed by the quality filter only because every stub record also carries a wrong label; the classifier reads instructions only | **Rejected** | level-2-build/results_dose.json `ablation` |
| H3 seed sensitivity | 0 of 80 raw and 80 of 80 filtered on seeds 0 to 9 | Supported, trivially: the seed only permutes topic ids | level-2-build/results_dose.json `seeds` |
| H4 decontamination granularity | 3-grams at min 1 catch 20 of 20 but flag 51 of 58 non-contaminated records (the benchmark 3-gram "in simple terms" ends every clean template); 4-grams catch 20 of 20 with 0 false flags; 5-grams at min 2 miss 1; 8-grams catch 13 or 12; 13-grams catch only the 12 exact and normalized cases, because no benchmark prompt has 13 words | Supported (exploratory) | level-3-deep/results_sweep.json |

## Misses and failure modes

- H2 was rejected: the quality filter does not help by removing
  low-quality text in this design.
- Exact decontamination missed 14 of 20 contaminated records;
  normalized matching still missed the 8 embedded or extended copies.
- A 4-gram rule misses a paraphrase that changes at least one token in
  every block of 4, and can flag benign text sharing a common 4-gram;
  a 3-token overlap is not flagged at all (s01 to s04 survive).
- The token rules are screens, not semantic judgments: a fluent,
  wrong or harmful record of normal length fires no rule. R07 depends
  on set order; R05 needs at least 4 output tokens.
- The duplicate and contaminated tiers moved the pipeline counts but
  had no separate downstream effect in this design.

## Threats to validity

1. External validity: synthetic, template data at teaching scale (20
   baseline records, 536 build records, 78 deep candidates); no real
   corpus and no real curation claim.
2. Construct validity: the downstream "model" is an instruction-only
   multinomial Naive Bayes proxy, not supervised fine-tuning of a
   language model.
3. Designed outcome: the template task is separable by design, poison
   labels are shifted to the next category and outnumber clean labels
   72 to 48 per category, and the poison share (288 of 536) is a stress
   proportion, not a natural mix. Mixture B at 1.0 is a designed
   outcome, not a discovery; H1 and H2 quantify this.
4. Eval overlap: eval and train share templates and differ only in
   topic tokens, so the eval cannot tell generalization from template
   matching.
5. Decontamination checks instructions only, not outputs or inputs,
   against a 12-prompt synthetic benchmark; no public benchmark
   contamination is measured.
6. Baselines: near dedup is instruction-token Jaccard only, with no
   MinHash or embedding comparison; the split is positional, with no
   stratified or shuffled comparison; quality filters are token-count
   rules, with no language, toxicity or classifier filter.
7. Quality rules are validated only on probes built to fire them, so
   precision and recall on natural data are unknown.
8. No downstream effect of the Deep decontamination levels is measured.
9. Naming: baseline "exact" decontamination is case and space
   normalized, Deep L1 "exact" is raw equality (documented in
   level-3-deep/DEEP-SPEC.md and RULES.md; no number changed).
10. Order of design and code: the stage design files say their oracles
    were written before the code, but each was committed with its code,
    so git cannot confirm it (PROPOSAL.md).

## Reproducibility

`./reproduce.sh` reruns every runner and fails on any change to a
committed results or data file; CI runs it on Python 3.11 and 3.12. The
dashboard in site/ reads the committed results and data at build time
and runs site/src/pipeline.check.mjs first, which reproduces the stage
counts and removed ids, both confusion matrices, every dose point, the
Wilson intervals, the Deep ladder and shared 4-grams, every sweep cell
and every rule fire count from browser ports of the Python. The browser
gate (check-site.mjs) is a local tool outside the repo.

## Related work

Not done. The prior-art pass promised in the dossier was not carried
out, and NOVELTY is a draft (PROPOSAL.md). A comparison against
13-gram overlap decontamination and MinHash-LSH near-duplicate removal
needs real-data runs to mean anything, because on 78 short synthetic
records both reduce to the results above.

## Review notes (2026-11-07 self-review, carried over from docs/research-review.md)

What the follow-up studies changed, by criterion:

| Criterion | What changed |
| --- | --- |
| Research question | Stated as what the filter removes and why it helps, not only whether it helps |
| Hypotheses | The dose-response and ablation each test a stated prediction |
| Method | The ablation separates the two flaws the poison tier carries together |
| Baselines | Decontamination compared across n-gram sizes and thresholds |
| Statistics and uncertainty | Wilson 95% intervals on every accuracy; seed invariance shown |
| Reproducibility | Data the site needs is committed as jsonl; CI checks reruns leave outputs unchanged; the site build fails if the browser ports drift |
| Threats to validity | Confound measured, not only named |
| Related work | Unchanged (see above) |
| Limitations | Limitations carry their own numbers |

Uncertainty is not the limiting factor here; validity is. Seed variation
is zero by construction. This is a self-review; the independent review
stage of the standard (a second reader re-deriving every headline number)
has not happened.

## v1.1 backlog

1. Decontamination against a real public benchmark, with its actual
   items obtained under its license, the license and source recorded per
   item, and rates reported separately from the synthetic
   SynthBench-P28-12 rates.
2. N-gram size and threshold sweep (n equals 4, 8, and 13, with a
   minimum shared count above 1), with false positive and false negative
   rates per setting on a labelled set.
3. Output and input field decontamination, not instructions only, plus a
   paraphrase contamination tier that changes at least one token in
   every block of 4.
4. Semantic quality rules: a classifier or model based quality screen
   and a small human labelled agreement check, reported next to the
   token rules in RULES.md.
5. A downstream run that trains the Build proxy model after each
   decontamination level and reports the per level effect, so the level
   contrast is measured downstream too.
6. Larger candidate sets (thousands of records) with a performance
   measure for the n-gram index, and a MinHash near duplicate comparison
   next to R07.

## Progress after v1.0

- Item 2: first pass on the labelled synthetic Deep set, in level-3-deep/results_sweep.json (n 3, 4, 5, 8, 13 by min shared 1, 2, with caught, missed and false flags per setting). Still open: a real benchmark and natural negatives.
- Item 5: partly addressed for the Build tiers, in level-2-build/results_dose.json (poison dose-response and a label versus quality ablation). The per-level Deep downstream run is still open.

Held, unchanged: PyPI publishing needs a new credential (Owner only).
Social posting: drafts only, never posted by automation; Threads waits
for the Owner per post.

## Gaps that remain, and exactly what each needs

| Gap | Needs |
| --- | --- |
| Real corpus | A licensed public instruction dataset (for example a few thousand records under a permissive licence), with source and licence recorded per record; CPU only, minutes |
| Real benchmark decontamination | The items of a public benchmark obtained under its licence, run through the same ladder and sweep; CPU only, seconds to minutes |
| Natural false-positive rate | A few hundred benign records labelled by a person as not contaminated; human time, no compute |
| Real downstream model | Supervised fine-tuning of a small language model on raw versus filtered mixes, several seeds; a GPU for hours |
| Rule precision and recall | A human-labelled sample of natural records for each rule; human time |
| Generalization eval | An eval set written with templates disjoint from training; small, CPU only, but must be designed so it is not separable by construction |
| Duplicate and contamination tier effects downstream | A model whose output depends on repeated or leaked text (a language model, not an instruction classifier); same GPU need as above |
| Related-work comparison | A verified literature pass and the real-data runs above, so the comparison is not on a toy set |

## Conclusion

On this synthetic stress mix, the curation pipeline does exactly what
its design says, and every stage is accounted for record by record. The
mixture result shows how the pipeline behaves, not how much filtering
helps on real data: the gain is label noise that the length filter
happens to remove. Word 4-gram decontamination clearly beats exact
matching on planted contamination. Nothing here is confirmatory; the
confirmatory re-run waits on a locked proposal.
