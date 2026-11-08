# 0002: Keep the stage folders instead of src/, experiments/ and results/

Date: 2026-11-08. Status: accepted. Decided by: Jesun Ahmad Ushno.

## Context

The portfolio standard v2 lays out src/, experiments/ and results/. In
this repo each stage folder (level-1-learn, level-2-build, level-3-deep)
holds its code, the generated data and the scored results together. The
tests, the runners, CI and the dashboard (site/src/App.jsx,
site/src/pipeline.check.mjs) read those paths directly, and the fan-out
drafts cite them.

## Decision

Keep the three folders and their file names. The README layout table
maps each to its role. The method allows domain-named code folders when
they are listed.

## Consequences

No path breaks and no committed result moves, so the byte-for-byte
reproduce check keeps its history. The folder names still carry the old
Learn / Build / Deep words; the README calls them baseline, build and
deep.
