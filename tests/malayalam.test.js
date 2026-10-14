import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toLegacy, fromLegacy, toManglish, fromManglish, normalize } from '../js/malayalam.js';

const CONSONANTS = 'കഖഗഘങചഛജഝഞടഠഡഢണതഥദധനപഫബഭമയരറലളഴവശഷസഹ'.split('');
const SIGNS = ['', 'ാ', 'ി', 'ീ', 'ു', 'ൂ', 'ൃ', 'െ', 'േ', 'ൈ', 'ൊ', 'ോ', 'ൌ', 'ൗ', 'ം', '്'];

test('matches the encoding produced by kuttipencil.in', () => {
  assert.equal(toLegacy('ഇന്നത്തെ ഏറ്റവും പുതിയ വാർത്തകൾ', 'ml'), 'C¶s¯ Gähpw ]pXnb hmÀ¯IÄ');
});

test('ML and FML differ only in ണ്ട', () => {
  assert.equal(toLegacy('ഉണ്ട്', 'ml'), 'D\u00ADv');
  assert.equal(toLegacy('ഉണ്ട്', 'fml'), 'Dïv');
  assert.equal(toLegacy('ഉണ്ട്', 'ml', { forDisplay: true }), 'Dïv');
});

test('pre-base vowel signs and ്ര are reordered', () => {
  assert.equal(toLegacy('കെ'), 'sI');
  assert.equal(toLegacy('കേ'), 'tI');
  assert.equal(toLegacy('കൈ'), 'ssI');
  assert.equal(toLegacy('കൊ'), 'sIm');
  assert.equal(toLegacy('കോ'), 'tIm');
  assert.equal(toLegacy('കൌ'), 'sIu');
  assert.equal(toLegacy('ക്ര'), '{I');
  assert.equal(toLegacy('ക്രൈ'), 'ss{I');
  assert.equal(toLegacy('ക്രോ'), 't{Im');
  assert.equal(toLegacy('സ്ത്രീ'), 'kv{Xo');
  assert.equal(toLegacy('ന്ത്ര'), '{´');
});

test('conjuncts, post-base forms and chillus', () => {
  assert.equal(toLegacy('എന്റെ'), 'Fsâ');
  assert.equal(toLegacy('സ്ഥലം'), 'Øew');
  assert.equal(toLegacy('ക്ഷ്മ'), '£va');
  assert.equal(toLegacy('ക്യ'), 'Iy');
  assert.equal(toLegacy('ത്ര്യ'), '{Xy');
  assert.equal(toLegacy('സ്വ'), 'kz');
  assert.equal(toLegacy('വ്വ'), 'Æ');
  assert.equal(toLegacy('കാർ'), 'ImÀ');
  assert.equal(toLegacy('ൿ'), 'Iv');
});

test('ZWNJ blocks a conjunct, old-style chillus are normalised', () => {
  assert.equal(toLegacy('ക്\u200Cക'), 'IvI');
  assert.equal(normalize('അവന്\u200D'), 'അവൻ');
  assert.equal(normalize('ൻ്റെ'), 'ന്റെ');
  assert.equal(toLegacy('ഐ ഈ ഊ ഓ ഔ'), 'sF Cu Du Hm Hu');
});

test('round-trips every consonant + sign and every two-consonant cluster', () => {
  const words = [];
  for (const c of CONSONANTS) {
    for (const s of SIGNS) words.push(c + s);
    for (const d of CONSONANTS) for (const s of SIGNS) words.push(`${c}്${d}${s}`);
    words.push(`${c}്രൈ`, `${c}്യോ`, `${c}്വെ`);
  }
  for (const enc of ['ml', 'fml']) {
    for (const w of words) assert.equal(fromLegacy(toLegacy(w, enc)), w, `${enc}: ${w}`);
  }
});

test('round-trips running text', () => {
  const text = 'കേരളത്തിലെ ഒരു പ്രധാനപ്പെട്ട നഗരമാണ് കൊച്ചി. കോർപ്പറേഷൻ പരിധിയിൽ 677,381 ജനങ്ങളും വസിക്കുന്നു - തിരുവനന്തപുരത്തു നിന്നും 220 കിലോമീറ്റർ';
  for (const enc of ['ml', 'fml']) assert.equal(fromLegacy(toLegacy(text, enc)), text);
});

test('Manglish', () => {
  assert.equal(toManglish('എന്റെ കേരളം'), 'ente keralam');
  assert.equal(toManglish('ഇംഗ്ലീഷ്'), 'imgleeshu');
  assert.equal(fromManglish('ente kEraLam'), 'എന്റെ കേരളം');
  assert.equal(fromManglish('ningaL'), 'നിങ്ങൾ');
  assert.equal(fromManglish('avan~'), 'അവന്');
  assert.equal(fromManglish('amma 2024'), 'അമ്മ 2024');
});
