# Proposal: post-training-data-lab (P28)

Status: NOT LOCKED. This repo is **not pre-registered**. Git history
shows the scope file (SPEC.md, commit 4349880, 2026-11-04) came before
any code, but it held scope and acceptance criteria only: no
hypotheses and no pass lines. The per-stage design files with
hand-computed oracles (level-1-learn/LEARN-SPEC.md,
level-2-build/BUILD-SPEC.md, level-3-deep/DEEP-SPEC.md) were committed
in the same commits as the code they describe (c50d579, 9256241,
a98bce2), so git cannot prove they came first. The four hypotheses
below were written after the v1.0 results, on 2026-11-07, and are
exploratory.

Under the portfolio standard v2 (METHOD section 7) this repo gets a
confirmatory re-run under a newly locked proposal. That proposal will
replace the "Plan for the confirmatory re-run" section below, and be
tagged proposal-v1 before any confirmatory result exists. Until then
the verdict is capped at Functional.

## Question

Does curating a post-training data mix (dedup, quality filtering,
decontamination) change what a downstream model learns, and how much of
the effect comes from which stage?

## Scope, as set before any code (from SPEC.md, 2026-11-04)

Subject: post-training data engineering (Round 3 research rank 4).

- Learn (now the baseline): a data pipeline with datasheets: source,
  license, dedup, decontamination steps, each measured.
- Build: synthetic data generation with filtering, and a data mixture
  study: train a small model on mixture A against mixture B, downstream
  effect measured.
- Deep: a decontamination report against a named benchmark and a data
  quality rule set other builders can reuse.

Acceptance criteria at scaffold level (SPEC.md):

- Learn closes when the level-1-learn code runs, its README teaches the
  idea, and a fresh-eyes reader can follow it.
- Build closes when the system runs end to end, tests pass, and one
  benchmark or result table with method is in the README.
- Deep closes when the Deep scope in the section text is done, the
  failure modes are written, and the dossier is updated to ship state.
- No level closes on a claim. Evidence only: code, tests, numbers,
  links.

Fleet node named in the scope: Dell R610 (Waves 6 to 7). Every run on
record was on the Muse VM, Python 3.12.3, standard library only.

## Prior work

From DOSSIER.md (v1, 2026-11-05). Prior art is named generically as
dataset curation tools (dedup and filtering pipelines). The history of
the problem, the key papers and systems, and what was tried before were
to be expanded with dated sources before Build opened; that expansion
was not done, and the related-work comparison is an open gap (REPORT.md).
Demand evidence: hiring value scored in the fleet pass of 2026-11-04
(decision pack sections 4 and 5, candidates P23 to P29). The Round 3
research (2026-11-04) found the market centre at post-training, evals,
environments and inference depth (report at
~/workspace/research_notes/roadmap-v3-revaluation-research-20261104-0949/report.md,
outside this repo). Any forecast about this field is unverified unless
a dated primary source is added.

## Novelty (draft, from NOVELTY.md)

Status: DRAFT, PROPOSED, not verified. This text does not move into any
public post, paper or profile until the Jev claim_check gate passes on
the exact text.

Proposed claim: against dataset curation tools (dedup and filtering
pipelines), this project aims to differ by being a from-zero,
self-hosted build, measured in public, with the failure modes written
down. The exact difference is to be stated after the prior art is
re-read.

| Prior art | What it does | What this project does differently | Measured difference |
| --- | --- | --- | --- |
| Dataset curation tools (dedup and filtering pipelines) | See Prior work | PROPOSED, see the claim above | NO MEASUREMENT YET |

Honest size: if the novelty proves small, this file will say so and
name the real value instead (a cleaner reproduction, a better
benchmark, a first public dataset). No novelty is invented to fill this
section.

## Hypotheses (exploratory, written 2026-11-07 after the v1.0 results)

- H1, dose-response: accuracy falls monotonically as the poison share
  rises, with a threshold where poison per category reaches clean per
  category.
- H2, label versus quality: if the quality filter helps by removing
  low-quality text, stub outputs with correct labels should hurt.
- H3, seed sensitivity: the outcome does not depend on the generator
  seed.
- H4, decontamination granularity: shorter n-grams raise recall and
  false flags; longer n-grams lose recall on short prompts.

None of these had a numeric pass line before the run. They are scored
in REPORT.md as exploratory findings, not confirmations.

## Design

Every dataset is synthetic, generated or hand-listed by this project
and labelled synthetic in every record (docs/decisions/0001). Standard
library Python only, deterministic, seeded.

- Baseline (level-1-learn): a five-stage pipeline on 20 hand-written
  records: exact dedup, near dedup at instruction-token Jaccard 0.8,
  token-count quality filters, exact decontamination against 2
  benchmark prompts, SFT conversion with schema check, positional
  train/eval split and a leakage check.
- Build (level-2-build): a seed-42 generator of 536 records in five
  tiers (clean, exact copies, near copies, low-quality poison with a
  label shifted to the next category, contaminated), filtered by the
  baseline pipeline; mixture A (raw) against mixture B (filtered),
  scored by the same multinomial Naive Bayes classifier over
  instruction tokens on 80 held-out synthetic eval records. Follow-ups:
  a poison dose sweep, a label versus quality ablation, seeds 0 to 9,
  Wilson 95% intervals.
- Deep (level-3-deep): a three-level decontamination ladder (raw exact,
  normalized exact, word 4-gram overlap) against the project's own
  12-prompt synthetic benchmark SynthBench-P28-12 over 78 candidates,
  an n-gram size and threshold sweep, and a versioned 8-rule quality
  rule set (rules.json) with fire counts and a clean false-positive
  check.

## Plan for the confirmatory re-run (to be written and locked)

Not written. The re-run needs choices only the Owner can make (data
source and licence, whether a GPU fine-tuning arm is in scope, and the
budget). The open gaps it would address are listed in REPORT.md under
"Gaps that remain".
