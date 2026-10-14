const VIRAMA = '്';
const ZWJ = '\u200D';
const ZWNJ = '\u200C';

const CONSONANTS = {
  'ക': 'I', 'ഖ': 'J', 'ഗ': 'K', 'ഘ': 'L', 'ങ': 'M',
  'ച': 'N', 'ഛ': 'O', 'ജ': 'P', 'ഝ': 'Q', 'ഞ': 'R',
  'ട': 'S', 'ഠ': 'T', 'ഡ': 'U', 'ഢ': 'V', 'ണ': 'W',
  'ത': 'X', 'ഥ': 'Y', 'ദ': 'Z', 'ധ': '[', 'ന': '\\',
  'പ': ']', 'ഫ': '^', 'ബ': '_', 'ഭ': '`', 'മ': 'a',
  'യ': 'b', 'ര': 'c', 'റ': 'd', 'ല': 'e', 'ള': 'f',
  'ഴ': 'g', 'വ': 'h', 'ശ': 'i', 'ഷ': 'j', 'സ': 'k', 'ഹ': 'l',
};

const VOWELS = {
  'അ': 'A', 'ആ': 'B', 'ഇ': 'C', 'ഈ': 'Cu', 'ഉ': 'D', 'ഊ': 'Du', 'ഋ': 'E',
  'എ': 'F', 'ഏ': 'G', 'ഐ': 'sF', 'ഒ': 'H', 'ഓ': 'Hm', 'ഔ': 'Hu',
};

const SIGNS = {
  'ാ': ['', 'm'], 'ി': ['', 'n'], 'ീ': ['', 'o'], 'ു': ['', 'p'], 'ൂ': ['', 'q'],
  'ൃ': ['', 'r'], 'ൄ': ['', 'r'], 'െ': ['s', ''], 'േ': ['t', ''], 'ൈ': ['ss', ''],
  'ൊ': ['s', 'm'], 'ോ': ['t', 'm'], 'ൌ': ['s', 'u'], 'ൗ': ['', 'u'],
};

const MODIFIERS = { 'ം': 'w', 'ഃ': 'x', [VIRAMA]: 'v' };

const CHILLUS = { 'ൺ': '¬', 'ൻ': '³', 'ർ': 'À', 'ൽ': 'Â', 'ൾ': 'Ä', 'ൿ': 'Iv' };

const CONJUNCTS = {
  'ക്ക': '¡', 'ക്ല': '¢', 'ക്ഷ': '£', 'ഗ്ഗ': '¤', 'ഗ്ല': '¥', 'ങ്ക': '¦', 'ങ്ങ': '§',
  'ച്ച': '¨', 'ഞ്ച': '©', 'ഞ്ഞ': 'ª', 'ട്ട': '«', 'ണ്ട': null, 'ണ്ണ': '®', 'ത്ത': '¯',
  'ത്ഥ': '°', 'ദ്ദ': '±', 'ദ്ധ': '²', 'ന്ത': '´', 'ന്ദ': 'µ', 'ന്ന': '¶', 'ന്മ': '·',
  'പ്പ': '¸', 'പ്ല': '¹', 'ബ്ബ': 'º', 'ബ്ല': '»', 'മ്പ': '¼', 'മ്മ': '½', 'മ്ല': '¾',
  'യ്യ': '¿', 'ല്ല': 'Ã', 'ള്ള': 'Å', 'വ്വ': 'Æ', 'ശ്ല': 'Ç', 'ശ്ശ': 'È', 'സ്ല': 'É',
  'സ്സ': 'Ê', 'ഹ്ല': 'Ë', 'സ്റ്റ': 'Ì', 'ഡ്ഡ': 'Í', 'ക്ട': 'Î', 'ബ്ധ': 'Ï', 'ബ്ദ': 'Ð',
  'ച്ഛ': 'Ñ', 'ഹ്മ': 'Ò', 'ഹ്ന': 'Ó', 'ന്ധ': 'Ô', 'ത്സ': 'Õ', 'ജ്ജ': 'Ö', 'ണ്മ': '×',
  'സ്ഥ': 'Ø', 'ന്ഥ': 'Ù', 'ജ്ഞ': 'Ú', 'ത്ഭ': 'Û', 'ഗ്മ': 'Ü', 'ശ്ച': 'Ý', 'ണ്ഡ': 'Þ',
  'ത്മ': 'ß', 'ക്ത': 'à', 'ഗ്ന': 'á', 'ന്റ': 'â', 'ഷ്ട': 'ã', 'റ്റ': 'ä', 'ല്പ': 'å',
};
const MAX_CONJUNCT = 3;

