# DEEP-SPEC: P28 Deep, decontamination report and reusable quality rule set

Written before the Deep code, 2026-11-05. All data is synthetic and
labelled synthetic. No real data is used, downloaded, or claimed.
No external benchmark items were downloaded or claimed.

## Benchmark, named

Name: SynthBench-P28-12.
Composition: 12 synthetic prompts, written for this project.
Prompts B01 and B02 are the 2 synthetic benchmark prompts already
used at Learn level, kept verbatim. Prompts B03 to B12 are new
synthetic prompts written for this level. This is the repo own
named synthetic benchmark, extended from Learn. It is not MMLU,
not GSM8K, not any public benchmark, and no public benchmark
items are reproduced or claimed here.

| Id | Prompt (canonical, lowercase) | Tokens |
| --- | --- | --- |
| B01 | what is the capital of canada | 6 |
| B02 | state the theorem of pythagoras | 5 |
| B03 | explain how photosynthesis converts sunlight into energy | 8 |
| B04 | write a haiku about autumn leaves falling | 7 |
| B05 | describe the water cycle stages in order | 8 |
| B06 | translate hello to french for a visitor | 7 |
| B07 | list three primary colors and their names | 7 |
| B08 | how do you make a sandwich at home | 8 |
| B09 | define machine learning in simple terms | 6 |
| B10 | give an example of a palindrome word | 7 |
| B11 | explain what an api does for software | 7 |
| B12 | describe how a hash table stores values | 7 |

Tokenizer, everywhere: the Learn tokenizer (lowercase, runs of
a to z and 0 to 9), imported from level-1-learn/pipeline.py.

## Decontamination levels, definitions

- L1 exact: raw instruction string equals a benchmark prompt
  string, character for character, case sensitive, no trimming.
- L2 normalized exact: canonical form equals a benchmark
  canonical form, where canonical form is the Learn tokens
  joined by single spaces (lowercase, punctuation removed,
  whitespace collapsed). L2 is applied to L1 survivors, and
  counts reported are additional removals at that level.
- L3 n-gram overlap: word 4-grams of the instruction. A record
  is flagged if it shares at least 1 word 4-gram with the union
  of benchmark 4-grams. Threshold stated: n equals 4, minimum
  shared 4-grams equals 1. L3 is applied to L2 survivors, and
  counts reported are additional removals at that level.

## Deep candidate set, design (78 records, in this order)

| Group | Ids | Count | Design |
| --- | --- | --- | --- |
| Clean | c001 to c036 | 36 | Template verb plus unique topic token plus in simple terms, 5 instruction tokens, Build style output templates, distinct tokens, full provenance |
| Exact contaminated | e01 to e06 | 6 | Verbatim B01 to B06 |
| Normalized contaminated | n01 to n06 | 6 | B07 to B12 with changed case, extra spaces, and trailing punctuation, so raw strings differ but canonical forms match |
| N-gram contaminated | g01 to g08 | 8 | B01 to B08 embedded in a longer instruction, retaining at least one benchmark 4-gram, not exact in raw or canonical form |
| Sub-threshold boundary | s01 to s04 | 4 | Share at most 3 consecutive tokens with a benchmark prompt, share no 4-gram, must survive all levels |
| Quality probes | q01 to q18 | 18 | Each designed to fire its named quality rule or rules, and no 4-gram benchmark overlap, so all survive decontamination |

Contaminated total, by design: e plus n plus g equals 20.

Hand-computed decontamination oracles:

| Level | Additional removed | Removed ids | Survivors |
| --- | --- | --- | --- |
| Raw | - | - | 78 |
| L1 exact | 6 | e01, e02, e03, e04, e05, e06 | 72 |
| L2 normalized exact | 6 | n01, n02, n03, n04, n05, n06 | 66 |
| L3 4-gram, at least 1 shared | 8 | g01, g02, g03, g04, g05, g06, g07, g08 | 58 |

Survivors by design: clean 36 plus sub-threshold 4 plus quality
probes 18 equals 58.
Exact only (the Learn method) catches 6 of 20 contaminated and
misses 14. Normalized exact catches 12 of 20 cumulatively.
The 4-gram level catches 20 of 20 cumulatively. Sub-threshold
records s01 to s04 survive by design, which is the stated
boundary of a 4-gram rule: a 3-token overlap is not flagged.

Boundary checks, hand-computed:
- s01 shares what is the (3 tokens) with B01, 4th token differs.
- s02 shares state the theorem (3) with B02, 4th token differs.
- s03 shares explain how photosynthesis (3) with B03, 4th differs.
- s04 shares write a haiku (3) with B04, 4th token differs.
- g01 contains what is the capital and is the capital of.

## Reusable data quality rule set, design

File: level-3-deep/rules.json, version 1.0.0, plus RULES.md.
Each rule is named, versioned in that file, and executable in
level-3-deep/quality_rules.py. Rules fire independently, so one
record can fire more than one rule; counts are per rule, not a
partition. Build set means the Build generator raw set (536
records, from level-2-build/generator.py by import). Deep set
means the 78 records above. Clean false-positive check means
the rule set applied to designated clean records only.

| Rule | Definition | Build oracle | Deep oracle |
| --- | --- | --- | --- |
| R01 short_instruction | instruction tokens below 3 | 0 | 3 (q01, q02, q03) |
| R02 short_output | output tokens below 2 | 288 (all poison, 1 token output) | 3 (q04, q05, q06) |
| R03 placeholder_output | at least 1 output token and every output token in unknown, todo, tbd | 288 (all poison, output unknown) | 3 (q05, q07, q08) |
| R04 url_in_instruction | instruction tokens contain http, https, or www | 0 | 2 (q09, q10) |
| R05 repeated_token_dominance | output at least 4 tokens and the most common output token is over half of output tokens | 0 | 2 (q11, q12) |
| R06 missing_provenance | source empty, or license empty, or synthetic flag is not true | 0 | 2 (q13, q14) |
| R07 exact_duplicate_in_set | normalized instruction plus output key already seen earlier in set order (Learn dedup_key) | 24 (exact duplicate tier) | 2 (q15 copies c001, q16 copies c002) |
| R08 overlong_instruction | instruction tokens over 12 | 0 | 2 (q17 at 16 tokens, q18 at 14 tokens) |

Build reasoning: clean, exact, near, and contaminated Build
instructions are 5 to 6 tokens with outputs of 7 to 9 distinct
tokens and full provenance; poison instructions are 5 tokens
with a 1 token output unknown and full provenance and unique
topics; contaminated outputs differ by their number token, so
their dedup keys differ; only the 24 exact duplicates repeat a
key already seen.
Deep reasoning: every c, e, n, g, and s record is built to fire
no quality rule; every q record fires only its intended rule,
except q05, whose 1 token output unknown fires both R02 and
R03 by design. Total Deep fire events: 19 across 18 q records.

False-positive oracles: on Build clean records (192), every
rule fires 0. On Deep clean records (c001 to c036, 36 records),
every rule fires 0.

## Determinism

No randomness in Deep data: clean topics are sequential, every
other record is hand listed. Runner run_deep.py writes
results_deep.json with sorted keys. Two runs must be
byte-identical.

## Failure modes, to be written in the README

Exact and normalized matching miss paraphrase contamination.
A 4-gram rule misses a paraphrase that changes every 4th token
and flags benign text that happens to share a common 4-gram.
Short token rules are not semantic quality judgments. The
benchmark here is synthetic and small, so the rates prove the
accounting and the level contrast on this set, not rates on
any real benchmark or real training corpus.
