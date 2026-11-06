# Reusable data quality rule set: post-training-data-quality-rules v1.0.0

Machine readable file: rules.json in this folder, version 1.0.0.
Executable code: quality_rules.py in this folder, standard
library only. It loads rules.json, so another builder can copy
both files, keep or change the thresholds in the JSON, and run
the same named rules on their own records. A record needs the
fields instruction, output, source, license, and synthetic.

Rules fire independently. One record can fire more than one
rule, so per rule counts are not a partition of a dataset.

| Id | Name | Rule |
| --- | --- | --- |
| R01 | short_instruction | instruction tokens below 3 |
| R02 | short_output | output tokens below 2 |
| R03 | placeholder_output | at least 1 output token and every output token in unknown, todo, tbd |
| R04 | url_in_instruction | instruction tokens contain http, https, or www |
| R05 | repeated_token_dominance | output at least 4 tokens and the most common output token is over half of the output tokens |
| R06 | missing_provenance | source empty, or license empty, or synthetic flag is not true |
| R07 | exact_duplicate_in_set | Learn dedup key (normalized instruction plus output) already seen earlier in set order |
| R08 | overlong_instruction | instruction tokens over 12 |

Tokenizer: lowercase, runs of a to z and 0 to 9, the Learn
tokenizer, reused by import from level-1-learn/pipeline.py.
Measured fire counts on the Build and Deep sets, and the clean
false-positive check, are in README.md and results_deep.json
in this folder. These token rules are screens, not semantic
quality judgments; see the failure modes in README.md.
