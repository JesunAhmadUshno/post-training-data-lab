# Paper candidate brief: decontamination levels and quality rules note

Project: P28 post-training-data-lab
Status: CANDIDATE, brief dated 2026-11-05
Submission note: submission is Jesun's tap. Nothing is submitted by
this brief, and no venue has been contacted.

## Working title

Exact matching misses most contamination: a three level
decontamination and quality rule study on synthetic
post-training data

## Candidate claim, in one line

On a designed synthetic candidate set, exact matching caught
6 of 20 contaminated records while a cumulative word 4-gram
level caught 20 of 20, and an 8 rule token and provenance
quality set fired only on designed flaws (600 events on a 536
record stress mix, 19 on a 78 record probe set, 0 on clean
records); the claim is this measured level contrast and rule
accounting on synthetic data, not any rate on a real
benchmark or a real training corpus, because all data here is
synthetic and no external benchmark items were used.

## Scope, stated first

All data in this project is synthetic, generated or hand listed by this project and labelled synthetic in every file. No real data was used, downloaded, or claimed, and no external benchmark items were downloaded or claimed. The benchmark is the project own SynthBench-P28-12 (12 synthetic prompts, 45 distinct word 4-grams). Every run is Python standard library only, on the Muse VM, 2026-11-05, deterministic, with hand-computed oracles written in the level SPEC files before the code. This brief is a candidate note, shaped like a short paper brief so the numbers and limits are reviewer ready, not a claim that a paper exists.

## Abstract draft

Based only on the measured v1.0 results recorded in the repo.
Scope limits are stated inside the abstract, not after it.

Post-training pipelines decontaminate training data against
benchmark prompts, often with exact matching alone. This
candidate reports a three level open study on synthetic data.
Learn built a curation pipeline (exact dedup, near dedup at
Jaccard 0.8, quality filters, exact decontamination, SFT
conversion, leakage checked split): 20 raw records to 14,
with 0 leakage pairs. Build generated a seeded 536 record
stress mix (192 clean, 24 exact duplicates, 24 near
duplicates, 288 low-quality poison, 8 contaminated), filtered
it to 192 clean records through the Learn pipeline, and
measured a downstream proxy effect: a multinomial Naive
Bayes classifier over instruction tokens scored accuracy 0.0
on the raw mix and 1.0 on the filtered mix over a held-out
synthetic eval set of 80, with fully cyclic confusion on the
raw mix explained by poison label counts in the repo. Deep
decontaminated 78 synthetic candidates against
SynthBench-P28-12 at three levels: exact removed 6,
normalized exact removed 6 more, and word 4-gram overlap (n
equals 4, at least 1 shared 4-gram) removed 8 more, leaving
58 survivors, so exact only caught 6 of 20 contaminated
records and the cumulative 4-gram level caught 20 of 20. The
reusable quality rule set post-training-data-quality-rules
v1.0.0 (8 named rules in rules.json, executable in
quality_rules.py) fired 600 events on the Build set (R02 288,
R03 288, R07 24), 19 on the Deep set (every rule firing), and
0 on clean records in both sets (192 and 36). All data is
synthetic; no external benchmark items were used, and no
rate on a real benchmark or corpus is claimed.

## Evidence in the repo

- level-1-learn/README.md and results_learn.json: stage
  counts, split, leakage, token sums, determinism hash.
- level-2-build/README.md and results_build.json: tier
  counts, stage counts, mixture accuracies, confusion, and
  the mechanism (signal verb counts per label).
- level-3-deep/README.md, results_deep.json, RULES.md, and
  rules.json: per level removals, per rule counts on both
  sets and clean subsets, boundary records, failure modes.
- Tests: 31 checks in total (12 Learn, 8 Build, 10 Deep, plus
  the scaffold smoke test), hand-computed oracles in the
  LEARN, BUILD, and DEEP SPEC files.

## Limits a reviewer will raise, named here

- Synthetic and template based sets at teaching scale (20,
  536, and 78 records). The contrast is designed, including
  the poison majority in the Build mix.
- One n-gram size (4) at one threshold (at least 1 shared
  4-gram). No 8-gram or 13-gram comparison, no MinHash or
  embedding method, no paraphrase tier.
- Instructions only: outputs and input fields are not
  decontaminated.
- Token and provenance quality rules only: no semantic,
  classifier, or human quality judgment.
- The downstream effect is a Naive Bayes proxy on a template
  task, not SFT training of a language model, and no
  downstream effect of the Deep levels is measured.
- No real public benchmark run: that run, under its license,
  is v1.1 item 1 in ROADMAP.md and is the natural next step
  before any venue submission.

## Venue and submission

No venue is named in this brief and none has been contacted.
Submission is Jesun's tap, under the publications pipeline
rules (one venue at a time, fees post-acceptance only).
