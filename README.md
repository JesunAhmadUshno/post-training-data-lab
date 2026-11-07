# post-training-data-lab

Live dashboard: https://jesunahmadushno.github.io/post-training-data-lab/

Post-training data engineering: curation, dedup, decontamination, synthetic data with filtering, data mixtures with measured downstream effect.

Status: Learn DONE (v0.1, 2026-11-05). Build DONE (v0.5, 2026-11-05). Deep DONE (v1.0, 2026-11-05).
Project: P28. Fleet node: Dell R610. Wave: Waves 6 to 7.

## Start here

1. Read SPEC.md for scope and acceptance criteria.
2. Read DOSSIER.md for the past, present, and future of this problem (v1).
3. Read NOVELTY.md for the proposed novelty (DRAFT, pending the Jev claim_check gate).
4. Start at level-1-learn/README.md, then level-2-build, then level-3-deep.

## Level map

- Level 1, Learn: the core idea, built small and clean, with a teaching path. DONE in v0.1.
- Level 2, Build: a real working system other people can run. DONE in v0.5.
- Level 3, Deep: benchmarks, optimization, evaluation, hard cases. DONE in v1.0.

## Learn (Level 1, DONE v0.1, 2026-11-05)

A standard library only post-training data curation pipeline on a
synthetic teaching set of 20 raw records, labelled synthetic
everywhere, no real data used or claimed: exact dedup, near dedup
at Jaccard 0.8, quality filters, decontamination against 2
synthetic benchmark prompts, validated SFT conversion, and a
12 train and 2 eval split with 0 leakage pairs. Measured table,
datasheet, and run steps: level-1-learn/README.md. Grade: 8,700
of 10,000, deductions named there.

## Build (Level 2, DONE v0.5, 2026-11-05)

A seeded synthetic generator (536 records: 192 clean, 24 exact
duplicates, 24 near duplicates, 288 low-quality poison, 8
contaminated, all labelled synthetic, no real data), filtered
through the Learn pipeline to 192 clean records, and a mixture
study: the same Naive Bayes classifier scored accuracy 0.0 on
the raw mix and 1.0 on the filtered mix over a held-out
synthetic eval set of 80. Measured tables and grade:
level-2-build/README.md. Grade: 8,800 of 10,000, deductions
named there.

## Deep (Level 3, DONE v1.0, 2026-11-05)

A decontamination report against the named synthetic benchmark
SynthBench-P28-12 (12 prompts, no external benchmark items
used or claimed) over 78 synthetic candidates: exact removed
6, normalized exact removed 6 more, word 4-gram overlap
removed 8 more, leaving 58, so exact only caught 6 of 20
contaminated and the 4-gram level caught 20 of 20. Plus the
reusable quality rule set v1.0.0 (8 rules in rules.json):
600 fire events on the Build set (536 records), 19 on the
Deep set, and 0 on clean records in both sets. Measured
tables and grade: level-3-deep/README.md. Grade: 8,300 of
10,000, deductions named there. The v1.1 backlog is in
ROADMAP.md.

## Follow-up studies (after v1.0)

Cheap, standard library checks that answer the reviewer questions in
docs/research-review.md. Run with `python3 level-2-build/run_dose.py`
and `python3 level-3-deep/run_sweep.py`; tested in
tests/test_studies_post_training_data.py.

- Dose-response (level-2-build/results_dose.json): accuracy stays at
  80 of 80 up to 40 poison records per category, drops to 60 of 80 at
  48 (poison equals clean per category), and is 0 of 80 from 56 up.
- Label versus quality ablation (same file): stub outputs with correct
  labels leave accuracy at 80 of 80 even unfiltered; good outputs with
  shifted labels give 0 of 80 even after filtering, because the quality
  filter cannot see a wrong label. The v0.5 gain comes from the stub
  output and the wrong label always travelling together.
- Seeds 0 to 9 (same file): 0 of 80 raw and 80 of 80 filtered on every
  seed; the seed only permutes topic ids.
- N-gram sweep (level-3-deep/results_sweep.json): 3-grams at min 1
  flag 51 of 58 non-contaminated records, because the benchmark 3-gram
  "in simple terms" also ends every clean template; 4-grams catch 20 of
  20 with 0 false flags;
  8-grams and 13-grams catch only the 12 exact and normalized cases,
  because the 12 benchmark prompts are too short to share long n-grams.

## Live dashboard

The site/ folder builds the dashboard at the link above. Every number
on it is read from the committed level-*/results_*.json, jsonl and
README files at build time, and `npm run build` first runs
site/src/pipeline.check.mjs, which fails the build unless the browser
ports of the pipeline, Naive Bayes model, decontamination ladder and
rule set reproduce those committed results.

```
cd site && npm ci && npm run build
```

## Benchmarks

| Test | Result |
| --- | --- |
| Learn pipeline stages (synthetic, 20 raw) | 19 after exact dedup, 18 after near dedup, 15 after quality, 14 after decontamination |
| Learn split and leakage | 12 train, 2 eval (r10, r15), 0 exact and 0 near leakage pairs |
| Learn tests | 12 hand-computed tests plus scaffold smoke, all passing |
| Build filtering (synthetic, 536 raw) | 512 after exact dedup, 482 after near dedup, 194 after quality, 192 after decontamination |
| Build mixture study (held-out synthetic eval, 80) | Mixture A raw accuracy 0.0 (0 of 80), mixture B filtered accuracy 1.0 (80 of 80) |
| Build tests | 8 hand-computed Build tests, all passing (21 tests total with Learn and smoke) |
| Deep decontamination (synthetic, SynthBench-P28-12, 78 candidates) | 72 after exact, 66 after normalized exact, 58 after 4-gram overlap |
| Deep quality rules v1.0.0 (8 rules) | Build set 600 fire events, Deep set 19, clean records 0 in both sets |
| Deep tests | 10 hand-computed Deep tests, all passing (31 checks total with Learn, Build, and smoke) |

## Novelty

PROPOSED. See NOVELTY.md. The novelty text is a draft until the Jev claim_check gate passes on it.

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11, 2026-11-04.

## Fan-out

Written fan-out set for v1.0, in fanout/: blog post, tutorial,
website page copy, LinkedIn draft (held, not posted), paper
candidate brief (decontamination levels and quality rules
note; submission is Jesun's tap, nothing submitted), and
release notes covering v0.1, v0.5, and v1.0. Every piece
states plainly that all data is synthetic, generated or hand
listed by this project and labelled synthetic, that no real
data was used, and that no external benchmark items were
downloaded or claimed. Channel outcomes and per-piece
publicity grades are logged in PUBLICITY.md. Docs page:
https://jesunahmadushno.github.io/post-training-data-lab/
