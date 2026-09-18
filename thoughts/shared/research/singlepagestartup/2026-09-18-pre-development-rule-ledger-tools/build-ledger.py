#!/usr/bin/env python3
"""Build the phase-1 rule ledger (Markdown + CSV) from extracted rules.

Usage: build-ledger.py <rules-json> <out-md> <out-tsv> <golden-file>
"""
import csv
import json
import sys
from collections import Counter, OrderedDict

rules_path, out_md, out_csv, golden_path = sys.argv[1:5]
rows = json.load(open(rules_path, encoding="utf-8"))

# disposition vocabulary:
#   gate          executable check in the future pipeline definition
#   workflow      stays in the compact workflow (orchestration only)
#   role:<id>     professional method, lives in one role file
#   contract:<id> cross-role rule, lives in one contract (evidence, confirmation, inheritance, editorial, tool-use, github)
#   template      structural instruction that stays in the artifact template
#   migration     one-time retirement or migration procedure -> .agents/migrations/, loaded on detection
#   operator-doc  operator or developer documentation (README), not an agent rule
#   duplicate     restates a rule owned elsewhere; removed in phase 2
#   obsolete      no longer applicable
#   split         section mixes several of the above; the note names the parts

SECTION_MAP = {
    ".agents/workflows/pre-development.md": {
        "_default": ("workflow", "workflow", ""),
        "Entry": ("split", "workflow + contract:inheritance", "layer resolution stays in workflow; write-only-to-active-layer rule belongs to the inheritance contract"),
        "GitHub change preflight": ("split", "workflow + duplicate", "keep the command and fail-closed rule; the rest restates github-reconciliation.md"),
        "Quality and interaction rules": ("split", "workflow + contract:evidence + duplicate", "unknown classification duplicates evidence.md; readability duplicates document-readability.md; language and one-question rules stay in workflow"),
        "Durable state": ("split", "workflow + gate", "cursor schema, allowed stages and statuses become a pipeline gate; write-after-update stays in workflow"),
        "Pipeline compatibility reconciliation": ("gate", "gate", "becomes the check command; prose restates pipeline-reconciliation.md"),
        "Start or continue": ("workflow", "workflow", "the core loop; keep, shorten"),
        "Change an existing decision": ("split", "workflow + duplicate", "steps 3 and 5 restate document-confirmation.md and evidence.md asset cleanup"),
        "Domain adaptation and quality gate": ("split", "role:* + gate + duplicate", "generic professional checks belong to roles; approval reads become gates; question classification duplicates evidence.md"),
        "00 — Client Request": ("split", "gate + role:account-manager + role:business-analyst + duplicate", "state, owners, outputs and completion become pipeline entries; intake method belongs to the two roles; visual intake rules are restated in account-manager, brand-designer and the brief template"),
        "10 — Strategy": ("split", "gate + role:market-researcher + role:strategist + duplicate", "state, owners, five sections and confirmation become pipeline entries; target-state rules duplicate strategist.md and pipeline-reconciliation.md"),
        "20 — Brand": ("split", "gate + role:communication-strategist + role:brand-designer", "state, five sections and confirmation become pipeline entries; the rest is role method"),
        "30 — Design": ("split", "gate + role:brand-designer + contract:inheritance + operator-doc + duplicate", "gates: five categories ready, profile confirmed, three examples per media family, typography rows with registered fonts, proposal_id and asset tree reconciled; 131 sentences of method duplicate brand-designer.md and the design template; Studio layout mechanics belong to the workspace README"),
        "40 — Products": ("split", "gate + role:* + contract:inheritance + duplicate", "catalog, product, analytics, sales and research structure are already validator gates; product method belongs to the owning roles; atomic catalog rule duplicates the inheritance contract; most sentences restate product-models.md"),
        "Ownership and concurrency": ("workflow", "workflow", "keep"),
        "Tool launch": ("split", "workflow + duplicate", "adapter loading stays; capability rules duplicate tool-use.md"),
        "Handoff": ("workflow", "workflow", "keep as the single handoff contract"),
        "Final editorial pass": ("duplicate", "contract:editorial", "boilerplate section repeated in every file"),
    },
    ".agents/contracts/artifact-lifecycle.md": {
        "_default": ("split", "contract:inheritance + contract:confirmation + contract:evidence + workflow + duplicate", "retire the file: inheritance rules move to the inheritance contract, asset lifecycle to evidence.md, approval rules duplicate document-confirmation.md, quality-over-length and one-decision-per-topic become workflow principles"),
    },
    ".agents/contracts/context-loading.md": {
        "_default": ("contract:inheritance", "contract:inheritance", ""),
        "Resolution": ("split", "contract:inheritance + gate", "layer resolver and index registry rules; index validation already executes in the loader"),
        "Project artifact resolution": ("contract:inheritance", "contract:inheritance", "merge strategies and write-only-active-layer rule"),
        "Shared agent resources": ("contract:inheritance", "contract:inheritance", "imports and exports"),
        "Decision-scoped context": ("workflow", "workflow", "loading rule for one invocation"),
        "Presentation content contract": ("split", "gate + operator-doc", "YAML schema is already validated; renderer contract is developer documentation"),
        "Design layout context": ("split", "contract:inheritance + operator-doc", "layout inheritance rule; schema details belong to the workspace README"),
    },
    ".agents/contracts/document-confirmation.md": {
        "_default": ("contract:confirmation", "contract:confirmation", "keep, trim"),
        "Document confirmation": ("split", "contract:confirmation + gate", "fingerprint validity is already executable"),
        "Status and upstream review": ("split", "contract:confirmation + gate", "four states are executable; impact-review transitions stay as contract"),
        "Layer resolution": ("contract:confirmation", "contract:confirmation", "confirmation across layers; keep here rather than in the inheritance contract"),
        "Stage gates and GitHub baseline": ("split", "gate + contract:github", "approval gates become pipeline entries; baseline detection belongs to github-reconciliation.md"),
    },
    ".agents/contracts/document-readability.md": {
        "_default": ("split", "workflow + duplicate", "one paragraph of workflow principle; the file is retired and its 31 restatements elsewhere are removed"),
    },
    ".agents/contracts/editorial-pass.md": {
        "_default": ("contract:editorial", "contract:editorial", "keep as is"),
    },
    ".agents/contracts/evidence.md": {
        "_default": ("contract:evidence", "contract:evidence", "keep, trim role duplicates"),
        "Assets": ("split", "contract:evidence + gate", "registry field rules and generated-asset tree reconciliation are gate candidates"),
    },
    ".agents/contracts/github-reconciliation.md": {
        "_default": ("contract:github", "contract:github", "keep, trim"),
    },
    ".agents/contracts/pipeline-reconciliation.md": {
        "_default": ("gate", "gate", ""),
        "Purpose": ("split", "gate + workflow", "the check command replaces the prose; the no-stored-version principle stays as one sentence"),
        "Retiring the former Decision Profile": ("migration", "migration", "dated procedure, loaded when knowledge/decision-profile is detected"),
        "Retiring standalone Business": ("migration", "migration", "dated procedure, loaded when a Business source or v1 catalog is detected"),
        "Compact Brief migration": ("migration", "migration", "dated procedure, loaded when legacy Brief headings are detected"),
        "Compact Strategy migration": ("migration", "migration", "dated procedure, loaded when legacy Strategy sections or anchors are detected"),
        "Strategy consistency across projects": ("split", "contract:inheritance + gate + role:strategist", "downstream authoring rule; five sections are a gate; target-state judgment belongs to the strategist"),
        "Business-plan product consistency across projects": ("split", "role:* + gate + migration", "business-plan framing belongs to roles; analytics and readiness are gates; the Evidence-and-decision-rules replacement is a migration step"),
        "Compact Brand migration": ("migration", "migration", "dated procedure"),
        "Inspection scope": ("gate", "gate", "this section is the specification of the check command"),
        "Layer and inheritance rules": ("contract:inheritance", "contract:inheritance", ""),
        "Gap classification and repair": ("split", "workflow + gate", "classification and cursor movement stay in workflow; structural gaps come from the check output"),
        "Handoff": ("workflow", "workflow", "merge into the single handoff contract"),
        "Preserve product identity during structural migrations": ("split", "gate + migration", "catalog-versus-Brief inventory match is a gate; Portfolio and presentation migration steps are migrations"),
        "Sales segment compatibility": ("split", "gate + migration", "segment coverage is already a validator gate; v1-to-v2 transfer is a migration"),
        "Material workspace compatibility": ("migration", "migration", "one-time material workspace adoption"),
    },
    ".agents/contracts/product-models.md": {
        "_default": ("split", "role:business-analyst + gate + operator-doc", ""),
        "Model and layer boundary": ("split", "gate + contract:inheritance", "catalog v2 schema and acyclic uses are already validated; atomic replacement belongs to the inheritance contract"),
        "Whole-page ownership": ("split", "gate + template", "canonical H2 sets are gates; the ownership table belongs to the templates README"),
        "Work order and evidence": ("split", "workflow + role:business-analyst", ""),
        "Business planning before engineering": ("role:*", "role:strategist + role:business-analyst + role:web-designer + role:brand-designer", "one shared paragraph per role instead of a contract"),
        "Segmented Sales workspace": ("split", "gate + role:business-analyst + operator-doc", "segment ID coverage is validated; CJM method belongs to the business analyst; Studio rendering belongs to the workspace README"),
        "Dependencies": ("gate", "gate", "review edges are implemented in review.ts; document them once beside the pipeline definition"),
        "Material workspaces": ("operator-doc", "operator-doc", "Studio navigation and export behavior"),
        "Language and vocabulary": ("split", "template + operator-doc", "localization rule belongs to the website and creative templates"),
    },
    ".agents/contracts/research-sales-audit.md": {
        "_default": ("split", "gate + role:market-researcher", ""),
        "Research of Sales segments and alternatives": ("role:market-researcher", "role:market-researcher", ""),
        "Workspace and coverage": ("gate", "gate", "sales_audit, sales_segment and sales_dimensions are already validated"),
        "Investigation and resulting reference": ("role:market-researcher", "role:market-researcher", ""),
        "Review dependencies without an approval cycle": ("gate", "gate", "observes edges are implemented"),
    },
    ".agents/contracts/tool-use.md": {
        "_default": ("contract:tool-use", "contract:tool-use", "keep"),
    },
    ".agents/README.md": {
        "_default": ("operator-doc", "operator-doc", "directory index"),
        "Loading rule": ("duplicate", "workflow", "restates the workflow entry and inheritance contract"),
        "Pre-development workspace projections": ("duplicate", "contract:inheritance", "restates the three projections"),
    },
    ".agents/templates/README.md": {
        "_default": ("template", "template", ""),
        "Sequence": ("split", "gate + duplicate", "the owner and output table is the stage machine; the surrounding rules restate the workflow"),
    },
    "apps/studio/workspace/README.md": {
        "_default": ("operator-doc", "operator-doc", "operator and developer documentation"),
        "00 Client Request": ("duplicate", "workflow", "restates the stage definition"),
        "10 Strategy": ("duplicate", "workflow", "restates the stage definition"),
        "20 Brand": ("duplicate", "workflow", "restates the stage definition"),
        "30 Design": ("duplicate", "workflow", "restates the stage definition"),
        "40 Products": ("duplicate", "workflow", "restates the stage definition"),
        "Working with agents": ("split", "operator-doc + duplicate", "keep the operator view; remove the restated pipeline mechanics"),
        "Source ownership and semantic review": ("duplicate", "contract:confirmation", ""),
        "Sales customer segments and CJM": ("split", "operator-doc + duplicate", "keep the review description; schema rules restate product-models.md"),
        "Research audits of Sales segments": ("duplicate", "contract:evidence", ""),
        "Document review status": ("operator-doc", "operator-doc", "keep the badge table"),
    },
    "apps/studio/workspace/products/README.md": {
        "_default": ("operator-doc", "operator-doc", ""),
    },
    "apps/studio/README.md": {
        "_default": ("operator-doc", "operator-doc", "developer documentation"),
        "Document confirmation": ("duplicate", "contract:confirmation", "reduce to a pointer"),
        "Workspace presentation": ("split", "operator-doc + duplicate", "keep the Storybook description; remove restated inheritance rules"),
    },
    "CLAUDE.md": {
        "_default": ("duplicate", "workflow", "replace the pre-development summary with a short pointer"),
    },
    "AGENTS.md": {
        "_default": ("duplicate", "workflow", "identical to CLAUDE.md; replace with the same pointer"),
    },
    ".claude/commands/singlepagestartup.md": {
        "_default": ("workflow", "workflow", "adapter; keep, point at the check command"),
    },
    ".codex/skills/singlepagestartup/SKILL.md": {
        "_default": ("workflow", "workflow", "adapter; keep, point at the check command"),
        "Final editorial pass": ("duplicate", "contract:editorial", ""),
    },
}

