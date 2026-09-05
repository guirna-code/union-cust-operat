import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { extractCommitmentSource, extractAxisSource, axisSourceRanges } from '../src/lib/programme-source.ts';

const source = await readFile(new URL('../chat.md', import.meta.url), 'utf8');
const chapterHeadings = [...source.matchAll(/^\*\*(الالتزام الوطني .+?)\*\*/gm)];
const slugs = ['productive-economy', 'social-equity', 'regional-justice', 'trust-and-influence'];
const clean = text => text.split(/\r?\n/).map(line => line.trim().replace(/\\$/, '').replace(/^\*\*(.+)\*\*$/, '$1').replace(/^•\s*/, '').replace(/^\d+\.\s*/, '')).join(' ').replace(/\s+/g, ' ').trim();
const flatten = blocks => blocks.flatMap(block => block.kind === 'list' ? block.items : [block.text, ...(block.items ?? [])]).join(' ').replace(/\s+/g, ' ').trim();

test('all four complete national chapters are mapped in source order', () => {
  assert.equal(chapterHeadings.length, 4);
  for (const [index, slug] of slugs.entries()) {
    const start = chapterHeadings[index].index;
    const end = chapterHeadings[index + 1]?.index ?? source.indexOf('**السياسات القطاعية الداعمة**');
    const chapter = extractCommitmentSource(source, slug);
    assert.equal(chapter.language, 'ar');
    assert.equal(chapter.blocks[0].text, chapterHeadings[index][1]);
    assert.equal(flatten(chapter.blocks), clean(source.slice(start, end)), slug);
    assert(chapter.blocks.some(block => block.text === 'خاتمة الالتزام'), `${slug}: missing conclusion`);
  }
});

test('social-equity includes all nine sections, including the end of the chapter', () => {
  const blocks = extractCommitmentSource(source, 'social-equity').blocks;
  const sections = blocks.filter(block => block.kind === 'heading' && /^(أولا|ثانيا|ثالثا|رابعا|خامسا|سادسا|سابعا|ثامنا|تاسعا):/.test(block.text));
  assert.equal(sections.length, 9);
  assert.equal(sections.at(-1).text, 'تاسعا: إعادة إدماج السجناء والمفرج عنهم');
  assert.equal(blocks.at(-1).text, 'وبذلك تشكل الأساس الاجتماعي الضروري لأي إقلاع اقتصادي حقيقي.');
});

test('all ten axes still have nonempty source content', () => {
  assert.equal(Object.keys(axisSourceRanges).length, 10);
  for (const slug of Object.keys(axisSourceRanges)) assert(extractAxisSource(source, slug).blocks.length > 0);
});

test('missing chapter boundaries fail explicitly instead of truncating content', () => {
  const altered = source.replace(chapterHeadings[2][0], '');
  assert.throws(() => extractCommitmentSource(altered, 'social-equity'), /Expected one chat.md heading/);
});
