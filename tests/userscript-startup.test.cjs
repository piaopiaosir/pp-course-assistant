const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { Script } = require('node:vm');

const source = readFileSync(join(__dirname, '../script.user.js'), 'utf8');
const userscript = new Script(source, {
  filename: 'script.user.js',
});
const chapterUserscript = new Script(source.replace(
  '})(Vue, Pinia, rxjs, md5, ElementPlus);',
  '  window.startChapterFixture = useCxChapterLogic;\n' +
  '  window.setChapterFixtureQueue = (queue) => { ppCxQueueInstance = queue; };\n' +
  '})(Vue, Pinia, rxjs, md5, ElementPlus);'
), { filename: 'script.user.js' });

function element(tagName) {
  return {
    tagName,
    children: [],
    style: {},
    appendChild(child) { this.children.push(child); child.parent = this; return child; },
    append(child) { this.appendChild(child); },
    remove() { this.parent.children = this.parent.children.filter(child => child !== this); },
    attachShadow() { return this.shadowRoot = element('#shadow'); },
    querySelector(selector) { return selector === '.main-page' ? this.children.find(child => child.mounted) : null; },
    querySelectorAll() { return []; },
  };
}

function start({ head = null, root = null, body = null, cookie = '', script = userscript, ...apis } = {}) {
  const document = Object.assign(new EventTarget(), {
    head, documentElement: root, body, cookie, readyState: 'loading',
    createElement: element,
    querySelectorAll: () => [],
    getElementById: id => [document.head, document.documentElement, document.body]
      .flatMap(parent => parent?.children || []).find(child => child.id === id),
  });
  let nextTimer = 0;
  const intervals = new Map();
  const timeouts = new Map();
  const schedule = map => (run, delay) => { map.set(++nextTimer, { run, delay }); return nextTimer; };
  const mounts = [];
  const identity = value => value;
  const sandbox = {
    document, URL, location: new URL('https://example.invalid/'),
    history: {},
    addEventListener() {},
    console: { log() {} },
    setInterval: schedule(intervals), clearInterval: id => intervals.delete(id),
    setTimeout: schedule(timeouts), clearTimeout: id => timeouts.delete(id),
    Vue: {
      reactive: identity, defineComponent: identity, shallowRef: value => ({ value }),
      createApp: component => ({
        use() {},
        mount(target) {
          component.setup(); // Initializes the real config store, without starting course activity.
          target.mounted = true;
          mounts.push(target);
        },
      }),
    },
    Pinia: { createPinia() {}, defineStore: (_, options) => options.state },
    rxjs: {}, md5() {}, ElementPlus: {},
    ...apis,
  };
  sandbox.window = sandbox.self = sandbox.top = sandbox;
  script.runInNewContext(sandbox);
  const startup = () => [...intervals.values()].find(timer => timer.delay === 100)?.run();
  return { document, mounts, startup, timeouts, intervals, sandbox };
}

async function chapterFixture() {
  const loc = new URL('https://mooc1.chaoxing.com/mycourse/studentstudy?mooc2=1');
  let complete;
  const logs = [];
  const { document, sandbox, timeouts, intervals } = start({
    script: chapterUserscript,
    root: element('html'), location: loc,
    Pinia: {
      createPinia() {},
      defineStore: (name, options) => name === 'logStore' ? () => ({ addLog: text => logs.push(text) }) : options.state,
    },
    rxjs: {
      of: (value) => ({ subscribe: (next) => next(value) }),
      from: (frames) => {
        assert.equal(frames.length, 0);
        return { pipe: () => ({ subscribe: (observer) => { complete = observer.complete; } }) };
      },
      concatMap() {},
    },
  });
  const card = { readyState: 'complete', querySelectorAll: () => [] };
  const frame = { src: 'fixture-card', contentDocument: card, addEventListener() {} };
  const controls = new Map();
  document.querySelector = (selector) => selector === 'iframe#iframe' ? frame : null;
  document.querySelectorAll = (selector) => controls.get(selector) || [];
  sandbox.startChapterFixture();
  const fireDelay = async (delay = 3000) => {
    const entry = [...timeouts].find(([, timer]) => timer.delay === delay);
    if (!entry) return false;
    timeouts.delete(entry[0]);
    entry[1].run();
    await new Promise(setImmediate);
    return true;
  };
  assert.equal(await fireDelay(), true);
  assert.equal(typeof complete, 'function');
  return {
    card, controls, complete, fireDelay, logs,
    moveToNextChapter: () => loc.searchParams.set('chapterId', '2'),
    setQueue: sandbox.setChapterFixtureQueue,
    checkPage: [...intervals.values()].find(timer => timer.run.name === 'checkUrlChange').run,
  };
}