ROLE_DEFAULT = {
    "_default": ("role", "role", "professional method stays; remove workflow and structure restatements"),
    "Inputs and ownership": ("split", "role + duplicate", "which files the role reads restates the workflow stage; keep only the refusal conditions"),
    "Capabilities": ("gate", "gate", "capability IDs per owner belong to the pipeline definition"),
    "Handoff": ("split", "workflow + duplicate", "one handoff contract in the workflow; role-specific items stay as one line"),
    "Final editorial pass": ("duplicate", "contract:editorial", "boilerplate section repeated in every file"),
}
for role in ["account-manager", "business-analyst", "market-researcher", "strategist", "communication-strategist", "brand-designer", "web-designer"]:
    SECTION_MAP[f".agents/roles/{role}.md"] = {k: (v[0].replace("role", f"role:{role}") if v[0] == "role" else v[0], v[1].replace("role", f"role:{role}") if v[1] == "role" else v[1], v[2]) for k, v in ROLE_DEFAULT.items()}
SECTION_MAP[".agents/roles/account-manager.md"]["Required method"] = ("split", "role:account-manager + duplicate", "51 sentences; visual intake mechanics are restated in brand-designer.md, the brief template and the workflow 30-design section")
SECTION_MAP[".agents/roles/brand-designer.md"]["Required method"] = ("split", "role:brand-designer + duplicate", "90 sentences; media, typography and asset rules are restated in the workflow 30-design section and the design template")

