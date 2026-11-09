# post-training-data-lab

Post-training data engineering, built and measured in public: curation, dedup, decontamination, synthetic data with filtering, and data mixtures with a measured downstream effect. Plain scope, stated first: every dataset in this repo is synthetic, generated or hand listed by this project and labelled synthetic in every file. No real data was used, downloaded, or claimed, and no external benchmark items were downloaded or claimed. Every level runs on the Python standard library only.

- Learn: a curation pipeline on a synthetic teaching set of 20 raw records: 19 after exact dedup, 18 after near dedup at Jaccard 0.8, 15 after quality filters, 14 after decontamination against 2 synthetic benchmark prompts, split 12 train and 2 eval with 0 leakage pairs. 12 checks plus the scaffold smoke test.
- Build: a seeded synthetic generator (536 records: 192 clean, 24 exact duplicates, 24 near duplicates, 288 low-quality poison, 8 contaminated) filtered through the Learn pipeline to 192 clean records, and a mixture study on a held-out synthetic eval set of 80: the raw mix scored accuracy 0.0 and the filtered mix scored 1.0 with the same Naive Bayes classifier. 8 checks.
- Deep: a decontamination report against the named synthetic benchmark SynthBench-P28-12 (12 prompts, no external benchmark items used or claimed) over 78 synthetic candidates: exact removed 6, normalized exact removed 6 more, word 4-gram overlap removed 8 more, leaving 58, so exact only caught 6 of 20 contaminated and the 4-gram level caught 20 of 20. Plus the reusable quality rule set v1.0.0 (8 rules): 600 fire events on the Build set of 536 records, 19 on the Deep set, and 0 on clean records in both sets. 10 checks.

Tests: 31 checks in total (12 Learn, 8 Build, 10 Deep, plus the scaffold smoke test).

Every number above is already published in this repo (README.md, REPORT.md, and the three level READMEs and results files) and reproduced by the runners in this repo, checked in CI. The v1.1 backlog in REPORT.md names the real public benchmark decontamination run, the n-gram sweep, and the semantic quality rules that would replace the synthetic-only scope.

Releases: https://github.com/JesunAhmadUshno/post-training-data-lab/releases
