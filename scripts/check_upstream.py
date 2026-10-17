#!/usr/bin/env python3
"""Check whether the open Unicode fonts in fonts/unicode/ match their latest upstream release.

Usage: python3 scripts/check_upstream.py [--report report.md]

For SMC, Rachana Institute (RIT) and Google Fonts families it downloads the latest upstream files
and compares them byte for byte with ours, so fixes that keep the same version number are caught
too. Noto is checked by release tag. Nothing downloaded is executed or unpacked to disk.
Exits 0 either way; the report lists what is out of date.
"""

import hashlib
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UNICODE = ROOT / "fonts" / "unicode"
FONT_RE = re.compile(r"\.(ttf|otf)$", re.I)
MAX_BYTES = 80_000_000


def fetch(url, accept=None):
    headers = {"User-Agent": "kalkandam-upstream-check"}
    if accept:
        headers["Accept"] = accept
    token = os.environ.get("GITHUB_TOKEN")
    if token and urllib.parse.urlparse(url).hostname == "api.github.com":
        headers["Authorization"] = f"Bearer {token}"
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=120) as res:
        data = res.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError(f"{url} is larger than {MAX_BYTES} bytes")
    return data


def sha(data):
    return hashlib.sha256(data).hexdigest()


def zip_font_hashes(data):
    z = zipfile.ZipFile(io.BytesIO(data))
    return {sha(z.read(i)) for i in z.infolist() if FONT_RE.search(i.filename) and i.file_size < MAX_BYTES}


def read_sources():
    rows = []
    for line in (UNICODE / "SOURCES.md").read_text(encoding="utf-8").splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 6 or not cells[1].startswith("`"):
            continue
        url = re.search(r"https?://[^\s);,]+", cells[5])
        rows.append({"family": cells[0], "folder": cells[1].strip("`/"), "source": url.group(0) if url else ""})
    return rows


def local_hashes(folder):
    return {p.name: sha(p.read_bytes()) for p in sorted((UNICODE / folder).iterdir()) if FONT_RE.search(p.name)}


def upstream(row):
    """Return (kind, value, note): ("hashes", set, release) or ("tag", latest, current)."""
    src = row["source"]
    if "smc.org.in/downloads/" in src:
        return "hashes", zip_font_hashes(fetch(src)), "smc.org.in"
    m = re.match(r"https://gitlab\.com/rit-fonts/([^/]+)/", src)
    if m:
        project = urllib.parse.quote(f"rit-fonts/{m.group(1)}", safe="")
        tag = json.loads(fetch(f"https://gitlab.com/api/v4/projects/{project}/releases/permalink/latest"))["tag_name"]
        data = fetch(f"https://gitlab.com/rit-fonts/{m.group(1)}/-/jobs/artifacts/{urllib.parse.quote(tag)}/download?job=build-tag")
        return "hashes", zip_font_hashes(data), f"release {tag}"
    m = re.match(r"https://github\.com/google/fonts/tree/main/(.+?)/?$", src)
    if m:
        listing = json.loads(fetch(f"https://api.github.com/repos/google/fonts/contents/{m.group(1)}", "application/vnd.github+json"))
        return "hashes", {sha(fetch(f["download_url"])) for f in listing if FONT_RE.search(f["name"])}, "google/fonts"
    m = re.match(r"https://github\.com/notofonts/malayalam/releases/tag/(Noto\w+?)-v([\d.]+)", src)
    if m:
        prefix, current = m.groups()
        releases = json.loads(fetch("https://api.github.com/repos/notofonts/malayalam/releases?per_page=50", "application/vnd.github+json"))
        versions = [r["tag_name"].split("-v", 1)[1] for r in releases if r["tag_name"].startswith(f"{prefix}-v")]
        latest = max(versions, key=lambda v: [int(x) for x in v.split(".")], default=current)
        return "tag", latest, current
    return None


def main():
    report_path = sys.argv[sys.argv.index("--report") + 1] if "--report" in sys.argv else None
    stale, errors, checked, skipped = [], [], 0, []
    cache = {}
    for row in read_sources():
        try:
            key = row["source"]
            if key not in cache:
                cache[key] = upstream(row)
            result = cache[key]
        except Exception as exc:
            errors.append((row["family"], f"{type(exc).__name__}: {exc}"))
            continue
        if result is None:
            skipped.append(row["family"])
            continue
        checked += 1
        kind, value, note = result
        if kind == "hashes":
            ours = local_hashes(row["folder"])
            changed = [name for name, h in ours.items() if h not in value]
            if changed:
                stale.append((row["family"], row["folder"], f"{len(changed)} of {len(ours)} files differ from {note}"))
        elif value != note:
            stale.append((row["family"], row["folder"], f"upstream v{value}, ours v{note}"))
        print(f"{'STALE' if stale and stale[-1][0] == row['family'] else 'ok   '} {row['family']}")

    lines = [f"Checked {checked} font families against their upstream releases."]
    if stale:
        lines += ["", "**Out of date**", "", "| Family | Folder | What changed |", "| --- | --- | --- |"]
        lines += [f"| {f} | `fonts/unicode/{d}/` | {w} |" for f, d, w in stale]
        lines += ["", "Refresh the files from upstream, update the row in `fonts/unicode/SOURCES.md`, run `npm run build:fonts`, and bump `FONT_VERSION`."]
    else:
        lines += ["", "Everything matches upstream."]
    if errors:
        lines += ["", "**Could not check**", ""] + [f"- {f}: {e}" for f, e in errors]
    if skipped:
        lines += ["", f"Not checked (no known upstream): {', '.join(skipped)}"]
    report = "\n".join(lines) + "\n"
    print("\n" + report)
    if report_path:
        Path(report_path).write_text(report, encoding="utf-8")
        Path(report_path + ".stale").write_text(str(len(stale)), encoding="utf-8")


if __name__ == "__main__":
    main()
