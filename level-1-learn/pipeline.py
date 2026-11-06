"""Post-training data curation pipeline. Standard library only.

Synthetic teaching set only. No real data is used or claimed.
Stages: exact dedup, near dedup, quality filters, decontamination,
SFT conversion with schema validation, split with leakage check.
"""
import re

TOKEN_RE = re.compile(r"[a-z0-9]+")
SYSTEM_PROMPT = "You are a helpful assistant."
SOURCE = "synthetic-teaching-set"
LICENSE_TEXT = "CC BY 4.0 (synthetic, self-authored)"
NEAR_DUP_THRESHOLD = 0.8
MIN_INSTRUCTION_TOKENS = 3
MIN_OUTPUT_TOKENS = 2

BENCHMARK_PROMPTS = [
    "What is the capital of Canada",
    "State the theorem of Pythagoras",
]


def _rec(rid, instruction, output, category, inp=""):
    return {"id": rid, "instruction": instruction, "input": inp,
            "output": output, "source": SOURCE,
            "license": LICENSE_TEXT, "category": category}


RAW_EXAMPLES = [
    _rec("r01", "Explain what a hash table is",
         "A hash table maps keys to values using a hash function.", "factual"),
    _rec("r02", "explain  what a hash table is",
         "a hash table maps keys to values using a hash function.", "factual"),
    _rec("r03", "Write a haiku about autumn leaves falling",
         "Leaves drift down slowly amber light fills the quiet air", "writing"),
    _rec("r04", "Write a haiku about autumn leaves falling down",
         "Leaves fall in amber light over the quiet garden path", "writing"),
    _rec("r05", "What is two plus two", "Four", "factual"),
    _rec("r06", "Summarize this article", "", "writing"),
    _rec("r07", "Hi", "Hello there friend", "factual"),
    _rec("r08", "Describe how photosynthesis works",
         "Plants convert sunlight water and carbon dioxide into oxygen and glucose energy", "factual"),
    _rec("r09", "Write a python function to add two numbers",
         "def add(a, b): return a + b", "code"),
    _rec("r10", "Translate hello to French",
         "Bonjour is hello in French", "language"),
    _rec("r11", "List three primary colors",
         "Red blue and yellow are primary colors", "factual"),
    _rec("r12", "Explain why the sky is blue",
         "Sunlight scatters in the atmosphere and blue light scatters most", "factual"),
    _rec("r13", "Write a short poem about the sea",
         "Waves roll over sand and shells shine in morning light", "writing"),
    _rec("r14", "How do you make a sandwich",
         "Place cheese and lettuce between two slices of bread", "factual",
         inp="Ingredients: cheese, lettuce, bread."),
    _rec("r15", "Define machine learning in simple terms",
         "Machine learning lets computers learn patterns from data examples", "factual"),
    _rec("r16", "Give an example of a palindrome word",
         "Racecar is a palindrome because it reads the same backward", "factual"),
    _rec("r17", "Write code to reverse a string in python",
         "Use slicing text[::-1] to reverse the string", "code"),
    _rec("r18", "What is the capital of Canada",
         "Ottawa is the capital city of Canada", "factual"),
    _rec("r19", "Describe the water cycle stages",
         "Evaporation condensation precipitation and collection form the water cycle", "factual"),
    _rec("r20", "Explain what an API does",
         "An API lets different software systems communicate and share data", "factual"),
]


def tokens(text):
    return TOKEN_RE.findall(text.lower())


def token_set(text):
    return set(tokens(text))


def normalize(text):
    return " ".join(text.lower().split())


def dedup_key(rec):
    return normalize(rec["instruction"]) + " || " + normalize(rec["output"])


def jaccard(set_a, set_b):
    union = set_a | set_b
    if not union:
        return 0.0
    return len(set_a & set_b) / len(union)


def exact_dedup(records):
    seen, kept, removed = set(), [], []
    for rec in records:
        key = dedup_key(rec)
        if key in seen:
            removed.append(rec["id"])
        else:
            seen.add(key)
            kept.append(rec)
    return kept, removed


def near_dedup(records, threshold=NEAR_DUP_THRESHOLD):
    kept, removed = [], []
    kept_sets = []
    for rec in records:
        s = token_set(rec["instruction"])
        if any(jaccard(s, ks) >= threshold for ks in kept_sets):
            removed.append(rec["id"])
        else:
            kept.append(rec)
            kept_sets.append(s)
    return kept, removed