TEMPLATE_DEFAULT = ("template", "template", "structure and comment instructions; trim comments that restate the owning role")
for t in ["brief", "strategy", "brand", "design", "product", "product-model", "product-research", "product-research-segment", "product-research-competitors", "product-analytics", "website", "creative", "products.yaml", "sales-process.yaml", "asset-index.yaml"]:
    key = f".agents/templates/{t}" if t.endswith(".yaml") else f".agents/templates/{t}.md"
    SECTION_MAP.setdefault(key, {"_default": TEMPLATE_DEFAULT})
SECTION_MAP[".agents/templates/design.md"]["Interface and product surfaces"] = ("split", "template + duplicate", "comment restates the brand-designer method")
SECTION_MAP[".agents/templates/design.md"]["Review and quality gate"] = ("split", "template + gate", "three-example and registry checks are gate candidates")
SECTION_MAP[".agents/templates/brief.md"]["Visual reference intake"] = ("split", "template + duplicate", "comment restates account-manager.md")

MIGRATION_SECTIONS = {
    ".agents/contracts/pipeline-reconciliation.md": {
        "Retiring the former Decision Profile", "Retiring standalone Business", "Compact Brief migration",
        "Compact Strategy migration", "Compact Brand migration", "Material workspace compatibility",
    }
}


