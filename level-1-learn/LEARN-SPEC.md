# LEARN-SPEC: P28 Level 1, post-training data curation pipeline

Written before any code, per the house spec-first rule. All expected
values below are hand-computed from the raw set defined here. Code
that disagrees with this spec is wrong, not the spec.

## Idea

Post-training data work starts before any training: curate raw
instruction examples, remove duplicates, filter low quality records,
remove benchmark contamination, convert survivors to a validated
SFT-style format, split train and eval with a leakage check, and
report every stage with measured counts in a datasheet.

## Raw set (synthetic, self-authored, labelled synthetic everywhere)

20 records, ids r01 to r20, fields: id, instruction, input, output,
source, license, category. Source for every record is the string
synthetic-teaching-set. License for every record is CC BY 4.0 for
self-authored synthetic text. No real data, no downloaded data, and
no public dataset is used or claimed at this level.

Designed cases, by id:

- r01: valid factual. Instruction tokens 6, output tokens 11.
- r02: exact duplicate of r01 after normalization (case and spacing
  differ only). Removed by exact dedup.
- r03: valid writing. Instruction tokens 7, output tokens 10.
- r04: near duplicate of r03. Its instruction token set adds one
  token, down, to the 7 tokens of r03, so the Jaccard overlap is
  7 divided by 8, which is 0.875. At threshold 0.8 it is removed.
- r05: output is one token, Four. Removed by the quality filter
  (output must have at least 2 tokens).
- r06: output is empty. Removed by the quality filter.
- r07: instruction is one token, Hi. Removed by the quality filter
  (instruction must have at least 3 tokens).
- r08 to r17, r19, r20: valid records, except r18 below.
- r14: the only record with a non-empty input field, used to test
  the SFT user-content join (instruction, newline, input).
- r18: instruction exactly matches a benchmark prompt (see below).
  Removed by decontamination.

## Tokenizer (the one definition used everywhere)

Lowercase the text, then take maximal runs of a to z and 0 to 9 as
tokens. Punctuation and symbols are separators, never tokens.

Hand-computed token counts for the 14 survivors:

| id | instruction tokens | output tokens |
| --- | --- | --- |
| r01 | 6 | 11 |
| r03 | 7 | 10 |
| r08 | 4 | 12 |
| r09 | 8 | 7 |
| r10 | 4 | 5 |
| r11 | 4 | 7 |
| r12 | 6 | 10 |
| r13 | 7 | 10 |
| r14 | 6 | 9 |
| r15 | 6 | 9 |
| r16 | 7 | 10 |
| r17 | 8 | 8 |
| r19 | 5 | 9 |
| r20 | 5 | 10 |

Instruction token sum 83, mean 83 over 14, which is 5.928571
rounded to 6 places. (Correction during build: r16 counts 7, not 6,
because its instruction includes the token an. The unit test caught
the first hand count, the spec was fixed before ship, and the code
was not changed to fit the wrong number.) Output token sum 127, mean 127 over 14,
which is 9.071429 rounded to 6 places.

Note on r09: the output is code, def add(a, b): return a + b, and
the tokenizer counts def, add, a, b, return, a, b, which is 7.
Note on r17: the output contains text[::-1], and the tokenizer
counts use, slicing, text, 1, to, reverse, the, string, which is 8.

## Pipeline stages and hand-computed stage counts

Order is fixed: exact dedup, near dedup, quality, decontamination.

1. Raw: 20.
2. Exact dedup: key is the normalized instruction plus a separator
   plus the normalized output, where normalization is lowercase,
   whitespace collapsed, ends stripped. Removes r02. Left: 19.
3. Near dedup: Jaccard overlap of instruction token sets, threshold
   0.8, first record in id order wins. Removes r04 (0.875 vs r03).
   No other surviving pair reaches 0.8 (checked by hand in the
   design notes: the next closest designed pair, r09 vs r17,
   shares write, a, python, to, which is 4 over a union of 12,
   which is 0.333). Left: 18.
4. Quality filters: instruction at least 3 tokens, output at least
   2 tokens, output non-empty. Removes r05, r06, r07. Left: 15.
5. Decontamination: normalized instruction must not equal any
   normalized benchmark prompt. The synthetic teaching benchmark
   has 2 prompts: What is the capital of Canada, and State the
   theorem of Pythagoras. The first matches r18 exactly, the
   second matches nothing. Removes r18. Left: 14.

Final ids in order: r01, r03, r08, r09, r10, r11, r12, r13, r14,
r15, r16, r17, r19, r20.

Category counts in the final set: factual 9, writing 2, code 2,
language 1. Total 14.

## SFT conversion and schema

Each survivor becomes one record:

- id: the raw id, unchanged.
- messages: exactly 3 items, roles in order system, user, assistant.
  System content is the constant: You are a helpful assistant.
  User content is the instruction, plus a newline plus the input
  when input is non-empty. Assistant content is the output.
- source and license: copied from the raw record.

Schema validation checks: id is a non-empty string, messages has
length 3, roles are in the fixed order, every content is a
non-empty string, source and license are non-empty strings.
All 14 converted records must pass. A record with a missing
assistant message must fail (unit test).

For r14, the user content must be exactly the instruction, a
newline, and the input Ingredients: cheese, lettuce, bread.

## Split and leakage

Sort final ids ascending. Eval takes indices where index mod 5
equals 4 (0-based). Train takes the rest.

- Index 4 is r10, index 9 is r15. Eval: r10, r15 (2 records).
- Train: the other 12 records.

Leakage check: the set of normalized instruction-plus-output keys
in train intersected with eval must be empty (count 0), and no
train instruction may have Jaccard overlap at or above 0.8 with
any eval instruction. Both counts are reported, both are 0 by
construction after dedup.

## Results file

run_learn.py writes results_learn.json with the stage counts, the
removed ids per stage, the final ids, the split ids, the leakage
counts, the category counts, and the token sums and means above.
The file must be deterministic and byte-identical across two runs.

## Acceptance

- All hand-computed values above are asserted by unit tests.
- The runner runs with the standard library only.
- The level README teaches the pipeline, carries a datasheet
  (source, license, stages, known limits), and states the exact
  Summary claim with the full measured table.
