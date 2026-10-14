export const VOWELS = [
  { l: 'അ', iso: 'a', ipa: 'a', word: 'അമ്മ', meaning: 'mother' },
  { l: 'ആ', iso: 'ā', ipa: 'aː', word: 'ആന', meaning: 'elephant' },
  { l: 'ഇ', iso: 'i', ipa: 'i', word: 'ഇല', meaning: 'leaf' },
  { l: 'ഈ', iso: 'ī', ipa: 'iː', word: 'ഈച്ച', meaning: 'housefly' },
  { l: 'ഉ', iso: 'u', ipa: 'u', word: 'ഉറുമ്പ്', meaning: 'ant' },
  { l: 'ഊ', iso: 'ū', ipa: 'uː', word: 'ഊഞ്ഞാൽ', meaning: 'swing' },
  { l: 'ഋ', iso: 'r̥', ipa: 'rɨ', word: 'ഋഷി', meaning: 'sage' },
  { l: 'എ', iso: 'e', ipa: 'e', word: 'എലി', meaning: 'rat' },
  { l: 'ഏ', iso: 'ē', ipa: 'eː', word: 'ഏണി', meaning: 'ladder' },
  { l: 'ഐ', iso: 'ai', ipa: 'ai̯', word: 'ഐക്യം', meaning: 'unity' },
  { l: 'ഒ', iso: 'o', ipa: 'o', word: 'ഒട്ടകം', meaning: 'camel' },
  { l: 'ഓ', iso: 'ō', ipa: 'oː', word: 'ഓടം', meaning: 'boat' },
  { l: 'ഔ', iso: 'au', ipa: 'au̯', word: 'ഔഷധം', meaning: 'medicine' },
  { l: 'അം', iso: 'aṁ', ipa: 'am', word: 'അംബരം', meaning: 'sky', note: 'anusvaram ം' },
  { l: 'അഃ', iso: 'aḥ', ipa: 'ah', word: 'ദുഃഖം', meaning: 'sorrow', note: 'visargam ഃ' },
];

