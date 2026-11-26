const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

// 线上回归（2026-11-26）：超星作业/考试的听力大题换成 .readComprehensionQues > .reading_answer，
// 脚本只认旧类名 .readCompreHensionItem，整道大题解析成 0 个小题 → 每道小题都报「答案与页面选项对不上」。
const source = fs.readFileSync(path.join(__dirname, '../script.user.js'), 'utf8');
const start = source.indexOf('  const PP_CX_READ_ITEM_LEGACY');
const end = source.indexOf('  class CxQuestionHandler extends QuestionProcessor {', start);
assert(start >= 0 && end > start, '缺少阅读/听力小题解析工具函数');
const { ppCxReadItems, ppCxReadItemIsLegacy, ppCxReadItemType, ppCxReadOptionNodes } = vm.runInNewContext(
  source.slice(start, end) + '\n({ ppCxReadItems, ppCxReadItemIsLegacy, ppCxReadItemType, ppCxReadOptionNodes })',
  {},
);

function fakeNode({ selectors = {}, classes = [], attrs = {} } = {}) {
  return {
    classList: { contains: (name) => classes.includes(name) },
    getAttribute: (name) => (Object.prototype.hasOwnProperty.call(attrs, name) ? String(attrs[name]) : null),
    querySelectorAll: (selector) => selectors[selector] || [],
    querySelector: (selector) => (selectors[selector] || [])[0] || null,
  };
}

const legacySelector = '.readCompreHensionItem';
const modernSelector = '.readComprehensionQues .reading_answer, .readCompreHensionQues .reading_answer';

test('新版听力大题按 .readComprehensionQues .reading_answer 取到全部小题', () => {
  const subs = [fakeNode(), fakeNode(), fakeNode(), fakeNode(), fakeNode()];
  const root = fakeNode({
    selectors: {
      [legacySelector]: [],
      [modernSelector]: subs,
    },
  });
  assert.deepEqual(Array.from(ppCxReadItems(root)), subs);
});

test('旧版 .readCompreHensionItem 仍然优先，且不会被新版选择器顶掉', () => {
  const legacy = [fakeNode()];
  const modern = [fakeNode(), fakeNode()];
  const root = fakeNode({
    selectors: {
      [legacySelector]: legacy,
      [modernSelector]: modern,
    },
  });
  assert.deepEqual(Array.from(ppCxReadItems(root)), legacy);
  assert.equal(ppCxReadItemIsLegacy(legacy[0]), false);
  assert.equal(ppCxReadItemIsLegacy(fakeNode({ classes: ['readCompreHensionItem'] })), true);
});

test('没有外层容器时按 .reading_answer 兜底，空文档返回空数组', () => {
  const fallback = [fakeNode(), fakeNode()];
  assert.deepEqual(Array.from(ppCxReadItems(fakeNode({ selectors: { '.reading_answer': fallback } }))), fallback);
  assert.equal(ppCxReadItems(fakeNode()).length, 0);
  assert.equal(ppCxReadItems(null).length, 0);
});

test('新版小题题型取 qtype 属性，缺省按单选', () => {
  assert.equal(ppCxReadItemType(fakeNode({ attrs: { qtype: '0' } })), '0');
  assert.equal(ppCxReadItemType(fakeNode({ attrs: { qtype: '1' } })), '1');
  assert.equal(ppCxReadItemType(fakeNode({ attrs: { qtype: '3' } })), '3');
  assert.equal(ppCxReadItemType(fakeNode()), '0');
  assert.equal(ppCxReadItemType(fakeNode({ attrs: { qtype: 'A' } })), '0');
});

test('新版选项行取 .stem_answer .hoverDiv（onclick=addChoice 的那一行）', () => {
  const rows = [fakeNode(), fakeNode(), fakeNode(), fakeNode()];
  assert.deepEqual(Array.from(ppCxReadOptionNodes(fakeNode({ selectors: { '.stem_answer .hoverDiv': rows } }))), rows);
  const fallbackRows = [fakeNode()];
  assert.deepEqual(
    Array.from(ppCxReadOptionNodes(fakeNode({ selectors: { '.stem_answer .clearfix': fallbackRows } }))),
    fallbackRows,
  );
  assert.equal(ppCxReadOptionNodes(null).length, 0);
});

test('小题解析改成调用统一入口，避免再次退回旧类名', () => {
  assert.match(source, /const subItems = ppCxReadItems\(questionElement\);/);
  assert.match(source, /elements: optionNodes,/);
  assert.match(source, /input: subItem\.querySelector\('input\[id\^="answer"\]'\)/);
});
