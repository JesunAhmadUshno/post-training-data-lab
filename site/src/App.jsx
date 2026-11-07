import { useMemo, useState, useEffect, useId } from 'react';
import learn from '../../level-1-learn/results_learn.json';
import build from '../../level-2-build/results_build.json';
import dose from '../../level-2-build/results_dose.json';
import deepRes from '../../level-3-deep/results_deep.json';
import sweep from '../../level-3-deep/results_sweep.json';
import rules from '../../level-3-deep/rules.json';
import pipelinePy from '../../level-1-learn/pipeline.py?raw';
import learnRawText from '../../level-1-learn/learn_raw.jsonl?raw';
import buildRawText from '../../level-2-build/synthetic_data.jsonl?raw';
import evalText from '../../level-2-build/synthetic_eval.jsonl?raw';
import deepText from '../../level-3-deep/deep_candidates.jsonl?raw';
import learnReadme from '../../level-1-learn/README.md?raw';
import buildReadme from '../../level-2-build/README.md?raw';
import deepReadme from '../../level-3-deep/README.md?raw';
import roadmap from '../../ROADMAP.md?raw';
import {
  parseJsonl, parseLearnConfig, runPipeline, trainNB, evaluateNB, mixture, tokenSet, jaccard,
  wordNgrams, benchmarkNgrams, sweepPoint, ruleFires, dedupKey, wilson,
} from './pipeline.js';

const testFiles = import.meta.glob('../../tests/*.py', { query: '?raw', import: 'default', eager: true });

const REPO = 'https://github.com/JesunAhmadUshno/post-training-data-lab';
const blob = (p) => `${REPO}/blob/main/${p}`;
const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;

const CFG = parseLearnConfig(pipelinePy);
const LEARN_RAW = parseJsonl(learnRawText);
const RAW = parseJsonl(buildRawText);
const EVAL = parseJsonl(evalText);
const DEEP = parseJsonl(deepText);
const BY_ID = Object.fromEntries([...LEARN_RAW.map((r) => [`L:${r.id}`, r]), ...RAW.map((r) => [r.id, r])]);
const DEEP_BY_ID = Object.fromEntries(DEEP.map((r) => [r.id, r]));
const CATS = Object.keys(build.eval_label_counts);
const N_EVAL = build.eval_count;
const PROMPTS = deepRes.benchmark_prompts;
const RULE_IDS = rules.rules.map((r) => r.id);
const POISON_MAX = Math.max(...dose.dose.map((d) => d.poison_per_category));
const BUILD_STAGES = [build.raw_count, build.after_exact_dedup, build.after_near_dedup, build.after_quality, build.after_decontamination];
const STAGE_NAMES = ['Raw', 'Exact dedup', 'Near dedup', 'Quality', 'Decontaminated'];

// Grades and their named deductions, parsed from each level README.
function parseGrade(md) {
  const flat = md.replace(/\s+/g, ' ');
  const m = flat.match(/## Grade ([\d,]+) of ([\d,]+)\. Deductions: (.*?) Total deductions ([\d,]+)\./);
  const deductions = [...m[3].matchAll(/\s*(.*?)\s*\(minus ([\d,]+)\)[;.]?/g)].map((d) => ({ text: d[1], minus: d[2] }));
  return { grade: m[1], of: m[2], deductions, total: m[4] };
}
const GRADES = [['Learn', 'level-1-learn/README.md', parseGrade(learnReadme)], ['Build', 'level-2-build/README.md', parseGrade(buildReadme)], ['Deep', 'level-3-deep/README.md', parseGrade(deepReadme)]];

function parseRoadmap(md) {
  const sec = md.split('## v1.1 backlog')[1].split('\n## ')[0];
  const items = [...sec.matchAll(/^(\d+)\.\s+([\s\S]*?)(?=^\d+\.|(?![\s\S]))/gm)].map((m) => ({ n: m[1], text: m[2].replace(/\s+/g, ' ').trim() }));
  const progress = Object.fromEntries([...md.matchAll(/^- Item (\d+): (.*)$/gm)].map((m) => [m[1], m[2]]));
  return items.map((i) => ({ ...i, progress: progress[i.n] }));
}
const BACKLOG = parseRoadmap(roadmap);

const TESTS = Object.entries(testFiles).map(([p, src]) => ({ file: p.split('/').pop(), count: (src.match(/^def test_/gm) || []).length })).sort((a, b) => a.file.localeCompare(b.file));

const SECTIONS = [['top', 'Overview', '◎'], ['learn', 'Learn funnel', '⌁'], ['build', 'Build study', '▥'], ['playground', 'Pipeline playground', '⚙'], ['mixture', 'Mixture lab', '◐'], ['decon', 'Decontamination', '⊘'], ['sweep', 'N-gram sweep', '⇆'], ['rules', 'Rule linter', '✓'], ['limits', 'Limitations', '!'], ['evidence', 'Evidence', '❯_']];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function MenuBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  return (
    <div className="menubar" role="banner">
      <span className="apple" aria-hidden="true">◆</span>
      <a className="app" href="#top">Post-Training Data Lab</a>
      <a className="m" href={blob('level-1-learn/README.md')}>Learn</a>
      <a className="m" href={blob('level-2-build/README.md')}>Build</a>
      <a className="m" href={blob('level-3-deep/README.md')}>Deep</a>
      <a className="m" href={blob('docs/research-review.md')}>Review</a>
      <span className="spacer" />
      <span className="status"><i /> Parity-checked build</span>
      <a href={REPO}>GitHub ↗</a>
      <span className="clock">{now.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
    </div>
  );
}

function Dock() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <nav className="dock" aria-label="Sections">
      {SECTIONS.map(([id, label, icon]) => (
        <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined} aria-label={label}>
          <span className="ico" aria-hidden="true">{icon}</span><span className="lbl" aria-hidden="true">{label}</span>
        </a>
      ))}
    </nav>
  );
}