export const CONSONANT_GROUPS = [
  {
    name: 'ക-വർഗം', en: 'Velar', letters: [
      { l: 'ക', iso: 'ka', ipa: 'ka', word: 'കപ്പൽ', meaning: 'ship' },
      { l: 'ഖ', iso: 'kha', ipa: 'kʰa', word: 'ഖനി', meaning: 'mine' },
      { l: 'ഗ', iso: 'ga', ipa: 'ɡa', word: 'ഗുഹ', meaning: 'cave' },
      { l: 'ഘ', iso: 'gha', ipa: 'ɡʱa', word: 'ഘടികാരം', meaning: 'clock' },
      { l: 'ങ', iso: 'ṅa', ipa: 'ŋa', word: 'മാങ്ങ', meaning: 'mango' },
    ],
  },
  {
    name: 'ച-വർഗം', en: 'Palatal', letters: [
      { l: 'ച', iso: 'ca', ipa: 't͡ʃa', word: 'ചക്ക', meaning: 'jackfruit' },
      { l: 'ഛ', iso: 'cha', ipa: 't͡ʃʰa', word: 'ഛായ', meaning: 'shade' },
      { l: 'ജ', iso: 'ja', ipa: 'd͡ʒa', word: 'ജനൽ', meaning: 'window' },
      { l: 'ഝ', iso: 'jha', ipa: 'd͡ʒʱa', word: 'ഝഷം', meaning: 'fish (rare)' },
      { l: 'ഞ', iso: 'ña', ipa: 'ɲa', word: 'ഞണ്ട്', meaning: 'crab' },
    ],
  },
  {
    name: 'ട-വർഗം', en: 'Retroflex', letters: [
      { l: 'ട', iso: 'ṭa', ipa: 'ʈa', word: 'പട്ടം', meaning: 'kite' },
      { l: 'ഠ', iso: 'ṭha', ipa: 'ʈʰa', word: 'മഠം', meaning: 'monastery' },
      { l: 'ഡ', iso: 'ḍa', ipa: 'ɖa', word: 'ഡപ്പി', meaning: 'small box' },
      { l: 'ഢ', iso: 'ḍha', ipa: 'ɖʱa', word: 'ഢക്ക', meaning: 'drum (rare)' },
      { l: 'ണ', iso: 'ṇa', ipa: 'ɳa', word: 'മണി', meaning: 'bell' },
    ],
  },
  {
    name: 'ത-വർഗം', en: 'Dental', letters: [
      { l: 'ത', iso: 'ta', ipa: 't̪a', word: 'തത്ത', meaning: 'parrot' },
      { l: 'ഥ', iso: 'tha', ipa: 't̪ʰa', word: 'രഥം', meaning: 'chariot' },
      { l: 'ദ', iso: 'da', ipa: 'd̪a', word: 'ദീപം', meaning: 'lamp' },
      { l: 'ധ', iso: 'dha', ipa: 'd̪ʱa', word: 'ധനം', meaning: 'wealth' },
      { l: 'ന', iso: 'na', ipa: 'n̪a', word: 'നദി', meaning: 'river' },
    ],
  },
  {
    name: 'പ-വർഗം', en: 'Labial', letters: [
      { l: 'പ', iso: 'pa', ipa: 'pa', word: 'പശു', meaning: 'cow' },
      { l: 'ഫ', iso: 'pha', ipa: 'pʰa', word: 'ഫലം', meaning: 'fruit' },
      { l: 'ബ', iso: 'ba', ipa: 'ba', word: 'ബലൂൺ', meaning: 'balloon' },
      { l: 'ഭ', iso: 'bha', ipa: 'bʱa', word: 'ഭരണി', meaning: 'jar' },
      { l: 'മ', iso: 'ma', ipa: 'ma', word: 'മയിൽ', meaning: 'peacock' },
    ],
  },
  {
    name: 'മധ്യമങ്ങൾ, ഊഷ്മാക്കൾ, ഘോഷി', en: 'Approximants, sibilants and more', letters: [
      { l: 'യ', iso: 'ya', ipa: 'ja', word: 'യാത്ര', meaning: 'journey' },
      { l: 'ര', iso: 'ra', ipa: 'ɾa', word: 'രാജാവ്', meaning: 'king' },
      { l: 'ല', iso: 'la', ipa: 'la', word: 'ലഡു', meaning: 'laddu' },
      { l: 'വ', iso: 'va', ipa: 'ʋa', word: 'വള്ളം', meaning: 'boat' },
      { l: 'ശ', iso: 'śa', ipa: 'ʃa', word: 'ശംഖ്', meaning: 'conch' },
      { l: 'ഷ', iso: 'ṣa', ipa: 'ʂa', word: 'ഷർട്ട്', meaning: 'shirt' },
      { l: 'സ', iso: 'sa', ipa: 'sa', word: 'സിംഹം', meaning: 'lion' },
      { l: 'ഹ', iso: 'ha', ipa: 'ɦa', word: 'ഹംസം', meaning: 'swan' },
      { l: 'ള', iso: 'ḷa', ipa: 'ɭa', word: 'വള', meaning: 'bangle' },
      { l: 'ഴ', iso: 'ḻa', ipa: 'ɻa', word: 'മഴ', meaning: 'rain' },
      { l: 'റ', iso: 'ṟa', ipa: 'ra', word: 'റാന്തൽ', meaning: 'lantern' },
    ],
  },
];

export const CHILLUS = [
  { l: 'ൺ', iso: 'ṇ', ipa: 'ɳ', word: 'കൺ', meaning: 'eye' },
  { l: 'ൻ', iso: 'n', ipa: 'n', word: 'അവൻ', meaning: 'he' },
  { l: 'ർ', iso: 'r', ipa: 'r', word: 'അവർ', meaning: 'they' },
  { l: 'ൽ', iso: 'l', ipa: 'l', word: 'കാൽ', meaning: 'leg' },
  { l: 'ൾ', iso: 'ḷ', ipa: 'ɭ', word: 'അവൾ', meaning: 'she' },
  { l: 'ൿ', iso: 'k', ipa: 'k', word: 'ദിൿ', meaning: 'direction' },
];

