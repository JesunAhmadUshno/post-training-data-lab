"""Run P28 Deep and write results_deep.json. Stdlib only, deterministic.

Synthetic data only, labelled synthetic. Decontamination of the
78 Deep candidates against SynthBench-P28-12 at three levels,
and the reusable quality rule set applied to the Build set
(536 records, by import), the Deep set (78), and clean subsets.
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, "level-1-learn"))
sys.path.insert(0, os.path.join(ROOT, "level-2-build"))
from deep_data import BENCHMARK_NAME, BENCHMARK_PROMPTS, generate_deep
from decontaminate import NGRAM_MIN_SHARED, NGRAM_N, benchmark_ngrams, decontaminate_levels
from generator import generate_raw as generate_build_raw
from quality_rules import RULESET, apply_rules

def run_deep():
    deep = generate_deep()
    build = generate_build_raw()
    decon = decontaminate_levels(deep, BENCHMARK_PROMPTS)
    contaminated_total = 20
    caught_exact = len(decon["removed_exact"])
    caught_norm = caught_exact + len(decon["removed_normalized"])
    caught_ngram = caught_norm + len(decon["removed_ngram"])
    build_rules = apply_rules(build)
    deep_rules = apply_rules(deep)
    build_clean = [r for r in build if r.get("tier") == "clean"]
    deep_clean = [r for r in deep if r.get("group") == "clean"]
    build_clean_rules = apply_rules(build_clean)
    deep_clean_rules = apply_rules(deep_clean)
    results = {
        "dataset_label": "synthetic only, generated and hand listed by this project, no real data, no external benchmark items downloaded or claimed",
        "benchmark_name": BENCHMARK_NAME,
        "benchmark_count": len(BENCHMARK_PROMPTS),
        "benchmark_prompts": BENCHMARK_PROMPTS,
        "benchmark_ngram_count": len(benchmark_ngrams(BENCHMARK_PROMPTS)),
        "ngram_n": NGRAM_N,
        "ngram_min_shared": NGRAM_MIN_SHARED,
        "deep_candidate_count": len(deep),
        "deep_group_counts": _group_counts(deep),
        "removed_exact": decon["removed_exact"],
        "after_exact": len(deep) - len(decon["removed_exact"]),
        "removed_normalized": decon["removed_normalized"],
        "after_normalized": len(deep) - len(decon["removed_exact"]) - len(decon["removed_normalized"]),
        "removed_ngram": decon["removed_ngram"],
        "after_ngram": len(decon["survivor_ids"]),
        "survivor_ids": decon["survivor_ids"],
        "ngram_shared": decon["ngram_shared_examples"],
        "contaminated_total_by_design": contaminated_total,
        "caught_by_exact_only": caught_exact,
        "caught_by_normalized_cumulative": caught_norm,
        "caught_by_ngram_cumulative": caught_ngram,
        "missed_by_exact_only": contaminated_total - caught_exact,
        "ruleset_name": RULESET["name"],
        "ruleset_version": RULESET["version"],
        "build_candidate_count": len(build),
        "build_rules": build_rules,
        "deep_rules": deep_rules,
        "build_clean_count": len(build_clean),
        "build_clean_rules": build_clean_rules,
        "deep_clean_count": len(deep_clean),
        "deep_clean_rules": deep_clean_rules,
    }
    return results, deep, build

def _group_counts(records):
    out = {}
    for r in records:
        out[r["group"]] = out.get(r["group"], 0) + 1
    return dict(sorted(out.items()))

if __name__ == "__main__":
    results, _, _ = run_deep()
    with open(os.path.join(HERE, "results_deep.json"), "w", encoding="utf-8") as fh:
        json.dump(results, fh, indent=1, sort_keys=True)
        fh.write("\n")
    print(json.dumps(results, indent=1, sort_keys=True))
