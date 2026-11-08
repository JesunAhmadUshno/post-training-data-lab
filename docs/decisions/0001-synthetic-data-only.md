# 0001: Synthetic data only

Date: 2026-11-05 (recorded 2026-11-08). Status: accepted. Decided by: Jesun Ahmad Ushno.

## Context

The project needed datasets with known flaws (duplicates, near copies,
low-quality records, benchmark contamination) so that every pipeline
stage could be checked against hand-computed oracles. Real instruction
datasets and public benchmarks carry licences that must be recorded per
item, and their flaws are not known in advance.

## Decision

Every dataset in the repo is synthetic, generated or hand-listed by the
project, and every record carries `synthetic: true`, a source and a
licence. The Deep benchmark is the project's own SynthBench-P28-12. No
public benchmark items are downloaded or claimed.

## Consequences

Every count is exact and testable, and nothing needs a licence review.
The price is external validity: no number here says anything about real
data, and the headline mixture result is certain by construction
(REPORT.md, threats 1 and 3). Real-data runs are the first items of the
v1.1 backlog and need the Owner's choice of source and licence.