function nextButton(click, textContent) {
  return { isConnected: true, style: {}, closest: () => null, click, textContent };
}

test('the chapter completion callback advances without a mounted queue panel', async () => {
  const fixture = await chapterFixture();
  let clicks = 0;
  fixture.controls.set('#prevNextFocusNext', [nextButton(() => { clicks++; fixture.moveToNextChapter(); })]);
  const finished = fixture.complete();
  assert.equal(await fixture.fireDelay(), true);
  await finished;
  assert.equal(clicks, 1);
});

for (const action of ['resume', 'clear']) {
  test(`chapter callback handles queue ${action} while confirmation is pending`, async () => {
    const fixture = await chapterFixture();
    let status = 'running';
    let clicks = 0;
    let confirms = 0;
    fixture.setQueue({
      blocksStudyAdvance: () => status === 'paused',
      ownsCurrentCourse: () => status === 'running',
      noteStudyEnd: assert.fail,
    });
    fixture.controls.set('#prevNextFocusNext', [nextButton(() => { clicks++; })]);
    const finished = fixture.complete();
    assert.equal(await fixture.fireDelay(), true);
    assert.equal(clicks, 1);
    fixture.controls.set('.jobFinishTip .nextChapter', [nextButton(() => { confirms++; }, '下一节')]);
    status = 'paused';
    assert.equal(await fixture.fireDelay(250), true);
    await finished;
    fixture.checkPage();
    assert.equal(await fixture.fireDelay(), false);
    assert.equal(confirms, 0);

    status = action === 'resume' ? 'running' : 'idle';
    fixture.checkPage();
    fixture.checkPage();
    assert.equal(await fixture.fireDelay(), action === 'resume');
    assert.equal(clicks, 1);
    assert.equal(confirms, action === 'resume' ? 1 : 0);
    assert.equal(fixture.logs.filter(text => text === '本页任务点已处理').length, 1);
  });
}

test('an unfinished task point stops the chapter jump and notifies the user once', async () => {
  const fixture = await chapterFixture();
  let clicks = 0;
  const unfinished = { getAttribute: name => name === 'aria-label' ? '任务点未完成' : null };
  fixture.card.querySelectorAll = selector => selector === '.ans-job-icon' ? [unfinished] : [];
  fixture.controls.set('#prevNextFocusNext', [nextButton(() => { clicks += 1; })]);
  const blocked = fixture.complete();
  assert.equal(await fixture.fireDelay(), true);
  assert.equal(await fixture.fireDelay(3000), true);
  await blocked;
  assert.equal(clicks, 0);
  assert.equal(fixture.logs.filter(text => text.includes('下一节任务点尚未解锁')).length, 1);

  fixture.card.querySelectorAll = () => [];
  fixture.controls.set('#prevNextFocusNext', [nextButton(() => { clicks += 1; fixture.moveToNextChapter(); })]);
  const resumed = fixture.complete();
  assert.equal(await fixture.fireDelay(), true);
  await resumed;
  assert.equal(clicks, 1);
});

test('a chapter jump that leaves the task unchanged notifies once and stops retrying', async () => {
  const fixture = await chapterFixture();
  let clicks = 0;
  fixture.controls.set('#prevNextFocusNext', [nextButton(() => { clicks += 1; })]);
  const finished = fixture.complete();
  assert.equal(await fixture.fireDelay(), true);
  while (await fixture.fireDelay(250)) {}
  for (let attempt = 0; attempt < 16; attempt += 1) {
    assert.equal(await fixture.fireDelay(500), true);
  }
  await finished;
  assert.equal(clicks, 1);
  assert.equal(fixture.logs.filter(text => text.includes('下一节任务点尚未解锁')).length, 1);

  await fixture.complete();
  assert.equal(clicks, 1);
});