const POST_BASE = { 'യ': 'y', 'വ': 'z' };
const RA = 'ര';
const RAKAR = '{';

export const ENCODINGS = ['ml', 'fml', 'kv'];

const isConsonant = (ch) => ch in CONSONANTS;

function ndaGlyph(encoding, forDisplay) {
  return encoding === 'fml' || forDisplay ? 'ï' : '\u00AD';
}

export function normalize(text) {
  return text
    .normalize('NFC')
    .replace(/ണ്\u200D/g, 'ൺ').replace(/ന്\u200D/g, 'ൻ').replace(/ര്\u200D/g, 'ർ')
    .replace(/ല്\u200D/g, 'ൽ').replace(/ള്\u200D/g, 'ൾ').replace(/ക്\u200D/g, 'ൿ')
    .replace(/ൻ്റ/g, 'ന്റ').replace(/ൻറ്/g, 'ന്റ്')
    .replace(/ൌ/g, 'ൌ')
    .replace(/[൦-൯]/g, (d) => String(d.charCodeAt(0) - 0x0D66));
}

function conjunctGlyph(cluster, encoding, forDisplay) {
  if (cluster === 'ണ്ട') return ndaGlyph(encoding, forDisplay);
  return CONJUNCTS[cluster];
}

function segment(consonants, encoding, forDisplay) {
  const units = [];
  let i = 0;
  while (i < consonants.length) {
    let taken = false;
    for (let len = Math.min(MAX_CONJUNCT, consonants.length - i); len > 1; len--) {
      const glyph = conjunctGlyph(consonants.slice(i, i + len).join(VIRAMA), encoding, forDisplay);
      if (glyph) {
        units.push(glyph);
        i += len;
        taken = true;
        break;
      }
    }
    if (!taken) units.push(CONSONANTS[consonants[i++]]);
  }
  return units;
}

function hasConjunct(a, b) {
  return (a + VIRAMA + b) in CONJUNCTS;
}

export function toLegacy(text, encoding = 'ml', { forDisplay = false } = {}) {
  const t = normalize(text);
  let out = '';
  let i = 0;
  while (i < t.length) {
    const ch = t[i];

    if (isConsonant(ch)) {
      const cons = [ch];
      let j = i + 1;
      while (t[j] === VIRAMA && isConsonant(t[j + 1])) {
        cons.push(t[j + 1]);
        j += 2;
      }
      let pre = '';
      let post = '';
      if (t[j] in SIGNS) {
        [pre, post] = SIGNS[t[j]];
        j++;
      }

      let postBase = '';
      let rakar = false;
      const last = () => cons[cons.length - 1];
      const prev = () => cons[cons.length - 2];
      if (cons.length > 1 && last() in POST_BASE && !hasConjunct(prev(), last())) {
        postBase = POST_BASE[cons.pop()];
      }
      if (cons.length > 1 && last() === RA) {
        cons.pop();
        rakar = true;
      }

      const units = segment(cons, encoding, forDisplay);
      const lead = units.slice(0, -1).map((u) => u + 'v').join('');
      out += lead + pre + (rakar ? RAKAR : '') + units[units.length - 1] + postBase + post;
      i = j;
      continue;
    }

    if (ch in VOWELS) out += VOWELS[ch];
    else if (ch in SIGNS) out += SIGNS[ch].join('');
    else if (ch in MODIFIERS) out += MODIFIERS[ch];
    else if (ch in CHILLUS) out += CHILLUS[ch];
    else if (ch === ZWJ || ch === ZWNJ) {}
    else if (ch === '-') out += 'þ';
    else if (ch === '‘') out += '"';
    else if (ch === '’') out += "'";
    else out += ch;
    i++;
  }
  return out;
}

