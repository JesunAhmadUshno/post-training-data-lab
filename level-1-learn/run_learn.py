"""Run the P28 Learn pipeline and write results_learn.json."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pipeline import RAW_EXAMPLES, run_pipeline

if __name__ == "__main__":
    results = run_pipeline()
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results_learn.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(results, fh, indent=1, sort_keys=True)
        fh.write("\n")
    # The raw teaching records as a data file, so other tools (the site) read data, not code.
    with open(os.path.join(os.path.dirname(out), "learn_raw.jsonl"), "w", encoding="utf-8") as fh:
        for rec in RAW_EXAMPLES:
            fh.write(json.dumps(rec, sort_keys=True) + "\n")
    print(json.dumps(results, indent=1, sort_keys=True))
