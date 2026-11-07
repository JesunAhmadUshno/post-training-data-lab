"""Tests for the post-v1.0 studies: dose-response, ablation, seeds, sweep, data files.

Oracles: k = 0 poison is the filtered mix (mixture B, 80 of 80); the
full 72 per category plus clean is the raw poison mix without the
duplicate and contaminated tiers; n = 4, min 1 is the v1.0 Deep result.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for sub in ("level-1-learn", "level-2-build", "level-3-deep"):
    sys.path.insert(0, os.path.join(ROOT, sub))
from deep_data import generate_deep  # noqa: E402
from pipeline import RAW_EXAMPLES  # noqa: E402
from run_dose import run_dose, wilson  # noqa: E402
from run_sweep import run_sweep  # noqa: E402

DOSE = run_dose()
SWEEP = run_sweep()


def _load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        return json.load(fh)


def _jsonl(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def test_learn_raw_file_matches_code():
    assert _jsonl("level-1-learn/learn_raw.jsonl") == RAW_EXAMPLES


def test_deep_candidates_file_matches_code():
    rows = _jsonl("level-3-deep/deep_candidates.jsonl")
    assert len(rows) == 78 and rows == generate_deep()


def test_dose_endpoints():
    pts = {p["poison_per_category"]: p for p in DOSE["dose"]}
    assert sorted(pts) == list(range(0, 73, 8))
    assert pts[0]["correct"] == 80 and pts[0]["train_count"] == 192
    assert pts[72]["train_count"] == 192 + 288
    assert all(p["total"] == 80 for p in DOSE["dose"])


def test_dose_crossover_is_reported():
    accs = [p["accuracy"] for p in DOSE["dose"]]
    first_zero = DOSE["first_k_below_half"]
    assert first_zero in range(0, 73, 8)
    k_list = [p["poison_per_category"] for p in DOSE["dose"]]
    assert accs[k_list.index(first_zero)] < 0.5
    assert all(a >= 0.5 for k, a in zip(k_list, accs) if k < first_zero)


def test_ablation_separates_label_from_quality():
    ab = {v["name"]: v for v in DOSE["ablation"]}
    # Stub outputs with correct labels: the filter removes them, and keeping them does no harm.
    stub = ab["stub_output_correct_label"]
    assert stub["unfiltered"]["correct"] == 80 and stub["filtered"]["correct"] == 80
    # Good outputs with shifted labels: the quality filter cannot see them, so filtering does not help.
    flip = ab["good_output_shifted_label"]
    assert flip["filtered_train_count"] == flip["unfiltered_train_count"] - 24 - 30 - 2
    assert flip["filtered"]["correct"] == flip["unfiltered"]["correct"] == 0
    # The original confounded design reproduces mixture A and B.
    orig = ab["stub_output_shifted_label"]
    assert orig["unfiltered"]["correct"] == 0 and orig["filtered"]["correct"] == 80


def test_seed_invariance():
    seeds = DOSE["seeds"]
    assert [s["seed"] for s in seeds] == list(range(10))
    assert all(s["mixture_a_correct"] == 0 and s["mixture_b_correct"] == 80 for s in seeds)


def test_wilson_known_values():
    lo, hi = wilson(0, 80)
    assert lo == 0.0 and abs(hi - 0.045818) < 1e-6
    lo, hi = wilson(80, 80)
    assert abs(lo - 0.954182) < 1e-6 and hi == 1.0
    assert DOSE["wilson95"]["mixture_a"] == [0.0, 0.045818]


def test_sweep_reproduces_v1_setting():
    row = next(r for r in SWEEP["grid"] if r["n"] == 4 and r["min_shared"] == 1)
    assert (row["caught"], row["missed"], row["false_flags"], row["survivors"]) == (20, 0, 0, 58)


def test_sweep_long_ngrams_miss_short_prompts():
    row = next(r for r in SWEEP["grid"] if r["n"] == 13 and r["min_shared"] == 1)
    assert row["benchmark_ngrams"] == 0 and row["caught"] == 12 and row["missed"] == 8
    assert {(r["n"], r["min_shared"]) for r in SWEEP["grid"]} == {
        (n, m) for n in (3, 4, 5, 8, 13) for m in (1, 2)}


def test_committed_results_match_rerun():
    assert _load("level-2-build/results_dose.json") == DOSE
    assert _load("level-3-deep/results_sweep.json") == SWEEP


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for fn in fns:
        fn()
        print("PASS", fn.__name__)
    print(len(fns), "study tests passed")