const GLYPH_TO_UNICODE = (() => {
  const map = {};
  for (const [u, g] of Object.entries(CONSONANTS)) map[g] = u;
  for (const [u, g] of Object.entries(CONJUNCTS)) if (g) map[g] = u;
  map['\u00AD'] = 'ണ്ട';
  map['ï'] = 'ണ്ട';
  map['Á'] = 'റ്റ';
  Object.assign(map, { 'æ': 'കു', 'ç': 'ക്കു', 'è': 'ങ്കു', 'é': 'ണു', 'ê': 'രു', 'ë': 'നു', 'ì': 'ന്നു', 'í': 'യ്ക്ക' });
  return map;
})();

const VOWEL_GLYPHS = { A: 'അ', B: 'ആ', C: 'ഇ', D: 'ഉ', E: 'ഋ', F: 'എ', G: 'ഏ', H: 'ഒ' };
const VOWEL_LENGTHENED = { Cu: 'ഈ', Du: 'ഊ', Hm: 'ഓ', Hu: 'ഔ' };
const POST_GLYPHS = { m: 'ാ', n: 'ി', o: 'ീ', p: 'ു', q: 'ൂ', r: 'ൃ', u: 'ൗ' };
const POST_BASE_GLYPHS = { y: '്യ', z: '്വ', '|': '്യു', '}': '്യൂ' };
const OTHER_GLYPHS = {
  v: VIRAMA, w: 'ം', x: 'ഃ', '¬': 'ൺ', '³': 'ൻ', 'À': 'ർ', 'Â': 'ൽ', 'Ä': 'ൾ',
  'þ': '-', '-': '',
};

export function fromLegacy(text) {
  let out = '';
  let i = 0;
  const s = text;
  while (i < s.length) {
    let pre = '';
    let rakar = false;
    let j = i;
    while (s[j] === 's' || s[j] === 't' || s[j] === RAKAR) {
      if (s[j] === RAKAR) rakar = true;
      else pre += s[j];
      j++;
    }
    const base = s[j];

    if (pre === 's' && !rakar && base === 'F') {
      out += 'ഐ';
      i = j + 1;
      continue;
    }

    if (base in GLYPH_TO_UNICODE) {
      let syl = GLYPH_TO_UNICODE[base];
      j++;
      if (rakar) syl += '്ര';
      while (s[j] in POST_BASE_GLYPHS) syl += POST_BASE_GLYPHS[s[j++]];
      if (pre === 's' && s[j] === 'm') { syl += 'ൊ'; j++; }
      else if (pre === 't' && s[j] === 'm') { syl += 'ോ'; j++; }
      else if (pre === 's' && s[j] === 'u') { syl += 'ൌ'; j++; }
      else if (pre === 's') syl += 'െ';
      else if (pre === 't') syl += 'േ';
      else if (pre === 'ss') syl += 'ൈ';
      else if (pre) syl += pre;
      out += syl;
      i = j;
      continue;
    }

    if (pre || rakar) {
      out += s.slice(i, j);
      i = j;
      continue;
    }

    const two = s.slice(i, i + 2);
    if (two in VOWEL_LENGTHENED) { out += VOWEL_LENGTHENED[two]; i += 2; continue; }
    const ch = s[i];
    if (ch in VOWEL_GLYPHS) out += VOWEL_GLYPHS[ch];
    else if (ch in POST_GLYPHS) out += POST_GLYPHS[ch];
    else if (ch in POST_BASE_GLYPHS) out += POST_BASE_GLYPHS[ch];
    else if (ch in OTHER_GLYPHS) out += OTHER_GLYPHS[ch];
    else out += ch;
    i++;
  }
  return out.normalize('NFC');
}

