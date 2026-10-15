#!/usr/bin/env python3
"""Build a Malayalam word-frequency list from the SMC Malayalam corpus.

Source corpus: https://gitlab.com/smc/corpus (see LICENSE.md in this folder
for the exact commit, licences and attribution).

Usage:
    python3 -I build_wordlist.py /path/to/smc-corpus [-o ml-words.txt] [--top 100000]

The first argument is the root of a checkout of the SMC corpus repository
(the directory that contains `text/`). Only the sub-corpora listed in
INCLUDED below are read; they were chosen because each carries an explicit
licence compatible with CC BY-SA. Everything read from the corpus is treated
as plain data.

Output format: one entry per line, `word<TAB>count`, sorted by count
descending (ties broken by the word, so the output is deterministic).
"""

import argparse
import os
import re
import sys
import unicodedata
from collections import Counter

# Sub-corpora read from the SMC corpus, relative to the repository root.
#   text/ml-wiki        Malayalam Wikipedia (dump 2023-04-02), CC BY-SA
#   text/sayahna        Sayahna Foundation books, CC BY-SA 4.0
#   text/deshabhimani   Deshabhimani news Jan 2023 to Apr 2024, CC BY 4.0
#   text/conversations.txt, text/malayalamproverbs.txt
#                       SMC-curated, covered by the repository CC BY-SA licence
# Deliberately NOT read:
#   text/sarvavijnanakosam  GNU FDL, not compatible with CC BY-SA
#   text/CMOKerala          "public domain" claim for government press releases
#                           is not an explicit open licence
#   text/1.txt .. 26.txt    mixed third-party articles with per-file provenance
#   text/oscar              only a README, no data in the repository
#   words/                  lexicons without frequencies
INCLUDED = [
    "text/ml-wiki",
    "text/sayahna",
    "text/deshabhimani",
    "text/conversations.txt",
    "text/malayalamproverbs.txt",
]

ZWJ = "‍"
ZWNJ = "‌"
VIRAMA = "്"

# Old-style chillu (consonant + virama + ZWJ) to atomic chillu.
OLD_CHILLU = {
    "ണ" + VIRAMA + ZWJ: "ൺ",  # ണ് + ZWJ -> ൺ
    "ന" + VIRAMA + ZWJ: "ൻ",  # ന് + ZWJ -> ൻ
    "ര" + VIRAMA + ZWJ: "ർ",  # ര് + ZWJ -> ർ
    "ല" + VIRAMA + ZWJ: "ൽ",  # ല് + ZWJ -> ൽ
    "ള" + VIRAMA + ZWJ: "ൾ",  # ള് + ZWJ -> ൾ
    "ക" + VIRAMA + ZWJ: "ൿ",  # ക് + ZWJ -> ൿ
}
NTA = "ന" + VIRAMA + "റ"  # ന്റ
NTA_VARIANTS = [
    "ന" + VIRAMA + ZWJ + "റ",  # ന്‍റ (old chillu form + റ)
    "ൻ" + VIRAMA + "റ",        # ൻ്റ (atomic chillu + virama + റ)
]

# Characters inside the Malayalam block that are numerals or number/date
# symbols; tokens containing any of these are dropped.
NUMERIC = set(chr(c) for c in list(range(0x0D58, 0x0D5F)) + list(range(0x0D66, 0x0D7A)))

TOKEN_RE = re.compile("[ഀ-ൿ]+")
OLD_CHILLU_RE = re.compile("|".join(re.escape(k) for k in OLD_CHILLU))


def normalise(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    # ന്‍റ must be handled before the generic old-chillu rule, otherwise it
    # would become ൻറ instead of ന്റ.
    text = text.replace(NTA_VARIANTS[0], NTA)
    text = OLD_CHILLU_RE.sub(lambda m: OLD_CHILLU[m.group(0)], text)
    text = text.replace(NTA_VARIANTS[1], NTA)
    text = text.replace(ZWJ, "").replace(ZWNJ, "")
    return unicodedata.normalize("NFC", text)


def keep(token: str) -> bool:
    if len(token) < 2:
        return False
    # Must start with a base letter, not a dangling vowel sign or virama.
    if unicodedata.category(token[0]) != "Lo":
        return False
    if any(ch in NUMERIC for ch in token):
        return False
    # A lone consonant + virama (for example ന് in "2010-ന്") is a suffix
    # fragment left over after splitting off digits or Latin text.
    if len(token) == 2 and token[1] == VIRAMA:
        return False
    return True


def iter_files(root: str):
    for rel in INCLUDED:
        path = os.path.join(root, rel)
        if os.path.isfile(path):
            yield path
        elif os.path.isdir(path):
            for dirpath, dirnames, filenames in os.walk(path):
                dirnames.sort()
                for name in sorted(filenames):
                    if name.lower() == "readme.md":
                        continue
                    yield os.path.join(dirpath, name)
        else:
            print(f"warning: {rel} not found under {root}", file=sys.stderr)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("corpus_root", help="path to a checkout of https://gitlab.com/smc/corpus")
    ap.add_argument("-o", "--output", default="ml-words.txt")
    ap.add_argument("--top", type=int, default=100000)
    args = ap.parse_args()

    counts: Counter = Counter()
    n_files = n_bytes = n_tokens = 0
    for path in iter_files(args.corpus_root):
        n_files += 1
        n_bytes += os.path.getsize(path)
        with open(path, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                for tok in TOKEN_RE.findall(normalise(line)):
                    n_tokens += 1
                    if keep(tok):
                        counts[tok] += 1

    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[: args.top]
    with open(args.output, "w", encoding="utf-8", newline="\n") as out:
        for word, n in ranked:
            out.write(f"{word}\t{n}\n")

    print(
        f"files={n_files} bytes={n_bytes} malayalam_tokens={n_tokens} "
        f"kept_tokens={sum(counts.values())} distinct={len(counts)} written={len(ranked)}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
