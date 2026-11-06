"""Hand-computed tests for P28 Build. Oracles are in BUILD-SPEC.md."""
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "level-2-build"))
sys.path.insert(0, os.path.join(ROOT, "level-1-learn"))
from generator import generate_raw  # noqa: E402
from model import NaiveBayes  # noqa: E402
from pipeline import jaccard, token_set  # noqa: E402
from run_build import run_build  # noqa: E402

RESULTS, RAW, EVAL = run_build()
BY_ID = {r["id"]: r for r in RAW}

def test_generation_counts_and_labels():
    assert len(RAW) == 536
    assert RESULTS["raw_tier_counts"] == {"clean": 192, "contaminated": 8,
        "exact_duplicate": 24, "low_quality_poison": 288, "near_duplicate": 24}
    assert RESULTS["raw_label_counts"] == {"code": 136, "factual": 132,
                                            "language": 132, "writing": 136}
    assert all(r["synthetic"] is True for r in RAW)
    assert all("synthetic" in r["license"] for r in RAW)
    assert all(r["source"] == "synthetic-generated-p28-build" for r in RAW)
    assert len(EVAL) == 80 and RESULTS["eval_label_counts"] == {
        "code": 20, "factual": 20, "language": 20, "writing": 20}

def test_near_dup_jaccard_oracle():
    src = BY_ID["s025"]
    dup = BY_ID["n001"]
    v = jaccard(token_set(src["instruction"]), token_set(dup["instruction"]))
    assert abs(v - (5 / 6)) < 1e-12

def test_filtering_stage_counts():
    assert (RESULTS["raw_count"], RESULTS["after_exact_dedup"],
            RESULTS["after_near_dedup"], RESULTS["after_quality"],
            RESULTS["after_decontamination"]) == (536, 512, 482, 194, 192)
    assert RESULTS["removed_exact"] == [f"d{i:03d}" for i in range(1, 25)]
    assert RESULTS["removed_near"][:24] == [f"n{i:03d}" for i in range(1, 25)]
    assert RESULTS["removed_near"][24:] == ["x002", "x003", "x004", "x006", "x007", "x008"]
    assert RESULTS["removed_quality_count"] == 288
    assert RESULTS["removed_quality_all_poison"] is True
    assert RESULTS["removed_contaminated"] == ["x001", "x005"]
    assert RESULTS["filtered_ids"] == [f"s{i:03d}" for i in range(1, 193)]
    assert RESULTS["filtered_label_counts"] == {"code": 48, "factual": 48,
                                                 "language": 48, "writing": 48}

def test_nb_toy_oracles():
    toy = [{"instruction": "red apple", "category": "fruit"},
           {"instruction": "red cherry", "category": "fruit"},
           {"instruction": "blue truck", "category": "vehicle"}]
    m = NaiveBayes().fit(toy)
    s1 = m.scores("red apple")
    assert m.predict("red apple") == "fruit"
    assert math.isclose(s1["fruit"], math.log(2/3) + math.log(3/9) + math.log(2/9), rel_tol=1e-9)
    assert math.isclose(s1["vehicle"], math.log(1/3) + math.log(1/7) + math.log(1/7), rel_tol=1e-9)
    s2 = m.scores("blue truck")
    assert m.predict("blue truck") == "vehicle"
    assert math.isclose(s2["fruit"], math.log(2/3) + math.log(1/9) + math.log(1/9), rel_tol=1e-9)
    assert math.isclose(s2["vehicle"], math.log(1/3) + math.log(2/7) + math.log(2/7), rel_tol=1e-9)

def test_oov_and_tie_determinism():
    m = NaiveBayes().fit(generate_raw()[:8])
    # An entirely out of vocabulary instruction falls back to priors
    # and the alphabetical tie break; prediction must be stable.
    assert m.predict("zzqq unknownword") == m.predict("zzqq unknownword")

def test_mixture_study_results():
    a, b = RESULTS["mixture_a"], RESULTS["mixture_b"]
    assert a["train_count"] == 536 and b["train_count"] == 192
    assert a["eval"]["correct"] == 0 and a["eval"]["accuracy"] == 0.0
    assert a["eval"]["confusion"] == {"code->factual": 20, "factual->language": 20,
                                      "language->writing": 20, "writing->code": 20}
    assert all(v["accuracy"] == 0.0 for v in a["eval"]["per_category"].values())
    assert b["eval"]["correct"] == 80 and b["eval"]["accuracy"] == 1.0
    assert all(v["accuracy"] == 1.0 and v["total"] == 20
               for v in b["eval"]["per_category"].values())
    assert RESULTS["accuracy_delta_b_minus_a"] == 1.0

def test_eval_is_held_out():
    train_topics = {t for r in RAW for t in r["instruction"].split() if t.startswith("topic")}
    eval_topics = {t for r in EVAL for t in r["instruction"].split() if "topic" in t}
    assert train_topics and eval_topics and not (train_topics & eval_topics)
    assert not ({r["id"] for r in RAW} & {r["id"] for r in EVAL})

def test_determinism_in_process():
    again, _, _ = run_build()
    assert again == RESULTS

if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for fn in fns:
        fn()
        print("PASS", fn.__name__)
    print(len(fns), "Build tests passed")