const M_CONS = {
  'ക': 'k', 'ഖ': 'kh', 'ഗ': 'g', 'ഘ': 'gh', 'ങ': 'ng', 'ച': 'ch', 'ഛ': 'chh', 'ജ': 'j',
  'ഝ': 'jh', 'ഞ': 'nj', 'ട': 't', 'ഠ': 'th', 'ഡ': 'd', 'ഢ': 'dh', 'ണ': 'n', 'ത': 'th',
  'ഥ': 'th', 'ദ': 'd', 'ധ': 'dh', 'ന': 'n', 'പ': 'p', 'ഫ': 'ph', 'ബ': 'b', 'ഭ': 'bh',
  'മ': 'm', 'യ': 'y', 'ര': 'r', 'റ': 'r', 'ല': 'l', 'ള': 'l', 'ഴ': 'zh', 'വ': 'v',
  'ശ': 'sh', 'ഷ': 'sh', 'സ': 's', 'ഹ': 'h',
};
const M_CLUSTERS = {
  'ന്റ': 'nt', 'റ്റ': 'tt', 'ങ്ങ': 'ng', 'ഞ്ഞ': 'nj', 'ങ്ക': 'nk', 'ഞ്ച': 'nch',
  'ക്ഷ': 'ksh', 'ന്ത': 'nth', 'ത്ത': 'tth', 'ച്ച': 'cch', 'ജ്ഞ': 'jn',
};
const M_VOWELS = {
  'അ': 'a', 'ആ': 'aa', 'ഇ': 'i', 'ഈ': 'ee', 'ഉ': 'u', 'ഊ': 'oo', 'ഋ': 'ru',
  'എ': 'e', 'ഏ': 'e', 'ഐ': 'ai', 'ഒ': 'o', 'ഓ': 'o', 'ഔ': 'au',
};
const M_SIGNS = {
  'ാ': 'aa', 'ി': 'i', 'ീ': 'ee', 'ു': 'u', 'ൂ': 'oo', 'ൃ': 'ru', 'ൄ': 'roo',
  'െ': 'e', 'േ': 'e', 'ൈ': 'ai', 'ൊ': 'o', 'ോ': 'o', 'ൌ': 'au', 'ൗ': 'au',
};
const M_CHILLUS = { 'ൺ': 'n', 'ൻ': 'n', 'ർ': 'r', 'ൽ': 'l', 'ൾ': 'l', 'ൿ': 'k' };

export function toManglish(text) {
  const t = normalize(text);
  let out = '';
  let i = 0;
  while (i < t.length) {
    const ch = t[i];
    if (isConsonant(ch)) {
      let roman = '';
      let j = i;
      for (;;) {
        let matched = false;
        for (const [cluster, spelling] of Object.entries(M_CLUSTERS)) {
          if (t.startsWith(cluster, j)) {
            roman += spelling;
            j += cluster.length;
            matched = true;
            break;
          }
        }
        if (!matched) roman += M_CONS[t[j++]];
        if (t[j] === VIRAMA && isConsonant(t[j + 1])) { j++; continue; }
        break;
      }
      if (t[j] in M_SIGNS) roman += M_SIGNS[t[j++]];
      else if (t[j] === VIRAMA) {
        j++;
        roman += /[ഀ-ൿ]/.test(t[j] || '') ? '' : 'u';
      } else roman += 'a';
      out += roman;
      i = j;
      continue;
    }
    if (ch in M_VOWELS) out += M_VOWELS[ch];
    else if (ch in M_CHILLUS) out += M_CHILLUS[ch];
    else if (ch === 'ം') out += 'm';
    else if (ch === 'ഃ') out += 'h';
    else if (ch !== ZWJ && ch !== ZWNJ) out += ch;
    i++;
  }
  return out;
}

