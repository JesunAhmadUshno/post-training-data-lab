# ROADMAP: post-training-data-lab, v1.1 backlog

Status at v1.0 (2026-11-05): Learn, Build, and compressed Deep
are DONE. Deep in December scope was the single hardest
capability in the SPEC: a decontamination report against a
named benchmark (done against the repo own SynthBench-P28-12)
and a reusable data quality rule set (rules.json v1.0.0).
The rest of the v2 Deep scope is this v1.1 backlog. Nothing
below is done or claimed.

## v1.1 backlog

1. Decontamination against a real public benchmark, with its
   actual items obtained under its license, the license and
   source recorded per item, and rates reported separately
   from the synthetic SynthBench-P28-12 rates.
2. N-gram size and threshold sweep (n equals 4, 8, and 13,
   with a minimum shared count above 1), with false positive
   and false negative rates per setting on a labelled set.
3. Output and input field decontamination, not instructions
   only, plus a paraphrase contamination tier that changes
   at least one token in every block of 4.
4. Semantic quality rules: a classifier or model based
   quality screen and a small human labelled agreement check,
   reported next to the token rules in RULES.md.
5. A downstream run that trains the Build proxy model after
   each decontamination level and reports the per level
   effect, so the level contrast is measured downstream too.
6. Larger candidate sets (thousands of records) with a
   performance measure for the n-gram index, and a MinHash
   near duplicate comparison next to R07.

## Held, unchanged

- PyPI publishing: needs a new credential, Jesun tap only.
- Social posting: the loop prepares drafts and never posts;
  Threads always waits for Jesun tap per post.
