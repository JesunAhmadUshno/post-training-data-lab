"""Hand-computed tests for P28 Learn. Oracles are in LEARN-SPEC.md."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "level-1-learn"))
from pipeline import (RAW_EXAMPLES, BENCHMARK_PROMPTS, tokens, jaccard,
                      token_set, dedup_key, exact_dedup, near_dedup,
                      quality_filter, decontaminate, to_sft, validate_sft,
                      split_train_eval, leakage_counts, run_pipeline)

R = run_pipeline()
BY_ID = {r["id"]: r for r in RAW_EXAMPLES}

def test_raw_count_and_labels():
    assert len(RAW_EXAMPLES) == 20
    assert all(r["source"] == "synthetic-teaching-set" for r in RAW_EXAMPLES)
    assert all("synthetic" in r["license"] for r in RAW_EXAMPLES)

def test_tokenizer_oracles():
    assert len(tokens(BY_ID["r01"]["instruction"])) == 6
    assert len(tokens(BY_ID["r01"]["output"])) == 11
    assert len(tokens(BY_ID["r09"]["output"])) == 7
    assert len(tokens(BY_ID["r17"]["output"])) == 8

def test_jaccard_oracle():
    v = jaccard(token_set(BY_ID["r03"]["instruction"]), token_set(BY_ID["r04"]["instruction"]))
    assert abs(v - 0.875) < 1e-12
    v2 = jaccard(token_set(BY_ID["r09"]["instruction"]), token_set(BY_ID["r17"]["instruction"]))
    assert abs(v2 - (4 / 12)) < 1e-12

def test_exact_dedup():
    kept, removed = exact_dedup(RAW_EXAMPLES)
    assert removed == ["r02"] and len(kept) == 19
    assert dedup_key(BY_ID["r01"]) == dedup_key(BY_ID["r02"])

def test_near_dedup():
    kept, _ = exact_dedup(RAW_EXAMPLES)
    kept2, removed = near_dedup(kept)
    assert removed == ["r04"] and len(kept2) == 18

def test_quality():
    kept, _ = exact_dedup(RAW_EXAMPLES); kept, _ = near_dedup(kept)
    kept2, removed = quality_filter(kept)
    assert removed == ["r05", "r06", "r07"] and len(kept2) == 15

def test_decontamination():
    assert len(BENCHMARK_PROMPTS) == 2
    kept, _ = exact_dedup(RAW_EXAMPLES); kept, _ = near_dedup(kept); kept, _ = quality_filter(kept)
    kept2, removed = decontaminate(kept)
    assert removed == ["r18"] and len(kept2) == 14

def test_stage_counts_and_final_ids():
    assert (R["raw_count"], R["after_exact_dedup"], R["after_near_dedup"], R["after_quality"], R["after_decontamination"]) == (20, 19, 18, 15, 14)
    assert R["final_ids"] == ["r01","r03","r08","r09","r10","r11","r12","r13","r14","r15","r16","r17","r19","r20"]

def test_token_sums_and_means():
    assert R["instruction_token_sum"] == 83 and R["instruction_token_mean"] == 5.928571
    assert R["output_token_sum"] == 127 and R["output_token_mean"] == 9.071429

def test_sft_conversion_and_schema():
    sft = [to_sft(BY_ID[i]) for i in R["final_ids"]]
    assert len(sft) == 14 and all(validate_sft(s) for s in sft)
    assert R["sft_valid"] == 14
    r14 = [s for s in sft if s["id"] == "r14"][0]
    assert r14["messages"][1]["content"] == "How do you make a sandwich\nIngredients: cheese, lettuce, bread."
    bad = {"id": "x", "messages": [{"role": "system", "content": "s"}, {"role": "user", "content": "u"}], "source": "s", "license": "l"}
    assert not validate_sft(bad)

def test_split_and_leakage():
    assert R["train_count"] == 12 and R["eval_count"] == 2
    assert R["eval_ids"] == ["r10", "r15"]
    assert R["leakage_exact_overlap"] == 0 and R["leakage_near_pairs"] == 0
    final = [BY_ID[i] for i in R["final_ids"]]
    tr, ev = split_train_eval(final)
    assert leakage_counts(tr, ev) == (0, 0)

def test_category_counts():
    assert R["category_counts"] == {"code": 2, "factual": 9, "language": 1, "writing": 2}

if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for fn in fns: fn(); print("PASS", fn.__name__)
    print(len(fns), "Learn tests passed")
