"""Hand-computed tests for P28 Deep. Oracles are in DEEP-SPEC.md."""
import os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "level-3-deep"))
sys.path.insert(0, os.path.join(ROOT, "level-1-learn"))
sys.path.insert(0, os.path.join(ROOT, "level-2-build"))
from deep_data import BENCHMARK_PROMPTS, generate_deep
from decontaminate import canonical, decontaminate_levels, word_ngrams, benchmark_ngrams
from quality_rules import RULESET, apply_rules
from run_deep import run_deep

RESULTS, DEEP, BUILD = run_deep()
BY_ID = {r["id"]: r for r in DEEP}

def test_benchmark_named_and_synthetic():
    assert RESULTS["benchmark_name"] == "SynthBench-P28-12"
    assert len(BENCHMARK_PROMPTS) == 12
    assert BENCHMARK_PROMPTS[:2] == ["what is the capital of canada", "state the theorem of pythagoras"]
    assert len(benchmark_ngrams(BENCHMARK_PROMPTS)) == 45
    assert len(DEEP) == 78 and all(r["synthetic"] is True for r in DEEP)
    # q13 and q14 keep synthetic true; they fire R06 for an empty source or license.
    assert RESULTS["deep_group_counts"] == {"clean": 36, "exact_contaminated": 6, "ngram_contaminated": 8, "normalized_contaminated": 6, "quality_probe": 18, "subthreshold": 4}

def test_canonical_and_ngram_oracles():
    assert canonical("LIST  three primary colors and their names!") == BENCHMARK_PROMPTS[6]
    assert canonical("How do you make a sandwich at home?") == BENCHMARK_PROMPTS[7]
    assert "what is the capital" in word_ngrams(BY_ID["g01"]["instruction"])
    assert word_ngrams(BY_ID["s01"]["instruction"]) & benchmark_ngrams(BENCHMARK_PROMPTS) == set()
    assert word_ngrams(BY_ID["s04"]["instruction"]) & benchmark_ngrams(BENCHMARK_PROMPTS) == set()
    # s01 shares exactly the 3-token prefix, no 4-gram, by design.
    assert BY_ID["s01"]["instruction"].split()[:3] == BENCHMARK_PROMPTS[0].split()[:3]

def test_decontamination_levels():
    d = decontaminate_levels(DEEP, BENCHMARK_PROMPTS)
    assert d["removed_exact"] == [f"e{i:02d}" for i in range(1, 7)]
    assert d["removed_normalized"] == [f"n{i:02d}" for i in range(1, 7)]
    assert d["removed_ngram"] == [f"g{i:02d}" for i in range(1, 9)]
    assert (RESULTS["after_exact"], RESULTS["after_normalized"], RESULTS["after_ngram"]) == (72, 66, 58)
    assert RESULTS["survivor_ids"][:36] == [f"c{i:03d}" for i in range(1, 37)]
    assert RESULTS["survivor_ids"][36:40] == ["s01", "s02", "s03", "s04"]

def test_exact_only_misses_near_contamination():
    assert RESULTS["contaminated_total_by_design"] == 20
    assert RESULTS["caught_by_exact_only"] == 6 and RESULTS["missed_by_exact_only"] == 14
    assert RESULTS["caught_by_normalized_cumulative"] == 12
    assert RESULTS["caught_by_ngram_cumulative"] == 20
    assert "what is the capital" in RESULTS["ngram_shared"]["g01"]

def test_ruleset_versioned():
    assert RULESET["version"] == "1.0.0" and RULESET["name"] == "post-training-data-quality-rules"
    assert [r["id"] for r in RULESET["rules"]] == [f"R{i:02d}" for i in range(1, 9)]

def test_rule_counts_build():
    assert RESULTS["build_candidate_count"] == 536
    assert RESULTS["build_rules"]["counts"] == {"R01": 0, "R02": 288, "R03": 288, "R04": 0, "R05": 0, "R06": 0, "R07": 24, "R08": 0}
    assert RESULTS["build_rules"]["total_fire_events"] == 600
    assert RESULTS["build_rules"]["ids"]["R07"] == [f"d{i:03d}" for i in range(1, 25)]

def test_rule_counts_deep():
    assert RESULTS["deep_rules"]["counts"] == {"R01": 3, "R02": 3, "R03": 3, "R04": 2, "R05": 2, "R06": 2, "R07": 2, "R08": 2}
    assert RESULTS["deep_rules"]["total_fire_events"] == 19
    assert RESULTS["deep_rules"]["ids"]["R01"] == ["q01", "q02", "q03"]
    assert RESULTS["deep_rules"]["ids"]["R03"] == ["q05", "q07", "q08"]
    assert RESULTS["deep_rules"]["ids"]["R07"] == ["q15", "q16"]

def test_clean_false_positives_zero():
    assert RESULTS["build_clean_count"] == 192 and RESULTS["build_clean_rules"]["total_fire_events"] == 0
    assert RESULTS["deep_clean_count"] == 36 and RESULTS["deep_clean_rules"]["total_fire_events"] == 0
    assert all(v == 0 for v in RESULTS["build_clean_rules"]["counts"].values())
    assert all(v == 0 for v in RESULTS["deep_clean_rules"]["counts"].values())

def test_q05_double_fire_by_design():
    assert "q05" in RESULTS["deep_rules"]["ids"]["R02"] and "q05" in RESULTS["deep_rules"]["ids"]["R03"]

def test_determinism_in_process():
    again, _, _ = run_deep()
    assert again == RESULTS

if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for fn in fns: fn(); print("PASS", fn.__name__)
    print(len(fns), "Deep tests passed")
