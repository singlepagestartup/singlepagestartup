#!/usr/bin/env python3
"""Extract normative sentences with section attribution.

Usage: extract-rules-v2.py <repository-root> <output-json>
Each row: id, file, section, line, sentence, kind, duplicate_of?, near_duplicate_of?.
CLAUDE.md and AGENTS.md contribute only their pre-development section.
"""
import json
import pathlib
import re
import sys
from collections import Counter

ROOT = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(sys.argv[2])

CORPUS = [
    ".agents/workflows/pre-development.md",
    ".agents/contracts/artifact-lifecycle.md",
    ".agents/contracts/context-loading.md",
    ".agents/contracts/document-confirmation.md",
    ".agents/contracts/document-readability.md",
    ".agents/contracts/editorial-pass.md",
    ".agents/contracts/evidence.md",
    ".agents/contracts/github-reconciliation.md",
    ".agents/contracts/pipeline-reconciliation.md",
    ".agents/contracts/product-models.md",
    ".agents/contracts/research-sales-audit.md",
    ".agents/contracts/tool-use.md",
    ".agents/roles/account-manager.md",
    ".agents/roles/business-analyst.md",
    ".agents/roles/market-researcher.md",
    ".agents/roles/strategist.md",
    ".agents/roles/communication-strategist.md",
    ".agents/roles/brand-designer.md",
    ".agents/roles/web-designer.md",
    ".agents/templates/README.md",
    ".agents/templates/brief.md",
    ".agents/templates/strategy.md",
    ".agents/templates/brand.md",
    ".agents/templates/design.md",
    ".agents/templates/product.md",
    ".agents/templates/product-model.md",
    ".agents/templates/product-research.md",
    ".agents/templates/product-research-segment.md",
    ".agents/templates/product-research-competitors.md",
    ".agents/templates/product-analytics.md",
    ".agents/templates/website.md",
    ".agents/templates/creative.md",
    ".agents/templates/products.yaml",
    ".agents/templates/sales-process.yaml",
    ".agents/templates/asset-index.yaml",
    ".agents/README.md",
    "apps/studio/workspace/README.md",
    "apps/studio/workspace/products/README.md",
    "apps/studio/README.md",
    "CLAUDE.md",
    "AGENTS.md",
    ".claude/commands/singlepagestartup.md",
    ".codex/skills/singlepagestartup/SKILL.md",
]

# Only the shared pre-development section of the two entry files is in scope.
SECTION_LIMITS = {
    "CLAUDE.md": ("### Pre-development workflow", "### Downstream adaptation command"),
    "AGENTS.md": ("### Pre-development workflow", "### GitHub Project is the control plane"),
}

NORMATIVE = re.compile(
    r"\b(must|never|do not|don't|only|always|require[sd]?|cannot|before|after|keep|record|"
    r"no |not |each|every|exactly|prefer|should|may not|is not|are not|belongs?|owns?|stays?|"
    r"remains?|treat|apply|use |follow|return|report|ask|stop|block|route|persist|load|write|"
    r"read|inspect|verify|validate|confirm|preserve|remove|delete|replace|regenerate|resolve|"
    r"classify|declare|register)\b",
    re.I,
)


def limited(rel: str, raw: str) -> str:
    if rel not in SECTION_LIMITS:
        return raw
    start, end = SECTION_LIMITS[rel]
    lines = raw.split("\n")
    keep, inside = [], False
    for line in lines:
        if line.startswith(start):
            inside = True
        elif line.startswith(end):
            inside = False
        keep.append(line if inside else "")
    return "\n".join(keep)


def strip_markup(text: str) -> str:
    text = re.sub(r"```[\s\S]*?```", lambda m: "\n" * m.group(0).count("\n"), text)
    text = re.sub(r"^\s*\|.*\|\s*$", " ", text, flags=re.M)
    text = re.sub(r"\A---[\s\S]*?^---[ \t]*$", lambda m: "\n" * m.group(0).count("\n"), text, flags=re.M)
    return text


