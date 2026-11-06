# DOSSIER: post-training-data-lab (P28), updated at v1.0 ship, 2026-11-05

Written under the documentation and publishing standard (past, present, future). Updated at ship time.

## Past

Prior art for this project is named in NOVELTY.md (dataset curation tools (dedup and filtering pipelines)). The history of the problem, the key papers and systems, and what was tried before are recorded in the Roadmap v2 section text in SPEC.md and will be expanded with dated sources at the project's wave, before Build opens.

## Present

Current demand evidence: hiring value scored in the fleet pass (new candidates P23 to P29: see the decision pack Sections 4 and 5) [confirmed, fleet and scoring pass 2026-11-04; for P23 to P29, the decision pack 2026-11-04]. The Round 3 research (2026-11-04) found the market centre at post-training, evals, environments, and inference depth [confirmed as the research finding; the report is at ~/workspace/research_notes/roadmap-v3-revaluation-research-20261104-0949/report.md]. Tools and versions are pinned at Build time, not in this v1.

Ship state, 2026-11-05: Learn DONE (v0.1, grade 8,700 of 10,000), Build DONE (v0.5, grade 8,800 of 10,000), Deep DONE (v1.0, grade 8,300 of 10,000). All levels are standard library only, deterministic, and synthetic only, labelled synthetic everywhere. Deep adds a decontamination report against the repo own named synthetic benchmark SynthBench-P28-12 (12 prompts, 45 distinct word 4-grams, no external benchmark items downloaded or claimed) over 78 synthetic candidates (exact 6 removed, normalized exact 6 more, 4-gram overlap 8 more, 58 survivors, exact only 6 of 20 contaminated caught) and the reusable quality rule set post-training-data-quality-rules v1.0.0 in level-3-deep/rules.json (8 rules, 600 fire events on the Build set of 536 records, 19 on the Deep set, 0 on clean records in both sets). Full measured record: level-3-deep/README.md and level-3-deep/results_deep.json.

## Future

Open problems and the project's next steps sit in the Deep level scope in SPEC.md. Any forecast about this field is [unverified] unless a dated primary source is added here at the wave update.

The v1.1 backlog is in the repo root ROADMAP.md: a real public benchmark decontamination run under its license, an n-gram size and threshold sweep, output and input field decontamination, semantic quality rules, a per level downstream effect run, and larger candidate sets with a MinHash comparison. None of that is done or claimed at v1.0.
