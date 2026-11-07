// Browser ports of the repo's Python, kept line-for-line close so pipeline.check.mjs can
// assert they reproduce the committed results:
//   level-1-learn/pipeline.py      tokens, normalize, dedup_key, jaccard, the four filter stages
//   level-2-build/model.py         multinomial Naive Bayes, alpha 1.0, alphabetical tie-break
//   level-3-deep/decontaminate.py  exact / normalized / word n-gram ladder
//   level-3-deep/quality_rules.py  _fires, thresholds read from rules.json
//   level-2-build/run_dose.py      wilson

// Same regex and lowercasing as pipeline.py: ASCII letters and digits only.
export const tokens = (text) => text.toLowerCase().match(/[a-z0-9]+/g) || [];
export const tokenSet = (text) => new Set(tokens(text));
export const normalize = (text) => text.toLowerCase().split(/\s+/).filter(Boolean).join(' ');
export const dedupKey = (r) => `${normalize(r.instruction)} || ${normalize(r.output)}`;
export function jaccard(a, b) {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

export const parseJsonl = (text) => text.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));

// Reads the Learn constants and benchmark prompts out of pipeline.py itself.
export function parseLearnConfig(py) {
  const num = (name) => Number(py.match(new RegExp(`^${name} = ([\\d.]+)`, 'm'))[1]);
  const block = py.match(/BENCHMARK_PROMPTS = \[([\s\S]*?)\]/)[1];
  return {
    threshold: num('NEAR_DUP_THRESHOLD'),
    minIns: num('MIN_INSTRUCTION_TOKENS'),
    minOut: num('MIN_OUTPUT_TOKENS'),
    prompts: [...block.matchAll(/"([^"]*)"/g)].map((m) => m[1]),
  };
}

export function exactDedup(records) {
  const seen = new Set(), kept = [], removed = [];
  for (const r of records) {
    const k = dedupKey(r);
    if (seen.has(k)) removed.push(r.id); else { seen.add(k); kept.push(r); }
  }
  return [kept, removed];
}

export function nearDedup(records, threshold) {
  const kept = [], removed = [], sets = [];
  for (const r of records) {
    const s = tokenSet(r.instruction);
    if (sets.some((ks) => jaccard(s, ks) >= threshold)) removed.push(r.id);
    else { kept.push(r); sets.push(s); }
  }
  return [kept, removed];
}

export function qualityFilter(records, minIns, minOut) {
  const kept = [], removed = [];
  for (const r of records) {
    if (tokens(r.instruction).length < minIns || tokens(r.output).length < minOut) removed.push(r.id);
    else kept.push(r);
  }
  return [kept, removed];
}

export function decontaminate(records, prompts) {
  const bench = new Set(prompts.map(normalize));
  const kept = [], removed = [];
  for (const r of records) (bench.has(normalize(r.instruction)) ? removed.push(r.id) : kept.push(r));
  return [kept, removed];
}

export function runPipeline(raw, { threshold, minIns, minOut, prompts }) {
  const [a, removedExact] = exactDedup(raw);
  const [b, removedNear] = nearDedup(a, threshold);
  const [c, removedQuality] = qualityFilter(b, minIns, minOut);
  const [final, removedContam] = decontaminate(c, prompts);
  return {
    counts: [raw.length, a.length, b.length, c.length, final.length],
    removed: { exact: removedExact, near: removedNear, quality: removedQuality, contaminated: removedContam },
    final,
  };
}

// ---- model.py ----
export function trainNB(records) {
  const categories = [...new Set(records.map((r) => r.category))].sort();
  const classCounts = {}, tokenCounts = {}, totals = {};
  for (const c of categories) { classCounts[c] = 0; tokenCounts[c] = new Map(); totals[c] = 0; }
  const vocab = new Set();
  for (const r of records) {
    classCounts[r.category]++;
    for (const t of tokens(r.instruction)) {
      vocab.add(t);
      tokenCounts[r.category].set(t, (tokenCounts[r.category].get(t) || 0) + 1);
      totals[r.category]++;
    }
  }
  return { categories, classCounts, tokenCounts, totals, vocab, n: records.length };
}

export function predictNB(m, instruction) {
  const v = m.vocab.size, toks = tokens(instruction);
  let best = null, bestScore = 0;
  for (const c of m.categories) { // alphabetical, strict > keeps the first on ties
    let score = Math.log(m.classCounts[c] / m.n);
    const denom = m.totals[c] + v;
    for (const t of toks) if (m.vocab.has(t)) score += Math.log(((m.tokenCounts[c].get(t) || 0) + 1) / denom);
    if (best === null || score > bestScore) { best = c; bestScore = score; }
  }
  return best;
}