def sentences_with_lines(rel: str, path: pathlib.Path):
    raw = limited(rel, path.read_text(encoding="utf-8"))
    is_yaml = path.suffix in (".yaml", ".yml")
    lines = raw.split("\n")
    if is_yaml:
        body_lines = []
        for i, line in enumerate(lines, 1):
            m = re.match(r"^\s*#\s?(.*)$", line)
            body_lines.append((i, m.group(1) if m else ""))
    else:
        cleaned = strip_markup(raw)
        body_lines = list(enumerate(cleaned.split("\n"), 1))
    section = "(top)"
    paragraphs, current, start_line = [], [], None
    for i, line in body_lines:
        stripped = line.strip()
        heading = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if heading or stripped == "":
            if current:
                paragraphs.append((section, start_line, " ".join(current)))
                current, start_line = [], None
            if heading:
                section = heading.group(2).strip()
            continue
        stripped = re.sub(r"^(\s*[-*]\s+|\s*\d+\.\s+)", "", stripped)
        stripped = re.sub(r"<!--|-->", "", stripped)
        if not current:
            start_line = i
        current.append(stripped)
    if current:
        paragraphs.append((section, start_line, " ".join(current)))
    for sec, start, para in paragraphs:
        for s in re.split(r"(?<=[.!?])\s+(?=[A-Z`“*\[])", para):
            s = s.strip()
            if len(s) < 25:
                continue
            yield sec, start, s


def bucket(s: str) -> str:
    l = s.lower()
    if re.search(r"\b(retir|legacy|migrat|former|older checkout|st-ev|sp-ev|decision-profile|evidence register)", l):
        return "migration"
    if re.search(
        r"\b(second-level|h2|heading|schema|frontmatter|key[s]? |file[s]? (must )?exist|must (use|declare|contain)|"
        r"canonical (sections|h2)|required (sections|structure)|unique|kebab-case|fingerprint|content_sha256|"
        r"review\.dependencies|declared files|catalog|extends|strategy: |index|validat)",
        l,
    ):
        return "gate-candidate"
    if re.search(r"\b(persist|cursor|active_stage|active_artifacts|handoff|invocation|preflight|stage|owner[s]?:|launch)\b", l):
        return "workflow"
    if re.search(r"\b(word[s]?|1,400|five-to-seven|reviewable page|readab)", l):
        return "readability"
    if re.search(r"\b(inherit|singlepage|startup|layer|default projection|downstream|pass-through|passes through)", l):
        return "inheritance"
    if re.search(r"\b(confirm|approval|approve|stale|unconfirmed|changed)\b", l):
        return "confirmation"
    if re.search(r"\b(evidence|source|finding|claim|research|assumption|operator-fact|verified-fact|client-claim)", l):
        return "evidence"
    if re.search(r"\b(do not|never|must not|cannot|don't)\b", l):
        return "prohibition"
    return "method"


def norm(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[`*_\"“”'’(),;:]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


rows = []
for rel in CORPUS:
    path = ROOT / rel
    if not path.exists():
        continue
    for section, line, s in sentences_with_lines(rel, path):
        if not NORMATIVE.search(s):
            continue
        rows.append({"file": rel, "section": section, "line": line, "sentence": s, "kind": bucket(s), "norm": norm(s)})

seen = {}
for r in rows:
    key = r["norm"]
    if key in seen:
        r["duplicate_of"] = seen[key]
    else:
        seen[key] = f"{r['file']}:{r['line']}"


def shingles(s):
    w = s.split()
    return {" ".join(w[i : i + 4]) for i in range(max(0, len(w) - 3))}


sh = [shingles(r["norm"]) for r in rows]
for i, r in enumerate(rows):
    if "duplicate_of" in r or len(sh[i]) < 4:
        continue
    for j in range(i):
        if "duplicate_of" in rows[j] or len(sh[j]) < 4:
            continue
        inter = len(sh[i] & sh[j])
        if inter and inter / len(sh[i] | sh[j]) >= 0.5:
            r["near_duplicate_of"] = f"{rows[j]['file']}:{rows[j]['line']}"
            break

for n, r in enumerate(rows, 1):
    r["id"] = f"R{n:04d}"
    r.pop("norm")
OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"rows={len(rows)} files={len({r['file'] for r in rows})} sections={len({(r['file'], r['section']) for r in rows})}")
print("by kind:", dict(Counter(r["kind"] for r in rows)))
print("exact duplicates:", sum(1 for r in rows if "duplicate_of" in r), " near duplicates:", sum(1 for r in rows if "near_duplicate_of" in r))
print("by file:", Counter(r["file"] for r in rows).most_common(45))
