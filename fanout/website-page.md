# Website project page copy: post-training-data-lab

Site: jesunahmadushno.com
Status: COPY ONLY, draft for the project page. Dated 2026-11-05.
Nothing on any website was changed by this file.

## Headline

post-training-data-lab: curation, decontamination, and data quality rules, measured on synthetic data and labelled as synthetic

## Summary

post-training-data-lab is an open post-training data
engineering study built by Jesun Ahmad Ushno as project P28
in Roadmap v3. It builds the data pipeline that sits before
training three times: a small Learn curation pipeline, a Build
synthetic generation and mixture study, and a Deep
decontamination report with a reusable quality rule set. It
runs on the Python standard library only, for every executed
step.

One scope fact, stated plainly. All data in this project is synthetic, generated or hand listed by this project and labelled synthetic in every file. No real data was used, downloaded, or claimed, and no external benchmark items were downloaded or claimed. The Deep benchmark is the project own synthetic benchmark, SynthBench-P28-12.

Status: v1.0, 2026-11-05. Learn, Build, and Deep are done.
Total tests: 31 checks (12 Learn, 8 Build, 10
Deep, plus the scaffold smoke test).

## Results (synthetic data only)

| Level | Scenario | Key result | Notes |
| --- | --- | --- | --- |
| Learn | 20 raw synthetic records, 2 synthetic benchmark prompts | 19 after exact dedup, 18 after near dedup, 15 after quality, 14 after decontamination; 12 train, 2 eval, 0 leakage pairs | 12 checks plus smoke |
| Build | 536 generated synthetic records, held-out synthetic eval of 80 | Filtered to 192 clean; raw mix accuracy 0.0, filtered mix accuracy 1.0, same Naive Bayes classifier | Designed stress mix: 288 poison of 536 |
| Deep | 78 synthetic candidates, SynthBench-P28-12 (12 prompts, 45 distinct 4-grams) | Exact caught 6 of 20 contaminated, 4-gram level caught 20 of 20, 58 survivors; quality rules 600 events on Build set, 19 on Deep set, 0 on clean records | 8 reusable rules, v1.0.0 |

## Honest limits

- Synthetic only: no real dataset and no public benchmark was
  measured. The rates prove the accounting on these sets.
- The Build contrast is designed: a majority poison share and
  a template task, not a natural data mix.
- The quality rules are token and provenance screens, not
  semantic judgments.
- Decontamination checks instructions only, at one n-gram
  size and one threshold.

## Links

- GitHub repo: https://github.com/JesunAhmadUshno/post-training-data-lab
- Release v0.1 (Learn): https://github.com/JesunAhmadUshno/post-training-data-lab/releases/tag/v0.1
- Release v0.5 (Build): https://github.com/JesunAhmadUshno/post-training-data-lab/releases/tag/v0.5
- Release v1.0 (Learn, Build, Deep): https://github.com/JesunAhmadUshno/post-training-data-lab/releases/tag/v1.0
- Docs page: https://jesunahmadushno.github.io/post-training-data-lab/
- Tutorial: fanout/tutorial.md in the GitHub repo
- Blog post draft: fanout/blog-post.md in the GitHub repo

## License note

Code: Apache-2.0. Tutorials: CC BY 4.0.
