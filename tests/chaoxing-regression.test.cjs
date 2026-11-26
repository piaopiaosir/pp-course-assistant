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
const { advance, createQueue } = vm.runInNewContext([
  section('  const PP_CX_LOGIN_WARNING', '  const useCxChapterLogic'),
  section('function createPPChaoxingQueue(', 'function createPPZhsQueue('),
  '({ advance: ppCxAdvanceTaskPage, createQueue: createPPChaoxingQueue })'
].join('\n'), { URL, URLSearchParams, AbortController, setTimeout, clearTimeout });

const next = '#prevNextFocusNext';
const outer = '.jb_btn.jb_btn_92.fr.fs14.nextChapter';
const confirmNext = '.jobFinishTip .nextChapter';
const tabs = '#prev_tab .prev_ul li';
const chapters = '.posCatalog_select:not(.firstLayer)';
function button(settings = {}) {
  return {
    isConnected: true, style: {}, clicks: 0,
    closest: () => null, getClientRects: () => [{}], click() { this.clicks++; }, ...settings
  };
}
function activeClass(active) {
  return { classList: { contains: () => active } };
}
function makeDoc(selectors = {}) {
  return {
    title: '', querySelector: () => null,
    querySelectorAll: (selector) => selectors[selector] || [],
    defaultView: { getComputedStyle: () => ({}) }
  };
}

for (const mode of ['normal', 'queue']) {
  test(`${mode} chooses the current task's visible Next button after the wait`, async () => {
    const stale = button();
    const hidden = button({ style: { display: 'none' } });
    const fresh = button();
    const selectors = { [next]: [stale], [outer]: [hidden], [tabs]: [activeClass(true), activeClass(false)] };
    const result = await advance({
      doc: makeDoc(selectors), getMode: () => mode, isCurrent: () => true,
      wait: async () => { selectors[next] = [fresh]; }, onEnd: assert.fail, onLogin: assert.fail
    });
    assert.equal(result, 'clicked');
    assert.equal(fresh.clicks, 1);
    assert.equal(stale.clicks + hidden.clicks, 0);
  });
}

test('normal mode does not advance from a stale scan or after the user switches auto-next off', async () => {
  const target = button();
  const doc = makeDoc({ [next]: [target] });
  for (const changes of ['page', 'preference']) {
    let waiting = true;
    const result = await advance({
      doc, isCurrent: () => waiting || changes !== 'page', getMode: () => waiting || changes !== 'preference' ? 'normal' : 'off',
      wait: async () => { waiting = false; }, onEnd: assert.fail, onLogin: assert.fail
    });
    assert.equal(result, changes === 'page' ? 'changed' : 'off');
  }
  assert.equal(target.clicks, 0);
});

test('a login warning in the card stops either mode before the click', async () => {
  const target = button();
  const doc = makeDoc({ [next]: [target] });
  for (const mode of ['normal', 'queue']) {
    const cardDoc = makeDoc();
    let pauses = 0;
    const result = await advance({
      doc, cardDoc, isCurrent: () => true, getMode: () => mode,
      wait: async () => { cardDoc.title = '检测到其他设备登录'; }, onEnd: assert.fail, onLogin: () => { pauses++; }
    });
    assert.equal(result, 'login');
    assert.equal(pauses, 1);
  }
  assert.equal(target.clicks, 0);
});

test('an advance waiting for its first click cannot change between queue and normal mode', async () => {
  for (const [before, after] of [['normal', 'queue'], ['queue', 'normal'], ['normal', 'held']]) {
    const target = button();
    let mode = before;
    const result = await advance({
      doc: makeDoc({ [next]: [target] }), getMode: () => mode, isCurrent: () => true,
      wait: async () => { mode = after; }, onEnd: assert.fail, onLogin: assert.fail
    });
    assert.equal(result, 'changed');
    assert.equal(target.clicks, 0);
  }
});

