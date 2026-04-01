#!/usr/bin/env node
'use strict';
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('./index.html', 'utf8');
const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];

// Stub all browser globals needed for script initialisation
const el = () => ({
  checked: true,
  value: '',
  innerHTML: '',
  textContent: '',
  addEventListener: () => {},
  setAttribute: () => {},
  getAttribute: () => null,
  removeAttribute: () => {},
  attributes: [],
  classList: { toggle: () => {} },
  querySelectorAll: () => [],
});

const ctx = {
  console,
  DOMParser: class {
    parseFromString(html) {
      // Minimal stub: return the HTML as-is (sanitizeHTML is not under test)
      return {
        body: { innerHTML: html },
        querySelectorAll: () => [],
      };
    }
  },
  document: {
    getElementById: () => el(),
    querySelectorAll: () => [],
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  navigator: {},
  ClipboardItem: class {},
};
vm.createContext(ctx);
vm.runInContext(script, ctx);

const { convertToMrkdwn, convertToHTML } = ctx;
const opts = { stripLeading: true, unwrap: true, stripAnsi: true, normalizeIndent: true };

let pass = 0, fail = 0;
function assert(desc, actual, expected) {
  if (actual === expected) {
    console.log(`  ✓ ${desc}`);
    pass++;
  } else {
    console.error(`  ✗ ${desc}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    fail++;
  }
}

console.log('\nHeadings');
assert('h3 with leading space → *bold*',      convertToMrkdwn(' ### Root Cause', opts),    '*Root Cause*');
assert('h2 without leading space → *bold*',   convertToMrkdwn('## Summary', opts),          '*Summary*');
assert('h1 → *bold*',                         convertToMrkdwn('# Title', opts),              '*Title*');

// Real-world multi-line document (the exact pattern the user pastes from Claude Code)
const doc = `## Investigation Summary

 ### Root Cause

 A backfill triggered a cascading side effect.

 ### What went wrong

 When a record is created, the consumer picks it up.`;

const docResult = convertToMrkdwn(doc, opts);
const docLines = docResult.split('\n').filter(l => l.trim());
assert('doc: h2 converted',          docLines[0], '*Investigation Summary*');
assert('doc: h3 with space converted', docLines[1], '*Root Cause*');
assert('doc: paragraph stripped',    docLines[2], 'A backfill triggered a cascading side effect.');
assert('doc: second h3 converted',   docLines[3], '*What went wrong*');

assert('h3 with non-breaking space → *bold*', convertToMrkdwn('\u00A0### Root Cause', opts), '*Root Cause*');

console.log('\nLeading whitespace');
assert('paragraph leading space stripped',    convertToMrkdwn(' A paragraph.', opts),        'A paragraph.');
assert('no stripping when option off',        convertToMrkdwn(' A paragraph.', { ...opts, stripLeading: false }), ' A paragraph.');

console.log('\nInline formatting');
assert('bold **text**',                       convertToMrkdwn('**bold**', opts),              '*bold*');
assert('italic _text_',                       convertToMrkdwn('_italic_', opts),              '_italic_');
assert('strikethrough ~~text~~',              convertToMrkdwn('~~strike~~', opts),            '~strike~');
assert('inline code',                         convertToMrkdwn('use `foo()`', opts),           'use `foo()`');
assert('link',                                convertToMrkdwn('[Go1](https://go1.com)', opts), '<https://go1.com|Go1>');

console.log('\nBlock elements');
assert('unordered list bullet',               convertToMrkdwn('- item', opts),                '• item');
assert('hr → separator',                      convertToMrkdwn('---', opts),                   '———');
assert('task unchecked',                      convertToMrkdwn('- [ ] todo', opts),             '• ☐ todo');
assert('task checked',                        convertToMrkdwn('- [x] done', opts),             '• ☑ done');

console.log('\nHTML preview (convertToHTML)');
assert('h3 with leading space → <h1>',   convertToHTML(' ### Root Cause', opts), '<h1>Root Cause</h1>');
assert('h2 → <h1>',                      convertToHTML('## Summary', opts),      '<h1>Summary</h1>');
assert('paragraph stripped in HTML',     convertToHTML(' A paragraph.', opts),   '<p>A paragraph.</p>');

// Print the full mrkdwn output of the real document so we can see exactly what's produced
console.log('\n── Full document output ──');
const fullDoc = `## Investigation Summary: 46K Award Enrolments moved to In-Progress on March 20th

 ### Root Cause

 A gc_enrolment backfill for award plans triggered a cascading side effect through the award service's hierarchy that moved 46,651 award enrolments from \`not-started\` to \`in-progress\` without any learner activity.

 ### Background

 Before late January 2026, the enrolment service did not create \`gc_enrolment\` records for award-type plans.`;

const fullResult = convertToMrkdwn(fullDoc, opts);
console.log(JSON.stringify(fullResult));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