def dispose(r):
    file_map = SECTION_MAP.get(r["file"], {"_default": ("pending", "pending", "")})
    d, target, note = file_map.get(r["section"], file_map["_default"])
    # sentence-level overrides, in priority order
    if "duplicate_of" in r:
        return "duplicate", r["duplicate_of"], "exact restatement"
    if r["section"] == "Final editorial pass":
        return "duplicate", "contract:editorial", "boilerplate section"
    if r["kind"] == "readability":
        return "duplicate", "workflow (one readability paragraph)", "restates the 1,400-word preference"
    if r["section"] in MIGRATION_SECTIONS.get(r["file"], set()):
        return "migration", "migration", note or "dated procedure"
    if d == "split":
        # Provisional sentence-level choice inside a mixed section, limited to
        # the targets the section declares. Phase 2 confirms or corrects it.
        targets = [t.strip() for t in target.split("+")]
        roles = [t for t in targets if t.startswith("role:")]
        kind = r["kind"]
        if kind == "gate-candidate" and "gate" in targets:
            return "gate", "gate", "provisional, from a mixed section"
        if kind == "inheritance" and "contract:inheritance" in targets:
            return "contract:inheritance", "contract:inheritance", "provisional, from a mixed section"
        if kind == "confirmation" and "contract:confirmation" in targets:
            return "contract:confirmation", "contract:confirmation", "provisional, from a mixed section"
        if kind == "evidence" and "contract:evidence" in targets:
            return "contract:evidence", "contract:evidence", "provisional, from a mixed section"
        if kind == "workflow" and "workflow" in targets:
            return "workflow", "workflow", "provisional, from a mixed section"
        if kind in ("method", "prohibition", "evidence", "confirmation", "inheritance") and roles:
            chosen = roles[0] if len(roles) == 1 else "role:*"
            return chosen, chosen, "provisional, from a mixed section"
        if "operator-doc" in targets and kind in ("method", "prohibition"):
            return "operator-doc", "operator-doc", "provisional, from a mixed section"
        if "duplicate" in targets and ("near_duplicate_of" in r):
            return "duplicate", r["near_duplicate_of"], "near restatement"
        return "split", target, note
    return d, target, note


