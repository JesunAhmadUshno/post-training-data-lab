"""Run the P28 Learn pipeline and write results_learn.json."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pipeline import run_pipeline

if __name__ == "__main__":
    results = run_pipeline()
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results_learn.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(results, fh, indent=1, sort_keys=True)
        fh.write("\n")
    print(json.dumps(results, indent=1, sort_keys=True))