function Range({ label, value, min, max, step, onChange, show }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label} <span>{show}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}

const Recorded = ({ src }) => <span className="pill rec" title={`Replayed from ${src}`}>● recorded · {src.split('/').pop()}</span>;
const Live = ({ match }) => match
  ? <span className="pill good">● live · matches the recorded run</span>
  : <span className="pill warn">● live · computed from repo data, not a repo result</span>;

export default function App() {
  useReveal();
  return (
    <div className="wrap">
      <MenuBar />
      <div className="glow" aria-hidden="true" />
      <Hero />
      <LearnFunnel />
      <BuildStudy />
      <Playground />
      <MixtureLab />
      <Decon />
      <Sweep />
      <RuleLinter />
      <Limits />
      <Evidence />
      <Dock />
      <footer>
        <p>All data is synthetic, generated or hand listed by this project. Every number on this page is read from the repo’s <code>level-*/results_*.json</code>, jsonl and README files at build time, or computed live in your browser from those files by ports that the build checks against the Python.</p>
        <p><a href={REPO}>Repository</a> · <a href={`${REPO}/releases`}>Releases</a> · <a href={blob('LICENSE')}>License</a>: code Apache-2.0, tutorials CC BY 4.0</p>
      </footer>
    </div>
  );
}

function Hero() {
  const a = build.mixture_a.eval, b = build.mixture_b.eval;
  const cleanFires = deepRes.build_clean_rules.total_fire_events + deepRes.deep_clean_rules.total_fire_events;
  const ciA = dose.wilson95.mixture_a, ciB = dose.wilson95.mixture_b;
  return (
    <header className="card hero window" id="top" data-title="README.md — post-training-data-lab">
      <div className="head">
        <p className="eyebrow">Synthetic post-training data · three levels · standard-library Python</p>
        <span className="pill warn">● designed outcome, read the caveat</span>
      </div>
      <h1>Cleaning the training mix took the same classifier from {a.correct} of {a.total} to <em>{b.correct} of {b.total} correct</em>, on synthetic data built to show exactly that.</h1>
      <p className="sub">
        Plain scope, stated first: every dataset in this repo is synthetic, generated or hand listed by this project and labelled synthetic in every file.
        No real data was used, downloaded, or claimed, and no external benchmark items were downloaded or claimed.
        The jump is certain by construction: the poison records carry a stub output and a label shifted to the next category, so this page shows how the pipeline behaves, not how much filtering helps on real data.
      </p>
      <div className="actions">
        <a className="btn primary" href="#mixture">Retrain the classifier</a>
        <a className="btn ghost" href="#playground">Run the pipeline</a>
        <span className="hint">Reproduce with <code>python3 level-2-build/run_build.py</code></span>
      </div>
      <div className="tiles">
        <div className="tile"><div className="num">{build.raw_count} → {build.after_decontamination}</div><div className="cap">raw records kept after exact dedup, near dedup, quality and decontamination</div></div>
        <div className="tile"><div className="num">{a.accuracy.toFixed(1)} → {b.accuracy.toFixed(1)}</div><div className="cap">accuracy on {N_EVAL} held-out records; 95% CI {ciA[0].toFixed(3)}–{ciA[1].toFixed(3)} and {ciB[0].toFixed(3)}–{ciB[1].toFixed(3)}</div></div>
        <div className="tile"><div className="num">{deepRes.caught_by_ngram_cumulative} of {deepRes.contaminated_total_by_design}</div><div className="cap">contaminated records caught with word {deepRes.ngram_n}-grams, against {deepRes.caught_by_exact_only} by exact match alone</div></div>
        <div className="tile"><div className="num">{rules.rules.length} rules</div><div className="cap">quality rule set v{rules.version}, {cleanFires} fires on the clean records of both sets</div></div>
      </div>
    </header>
  );
}

function Funnel({ counts, names, label, total, highlight, onPick }) {
  return (
    <div className="funnel" role="img" aria-label={label}>
      {counts.map((c, i) => (
        <div key={i} className={`frow${highlight === i ? ' on' : ''}${onPick && i ? ' pick' : ''}`} onClick={onPick ? () => onPick(i) : undefined}>
          <span className="fname">{names[i]}</span>
          <span className="ftrack"><span className="fbar" style={{ width: `${(100 * c) / total}%`, opacity: highlight === i ? 0.95 : 0.3 + 0.55 * (c / total) }} /></span>
          <b className="fnum">{c}</b>
        </div>
      ))}
    </div>
  );
}

