"""Seeded synthetic data generator for P28 Build. Standard library only.

All records are synthetic, generated here, and labelled synthetic
in every field that carries provenance. No real data is used.
Design and hand-computed counts: BUILD-SPEC.md.
"""
import os, random, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "level-1-learn"))
from pipeline import BENCHMARK_PROMPTS  # the 2 synthetic benchmark prompts

SEED = 42
SOURCE = "synthetic-generated-p28-build"
LICENSE_TEXT = "CC BY 4.0 (synthetic, self-authored)"
CATEGORIES = ["code", "factual", "language", "writing"]
VERBS = {
    "code": ["implement", "debug"],
    "factual": ["explain", "describe"],
    "language": ["translate", "render"],
    "writing": ["write", "compose"],
}
OUTPUT_TEMPLATES = {
    "code": "{topic} function code implements the task with clear steps",
    "factual": "{topic} answer explains the facts with clear details",
    "language": "{topic} translation gives the meaning with clear wording",
    "writing": "{topic} story poem gives a scene with clear images",
}
CLEAN_PER_CATEGORY = 48
EXACT_DUP_COUNT = 24
NEAR_DUP_COUNT = 24
POISON_PER_SIGNAL_CATEGORY = 72
CONTAMINATED_PER_PROMPT = 4
EVAL_PER_CATEGORY = 20


def _rec(rid, instruction, output, category, tier):
    return {"id": rid, "instruction": instruction, "input": "",
            "output": output, "source": SOURCE, "license": LICENSE_TEXT,
            "category": category, "tier": tier, "synthetic": True}


def _clean_instruction(category, round_idx, topic):
    verb = VERBS[category][round_idx % 2]
    return f"{verb} {topic} in simple terms"


def _clean_output(category, topic):
    return OUTPUT_TEMPLATES[category].format(topic=topic)


def generate_raw():
    rng = random.Random(SEED)
    # Unique topic tokens, assignment order shuffled by the seed.
    n_topics = CLEAN_PER_CATEGORY * 4 + POISON_PER_SIGNAL_CATEGORY * 4
    pool = list(range(n_topics))
    rng.shuffle(pool)
    topics = iter([f"topic{n:03d}" for n in pool])

    records = []
    clean = []
    seq = 0
    for round_idx in range(CLEAN_PER_CATEGORY):
        for cat in CATEGORIES:
            seq += 1
            topic = next(topics)
            rec = _rec(f"s{seq:03d}", _clean_instruction(cat, round_idx, topic),
                       _clean_output(cat, topic), cat, "clean")
            rec["_topic"] = topic
            clean.append(rec)
            records.append(rec)
    # Exact duplicates: copies of s001..s024.
    for i in range(EXACT_DUP_COUNT):
        src = clean[i]
        records.append(_rec(f"d{i + 1:03d}", src["instruction"], src["output"],
                            src["category"], "exact_duplicate"))
    # Near duplicates: copies of s025..s048 plus one token, please.
    for i in range(NEAR_DUP_COUNT):
        src = clean[EXACT_DUP_COUNT + i]
        records.append(_rec(f"n{i + 1:03d}", src["instruction"] + " please",
                            src["output"], src["category"], "near_duplicate"))
    # Low-quality poison: stub output, label is the next category.
    seq = 0
    for xi, x in enumerate(CATEGORIES):
        y = CATEGORIES[(xi + 1) % len(CATEGORIES)]
        for j in range(POISON_PER_SIGNAL_CATEGORY):
            seq += 1
            topic = next(topics)
            ins = _clean_instruction(x, j, topic)
            records.append(_rec(f"p{seq:03d}", ins, "unknown", y, "low_quality_poison"))
    # Contaminated: instruction is a benchmark prompt, long output.
    seq = 0
    labels = ["writing", "code"]
    for pi, prompt in enumerate(BENCHMARK_PROMPTS):
        for k in range(CONTAMINATED_PER_PROMPT):
            seq += 1
            out = f"benchmark style answer number {k + 1} with extra detail"
            records.append(_rec(f"x{seq:03d}", prompt, out, labels[pi], "contaminated"))
    for rec in records:
        rec.pop("_topic", None)
    return records


def generate_eval():
    records = []
    seq = 0
    for round_idx in range(EVAL_PER_CATEGORY):
        for cat in CATEGORIES:
            seq += 1
            topic = f"evaltopic{seq:03d}"
            records.append(_rec(f"e{seq:03d}", _clean_instruction(cat, round_idx, topic),
                                _clean_output(cat, topic), cat, "eval_clean"))
    return records
