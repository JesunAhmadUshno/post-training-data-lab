# Changelog

All notable changes to this project. Format: Keep a Changelog 1.1.
Versions follow Semantic Versioning. The tags v0.1, v0.5 and v1.0 come
from the earlier Learn / Build / Deep ladder; under the portfolio
standard v2 no release is tagged yet.

## [Unreleased]

### Changed
- 2026-11-08: Adopted the portfolio standard v2. README opens with the
  question, headline, field, job family and verdict (Functional, not
  pre-registered). SPEC.md, NOVELTY.md and the dossier's past and future
  moved into PROPOSAL.md; the dossier's present, the research review,
  the README benchmark table and ROADMAP.md moved into REPORT.md; the
  per-stage grades left the public repo (grades are internal) and their
  named deductions became REPORT.md threats to validity. The stage
  folders keep their names (docs/decisions/0002). One-command
  reproduce (reproduce.sh), a layout test that also fails on a public
  grade, CI permissions set to read-only, CodeQL for JavaScript too,
  Dependabot for site/ npm, CITATION.cff and SECURITY.md. The dashboard
  reads the verdict and lifecycle from README.md and the backlog from
  REPORT.md instead of grades.

### Added
- 2026-11-07: Vite upgraded to 6.4.5 (npm audit: no high or critical
  advisories).
- 2026-11-07: Live dashboard in site/ with browser ports of the
  pipeline, classifier, n-gram sweep and rule linter, parity-checked
  against the committed results at build time; Pages workflow.
- 2026-11-07: Follow-up studies: poison dose-response, label versus
  quality ablation, seeds 0 to 9 and Wilson intervals
  (level-2-build/results_dose.json); n-gram size and threshold sweep
  (level-3-deep/results_sweep.json); 10 tests written before the
  runners; CI checks reruns leave every output unchanged.
- 2026-11-07: Baseline raw records and Deep candidates committed as
  jsonl files; the Learn versus Deep meaning of "exact" documented.
- 2026-11-06: Actions polish pack: CI matrix on Python 3.11 and 3.12
  with ruff, CodeQL, Dependabot, release artifacts, Labeler, Greetings,
  Stale (comment only), docs page. Written fan-out drafts in fanout/.

## [1.0] - 2026-11-05 (ladder tag v1.0)

### Added
- Decontamination report against the synthetic benchmark
  SynthBench-P28-12 at three match levels over 78 candidates (72, 66,
  58 survivors; exact alone caught 6 of 20 contaminated, 4-grams 20 of
  20), and the quality rule set post-training-data-quality-rules
  v1.0.0 (8 rules; 600 fires on the Build set, 19 on the Deep set, 0 on
  clean records).

## [0.5] - 2026-11-05 (ladder tag v0.5)

### Added
- Seed-42 synthetic generator (536 records in five tiers), filtering
  through the baseline pipeline to 192 clean records, and the mixture
  study: the same Naive Bayes classifier scored 0 of 80 on the raw mix
  and 80 of 80 on the filtered mix.

## [0.1] - 2026-11-05 (ladder tag v0.1)

### Added
- Standard-library curation pipeline on a 20-record synthetic teaching
  set: exact dedup, near dedup at Jaccard 0.8, quality filters,
  decontamination, SFT conversion, 12 train and 2 eval with 0 leakage
  pairs.

## 2026-11-04

### Added
- Scaffold: SPEC.md (scope and acceptance criteria), dossier v1,
  novelty draft, level folders.
