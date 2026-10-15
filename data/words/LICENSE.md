# Licence and attribution for `ml-words.txt`

## Licence

`ml-words.txt` is derived from the Malayalam text corpus published by
Swathanthra Malayalam Computing (SMC) and is distributed under the same
Creative Commons Attribution-ShareAlike licence as its source data:

**Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**
https://creativecommons.org/licenses/by-sa/4.0/

Why version 4.0: the SMC corpus repository as a whole is licensed under
CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/, as stated in
its README.md). One of the sub-corpora used here (Sayahna) is licensed
CC BY-SA 4.0, which requires adaptations to be shared under CC BY-SA 4.0.
CC BY-SA 3.0 permits adaptations to be licensed under a later version of the
same licence, and CC BY 4.0 material (Deshabhimani) may be included in a
CC BY-SA 4.0 adaptation, so the combined list is released under
CC BY-SA 4.0.

`build_wordlist.py` (in `scripts/`) is not derived from the corpus.

## Source

- Repository: https://gitlab.com/smc/corpus
- Branch / commit: `master` at `d1e6431d0b05147056d873a3998cdedc2c7d573c`
  (commit dated 2024-04-17, "Add Deshabhimani corpus")
- Retrieved: 2026-10-15
- Background: https://blog.smc.org.in/malayalam-corpus

### Sub-corpora used, with the licence and credit each one states

| Path in the SMC repo | Content | Licence stated in the repo | Credit |
| --- | --- | --- | --- |
| `text/ml-wiki/` (about 419 MB) | Malayalam Wikipedia, dump dated 2023-04-02, extracted with WikiExtractor | CC BY-SA (Wikipedia text licence; repo licence CC BY-SA 3.0) | Malayalam Wikipedia contributors, https://ml.wikipedia.org |
| `text/sayahna/` (about 51 MB) | Books from Sayahna Foundation, retrieved 2024-04-08 | CC BY-SA 4.0 | Sayahna Foundation, https://books.sayahna.org, and the individual authors |
| `text/deshabhimani/` (about 109 MB) | Deshabhimani news text, Jan 2023 to 17 Apr 2024 | CC BY 4.0 | Deshabhimani, https://www.deshabhimani.com |
| `text/conversations.txt`, `text/malayalamproverbs.txt` | Sample conversations and proverbs curated by SMC | CC BY-SA 3.0 (repo licence) | Swathanthra Malayalam Computing |

Corpus compilation and curation: Swathanthra Malayalam Computing (SMC),
https://smc.org.in.

### Parts of the SMC repo deliberately not used

- `text/sarvavijnanakosam/`: GNU FDL, which is not compatible with CC BY-SA.
- `text/CMOKerala/`: described as public domain government press releases,
  with no explicit open licence.
- `text/1.txt` to `text/26.txt`: individual third-party articles whose
  licence is not stated per file.
- `text/oscar/`: contains only download instructions, no text.
- `words/`: lexicons without frequency information.

## How the list was derived

The five inputs above (1,650 files, about 607 MB of UTF-8 text, about 21.0
million Malayalam tokens) were read line by line with `build_wordlist.py`.
Each line was NFC-normalised; `ന്` + ZWJ + `റ` was rewritten to `ന്റ`; old-style
chillus (consonant + virama + ZWJ) were mapped to atomic chillus (ൺ ൻ ർ ൽ ൾ ൿ);
`ൻ്റ` was rewritten to `ന്റ`; all remaining ZWJ and ZWNJ characters were removed;
and the text was NFC-normalised again. Tokens were then taken as maximal runs
of characters in the Malayalam Unicode block (U+0D00 to U+0D7F), so any other
character (spaces, punctuation, Latin letters, ASCII digits) acts as a
separator. A token was kept only if it is at least 2 code points long, starts
with a Malayalam letter, contains no Malayalam digits or number/date signs, and
is not a lone consonant + virama fragment (such as the `ന്` left over from
"2010-ന്"). Counts were summed per normalised word, and the 100,000 most frequent
words were written as `word<TAB>count`, sorted by count descending and then by
word. The list reflects the make-up of the corpus, which is dominated by
encyclopaedic Wikipedia text, so colloquial words are under-represented.

To rebuild:

```sh
git clone https://gitlab.com/smc/corpus.git smc-corpus
git -C smc-corpus checkout d1e6431d0b05147056d873a3998cdedc2c7d573c
python3 -I scripts/build_wordlist.py smc-corpus -o data/words/ml-words.txt --top 100000
```