export function evaluateNB(m, evalRecords) {
  let correct = 0;
  const confusion = {}, perCategory = {};
  for (const r of evalRecords) {
    const pred = predictNB(m, r.instruction);
    const row = (perCategory[r.category] ||= { correct: 0, total: 0 });
    row.total++;
    const key = `${r.category}->${pred}`;
    confusion[key] = (confusion[key] || 0) + 1;
    if (pred === r.category) { correct++; row.correct++; }
  }
  return { correct, total: evalRecords.length, confusion, perCategory };
}

// Clean records plus the first k poison records of each source category (p001-p072 code, p073-p144 factual, ...),
// exactly as run_dose.py builds its dose points. withOtherTiers adds the duplicate and contaminated tiers too.
export function mixture(raw, k, withOtherTiers = false, perBlock = 72) {
  return raw.filter((r) => {
    if (r.tier === 'clean') return true;
    if (r.tier === 'low_quality_poison') return (Number(r.id.slice(1)) - 1) % perBlock < k;
    return withOtherTiers;
  });
}

// ---- decontaminate.py ----
export const canonical = (text) => tokens(text).join(' ');
export function wordNgrams(text, n) {
  const t = tokens(text), out = new Set();
  for (let i = 0; i + n <= t.length; i++) out.add(t.slice(i, i + n).join(' '));
  return out;
}
export function benchmarkNgrams(prompts, n) {
  const out = new Set();
  for (const p of prompts) for (const g of wordNgrams(p, n)) out.add(g);
  return out;
}
export function decontaminateLevels(records, prompts, n, minShared) {
  const canon = new Set(prompts.map(canonical)), grams = benchmarkNgrams(prompts, n);
  const removedExact = [], removedNormalized = [], removedNgram = [], shared = {}, survivors = [];
  for (const r of records) {
    if (prompts.includes(r.instruction)) { removedExact.push(r.id); continue; }
    if (canon.has(canonical(r.instruction))) { removedNormalized.push(r.id); continue; }
    const s = [...wordNgrams(r.instruction, n)].filter((g) => grams.has(g)).sort();
    if (s.length >= minShared) { removedNgram.push(r.id); shared[r.id] = s; } else survivors.push(r);
  }
  return { removedExact, removedNormalized, removedNgram, shared, survivors, benchmarkNgrams: grams.size };
}
export const POSITIVE_GROUPS = new Set(['exact_contaminated', 'normalized_contaminated', 'ngram_contaminated']);
export function sweepPoint(deep, prompts, n, minShared) {
  const d = decontaminateLevels(deep, prompts, n, minShared);
  const group = Object.fromEntries(deep.map((r) => [r.id, r.group]));
  const removed = [...d.removedExact, ...d.removedNormalized, ...d.removedNgram];
  const positives = deep.filter((r) => POSITIVE_GROUPS.has(r.group)).length;
  const caught = removed.filter((i) => POSITIVE_GROUPS.has(group[i])).length;
  const falseFlagIds = removed.filter((i) => !POSITIVE_GROUPS.has(group[i])).sort();
  return { ...d, caught, missed: positives - caught, falseFlagIds, survivorsCount: d.survivors.length };
}

// ---- quality_rules.py ----
export function ruleFires(rec, rules, seenKeys) {
  const R = Object.fromEntries(rules.rules.map((r) => [r.id, r]));
  const out = [], ins = tokens(rec.instruction || ''), outs = tokens(rec.output || '');
  if (ins.length < R.R01.min_instruction_tokens) out.push('R01');
  if (outs.length < R.R02.min_output_tokens) out.push('R02');
  if (outs.length && outs.every((t) => R.R03.placeholder_tokens.includes(t))) out.push('R03');
  if (ins.some((t) => R.R04.url_tokens.includes(t))) out.push('R04');
  if (outs.length >= R.R05.dominance_min_tokens) {
    const c = {};
    for (const t of outs) c[t] = (c[t] || 0) + 1;
    if (Math.max(...Object.values(c)) / outs.length > R.R05.dominance_threshold) out.push('R05');
  }
  if (!rec.source || !rec.license || rec.synthetic !== true) out.push('R06');
  const key = dedupKey({ instruction: rec.instruction || '', output: rec.output || '' });
  if (seenKeys.has(key)) out.push('R07'); else seenKeys.add(key);
  if (ins.length > R.R08.max_instruction_tokens) out.push('R08');
  return out;
}
export function applyRules(records, rules) {
  const seen = new Set(), counts = Object.fromEntries(rules.rules.map((r) => [r.id, 0]));
  for (const r of records) for (const id of ruleFires(r, rules, seen)) counts[id]++;
  return { counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
}

// ---- run_dose.py ----
export function wilson(k, n, z = 1.959963984540054) {
  const p = k / n, d = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / d;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  const r6 = (x) => Math.round(x * 1e6) / 1e6;
  return [r6(Math.max(0, centre - half)), r6(Math.min(1, centre + half))];
}
