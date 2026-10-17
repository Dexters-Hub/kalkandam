// Manglish word suggestions: spell a loosely typed word every plausible way, rank the spellings with a
// letter model trained on the word list, and prefer real words from that list.

import { fromManglish, manglishCase } from './malayalam.js?v=16';

const V = '്';
const CHILLU = { 'ന': 'ൻ', 'ണ': 'ൺ', 'ര': 'ർ', 'ല': 'ൽ', 'ള': 'ൾ' };

// Latin spelling -> possible consonant clusters. Longest spellings first.
const CONS = [
  ['nth', ['ന്ത']], ['ksh', ['ക്ഷ']], ['chch', ['ച്ച']], ['cch', ['ച്ച']], ['tth', ['ത്ത']], ['thth', ['ത്ത']],
  ['ndh', ['ന്ധ', 'ന്ദ']], ['mb', ['മ്പ', 'മ്ബ']], ['mp', ['മ്പ']], ['nk', ['ങ്ക']], ['ng', ['ങ്ങ', 'ങ്ക', 'ങ']],
  ['nj', ['ഞ്ഞ', 'ഞ', 'ഞ്ച']], ['nch', ['ഞ്ച']], ['nd', ['ണ്ട', 'ന്ദ', 'ന്ഡ']], ['nt', ['ന്റ', 'ന്ത', 'ണ്ട']],
  ['tt', ['ട്ട', 'റ്റ', 'ത്ത']], ['TT', ['ട്ട']], ['kk', ['ക്ക']], ['pp', ['പ്പ']], ['mm', ['മ്മ']],
  ['nn', ['ന്ന', 'ണ്ണ']], ['NN', ['ണ്ണ']], ['ll', ['ല്ല', 'ള്ള']], ['LL', ['ള്ള']], ['ss', ['സ്സ']],
  ['yy', ['യ്യ']], ['vv', ['വ്വ']], ['jj', ['ജ്ജ']], ['dd', ['ദ്ദ', 'ഡ്ഡ']], ['bb', ['ബ്ബ']], ['gg', ['ഗ്ഗ']],
  ['kh', ['ഖ']], ['gh', ['ഘ']], ['ch', ['ച', 'ഛ']], ['jh', ['ഝ']], ['Th', ['ഠ']], ['Dh', ['ഢ']],
  ['th', ['ത', 'ഥ']], ['dh', ['ദ', 'ധ']], ['ph', ['ഫ']], ['bh', ['ഭ']], ['zh', ['ഴ']], ['sh', ['ഷ', 'ശ']],
  ['x', ['ക്സ']], ['k', ['ക']], ['c', ['ക', 'സ']], ['q', ['ക']], ['g', ['ഗ']], ['j', ['ജ']],
  ['T', ['ട']], ['t', ['ട', 'ത', 'റ്റ']], ['D', ['ഡ']], ['d', ['ദ', 'ഡ', 'ട']], ['N', ['ണ']], ['n', ['ന', 'ണ']],
  ['p', ['പ']], ['f', ['ഫ']], ['b', ['ബ']], ['m', ['മ']], ['y', ['യ']], ['R', ['റ']], ['r', ['ര', 'റ']],
  ['L', ['ള']], ['l', ['ല', 'ള']], ['v', ['വ']], ['w', ['വ']], ['S', ['ശ']], ['s', ['സ', 'ശ']], ['z', ['ശ', 'സ']],
  ['h', ['ഹ']],
];
// Latin vowel -> [independent letters, signs after a consonant].
const VOWELS = [
  ['aa', ['ആ'], ['ാ']], ['A', ['ആ'], ['ാ']], ['ai', ['ഐ'], ['ൈ']], ['au', ['ഔ'], ['ൗ']], ['ae', ['ഏ'], ['േ']],
  ['ee', ['ഈ'], ['ീ']], ['ii', ['ഈ'], ['ീ']], ['I', ['ഈ'], ['ീ']], ['oo', ['ഊ'], ['ൂ']], ['uu', ['ഊ'], ['ൂ']],
  ['U', ['ഊ'], ['ൂ']], ['E', ['ഏ'], ['േ']], ['O', ['ഓ'], ['ോ']],
  ['a', ['അ', 'ആ'], ['', 'ാ']], ['i', ['ഇ', 'ഈ'], ['ി', 'ീ']], ['u', ['ഉ', 'ഊ'], ['ു', 'ൂ']],
  ['e', ['എ', 'ഏ'], ['െ', 'േ']], ['o', ['ഒ', 'ഓ'], ['ൊ', 'ോ']],
];

const match = (table, s, i) => table.find((row) => s.startsWith(row[0], i));

