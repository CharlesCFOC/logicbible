import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const source = await fs.readFile(new URL("../src/react/mobile-updates.js", import.meta.url), "utf8");
const id = "a".repeat(64);
const latest = { nativeVersion: "1.1", bundleId: id, checksum: "b".repeat(64), url: `/mobile-updates/${id}.zip` };

async function run({ manifest = latest, offline = false, blocked = [], current = null, platform = "android" } = {}) {
  const calls = [];
  const updater = {
    ready: async () => { calls.push("ready"); },
    getVersionName: async () => ({ versionName: "1.1" }),
    getCurrentBundle: async () => ({ bundleId: current }),
    getBlockedBundles: async () => ({ bundleIds: blocked }),
    getDownloadedBundles: async () => ({ bundleIds: [] }),
    downloadBundle: async options => { calls.push(["download", options]); },
    setNextBundle: async options => { calls.push(["next", options]); },
  };
  const context = vm.createContext({
    URL, AbortSignal, console: { warn() {} },
    document: { addEventListener() {} },
    fetch: async url => {
      calls.push(["fetch", url]);
      if (offline) throw new Error("Offline");
      return { ok: true, json: async () => url === "mobile-version.json" ? { bundleId: "c".repeat(64) } : manifest };
    },
  });
  const mod = new vm.SourceTextModule(source, { context });
  await mod.link(specifier => {
    const exports = specifier.includes("capacitor/core") ? { Capacitor: { getPlatform: () => platform } }
      : specifier.includes("capacitor-live-update") ? { LiveUpdate: updater }
        : { default: { origin: "https://logicbible.vercel.app", nativeVersion: "1.1" } };
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
  });
  await mod.evaluate();
  await mod.namespace.startMobileUpdates();
  await new Promise(resolve => setImmediate(resolve));
  return structuredClone(calls);
}

test("confirms startup before downloading and queues a verified update without reloading", async () => {
  const calls = await run();
  assert.equal(calls[0], "ready");
  assert.deepEqual(calls.find(c => c[0] === "download")[1], {
    bundleId: id, url: `https://logicbible.vercel.app/mobile-updates/${id}.zip`, checksum: latest.checksum,
  });
  assert.deepEqual(calls.at(-1), ["next", { bundleId: id }]);
});

test("offline startup still confirms the installed bundle", async () => {
  const calls = await run({ offline: true });
  assert.equal(calls[0], "ready");
  assert.equal(calls.some(c => c[0] === "next"), false);
});

test("rejects incompatible native versions, external downloads, and invalid checksums", async () => {
  for (const change of [{ nativeVersion: "2.0" }, { url: `https://example.com/${id}.zip` }, { checksum: "bad" }]) {
    const calls = await run({ manifest: { ...latest, ...change } });
    assert.equal(calls.some(c => c[0] === "download"), false);
  }
});

test("does not reinstall the current bundle or a rolled back bundle", async () => {
  for (const options of [{ current: id }, { blocked: [id] }]) {
    const calls = await run(options);
    assert.equal(calls.some(c => c[0] === "download"), false);
  }
});

test("web browser does not invoke native update APIs", async () => {
  assert.deepEqual(await run({ platform: "web" }), []);
});