function LearnFunnel() {
  const stages = [
    ['exact', 'Exact dedup', learn.removed_exact, 'Same normalized instruction and output as an earlier record.'],
    ['near', 'Near dedup', learn.removed_near, `Instruction token Jaccard of at least ${learn.near_dup_threshold} with a kept record.`],
    ['quality', 'Quality', learn.removed_quality, `Instruction under ${CFG.minIns} tokens or output under ${CFG.minOut} tokens.`],
    ['contaminated', 'Decontamination', learn.removed_contaminated, `Instruction matches one of the ${learn.benchmark_prompts} synthetic benchmark prompts.`],
  ];
  const [pick, setPick] = useState(1);
  const counts = [learn.raw_count, learn.after_exact_dedup, learn.after_near_dedup, learn.after_quality, learn.after_decontamination];
  const [, name, ids, why] = stages[pick];
  const kept = LEARN_RAW.filter((r) => !learn.removed_exact.includes(r.id));
  const nearMatch = (id) => {
    const s = tokenSet(BY_ID[`L:${id}`].instruction);
    let best = null;
    for (const k of kept) if (k.id < id) { const j = jaccard(s, tokenSet(k.instruction)); if (!best || j > best.j) best = { id: k.id, j }; }
    return best;
  };
  return (
    <section id="learn" className="card window reveal" data-title="pipeline.py — Learn level, 20 teaching records">
      <div className="head">
        <div>
          <p className="eyebrow">Level 1 · Learn</p>
          <h2>Twenty records in, fourteen out, and you can read every one that was dropped.</h2>
          <p className="sub">The four filter stages run in a fixed order. Pick a stage to see the records it removed, word for word. The kept {learn.after_decontamination} split into {learn.train_count} train and {learn.eval_count} eval records with {learn.leakage_exact_overlap} exact and {learn.leakage_near_pairs} near leakage pairs.</p>
        </div>
        <Recorded src="level-1-learn/results_learn.json" />
      </div>
      <div className="grid2">
        <div>
          <Funnel counts={counts} names={['Raw', ...stages.map((s) => s[1])]} total={learn.raw_count} label="Learn pipeline funnel from 20 raw records to 14 kept" highlight={pick + 1} onPick={(i) => i > 0 && setPick(i - 1)} />
          <div className="split">
            <div style={{ flex: learn.train_count }}><b>{learn.train_count}</b> train</div>
            <div style={{ flex: learn.eval_count }} className="ev"><b>{learn.eval_count}</b> eval</div>
          </div>
          <p className="hint">Eval ids: {learn.eval_ids.join(', ')}. Every fifth record by id goes to eval.</p>
        </div>
        <div>
          <div className="seg wrap-seg" role="group" aria-label="Pipeline stage">
            {stages.map((s, i) => <button key={s[0]} aria-pressed={pick === i} onClick={() => setPick(i)}>{s[1]}</button>)}
          </div>
          <h3 style={{ marginTop: 14 }}>{name}: {ids.length} removed</h3>
          <p className="hint" style={{ margin: '4px 0 10px' }}>{why}</p>
          <ul className="recs">
            {ids.map((id) => {
              const r = BY_ID[`L:${id}`], m = stages[pick][0] === 'near' ? nearMatch(id) : null;
              return (
                <li key={id}>
                  <span className="mono rid">{id}</span>
                  <div><b>{r.instruction}</b><div className="hint">→ {r.output ? `“${r.output}”` : <i>(empty output)</i>}</div>
                    {m && <div className="hint">Matches {m.id}, Jaccard {m.j.toFixed(3)} (computed live)</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Confusion({ rec, title }) {
  const W = 300, c = 52, l = 76, t = 34;
  const max = Math.max(...Object.values(rec.confusion));
  return (
    <div>
      <h3>{title}</h3>
      <svg className="chart conf" viewBox={`0 0 ${W} ${t + c * CATS.length + 8}`} role="img" aria-label={`${title}: confusion matrix, true category by predicted category`}>
        <text x={l + (c * CATS.length) / 2} y={12} textAnchor="middle">predicted →</text>
        {CATS.map((p, j) => <text key={p} x={l + j * c + c / 2} y={t - 6} textAnchor="middle">{p}</text>)}
        {CATS.map((tr, i) => (
          <g key={tr}>
            <text x={l - 8} y={t + i * c + c / 2 + 4} textAnchor="end">{tr}</text>
            {CATS.map((p, j) => {
              const v = rec.confusion[`${tr}->${p}`] || 0;
              return (
                <g key={p}>
                  <rect x={l + j * c + 2} y={t + i * c + 2} width={c - 4} height={c - 4} rx="6" fill={tr === p ? 'var(--good)' : 'var(--bad)'} opacity={v ? 0.2 + 0.7 * (v / max) : 0.06} />
                  <text x={l + j * c + c / 2} y={t + i * c + c / 2 + 4} textAnchor="middle" style={{ fill: 'var(--text)', fontWeight: 600 }}>{v}</text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}

function BuildStudy() {
  const tiers = Object.entries(build.raw_tier_counts);
  const tierColor = { clean: 'var(--good)', exact_duplicate: 'var(--primary)', near_duplicate: '#8a6cd6', low_quality_poison: 'var(--bad)', contaminated: 'var(--warn)' };
  const caveat = GRADES[1][2].deductions[0];
  const A = build.mixture_a.eval, B = build.mixture_b.eval;
  return (
    <section id="build" className="card window reveal" data-title="run_build.py — 536 synthetic records, mixture study">
      <div className="head">
        <div>
          <p className="eyebrow">Level 2 · Build</p>
          <h2>Filtering drops {build.raw_count - build.after_decontamination} of {build.raw_count} records, and the label-flipped poison goes with them.</h2>
          <p className="sub">A seeded generator writes five tiers. The Learn pipeline cuts them down stage by stage; the same Naive Bayes classifier is then trained on the raw mix (A) and the filtered mix (B) and scored on {N_EVAL} held-out records.</p>
        </div>
        <Recorded src="level-2-build/results_build.json" />
      </div>
      <h3>What the generator wrote</h3>
      <div className="stack" role="img" aria-label="Raw tier composition of the 536 records">
        {tiers.map(([k, v]) => <div key={k} style={{ flex: v, background: tierColor[k] }} title={`${k}: ${v}`} />)}
      </div>
      <div className="legend">{tiers.map(([k, v]) => <span key={k}><i style={{ background: tierColor[k] }} />{k.replace(/_/g, ' ')} {v}</span>)}</div>
      <div className="grid2" style={{ marginTop: 18 }}>
        <div>
          <h3>Stage by stage</h3>
          <Funnel counts={BUILD_STAGES} names={STAGE_NAMES} total={build.raw_count} label="Build pipeline funnel from 536 to 192 records" />
          <p className="hint">Exact dedup removes {build.removed_exact.length} copies; near dedup {build.removed_near.length} ({build.raw_tier_counts.near_duplicate} near copies plus {build.removed_near.length - build.raw_tier_counts.near_duplicate} contaminated variants that are near copies of each other); quality removes {build.removed_quality_count}, all poison; decontamination the last {build.removed_contaminated.length}.</p>
        </div>
        <div>
          <h3>Per-category accuracy</h3>
          <div className="bars" style={{ marginTop: 12 }}>
            {CATS.map((c) => (
              <div className="bar-row" key={c}>
                <div className="lab"><span className="mono">{c}</span><b>A {A.per_category[c].correct}/{A.per_category[c].total} · B {B.per_category[c].correct}/{B.per_category[c].total}</b></div>
                <div className="track duo"><div className="fill" style={{ width: pct(A.per_category[c].accuracy), background: 'var(--bad)' }} /></div>
                <div className="track duo"><div className="fill" style={{ width: pct(B.per_category[c].accuracy), background: 'var(--good)' }} /></div>
              </div>
            ))}
          </div>
          <div className="legend"><span><i style={{ background: 'var(--bad)' }} />A raw, {build.mixture_a.train_count} records</span><span><i style={{ background: 'var(--good)' }} />B filtered, {build.mixture_b.train_count} records</span></div>
          <p className="hint">Per-category 95% Wilson intervals: {dose.wilson95.per_category_0_of_20.join('–')} for 0/20 and {dose.wilson95.per_category_20_of_20.join('–')} for 20/20.</p>
        </div>
      </div>
      <div className="grid2" style={{ marginTop: 12 }}>
        <Confusion rec={A} title={`Mixture A, raw: ${A.correct}/${A.total}`} />
        <Confusion rec={B} title={`Mixture B, filtered: ${B.correct}/${B.total}`} />
      </div>
      <p className="note">Mixture A predicts the next category every time (code→factual, factual→language…), which is exactly the shift written into the poison labels. The Build README’s own caveat: “{caveat.text}” (minus {caveat.minus} in its grade).</p>
    </section>
  );
}

function Playground() {
  const [threshold, setThreshold] = useState(CFG.threshold);
  const [minIns, setMinIns] = useState(CFG.minIns);
  const [minOut, setMinOut] = useState(CFG.minOut);
  const res = useMemo(() => {
    const p = runPipeline(RAW, { threshold, minIns, minOut, prompts: CFG.prompts });
    const e = evaluateNB(trainNB(p.final), EVAL);
    return { ...p, e };
  }, [threshold, minIns, minOut]);
  const match = res.counts.every((c, i) => c === BUILD_STAGES[i]);
  const tierOf = (ids) => {
    const o = {};
    for (const id of ids) { const t = BY_ID[id].tier; o[t] = (o[t] || 0) + 1; }
    return Object.entries(o).map(([k, v]) => `${v} ${k.replace(/_/g, ' ')}`).join(', ') || 'none';
  };
  const removed = [res.removed.exact, res.removed.near, res.removed.quality, res.removed.contaminated];
  const ci = wilson(res.e.correct, res.e.total);
  return (
    <section id="playground" className="card window reveal" data-title="pipeline.js — the Learn pipeline, live on 536 records">
      <div className="head">
        <div>
          <p className="eyebrow">Live · pipeline playground</p>
          <h2>Move a threshold and the whole pipeline reruns in your browser.</h2>
          <p className="sub">A JavaScript port of <a href={blob('level-1-learn/pipeline.py')}>pipeline.py</a> runs over all {RAW.length} Build records, then retrains the classifier on whatever survives. At the defaults ({CFG.threshold}, {CFG.minIns}, {CFG.minOut}) it reproduces {BUILD_STAGES.slice(1).join(' / ')}; the build fails if it does not.</p>
        </div>
        <Live match={match} />
      </div>
      <div className="controls">
        <Range label="Near-dup Jaccard threshold" value={threshold} min={0.5} max={1} step={0.05} onChange={setThreshold} show={threshold.toFixed(2)} />
        <Range label="Min instruction tokens" value={minIns} min={1} max={8} step={1} onChange={setMinIns} show={minIns} />
        <Range label="Min output tokens" value={minOut} min={1} max={8} step={1} onChange={setMinOut} show={minOut} />
      </div>
      <div className="actions" style={{ marginTop: 0, marginBottom: 14 }}>
        <button className="btn ghost" onClick={() => { setThreshold(CFG.threshold); setMinIns(CFG.minIns); setMinOut(CFG.minOut); }}>Reset to repo defaults</button>
      </div>
      <div className="grid2">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Stage</th><th>Kept</th><th>Recorded</th><th>Removed, by tier</th></tr></thead>
            <tbody>
              {STAGE_NAMES.map((n, i) => (
                <tr key={n}><td>{n}</td><td><b>{res.counts[i]}</b></td><td className={res.counts[i] === BUILD_STAGES[i] ? 'ok' : 'no'}>{BUILD_STAGES[i]}</td><td className="hint">{i ? tierOf(removed[i - 1]) : '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="tiles" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 0 }}>
            <div className="tile"><div className="num">{res.e.correct}/{res.e.total}</div><div className="cap">held-out accuracy after retraining on the {res.final.length} kept records</div></div>
            <div className="tile"><div className="num">{ci[0].toFixed(2)}–{ci[1].toFixed(2)}</div><div className="cap">95% Wilson interval on that accuracy</div></div>
          </div>
          <p className="hint">Try a minimum of 1 output token: the stub output “unknown” passes, the shifted-label poison stays in, and accuracy collapses. Raise the Jaccard threshold to 0.85 and the “please” near copies survive with no effect on accuracy.</p>
        </div>
      </div>
    </section>
  );
}

function MixtureLab() {
  const [k, setK] = useState(32);
  const [tiers, setTiers] = useState(false);
  const curve = useMemo(() => Array.from({ length: POISON_MAX + 1 }, (_, i) => {
    const train = mixture(RAW, i, tiers, POISON_MAX);
    return { k: i, n: train.length, poison: train.filter((r) => r.tier === 'low_quality_poison').length, correct: evaluateNB(trainNB(train), EVAL).correct };
  }), [tiers]);
  const cur = curve[k];
  const recorded = Object.fromEntries(dose.dose.map((d) => [d.poison_per_category, d]));
  const match = !tiers ? recorded[k] && recorded[k].correct === cur.correct : k === POISON_MAX && cur.n === build.raw_count && cur.correct === build.mixture_a.eval.correct;
  const W = 640, H = 260, pad = { l: 40, r: 14, t: 14, b: 34 };
  const sx = (v) => pad.l + (v / POISON_MAX) * (W - pad.l - pad.r);
  const sy = (v) => pad.t + (1 - v / N_EVAL) * (H - pad.t - pad.b);
  const ab = dose.ablation;
  const atEven = dose.dose.find((d) => d.poison_per_category === build.mixture_b.label_counts[CATS[0]]);
  const seedsOk = dose.seeds.filter((s) => s.mixture_a_correct === build.mixture_a.eval.correct && s.mixture_b_correct === build.mixture_b.eval.correct).length;
  return (
    <section id="mixture" className="card window reveal" data-title="model.js — Naive Bayes, retrained in your browser">
      <div className="head">
        <div>
          <p className="eyebrow">Live · mixture lab</p>
          <h2>Add poison a few records at a time and watch where the classifier <em>tips over</em>.</h2>
          <p className="sub">A port of <a href={blob('level-2-build/model.py')}>model.py</a> (multinomial Naive Bayes, alpha 1.0, alphabetical tie-break) trains on the {build.after_decontamination} clean records plus the first k poison records of each category, then scores the {N_EVAL} eval records. All {POISON_MAX + 1} points are recomputed when you load the page.</p>
        </div>
        <Live match={match} />
      </div>
      <div className="controls">
        <Range label="Poison records per category" value={k} min={0} max={POISON_MAX} step={1} onChange={setK} show={k} />
        <div className="field check"><input id="tiers" type="checkbox" checked={tiers} onChange={(e) => setTiers(e.target.checked)} /><label htmlFor="tiers">Also add the duplicate and contaminated tiers (at k = {POISON_MAX} this is the full raw mix A)</label></div>
      </div>
      <div className="grid2">
        <div>
          <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Eval accuracy against poison records per category">
            {[0, 20, 40, 60, 80].filter((t) => t <= N_EVAL).map((t) => <g key={t}><line className="axis" x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} /><text x={pad.l - 6} y={sy(t) + 4} textAnchor="end">{t}</text></g>)}
            <line x1={sx(build.mixture_b.label_counts[CATS[0]])} x2={sx(build.mixture_b.label_counts[CATS[0]])} y1={pad.t} y2={H - pad.b} stroke="var(--muted)" strokeDasharray="4 4" />
            <text x={sx(build.mixture_b.label_counts[CATS[0]]) - 6} y={pad.t + 40} textAnchor="end">poison = clean</text>
            <polyline fill="none" stroke="var(--primary)" strokeWidth="2.5" points={curve.map((p) => `${sx(p.k)},${sy(p.correct)}`).join(' ')} />
            {!tiers && dose.dose.map((d) => <circle key={d.poison_per_category} cx={sx(d.poison_per_category)} cy={sy(d.correct)} r="4.5" fill="var(--surface-strong)" stroke="var(--text)" strokeWidth="1.6"><title>{`recorded k=${d.poison_per_category}: ${d.correct}/${d.total}`}</title></circle>)}
            {tiers && <circle cx={sx(POISON_MAX)} cy={sy(build.mixture_a.eval.correct)} r="5" fill="var(--surface-strong)" stroke="var(--text)" strokeWidth="1.6" />}
            <circle cx={sx(k)} cy={sy(cur.correct)} r="6" fill="var(--primary)" stroke="var(--surface-strong)" strokeWidth="2" />
            <text x={pad.l} y={H - 8}>0 poison</text><text x={W - pad.r} y={H - 8} textAnchor="end">{POISON_MAX} per category</text>
            <text x={(pad.l + W - pad.r) / 2} y={H - 8} textAnchor="middle">correct of {N_EVAL}</text>
          </svg>
          <div className="legend"><span><i style={{ background: 'var(--primary)' }} />live curve</span><span><i style={{ background: 'var(--surface-strong)', border: '1.6px solid var(--text)' }} />{tiers ? 'recorded mixture A' : 'recorded points, results_dose.json'}</span></div>
        </div>
        <div>
          <div className="tiles" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 0 }}>
            <div className="tile"><div className="num">{cur.correct}/{N_EVAL}</div><div className="cap">correct at k = {k}</div></div>
            <div className="tile"><div className="num">{pct(cur.poison / cur.n)}</div><div className="cap">poison share of {cur.n} training records</div></div>
          </div>
          <p className="hint" style={{ marginTop: 12 }}>In the recorded run accuracy holds at {N_EVAL}/{N_EVAL} while clean records outnumber poison in each category, is {atEven.correct}/{N_EVAL} at k = {atEven.poison_per_category} where the two are equal, and the first point below half is k = {dose.first_k_below_half}. That is a property of the label counts, not of filtering.</p>
        </div>
      </div>
      <h3 style={{ marginTop: 20 }}>Which flaw does the work? The ablation (recorded, <a href={blob('level-2-build/results_dose.json')}>results_dose.json</a>)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>Poison records carry</th><th>Unfiltered</th><th>After the pipeline</th><th>Reading</th></tr></thead>
          <tbody>
            {ab.map((v) => (
              <tr key={v.name}>
                <td>{v.stub_output ? 'stub output' : 'good output'}, {v.label_shifted ? 'shifted label' : 'correct label'}</td>
                <td>{v.unfiltered.correct}/{v.unfiltered.total} <span className="hint">({v.unfiltered_train_count})</span></td>
                <td>{v.filtered.correct}/{v.filtered.total} <span className="hint">({v.filtered_train_count})</span></td>
                <td className="hint">{v.stub_output && v.label_shifted ? 'The original design (A and B).' : v.stub_output ? 'Stubs alone do no harm to this model.' : 'The filter cannot see a wrong label.'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">The classifier reads instructions only, so a stub output costs nothing on its own; the shifted label does all the damage, and the quality filter helps only because every stub record also carries a wrong label. Across generator seeds 0–{dose.seeds.length - 1}, {seedsOk} of {dose.seeds.length} reproduce {build.mixture_a.eval.correct}/{N_EVAL} and {build.mixture_b.eval.correct}/{N_EVAL}: the seed only permutes topic ids.</p>
    </section>
  );
}

function Decon() {
  const total = deepRes.contaminated_total_by_design;
  const parts = [['Exact', deepRes.caught_by_exact_only, 'var(--primary)'], ['Normalized', deepRes.caught_by_normalized_cumulative - deepRes.caught_by_exact_only, '#8a6cd6'], [`Word ${deepRes.ngram_n}-gram`, deepRes.caught_by_ngram_cumulative - deepRes.caught_by_normalized_cumulative, 'var(--good)']];
  const grams = [...benchmarkNgrams(PROMPTS, deepRes.ngram_n)].sort();
  const sub = DEEP.filter((r) => r.group === 'subthreshold');
  return (
    <section id="decon" className="card window reveal" data-title="decontaminate.py — SynthBench-P28-12, 78 candidates">
      <div className="head">
        <div>
          <p className="eyebrow">Level 3 · Deep · decontamination ladder</p>
          <h2>Exact match finds {deepRes.caught_by_exact_only} of {total} contaminated records. Word {deepRes.ngram_n}-grams find all {deepRes.caught_by_ngram_cumulative}.</h2>
          <p className="sub">{deepRes.deep_candidate_count} synthetic candidates are checked against the repo’s own {deepRes.benchmark_count}-prompt benchmark, {deepRes.benchmark_name}. Each level runs on the survivors of the one before: {deepRes.deep_candidate_count} → {deepRes.after_exact} → {deepRes.after_normalized} → {deepRes.after_ngram}.</p>
        </div>
        <Recorded src="level-3-deep/results_deep.json" />
      </div>
      <div className="stack tall" role="img" aria-label="Contaminated records caught at each decontamination level">
        {parts.map(([n, v, c]) => <div key={n} style={{ flex: v, background: c }}><span>{n} +{v}</span></div>)}
      </div>
      <p className="hint">Of {total} contaminated by design; each bar is the extra records caught at that level.</p>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div>
          <h3>Shared {deepRes.ngram_n}-grams per record caught at the n-gram level</h3>
          <ul className="recs">
            {deepRes.removed_ngram.map((id) => (
              <li key={id}><span className="mono rid">{id}</span><div><b>{DEEP_BY_ID[id].instruction}</b><div className="chips">{deepRes.ngram_shared[id].map((g) => <span key={g} className="chip">{g}</span>)}</div></div></li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Where it stops: {sub.length} sub-threshold records</h3>
          <p className="hint" style={{ margin: '4px 0 8px' }}>These reuse up to three words in a row from a prompt and are kept. Shared 3-grams computed live.</p>
          <ul className="recs">
            {sub.map((r) => {
              const g3 = [...wordNgrams(r.instruction, 3)].filter((g) => benchmarkNgrams(PROMPTS, 3).has(g));
              return <li key={r.id}><span className="mono rid">{r.id}</span><div><b>{r.instruction}</b><div className="chips">{g3.length ? g3.map((g) => <span key={g} className="chip warn">{g}</span>) : <span className="hint">no shared 3-gram</span>}</div></div></li>;
            })}
          </ul>
          <h3 style={{ marginTop: 16 }}>The {grams.length} benchmark {deepRes.ngram_n}-grams</h3>
          <div className="chips">{grams.map((g) => <span key={g} className="chip">{g}</span>)}</div>
        </div>
      </div>
    </section>
  );
}

function Sweep() {
  const [n, setN] = useState(deepRes.ngram_n);
  const [min, setMin] = useState(deepRes.ngram_min_shared);
  const s = useMemo(() => sweepPoint(DEEP, PROMPTS, n, min), [n, min]);
  const rec = sweep.grid.find((g) => g.n === n && g.min_shared === min);
  const isV1 = n === deepRes.ngram_n && min === deepRes.ngram_min_shared;
  return (
    <section id="sweep" className="card window reveal" data-title="sweep.js — n-gram size and threshold, live">
      <div className="head">
        <div>
          <p className="eyebrow">Live exploration · n-gram sweep</p>
          <h2>Shorter n-grams catch more and start flagging clean text; longer ones go blind on short prompts.</h2>
          <p className="sub">The full three-level ladder reruns on the {sweep.candidate_count} labelled candidates: {sweep.positives} contaminated by design, {sweep.negatives} not (clean, sub-threshold and quality probes). The default (n {deepRes.ngram_n}, min {deepRes.ngram_min_shared}) reproduces {deepRes.after_ngram} survivors.</p>
        </div>
        <Live match={!!rec || isV1} />
      </div>
      <div className="controls">
        <Range label="N-gram size n" value={n} min={2} max={8} step={1} onChange={setN} show={n} />
        <Range label="Min shared n-grams" value={min} min={1} max={4} step={1} onChange={setMin} show={min} />
      </div>
      <div className="tiles">
        <div className="tile"><div className="num">{s.caught}/{sweep.positives}</div><div className="cap">contaminated caught</div></div>
        <div className="tile"><div className="num">{s.missed}</div><div className="cap">contaminated missed</div></div>
        <div className="tile"><div className="num">{s.falseFlagIds.length}</div><div className="cap">clean records flagged (of {sweep.negatives})</div></div>
        <div className="tile"><div className="num">{s.survivorsCount}</div><div className="cap">survivors; {s.benchmarkNgrams} benchmark {n}-grams</div></div>
      </div>
      {s.falseFlagIds.length > 0 && <p className="hint" style={{ marginTop: 12 }}>Flagged by mistake: {s.falseFlagIds.map((id) => `${id} “${DEEP_BY_ID[id].instruction}”`).join('; ')}.</p>}
      <h3 style={{ marginTop: 20 }}>Recorded grid, <a href={blob('level-3-deep/results_sweep.json')}>results_sweep.json</a></h3>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>n</th><th>min shared</th><th>Caught</th><th>Missed</th><th>False flags</th><th>Survivors</th></tr></thead>
          <tbody>
            {sweep.grid.map((g) => (
              <tr key={`${g.n}-${g.min_shared}`} className={g === rec ? 'sel' : ''}>
                <td>{g.n}</td><td>{g.min_shared}</td><td>{g.caught}/{sweep.positives}</td><td>{g.missed}</td><td className={g.false_flags ? 'no' : ''}>{g.false_flags}</td><td>{g.survivors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">At n 3 the phrase “in simple terms”, shared by a benchmark prompt and every clean template, flags almost every clean record. The highlighted row is your current setting when it is in the recorded grid. Settings outside it (n 2, 6, 7, or min 3 and 4) are live computations, not repo results. Common practice uses 13-grams on long documents; here the prompts have at most {Math.max(...PROMPTS.map((p) => p.split(' ').length))} words, so 13-grams cannot match.</p>
    </section>
  );
}

const PRESETS = DEEP.filter((r) => r.group === 'quality_probe');
function RuleLinter() {
  const [preset, setPreset] = useState('q05');
  const base = DEEP_BY_ID[preset];
  const [rec, setRec] = useState(() => ({ ...base }));
  const choose = (id) => { setPreset(id); if (id !== 'custom') setRec({ ...DEEP_BY_ID[id] }); };
  const edit = (k, v) => { setPreset('custom'); setRec((r) => ({ ...r, [k]: v })); };
  // R07 sees the Deep set in order: every record before a preset, or all 78 for your own text.
  const fires = useMemo(() => {
    const idx = preset === 'custom' ? DEEP.length : DEEP.findIndex((r) => r.id === preset);
    const seen = new Set(DEEP.slice(0, idx).map(dedupKey));
    return ruleFires(rec, rules, seen);
  }, [rec, preset]);
  const sets = [['Build', deepRes.build_candidate_count, deepRes.build_rules], ['Build clean', deepRes.build_clean_count, deepRes.build_clean_rules], ['Deep', deepRes.deep_candidate_count, deepRes.deep_rules], ['Deep clean', deepRes.deep_clean_count, deepRes.deep_clean_rules]];
  const max = Math.max(...sets.flatMap(([, , r]) => Object.values(r.counts)));
  const W = 420, c = 36, l = 150, t = 30;
  return (
    <section id="rules" className="card window reveal" data-title="rules.json — quality rule set, live linter">
      <div className="head">
        <div>
          <p className="eyebrow">Live · rule linter</p>
          <h2>Type a record and see which of the {rules.rules.length} quality rules fire.</h2>
          <p className="sub">A port of <a href={blob('level-3-deep/quality_rules.py')}>quality_rules.py</a> reads every threshold straight from <a href={blob('level-3-deep/rules.json')}>rules.json</a> v{rules.version}. Presets are the {PRESETS.length} probe records from the Deep set, each built to fire one rule. The tokenizer is ASCII only, like the Python.</p>
        </div>
        <Live match={preset !== 'custom'} />
      </div>
      <div className="grid2">
        <div className="form">
          <div className="field"><label htmlFor="preset">Preset</label>
            <select id="preset" value={preset} onChange={(e) => choose(e.target.value)}>
              <option value="custom">Your own record</option>
              {PRESETS.map((r) => <option key={r.id} value={r.id}>{r.id}: {r.instruction.slice(0, 40) || '(empty)'}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="ins">Instruction</label><input id="ins" type="text" value={rec.instruction} onChange={(e) => edit('instruction', e.target.value)} /></div>
          <div className="field"><label htmlFor="out">Output</label><textarea id="out" rows="2" value={rec.output} onChange={(e) => edit('output', e.target.value)} /></div>
          <div className="row2">
            <div className="field"><label htmlFor="src">Source</label><input id="src" type="text" value={rec.source} onChange={(e) => edit('source', e.target.value)} /></div>
            <div className="field"><label htmlFor="lic">License</label><input id="lic" type="text" value={rec.license} onChange={(e) => edit('license', e.target.value)} /></div>
          </div>
          <div className="field check"><input id="syn" type="checkbox" checked={rec.synthetic === true} onChange={(e) => edit('synthetic', e.target.checked)} /><label htmlFor="syn">Labelled synthetic</label></div>
        </div>
        <ul className="rulelist" aria-live="polite">
          {rules.rules.map((r) => {
            const on = fires.includes(r.id);
            return <li key={r.id} className={on ? 'on' : ''}><span className={`pill ${on ? 'bad' : 'good'}`}>{on ? 'fires' : 'pass'}</span><div><b className="mono">{r.id}</b> {r.name.replace(/_/g, ' ')}<div className="hint">{r.condition}</div></div></li>;
          })}
        </ul>
      </div>
      <h3 style={{ marginTop: 20 }}>Fire counts by rule and set <Recorded src="level-3-deep/results_deep.json" /></h3>
      <div style={{ overflowX: 'auto' }}>
        <svg className="chart heat" viewBox={`0 0 ${l + c * RULE_IDS.length + 4} ${t + 28 * sets.length + 6}`} role="img" aria-label="Heatmap of rule fire counts by record set">
          {RULE_IDS.map((id, j) => <text key={id} x={l + j * c + c / 2} y={t - 10} textAnchor="middle">{id}</text>)}
          {sets.map(([name, size, r], i) => (
            <g key={name}>
              <text x={l - 8} y={t + i * 28 + 18} textAnchor="end">{name} ({size})</text>
              {RULE_IDS.map((id, j) => {
                const v = r.counts[id];
                return <g key={id}><rect x={l + j * c + 2} y={t + i * 28 + 2} width={c - 4} height={24} rx="5" fill={v ? 'var(--bad)' : 'var(--good)'} opacity={v ? 0.25 + 0.65 * Math.sqrt(v / max) : 0.1} /><text x={l + j * c + c / 2} y={t + i * 28 + 18} textAnchor="middle" style={{ fill: 'var(--text)', fontWeight: 600 }}>{v}</text></g>;
              })}
            </g>
          ))}
        </svg>
      </div>
      <p className="hint">Totals: Build {deepRes.build_rules.total_fire_events}, Deep {deepRes.deep_rules.total_fire_events}, clean subsets {deepRes.build_clean_rules.total_fire_events} and {deepRes.deep_clean_rules.total_fire_events}. The probes were written to fire their rules, so these counts show the rules work as specified, not their precision on natural data.</p>
    </section>
  );
}

function Limits() {
  const ab = Object.fromEntries(dose.ablation.map((v) => [v.name, v]));
  const items = [
    ['Synthetic only', 'Every record is template-generated or hand listed. There is no real corpus, no real public benchmark and no language model fine-tuning; the classifier is a Naive Bayes proxy over instruction tokens.'],
    ['The headline is built in', `Poison records carry labels shifted to the next category and outnumber clean ones ${dose.dose[dose.dose.length - 1].poison_per_category} to ${build.mixture_b.label_counts[CATS[0]]} per category, so ${build.mixture_a.eval.correct}/${N_EVAL} raw and ${build.mixture_b.eval.correct}/${N_EVAL} filtered are certain by construction.`],
    ['Filtering works only through the confound', `The ablation shows good outputs with shifted labels score ${ab.good_output_shifted_label.filtered.correct}/${N_EVAL} even after filtering. The quality filter removes poison because stub output and wrong label always travel together.`],
    ['Eval shares the templates', 'Eval and train differ only in topic tokens, so the eval cannot tell generalization from template matching.'],
    ['No natural false-positive rate', `The n-gram sweep measures false flags on ${sweep.negatives} synthetic negatives. Outputs and inputs are never checked, only instructions, and there is no MinHash or embedding comparison.`],
    ['Rules validated on their own probes', 'Each probe was designed to fire its rule, so precision and recall on natural data are unknown.'],
    ['Uncertainty is mostly moot', `The outcome does not vary across ${dose.seeds.length} seeds because the seed only permutes topic ids. The Wilson intervals describe ${N_EVAL} eval records, not sampling of a real population.`],
  ];
  return (
    <section id="limits" className="card window reveal" data-title="LIMITATIONS.md — threats to validity">
      <p className="eyebrow">Read before quoting a number</p>
      <h2>What this repo does not show.</h2>
      <p className="sub">The full graded review, with what each open gap would need, is in <a href={blob('docs/research-review.md')}>docs/research-review.md</a>.</p>
      <div className="grid2" style={{ marginTop: 16 }}>
        {items.map(([t, d]) => (
          <div className="tile" key={t}><div className="head" style={{ marginBottom: 6 }}><h3>{t}</h3><span className="pill warn">Threat</span></div><p className="hint" style={{ margin: 0, fontSize: 13 }}>{d}</p></div>
        ))}
      </div>
    </section>
  );
}

function Evidence() {
  const fnTotal = TESTS.reduce((a, t) => a + t.count, 0);
  const scripts = TESTS.filter((t) => !t.count).length;
  return (
    <section id="evidence" className="card window reveal" data-title="tests/ — evidence, grades and backlog">
      <p className="eyebrow">Evidence</p>
      <h2>{fnTotal + scripts} checks, three self-graded levels, and a backlog that is <em>not done</em>.</h2>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div>
          <h3>Test files, counted from <code>def test_</code> at build time</h3>
          <table style={{ marginTop: 8 }}>
            <thead><tr><th>File</th><th>Checks</th></tr></thead>
            <tbody>{TESTS.map((t) => <tr key={t.file}><td><a className="mono" href={blob(`tests/${t.file}`)}>{t.file}</a></td><td>{t.count || '1 script check'}</td></tr>)}</tbody>
          </table>
          <ol className="steps" style={{ marginTop: 18 }}>
            <li><span className="n">1</span><div><b>Run the tests</b><div className="hint"><code>for t in tests/*.py; do python3 $t; done</code></div></div></li>
            <li><span className="n">2</span><div><b>Rerun every level</b><div className="hint"><code>python3 level-2-build/run_build.py</code> and the other runners; CI checks the committed outputs do not change.</div></div></li>
            <li><span className="n">3</span><div><b>Build this page</b><div className="hint"><code>cd site && npm ci && npm run build</code> fails unless the browser ports match the Python results.</div></div></li>
          </ol>
        </div>
        <div>
          <h3>Grades on record, with their named deductions</h3>
          {GRADES.map(([lvl, src, g]) => (
            <details key={lvl} className="grade">
              <summary><b>{lvl}</b> <span className="mono">{g.grade} / {g.of}</span> <span className="hint">−{g.total}</span></summary>
              <ul>{g.deductions.map((d) => <li key={d.text}><span className="mono">−{d.minus}</span> {d.text}</li>)}</ul>
              <a className="hint" href={blob(src)}>{src}</a>
            </details>
          ))}
          <h3 style={{ marginTop: 18 }}>v1.1 backlog, from ROADMAP.md</h3>
          <ul className="backlog">
            {BACKLOG.map((b) => <li key={b.n}><span className={`pill ${b.progress ? 'info' : 'warn'}`}>{b.progress ? 'first pass' : 'not done'}</span><div>{b.text}{b.progress && <div className="hint">{b.progress}</div>}</div></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
