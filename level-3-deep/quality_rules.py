"""Reusable data quality rule set for P28 Deep. Stdlib only.

Rules are defined in rules.json (version 1.0.0) beside this file
and loaded here, so other builders can reuse the same file and
code. Each rule fires independently. Reuses Learn tokens and
dedup_key by import.
"""
import json, os, sys
from collections import Counter
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "level-1-learn"))
from pipeline import dedup_key, tokens

HERE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(HERE, "rules.json"), encoding="utf-8") as fh:
    RULESET = json.load(fh)
RULES = {r["id"]: r for r in RULESET["rules"]}
RULE_IDS = [r["id"] for r in RULESET["rules"]]

def _fires(rec, seen_keys):
    out = []
    ins = tokens(rec.get("instruction", "")); outs = tokens(rec.get("output", ""))
    if len(ins) < RULES["R01"]["min_instruction_tokens"]: out.append("R01")
    if len(outs) < RULES["R02"]["min_output_tokens"]: out.append("R02")
    placeholders = set(RULES["R03"]["placeholder_tokens"])
    if outs and all(t in placeholders for t in outs): out.append("R03")
    if any(t in set(RULES["R04"]["url_tokens"]) for t in ins): out.append("R04")
    if len(outs) >= RULES["R05"]["dominance_min_tokens"]:
        top = Counter(outs).most_common(1)[0][1]
        if top / len(outs) > RULES["R05"]["dominance_threshold"]: out.append("R05")
    if not rec.get("source") or not rec.get("license") or rec.get("synthetic") is not True: out.append("R06")
    key = dedup_key(rec)
    if key in seen_keys: out.append("R07")
    else: seen_keys.add(key)
    if len(ins) > RULES["R08"]["max_instruction_tokens"]: out.append("R08")
    return out

def apply_rules(records):
    """Return per-rule counts, per-rule id lists, and total fire events."""
    seen = set(); counts = {rid: 0 for rid in RULE_IDS}; ids = {rid: [] for rid in RULE_IDS}
    for rec in records:
        for rid in _fires(rec, seen):
            counts[rid] += 1; ids[rid].append(rec["id"])
    return {"counts": counts, "ids": ids, "total_fire_events": sum(counts.values()),
            "ruleset_version": RULESET["version"]}