for (const mode of ['normal', 'queue']) {
  test(`${mode} confirms the platform's incomplete-task dialog after clicking Next`, async () => {
    const confirm = button({ textContent: '下一节' });
    const data = {};
    const target = button({ click() { this.clicks++; } });
    const unrelated = button({ textContent: '下一节' });
    data[next] = [target];
    data['.nextChapter'] = [unrelated];
    const result = await advance({
      doc: makeDoc(data), getMode: () => mode, isCurrent: () => true,
      wait: async () => { if (target.clicks) data[confirmNext] = [confirm]; },
      onEnd: assert.fail, onLogin: assert.fail
    });
    assert.equal(result, 'clicked');
    assert.equal(target.clicks, 1);
    assert.equal(confirm.clicks, 1);
    assert.equal(unrelated.clicks, 0);
  });
}

for (const mode of ['normal', 'queue']) {
  test(`${mode} confirms only a visible unfinished-task maskDiv`, async () => {
    const target = button();
    const hidden = button({ textContent: '下一节' });
    const unrelated = button({ textContent: '下一节', closest: selector => selector === '.maskDiv' ? {} : null });
    const confirm = button({ textContent: ' 下一节 ' });
    const dialog = (textContent, child, visible = true) => button({
      textContent, getClientRects: () => visible ? [{}] : [], querySelectorAll: () => [child]
    });
    const selectors = { [next]: [target], '.nextChapter': [unrelated] };
    await advance({
      doc: makeDoc(selectors), getMode: () => mode, isCurrent: () => true,
      wait: async () => {
        if (target.clicks) selectors['.maskDiv'] = [
          dialog('章节笔记未保存', unrelated), dialog('当前章节还有任务点未完成', hidden, false),
          dialog('当前章节还有任务点未完成', confirm),
        ];
      }, onEnd: assert.fail, onLogin: assert.fail
    });
    assert.equal(target.clicks, 1);
    assert.equal(confirm.clicks, 1);
    assert.equal(hidden.clicks + unrelated.clicks, 0);
    delete selectors[next];
    selectors['.maskDiv'].pop();
    const result = await advance({
      doc: makeDoc({ ...selectors, [tabs]: [activeClass(true), activeClass(false)] }),
      getMode: () => mode, isCurrent: () => true, wait: async () => {}, onEnd: assert.fail, onLogin: assert.fail
    });
    assert.equal(result, 'missing');
    assert.equal(unrelated.clicks, 0);
  });
}

test('an already-visible incomplete-task dialog is confirmed without clicking behind it', async () => {
  const target = button();
  const hidden = button({ textContent: '下一节', getClientRects: () => [] });
  const stay = button({ textContent: '去学习' });
  const confirm = button({ textContent: ' 下一节 ' });
  await advance({
    doc: makeDoc({ [next]: [target], [confirmNext]: [hidden, stay, confirm] }),
    getMode: () => 'normal', isCurrent: () => true,
    wait: async () => {}, onEnd: assert.fail, onLogin: assert.fail
  });
  assert.equal(confirm.clicks, 1);
  assert.equal(target.clicks + hidden.clicks + stay.clicks, 0);
});

test('a pending normal confirmation does not survive navigation, new queue ownership, opt-out, or login warnings', async () => {
  for (const reason of ['changed', 'held', 'off', 'login']) {
    const target = button();
    const confirm = button({ textContent: '下一节' });
    const data = { [next]: [target] };
    const cardDoc = makeDoc();
    let interrupted = false;
    let pauses = 0;
    const result = await advance({
      doc: makeDoc(data), cardDoc,
      getMode: () => interrupted && ['held', 'off'].includes(reason) ? reason : 'normal',
      isCurrent: () => !(interrupted && reason === 'changed'),
      wait: async () => {
        if (!target.clicks) return;
        data[confirmNext] = [confirm];
        interrupted = true;
        if (reason === 'login') cardDoc.title = '检测到其他设备登录';
      },
      onEnd: assert.fail, onLogin: () => { pauses++; }
    });
    assert.equal(target.clicks, 1);
    assert.equal(confirm.clicks, 0);
    assert.equal(pauses, reason === 'login' ? 1 : 0);
    if (reason === 'held') assert.equal(result, 'changed');
  }
});

