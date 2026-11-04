# SPEC: post-training-data-lab (P28)

Phase skill: spec-driven-development (house engineering pipeline).
Status: Wave 0 scaffold spec, from Roadmap v2 text and the v3 decision pack. Scope and acceptance criteria below are the v2 section text, kept as the source of truth until the project's wave opens its own spec pass.

Fleet node: Dell R610. Wave: Waves 6 to 7.
Hiring evidence: scored in the fleet pass (new candidates P23 to P29: see the decision pack Sections 4 and 5) [confirmed, fleet and scoring pass 2026-11-04, or the decision pack for P23 to P29].

## Project section text (Roadmap v2, or the v3 candidate text for P23 to P29)

Subject: post-training data engineering (Round 3 research rank 4).
- Learn: a data pipeline with datasheets: source, license, dedup, decontamination steps, each measured.
- Build: synthetic data generation with filtering, and a data mixture study: train a small model on mixture A against mixture B, downstream effect measured.
- Deep: a decontamination report against a named benchmark and a data quality rule set other builders can reuse.

## Acceptance criteria (scaffold level)

- Learn closes when the level-1-learn code runs, its README teaches the idea, and a fresh-eyes reader can follow it.
- Build closes when the system runs end to end, tests pass, and one benchmark or result table with method is in the README.
- Deep closes when the Deep scope in the section text is done, the failure modes are written, and the dossier is updated to ship state.
- No level closes on a claim. Evidence only: code, tests, numbers, links.
