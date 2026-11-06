# post-training-data-lab

Post-training data engineering: curation, dedup, decontamination, synthetic data with filtering, data mixtures with measured downstream effect.

Status: Learn DONE (v0.1, 2026-11-05). Build DONE (v0.5, 2026-11-05). Deep not started.
Project: P28. Fleet node: Dell R610. Wave: Waves 6 to 7.

## Start here

1. Read SPEC.md for scope and acceptance criteria.
2. Read DOSSIER.md for the past, present, and future of this problem (v1).
3. Read NOVELTY.md for the proposed novelty (DRAFT, pending the Jev claim_check gate).
4. Start at level-1-learn/README.md, then level-2-build, then level-3-deep.

## Level map

- Level 1, Learn: the core idea, built small and clean, with a teaching path. DONE in v0.1.

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
- Level 2, Build: a real working system other people can run. DONE in v0.5.
- Level 3, Deep: benchmarks, optimization, evaluation, hard cases.

## Benchmarks

| Test | Result |
| --- | --- |
| Learn pipeline stages (synthetic, 20 raw) | 19 after exact dedup, 18 after near dedup, 15 after quality, 14 after decontamination |
| Learn split and leakage | 12 train, 2 eval (r10, r15), 0 exact and 0 near leakage pairs |
| Learn tests | 12 hand-computed tests plus scaffold smoke, all passing |
| Build filtering (synthetic, 536 raw) | 512 after exact dedup, 482 after near dedup, 194 after quality, 192 after decontamination |
| Build mixture study (held-out synthetic eval, 80) | Mixture A raw accuracy 0.0 (0 of 80), mixture B filtered accuracy 1.0 (80 of 80) |
| Build tests | 8 hand-computed Build tests, all passing (21 tests total with Learn and smoke) |

## Novelty

PROPOSED. See NOVELTY.md. The novelty text is a draft until the Jev claim_check gate passes on it.

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11, 2026-11-04.