// Split a Latin word into slots, each with the Malayalam strings it could be.
function lattice(word) {
  const slots = [];
  let i = 0;
  while (i < word.length) {
    const cons = match(CONS, word, i);
    if (cons) {
      i += cons[0].length;
      const vowel = match(VOWELS, word, i);
      const options = [];
      if (vowel) {
        i += vowel[0].length;
        const end = i >= word.length;
        for (const c of cons[1]) {
          for (const sign of vowel[2]) options.push(c + sign);
          if (end && vowel[0] === 'u') options.push(c + V);
        }
      } else {
        const end = i >= word.length;
        for (const c of cons[1]) {
          options.push(c + V);
          if (CHILLU[c]) options.push(CHILLU[c]);
          if (c === 'മ' && slots.length) options.push('ം');
        }
      }
      slots.push([...new Set(options)]);
      continue;
    }
    const vowel = match(VOWELS, word, i);
    if (vowel) {
      i += vowel[0].length;
      // A vowel that doesn't follow a consonant is always written as an independent letter.
      slots.push(vowel[1]);
      continue;
    }
    return null;
  }
  return slots;
}

function letterModel(entries) {
  const tri = new Map();
  const bi = new Map();
  const add = (map, key, w) => map.set(key, (map.get(key) || 0) + w);
  for (const [word, count] of entries) {
    const w = Math.log2(count + 1);
    const s = `^^${word}$`;
    for (let i = 2; i < s.length; i++) {
      add(tri, s.slice(i - 2, i + 1), w);
      add(bi, s.slice(i - 2, i), w);
    }
  }
  const bi2 = new Map();
  const uni = new Map();
  for (const [k, w] of tri) {
    add(bi2, k.slice(1), w);
    add(uni, k[1], w);
  }
  // Interpolated trigram with a small floor, in log space.
  return (prev2, ch) => {
    const t = (tri.get(prev2 + ch) || 0) / (bi.get(prev2) || 1);
    const b = (bi2.get(prev2[1] + ch) || 0) / (uni.get(prev2[1]) || 1);
    return Math.log(0.7 * t + 0.25 * b + 0.05 / 128);
  };
}

export function createSuggester(text, learned = {}) {
  const freq = new Map();
  const entries = [];
  for (const line of text.split('\n')) {
    const tab = line.indexOf('\t');
    if (tab < 1) continue;
    const word = line.slice(0, tab);
    const count = Number(line.slice(tab + 1)) || 1;
    freq.set(word, count);
    entries.push([word, count]);
  }
  const sorted = entries.map((e) => e[0]).sort();
  const score = letterModel(entries);
  const picks = { ...learned };

  const completions = (prefix, limit) => {
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] < prefix) lo = mid + 1; else hi = mid;
    }
    const found = [];
    for (let i = lo; i < sorted.length && i < lo + 400 && sorted[i].startsWith(prefix); i++) found.push(sorted[i]);
    return found.sort((a, b) => freq.get(b) - freq.get(a)).slice(0, limit);
  };

  function spellings(word, beam = 48) {
    const slots = lattice(word);
    if (!slots) return [];
    let states = [{ s: '', lp: 0 }];
    for (const options of slots) {
      const next = [];
      for (const st of states) {
        for (const opt of options) {
          let lp = st.lp;
          let s = st.s;
          for (const ch of opt) {
            lp += score(`^^${s}`.slice(-2), ch);
            s += ch;
          }
          next.push({ s, lp });
        }
      }
      next.sort((a, b) => b.lp - a.lp);
      states = next.slice(0, beam);
    }
    for (const st of states) st.lp += score(`^^${st.s}`.slice(-2), '$');
    return states.sort((a, b) => b.lp - a.lp);
  }

  return {
    has: (word) => freq.has(word),
    learn(latin, word) {
      const key = manglishCase(latin);
      delete picks[key]; // re-insert so the oldest picks are the ones dropped
      picks[key] = word;
      return picks;
    },
    suggest(input, limit = 5) {
      if (!/^[A-Za-z]+$/.test(input)) return [];
      const latin = manglishCase(input);
      const out = [];
      const push = (w) => { if (w && !out.includes(w)) out.push(w); };
      push(picks[latin]);
      const ranked = spellings(latin);
      const known = ranked
        .filter((r) => freq.has(r.s))
        .sort((a, b) => (b.lp + Math.log(freq.get(b.s))) - (a.lp + Math.log(freq.get(a.s))));
      for (const r of known.slice(0, 3)) push(r.s);
      if (latin.length >= 3) for (const r of ranked.slice(0, 2)) for (const w of completions(r.s, 2)) push(w);
      for (const r of ranked.slice(0, 3)) push(r.s);
      push(fromManglish(latin));
      return out.slice(0, limit);
    },
  };
}
