# Research review: post-training-data-lab

A graded review of the repo against a doctoral research rubric, written
with the follow-up studies added after v1.0. Every number below is in a
committed results file; the file is named next to it.

Bottom line: strong engineering, honest self-assessment, weak external
validity. Research grade before this change about 5.5 of 10; after it
about 6.5 of 10. Engineering and reproducibility about 8.5 of 10 before,
about 9 of 10 after. The ceiling now is data, not code: every remaining
gap needs a real corpus, a real benchmark or a real fine-tuning run.

## Scorecard

| Criterion | Before | After | What changed |
| --- | --- | --- | --- |
| Research question | 6 | 7 | The question is now stated as what the filter removes and why it helps, not only whether it helps |
| Hypotheses | 4 | 6 | The dose-response and ablation each test a stated prediction (below) |
| Method | 6 | 7 | Ablation separates the two flaws the poison tier carries together |
| Baselines | 5 | 6 | Decontamination now compared across n-gram sizes and thresholds |
| Statistics and uncertainty | 3 | 6 | Wilson 95% intervals on every accuracy; seed invariance shown |
| Reproducibility | 9 | 9.5 | Data the site needs is committed as jsonl; CI checks reruns leave outputs unchanged; the site build fails if the browser ports drift |
| Threats to validity | 7 | 8 | Confound measured, not only named |
| Related work | 4 | 4 | Unchanged (see open gaps) |
| Limitations | 8 | 8.5 | Limitations now carry their own numbers |

## Research question

Does curating a post-training data mix (dedup, quality filtering,
decontamination) change what a downstream model learns, and how much of
the effect is due to which stage?

v1.0 answered the first half on a designed task. The follow-up asks the
second half: which flaw in the removed records does the damage.

## Hypotheses and what the new studies found

- H1, dose-response: accuracy falls monotonically as poison share rises,
  with a threshold where poison per category reaches clean per category.
  Result (level-2-build/results_dose.json, `dose`): 80 of 80 for k = 0 to
  40 poison records per category, 60 of 80 at k = 48 (poison equals the
  48 clean records per category), 0 of 80 from k = 56. Supported, and the
  curve is a step, not a slope: the model is a vote between label counts.
- H2, label versus quality: if the quality filter helps by removing
  low-quality text, stub outputs with correct labels should hurt.
  Result (`ablation`): stub outputs with correct labels give 80 of 80
  even unfiltered; good outputs with shifted labels give 0 of 80 even
  after filtering (480 records kept). Rejected. The v0.5 gain is entirely
  label noise, removed by the quality filter only because every stub
  record also carries a wrong label. The classifier reads instructions
  only, so outputs cannot matter to it.
- H3, seed sensitivity: the outcome does not depend on the generator
  seed. Result (`seeds`): 0 of 80 raw and 80 of 80 filtered on seeds 0
  to 9. Supported, trivially: the seed only permutes topic ids.
- H4, decontamination granularity: shorter n-grams raise recall and
  false flags; longer n-grams lose recall on short prompts.
  Result (level-3-deep/results_sweep.json): 3-grams at min 1 catch 20 of
  20 but flag 51 of 58 non-contaminated records, because the benchmark
  3-gram "in simple terms" ends every clean template; 4-grams catch 20
  of 20 with 0 false flags; 5-grams at min 2 miss 1; 8-grams catch 13 or
  12; 13-grams catch only the 12 exact and normalized cases, because no
  benchmark prompt has 13 words. Supported.

## Method

Strengths: standard library only, deterministic, hand-computed oracles
written before the code (the three SPEC files), and a fixed stage order.
Weakness that remains: the task is template-separable by design and the
eval shares the training templates, differing only in topic tokens.

## Statistics and uncertainty

Fixed here. Wilson 95% intervals (z 1.959964) are recorded in
results_dose.json and shown on the site: 0 of 80 is 0.000 to 0.046,
80 of 80 is 0.954 to 1.000, per category 0 of 20 is 0.000 to 0.161 and
20 of 20 is 0.839 to 1.000. These describe the 80 eval records, not a
sampled population, and seed variation is zero by construction, so the
honest statement is that uncertainty is not the limiting factor here;
validity is.

## Reproducibility

Every runner rewrites its committed outputs byte for byte; CI now runs
the two new runners and fails on any `git diff`. The dashboard in site/
reads the committed results and data at build time and runs
site/src/pipeline.check.mjs first, which reproduces the Learn and Build
stage counts and removed ids, mixture A and B confusion matrices, every
recorded dose point, the Wilson intervals, the Deep ladder and shared
4-grams, every sweep cell and every rule fire count from the browser
ports. The browser gate (check-site.mjs) is a local tool outside the
repo and runs before publishing, not in CI.

## Threats to validity

1. External validity: synthetic, template data; no real corpus.
2. Construct validity: the downstream "model" is a Naive Bayes proxy over
   instruction tokens, not supervised fine-tuning of a language model.
3. Designed outcome: poison labels are shifted to the next category and
   outnumber clean labels 72 to 48 per category, so the v0.5 result is
   certain. Now quantified by H1 and H2 instead of only stated.
4. Eval overlap: train and eval share templates.
5. Decontamination checks instructions only, against a 12-prompt
   synthetic benchmark; outputs and inputs are not checked.
6. Quality rules are validated only on probes built to fire them.
7. Naming: Learn's "exact" decontamination is case and space normalized,
   Deep L1 "exact" is raw equality. Now documented in DEEP-SPEC.md and
   RULES.md; no number changed.

## Related work

Not improved in this change. DOSSIER.md was not re-verified and NOVELTY.md
is still a draft; neither is presented as a claim on the site. A proper
comparison against 13-gram overlap decontamination and MinHash-LSH
near-duplicate removal needs the real-data runs below to be meaningful,
because on 78 short synthetic records both reduce to the results above.

## Gaps fixed in this change

- Dose-response curve over poison share (H1).
- Label versus quality ablation (H2).
- Seed invariance check (H3).
- Wilson intervals on every accuracy.
- N-gram size and threshold sweep with false flags (H4, ROADMAP item 2,
  first pass).
- Learn raw records and Deep candidates committed as jsonl data files.
- Learn versus Deep "exact" naming documented.
- README level map reordered (no number changed).
- Tests for every new results file (tests/test_studies_post_training_data.py,
  10 checks, written before the runners), plus CI steps.

## Gaps that remain, and exactly what each needs

| Gap | Needs |
| --- | --- |
| Real corpus | A licensed public instruction dataset (for example a few thousand records under a permissive licence), with source and licence recorded per record; CPU only, minutes |
| Real benchmark decontamination | The items of a public benchmark obtained under its licence, run through the same ladder and sweep; CPU only, seconds to minutes |
| Natural false-positive rate | A few hundred benign records labelled by a person as not contaminated; human time, no compute |
| Real downstream model | Supervised fine-tuning of a small language model on raw versus filtered mixes, several seeds; a GPU for hours, which this change does not run |
| Rule precision and recall | A human-labelled sample of natural records for each rule; human time |
| Generalization eval | An eval set written with templates disjoint from training; small, CPU only, but must be designed so it is not separable by construction |
| Duplicate and contamination tier effects downstream | A model whose output depends on repeated or leaked text (a language model, not an instruction classifier); same GPU need as above |
| Related-work comparison | A verified literature pass and the real-data runs above, so the comparison is not on a toy set |
