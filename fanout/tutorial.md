# Tutorial: P28 post-training-data-lab, course module

Module: P28-post-training-data-lab
By Jesun Ahmad Ushno
Date: 2026-11-05
License for this tutorial: CC BY 4.0. Code in the repo: Apache-2.0.

## What you will do

You will clone the post-training-data-lab repo, run all three
levels, run the test suite for each level, and read your own
results against the recorded v1.0 numbers. Every command below
was verified by running it in this fan-out cycle. The project
needs Python 3.11 or 3.12 and uses the standard library only
for every executed step. No GPU, cluster, dataset download, or
credential is needed, because no real data is used anywhere in
this repo.

One scope fact governs every step: all data in this project is synthetic, generated or hand listed by this project and labelled synthetic in every file. No real data was used, downloaded, or claimed, and no external benchmark items were downloaded or claimed. The Deep benchmark is the project own synthetic benchmark, SynthBench-P28-12 (12 prompts).

## Step 0: Clone and enter the repo

```text
git clone https://github.com/JesunAhmadUshno/post-training-data-lab.git
cd post-training-data-lab
```

Optional smoke check, before the levels:

```text
python tests/test_smoke.py
```

Expected: scaffold smoke test: PASS, 8 files present.

## Step 1: Level 1, Learn, the curation pipeline

Read level-1-learn/README.md first.

```text
python level-1-learn/run_learn.py
python tests/test_learn_post_training_data.py
```

Expected stage counts in the printed JSON: raw 20, 19 after
exact dedup, 18 after near dedup, 15 after quality, 14 after
decontamination; train 12, eval 2 (r10, r15); leakage 0 and 0;
12 Learn tests passed. The runner writes
level-1-learn/results_learn.json deterministically: it is
byte-identical across two runs.

## Step 2: Level 2, Build, generation, filtering, mixture study

Read level-2-build/README.md and level-2-build/BUILD-SPEC.md.

```text
python level-2-build/run_build.py
python tests/test_build_post_training_data.py
```

Expected stage counts: raw 536, 512 after exact dedup, 482
after near dedup, 194 after quality, 192 after
decontamination. Mixture A (raw, 536 train records) accuracy
0.0, 0 of 80. Mixture B (filtered, 192 train records) accuracy
1.0, 80 of 80. 8 Build tests passed. The runner writes
level-2-build/results_build.json, plus synthetic_data.jsonl
and synthetic_eval.jsonl, deterministically.

## Step 3: Level 3, Deep, decontamination levels and quality rules

Read level-3-deep/README.md, level-3-deep/DEEP-SPEC.md, and
level-3-deep/RULES.md.

```text
python level-3-deep/run_deep.py
python tests/test_deep_post_training_data.py
```

Expected: 78 candidates against SynthBench-P28-12; 72 after
exact, 66 after normalized exact, 58 after 4-gram overlap;
caught by exact only 6 of 20, cumulative 20 of 20 at the
4-gram level; Build rules total 600 fire events, Deep rules
total 19, clean totals 0 in both sets; 10 Deep tests passed.
The runner writes level-3-deep/results_deep.json
deterministically.

## Step 4: Full suite

```text
python tests/test_smoke.py
python tests/test_learn_post_training_data.py
python tests/test_build_post_training_data.py
python tests/test_deep_post_training_data.py
```

Expected: 31 checks in total (12 Learn, 8 Build, 10 Deep,
plus the scaffold smoke test), all passing.

## If your numbers differ

Check the results files first. All three levels are
deterministic and carry counts and names only, with no wall
time, so they should match the recorded v1.0 values exactly
on the same code. A count difference means the code changed.
No difference can come from real data: there is none in this
repo, and no command above downloads anything.