for r in rows:
    r["disposition"], r["target"], r["note"] = dispose(r)

# ---------- CSV ----------
with open(out_csv, "w", newline="", encoding="utf-8") as fh:
    # Tab-separated: the repository ignores *.csv.
    w = csv.writer(fh, delimiter="\t", lineterminator="\n")
    w.writerow(["id", "file", "section", "line", "kind", "disposition", "target", "duplicate_of", "near_duplicate_of", "sentence"])
    for r in rows:
        w.writerow([r["id"], r["file"], r["section"], r["line"], r["kind"], r["disposition"], r["target"], r.get("duplicate_of", ""), r.get("near_duplicate_of", ""), r["sentence"]])

# ---------- Markdown ----------
by_file = OrderedDict()
for r in rows:
    by_file.setdefault(r["file"], OrderedDict()).setdefault(r["section"], []).append(r)
byref = {f"{r['file']}:{r['line']}": r for r in rows if "duplicate_of" not in r}
disp_counts = Counter(r["disposition"] for r in rows)
exact_groups = Counter(r["duplicate_of"] for r in rows if "duplicate_of" in r)

golden = open(golden_path, encoding="utf-8").read().strip().split("\n")
review_states = Counter(line.split()[2] for line in golden if line.startswith("singlepage/review "))

