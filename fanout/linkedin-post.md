# LinkedIn post draft: P28 post-training-data-lab v1.0

Status: DRAFT NOT POSTED
Date drafted: 2026-11-05
Author: Jesun Ahmad Ushno
Rule for this platform: the link goes in the first comment, not in the
post body. The first comment line is at the end of this file.

## Post body

Post-training quality is decided in the data pipeline, before
training starts. I built that pipeline three times and
measured every stage, and I am labelling the scope up front:
every dataset here is synthetic.

post-training-data-lab v1.0 is done: Learn, Build, and Deep,
all open, Python standard library only for every executed
step.

The scope, up front: all data is synthetic, generated or hand
listed by this project and labelled synthetic in every file.
No real data was used or claimed, and no external benchmark
items were downloaded or claimed. The Deep benchmark is my
own synthetic benchmark, SynthBench-P28-12.

Learn: 20 raw records filtered to 14 (19 after exact dedup,
18 after near dedup at Jaccard 0.8, 15 after quality filters),
split 12 train and 2 eval with 0 leakage pairs.

Build: 536 generated records filtered to 192 clean. On a
held-out synthetic eval set of 80, the same Naive Bayes
classifier scored accuracy 0.0 on the raw mix and 1.0 on the
filtered mix. That contrast is designed: 288 of the 536 raw
records are low-quality poison with shifted labels, a stress
proportion, not a natural mix.

Deep: decontamination at three match levels over 78
candidates. Exact matching caught 6 of 20 contaminated
records. Normalized exact caught 12 of 20. Word 4-gram
overlap caught 20 of 20, leaving 58 survivors. The reusable
quality rule set (8 rules, v1.0.0) fired 600 events on the
Build set and 19 on the Deep set, and 0 on clean records in
both sets.

31 checks in total, all passing. The v1.1 list is
honest about what is missing: a real public benchmark run
under its license, an n-gram sweep, and semantic quality
rules. None of that is claimed here.

What match level does your decontamination stop at: exact,
normalized, or n-gram?

## First comment (post this as the first comment, per the standing rule)

Repo, releases v0.1, v0.5, and v1.0, and the full tutorial: https://github.com/JesunAhmadUshno/post-training-data-lab
