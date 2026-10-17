// Turn an approved "Font info" issue into an entry in data/font-info.json.
// Usage: node scripts/add_font_info.mjs <issue-number>
// Then read the entry, tidy the wording, commit, and close the issue.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const REPO = 'Dexters-Hub/kalkandam';
const ROOT = new URL('..', import.meta.url).pathname;
const INFO = `${ROOT}data/font-info.json`;
const FIELD = { designer: 'designer', year: 'year', foundry: 'foundry' };

const number = Number(process.argv[2]);
if (!Number.isInteger(number) || number < 1) {
  console.error('Usage: node scripts/add_font_info.mjs <issue-number>');
  process.exit(1);
}

const issue = JSON.parse(execFileSync('gh', ['issue', 'view', String(number), '--repo', REPO, '--json', 'title,body'], { encoding: 'utf8' }));
const body = issue.body.replace(/\r/g, '').replace(/​/g, '');
const unquote = (s) => s.split('\n').map((l) => l.replace(/^> ?/, '')).join('\n').trim();

// Two formats: the site form (bold labels, quoted text) and the GitHub issue form (### headings).
function parse() {
  if (/^### Font\s*$/m.test(body) && !body.includes('Sent from the form on kalkandam.in')) {
    const section = (name) => {
      const m = body.match(new RegExp(`### ${name}[^\\n]*\\n+([\\s\\S]*?)(?=\\n### |$)`));
      const v = m ? m[1].trim() : '';
      return v === '_No response_' ? '' : v;
    };
    const kinds = { 'Who designed it': 'designer', 'When it was made': 'year', 'Foundry or publisher': 'foundry', 'Its licence or terms of use': 'licence', 'A story or history': 'story', 'A correction': 'correction' };
    return { font: section('Font'), kind: kinds[section('What do you know\\?')] || 'other', details: section('Details'), source: section('Source link'), name: section('Name to credit you as') };
  }
  // Labels are matched at the start of a line, outside the details block, so text inside it can't fake them.
  const fenced = body.match(/^\*\*Details\*\*\n```text\n([\s\S]*?)\n```$/m);
  const outside = fenced ? body.replace(fenced[0], '') : body;
  const line = (label) => (outside.match(new RegExp(`^\\*\\*${label}:\\*\\* ?(.*)$`, 'm')) || [])[1]?.trim() || '';
  const bare = (v) => v.replace(/^`|`$/g, '');
  // Older issues quoted the details with "> " instead of a code block.
  const quoted = (outside.match(/^\*\*Details\*\*\n((?:>.*\n?)+)/m) || [])[1] || '';
  return {
    font: bare(line('Font')),
    kind: line('About') || 'other',
    details: fenced ? fenced[1].trim() : unquote(quoted),
    source: line('Source').replace(/^<|>$/g, ''),
    name: bare(line('Credit as')),
  };
}

const note = parse();
const fonts = JSON.parse(readFileSync(`${ROOT}data/fonts.json`, 'utf8'));
const keys = new Set(fonts.map((f) => `${f.family} (${f.collection})`));
if (!keys.has(note.font)) {
  console.error(`"${note.font}" is not a font in the catalogue. Fix the name, e.g. "Karthika (ML-TT)", then add it by hand.`);
  process.exit(1);
}
if (note.source && !/^https?:\/\//.test(note.source)) note.source = '';

const info = JSON.parse(readFileSync(INFO, 'utf8'));
const entry = info.fonts[note.font] || {};
const field = FIELD[note.kind] || 'story';
entry[field] = entry[field] ? `${entry[field]}\n${note.details}` : note.details;
if (note.source && !entry.source) entry.source = note.source;
if (note.name) entry.addedBy = [...new Set([...(entry.addedBy || []), note.name])];
entry.issues = [...new Set([...(entry.issues || []), number])];
info.fonts[note.font] = entry;
writeFileSync(INFO, `${JSON.stringify(info, null, 2)}\n`);

console.log(`Added issue #${number} to "${note.font}" as ${field}:`);
console.log(JSON.stringify(entry, null, 2));
console.log('\nShorten the text to just the fact (e.g. "designer": "Name"), then commit.');