L = []
L.append("---\nrepository: singlepagestartup/singlepagestartup\ndate: 2026-09-18\nstatus: phase-1-inventory\n---\n")
L.append("# Pre-development rule ledger, phase 1\n")
L.append("Inventory of every normative sentence in the pre-development instruction corpus, with a provisional disposition per section. Nothing in the repository changes in this phase; the ledger is the checklist for the rewrite in phase 2, where every sentence must end in exactly one place or be removed with a recorded reason.\n")
L.append("## Method\n")
L.append("- A script splits each corpus file into sentences after removing frontmatter, tables and code blocks, keeps sentences that contain a normative marker, and attributes each one to its nearest heading. YAML templates contribute their comment lines. `CLAUDE.md` and `AGENTS.md` contribute only their pre-development section.\n- Exact duplicates are detected on normalized text; near duplicates by word-shingle overlap.\n- Dispositions are assigned per section, then overridden per sentence for exact duplicates, the readability restatements, the repeated editorial-pass boilerplate and the migration procedures.\n- The extractor and the ledger generator are stored beside this file under `2026-09-18-pre-development-rule-ledger-tools/`; the tab-separated `2026-09-18-pre-development-rule-ledger.tsv` beside this file is the machine-readable ledger with one row per sentence. Rerunning both against a checkout reproduces the tables.\n")
L.append("## Corpus and counts\n")
L.append(f"- Files: {len(by_file)}. Sections: {sum(len(s) for s in by_file.values())}. Normative sentences: {len(rows)}.\n- Exact duplicates: {sum(1 for r in rows if 'duplicate_of' in r)} sentences in {len(exact_groups)} groups. Near duplicates: {sum(1 for r in rows if 'near_duplicate_of' in r)}.\n")
L.append("| Disposition | Sentences |\n| --- | --- |")
for d, n in disp_counts.most_common():
    L.append(f"| `{d}` | {n} |")
L.append("")
L.append("| File | Sentences | Exact duplicates |\n| --- | --- | --- |")
for f, sections in by_file.items():
    n = sum(len(v) for v in sections.values())
    d = sum(1 for v in sections.values() for r in v if "duplicate_of" in r)
    L.append(f"| `{f}` | {n} | {d} |")
L.append("")
L.append("## Disposition vocabulary\n")
L.append("| Disposition | Meaning in phase 2 |\n| --- | --- |\n| `gate` | Executable check in the pipeline definition and check command |\n| `workflow` | Stays in the compact orchestration workflow |\n| `role:<id>` | Professional method, lives in that one role file |\n| `contract:<id>` | Cross-role rule in one contract: evidence, confirmation, inheritance, editorial, tool-use, github |\n| `template` | Structural instruction that stays with the artifact template |\n| `migration` | One-time retirement or migration procedure, moved to `.agents/migrations/` and loaded only on detection |\n| `operator-doc` | Operator or developer documentation, not an agent rule |\n| `duplicate` | Restates a rule owned elsewhere; removed |\n| `split` | The section mixes several of the above; the note names the parts |\n")
L.append("## Section map\n")
L.append("The review unit. Each row is one section of one file with its sentence count, how many are exact duplicates, the provisional disposition and where the surviving rules go.\n")
for f, sections in by_file.items():
    L.append(f"### `{f}`\n")
    L.append("| Section | Sentences | Dup | Disposition | Target | Note |\n| --- | --- | --- | --- | --- | --- |")
    for section, items in sections.items():
        d = sum(1 for r in items if "duplicate_of" in r)
        file_map = SECTION_MAP.get(f, {"_default": ("pending", "pending", "")})
        disp, target, note = file_map.get(section, file_map["_default"])
        L.append(f"| {section} | {len(items)} | {d} | `{disp}` | {target} | {note} |")
    L.append("")
L.append("## Exact duplicate groups\n")
L.append("Sentences repeated verbatim in two or more places. The first occurrence is the reference; phase 2 keeps one owner.\n")
L.append("| Copies | Reference | Sentence |\n| --- | --- | --- |")
for canon, n in exact_groups.most_common():
    ref = byref.get(canon)
    if not ref:
        continue
    s = ref["sentence"].replace("|", "\\|")
    L.append(f"| {n + 1} | `{canon}` | {s[:140]} |")
