# post-training-data-lab

Post-training data engineering: curation, dedup, decontamination, synthetic data with filtering, data mixtures with measured downstream effect.

Status: Learn DONE (v0.1, 2026-11-05). Build and Deep not started.
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
- Level 2, Build: a real working system other people can run.
- Level 3, Deep: benchmarks, optimization, evaluation, hard cases.

## Benchmarks

| Test | Result |
| --- | --- |
| Learn pipeline stages (synthetic, 20 raw) | 19 after exact dedup, 18 after near dedup, 15 after quality, 14 after decontamination |
| Learn split and leakage | 12 train, 2 eval (r10, r15), 0 exact and 0 near leakage pairs |
| Learn tests | 12 hand-computed tests plus scaffold smoke, all passing |

## Novelty

PROPOSED. See NOVELTY.md. The novelty text is a draft until the Jev claim_check gate passes on it.

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11, 2026-11-04.