def quality_filter(records):
    kept, removed = [], []
    for rec in records:
        if len(tokens(rec["instruction"])) < MIN_INSTRUCTION_TOKENS:
            removed.append(rec["id"])
        elif len(tokens(rec["output"])) < MIN_OUTPUT_TOKENS:
            removed.append(rec["id"])
        else:
            kept.append(rec)
    return kept, removed


def decontaminate(records, benchmark_prompts=BENCHMARK_PROMPTS):
    bench = {normalize(p) for p in benchmark_prompts}
    kept, removed = [], []
    for rec in records:
        if normalize(rec["instruction"]) in bench:
            removed.append(rec["id"])
        else:
            kept.append(rec)
    return kept, removed


def to_sft(rec):
    user = rec["instruction"]
    if rec["input"]:
        user = rec["instruction"] + "\n" + rec["input"]
    return {"id": rec["id"],
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user},
                {"role": "assistant", "content": rec["output"]}],
            "source": rec["source"], "license": rec["license"]}


def validate_sft(rec):
    if not isinstance(rec.get("id"), str) or not rec["id"]:
        return False
    msgs = rec.get("messages")
    if not isinstance(msgs, list) or len(msgs) != 3:
        return False
    if [m.get("role") for m in msgs] != ["system", "user", "assistant"]:
        return False
    if any(not isinstance(m.get("content"), str) or not m["content"] for m in msgs):
        return False
    if not rec.get("source") or not rec.get("license"):
        return False
    return True


def split_train_eval(records):
    ordered = sorted(records, key=lambda r: r["id"])
    train = [r for i, r in enumerate(ordered) if i % 5 != 4]
    ev = [r for i, r in enumerate(ordered) if i % 5 == 4]
    return train, ev


def leakage_counts(train_raw, eval_raw):
    train_keys = {dedup_key(r) for r in train_raw}
    eval_keys = {dedup_key(r) for r in eval_raw}
    exact = len(train_keys & eval_keys)
    near = 0
    for a in train_raw:
        for b in eval_raw:
            if jaccard(token_set(a["instruction"]), token_set(b["instruction"])) >= NEAR_DUP_THRESHOLD:
                near += 1
    return exact, near


def run_pipeline():
    raw = list(RAW_EXAMPLES)
    after_exact, removed_exact = exact_dedup(raw)
    after_near, removed_near = near_dedup(after_exact)
    after_quality, removed_quality = quality_filter(after_near)
    final, removed_contam = decontaminate(after_quality)
    sft = [to_sft(r) for r in final]
    valid = sum(1 for r in sft if validate_sft(r))
    train_raw, eval_raw = split_train_eval(final)
    exact_leak, near_leak = leakage_counts(train_raw, eval_raw)
    cats = {}
    for r in final:
        cats[r["category"]] = cats.get(r["category"], 0) + 1
    ins = [len(tokens(r["instruction"])) for r in final]
    outs = [len(tokens(r["output"])) for r in final]
    return {
        "dataset_label": "synthetic teaching set only, no real data",
        "source": SOURCE, "license": LICENSE_TEXT,
        "benchmark_prompts": len(BENCHMARK_PROMPTS),
        "near_dup_threshold": NEAR_DUP_THRESHOLD,
        "raw_count": len(raw),
        "after_exact_dedup": len(after_exact), "removed_exact": removed_exact,
        "after_near_dedup": len(after_near), "removed_near": removed_near,
        "after_quality": len(after_quality), "removed_quality": removed_quality,
        "after_decontamination": len(final), "removed_contaminated": removed_contam,
        "final_ids": [r["id"] for r in final],
        "sft_records": len(sft), "sft_valid": valid,
        "train_count": len(train_raw), "train_ids": [r["id"] for r in train_raw],
        "eval_count": len(eval_raw), "eval_ids": [r["id"] for r in eval_raw],
        "leakage_exact_overlap": exact_leak, "leakage_near_pairs": near_leak,
        "category_counts": dict(sorted(cats.items())),
        "instruction_token_sum": sum(ins),
        "instruction_token_mean": round(sum(ins) / len(ins), 6),
        "output_token_sum": sum(outs),
        "output_token_mean": round(sum(outs) / len(outs), 6),
    }