export const SIGNS = [
  { sign: 'ാ', iso: 'ā' }, { sign: 'ി', iso: 'i' }, { sign: 'ീ', iso: 'ī' }, { sign: 'ു', iso: 'u' },
  { sign: 'ൂ', iso: 'ū' }, { sign: 'ൃ', iso: 'r̥' }, { sign: 'െ', iso: 'e' }, { sign: 'േ', iso: 'ē' },
  { sign: 'ൈ', iso: 'ai' }, { sign: 'ൊ', iso: 'o' }, { sign: 'ോ', iso: 'ō' }, { sign: 'ൗ', iso: 'au' },
  { sign: 'ം', iso: 'ṁ' }, { sign: 'ഃ', iso: 'ḥ' }, { sign: '്', iso: '(no vowel)' },
];

export const CONJUNCTS = [
  { l: 'ക്ക', iso: 'kka', word: 'ചക്ക' }, { l: 'ങ്ങ', iso: 'ṅṅa', word: 'മാങ്ങ' }, { l: 'ച്ച', iso: 'cca', word: 'പൂച്ച' },
  { l: 'ഞ്ഞ', iso: 'ñña', word: 'മഞ്ഞ' }, { l: 'ട്ട', iso: 'ṭṭa', word: 'പട്ടം' }, { l: 'ണ്ണ', iso: 'ṇṇa', word: 'കണ്ണ്' },
  { l: 'ത്ത', iso: 'tta', word: 'തത്ത' }, { l: 'ന്ന', iso: 'nna', word: 'ഇന്ന്' }, { l: 'പ്പ', iso: 'ppa', word: 'അപ്പം' },
  { l: 'മ്മ', iso: 'mma', word: 'അമ്മ' }, { l: 'ല്ല', iso: 'lla', word: 'നല്ല' }, { l: 'ള്ള', iso: 'ḷḷa', word: 'വള്ളം' },
  { l: 'റ്റ', iso: 'ṟṟa', word: 'കാറ്റ്' }, { l: 'ന്റ', iso: 'nṟa', word: 'എന്റെ' }, { l: 'ങ്ക', iso: 'ṅka', word: 'പങ്ക' },
  { l: 'ഞ്ച', iso: 'ñca', word: 'അഞ്ച്' }, { l: 'ണ്ട', iso: 'ṇṭa', word: 'രണ്ട്' }, { l: 'ന്ത', iso: 'nta', word: 'ചന്ത' },
  { l: 'മ്പ', iso: 'mpa', word: 'കൊമ്പ്' }, { l: 'ക്ഷ', iso: 'kṣa', word: 'പക്ഷി' }, { l: 'ജ്ഞ', iso: 'jña', word: 'വിജ്ഞാനം' },
  { l: 'സ്ത', iso: 'sta', word: 'പുസ്തകം' }, { l: 'പ്ര', iso: 'pra', word: 'പ്രകാശം' }, { l: 'ക്യ', iso: 'kya', word: 'ഐക്യം' },
];

export const DIGITS = [
  { l: '൦', n: 0, word: 'പൂജ്യം' }, { l: '൧', n: 1, word: 'ഒന്ന്' }, { l: '൨', n: 2, word: 'രണ്ട്' },
  { l: '൩', n: 3, word: 'മൂന്ന്' }, { l: '൪', n: 4, word: 'നാല്' }, { l: '൫', n: 5, word: 'അഞ്ച്' },
  { l: '൬', n: 6, word: 'ആറ്' }, { l: '൭', n: 7, word: 'ഏഴ്' }, { l: '൮', n: 8, word: 'എട്ട്' }, { l: '൯', n: 9, word: 'ഒൻപത്' },
];