test('queue verifies course completion only on the final task tab', async () => {
  const data = { [tabs]: [activeClass(true), activeClass(false)] };
  const target = button();
  let end = 0;
  const options = {
    doc: makeDoc(data), getMode: () => 'queue', isCurrent: () => true,
    wait: async () => {}, onEnd: () => { end++; }, onLogin: assert.fail
  };
  assert.equal(await advance(options), 'missing');
  assert.equal(end, 0);
  data[tabs] = [activeClass(false), activeClass(true)];
  data[chapters] = [activeClass(true)];
  data[next] = [target];
  const confirm = button({ textContent: '下一节' });
  data[confirmNext] = [confirm];
  assert.equal(await advance(options), 'end');
  assert.equal(end, 1);
  assert.equal(target.clicks + confirm.clicks, 0);
});

const portal = 'https://mooc1-1.chaoxing.com';
const study = 'https://mooc1.chaoxing.com/mycourse/studentstudy?courseid=10&clazzid=20&cpi=30&chapterId=40';
const course = portal + '/mycourse/stu?courseid=10&clazzid=20&cpi=30&enc=abc';

function queuePanel(href, { status = 'idle', discover = assert.fail } = {}) {
  const page = { href, document: makeDoc() };
  const queue = createQueue({ getPage: () => page });
  const mounted = [];
  const ref = (value) => ({ value });
  const panel = vm.runInNewContext([
    section('  const PP_CX_COURSES_URL =', '  const cxAnswerPageLogic ='),
    'PpCxQueuePanel'
  ].join('\n'), {
    vue: {
      defineComponent: (component) => component, ref, shallowRef: ref,
      computed: (get) => ({ get value() { return get(); } }),
      onMounted: (run) => mounted.push(run),
      h: (type, props, children) => ({ type, props, children })
    },
    useConfigStore: () => ({}), ppIcon: () => null, ppCxQueueState: ref(null)
  });
  const items = status === 'idle' ? [] : [{ key: '10_20', title: 'Fixture course', status: 'active' }];
  const render = panel.setup({ platform: 'cx', controller: {
    pageRole: queue.pageRole, discover, snapshot: () => ({ status, items, activeKey: '10_20' })
  } });
  mounted.forEach((run) => run());
  function* content(value) {
    if (Array.isArray(value)) {
      for (const item of value) yield* content(item);
    } else if (value && value.type !== 'style') {
      yield value;
      if (value.children) yield* content(value.children);
    }
  }
  return {
    text: () => [...content(render())].filter((node) => typeof node === 'string').join(' '),
    find: (test) => [...content(render())].find((node) => test(node))
  };
}

test('an idle course page offers the course list link without trying to discover courses', () => {
  let reads = 0;
  for (const href of [study, course, `${portal}/mycourse/studentcourse`, `${portal}/visit/stucoursemiddle`]) {
    const panel = queuePanel(href, { discover: async () => { reads++; return { items: [] }; } });
    assert.match(panel.text(), /请返回学习通课程列表添加课程/);
    assert.doesNotMatch(panel.text(), /正在读取课程列表/);
    assert.equal(panel.find((node) => node.type === 'a').props.href, 'https://mooc1.chaoxing.com/visit/courses');
    assert.equal(panel.find((node) => node.props?.title === '刷新课程列表'), undefined);
  }
  assert.equal(reads, 0);
});

