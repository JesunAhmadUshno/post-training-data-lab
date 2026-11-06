# Exact Matching Missed 14 of 20: A Synthetic Decontamination Lesson

By Jesun Ahmad Ushno
Date: 2026-11-05
Status: DRAFT, written fan-out for P28 post-training-data-lab v1.0. Not posted.

## The problem

Post-training data decides model behaviour before any training
run starts. Three failure shapes repeat in that data: duplicate
records, low-quality records with shifted labels, and benchmark
items copied into training data, which inflates eval scores.
This project builds the pipeline that handles all three, three
times, small, working, then measured at three match levels,
instead of asserting that cleaning happened.

Repository: https://github.com/JesunAhmadUshno/post-training-data-lab

## Honest scope, stated first

All data in this project is synthetic, generated or hand listed by this project and labelled synthetic in every file. No real data was used, downloaded, or claimed, and no external benchmark items were downloaded or claimed. The Deep benchmark is the project own synthetic benchmark, SynthBench-P28-12. Every level runs on the Python standard library only, measured on the Muse VM on 2026-11-05. The numbers below prove the pipeline accounting and the level contrast on these synthetic sets. They say nothing about rates on a real benchmark or a real training corpus.

## What was built

Learn: a standard library curation pipeline on a synthetic
teaching set of 20 raw records: exact dedup, near dedup at
Jaccard 0.8, quality filters, decontamination against 2
synthetic benchmark prompts, validated SFT conversion, and a
12 train and 2 eval split with 0 leakage pairs. Grade 8,700
of 10,000.

Build: a seeded synthetic generator (536 records: 192 clean,
24 exact duplicates, 24 near duplicates, 288 low-quality
poison, 8 contaminated) filtered through the Learn pipeline
to 192 clean records, and a mixture study with the same
multinomial Naive Bayes classifier (instruction tokens, alpha
1.0) on a held-out synthetic eval set of 80. Grade 8,800 of
10,000.

Deep: a decontamination report against SynthBench-P28-12 at
three match levels over 78 synthetic candidates, plus the
reusable quality rule set post-training-data-quality-rules
v1.0.0 (8 rules in rules.json). Grade 8,300 of 10,000.

## The main result

On synthetic data only, Learn filtered 20 raw records to 14 with 0 leakage pairs, Build filtered 536 generated records to 192 clean and moved a Naive Bayes mixture study from accuracy 0.0 on the raw mix to 1.0 on the filtered mix over a held-out synthetic eval set of 80, and Deep decontamination against the synthetic benchmark SynthBench-P28-12 caught 20 of 20 contaminated records at the 4-gram level where exact matching caught 6 of 20, with the 8 rule quality set firing 600 events on the Build set, 19 on the Deep set, and 0 on clean records in both sets.

In detail. Learn stage counts: 20 raw, 19 after exact dedup
(removed r02), 18 after near dedup (removed r04, Jaccard 7
over 8, which is 0.875), 15 after quality filters (removed
r05, r06, r07), 14 after decontamination (removed r18).
Instruction token sum 83 (mean 5.928571), output token sum
127 (mean 9.071429). Build filtering: 512 after exact dedup,
482 after near dedup, 194 after quality filters, 192 after
decontamination (removed x001 and x005). Mixture A, the raw
mix, confused every category cyclically at 20 each (code to
factual, factual to language, language to writing, writing to
code), because each signal verb occurs 30 times under its true
label and 36 times under the poison label. Mixture B, the
filtered mix, scored 20 of 20 in every category.

Deep, level by level: exact removed 6 (e01 to e06) leaving 72,
normalized exact removed 6 more (n01 to n06) leaving 66, and
word 4-gram overlap removed 8 more (g01 to g08) leaving 58.
The benchmark holds 45 distinct word 4-grams. The 4 boundary
records (s01 to s04) share at most 3 consecutive tokens with a
benchmark prompt and no 4-gram, and all survive: that is the
stated boundary of the rule, not an error. Quality rules on
the Build set: R02 288, R03 288, R07 24, all other rules 0,
for 600 fire events. On the Deep set every rule fires: R01 3,
R02 3, R03 3, R04 2, R05 2, R06 2, R07 2, R08 2, for 19 fire
events. On clean records in both sets (192 Build clean, 36
Deep clean), every rule fires 0.

## The verdict

On these synthetic sets, the cheap match level is the weak
one: exact matching is a verbatim check, and contamination
that changes case, spacing, punctuation, or surrounding words
passes it. The 4-gram level caught every designed case here,
and its boundary is written down: a paraphrase that changes
at least one token in every block of 4 passes it too. The
quality rules are screens, not semantic judgments: a fluent,
wrong record with normal length and distinct tokens fires no
rule. Those failure modes are in the level README, not under
it.

## Limits

- Synthetic only: every dataset was generated or hand listed
  by this project. No real data, no external benchmark items.
- The Build mixture result is a designed contrast: the poison
  share (288 of 536) is a stress proportion, and mixture B at
  1.0 is a designed outcome on a template task, not a
  discovery about real data.
- The downstream model is an instruction-only Naive Bayes
  proxy, not SFT training of a language model.
- Decontamination checks instructions only, at one n-gram
  size (4) and one threshold, with no MinHash or embedding
  method compared.
- The benchmark is small (12 prompts) and the Deep candidate
  set is small (78 records), both by design for hand-computed
  oracles.

## Future

The v1.1 backlog is ROADMAP.md in the repo: decontamination
against a real public benchmark under its license, an n-gram
size and threshold sweep, output and input field
decontamination with a paraphrase tier, semantic quality
rules, a per level downstream effect run, and larger
candidate sets with a MinHash comparison. None of that is
claimed as done.

Tests: 31 checks in total (12 Learn, 8 Build, 10 Deep, plus
the scaffold smoke test), all passing.
