const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(require.resolve('../script.user.js'), 'utf8');

function section(start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first + start.length);
  assert(first >= 0 && last > first, `${start} to ${end}`);
  return source.slice(first, last);
}

const { useProgressStore } = vm.runInNewContext([
  section('  const useProgressStore = pinia.defineStore', '  const PP_ICONS'),
  '({ useProgressStore })',
].join('\n'), {
  pinia: {
    defineStore(name, options) {
      return function createStore() {
        const store = options.state();
        Object.keys(options.actions).forEach((key) => {
          store[key] = options.actions[key].bind(store);
        });
        return store;
      };
    },
  },
});

test('switching from answering to media clears the answering-only fields', () => {
  const store = useProgressStore();
  store.update({ type: '答题', taskName: '章节测验', questionTotal: 20, questionIndex: 20, percent: 62 });
  store.update({ type: '视频', taskName: '周知识介绍', percent: 9, currentTime: 17, totalTime: 193, isPlaying: true });
  assert.equal(store.type, '视频');
  assert.equal(store.questionTotal, 0);
  assert.equal(store.questionIndex, 0);
  assert.equal(store.filledCount, 0);
  assert.equal(store.fillRate, 0);
  assert.equal(store.percent, 9);
  assert.equal(store.currentTime, 17);
});

test('switching from media to answering clears the media-only fields', () => {
  const store = useProgressStore();
  store.update({ type: '视频', currentTime: 17, totalTime: 193, percent: 9 });
  store.update({ type: '答题', questionTotal: 5, questionIndex: 1, percent: 0 });
  assert.equal(store.type, '答题');
  assert.equal(store.currentTime, 0);
  assert.equal(store.totalTime, 0);
  assert.equal(store.questionTotal, 5);
  assert.equal(store.questionIndex, 1);
});

test('fields supplied in the same update survive the type switch', () => {
  const store = useProgressStore();
  store.update({ type: '视频', currentTime: 5, totalTime: 10 });
  store.update({ type: '答题', questionTotal: 3, questionIndex: 1, currentTime: 7, totalTime: 12 });
  assert.equal(store.questionTotal, 3);
  assert.equal(store.currentTime, 7);
  assert.equal(store.totalTime, 12);
});

test('same-type progress updates keep their counters', () => {
  const store = useProgressStore();
  store.update({ type: '答题', questionTotal: 10, questionIndex: 3 });
  store.update({ type: '答题', questionIndex: 4 });
  assert.equal(store.questionTotal, 10);
  assert.equal(store.questionIndex, 4);
});

test('reset clears task state but keeps the answer threshold defaults untouched', () => {
  const store = useProgressStore();
  store.update({ type: '答题', questionTotal: 10, questionIndex: 4, percent: 40, remainingCount: 12 });
  store.reset('等待任务开始');
  assert.equal(store.type, '-');
  assert.equal(store.questionTotal, 0);
  assert.equal(store.percent, 0);
  assert.equal(store.detail, '等待任务开始');
  assert.equal(store.remainingCount, null);
});
