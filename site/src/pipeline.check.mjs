// Known-answer parity check, run by "npm run build" before vite: the browser ports in pipeline.js
// must reproduce the committed level-*/results_*.json from the committed data files, or the build fails.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  parseJsonl, parseLearnConfig, runPipeline, trainNB, evaluateNB, mixture,
  decontaminateLevels, benchmarkNgrams, sweepPoint, applyRules, wilson,
} from './pipeline.js';

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const json = (p) => JSON.parse(read(p));
const learn = json('level-1-learn/results_learn.json');
const build = json('level-2-build/results_build.json');
const dose = json('level-2-build/results_dose.json');
const deepRes = json('level-3-deep/results_deep.json');
const sweep = json('level-3-deep/results_sweep.json');
const rules = json('level-3-deep/rules.json');
const cfg = parseLearnConfig(read('level-1-learn/pipeline.py'));
const learnRaw = parseJsonl(read('level-1-learn/learn_raw.jsonl'));
const raw = parseJsonl(read('level-2-build/synthetic_data.jsonl'));
const evalSet = parseJsonl(read('level-2-build/synthetic_eval.jsonl'));
const deep = parseJsonl(read('level-3-deep/deep_candidates.jsonl'));

// 1. Learn pipeline on the 20 teaching records.
const L = runPipeline(learnRaw, cfg);
assert.deepEqual(L.counts, [learn.raw_count, learn.after_exact_dedup, learn.after_near_dedup, learn.after_quality, learn.after_decontamination]);
assert.deepEqual(L.removed, { exact: learn.removed_exact, near: learn.removed_near, quality: learn.removed_quality, contaminated: learn.removed_contaminated });

// 2. Same pipeline on the 536 Build records: 512 / 482 / 194 / 192.
const B = runPipeline(raw, cfg);
assert.deepEqual(B.counts, [build.raw_count, build.after_exact_dedup, build.after_near_dedup, build.after_quality, build.after_decontamination]);
assert.deepEqual(B.removed.exact, build.removed_exact);
assert.deepEqual(B.removed.near, build.removed_near);
assert.equal(B.removed.quality.length, build.removed_quality_count);
assert.deepEqual(B.removed.contaminated, build.removed_contaminated);
assert.deepEqual(B.final.map((r) => r.id), build.filtered_ids);

// 3. Naive Bayes: mixture A (all 536) and mixture B (192 filtered).
for (const [train, rec] of [[raw, build.mixture_a.eval], [B.final, build.mixture_b.eval]]) {
  const e = evaluateNB(trainNB(train), evalSet);
  assert.equal(e.correct, rec.correct);
  assert.deepEqual(e.confusion, rec.confusion);
  for (const [c, row] of Object.entries(rec.per_category)) assert.equal(e.perCategory[c].correct, row.correct);
}
assert.equal(mixture(raw, 72, true).length, raw.length);

// 4. Every recorded dose point from run_dose.py.
for (const p of dose.dose) {
  const train = mixture(raw, p.poison_per_category);
  assert.equal(train.length, p.train_count);
  assert.equal(evaluateNB(trainNB(train), evalSet).correct, p.correct, `dose k=${p.poison_per_category}`);
}

// 5. Wilson intervals match the Python values.
assert.deepEqual(wilson(0, 80), dose.wilson95.mixture_a);
assert.deepEqual(wilson(80, 80), dose.wilson95.mixture_b);
assert.deepEqual(wilson(0, 20), dose.wilson95.per_category_0_of_20);
assert.deepEqual(wilson(20, 20), dose.wilson95.per_category_20_of_20);

// 6. Deep decontamination ladder at the v1.0 setting: 72 / 66 / 58.
const D = decontaminateLevels(deep, deepRes.benchmark_prompts, deepRes.ngram_n, deepRes.ngram_min_shared);
assert.equal(deep.length, deepRes.deep_candidate_count);
assert.deepEqual(D.removedExact, deepRes.removed_exact);
assert.deepEqual(D.removedNormalized, deepRes.removed_normalized);
assert.deepEqual(D.removedNgram, deepRes.removed_ngram);
assert.deepEqual(D.shared, deepRes.ngram_shared);
assert.deepEqual(D.survivors.map((r) => r.id), deepRes.survivor_ids);
assert.equal(benchmarkNgrams(deepRes.benchmark_prompts, 4).size, deepRes.benchmark_ngram_count);

// 7. Every recorded sweep cell from run_sweep.py.
for (const g of sweep.grid) {
  const s = sweepPoint(deep, deepRes.benchmark_prompts, g.n, g.min_shared);
  assert.deepEqual([s.caught, s.missed, s.falseFlagIds, s.survivorsCount, s.benchmarkNgrams],
    [g.caught, g.missed, g.false_flag_ids, g.survivors, g.benchmark_ngrams], `sweep n=${g.n} min=${g.min_shared}`);
}

// 8. Rule set: Build 600 fires, Deep 19, clean subsets 0.
const cmp = (records, rec) => { const r = applyRules(records, rules); assert.deepEqual(r.counts, rec.counts); assert.equal(r.total, rec.total_fire_events); };
cmp(raw, deepRes.build_rules);
cmp(deep, deepRes.deep_rules);
cmp(raw.filter((r) => r.tier === 'clean'), deepRes.build_clean_rules);
cmp(deep.filter((r) => r.group === 'clean'), deepRes.deep_clean_rules);

console.log('pipeline parity ok', {
  learn: L.counts, build: B.counts, nbA: build.mixture_a.eval.correct, nbB: build.mixture_b.eval.correct,
  dosePoints: dose.dose.length, deepSurvivors: D.survivors.length, sweepCells: sweep.grid.length,
  buildFires: deepRes.build_rules.total_fire_events,
});
