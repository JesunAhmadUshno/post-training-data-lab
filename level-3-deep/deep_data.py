"""Deep data for P28: SynthBench-P28-12 and 78 synthetic candidates.

All records are synthetic, hand listed or template generated with
sequential topics, and labelled synthetic. No real data is used.
No external benchmark items were downloaded or claimed.
Design and oracles: DEEP-SPEC.md, written before this code.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "level-1-learn"))

SOURCE = "synthetic-deep-p28"
LICENSE_TEXT = "CC BY 4.0 (synthetic, self-authored)"
BENCHMARK_NAME = "SynthBench-P28-12"

BENCHMARK_PROMPTS = [
    "what is the capital of canada",
    "state the theorem of pythagoras",
    "explain how photosynthesis converts sunlight into energy",
    "write a haiku about autumn leaves falling",
    "describe the water cycle stages in order",
    "translate hello to french for a visitor",
    "list three primary colors and their names",
    "how do you make a sandwich at home",
    "define machine learning in simple terms",
    "give an example of a palindrome word",
    "explain what an api does for software",
    "describe how a hash table stores values",
]

CATEGORIES = ["code", "factual", "language", "writing"]
VERBS = {"code": ["implement", "debug"], "factual": ["explain", "describe"],
         "language": ["translate", "render"], "writing": ["write", "compose"]}
OUTPUT_TEMPLATES = {
    "code": "{topic} function code implements the task with clear steps",
    "factual": "{topic} answer explains the facts with clear details",
    "language": "{topic} translation gives the meaning with clear wording",
    "writing": "{topic} story poem gives a scene with clear images",
}

def _rec(rid, instruction, output, category, group, source=SOURCE, license_text=LICENSE_TEXT, synthetic=True):
    return {"id": rid, "instruction": instruction, "input": "", "output": output,
            "source": source, "license": license_text, "category": category,
            "group": group, "synthetic": synthetic}

def _clean_output(cat, topic):
    return OUTPUT_TEMPLATES[cat].format(topic=topic)

def generate_deep():
    records = []
    clean = []
    # Clean c001-c036: 9 rounds x 4 categories, sequential topics.
    seq = 0
    for round_idx in range(9):
        for cat in CATEGORIES:
            seq += 1
            topic = f"dtopic{seq:03d}"
            verb = VERBS[cat][round_idx % 2]
            rec = _rec(f"c{seq:03d}", f"{verb} {topic} in simple terms",
                       _clean_output(cat, topic), cat, "clean")
            clean.append(rec)
            records.append(rec)
    bench_out = "benchmark style answer number {} with extra detail"
    # Exact e01-e06: verbatim B01-B06.
    for i in range(6):
        records.append(_rec(f"e{i+1:02d}", BENCHMARK_PROMPTS[i],
                            bench_out.format(i + 1), "factual", "exact_contaminated"))
    # Normalized n01-n06: B07-B12 with case, spacing, punctuation changes.
    variants = [
        "LIST  three primary colors and their names!",
        "How do you make a sandwich at home?",
        "DEFINE   machine learning in simple terms.",
        "Give an example of a palindrome word!",
        "Explain what an API does for software?",
        "Describe how a hash table stores values.",
    ]
    for i, text in enumerate(variants):
        records.append(_rec(f"n{i+1:02d}", text, bench_out.format(i + 7),
                            "factual", "normalized_contaminated"))
    # N-gram g01-g08: B01-B08 embedded, retaining a benchmark 4-gram.
    near_texts = [
        "please answer what is the capital of canada today",
        "state the theorem of pythagoras in your answer please",
        "explain how photosynthesis converts sunlight into energy clearly",
        "write a haiku about autumn leaves falling for me",
        "describe the water cycle stages in order step by step",
        "translate hello to french for a visitor please today",
        "list three primary colors and their names for class",
        "how do you make a sandwich at home for lunch",
    ]
    for i, text in enumerate(near_texts):
        records.append(_rec(f"g{i+1:02d}", text, bench_out.format(i + 13),
                            "factual", "ngram_contaminated"))
    # Sub-threshold s01-s04: at most a 3-token overlap, no 4-gram.
    sub = [
        ("s01", "what is the best route to the lake", "the best route follows the river path past the old bridge"),
        ("s02", "state the theorem clearly for students today",
         "the theorem is stated clearly with a worked example for students"),
        ("s03", "explain how photosynthesis helps green plants grow",
         "sunlight and water help green plants make food and grow"),
        ("s04", "write a haiku for autumn mornings today", "cool air and gold light open the quiet morning fields"),
    ]
    for rid, ins, out in sub:
        records.append(_rec(rid, ins, out, "factual", "subthreshold"))
    # Quality probes q01-q18: each fires only its intended rule, q05 fires R02 and R03.
    good_out = "a clear detailed answer with distinct supporting words included"
    def q(rid, ins, out, group="quality_probe", **kw):
        records.append(_rec(rid, ins, out, "factual", group, **kw))
    q("q01", "Hi", good_out)
    q("q02", "Hello there", good_out)
    q("q03", "Explain", good_out)
    q("q04", "explain dtopic901 in simple terms", "")
    q("q05", "explain dtopic902 in simple terms", "unknown")
    q("q06", "explain dtopic903 in simple terms", "ok")
    q("q07", "explain dtopic904 in simple terms", "todo todo todo")
    q("q08", "explain dtopic905 in simple terms", "tbd tbd")
    q("q09", "visit http example site for details today", good_out)
    q("q10", "check www example page for more details", good_out)
    q("q11", "explain dtopic906 in simple terms", "data data data data data model")
    q("q12", "explain dtopic907 in simple terms", "very very very very good answer")
    q("q13", "explain dtopic908 in simple terms", good_out, source="")
    q("q14", "explain dtopic909 in simple terms", good_out, license_text="")
    # q15, q16: exact duplicates of c001, c002 (instruction and output).
    records.append(_rec("q15", clean[0]["instruction"], clean[0]["output"], clean[0]["category"], "quality_probe"))
    records.append(_rec("q16", clean[1]["instruction"], clean[1]["output"], clean[1]["category"], "quality_probe"))
    q("q17", "explain the full detailed history of the ancient trade routes across central asia step by step", good_out)
    q("q18", "describe every major stage of the long river journey from mountain source to ocean", good_out)
    return records