function downloadCounterTimer(timeouts) {
  return [...timeouts.values()].find(timer => timer.run.name === 'ppRunRemoteScriptsPing');
}

test('startup waits for a body and mounts once without optional GM APIs', async () => {
  const { document, mounts, startup, timeouts } = start();
  await startup();
  assert.equal(mounts.length, 0);

  document.head = element('head');
  document.documentElement = element('html');
  document.readyState = 'interactive';
  document.dispatchEvent(new Event('DOMContentLoaded'));
  assert.ok(document.head.children.some(style => style.textContent.includes('.high-z-index-select')));
  await startup();
  assert.equal(mounts.length, 0);

  document.body = element('body');
  await startup();
  await startup();
  assert.equal(mounts.length, 1);
  assert.ok(document.getElementById('chaoxing-helper-root').shadowRoot.children
    .some(style => style.textContent?.includes('@keyframes ppFade')));
  assert.ok(![...timeouts.values()].some(timer => timer.delay === 500));
  assert.equal(downloadCounterTimer(timeouts), undefined);
});

test('throwing style and resource APIs do not block startup before head exists', async () => {
  const root = element('html');
  const { document, mounts, startup } = start({
    root,
    GM_info: {},
    GM_addStyle() { throw new Error('not supported'); },
    GM_getResourceText() { throw new Error('no resource'); },
  });
  assert.ok(root.children.some(style => style.textContent.includes('.high-z-index-select')));
  document.body = element('body');
  document.readyState = 'complete';
  await startup();
  assert.equal(mounts.length, 1);
});

test('signed-in startup uses the first remote response for both welfare and downloads', async () => {
  const requests = [];
  const styles = [];
  const writes = [];
  let issued = false;
  for (let page = 0; page < 2; page++) {
    const { document, mounts, startup, timeouts, sandbox } = start({
      head: element('head'), body: element('body'), cookie: 'UID=fixture; fid=school',
      GM_info: { script: { version: '4.4.5' } },
      GM_getValue: (_, fallback) => fallback,
      GM_setValue: key => writes.push(key),
      GM_addStyle: css => styles.push(css),
      GM_getResourceText: name => name === 'ElementPlusStyle' ? '.el-test{}' : '',
      GM_xmlhttpRequest({ url, onload }) {
        const request = new URL(url);
        requests.push(request);
        const data = {};
        if (request.pathname === '/remote-scripts') {
          data.welfare = { enabled: true };
          data.hasUpdate = !issued;
          data.patches = issued ? [] : [{ downloadUrl: 'https://example.invalid/patch' }];
          issued = true;
        }
        onload({ responseText: JSON.stringify({ code: 200, data }) });
      },
    });
    document.readyState = 'interactive';
    await startup();
    assert.equal(mounts.length, 1);
    assert.equal(sandbox.__PP_WELFARE__.enabled, true);
    downloadCounterTimer(timeouts)?.run();
  }
  assert.deepEqual(requests.filter(url => ['/remote-scripts', '/patch'].includes(url.pathname))
    .map(url => url.pathname + url.search), [
    '/remote-scripts?userId=fixture&fid=school', '/patch', '/remote-scripts?userId=fixture&fid=school',
  ]);
  assert.deepEqual(requests.slice(0, 6).map(url => url.pathname).sort(), [
    '/ai/models', '/patch', '/poll-interval', '/remote-scripts', '/script-description', '/sponsor-url',
  ]);
  assert.deepEqual(writes, ['globalConfig', 'globalConfig']);
  assert.ok(styles.includes('.el-test{}'));
});

