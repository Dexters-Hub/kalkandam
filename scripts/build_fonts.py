#!/usr/bin/env python3

import json
import re
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "fonts"
WEB = FONTS / "web"
OUT = ROOT / "data" / "fonts.json"

COLLECTIONS = {
    "unicode": ("Unicode", "unicode"),
    "mlu": ("MLU", "unicode"),
    "fml-fonts": ("FML", "fml"),
    "ml-tt": ("ML-TT", "ml"),
    "ml-kv": ("ML-KV", "kv"),
}

STYLE_WORDS = re.compile(
    r"[\s_-]*(Bold Italic|BoldItalic|Bold|Italic|Regular|Normal|Book|Black|Heavy|Light|Medium|"
    r"Semi-?condensed|Condensed|Demi-?bold|Semi-?Bold|Extra-?Bold|Ultra-?Black|Ultra-?light|Ultra|Thin)\b",
    re.I,
)


def name(font, *ids):
    for i in ids:
        value = font["name"].getDebugName(i)
        if value:
            return value.strip()
    return ""


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def has_malayalam(font):
    cmap = font.getBestCmap() or {}
    return any(0x0D00 <= cp <= 0x0D7F for cp in cmap)


def clean_family(family, collection):
    family = family.replace("_", " ")
    if collection in ("FML", "ML-TT"):
        family = re.sub(r"^F?MLW?-?(TT)?-?", "", family)
    elif collection == "MLU":
        family = re.sub(r"^MLU-?\s*", "", family)
    elif collection == "ML-KV":
        family = re.sub(r"^ML-KV-", "", family)
        family = re.sub(r"-[A-Za-z0-9]+$", "", family) or family
        family = re.sub(r"\d+$", "", family)
    family = STYLE_WORDS.sub("", family).strip(" -")
    return FAMILY_ALIASES.get(family, family) or "Untitled"


FAMILY_ALIASES = {
    "Ayish": "Ayisha", "NaseemaB": "Naseema", "ShajilH": "Shajil", "Shajl": "Shajil",
    "JayashreeEB": "Jayashree", "AshtamudiEx": "Ashtamudi", "MadhaviEx": "Madhavi",
    "MangalaEx": "Mangala", "NarmadaEx": "Narmada",
}


def read_sources():
    sources = {}
    path = FONTS / "unicode" / "SOURCES.md"
    if not path.exists():
        return sources
    for line in path.read_text(encoding="utf-8").splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 5 or not cells[1].startswith("`"):
            continue
        folder = cells[1].strip("`/")
        spdx = re.search(r"`([^`]+)`", cells[3])
        sources[folder] = {
            "family": cells[0],
            "license": spdx.group(1) if spdx else cells[3],
            "designer": cells[4].split(" / ")[0],
        }
    return sources


def make_web_copy(src, dest, encoding):
    font = TTFont(src)
    cmap_table = font["cmap"]

    if encoding in ("ml", "kv"):
        unicode_cmap = font.getBestCmap() or {}
        symbol = next((t for t in cmap_table.tables if (t.platformID, t.platEncID) == (3, 0)), None)
        mapping = dict(unicode_cmap)
        if symbol is not None:
            for cp, glyph in symbol.cmap.items():
                if 0xF020 <= cp <= 0xF0FF:
                    mapping.setdefault(cp - 0xF000, glyph)
        if 0x00AD in mapping and 0x00EF not in mapping:
            mapping[0x00EF] = mapping[0x00AD]
        if symbol is not None or mapping != unicode_cmap:
            sub = CmapSubtable.newSubtable(4)
            sub.platformID, sub.platEncID, sub.language = 3, 1, 0
            sub.cmap = {cp: g for cp, g in mapping.items() if cp <= 0xFFFF}
            cmap_table.tables = [t for t in cmap_table.tables if (t.platformID, t.platEncID) != (3, 1)]
            cmap_table.tables.append(sub)

    font.flavor = "woff"
    font.save(dest)


def main():
    WEB.mkdir(parents=True, exist_ok=True)
    catalogue = []
    seen = set()
    sources = read_sources()

    for folder, (collection, encoding) in COLLECTIONS.items():
        base = FONTS / folder
        if not base.exists():
            continue
        for path in sorted(base.rglob("*")):
            if path.suffix.lower() not in (".ttf", ".otf"):
                continue
            try:
                font = TTFont(path, lazy=True)
            except Exception as exc:
                print(f"skip {path.relative_to(ROOT)}: {exc}", file=sys.stderr)
                continue

            if encoding == "unicode" and not has_malayalam(font):
                print(f"skip {path.relative_to(ROOT)}: no Malayalam glyphs", file=sys.stderr)
                continue

            raw_family = name(font, 16, 1) or path.stem
            style = name(font, 17, 2) or "Regular"
            full = name(font, 4) or f"{raw_family} {style}"
            weight = font["OS/2"].usWeightClass if "OS/2" in font else 400
            italic = bool(font["OS/2"].fsSelection & 1) if "OS/2" in font else "italic" in style.lower()
            if "bold" in style.lower() and weight < 600:
                weight = 700

            source = sources.get(path.parent.name) if collection == "Unicode" else None
            if ".colrv" in path.stem.lower():
                style += " (COLRv1)" if "colrv1" in path.stem.lower() else " (COLRv0)"

            font_id = slug(f"{collection}-{path.stem}")
            if font_id in seen:
                font_id = slug(f"{collection}-{path.relative_to(base)}")
            seen.add(font_id)

            web = WEB / f"{font_id}.woff"
            if not web.exists() or web.stat().st_mtime < path.stat().st_mtime:
                make_web_copy(path, web, encoding)

            entry = {
                "id": font_id,
                "name": full,
                "family": source["family"] if source else clean_family(raw_family, collection),
                "style": style,
                "weight": weight,
                "italic": italic,
                "collection": collection,
                "encoding": encoding,
                "file": path.relative_to(ROOT).as_posix(),
                "web": web.relative_to(ROOT).as_posix(),
                "bytes": path.stat().st_size,
            }
            if source:
                entry["license"] = source["license"]
            designer = source["designer"] if source else name(font, 9, 8)
            if designer:
                entry["designer"] = designer[:80]
            catalogue.append(entry)

    live = {e["id"] for e in catalogue}
    for stale in WEB.glob("*.woff"):
        if stale.stem not in live:
            stale.unlink()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(catalogue, ensure_ascii=False, separators=(",", ":")))
    families = {(e["collection"], e["family"]) for e in catalogue}
    print(f"{len(catalogue)} fonts in {len(families)} families -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