const T_CONS = [
  ['nth', 'ന്ത'], ['nt', 'ന്റ'], ['chh', 'ഛ'], ['thh', 'ഥ'], ['ksh', 'ക്ഷ'],
  ['kh', 'ഖ'], ['gh', 'ഘ'], ['ng', 'ങ്ങ'], ['nk', 'ങ്ക'], ['ch', 'ച'], ['jh', 'ഝ'], ['nj', 'ഞ'],
  ['Th', 'ഠ'], ['Dh', 'ഢ'], ['th', 'ത'], ['dh', 'ധ'], ['ph', 'ഫ'], ['bh', 'ഭ'],
  ['zh', 'ഴ'], ['sh', 'ഷ'], ['tt', 'റ്റ'], ['x', 'ക്സ'],
  ['k', 'ക'], ['c', 'ക'], ['q', 'ക'], ['g', 'ഗ'], ['j', 'ജ'], ['T', 'ട'], ['t', 'ട'],
  ['D', 'ഡ'], ['N', 'ണ'], ['d', 'ദ'], ['n', 'ന'], ['p', 'പ'], ['f', 'ഫ'], ['b', 'ബ'],
  ['m', 'മ'], ['y', 'യ'], ['R', 'റ'], ['r', 'ര'], ['L', 'ള'], ['l', 'ല'], ['v', 'വ'],
  ['w', 'വ'], ['S', 'ശ'], ['z', 'ശ'], ['s', 'സ'], ['h', 'ഹ'],
];
const T_VOWELS = [
  ['aa', 'ആ', 'ാ'], ['A', 'ആ', 'ാ'], ['ai', 'ഐ', 'ൈ'], ['au', 'ഔ', 'ൌ'], ['ee', 'ഈ', 'ീ'],
  ['ii', 'ഈ', 'ീ'], ['I', 'ഈ', 'ീ'], ['oo', 'ഊ', 'ൂ'], ['uu', 'ഊ', 'ൂ'], ['U', 'ഊ', 'ൂ'],
  ['E', 'ഏ', 'േ'], ['O', 'ഓ', 'ോ'], ['a', 'അ', ''], ['i', 'ഇ', 'ി'],
  ['u', 'ഉ', 'ു'], ['e', 'എ', 'െ'], ['o', 'ഒ', 'ൊ'],
];
const T_CHILLU = { 'ന': 'ൻ', 'ണ': 'ൺ', 'ര': 'ർ', 'ല': 'ൽ', 'ള': 'ൾ' };

function matchFrom(table, s, i) {
  for (const row of table) if (s.startsWith(row[0], i)) return row;
  return null;
}

export function fromManglish(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    if (!/[A-Za-z]/.test(text[i])) { out += text[i++]; continue; }

    const cons = matchFrom(T_CONS, text, i);
    if (cons) {
      i += cons[0].length;
      let cluster = cons[1];
      if (cons[0].length === 1 && text[i] === cons[0] && cons[0] !== 't') {
        cluster += VIRAMA + cons[1];
        i++;
      }
      const vowel = matchFrom(T_VOWELS, text, i);
      if (vowel) {
        out += cluster + vowel[2];
        i += vowel[0].length;
      } else if (text[i] === '~') {
        out += cluster + VIRAMA;
        i++;
      } else if (i < text.length && /[A-Za-z]/.test(text[i])) {
        out += cluster + VIRAMA;
      } else if (cluster === 'മ' && out && /[ഀ-ൿ]$/.test(out)) {
        out += 'ം';
      } else if (cluster in T_CHILLU) {
        out += T_CHILLU[cluster];
      } else {
        out += cluster + VIRAMA;
      }
      continue;
    }
    const vowel = matchFrom(T_VOWELS, text, i);
    if (vowel) { out += vowel[1]; i += vowel[0].length; continue; }
    out += text[i++];
  }
  return out;
}
