# Level 1, Learn: post-training-data-lab

Status: DONE (Learn, v0.1, 2026-11-05). A standard library only
curation pipeline over a synthetic teaching set, with every stage
measured. Synthetic data is labelled synthetic everywhere in this
repo. No real data was used, downloaded, or claimed.

## Summary

Learn built a standard-library post-training data curation pipeline on a synthetic teaching set of 20 raw records, labelled synthetic everywhere with no real data used or claimed: exact dedup removed r02 leaving 19, near dedup at Jaccard 0.8 removed r04 leaving 18, quality filters removed r05, r06 and r07 leaving 15, decontamination against 2 synthetic benchmark prompts removed r18 leaving 14 validated SFT records split into 12 train and 2 eval (r10, r15) with 0 exact and 0 near leakage pairs, instruction token sum 83 (mean 5.928571) and output token sum 127 (mean 9.071429), with 12 hand-computed Learn tests passing plus the scaffold smoke test and results_learn.json byte-identical across two runs at sha256 249b53e3c72c0791a3a35a9224276011d6d0b6c7f3353e936f92186672832246.

## What this teaches

Post-training quality is mostly decided before training, in the
data pipeline. This level builds that pipeline in five measured
stages, in a fixed order:

1. Exact dedup on a normalized instruction plus output key.
2. Near dedup by Jaccard overlap of instruction token sets, first
   record wins, threshold 0.8. The designed pair r03 and r04 has
   overlap 7 over 8, which is 0.875, so r04 is removed.
3. Quality filters: instruction at least 3 tokens, output at
   least 2 tokens, output non-empty.
4. Decontamination: no surviving instruction may equal a benchmark
   prompt. Training on benchmark items inflates eval scores, so
   contaminated records are removed, not just flagged.
5. Conversion to SFT records (system, user, assistant messages)
   with schema validation, then a deterministic train and eval
   split (every 5th record in id order goes to eval) and a leakage
   check across the split.

The tokenizer is one definition everywhere: lowercase, then runs
of a to z and 0 to 9. Hand-computed oracles for every stage are in
LEARN-SPEC.md, written before the code. One oracle was corrected
during the build (r16 has 7 instruction tokens, not 6, because of
the token an); the test caught it and the spec was fixed, not the
code. That correction is recorded in LEARN-SPEC.md.

## Measured results

Measured 2026-11-05, Muse VM, Python 3.12.3, standard library
only. Full record: results_learn.json in this folder.

| Stage or measure | Value |
| --- | --- |
| Raw records (synthetic) | 20 |
| After exact dedup | 19 (removed r02) |
| After near dedup (Jaccard 0.8) | 18 (removed r04) |
| After quality filters | 15 (removed r05, r06, r07) |
| After decontamination (2 benchmark prompts) | 14 (removed r18) |
| SFT records, schema valid | 14 of 14 |
| Train / eval split | 12 / 2 (eval: r10, r15) |
| Leakage, exact overlap / near pairs | 0 / 0 |
| Categories, final | factual 9, writing 2, code 2, language 1 |
| Instruction tokens, sum / mean | 83 / 5.928571 |
| Output tokens, sum / mean | 127 / 9.071429 |
| Tests | 12 Learn tests plus scaffold smoke, all passing |
| Determinism | results_learn.json byte-identical across two runs, sha256 249b53e3c72c0791a3a35a9224276011d6d0b6c7f3353e936f92186672832246 |

## Datasheet

- Source: synthetic-teaching-set, 20 records written for this
  level by the project. No external dataset, no scraping, no
  public data.
- License: CC BY 4.0 for the self-authored synthetic text, per
  record in the data itself.
- Composition: 4 categories (factual, writing, code, language),
  one record (r14) carries a non-empty input field.
- Known limits: the set is tiny and teaching scale by design.
  Near dedup looks at instructions only. Decontamination is an
  exact match, not an n-gram overlap. Quality filters are token
  count rules, not model or human judgments. None of the numbers
  here say anything about real datasets; they prove the pipeline
  stages and their accounting.

## Run it

```bash
python3 level-1-learn/run_learn.py
python3 tests/test_learn_post_training_data.py
python3 tests/test_layout.py
```

## Limits

The limits of this stage, and the open work, are in the repo root
REPORT.md (Threats to validity, v1.1 backlog).
