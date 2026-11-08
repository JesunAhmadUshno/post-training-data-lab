# Level 3, Deep: post-training-data-lab

Status: DONE (Deep, v1.0, 2026-11-05). A decontamination report
against a named synthetic benchmark at three match levels, and
a reusable, versioned data quality rule set with measured fire
counts on two sets and a clean false-positive check. All data
is synthetic and labelled synthetic. No real data was used. No
external benchmark items were downloaded or claimed.

## Summary

Deep produced a decontamination report against the named synthetic benchmark SynthBench-P28-12 (12 synthetic prompts, 45 distinct word 4-grams, no external benchmark items downloaded or claimed) over 78 synthetic Deep candidates labelled synthetic everywhere: exact matching removed 6 leaving 72, normalized exact removed 6 more leaving 66, and word 4-gram overlap at n equals 4 with at least 1 shared 4-gram removed 8 more leaving 58 survivors, so exact only caught 6 of 20 contaminated records and missed 14 while the cumulative 4-gram level caught 20 of 20, and the reusable quality rule set post-training-data-quality-rules v1.0.0 (8 named rules in rules.json, executable in quality_rules.py) fired on the Build set of 536 records at R01 0, R02 288, R03 288, R04 0, R05 0, R06 0, R07 24, R08 0 for 600 fire events, and on the Deep set at R01 3, R02 3, R03 3, R04 2, R05 2, R06 2, R07 2, R08 2 for 19 fire events, with 0 fires on clean records in both sets (192 Build clean and 36 Deep clean), with 10 hand-computed Deep tests passing plus 12 Learn tests, 8 Build tests, and the scaffold smoke test, and results_deep.json byte-identical across two runs at sha256 c67c3e42fc18dce830b6718f47a0d09bab71b646f60d442abb7d1c7e2d81c2f3.

## Benchmark, named honestly

SynthBench-P28-12: 12 synthetic prompts written for this
project. B01 and B02 are the 2 synthetic benchmark prompts from
Learn, kept verbatim. B03 to B12 are new synthetic prompts for
this level. The full list is in DEEP-SPEC.md and in
results_deep.json. No external benchmark items were downloaded
or claimed: this report makes no claim about contamination
against MMLU, GSM8K, or any other public benchmark, because
their actual items were not used here.

## Decontamination, measured

Measured 2026-11-05, Muse VM, Python 3.12.3, standard library
only. Full record: results_deep.json in this folder. Design and
hand-computed oracles, stated before the code: DEEP-SPEC.md.

Candidates, by design group: clean 36, exact contaminated 6,
normalized contaminated 6, n-gram contaminated 8,
sub-threshold boundary 4, quality probes 18. Total 78.
Contaminated by design (exact plus normalized plus n-gram): 20.

| Level | Rule | Additional removed | Survivors |
| --- | --- | --- | --- |
| Raw | - | - | 78 |
| L1 exact | raw string equals a benchmark prompt | 6 (e01 to e06) | 72 |
| L2 normalized exact | canonical tokens equal a benchmark canonical form | 6 (n01 to n06) | 66 |
| L3 n-gram | at least 1 shared word 4-gram with the benchmark 4-gram union (45 distinct 4-grams) | 8 (g01 to g08) | 58 |

Cumulative catch of the 20 contaminated records: exact only
6 of 20 (misses 14), normalized exact 12 of 20, 4-gram level
20 of 20. Survivors: clean 36 plus sub-threshold 4 plus
quality probes 18 equals 58.

Examples, one per level:
- L1, e01: what is the capital of canada (verbatim B01).
- L2, n01: LIST  three primary colors and their names! (raw
  string differs from B07, canonical form matches).
- L3, g01: please answer what is the capital of canada today
  (shared 4-grams include what is the capital, is the capital
  of, and the capital of canada; full shared lists per record
  are in results_deep.json under ngram_shared).

Boundary: s01 to s04 each share at most 3 consecutive tokens
with a benchmark prompt and no 4-gram, and all survive. That
is the stated boundary of this rule, not an error.

## Reusable quality rule set, measured

Files: rules.json (name post-training-data-quality-rules,
version 1.0.0) and RULES.md, executable in quality_rules.py.
Another builder can copy rules.json and quality_rules.py,
adjust thresholds in the JSON, and run the same named rules.
Rules fire independently; one record can fire more than one
rule (q05 fires R02 and R03 by design), so counts are per rule.

| Rule | Build set, 536 records | Deep set, 78 records |
| --- | --- | --- |
| R01 short_instruction | 0 | 3 (q01, q02, q03) |
| R02 short_output | 288 | 3 (q04, q05, q06) |
| R03 placeholder_output | 288 | 3 (q05, q07, q08) |
| R04 url_in_instruction | 0 | 2 (q09, q10) |
| R05 repeated_token_dominance | 0 | 2 (q11, q12) |
| R06 missing_provenance | 0 | 2 (q13, q14) |
| R07 exact_duplicate_in_set | 24 | 2 (q15, q16) |
| R08 overlong_instruction | 0 | 2 (q17, q18) |
| Total fire events | 600 | 19 |

False-positive check: on Build clean records (192) every rule
fires 0. On Deep clean records (36, c001 to c036) every rule
fires 0. The Build fires are the designed flaws: the 288
poison records fire R02 and R03, and the 24 exact duplicates
fire R07, and no other Build record fires any rule.

## Failure modes

- Exact matching misses every contaminated record that is not
  verbatim: here it missed 14 of 20 by design.
- Normalized matching still misses embedded or extended
  copies: here it missed the 8 n-gram records.
- A 4-gram rule misses a paraphrase that changes at least one
  token in every block of 4, and it can flag benign text that
  happens to share a common 4-gram phrase with a benchmark
  prompt. The sub-threshold records show the other edge: a
  3-token overlap is not flagged at all.
- These token rules are screens, not semantic judgments. A
  fluent, wrong, or harmful record with a normal length and
  distinct tokens fires no rule here.
- The benchmark is synthetic and small (12 prompts), and the
  candidate set is synthetic and template based (78 records).
  The rates prove the accounting and the level contrast on
  this set. They say nothing about rates on a real benchmark
  or a real training corpus.
- R07 depends on set order (first record wins), as in Learn.
  R05 needs at least 4 output tokens, so a short repeated
  output such as todo todo todo fires R03 but not R05.
- Decontamination here checks instructions only, not outputs
  or input fields, matching the Learn scope.

## Run it

```bash
python3 level-3-deep/run_deep.py
python3 tests/test_deep_post_training_data.py
python3 tests/test_build_post_training_data.py
python3 tests/test_learn_post_training_data.py
python3 tests/test_layout.py
```

CI note: the GitHub workflow now runs the smoke test and all
three level test files on Python 3.12. That is the full local
suite (31 checks: 10 Deep, 8 Build, 12 Learn, plus smoke).

## Limits

The limits of this stage, and the open work, are in the repo root
REPORT.md (Threats to validity, v1.1 backlog).
