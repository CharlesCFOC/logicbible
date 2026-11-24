import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function readerHarness(savedVersion = 'remote-french') {
  const local = { id: 'local-kjv', abbreviation: 'KJV', language: 'eng', source: 'local' };
  const remote = { id: 'remote-french', abbreviation: 'LSG', name: 'Louis Segond', language: 'fra', source: 'remote' };
  const values = { 'brother.version': savedVersion };
  const context = vm.createContext({
    readerState: { versionId: savedVersion, bookId: 'JHN', chapter: 1, versions: [local], parallelVersionIds: [], parallelEnabled: false },
    pendingPreferredBibleVersion: savedVersion === local.id ? null : savedVersion,
    LOCAL_VERSIONS: [local], popularVersionOrder: ['KJV'], versionSelect: {},
    multiSelectedVerseData: [], chapterRequestId: 0, bibleChapterLoading: false, bibleChapterError: '', currentChapterData: null, currentParallelChapterData: [],
    remoteBibleVersions: [], apiUrl: value => value, fetch: async () => ({ ok: true, json: async () => ({ data: [remote] }) }),
    setLocalValue: (key, value) => { values[key] = value; }, writeJson() {}, updateHomeContinueReading() {},
    renderLoading() {}, renderChapter() {}, renderReaderError() {}, exitMultiSelectMode() {},
    escapeAttr: value => value, escapeHtml: value => value,
  });
  vm.runInContext(readFileSync(new URL('../scripts/features/reader.js', import.meta.url), 'utf8'), context);
  vm.runInContext('renderParallelOptions = () => {}; emitBibleReaderChange = () => {}; emitBibleChapterChange = () => {}; renderLoading = () => {}; renderChapter = () => {}; fetchChapter = async () => ({ verses: [] });', context);
  return { context, values };
}

test('a remote Bible version survives the temporary local fallback and is restored', async () => {
  const { context, values } = readerHarness();
  context.renderVersionOptions();
  assert.equal(context.readerState.versionId, 'local-kjv');
  await context.loadChapter();
  assert.equal(values['brother.version'], 'remote-french');
  await context.loadRemoteVersions();
  assert.equal(context.readerState.versionId, 'remote-french');
  assert.equal(values['brother.version'], 'remote-french');
});

test('a new user selection takes precedence over a pending saved version', async () => {
  const { context, values } = readerHarness();
  context.renderVersionOptions();
  context.pendingPreferredBibleVersion = null;
  context.readerState.versionId = 'local-kjv';
  await context.loadChapter();
  await context.loadRemoteVersions();
  assert.equal(context.readerState.versionId, 'local-kjv');
  assert.equal(values['brother.version'], 'local-kjv');
});

test('a temporary failure to fetch versions does not erase the saved choice', async () => {
  const { context, values } = readerHarness();
  context.fetch = async () => { throw new Error('offline'); };
  context.renderVersionOptions();
  await context.loadChapter();
  await context.loadRemoteVersions();
  assert.equal(values['brother.version'], 'remote-french');
  assert.equal(context.pendingPreferredBibleVersion, 'remote-french');
});
