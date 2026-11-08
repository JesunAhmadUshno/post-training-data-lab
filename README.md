# post-training-data-lab

**Question.** Does curating a post-training data mix (dedup, quality
filtering, decontamination) change what a downstream model learns, and
how much of the effect comes from which stage?

**Headline.** On synthetic data built to produce it, filtering the training mix took the same Naive Bayes classifier from 0 of 80 correct (95% Wilson interval 0.000 to 0.046) to 80 of 80 (0.954 to 1.000), and an ablation shows the whole gain comes from removing wrong labels, not low-quality text; word 4-gram decontamination caught 20 of 20 planted contaminated records where exact matching caught 6.

**Field.** ML and AI research, applying the data-analysis rules to its
data half. **Job family.** ML data engineering (post-training data).

**Verdict.** Functional, not pre-registered. Every stage has run end to
end, the tests pass in CI on Python 3.11 and 3.12, and one command
regenerates every results and data file byte for byte. No plan with
hypotheses was committed before the results, so the verdict is capped
at Functional until a confirmatory re-run under a locked PROPOSAL.md.

Every dataset is synthetic, generated or hand-listed by this project and
labelled synthetic in every record. No real data was used, downloaded or
claimed, and no external benchmark items were downloaded or claimed.
Standard library Python only.

Live dashboard: https://jesunahmadushno.github.io/post-training-data-lab/

## Reproduce

```text
./reproduce.sh
for t in tests/test_*.py; do python3 "$t" || exit 1; done
cd site && npm ci && npm run build
```

`./reproduce.sh` reruns the five runners and fails if any committed
results or data file changes. The site build first runs
site/src/pipeline.check.mjs, which fails unless the browser ports of the
pipeline reproduce the committed results.

## Lifecycle

- Question: DONE 2026-11-04
- Proposal: OPEN
- Baseline: DONE 2026-11-05
- Build: DONE 2026-11-05
- Evaluate: PARTIAL 2026-11-07
- Report: PARTIAL 2026-11-08
- Review: OPEN
- Release: OPEN

Proposal is open because the only plan written before code (SPEC.md,
2026-11-04) had no hypotheses or pass lines. Evaluate and Report are
partial: exploratory hypotheses are scored in REPORT.md, but the field
profile is not met (no real data, no fine-tuned model). The tags v0.1,
v0.5 and v1.0 are from the earlier Learn / Build / Deep ladder and are
kept as history (CHANGELOG.md); they are not a v2 release.

## Layout

| Path | What it holds |
| --- | --- |
| PROPOSAL.md | Question, scope set before code, prior work, draft novelty, exploratory hypotheses, design (not locked) |
| REPORT.md | Background, results, hypotheses scored with the miss shown, threats, v1.1 backlog, gaps |
| level-1-learn/ | Baseline: the curation pipeline (pipeline.py), its runner, the 20-record teaching set (learn_raw.jsonl), results_learn.json, the stage design (LEARN-SPEC.md) and datasheet (README.md) |
| level-2-build/ | Build: the generator, the Naive Bayes proxy model, runners for the mixture and dose studies, the generated data (synthetic_*.jsonl), results_build.json and results_dose.json, BUILD-SPEC.md |
| level-3-deep/ | Deep: the decontamination ladder, the n-gram sweep, the quality rule set (rules.json, RULES.md, quality_rules.py), deep_candidates.jsonl, results_deep.json and results_sweep.json, DEEP-SPEC.md |
| reproduce.sh | One command: regenerate every results and data file and fail on any change |
| tests/ | Hand-computed tests for each stage and the follow-up studies; test_layout.py checks required files and that no grade is public |
| docs/decisions/ | Records of hard-to-reverse choices |
| docs/index.md | Older one-page summary, kept for its links |
| fanout/, PUBLICITY.md | Dated drafts (blog, tutorial, release notes, paper brief) and the channel log; nothing posted |
| site/ | The live dashboard, built from the files above |

There is no separate src/, experiments/ or results/ folder: each stage
folder holds its code, its generated data (the evidence) and its scored
results side by side, because the runners, tests and dashboard all read
them there (docs/decisions/0002). The results_*.json files are the
results; the *.jsonl files are the evidence.

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11,
2026-11-04.
