"""Multi-level decontamination for P28 Deep. Stdlib only.

Reuses the Learn tokenizer and dedup key by import.
Levels: exact, normalized exact, word 4-gram overlap (threshold
at least 1 shared 4-gram). Definitions: DEEP-SPEC.md.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "level-1-learn"))
from pipeline import tokens

NGRAM_N = 4
NGRAM_MIN_SHARED = 1

def canonical(text):
    return " ".join(tokens(text))

def word_ngrams(text, n=NGRAM_N):
    toks = tokens(text)
    return {" ".join(toks[i:i + n]) for i in range(len(toks) - n + 1)} if len(toks) >= n else set()

def benchmark_ngrams(prompts, n=NGRAM_N):
    out = set()
    for p in prompts:
        out |= word_ngrams(p, n)
    return out

def decontaminate_levels(records, prompts, n=NGRAM_N, min_shared=NGRAM_MIN_SHARED):
    """n and min_shared default to the v1.0 setting; run_sweep.py varies them."""
    bench_raw = list(prompts)
    bench_canon = {canonical(p) for p in prompts}
    bench_grams = benchmark_ngrams(prompts, n)
    kept1, removed_exact = [], []
    for r in records:
        if r["instruction"] in bench_raw:
            removed_exact.append(r["id"])
        else:
            kept1.append(r)
    kept2, removed_norm = [], []
    for r in kept1:
        if canonical(r["instruction"]) in bench_canon:
            removed_norm.append(r["id"])
        else:
            kept2.append(r)
    kept3, removed_ngram, ngram_detail = [], [], {}
    for r in kept2:
        shared = sorted(word_ngrams(r["instruction"], n) & bench_grams)
        if len(shared) >= min_shared:
            removed_ngram.append(r["id"])
            ngram_detail[r["id"]] = shared
        else:
            kept3.append(r)
    return {
        "removed_exact": removed_exact,
        "removed_normalized": removed_norm,
        "removed_ngram": removed_ngram,
        "ngram_shared_examples": ngram_detail,
        "survivor_ids": [r["id"] for r in kept3],
        "survivors": kept3,
    }