L.append("")
L.append("## Readability restatements\n")
read_rows = [r for r in rows if r["kind"] == "readability"]
L.append(f"{len(read_rows)} sentences restate the five-to-seven-minute or about-1,400-words preference across {len({r['file'] for r in read_rows})} files. Phase 2 keeps one paragraph in the workflow and removes the rest.\n")
L.append("| Where | Sentence |\n| --- | --- |")
for r in read_rows:
    L.append(f"| `{r['file']}:{r['line']}` | {r['sentence'].replace('|', '\\|')[:140]} |")
L.append("")
L.append("## Migration and retirement procedures\n")
mig_rows = [r for r in rows if r["disposition"] == "migration"]
L.append(f"{len(mig_rows)} sentences describe one-time procedures for shapes that a synchronized checkout may still carry: Decision Profile, standalone Business, the Evidence register, compact Brief, Strategy and Brand, Sales v1 and the material workspace. Phase 2 moves each procedure to a dated file under `.agents/migrations/` and the check command loads it only when the legacy shape is detected. These are the candidates for the owner's obsolete review: a procedure whose legacy shape no longer exists in any live project can be dropped instead of moved.\n")
L.append("| Where | Section | Sentence |\n| --- | --- | --- |")
for r in mig_rows:
    L.append(f"| `{r['file'].split('/')[-1]}:{r['line']}` | {r['section']} | {r['sentence'].replace('|', '\\|')[:120]} |")
L.append("")
L.append("## Goldens\n")
L.append("Recorded on the phase-1 branch before any change, from the worktree `claude/agents-pipeline-compaction` at the merge of PR #242.\n")
L.append("- `npm run studio:validate`: 171 tests across 20 files pass; both workspace layers valid with self-check; editorial-pass and GitHub reconciliation tests pass.\n- Resolved workspace snapshot: 182 entries covering both layers, both projections and every review document, stored beside this file as `2026-09-18-pre-development-goldens.txt`. Each line is layer/projection, entry ID, resolution, review state and a 16-character content hash; it is reproduced by loading the workspace with the shared loader and review resolver, so phase 2 can diff against it after every rule move.\n")
L.append("| Review state (singlepage layer) | Documents |\n| --- | --- |")
for state, n in review_states.most_common():
    L.append(f"| `{state}` | {n} |")
L.append("")
L.append("Only Brief and the shared model are `confirmed`. Strategy, Brand and Design carry confirmation records whose fingerprints no longer match their bodies, and their staleness cascades through every product document. Phase 2 gates must reproduce exactly this picture on the same tree before any rule moves.\n")
L.append("Downstream fixtures: the empty startup layer of this repository is the empty fixture and is covered by the snapshot above. A populated downstream fixture with all six shared documents does not exist yet; the validator self-check only covers synthetic merge cases. Phase 2 adds one under `tools/studio/workspace/fixtures/` before the check command is written.\n")
L.append("## Decisions needed before phase 2\n")
L.append("1. First cycle of the check command in report-only mode or enforcing from day one. Recommendation: report-only.\n2. Retired contracts removed without pointer stubs, or five-line pointers kept for one release. Recommendation: remove.\n3. Which downstream projects are live, and whether one workspace can be copied for a dry run.\n4. Confirm the `.agents/migrations/` folder with dated procedures loaded on detection, replacing migration prose in permanent contracts.\n5. Any migration procedure above whose legacy shape no longer exists in a live project can be dropped rather than moved; name them if known.\n")

open(out_md, "w", encoding="utf-8").write("\n".join(L) + "\n")
print(f"ledger: {len(rows)} rows, dispositions: {dict(disp_counts)}")
print(f"md bytes: {len('\n'.join(L))}")
