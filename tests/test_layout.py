"""Portfolio standard checks: the required files exist and no grade is public. Nothing more.

There is no lock-hash test: this repo is not pre-registered (PROPOSAL.md)."""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEED = ["README.md", "PROPOSAL.md", "REPORT.md", "CHANGELOG.md", "CITATION.cff", "SECURITY.md", "LICENSE",
        "reproduce.sh", "docs/decisions/0001-synthetic-data-only.md", "docs/decisions/0002-keep-stage-folders.md",
        "level-1-learn/README.md", "level-2-build/README.md", "level-3-deep/README.md",
        "level-1-learn/results_learn.json", "level-2-build/results_build.json", "level-2-build/results_dose.json",
        "level-3-deep/results_deep.json", "level-3-deep/results_sweep.json", "level-3-deep/rules.json"]
# A public grade looks like "8,700 of 10,000", "x/10000", "Grade:" or a "## Grade" section.
GRADE = re.compile(r"of 10,000|/ ?10,?000\b|\bGrade:|^## Grade", re.M)
SKIP_DIRS = {".git", "node_modules", "dist"}


def public_text_files():
    for d, dirs, files in os.walk(ROOT):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
        for f in files:
            if f.endswith((".md", ".jsx", ".js", ".html", ".cff")):
                yield os.path.join(d, f)


def test_required_files_exist():
    missing = [p for p in NEED if not os.path.exists(os.path.join(ROOT, p))]
    assert not missing, "missing files: " + ", ".join(missing)


def test_no_public_grade():
    hits = [os.path.relpath(p, ROOT) for p in public_text_files() if GRADE.search(open(p, encoding="utf-8").read())]
    assert not hits, "grades are internal; found in: " + ", ".join(hits)


def test_grade_pattern_catches_a_grade():
    assert GRADE.search("Grade: 8,700 of 10,000") and GRADE.search("## Grade\n") and GRADE.search("9 / 10000")
    assert not GRADE.search("80 of 80 correct, 10 seeds")


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for fn in fns:
        fn()
        print("PASS", fn.__name__)
    print(len(fns), "layout tests passed")