test('the course list entry loads courses and only reports loading while discovery is pending', async () => {
  let resolveDiscovery;
  const discovery = new Promise((resolve) => { resolveDiscovery = resolve; });
  const panel = queuePanel('https://mooc1.chaoxing.com/visit/courses', { discover: () => discovery });
  assert.match(panel.text(), /正在读取课程列表/);
  resolveDiscovery({ items: [], errors: [] });
  await new Promise(setImmediate);
  assert.match(panel.text(), /没有读取到课程/);
  assert.doesNotMatch(panel.text(), /请返回学习通课程列表|正在读取课程列表/);
});

test('running and paused queues keep their controls on the study page', () => {
  for (const [status, control] of [['running', '暂停'], ['paused', '继续学习']]) {
    const panel = queuePanel(study, { status });
    assert.ok(panel.find((node) => node.type === 'button' && node.children === control));
    assert.match(panel.text(), /Fixture course/);
    assert.doesNotMatch(panel.text(), /请返回学习通课程列表|正在读取课程列表/);
  }
});

const key = 'pp:chaoxing-queue:v1';
function queueFixture(href = study, overrides = {}) {
  const page = { href, document: makeDoc(), window: {} };
  const item = { key: '10_20', status: 'active', resolved: true, entryUrl: course, trainingRefs: [] };
  const values = new Map([[key, JSON.stringify({
    revision: 'fixture', ownerId: 'owner', status: 'running', activeKey: item.key, arrived: true, items: [item],
    context: { origin: portal, key: item.key, enc: 'abc', cpi: '30', courseId: '10', clazzId: '20' }
  })]]);
  const requests = [];
  const nav = [];
  const queue = createQueue({
    getPage: () => page, getOwnerId: () => 'owner', getValue: (key, fallback) => values.get(key) ?? fallback,
    setValue: (key, value) => values.set(key, value), navigate: (href) => nav.push(href), now: () => 10000,
    request: async (spec) => { requests.push(spec); return { status: 200, text: '', finalUrl: spec.url }; },
    ...overrides
  });
  return { page, queue, requests, nav, values };
}

test('queue does not poll the portal from the study page and verifies the course through normal navigation at the end', async () => {
  const { queue, requests, nav } = queueFixture();
  assert.equal((await queue.discover()).items.length, 0);
  await queue.tick();
  assert.equal(queue.ownsCurrentCourse(), true);
  assert.deepEqual(requests, []);
  assert.deepEqual(nav, []);
  queue.noteStudyEnd(study);
  await new Promise(setImmediate);
  assert.deepEqual(requests, []);
  assert.deepEqual(nav, [course]);
  assert.equal(queue.snapshot().verifyChapter, '40');
  assert.equal(queue.snapshot().items[0].status, 'active');
});

test('when tab APIs are absent, same-origin reloads keep ownership without taking over another tab', async () => {
  const initial = queueFixture();
  const positions = new Map();
  const storage = { getItem: (key) => positions.get(key), setItem: (key, value) => positions.set(key, value) };
  const config = {
    getPage: () => initial.page, getValue: (key, fallback) => initial.values.get(key) ?? fallback,
    setValue: (key, value) => initial.values.set(key, value)
  };
  initial.page.window.sessionStorage = storage;
  const first = createQueue(config);
  await first.resume();
  const reload = createQueue(config);
  await reload.tick();
  assert.equal(reload.ownsCurrentCourse(), true);
  initial.page.window.sessionStorage = { getItem: () => null, setItem: () => {} };
  const anotherTab = createQueue(config);
  await anotherTab.tick();
  assert.equal(anotherTab.ownsCurrentCourse(), false);
});

test('queue pauses on a warning page or a login response without dropping the active course', async () => {
  const example = queueFixture(course);
  example.page.document.title = '检测到其他设备登录';
  const first = await example.queue.tick();
  assert.equal(first.status, 'paused');
  assert.equal(first.items[0].status, 'active');
  assert.equal((await example.queue.resume()).status, 'paused');
  assert.deepEqual(example.requests, []);
  assert.deepEqual(example.nav, []);

  let requests = 0;
  const second = queueFixture(course, { request: async () => { requests++; return { status: 401 }; } });
  assert.equal((await second.queue.tick()).status, 'paused');
  assert.equal((await second.queue.tick()).items[0].status, 'active');
  assert.equal(requests, 1);
  assert.deepEqual(second.nav, []);
});

