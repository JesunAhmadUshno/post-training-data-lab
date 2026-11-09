# Release notes: post-training-data-lab (P28)

One section per release line. Every number below comes from the
level README of that release and the release text on GitHub,
verified with gh release list on 2026-11-05. Every dataset in
every release is synthetic, generated or hand listed by this
project and labelled synthetic. No real data was used, and no
external benchmark items were downloaded or claimed. The full
release text lives on the GitHub releases page:
https://github.com/JesunAhmadUshno/post-training-data-lab/releases

## v0.1, Learn (2026-11-05)

- What shipped: a standard library only curation pipeline on a
  synthetic teaching set: exact dedup, near dedup at Jaccard
  0.8, quality filters, decontamination against 2 synthetic
  benchmark prompts, validated SFT conversion, and a leakage
  checked train and eval split, with a datasheet.
- Measured result: 20 raw records to 19 after exact dedup, 18
  after near dedup, 15 after quality, 14 after
  decontamination; 12 train and 2 eval (r10, r15); 0 exact and
  0 near leakage pairs; instruction token sum 83, output token
  sum 127.
- Tests: 12 hand-computed Learn tests plus the scaffold smoke
  test, all passing.
- Release: https://github.com/JesunAhmadUshno/post-training-data-lab/releases/tag/v0.1

## v0.5, Build (2026-11-05)

- What shipped: a seeded synthetic generator (seed 42), the
  raw and eval data files, filtering through the Learn
  pipeline, and a data mixture study with a multinomial Naive
  Bayes classifier, with the contrast stated in BUILD-SPEC.md
  before the code.
- Measured result: 536 generated records (192 clean, 24 exact
  duplicates, 24 near duplicates, 288 low-quality poison, 8
  contaminated) filtered to 512 after exact dedup, 482 after
  near dedup, 194 after quality, 192 after decontamination;
  mixture A raw accuracy 0.0 (0 of 80), mixture B filtered
  accuracy 1.0 (80 of 80) on the held-out synthetic eval set.
- Tests: 8 hand-computed Build tests, 21 checks in total at
  that point with Learn and smoke, all passing.
- Release: https://github.com/JesunAhmadUshno/post-training-data-lab/releases/tag/v0.5

## v1.0, Learn, Build, and Deep (2026-11-05)

- What shipped: a decontamination report against the named
  synthetic benchmark SynthBench-P28-12 at three match levels
  and the reusable quality rule set
  post-training-data-quality-rules v1.0.0 (8 rules in
  rules.json, documented in RULES.md), plus written failure
  modes. The rest of the v2 Deep scope is named in REPORT.md
  as the v1.1 backlog.
- Measured result: 78 synthetic candidates, 72 after exact,
  66 after normalized exact, 58 after word 4-gram overlap;
  exact only caught 6 of 20 contaminated, the 4-gram level
  caught 20 of 20; quality rules fired 600 events on the Build
  set of 536 records, 19 on the Deep set, and 0 on clean
  records in both sets.
- Tests: 10 hand-computed Deep tests, 31 checks in total with
  Learn, Build, and smoke, all passing.
- Release: https://github.com/JesunAhmadUshno/post-training-data-lab/releases/tag/v1.0

## Held channels

- Social posts for every release above: HELD under the standing
  platform rules. The loop prepares drafts and never posts;
  Threads needs Jesun's one tap per post.
