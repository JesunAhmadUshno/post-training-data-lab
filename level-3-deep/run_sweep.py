"""N-gram size and threshold sweep for P28 Deep (ROADMAP v1.1 item 2, first pass).

Runs the three-level decontamination ladder over the 78 labelled Deep
candidates for n in {3, 4, 5, 8, 13} and min shared n-grams in {1, 2},
and writes results_sweep.json. Labels come from deep_data.py groups:
exact, normalized and ngram contaminated (20) are positives; clean (36),
subthreshold (4) and quality probes (18) are negatives.
Synthetic data only, stdlib only, deterministic.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "level-1-learn"))
from decontaminate import benchmark_ngrams, decontaminate_levels  # noqa: E402
from deep_data import BENCHMARK_NAME, BENCHMARK_PROMPTS, generate_deep  # noqa: E402

NS = [3, 4, 5, 8, 13]
MINS = [1, 2]
POSITIVE_GROUPS = {"exact_contaminated", "normalized_contaminated", "ngram_contaminated"}


def run_sweep():
    deep = generate_deep()
    group = {r["id"]: r["group"] for r in deep}
    positives = sum(1 for r in deep if r["group"] in POSITIVE_GROUPS)
    grid = []
    for n in NS:
        for m in MINS:
            d = decontaminate_levels(deep, BENCHMARK_PROMPTS, n=n, min_shared=m)
            removed = d["removed_exact"] + d["removed_normalized"] + d["removed_ngram"]
            caught = sum(1 for i in removed if group[i] in POSITIVE_GROUPS)
            flagged = sorted(i for i in removed if group[i] not in POSITIVE_GROUPS)
            grid.append({"n": n, "min_shared": m,
                         "benchmark_ngrams": len(benchmark_ngrams(BENCHMARK_PROMPTS, n)),
                         "caught": caught, "missed": positives - caught,
                         "false_flags": len(flagged), "false_flag_ids": flagged,
                         "caught_by_ngram_level": len(d["removed_ngram"]),
                         "survivors": len(d["survivor_ids"]),
                         "recall": round(caught / positives, 6),
                         "false_positive_rate": round(len(flagged) / (len(deep) - positives), 6)})
    return {"dataset_label": "synthetic only, generated and hand listed by this project, no real data",
            "benchmark_name": BENCHMARK_NAME, "candidate_count": len(deep),
            "positives": positives, "negatives": len(deep) - positives,
            "ns": NS, "min_shared_values": MINS, "grid": grid}


if __name__ == "__main__":
    results = run_sweep()
    with open(os.path.join(HERE, "results_sweep.json"), "w", encoding="utf-8") as fh:
        json.dump(results, fh, indent=1, sort_keys=True)
        fh.write("\n")
    for r in results["grid"]:
        print(r["n"], r["min_shared"], r["caught"], r["missed"], r["false_flags"], r["survivors"])
