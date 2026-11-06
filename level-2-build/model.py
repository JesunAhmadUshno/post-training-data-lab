"""Multinomial Naive Bayes over instruction tokens. Standard library only.

Features are instruction tokens (Learn tokenizer). Out of vocabulary
tokens are skipped. Alpha is 1.0. Ties break by first category in
alphabetical order, so prediction is fully deterministic.
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "level-1-learn"))
from pipeline import tokens

ALPHA = 1.0


class NaiveBayes:
    def __init__(self):
        self.categories = []
        self.class_counts = {}
        self.token_counts = {}
        self.class_token_totals = {}
        self.vocab = set()
        self.n_records = 0

    def fit(self, records):
        self.categories = sorted({r["category"] for r in records})
        for cat in self.categories:
            self.class_counts[cat] = 0
            self.token_counts[cat] = {}
            self.class_token_totals[cat] = 0
        self.n_records = len(records)
        for rec in records:
            cat = rec["category"]
            self.class_counts[cat] += 1
            for tok in tokens(rec["instruction"]):
                self.vocab.add(tok)
                self.token_counts[cat][tok] = self.token_counts[cat].get(tok, 0) + 1
                self.class_token_totals[cat] += 1
        return self

    def scores(self, instruction):
        v = len(self.vocab)
        out = {}
        for cat in self.categories:
            score = math.log(self.class_counts[cat] / self.n_records)
            denom = self.class_token_totals[cat] + ALPHA * v
            for tok in tokens(instruction):
                if tok not in self.vocab:
                    continue
                score += math.log((self.token_counts[cat].get(tok, 0) + ALPHA) / denom)
            out[cat] = score
        return out

    def predict(self, instruction):
        sc = self.scores(instruction)
        best = None
        for cat in self.categories:  # alphabetical, strict > keeps first on ties
            if best is None or sc[cat] > sc[best]:
                best = cat
        return best


def evaluate(model, eval_records):
    per_category = {}
    confusion = {}
    correct = 0
    for rec in eval_records:
        pred = model.predict(rec["instruction"])
        true = rec["category"]
        row = per_category.setdefault(true, {"correct": 0, "total": 0})
        row["total"] += 1
        key = f"{true}->{pred}"
        confusion[key] = confusion.get(key, 0) + 1
        if pred == true:
            correct += 1
            row["correct"] += 1
    for cat in sorted(per_category):
        row = per_category[cat]
        row["accuracy"] = round(row["correct"] / row["total"], 6)
    total = len(eval_records)
    return {"correct": correct, "total": total,
            "accuracy": round(correct / total, 6) if total else 0.0,
            "per_category": dict(sorted(per_category.items())),
            "confusion": dict(sorted(confusion.items()))}
