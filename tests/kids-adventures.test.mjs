import test from "node:test";
import fs from "node:fs";
import { genesisCollections } from "../src/react/kids-genesis-data.js";
import assert from "node:assert/strict";
import { kidsAdventures, kidsBooks, newAdventureProgress, readAdventureProgress, saveAdventureProgress } from "../src/react/kids-adventures-data.js";

const memory = () => {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
};

test("malformed saved progress cannot break the adventure screen", () => {
  const storage = memory();
  for (const value of ["{broken", "null", '{"version":1,"stage":99}']) {
    storage.setItem("brother.kidsAdventure.v1.storm", value);
    assert.deepEqual(readAdventureProgress("storm", storage), newAdventureProgress());
  }
  storage.setItem("brother.kidsAdventure.v1.storm", JSON.stringify({ version: 1, stage: 2, question: -1, answers: { 0: 0, 1: 9, invalid: 2 }, order: [2, 2, 1, -1] }));
  const restored = readAdventureProgress("storm", storage);
  assert.equal(restored.question, 0);assert.deepEqual(restored.answers, { 0: 0 });assert.deepEqual(restored.order, [2, 1]);
});

test("both adventures keep independent progress and a resume pointer", () => {
  const storage = memory();
  saveAdventureProgress("storm", { ...newAdventureProgress(), stage: 1, scene: 2 }, storage);
  saveAdventureProgress("seeds", { ...newAdventureProgress(), stage: 2, question: 1 }, storage);
  assert.equal(readAdventureProgress("storm", storage).scene, 2);
  assert.equal(readAdventureProgress("seeds", storage).question, 1);
  assert.equal(storage.getItem("brother.kidsAdventure.last"), "seeds");
});

test("earned badges survive replay and unavailable storage does not block reading", () => {
  const storage = memory();
  saveAdventureProgress("storm", { ...newAdventureProgress(), completed: true }, storage);
  assert.equal(readAdventureProgress("storm", storage).completed, true);
  const denied = { getItem() { throw new Error("Unavailable"); }, setItem() { throw new Error("Unavailable"); } };
  assert.deepEqual(readAdventureProgress("storm", denied), newAdventureProgress());
  assert.doesNotThrow(() => saveAdventureProgress("storm", newAdventureProgress(), denied));
});

test("each story has 3–4 scenes, three unambiguous questions and a three-event ordering game", () => {
  for (const a of kidsAdventures) {
    assert.ok([3, 4].includes(a.scenes.length), a.id);assert.equal(a.questions.length, 3);assert.equal(a.order.length, 3);
    for (const q of a.questions) {
      assert.equal(q.choices.length, 3);assert.equal(new Set(q.choices.map(c => c[1])).size, 3);
      assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 3);
    }
  }
});

test("book navigation includes 65 Genesis stories and preserves all existing progress IDs", () => {
  assert.equal(new Set(kidsAdventures.map(a => a.id)).size, kidsAdventures.length);
  assert.equal(kidsAdventures.filter(a => a.bookId === "genesis").length, 65);
  assert.deepEqual(kidsAdventures.filter(a => a.bookId === "mark").map(a => a.id), ["storm", "seeds"]);
  for (const a of kidsAdventures) assert.ok(kidsBooks.some(b => b.id === a.bookId));
});


test("a fourth scene survives reload while invalid scene indexes are rejected", () => {
  const storage = memory();
  const four = kidsAdventures.find(a => a.scenes.length === 4);
  saveAdventureProgress(four.id, { ...newAdventureProgress(), stage: 1, scene: 3 }, storage);
  assert.equal(readAdventureProgress(four.id, storage).scene, 3);
  saveAdventureProgress("storm", { ...newAdventureProgress(), stage: 1, scene: 3 }, storage);
  assert.equal(readAdventureProgress("storm", storage).scene, 0);
  saveAdventureProgress(four.id, { ...newAdventureProgress(), stage: 1, scene: 4 }, storage);
  assert.equal(readAdventureProgress(four.id, storage).scene, 0);
});

test("all five collections are populated with complete, distinct episodes and shipped artwork", () => {
  const genesis = kidsAdventures.filter(a => a.bookId === "genesis");
  assert.equal(new Set(genesis.map(a => a.title)).size, 65);
  assert.deepEqual(genesisCollections.map(group => genesis.filter(a => a.collection === group.id).length), [12, 17, 7, 11, 18]);
  assert.ok(genesis.some(a => a.scenes.length === 3));
  assert.ok(genesis.some(a => a.scenes.length === 4));
  for (const a of genesis) {
    for (const key of ["title", "subtitle", "intro", "reference", "theme", "badge", "takeaway", "mission", "prayer"]) {
      assert.ok(typeof a[key] === "string" && a[key].length > 0, `${a.id}: missing ${key}`);
    }
    assert.ok(a.reference.startsWith("Genesis "), a.id);
    assert.ok(fs.existsSync(new URL(`../${a.image}`, import.meta.url)), a.image);
    for (const scene of a.scenes) assert.ok(scene.title && scene.text.length >= 100, a.id);
    assert.equal(new Set(a.order.map(event => event[1])).size, 3);
    assert.ok(a.questions.every(q => q.explanation.length > 15), a.id);
  }
  for (const id of ["genesis-creation", "genesis-noah", "genesis-abraham", "genesis-joseph"]) {
    assert.ok(genesis.some(a => a.id === id), `${id}: old badge and progress ID must remain valid`);
  }
});


test("expanded legacy episodes retain completion but reset answers from the old overview", () => {
  const storage = memory();
  storage.setItem("brother.kidsAdventure.v1.genesis-noah", JSON.stringify({ ...newAdventureProgress(), stage: 5, completed: true, answers: {0: 1, 1: 2, 2: 0} }));
  assert.deepEqual(readAdventureProgress("genesis-noah", storage), {...newAdventureProgress(), completed: true});
  saveAdventureProgress("genesis-noah", {...newAdventureProgress(), stage: 2, answers: {0: 1}}, storage);
  assert.equal(readAdventureProgress("genesis-noah", storage).stage, 2);
  assert.deepEqual(readAdventureProgress("genesis-noah", storage).answers, {0: 1});
});