test('a login warning appearing during the catalog request prevents navigation', async () => {
  let release;
  let started;
  const requestStarted = new Promise((resolve) => { started = resolve; });
  const { page, queue, nav } = queueFixture(course, {
    request: (spec) => new Promise((resolve) => { release = () => resolve({ status: 200, text: '', finalUrl: spec.url }); started(); }),
    parseHtml: () => ({ querySelectorAll: () => [] })
  });
  const tick = queue.tick();
  await requestStarted;
  page.document.title = '检测到其他浏览器登录';
  release();
  assert.equal((await tick).status, 'paused');
  assert.deepEqual(nav, []);
});

test('an explicit resume after manual recovery preserves the active course', async () => {
  const { queue, page, requests, nav } = queueFixture();
  page.document.title = '异端登录';
  assert.equal((await queue.tick()).status, 'paused');
  assert.equal(queue.blocksStudyAdvance(), true);
  page.document.title = '';
  await queue.tick();
  assert.equal(queue.snapshot().status, 'paused');
  assert.equal((await queue.resume()).activeKey, '10_20');
  assert.equal(queue.ownsCurrentCourse(), true);
  assert.equal(queue.blocksStudyAdvance(), false);
  assert.deepEqual(requests, []);
  assert.deepEqual(nav, []);
});

test('pausing blocks only the active course in the queue owner tab', async () => {
  const { queue, page, values, nav } = queueFixture();
  await queue.tick();
  queue.pause();
  assert.equal(queue.ownsCurrentCourse(), false);
  assert.equal(queue.blocksStudyAdvance(), true);
  const otherTab = createQueue({
    getPage: () => page, getOwnerId: () => 'other-owner',
    getValue: (key, fallback) => values.get(key) ?? fallback,
  });
  await new Promise(setImmediate);
  assert.equal(otherTab.blocksStudyAdvance(), false);
  page.href = study.replace('courseid=10', 'courseid=11');
  assert.equal(queue.blocksStudyAdvance(), false);
  page.href = study;
  await queue.resume();
  assert.equal(queue.blocksStudyAdvance(), false);
  assert.equal(queue.ownsCurrentCourse(), true);
  assert.deepEqual(nav, []);
});

test('queue marks a course done only after the platform catalog confirms completion', async () => {
  const doneChapter = {
    getAttribute: (name) => name === 'onclick' ? 'toOld(10, 40)' : '',
    querySelector: (selector) => selector === '.icon_yiwanc' ? {} : null
  };
  const nextCourse = portal + '/mycourse/stu?courseid=11&clazzid=21&cpi=30&enc=xyz';
  const fixture = queueFixture(course, {
    parseHtml: () => makeDoc({ ['.chapter_item[onclick*="toOld"]']: [doneChapter] }),
    request: async (spec) => {
      assert.equal(new URL(spec.url).origin, portal);
      assert.equal(spec.document, fixture.page.document);
      return { status: 200, text: '', finalUrl: spec.url };
    }
  });
  const state = JSON.parse(fixture.values.get(key));
  state.verifyChapter = '40';
  state.items.push({ key: '11_21', status: 'queued', resolved: true, entryUrl: nextCourse, trainingRefs: [] });
  fixture.values.set(key, JSON.stringify(state));
  const result = await fixture.queue.tick();
  assert.equal(result.items[0].status, 'done');
  assert.equal(result.activeKey, '11_21');
  assert.deepEqual(fixture.nav, [nextCourse]);
});