test('startup without a UID pings and downloads only after mounting', async () => {
  const requests = [];
  const { document, mounts, startup, timeouts } = start({
    head: element('head'), body: element('body'),
    GM_xmlhttpRequest({ url, onload }) {
      const request = new URL(url);
      if (['/remote-scripts', '/patch'].includes(request.pathname)) {
        requests.push(request.pathname + request.search);
      }
      const data = request.pathname === '/remote-scripts'
        ? { hasUpdate: true, patches: [{ downloadUrl: 'https://example.invalid/patch' }] }
        : {};
      onload({ responseText: JSON.stringify({ code: 200, data }) });
    },
  });
  document.readyState = 'interactive';
  await startup();
  assert.equal(mounts.length, 1);
  assert.deepEqual(requests, []);
  downloadCounterTimer(timeouts).run();
  assert.deepEqual(requests, ['/remote-scripts', '/patch']);
});

test('a signed-in remote response arriving after the preload deadline still triggers its download', async () => {
  const requests = [];
  let reply;
  const { document, mounts, startup, timeouts } = start({
    head: element('head'), body: element('body'), cookie: 'UID=fixture',
    GM_xmlhttpRequest({ url, onload }) {
      const request = new URL(url);
      requests.push(request.pathname);
      if (request.pathname === '/remote-scripts') reply = onload;
      else onload({ responseText: '{}' });
    },
  });
  document.readyState = 'interactive';
  const preloading = startup();
  assert.equal(mounts.length, 0);
  [...timeouts.values()].find(timer => timer.delay === 5000).run();
  await preloading;
  assert.equal(mounts.length, 1);
  assert.equal(downloadCounterTimer(timeouts), undefined);

  reply({ responseText: JSON.stringify({ code: 200, data: {
    welfare: null, hasUpdate: true, patches: [{ downloadUrl: 'https://example.invalid/patch' }],
  } }) });
  await new Promise(setImmediate);
  assert.deepEqual(requests.filter(path => ['/remote-scripts', '/patch'].includes(path)), [
    '/remote-scripts', '/patch',
  ]);
});

test('the download counter deduplicates across page loads for one hour even if the request fails', async () => {
  const windowMs = 60 * 60 * 1000;
  const storage = new Map();
  let now = Date.UTC(2026, 0, 1);
  let pings = 0;
  class Clock extends Date { static now() { return now; } }
  const openPage = async () => {
    const { document, mounts, startup, timeouts } = start({
      head: element('head'), body: element('body'), Date: Clock,
      GM_getValue: (key, fallback) => storage.get(key) ?? fallback,
      GM_setValue: (key, value) => storage.set(key, value),
      GM_xmlhttpRequest({ url, onload }) {
        if (new URL(url).pathname === '/remote-scripts') {
          pings++;
          throw new Error('request unavailable');
        }
        onload({ responseText: '{}' });
      },
    });
    document.readyState = 'interactive';
    await startup();
    assert.equal(mounts.length, 1);
    assert.doesNotThrow(() => downloadCounterTimer(timeouts).run());
  };

  await openPage();
  assert.equal(pings, 1);
  assert.equal(storage.get('pp_remote_scripts_stamp'), now);
  now += windowMs - 1;
  await openPage();
  assert.equal(pings, 1);
  assert.equal(storage.get('pp_remote_scripts_stamp'), now - windowMs + 1);
  now++;
  await openPage();
  assert.equal(pings, 2);
  assert.equal(storage.get('pp_remote_scripts_stamp'), now);
});

test('mount resumes after a stalled preload even if the body is replaced', async () => {
  const { document, mounts, startup, timeouts } = start({
    head: element('head'), body: element('body'), GM_xmlhttpRequest() {},
  });
  document.readyState = 'interactive';
  const preloading = startup();
  await startup();
  assert.equal(mounts.length, 0);
  assert.equal(downloadCounterTimer(timeouts), undefined);
  document.body = null;
  const deadlines = [...timeouts.values()].filter(timer => timer.delay === 5000);
  assert.equal(deadlines.length, 1);
  deadlines[0].run();
  await preloading;
  assert.equal(mounts.length, 0);
  assert.equal(downloadCounterTimer(timeouts), undefined);
  document.body = element('body');
  await startup();
  await startup();
  assert.equal(mounts.length, 1);
  assert.ok(downloadCounterTimer(timeouts));
});