function catalogRow(id, status) {
  return {
    getAttribute: (name) => name === 'onclick' ? 'toOld(10, ' + id + ')' : '',
    querySelector: (selector) => {
      if (status === 'pending' && selector === 'input.knowledgeJobCount') return { value: '1' };
      if (status === 'done' && selector === '.icon_yiwanc') return {};
      return null;
    }
  };
}

function queueEndFixture(href, getRows, now, { more = true } = {}) {
  const getCatalog = () => makeDoc({ ['.chapter_item[onclick*="toOld"]']: getRows() });
  const fixture = queueFixture(href, { parseHtml: getCatalog, now });
  if (href === study) fixture.page.document.querySelectorAll = selector => getCatalog().querySelectorAll(selector);
  const state = JSON.parse(fixture.values.get(key));
  if (href === course) state.verifyChapter = '40';
  state.items[0].trainingRefs.push({ origin: portal, planId: '1', taskId: '2' });
  const nextCourse = course.replace('courseid=10&clazzid=20', 'courseid=11&clazzid=21');
  if (more) state.items.push({ key: '11_21', status: 'queued', resolved: true, entryUrl: nextCourse, trainingRefs: [] });
  fixture.values.set(key, JSON.stringify(state));
  return { ...fixture, nextCourse };
}

for (const href of [course, study]) {
  test(`final chapter verification skips a still-incomplete course on the ${href === study ? 'study page' : 'course home'} without syncing it`, async () => {
    let now = 10000;
    const fixture = queueEndFixture(href, () => href === study
      ? [catalogRow(39, 'pending'), catalogRow(40, 'done')]
      : [catalogRow(40, 'pending')], () => now);
    if (href === study) {
      await fixture.queue.tick();
      fixture.queue.noteStudyEnd(study);
      await new Promise(setImmediate);
    } else await fixture.queue.tick();
    assert.equal(fixture.queue.snapshot().items[0].status, 'active');
    assert.deepEqual(fixture.nav, []);
    now += 25000;
    const result = await fixture.queue.tick();
    assert.equal(result.items[0].status, 'skipped');
    assert.match(result.items[0].error, /仍有未完成任务/);
    assert.equal(result.syncPending, 0);
    assert.equal(result.verifyChapter, null);
    assert.equal(result.activeKey, '11_21');
    assert.deepEqual(fixture.nav, [fixture.nextCourse]);
  });
}

test('late platform confirmation during the retry window completes the course rather than skipping it', async () => {
  let now = 10000;
  let status = 'pending';
  const fixture = queueEndFixture(course, () => [catalogRow(40, status)], () => now);
  assert.equal((await fixture.queue.tick()).items[0].status, 'active');
  now += 8000;
  status = 'done';
  const result = await fixture.queue.tick();
  assert.equal(result.items[0].status, 'done');
  assert.equal(result.syncPending, 1);
  assert.deepEqual(fixture.nav, [fixture.nextCourse]);
});

test('a missing or unconfirmed chapter, or an unfinished non-final chapter, does not skip a course', async () => {
  for (const rows of [[catalogRow(39, 'done')], [catalogRow(40, 'unknown')], [catalogRow(40, 'pending'), catalogRow(41, 'pending')]]) {
    const fixture = queueEndFixture(course, () => rows, () => 10000);
    const result = await fixture.queue.tick();
    assert.equal(result.status, 'paused');
    assert.equal(result.items[0].status, 'active');
    assert.equal(result.syncPending, 0);
    assert.deepEqual(fixture.nav, []);
  }
});

test('a skipped last course ends the queue but remains incomplete', async () => {
  let now = 10000;
  const fixture = queueEndFixture(course, () => [catalogRow(40, 'pending')], () => now, { more: false });
  await fixture.queue.tick();
  now += 25000;
  const result = await fixture.queue.tick();
  assert.equal(result.status, 'done');
  assert.equal(result.items[0].status, 'skipped');
  assert.equal(result.syncPending, 0);
  assert.deepEqual(fixture.nav, []);
});
